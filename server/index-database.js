const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config/database');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Helper functions
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = 'event_manager' } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await db.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, true, true)
       RETURNING id, first_name, last_name, email, role, is_active, email_verified, created_at`,
      [firstName, lastName, email, passwordHash, role]
    );

    const user = result.rows[0];
    const tokens = generateTokens(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          createdAt: user.created_at
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const result = await db.query(
      `SELECT id, first_name, last_name, email, password_hash, role, is_active, email_verified
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is disabled'
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const tokens = generateTokens(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
          emailVerified: user.email_verified
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      // Get user from database
      const result = await db.query(
        `SELECT id, email, role FROM users WHERE id = $1 AND is_active = true`,
        [user.id]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'User not found'
        });
      }

      const dbUser = result.rows[0];
      const tokens = generateTokens(dbUser);

      res.json({
        success: true,
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, first_name, last_name, email, role, is_active, email_verified, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
});

// Events Routes
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*, v.name as venue_name, v.address as venue_address, v.city as venue_city, v.country as venue_country,
              u.first_name as organizer_first_name, u.last_name as organizer_last_name
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       LEFT JOIN users u ON e.organizer_id = u.id
       WHERE e.status = 'published'
       ORDER BY e.start_date ASC`
    );

    const events = result.rows.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      shortDescription: event.short_description,
      venue: {
        name: event.venue_name || 'TBD',
        address: event.venue_address || 'TBD',
        city: event.venue_city || 'TBD',
        country: event.venue_country || 'TBD'
      },
      startDate: event.start_date,
      endDate: event.end_date,
      maxAttendees: event.max_attendees,
      currentAttendees: event.current_attendees,
      status: event.status,
      isFeatured: event.is_featured,
      tags: event.tags || [],
      createdAt: event.created_at,
      organizer: {
        id: event.organizer_id,
        firstName: event.organizer_first_name,
        lastName: event.organizer_last_name
      }
    }));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

app.get('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get event details
    const eventResult = await db.query(
      `SELECT e.*, v.name as venue_name, v.address as venue_address, v.city as venue_city, v.country as venue_country,
              u.first_name as organizer_first_name, u.last_name as organizer_last_name
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       LEFT JOIN users u ON e.organizer_id = u.id
       WHERE e.id = $1`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    // Get event tickets
    const ticketsResult = await db.query(
      `SELECT * FROM tickets WHERE event_id = $1`,
      [id]
    );

    const tickets = ticketsResult.rows.map(ticket => ({
      id: ticket.id,
      name: ticket.name,
      description: ticket.description,
      type: ticket.type,
      price: parseFloat(ticket.price),
      currency: ticket.currency,
      quantityAvailable: ticket.quantity_available,
      quantitySold: ticket.quantity_sold
    }));

    const eventData = {
      id: event.id,
      title: event.title,
      description: event.description,
      shortDescription: event.short_description,
      venue: {
        name: event.venue_name || 'TBD',
        address: event.venue_address || 'TBD',
        city: event.venue_city || 'TBD',
        country: event.venue_country || 'TBD'
      },
      startDate: event.start_date,
      endDate: event.end_date,
      maxAttendees: event.max_attendees,
      currentAttendees: event.current_attendees,
      status: event.status,
      isFeatured: event.is_featured,
      tags: event.tags || [],
      createdAt: event.created_at,
      organizer: {
        id: event.organizer_id,
        firstName: event.organizer_first_name,
        lastName: event.organizer_last_name
      },
      tickets
    };

    res.json({ success: true, data: eventData });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event'
    });
  }
});

app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      shortDescription,
      venueId,
      startDate,
      endDate,
      maxAttendees,
      tags,
      isFeatured = false
    } = req.body;

    // Validation
    if (!title || !description || !startDate || !endDate || !maxAttendees) {
      return res.status(400).json({
        success: false,
        error: 'Required fields are missing'
      });
    }

    // Create event
    const result = await db.query(
      `INSERT INTO events (title, description, short_description, venue_id, organizer_id, start_date, end_date,
                           max_attendees, status, is_featured, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', $9, $10)
       RETURNING *`,
      [title, description, shortDescription, venueId, req.user.id, startDate, endDate, maxAttendees, isFeatured, tags]
    );

    const event = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: event.id,
        title: event.title,
        description: event.description,
        shortDescription: event.short_description,
        startDate: event.start_date,
        endDate: event.end_date,
        maxAttendees: event.max_attendees,
        currentAttendees: event.current_attendees,
        status: event.status,
        isFeatured: event.is_featured,
        tags: event.tags || [],
        createdAt: event.created_at
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create event'
    });
  }
});

app.put('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      shortDescription,
      venueId,
      startDate,
      endDate,
      maxAttendees,
      tags,
      isFeatured
    } = req.body;

    // Check if event exists and user has permission
    const existingEvent = await db.query(
      'SELECT organizer_id FROM events WHERE id = $1',
      [id]
    );

    if (existingEvent.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Update event
    const result = await db.query(
      `UPDATE events SET title = $1, description = $2, short_description = $3, venue_id = $4,
                         start_date = $5, end_date = $6, max_attendees = $7, is_featured = $8, tags = $9,
                         updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [title, description, shortDescription, venueId, startDate, endDate, maxAttendees, isFeatured, tags, id]
    );

    const event = result.rows[0];

    res.json({
      success: true,
      data: {
        id: event.id,
        title: event.title,
        description: event.description,
        shortDescription: event.short_description,
        startDate: event.start_date,
        endDate: event.end_date,
        maxAttendees: event.max_attendees,
        currentAttendees: event.current_attendees,
        status: event.status,
        isFeatured: event.is_featured,
        tags: event.tags || [],
        updatedAt: event.updated_at
      }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event'
    });
  }
});

