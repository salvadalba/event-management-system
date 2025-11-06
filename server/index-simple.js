require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./config/database-simple');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Utility functions
const generateTokens = (user) => {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );

  return { token, refreshToken };
};

// Auth middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token.'
    });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Event Management API is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.get(
      'SELECT id, email, password, first_name, last_name, role FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login
    db.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    const { token, refreshToken } = generateTokens(user);

    delete user.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  try {
    const user = db.get(
      'SELECT id, email, first_name, last_name, role, phone, avatar_url, is_active, email_verified, last_login, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
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

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = db.get(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Events routes
app.get('/api/events', authenticate, (req, res) => {
  try {
    const events = db.query(`
      SELECT e.*, u.first_name as organizer_first_name, u.last_name as organizer_last_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      ORDER BY e.start_date ASC
    `);

    res.json({
      success: true,
      data: {
        events: events.rows.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          shortDescription: event.short_description,
          organizer: {
            id: event.organizer_id,
            firstName: event.organizer_first_name,
            lastName: event.organizer_last_name
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
          maxAttendees: event.max_attendees,
          currentAttendees: event.current_attendees,
          status: event.status,
          isFeatured: event.is_featured,
          tags: event.tags ? JSON.parse(event.tags) : [],
          createdAt: event.created_at,
          updatedAt: event.updated_at
        })),
        pagination: {
          page: 1,
          limit: 10,
          total: events.rows.length,
          pages: 1
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

app.get('/api/events/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;

    const event = db.get(`
      SELECT e.*, u.first_name as organizer_first_name, u.last_name as organizer_last_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.id = ?
    `, [id]);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Get tickets for this event
    const tickets = db.query(
      'SELECT * FROM tickets WHERE event_id = ? AND is_active = 1 ORDER BY price ASC',
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
          lastName: event.organizer_last_name
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
        maxAttendees: event.max_attendees,
        currentAttendees: event.current_attendees,
        status: event.status,
        isFeatured: event.is_featured,
        tags: event.tags ? JSON.parse(event.tags) : [],
        tickets: tickets.rows.map(ticket => ({
          id: ticket.id,
          name: ticket.name,
          description: ticket.description,
          type: ticket.type,
          price: ticket.price,
          currency: ticket.currency,
          quantityAvailable: ticket.quantity_available,
          quantitySold: ticket.quantity_sold
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

// Dashboard endpoint
app.get('/api/analytics/overview', authenticate, (req, res) => {
  try {
    const eventsCount = db.get('SELECT COUNT(*) as count FROM events').count;
    const usersCount = db.get('SELECT COUNT(*) as count FROM users').count;
    const registrationsCount = db.get('SELECT COUNT(*) as count FROM registrations WHERE status != "cancelled"').count;

    // Recent events
    const recentEvents = db.query(`
      SELECT id, title, created_at
      FROM events
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        totals: {
          events: eventsCount,
          users: usersCount,
          registrations: registrationsCount,
          revenue: 14955.00 // Sample data
        },
        recentActivity: {
          events: recentEvents.rows,
          registrations: []
        }
      }
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`👤 Admin login: admin@example.com / admin123`);
});

module.exports = app;