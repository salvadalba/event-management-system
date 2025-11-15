const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const sanitize = require('../utils/sanitize');
const { authenticate, authorize, checkEventOwnership } = require('../middleware/auth');

const router = express.Router();

// Get all events with filtering and pagination
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'published', 'canceled', 'completed']),
  query('search').optional().trim(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
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
    const { status, search, startDate, endDate } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // If user is not super admin, only show their events or published events
    if (req.user.role !== 'super_admin') {
      whereClause += ` AND (organizer_id = $${paramIndex++} OR status = 'published')`;
      params.push(req.user.id);
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (search) {
      whereClause += ` AND (title ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++} OR venue_name ILIKE $${paramIndex++})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (startDate) {
      whereClause += ` AND start_date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND end_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM events ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get events with organizer info
    const eventsResult = await pool.query(`
      SELECT e.*, u.first_name as organizer_first_name, u.last_name as organizer_last_name, u.email as organizer_email
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      ${whereClause}
      ORDER BY e.start_date ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: {
        events: eventsResult.rows.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          shortDescription: event.short_description,
          organizer: {
            id: event.organizer_id,
            firstName: event.organizer_first_name,
            lastName: event.organizer_last_name,
            email: event.organizer_email
          },
          venue: {
            name: event.venue_name,
            address: event.venue_address,
            city: event.venue_city,
            state: event.venue_state,
            country: event.venue_country,
            postalCode: event.venue_postal_code
          },
          startDate: event.start_date,
          endDate: event.end_date,
          timezone: event.timezone,
          maxAttendees: event.max_attendees,
          currentAttendees: event.current_attendees,
          status: event.status,
          isFeatured: event.is_featured,
          featuredImageUrl: event.featured_image_url,
          tags: event.tags,
          registrationDeadline: event.registration_deadline,
          createdAt: event.created_at,
          updatedAt: event.updated_at
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
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get event by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT e.*, u.first_name as organizer_first_name, u.last_name as organizer_last_name, u.email as organizer_email
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const event = result.rows[0];

    // Check if user has access to this event
    if (req.user.role !== 'super_admin' &&
        event.organizer_id !== req.user.id &&
        event.status !== 'published') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get tickets for this event
    const ticketsResult = await pool.query(
      'SELECT * FROM tickets WHERE event_id = $1 AND is_active = true ORDER BY price ASC',
      [id]
    );

    res.json({
      success: true,
      data: {
        id: event.id,
        title: event.title,
        description: event.description,
        shortDescription: event.short_description,
        organizer: {
          id: event.organizer_id,
          firstName: event.organizer_first_name,
          lastName: event.organizer_last_name,
          email: event.organizer_email
        },
        venue: {
          name: event.venue_name,
          address: event.venue_address,
          city: event.venue_city,
          state: event.venue_state,
          country: event.venue_country,
          postalCode: event.venue_postal_code
        },
        startDate: event.start_date,
        endDate: event.end_date,
        timezone: event.timezone,
        maxAttendees: event.max_attendees,
        currentAttendees: event.current_attendees,
        status: event.status,
        isFeatured: event.is_featured,
        featuredImageUrl: event.featured_image_url,
        agenda: event.agenda,
        tags: event.tags,
        customFields: event.custom_fields,
        registrationDeadline: event.registration_deadline,
        checkinEnabled: event.checkin_enabled,
        requiresApproval: event.requires_approval,
        socialLinks: event.social_links,
        contactEmail: event.contact_email,
        contactPhone: event.contact_phone,
        tickets: ticketsResult.rows.map(ticket => ({
          id: ticket.id,
          name: ticket.name,
          description: ticket.description,
          type: ticket.type,
          price: parseFloat(ticket.price),
          currency: ticket.currency,
          quantityAvailable: ticket.quantity_available,
          quantitySold: ticket.quantity_sold,
          salesStart: ticket.sales_start,
          salesEnd: ticket.sales_end,
          minPurchase: ticket.min_purchase,
          maxPurchase: ticket.max_purchase,
          requiresApproval: ticket.requires_approval,
          benefits: ticket.benefits
        })),
        createdAt: event.created_at,
        updatedAt: event.updated_at
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Create new event
router.post('/', authenticate, authorize('event_manager', 'super_admin'), [
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('shortDescription').optional().trim(),
  body('venue.name').notEmpty().trim(),
  body('venue.address').notEmpty().trim(),
  body('venue.city').notEmpty().trim(),
  body('venue.country').notEmpty().trim(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('maxAttendees').optional().isInt({ min: 1 })
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
      title, description, shortDescription, venue, startDate, endDate,
      maxAttendees, tags, agenda, registrationDeadline, socialLinks,
      contactEmail, contactPhone, checkinEnabled, requiresApproval
    } = req.body;

    const safeDescription = sanitize(description);
    const safeShortDescription = sanitize(shortDescription);

    const eventId = uuidv4();

    const result = await pool.query(`
      INSERT INTO events (
        id, title, description, short_description, organizer_id,
        venue_name, venue_address, venue_city, venue_state, venue_country, venue_postal_code,
        start_date, end_date, max_attendees, tags, agenda, registration_deadline,
        social_links, contact_email, contact_phone, checkin_enabled, requires_approval
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22
      )
      RETURNING *
    `, [
      eventId, title, safeDescription, safeShortDescription, req.user.id,
      venue.name, venue.address, venue.city, venue.state || null, venue.country, venue.postalCode || null,
      startDate, endDate, maxAttendees || null, tags || null, agenda || null, registrationDeadline || null,
      socialLinks || null, contactEmail || null, contactPhone || null, checkinEnabled !== false, requiresApproval || false
    ]);

    const event = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        id: event.id,
        title: event.title,
        description: event.description,
        shortDescription: event.short_description,
        organizerId: event.organizer_id,
        venue: {
          name: event.venue_name,
          address: event.venue_address,
          city: event.venue_city,
          state: event.venue_state,
          country: event.venue_country,
          postalCode: event.venue_postal_code
        },
        startDate: event.start_date,
        endDate: event.end_date,
        maxAttendees: event.max_attendees,
        status: event.status,
        tags: event.tags,
        agenda: event.agenda,
        registrationDeadline: event.registration_deadline,
        checkinEnabled: event.checkin_enabled,
        requiresApproval: event.requires_approval,
        socialLinks: event.social_links,
        contactEmail: event.contact_email,
        contactPhone: event.contact_phone,
        createdAt: event.created_at
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Update event
router.put('/:id', authenticate, checkEventOwnership, [
  body('title').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('venue.name').optional().notEmpty().trim(),
  body('venue.address').optional().notEmpty().trim(),
  body('venue.city').optional().notEmpty().trim(),
  body('venue.country').optional().notEmpty().trim(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('maxAttendees').optional().isInt({ min: 1 })
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
    if (updates.description !== undefined) updates.description = sanitize(updates.description);
    if (updates.shortDescription !== undefined) updates.shortDescription = sanitize(updates.shortDescription);

    // Build update query
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    const fieldMappings = {
      title: 'title',
      description: 'description',
      shortDescription: 'short_description',
      'venue.name': 'venue_name',
      'venue.address': 'venue_address',
      'venue.city': 'venue_city',
      'venue.state': 'venue_state',
      'venue.country': 'venue_country',
      'venue.postalCode': 'venue_postal_code',
      startDate: 'start_date',
      endDate: 'end_date',
      maxAttendees: 'max_attendees',
      status: 'status',
      tags: 'tags',
      agenda: 'agenda',
      registrationDeadline: 'registration_deadline',
      checkinEnabled: 'checkin_enabled',
      requiresApproval: 'requires_approval',
      socialLinks: 'social_links',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const field = fieldMappings[key];
        if (field) {
          updateFields.push(`${field} = $${paramIndex++}`);
          params.push(value);
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    params.push(id);

    const result = await pool.query(
      `UPDATE events SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    const event = result.rows[0];

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: {
        id: event.id,
        title: event.title,
        description: event.description,
        shortDescription: event.short_description,
        venue: {
          name: event.venue_name,
          address: event.venue_address,
          city: event.venue_city,
          state: event.venue_state,
          country: event.venue_country,
          postalCode: event.venue_postal_code
        },
        startDate: event.start_date,
        endDate: event.end_date,
        maxAttendees: event.max_attendees,
        status: event.status,
        tags: event.tags,
        agenda: event.agenda,
        registrationDeadline: event.registration_deadline,
        checkinEnabled: event.checkin_enabled,
        requiresApproval: event.requires_approval,
        socialLinks: event.social_links,
        contactEmail: event.contact_email,
        contactPhone: event.contact_phone,
        updatedAt: event.updated_at
      }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Delete event
router.delete('/:id', authenticate, checkEventOwnership, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event has registrations
    const registrationResult = await pool.query(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = $1 AND status != \'cancelled\'',
      [id]
    );

    if (parseInt(registrationResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete event with active registrations'
      });
    }

    await pool.query('DELETE FROM events WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Duplicate event
router.post('/:id/duplicate', authenticate, checkEventOwnership, async (req, res) => {
  try {
    const { id } = req.params;

    // Get original event
    const originalEvent = await pool.query('SELECT * FROM events WHERE id = $1', [id]);

    if (originalEvent.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const event = originalEvent.rows[0];
    const newEventId = uuidv4();

    // Create duplicate event
    const duplicateResult = await pool.query(`
      INSERT INTO events (
        id, title, description, short_description, organizer_id,
        venue_name, venue_address, venue_city, venue_state, venue_country, venue_postal_code,
        start_date, end_date, max_attendees, tags, agenda, registration_deadline,
        social_links, contact_email, contact_phone, checkin_enabled, requires_approval, status
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, 'draft'
      )
      RETURNING *
    `, [
      newEventId,
      `${event.title} (Copy)`,
      event.description,
      event.short_description,
      req.user.id,
      event.venue_name,
      event.venue_address,
      event.venue_city,
      event.venue_state,
      event.venue_country,
      event.venue_postal_code,
      event.start_date,
      event.end_date,
      event.max_attendees,
      event.tags,
      event.agenda,
      event.registration_deadline,
      event.social_links,
      event.contact_email,
      event.contact_phone,
      event.checkin_enabled,
      event.requires_approval
    ]);

    // Get original tickets
    const ticketsResult = await pool.query('SELECT * FROM tickets WHERE event_id = $1', [id]);

    // Create duplicate tickets
    for (const ticket of ticketsResult.rows) {
      const newTicketId = uuidv4();
      await pool.query(`
        INSERT INTO tickets (
          id, event_id, name, description, type, price, currency,
          quantity_available, sales_start, sales_end, min_purchase, max_purchase,
          is_active, requires_approval, benefits, restrictions
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16
        )
      `, [
        newTicketId,
        newEventId,
        ticket.name,
        ticket.description,
        ticket.type,
        ticket.price,
        ticket.currency,
        ticket.quantity_available,
        ticket.sales_start,
        ticket.sales_end,
        ticket.min_purchase,
        ticket.max_purchase,
        ticket.is_active,
        ticket.requires_approval,
        ticket.benefits,
        ticket.restrictions
      ]);
    }

    const duplicateEvent = duplicateResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Event duplicated successfully',
      data: {
        id: duplicateEvent.id,
        title: duplicateEvent.title,
        status: duplicateEvent.status,
        createdAt: duplicateEvent.created_at
      }
    });
  } catch (error) {
    console.error('Duplicate event error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