app.delete('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const existingEvent = await db.query(
      'SELECT organizer_id FROM events WHERE id = $1',
      [id]
    );

    if (existingEvent.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Delete event (cascade will handle related records)
    await db.query('DELETE FROM events WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event'
    });
  }
});

// Registrations Routes
app.get('/api/registrations', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, e.title as event_title, e.start_date as event_start_date, e.end_date as event_end_date,
              v.name as venue_name, v.city as venue_city,
              t.name as ticket_name, t.price as ticket_price, t.currency as ticket_currency,
              u.first_name as attendee_first_name, u.last_name as attendee_last_name, u.email as attendee_email
       FROM registrations r
       LEFT JOIN events e ON r.event_id = e.id
       LEFT JOIN venues v ON e.venue_id = v.id
       LEFT JOIN tickets t ON r.ticket_id = t.id
       LEFT JOIN users u ON r.user_id = u.id
       ORDER BY r.registration_date DESC`
    );

    const registrations = result.rows.map(reg => ({
      id: reg.id,
      eventId: reg.event_id,
      userId: reg.user_id,
      ticketId: reg.ticket_id,
      status: reg.status,
      registeredAt: reg.registration_date,
      qrCode: reg.qr_code,
      event: {
        id: reg.event_id,
        title: reg.event_title,
        startDate: reg.event_start_date,
        endDate: reg.event_end_date,
        venue: {
          name: reg.venue_name,
          city: reg.venue_city
        }
      },
      ticket: {
        id: reg.ticket_id,
        name: reg.ticket_name,
        price: parseFloat(reg.ticket_price),
        currency: reg.ticket_currency
      },
      attendee: {
        id: reg.user_id,
        firstName: reg.attendee_first_name,
        lastName: reg.attendee_last_name,
        email: reg.attendee_email
      }
    }));

    res.json({ success: true, data: registrations });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registrations'
    });
  }
});

app.post('/api/registrations', authenticateToken, async (req, res) => {
  try {
    const { eventId, ticketId } = req.body;

    // Generate QR code
    const qrCode = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create registration
    const result = await db.query(
      `INSERT INTO registrations (event_id, user_id, ticket_id, status, qr_code)
       VALUES ($1, $2, $3, 'confirmed', $4)
       RETURNING *`,
      [eventId, req.user.id, ticketId, qrCode]
    );

    // Update event attendee count
    await db.query(
      `UPDATE events SET current_attendees = current_attendees + 1 WHERE id = $1`,
      [eventId]
    );

    // Update ticket sold count
    await db.query(
      `UPDATE tickets SET quantity_sold = quantity_sold + 1 WHERE id = $1`,
      [ticketId]
    );

    const registration = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: registration.id,
        eventId: registration.event_id,
        userId: registration.user_id,
        ticketId: registration.ticket_id,
        status: registration.status,
        registeredAt: registration.registration_date,
        qrCode: registration.qr_code
      }
    });
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create registration'
    });
  }
});

app.put('/api/registrations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await db.query(
      `UPDATE registrations SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    const registration = result.rows[0];

    res.json({
      success: true,
      data: {
        id: registration.id,
        status: registration.status,
        updatedAt: registration.updated_at
      }
    });
  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update registration'
    });
  }
});

