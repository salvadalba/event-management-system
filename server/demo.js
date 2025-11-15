require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// Mock user data
const users = [
  {
    id: '1',
    email: 'admin@example.com',
    password: '$2b$12$3Z1gLoD/I47t4vPGajymmO6Gw7n1GN0JWYSuHn/1hK9h12WcyAO7W', // 'admin123' hashed
    firstName: 'Admin',
    lastName: 'User',
    role: 'super_admin'
  }
];

// Mock registrations data
let registrations = [
  {
    id: '1',
    eventId: '1',
    userId: '1',
    ticketId: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1-555-0123',
    registrationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
    paymentStatus: 'paid',
    totalPaid: 299.00,
    currency: 'USD',
    qrCode: 'QR_CODE_12345',
    checkedIn: false,
    checkedInAt: null
  }
];

// Mock tickets data
let tickets = [
  {
    id: '1',
    eventId: '1',
    name: 'General Admission',
    description: 'Standard access to all conference sessions',
    type: 'general',
    price: 299.00,
    currency: 'USD',
    quantityAvailable: 500,
    quantitySold: 45
  }
];

let communications = [];

// Mock events data
const events = [
  {
    id: '1',
    title: 'Tech Conference 2024',
    description: 'Join us for an amazing technology conference featuring the latest trends in AI, web development, and digital transformation.',
    shortDescription: 'Premier tech conference with workshops and networking',
    organizerId: '1',
    venue: {
      name: 'Convention Center',
      address: '123 Main Street',
      city: 'San Francisco',
      country: 'United States'
    },
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
    maxAttendees: 500,
    currentAttendees: 45,
    status: 'published',
    isFeatured: true,
    tags: ['technology', 'conference', 'networking', 'AI'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'Digital Marketing Summit',
    description: 'Master the art of digital marketing with industry experts and hands-on workshops.',
    shortDescription: 'Learn marketing strategies that drive real results',
    organizerId: '1',
    venue: {
      name: 'Tech Hub',
      address: '456 Innovation Drive',
      city: 'New York',
      country: 'United States'
    },
    startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    maxAttendees: 300,
    currentAttendees: 128,
    status: 'published',
    isFeatured: false,
    tags: ['marketing', 'digital', 'business', 'strategy'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'AI & Machine Learning Workshop',
    description: 'Hands-on workshop covering the latest AI and ML techniques and practical applications.',
    shortDescription: 'Practical AI/ML skills development',
    organizerId: '1',
    venue: {
      name: 'Innovation Lab',
      address: '789 Tech Avenue',
      city: 'Seattle',
      country: 'United States'
    },
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    maxAttendees: 150,
    currentAttendees: 67,
    status: 'draft',
    isFeatured: false,
    tags: ['AI', 'machine learning', 'workshop', 'programming'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

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

    const user = users.find(u => u.email === email);

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

    const { token, refreshToken } = generateTokens(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
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
    const user = users.find(u => u.id === req.user.id);

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
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString()
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

    const user = users.find(u => u.id === decoded.id);

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

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = 'event_manager' } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      isActive: true,
      emailVerified: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Generate tokens
    const { token, refreshToken } = generateTokens(newUser);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: userWithoutPassword,
        token,
        refreshToken
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

// Events routes
app.get('/api/events', authenticate, (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        events: events.map(event => ({
          ...event,
          organizer: {
            id: event.organizerId,
            firstName: 'Admin',
            lastName: 'User'
          }
        })),
        pagination: {
          page: 1,
          limit: 10,
          total: events.length,
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
    const event = events.find(e => e.id === id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Mock tickets
    const tickets = [
      {
        id: '1',
        name: 'General Admission',
        description: 'Standard access to all conference sessions',
        type: 'general',
        price: 299.00,
        currency: 'USD',
        quantityAvailable: 300,
        quantitySold: 45
      }
    ];

    res.json({
      success: true,
      data: {
        ...event,
        organizer: {
          id: event.organizerId,
          firstName: 'Admin',
          lastName: 'User'
        },
        tickets
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

// Create event
app.post('/api/events', authenticate, (req, res) => {
  try {
    const eventData = req.body;
    const newEvent = {
      id: (events.length + 1).toString(),
      ...eventData,
      organizerId: req.user.id,
      currentAttendees: 0,
      createdAt: new Date().toISOString()
    };

    events.push(newEvent);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        ...newEvent,
        organizer: {
          id: req.user.id,
          firstName: req.user.email.split('@')[0],
          lastName: 'User'
        }
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
app.put('/api/events/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const eventIndex = events.findIndex(e => e.id === id);

    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const updatedEvent = {
      ...events[eventIndex],
      ...req.body,
      id // Ensure ID doesn't change
    };

    events[eventIndex] = updatedEvent;

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: {
        ...updatedEvent,
        organizer: {
          id: updatedEvent.organizerId,
          firstName: 'Admin',
          lastName: 'User'
        }
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
app.delete('/api/events/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const eventIndex = events.findIndex(e => e.id === id);

    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    events.splice(eventIndex, 1);

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

// Dashboard endpoint
app.get('/api/analytics/overview', authenticate, (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totals: {
          events: events.length,
          users: users.length,
          registrations: 45,
          revenue: 14955.00
        },
        recentActivity: {
          events: events.slice(0, 5).map(event => ({
            id: event.id,
            title: event.title,
            createdAt: event.createdAt
          })),
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

// Registration endpoints
app.get('/api/registrations', authenticate, (req, res) => {
  try {
    // Return registrations with event and user details
    const registrationsWithDetails = registrations.map(reg => {
      const event = events.find(e => e.id === reg.eventId);
      const user = users.find(u => u.id === reg.userId);
      const ticket = tickets.find(t => t.id === reg.ticketId);

      return {
        ...reg,
        event: event ? {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          venue: event.venue
        } : null,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        } : null,
        ticket: ticket || null
      };
    });

    res.json({
      success: true,
      data: {
        registrations: registrationsWithDetails,
        pagination: {
          page: 1,
          limit: 50,
          total: registrations.length,
          pages: 1
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

app.post('/api/registrations', authenticate, (req, res) => {
  try {
    const { eventId, ticketId, firstName, lastName, email, phone } = req.body;

    // Validate required fields
    if (!eventId || !ticketId || !firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }

    // Check if event exists
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if ticket exists and belongs to event
    const ticket = tickets.find(t => t.id === ticketId && t.eventId === eventId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found'
      });
    }

    // Check if tickets are available
    if (ticket.quantitySold >= ticket.quantityAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Tickets sold out'
      });
    }

    // Create registration
    const registration = {
      id: (registrations.length + 1).toString(),
      eventId,
      userId: req.user.id,
      ticketId,
      firstName,
      lastName,
      email,
      phone: phone || '',
      registrationDate: new Date().toISOString(),
      status: 'pending',
      paymentStatus: 'pending',
      totalPaid: 0,
      currency: ticket.currency,
      qrCode: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      checkedIn: false,
      checkedInAt: null
    };

    registrations.push(registration);

    // Update ticket sales
    ticket.quantitySold += 1;

    // Update event attendees
    event.currentAttendees += 1;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        ...registration,
        event: {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          venue: event.venue
        },
        ticket: {
          id: ticket.id,
          name: ticket.name,
          price: ticket.price,
          currency: ticket.currency
        }
      }
    });
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

app.get('/api/registrations/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const registration = registrations.find(r => r.id === id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    // Get related data
    const event = events.find(e => e.id === registration.eventId);
    const user = users.find(u => u.id === registration.userId);
    const ticket = tickets.find(t => t.id === registration.ticketId);

    res.json({
      success: true,
      data: {
        ...registration,
        event: event || null,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        } : null,
        ticket: ticket || null
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

app.post('/api/registrations/:id/checkin', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const registrationIndex = registrations.findIndex(r => r.id === id);
    if (registrationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }
    const updated = { ...registrations[registrationIndex], status: 'checked_in', checkedIn: true, checkedInAt: new Date().toISOString() };
    registrations[registrationIndex] = updated;
    const event = events.find(e => e.id === updated.eventId) || null;
    const user = users.find(u => u.id === updated.userId) || null;
    const ticket = tickets.find(t => t.id === updated.ticketId) || null;
    res.json({
      success: true,
      message: 'Attendee checked in successfully',
      data: {
        ...updated,
        event,
        user: user ? { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } : null,
        ticket
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/communications', authenticate, (req, res) => {
  res.json({ success: true, data: communications });
});

app.get('/api/communications/:id', authenticate, (req, res) => {
  const c = communications.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: c });
});

app.post('/api/communications', authenticate, (req, res) => {
  const { subject, type, recipientType, content, eventId, customRecipients = [], scheduledAt } = req.body;
  const id = String(communications.length + 1);
  const created = {
    id,
    subject: subject || '',
    type: type || 'email',
    recipientType: recipientType || 'all',
    content: content || '',
    event: eventId ? { id: eventId, title: (events.find(e => e.id === eventId) || {}).title || '' } : undefined,
    scheduledAt: scheduledAt || null,
    sentAt: null,
    status: scheduledAt ? 'scheduled' : 'draft',
    createdAt: new Date().toISOString(),
    stats: {
      totalRecipients: Array.isArray(customRecipients) ? customRecipients.length : 0,
      sentCount: 0,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
    },
  };
  communications.push(created);
  res.status(201).json({ success: true, data: created });
});

app.put('/api/communications/:id', authenticate, (req, res) => {
  const idx = communications.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  const current = communications[idx];
  const updated = { ...current, ...req.body };
  communications[idx] = updated;
  res.json({ success: true, data: updated });
});

app.delete('/api/communications/:id', authenticate, (req, res) => {
  const idx = communications.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  communications.splice(idx, 1);
  res.json({ success: true, message: 'Deleted' });
});

app.post('/api/communications/:id/schedule', authenticate, (req, res) => {
  const idx = communications.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  communications[idx].scheduledAt = req.body.scheduledAt || new Date().toISOString();
  communications[idx].status = 'scheduled';
  res.json({ success: true, data: communications[idx] });
});

app.post('/api/communications/:id/send', authenticate, (req, res) => {
  const idx = communications.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  const c = communications[idx];
  let total = 0;
  if (c.recipientType === 'all') {
    total = registrations.length;
  } else if (c.recipientType === 'event' && c.event?.id) {
    total = registrations.filter(r => r.eventId === c.event.id).length;
  }
  communications[idx] = {
    ...c,
    status: 'sent',
    sentAt: new Date().toISOString(),
    stats: {
      totalRecipients: total || c.stats.totalRecipients,
      sentCount: total || c.stats.sentCount,
      deliveredCount: total || c.stats.deliveredCount,
      openedCount: Math.min(total, Math.floor((total || 10) * 0.6)),
      clickedCount: Math.min(total, Math.floor((total || 10) * 0.2)),
    }
  };
  res.json({ success: true, message: 'Sent', data: communications[idx] });
});

// Tickets endpoints
app.get('/api/events/:eventId/tickets', authenticate, (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Get tickets for this event
    const eventTickets = tickets.filter(t => t.eventId === eventId);

    res.json({
      success: true,
      data: {
        tickets: eventTickets,
        eventId: event.id,
        eventTitle: event.title
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
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
  console.log(`🚀 Event Management Demo Server is running!`);
  console.log(`📊 Server URL: http://localhost:${PORT}`);
  console.log(`🔑 Admin login: admin@example.com / admin123`);
  console.log(`🌐 Frontend should be available at: http://localhost:3000`);
});

module.exports = app;
