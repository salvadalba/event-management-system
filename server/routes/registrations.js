const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authenticate, authorize, checkEventOwnership } = require('../middleware/auth');

const router = express.Router();

// Get registrations (with filtering)
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('eventId').optional().isUUID(),
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'waitlisted', 'checked_in']),
  query('paymentStatus').optional().isIn(['pending', 'paid', 'refunded', 'failed'])
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
    const { eventId, status, paymentStatus, search } = req.query;

    let whereClause = 'WHERE r.status != \'cancelled\'';
    const params = [];
    let paramIndex = 1;

    // Filter by user's events if not super admin
    if (req.user.role !== 'super_admin') {
      whereClause += ` AND e.organizer_id = $${paramIndex++}`;
      params.push(req.user.id);
    }

    if (eventId) {
      whereClause += ` AND r.event_id = $${paramIndex++}`;
      params.push(eventId);
    }

    if (status) {
      whereClause += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }

    if (paymentStatus) {
      whereClause += ` AND r.payment_status = $${paramIndex++}`;
      params.push(paymentStatus);
    }

    if (search) {
      whereClause += ` AND (r.first_name ILIKE $${paramIndex++} OR r.last_name ILIKE $${paramIndex++} OR r.email ILIKE $${paramIndex++})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM registrations r
       JOIN events e ON r.event_id = e.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get registrations with event and ticket info
    const registrationsResult = await pool.query(`
      SELECT r.*, e.title as event_title, e.start_date as event_start_date,
             t.name as ticket_name, t.type as ticket_type, t.price as ticket_price
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN tickets t ON r.ticket_id = t.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: {
        registrations: registrationsResult.rows.map(reg => ({
          id: reg.id,
          event: {
            id: reg.event_id,
            title: reg.event_title,
            startDate: reg.event_start_date
          },
          ticket: {
            id: reg.ticket_id,
            name: reg.ticket_name,
            type: reg.ticket_type,
            price: parseFloat(reg.ticket_price)
          },
          attendee: {
            firstName: reg.first_name,
            lastName: reg.last_name,
            email: reg.email,
            phone: reg.phone,
            company: reg.company,
            jobTitle: reg.job_title
          },
          quantity: reg.quantity,
          totalAmount: parseFloat(reg.total_amount),
          currency: reg.currency,
          status: reg.status,
          paymentStatus: reg.payment_status,
          registrationCode: reg.registration_code,
          checkedInAt: reg.checked_in_at,
          customFieldValues: reg.custom_field_values,
          createdAt: reg.created_at
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
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Register for an event
router.post('/', [
  body('eventId').isUUID(),
  body('ticketId').isUUID(),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('quantity').isInt({ min: 1, max: 10 }),
  body('phone').optional().isMobilePhone(),
  body('company').optional().trim(),
  body('jobTitle').optional().trim(),
  body('customFields').optional().isObject()
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
      eventId, ticketId, firstName, lastName, email, phone,
      company, jobTitle, quantity, customFields
    } = req.body;

    // Get event and ticket details
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    if (event.status !== 'published') {
      return res.status(400).json({
        success: false,
        error: 'Event is not open for registration'
      });
    }

    const ticketResult = await pool.query(
      'SELECT * FROM tickets WHERE id = $1 AND event_id = $2 AND is_active = true',
      [ticketId, eventId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found or not available'
      });
    }

    const ticket = ticketResult.rows[0];

    // Check ticket availability
    if (ticket.quantity_available && (ticket.quantity_sold + quantity) > ticket.quantity_available) {
      return res.status(400).json({
        success: false,
        error: 'Not enough tickets available'
      });
    }

    // Check if user is already registered for this event
    const existingRegistration = await pool.query(
      'SELECT id FROM registrations WHERE event_id = $1 AND email = $2 AND status != \'cancelled\'',
      [eventId, email]
    );

    if (existingRegistration.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered for this event'
      });
    }

    // Check event capacity
    if (event.max_attendees && (event.current_attendees + quantity) > event.max_attendees) {
      return res.status(400).json({
        success: false,
        error: 'Event is at full capacity'
      });
    }

    const registrationId = uuidv4();
    const registrationCode = `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const totalAmount = parseFloat(ticket.price) * quantity;

    // Create registration
    const result = await pool.query(`
      INSERT INTO registrations (
        id, event_id, ticket_id, user_id, first_name, last_name, email,
        phone, company, job_title, quantity, total_amount, currency,
        status, payment_status, registration_code, custom_field_values
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17
      )
      RETURNING *
    `, [
      registrationId, eventId, ticketId, req.user?.id || null,
      firstName, lastName, email, phone, company, jobTitle,
      quantity, totalAmount, ticket.currency,
      ticket.price > 0 ? 'pending' : 'confirmed', // Auto-confirm free tickets
      ticket.price > 0 ? 'pending' : 'paid',
      registrationCode,
      customFields || null
    ]);

    const registration = result.rows[0];

    // Update ticket sold count
    await pool.query(
      'UPDATE tickets SET quantity_sold = quantity_sold + $1 WHERE id = $2',
      [quantity, ticketId]
    );

    // Update event current attendees
    await pool.query(
      'UPDATE events SET current_attendees = current_attendees + $1 WHERE id = $2',
      [quantity, eventId]
    );

    // TODO: Send confirmation email
    // TODO: Generate QR code for ticket

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        id: registration.id,
        registrationCode: registration.registration_code,
        totalAmount: parseFloat(registration.total_amount),
        status: registration.status,
        paymentStatus: registration.payment_status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
});

// Get registration by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT r.*, e.title as event_title, e.organizer_id,
             t.name as ticket_name, t.type as ticket_type, t.price as ticket_price
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN tickets t ON r.ticket_id = t.id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    const registration = result.rows[0];

    // Check access permissions
    if (req.user.role !== 'super_admin' &&
        registration.organizer_id !== req.user.id &&
        registration.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        id: registration.id,
        event: {
          id: registration.event_id,
          title: registration.event_title,
          organizerId: registration.organizer_id
        },
        ticket: {
          id: registration.ticket_id,
          name: registration.ticket_name,
          type: registration.ticket_type,
          price: parseFloat(registration.ticket_price)
        },
        attendee: {
          firstName: registration.first_name,
          lastName: registration.last_name,
          email: registration.email,
          phone: registration.phone,
          company: registration.company,
          jobTitle: registration.job_title,
          dietaryRestrictions: registration.dietary_restrictions,
          specialRequirements: registration.special_requirements
        },
        quantity: registration.quantity,
        totalAmount: parseFloat(registration.total_amount),
        currency: registration.currency,
        status: registration.status,
        paymentStatus: registration.payment_status,
        paymentId: registration.payment_id,
        registrationCode: registration.registration_code,
        qrCodeUrl: registration.qr_code_url,
        ticketUrl: registration.ticket_url,
        checkedInAt: registration.checked_in_at,
        checkedInBy: registration.checked_in_by,
        customFieldValues: registration.custom_field_values,
        referralSource: registration.referral_source,
        marketingConsent: registration.marketing_consent,
        emailNotifications: registration.email_notifications,
        notes: registration.notes,
        createdAt: registration.created_at,
        updatedAt: registration.updated_at
      }
    });
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update registration
router.put('/:id', authenticate, authorize('event_manager', 'super_admin'), [
  body('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'waitlisted']),
  body('paymentStatus').optional().isIn(['pending', 'paid', 'refunded', 'failed']),
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

    const { id } = req.params;
    const updates = req.body;

    // Check if registration exists and user has access
    const registrationResult = await pool.query(`
      SELECT r.*, e.organizer_id
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = $1
    `, [id]);

    if (registrationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    const registration = registrationResult.rows[0];

    // Check permissions
    if (req.user.role !== 'super_admin' && registration.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Build update query
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      params.push(updates.status);
    }

    if (updates.paymentStatus !== undefined) {
      updateFields.push(`payment_status = $${paramIndex++}`);
      params.push(updates.paymentStatus);
    }

    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      params.push(updates.notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    params.push(id);

    const result = await pool.query(
      `UPDATE registrations SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    const updatedRegistration = result.rows[0];

    res.json({
      success: true,
      message: 'Registration updated successfully',
      data: {
        id: updatedRegistration.id,
        status: updatedRegistration.status,
        paymentStatus: updatedRegistration.payment_status,
        notes: updatedRegistration.notes,
        updatedAt: updatedRegistration.updated_at
      }
    });
  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Cancel registration
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Get registration with event info
    const registrationResult = await pool.query(`
      SELECT r.*, e.organizer_id
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = $1
    `, [id]);

    if (registrationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    const registration = registrationResult.rows[0];

    // Check permissions (user can cancel their own registration, event manager can cancel any)
    if (req.user.role !== 'super_admin' &&
        registration.organizer_id !== req.user.id &&
        registration.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Registration is already cancelled'
      });
    }

    // Cancel registration
    await pool.query(
      'UPDATE registrations SET status = \'cancelled\', updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    // Update ticket sold count
    await pool.query(
      'UPDATE tickets SET quantity_sold = quantity_sold - $1 WHERE id = $2',
      [registration.quantity, registration.ticket_id]
    );

    // Update event current attendees
    await pool.query(
      'UPDATE events SET current_attendees = current_attendees - $1 WHERE id = $2',
      [registration.quantity, registration.event_id]
    );

    // TODO: Process refund if payment was made
    // TODO: Send cancellation email

    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;