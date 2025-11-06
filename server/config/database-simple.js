const Database = require('better-sqlite3');
const path = require('path');

// Create in-memory SQLite database for demo
const db = new Database(':memory:');

console.log('SQLite database created in memory');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const createTables = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'event_manager',
      phone TEXT,
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      email_verified INTEGER DEFAULT 0,
      last_login TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      short_description TEXT,
      organizer_id TEXT NOT NULL,
      venue_name TEXT NOT NULL,
      venue_address TEXT NOT NULL,
      venue_city TEXT NOT NULL,
      venue_state TEXT,
      venue_country TEXT NOT NULL,
      venue_postal_code TEXT,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      timezone TEXT DEFAULT 'UTC',
      max_attendees INTEGER,
      current_attendees INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      is_featured INTEGER DEFAULT 0,
      featured_image_url TEXT,
      tags TEXT,
      custom_fields TEXT,
      registration_deadline DATETIME,
      checkin_enabled INTEGER DEFAULT 1,
      requires_approval INTEGER DEFAULT 0,
      social_links TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizer_id) REFERENCES users (id)
    )
  `);

  // Tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'general',
      price REAL NOT NULL DEFAULT 0.00,
      currency TEXT DEFAULT 'USD',
      quantity_available INTEGER,
      quantity_sold INTEGER DEFAULT 0,
      sales_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sales_end DATETIME,
      min_purchase INTEGER DEFAULT 1,
      max_purchase INTEGER DEFAULT 10,
      is_active INTEGER DEFAULT 1,
      requires_approval INTEGER DEFAULT 0,
      benefits TEXT,
      restrictions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
    )
  `);

  // Registrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      ticket_id TEXT NOT NULL,
      user_id TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      job_title TEXT,
      dietary_restrictions TEXT,
      special_requirements TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      total_amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_id TEXT,
      registration_code TEXT UNIQUE NOT NULL,
      qr_code_url TEXT,
      ticket_url TEXT,
      checked_in_at DATETIME,
      checked_in_by TEXT,
      custom_field_values TEXT,
      referral_source TEXT,
      marketing_consent INTEGER DEFAULT 0,
      email_notifications INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
      FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
      FOREIGN KEY (checked_in_by) REFERENCES users (id)
    )
  `);

  console.log('Database tables created successfully');
};

// Initialize database
createTables();

// Mock data for demonstration
const seedData = () => {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  // Create admin user
  const adminId = uuidv4();
  const hashedPassword = bcrypt.hashSync('admin123', 12);

  db.prepare(`
    INSERT INTO users (id, email, password, first_name, last_name, role, is_active, email_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    adminId,
    'admin@example.com',
    hashedPassword,
    'Admin',
    'User',
    'super_admin',
    1,
    1
  );

  // Create sample event
  const eventId = uuidv4();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 30); // 30 days from now
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 6); // 6-hour event

  db.prepare(`
    INSERT INTO events (
      id, title, description, short_description, organizer_id,
      venue_name, venue_address, venue_city, venue_country,
      start_date, end_date, max_attendees, status, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    eventId,
    'Tech Conference 2024',
    'Join us for an amazing technology conference featuring the latest trends in AI, web development, and digital transformation.',
    'Premier tech conference with workshops and networking',
    adminId,
    'Convention Center',
    '123 Main Street',
    'San Francisco',
    'United States',
    startDate.toISOString(),
    endDate.toISOString(),
    500,
    'published',
    JSON.stringify(['technology', 'conference', 'networking', 'AI'])
  );

  // Create sample ticket
  const ticketId = uuidv4();
  db.prepare(`
    INSERT INTO tickets (id, event_id, name, description, type, price, quantity_available, quantity_sold)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ticketId,
    eventId,
    'General Admission',
    'Standard access to all conference sessions',
    'general',
    299.00,
    300,
    45
  );

  console.log('Sample data seeded successfully');
};

seedData();

// Database helper functions
const query = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.all(...params);
    return { rows: result };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

const get = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.get(...params);
    return result;
  } catch (error) {
    console.error('Database get error:', error);
    throw error;
  }
};

const run = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return result;
  } catch (error) {
    console.error('Database run error:', error);
    throw error;
  }
};

module.exports = {
  query,
  get,
  run,
  db
};