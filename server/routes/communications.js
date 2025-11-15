const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const sanitize = require('../utils/sanitize');
const { authenticate, authorize, checkEventOwnership } = require('../middleware/auth');

const router = express.Router();

// Get communications
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('eventId').optional().isUUID(),
  query('status').optional().isIn(['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { eventId, status, search } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filter by user's events if not super admin
    if (req.user.role !== 'super_admin') {
      whereClause += ` AND (c.event_id IS NULL OR e.organizer_id = $${paramIndex++})`;
      params.push(req.user.id);
    }

    if (eventId) {
      whereClause += ` AND c.event_id = $${paramIndex++}`;
      params.push(eventId);
    }

    if (status) {
      whereClause += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }

    if (search) {
      whereClause += ` AND (c.subject ILIKE $${paramIndex++} OR c.content ILIKE $${paramIndex++})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM communications c
       LEFT JOIN events e ON c.event_id = e.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get communications with sender info
    const communicationsResult = await pool.query(`
      SELECT c.*, u.first_name as sender_first_name, u.last_name as sender_last_name,
             e.title as event_title
      FROM communications c
      LEFT JOIN users u ON c.sender_id = u.id
      LEFT JOIN events e ON c.event_id = e.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: {
        communications: communicationsResult.rows.map(comm => ({
          id: comm.id,
          event: comm.event_id ? {
            id: comm.event_id,
            title: comm.event_title
          } : null,
          sender: {
            id: comm.sender_id,
            firstName: comm.sender_first_name,
            lastName: comm.sender_last_name
          },
          recipientType: comm.recipient_type,
          subject: comm.subject,
          status: comm.status,
          scheduledAt: comm.scheduled_at,
          sentAt: comm.sent_at,
          recipientCount: comm.recipient_count,
          sentCount: comm.sent_count,
          openCount: comm.open_count,
          clickCount: comm.click_count,
          campaignName: comm.campaign_name,
          tags: comm.tags,
          createdAt: comm.created_at
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get communications error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Create communication
router.post('/', authenticate, authorize('event_manager', 'super_admin'), [
  body('eventId').optional().isUUID(),
  body('recipientType').isIn(['all', 'ticket_type', 'specific', 'waitlist']),
  body('ticketTypeId').optional().isUUID(),
  body('subject').notEmpty().trim(),
  body('content').notEmpty(),
  body('scheduledAt').optional().isISO8601(),
  body('campaignName').optional().trim(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      eventId, recipientType, ticketTypeId, subject, content,
      scheduledAt, campaignName, tags
    } = req.body;

    const safeSubject = sanitize(subject);
    const safeContent = sanitize(content);

    // Check event ownership if eventId is provided
    if (eventId) {
      const eventResult = await pool.query(
        'SELECT organizer_id FROM events WHERE id = $1',
        [eventId]
      );

      if (eventResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      if (req.user.role !== 'super_admin' && eventResult.rows[0].organizer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Check ticket type if specified
      if (recipientType === 'ticket_type' && !ticketTypeId) {
        return res.status(400).json({
          success: false,
          error: 'Ticket type ID is required when recipient type is ticket_type'
        });
      }

      if (ticketTypeId) {
        const ticketResult = await pool.query(
          'SELECT id FROM tickets WHERE id = $1 AND event_id = $2',
          [ticketTypeId, eventId]
        );

        if (ticketResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Ticket type not found'
          });
        }
      }
    }

    // Calculate recipient count
    let recipientCount = 0;
    let recipientQuery = '';

    switch (recipientType) {
      case 'all':
        if (eventId) {
          recipientQuery = 'SELECT COUNT(*) FROM registrations WHERE event_id = $1 AND status != \'cancelled\'';
          const countResult = await pool.query(recipientQuery, [eventId]);
          recipientCount = parseInt(countResult.rows[0].count);
        }
        break;
      case 'ticket_type':
        recipientQuery = 'SELECT COUNT(*) FROM registrations WHERE ticket_id = $1 AND status != \'cancelled\'';
        const ticketCountResult = await pool.query(recipientQuery, [ticketTypeId]);
        recipientCount = parseInt(ticketCountResult.rows[0].count);
        break;
      case 'waitlist':
        if (eventId) {
          recipientQuery = 'SELECT COUNT(*) FROM registrations WHERE event_id = $1 AND status = \'waitlisted\'';
          const waitlistResult = await pool.query(recipientQuery, [eventId]);
          recipientCount = parseInt(waitlistResult.rows[0].count);
        }
        break;
    }

    const communicationId = uuidv4();
    const status = scheduledAt ? 'scheduled' : 'draft';

    const result = await pool.query(`
      INSERT INTO communications (
        id, event_id, sender_id, recipient_type, ticket_type_id,
        subject, content, scheduled_at, status, recipient_count,
        campaign_name, tags
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12
      )
      RETURNING *
    `, [
      communicationId, eventId, req.user.id, recipientType, ticketTypeId,
      safeSubject, safeContent, scheduledAt, status, recipientCount,
      campaignName, tags
    ]);

    const communication = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Communication created successfully',
      data: {
        id: communication.id,
        eventId: communication.event_id,
        recipientType: communication.recipient_type,
        subject: communication.subject,
        status: communication.status,
        recipientCount: communication.recipient_count,
        scheduledAt: communication.scheduled_at,
        campaignName: communication.campaign_name,
        createdAt: communication.created_at
      }
    });
  } catch (error) {
    console.error('Create communication error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error creating communication'
    });
  }
});

// Send communication
router.post('/:id/send', authenticate, authorize('event_manager', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get communication details
    const commResult = await pool.query(`
      SELECT c.*, e.organizer_id
      FROM communications c
      LEFT JOIN events e ON c.event_id = e.id
      WHERE c.id = $1
    `, [id]);

    if (commResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Communication not found'
      });
    }

    const communication = commResult.rows[0];

    // Check permissions
    if (req.user.role !== 'super_admin' && communication.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (communication.status === 'sent' || communication.status === 'sending') {
      return res.status(400).json({
        success: false,
        error: 'Communication already sent or in progress'
      });
    }

    // Update status to sending
    await pool.query(
      'UPDATE communications SET status = \'sending\', sent_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    const nodemailer = require('nodemailer')
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    let recipientsQuery = ''
    let recipientsParams = []

    switch (communication.recipient_type) {
      case 'all':
        recipientsQuery = `SELECT email, first_name, last_name FROM registrations WHERE event_id = $1 AND status != 'cancelled'`
        recipientsParams = [communication.event_id]
        break
      case 'ticket_type':
        recipientsQuery = `SELECT email, first_name, last_name FROM registrations WHERE ticket_id = $1 AND status != 'cancelled'`
        recipientsParams = [communication.ticket_type_id]
        break
      case 'waitlist':
        recipientsQuery = `SELECT email, first_name, last_name FROM registrations WHERE event_id = $1 AND status = 'waitlisted'`
        recipientsParams = [communication.event_id]
        break
      default:
        recipientsQuery = `SELECT email, first_name, last_name FROM registrations WHERE event_id = $1 AND status != 'cancelled'`
        recipientsParams = [communication.event_id]
        break
    }

    const recRes = await pool.query(recipientsQuery, recipientsParams)
    let sentCount = 0

    for (const r of recRes.rows) {
      try {
        await transporter.sendMail({
          from: `${process.env.FROM_NAME || 'Event Management System'} <${process.env.FROM_EMAIL}>`,
          to: r.email,
          subject: communication.subject,
          html: communication.content
        })
        sentCount++
        const regIdRes = await pool.query(
          'SELECT id FROM registrations WHERE email = $1 AND ($2::uuid IS NULL OR event_id = $2) LIMIT 1',
          [r.email, communication.event_id || null]
        )
        const regId = regIdRes.rows[0]?.id || null
        await pool.query(
          `INSERT INTO communication_logs (communication_id, registration_id, recipient_email, recipient_name, status, sent_at)
           VALUES ($1, $2, $3, $4, 'sent', CURRENT_TIMESTAMP)`,
          [id, regId, r.email, `${r.first_name || ''} ${r.last_name || ''}`.trim() || null]
        )
      } catch (_) {}
    }

    await pool.query(
      'UPDATE communications SET status = $1, sent_count = $2, sent_at = CURRENT_TIMESTAMP WHERE id = $3',
      ['sent', sentCount, id]
    )

    res.json({
      success: true,
      message: 'Communication sent successfully',
      data: {
        id: communication.id,
        sentCount: communication.recipient_count
      }
    });
  } catch (error) {
    console.error('Send communication error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error sending communication'
    });
  }
});

// Get communication logs
router.get('/:id/logs', authenticate, authorize('event_manager', 'super_admin'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'failed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const { status } = req.query;

    // Check communication ownership
    const commResult = await pool.query(`
      SELECT c.*, e.organizer_id
      FROM communications c
      LEFT JOIN events e ON c.event_id = e.id
      WHERE c.id = $1
    `, [id]);

    if (commResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Communication not found'
      });
    }

    const communication = commResult.rows[0];

    // Check permissions
    if (req.user.role !== 'super_admin' && communication.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    let whereClause = 'WHERE communication_id = $1';
    const params = [id];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    // Get logs
    const logsResult = await pool.query(`
      SELECT *
      FROM communication_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, limit, offset]);

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM communication_logs ${whereClause}`,
      params.slice(0, -2) // Remove limit and offset params
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        logs: logsResult.rows.map(log => ({
          id: log.id,
          registrationId: log.registration_id,
          recipientEmail: log.recipient_email,
          recipientName: log.recipient_name,
          status: log.status,
          sentAt: log.sent_at,
          deliveredAt: log.delivered_at,
          openedAt: log.opened_at,
          clickedAt: log.clicked_at,
          bouncedAt: log.bounced_at,
          errorMessage: log.error_message,
          trackingId: log.tracking_id,
          createdAt: log.created_at
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get communication logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