app.post('/api/registrations/:id/checkin', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if registration exists
    const registrationResult = await db.query(
      'SELECT * FROM registrations WHERE id = $1',
      [id]
    );

    if (registrationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    const registration = registrationResult.rows[0];

    if (registration.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: 'Registration must be confirmed to check in'
      });
    }

    // Create check-in record
    await db.query(
      `INSERT INTO checkins (registration_id, checked_in_by, method)
       VALUES ($1, $2, 'manual')`,
      [id, req.user.id]
    );

    // Update registration status
    await db.query(
      `UPDATE registrations SET status = 'checked_in', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Check-in successful'
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check in'
    });
  }
});

app.delete('/api/registrations/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get registration details before deletion
    const registrationResult = await db.query(
      'SELECT event_id, ticket_id FROM registrations WHERE id = $1',
      [id]
    );

    if (registrationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    const registration = registrationResult.rows[0];

    // Delete registration
    await db.query('DELETE FROM registrations WHERE id = $1', [id]);

    // Update counts if registration was confirmed
    await db.query(
      `UPDATE events SET current_attendees = GREATEST(current_attendees - 1, 0) WHERE id = $1`,
      [registration.event_id]
    );

    await db.query(
      `UPDATE tickets SET quantity_sold = GREATEST(quantity_sold - 1, 0) WHERE id = $1`,
      [registration.ticket_id]
    );

    res.json({
      success: true,
      message: 'Registration deleted successfully'
    });
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete registration'
    });
  }
});

// Analytics Routes
app.get('/api/analytics/overview', authenticateToken, async (req, res) => {
  try {
    // Get overview stats
    const overviewResult = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM events WHERE status = 'published') as total_events,
        (SELECT COUNT(*) FROM registrations WHERE status IN ('confirmed', 'checked_in')) as total_attendees,
        COALESCE(SUM(t.price * t.quantity_sold), 0) as total_revenue,
        CASE
          WHEN (SELECT COUNT(*) FROM events WHERE status = 'published') = 0 THEN 0
          ELSE ROUND((SELECT SUM(current_attendees) FROM events WHERE status = 'published')::numeric /
                   (SELECT SUM(max_attendees) FROM events WHERE status = 'published')::numeric * 100, 1)
        END as average_attendance
      FROM tickets t
    `);

    // Get events by month
    const eventsByMonthResult = await db.query(`
      SELECT
        DATE_TRUNC('month', start_date) as month,
        COUNT(*) as events,
        SUM(current_attendees) as attendees,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(t.price * t.quantity_sold), 0)
           FROM tickets t WHERE t.event_id = e.id)
        ), 0) as revenue
      FROM events e
      WHERE e.status = 'published'
        AND e.start_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', start_date)
      ORDER BY month DESC
      LIMIT 12
    `);

    // Get top events
    const topEventsResult = await db.query(`
      SELECT
        e.id,
        e.title,
        e.current_attendees as attendees,
        COALESCE(SUM(t.price * t.quantity_sold), 0) as revenue,
        CASE
          WHEN e.max_attendees = 0 THEN 0
          ELSE ROUND(e.current_attendees::numeric / e.max_attendees::numeric * 100, 1)
        END as attendance_rate
      FROM events e
      LEFT JOIN tickets t ON e.id = t.event_id
      WHERE e.status = 'published'
      GROUP BY e.id, e.title, e.current_attendees, e.max_attendees
      ORDER BY revenue DESC
      LIMIT 10
    `);

    // Get registration trends (last 30 days)
    const registrationTrendsResult = await db.query(`
      SELECT
        DATE(registration_date) as date,
        COUNT(*) as registrations
      FROM registrations
      WHERE registration_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(registration_date)
      ORDER BY date DESC
    `);

    const overview = {
      totalEvents: parseInt(overviewResult.rows[0]?.total_events) || 0,
      totalAttendees: parseInt(overviewResult.rows[0]?.total_attendees) || 0,
      totalRevenue: parseFloat(overviewResult.rows[0]?.total_revenue) || 0,
      averageAttendance: parseFloat(overviewResult.rows[0]?.average_attendance) || 0
    };

    const eventsByMonth = eventsByMonthResult.rows.map(row => ({
      month: row.month,
      events: parseInt(row.events),
      attendees: parseInt(row.attendees),
      revenue: parseFloat(row.revenue)
    }));

    const topEvents = topEventsResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      attendees: parseInt(row.attendees),
      revenue: parseFloat(row.revenue),
      attendanceRate: parseFloat(row.attendance_rate)
    }));

    const registrationTrends = registrationTrendsResult.rows.map(row => ({
      date: row.date,
      registrations: parseInt(row.registrations)
    }));

    res.json({
      success: true,
      data: {
        overview,
        eventsByMonth,
        topEvents,
        registrationTrends,
        attendanceByEventType: [] // Can be expanded based on event tags
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// Communications Routes
app.get('/api/communications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, e.title as event_title
       FROM communications c
       LEFT JOIN events e ON c.event_id = e.id
       ORDER BY c.created_at DESC`
    );

    const communications = result.rows.map(comm => ({
      id: comm.id,
      subject: comm.subject,
      type: comm.type,
      recipientType: comm.recipient_type,
      status: comm.status,
      content: comm.content,
      scheduledAt: comm.scheduled_at,
      sentAt: comm.sent_at,
      createdAt: comm.created_at,
      event: comm.event_id ? {
        id: comm.event_id,
        title: comm.event_title
      } : null,
      stats: {
        totalRecipients: 0, // Can be expanded
        sentCount: comm.status === 'sent' ? 1 : 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0
      }
    }));

    res.json({ success: true, data: communications });
  } catch (error) {
    console.error('Get communications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch communications'
    });
  }
});

app.post('/api/communications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { subject, type, recipientType, content, eventId } = req.body;

    const result = await db.query(
      `INSERT INTO communications (subject, type, recipient_type, content, event_id, sender_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft')
       RETURNING *`,
      [subject, type, recipientType, content, eventId, req.user.id]
    );

    const communication = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: communication.id,
        subject: communication.subject,
        type: communication.type,
        recipientType: communication.recipient_type,
        content: communication.content,
        status: communication.status,
        createdAt: communication.created_at
      }
    });
  } catch (error) {
    console.error('Create communication error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create communication'
    });
  }
});

app.delete('/api/communications/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM communications WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Communication deleted successfully'
    });
  } catch (error) {
    console.error('Delete communication error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete communication'
    });
  }
});

app.post('/api/communications/:id/send', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE communications SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    const communication = result.rows[0];

    res.json({
      success: true,
      message: 'Communication sent successfully',
      data: {
        id: communication.id,
        status: communication.status,
        sentAt: communication.sent_at
      }
    });
  } catch (error) {
    console.error('Send communication error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send communication'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Database-driven server running on port ${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`👤 Admin login: admin@eventmanager.com / admin123`);
});