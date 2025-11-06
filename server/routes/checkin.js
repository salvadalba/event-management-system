const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get event check-ins
router.get('/events/:eventId', authenticate, authorize('event_manager', 'super_admin', 'checkin_staff'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const { eventId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Check if user has access to this event
    if (req.user.role !== 'super_admin' && req.user.role !== 'checkin_staff') {
      const eventResult = await pool.query(
        'SELECT organizer_id FROM events WHERE id = $1',
        [eventId]
      );

      if (eventResult.rows.length === 0 || eventResult.rows[0].organizer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    // Get check-ins with registration info
    const checkinsResult = await pool.query(`
      SELECT c.*, r.first_name, r.last_name, r.email, r.ticket_id,
             t.name as ticket_name, t.type as ticket_type
      FROM checkins c
      JOIN registrations r ON c.registration_id = r.id
      LEFT JOIN tickets t ON r.ticket_id = t.id
      WHERE c.event_id = $1
      ORDER BY c.checkin_time DESC
      LIMIT $2 OFFSET $3
    `, [eventId, limit, offset]);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM checkins WHERE event_id = $1',
      [eventId]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        checkins: checkinsResult.rows.map(checkin => ({
          id: checkin.id,
          registration: {
            id: checkin.registration_id,
            firstName: checkin.first_name,
            lastName: checkin.last_name,
            email: checkin.email
          },
          ticket: {
            id: checkin.ticket_id,
            name: checkin.ticket_name,
            type: checkin.ticket_type
          },
          checkedInBy: checkin.checked_in_by,
          checkinTime: checkin.checkin_time,
          checkinMethod: checkin.checkin_method,
          deviceId: checkin.device_id,
          location: checkin.location,
          notes: checkin.notes,
          badgePrinted: checkin.badge_printed,
          badgePrintedAt: checkin.badge_printed_at
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
    console.error('Get check-ins error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// QR code scan for check-in
router.post('/scan', authenticate, authorize('event_manager', 'super_admin', 'checkin_staff'), [
  body('registrationCode').notEmpty(),
  body('eventId').isUUID(),
  body('deviceId').optional().trim(),
  body('location').optional().trim(),
  body('notes').optional().trim()
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

    const { registrationCode, eventId, deviceId, location, notes } = req.body;

    // Check if user has access to this event
    if (req.user.role !== 'super_admin' && req.user.role !== 'checkin_staff') {
      const eventResult = await pool.query(
        'SELECT organizer_id FROM events WHERE id = $1',
        [eventId]
      );

      if (eventResult.rows.length === 0 || eventResult.rows[0].organizer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    // Find registration by code
    const registrationResult = await pool.query(
      'SELECT * FROM registrations WHERE registration_code = $1 AND event_id = $2 AND status IN (\'confirmed\', \'paid\')',
      [registrationCode, eventId]
    );

    if (registrationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found or not confirmed'
      });
    }

    const registration = registrationResult.rows[0];

    // Check if already checked in
    const existingCheckinResult = await pool.query(
      'SELECT id FROM checkins WHERE registration_id = $1',
      [registration.id]
    );

    if (existingCheckinResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Attendee already checked in'
      });
    }

    // Create check-in record
    const checkinId = uuidv4();
    await pool.query(`
      INSERT INTO checkins (
        id, registration_id, event_id, checked_in_by, checkin_method,
        device_id, location, notes
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8
      )
    `, [
      checkinId, registration.id, eventId, req.user.id, 'qr_code',
      deviceId, location, notes
    ]);

    // Update registration status
    await pool.query(
      'UPDATE registrations SET status = \'checked_in\', checked_in_at = CURRENT_TIMESTAMP, checked_in_by = $1 WHERE id = $2',
      [req.user.id, registration.id]
    );

    res.json({
      success: true,
      message: 'Check-in successful',
      data: {
        registration: {
          id: registration.id,
          firstName: registration.first_name,
          lastName: registration.last_name,
          email: registration.email,
          ticketType: registration.ticket_id
        },
        checkinTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('QR scan check-in error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during check-in'
    });
  }
});

// Manual check-in
router.post('/manual', authenticate, authorize('event_manager', 'super_admin', 'checkin_staff'), [
  body('eventId').isUUID(),
  body('email').isEmail().normalizeEmail(),
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('deviceId').optional().trim(),
  body('location').optional().trim(),
  body('notes').optional().trim()
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

    const { eventId, email, firstName, lastName, deviceId, location, notes } = req.body;

    // Check if user has access to this event
    if (req.user.role !== 'super_admin' && req.user.role !== 'checkin_staff') {
      const eventResult = await pool.query(
        'SELECT organizer_id FROM events WHERE id = $1',
        [eventId]
      );

      if (eventResult.rows.length === 0 || eventResult.rows[0].organizer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    // Find registration by email (and optional name)
    let whereClause = 'WHERE event_id = $1 AND email = $2 AND status IN (\'confirmed\', \'paid\')';
    const params = [eventId, email];
    let paramIndex = 3;

    if (firstName) {
      whereClause += ` AND first_name = $${paramIndex++}`;
      params.push(firstName);
    }

    if (lastName) {
      whereClause += ` AND last_name = $${paramIndex++}`;
      params.push(lastName);
    }

    const registrationResult = await pool.query(
      `SELECT * FROM registrations ${whereClause}`,
      params
    );

    if (registrationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found or not confirmed'
      });
    }

    // If multiple registrations found, return them for selection
    if (registrationResult.rows.length > 1) {
      return res.json({
        success: true,
        message: 'Multiple registrations found',
        data: {
          registrations: registrationResult.rows.map(reg => ({
            id: reg.id,
            firstName: reg.first_name,
            lastName: reg.last_name,
            email: reg.email,
            registrationCode: reg.registration_code
          }))
        }
      });
    }

    const registration = registrationResult.rows[0];

    // Check if already checked in
    const existingCheckinResult = await pool.query(
      'SELECT id FROM checkins WHERE registration_id = $1',
      [registration.id]
    );

    if (existingCheckinResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Attendee already checked in'
      });
    }

    // Create check-in record
    const checkinId = uuidv4();
    await pool.query(`
      INSERT INTO checkins (
        id, registration_id, event_id, checked_in_by, checkin_method,
        device_id, location, notes
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8
      )
    `, [
      checkinId, registration.id, eventId, req.user.id, 'manual',
      deviceId, location, notes
    ]);

    // Update registration status
    await pool.query(
      'UPDATE registrations SET status = \'checked_in\', checked_in_at = CURRENT_TIMESTAMP, checked_in_by = $1 WHERE id = $2',
      [req.user.id, registration.id]
    );

    res.json({
      success: true,
      message: 'Manual check-in successful',
      data: {
        registration: {
          id: registration.id,
          firstName: registration.first_name,
          lastName: registration.last_name,
          email: registration.email,
          registrationCode: registration.registration_code
        },
        checkinTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Manual check-in error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during manual check-in'
    });
  }
});

// Get check-in statistics for an event
router.get('/stats/:eventId', authenticate, authorize('event_manager', 'super_admin', 'checkin_staff'), async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user has access to this event
    if (req.user.role !== 'super_admin' && req.user.role !== 'checkin_staff') {
      const eventResult = await pool.query(
        'SELECT organizer_id FROM events WHERE id = $1',
        [eventId]
      );

      if (eventResult.rows.length === 0 || eventResult.rows[0].organizer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    // Get total registrations
    const totalResult = await pool.query(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = $1 AND status != \'cancelled\'',
      [eventId]
    );

    // Get checked-in count
    const checkedInResult = await pool.query(
      'SELECT COUNT(*) as count FROM checkins WHERE event_id = $1',
      [eventId]
    );

    // Get check-ins by time period
    const timeSeriesResult = await pool.query(`
      SELECT
        DATE_TRUNC(\'hour\', checkin_time) as hour,
        COUNT(*) as checkins
      FROM checkins
      WHERE event_id = $1 AND checkin_time >= CURRENT_DATE
      GROUP BY DATE_TRUNC(\'hour\', checkin_time)
      ORDER BY hour
    `, [eventId]);

    // Get check-ins by ticket type
    const ticketTypeResult = await pool.query(`
      SELECT
        t.type,
        COUNT(*) as checkins
      FROM checkins c
      JOIN registrations r ON c.registration_id = r.id
      LEFT JOIN tickets t ON r.ticket_id = t.id
      WHERE c.event_id = $1
      GROUP BY t.type
      ORDER BY checkins DESC
    `, [eventId]);

    const totalRegistrations = parseInt(totalResult.rows[0].count);
    const totalCheckins = parseInt(checkedInResult.rows[0].count);
    const attendanceRate = totalRegistrations > 0 ? (totalCheckins / totalRegistrations * 100) : 0;

    res.json({
      success: true,
      data: {
        totalRegistrations,
        totalCheckins,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        timeSeries: timeSeriesResult.rows.map(row => ({
          hour: row.hour,
          checkins: parseInt(row.checkins)
        })),
        ticketTypes: ticketTypeResult.rows.map(row => ({
          type: row.type || 'Unknown',
          checkins: parseInt(row.checkins)
        }))
      }
    });
  } catch (error) {
    console.error('Get check-in stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Print badge
router.post('/print-badge/:checkinId', authenticate, authorize('event_manager', 'super_admin', 'checkin_staff'), async (req, res) => {
  try {
    const { checkinId } = req.params;

    // Check if user has access
    const checkinResult = await pool.query(`
      SELECT c.*, e.organizer_id
      FROM checkins c
      JOIN events e ON c.event_id = e.id
      WHERE c.id = $1
    `, [checkinId]);

    if (checkinResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Check-in not found'
      });
    }

    const checkin = checkinResult.rows[0];

    if (req.user.role !== 'super_admin' && req.user.role !== 'checkin_staff' && checkin.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update badge printed status
    await pool.query(
      'UPDATE checkins SET badge_printed = true, badge_printed_at = CURRENT_TIMESTAMP WHERE id = $1',
      [checkinId]
    );

    // TODO: Generate and print badge PDF

    res.json({
      success: true,
      message: 'Badge printed successfully'
    });
  } catch (error) {
    console.error('Print badge error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error printing badge'
    });
  }
});

module.exports = router;