#!/usr/bin/env node

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await pool.query('DELETE FROM communication_logs');
    await pool.query('DELETE FROM communications');
    await pool.query('DELETE FROM checkins');
    await pool.query('DELETE FROM analytics_ticket_performance');
    await pool.query('DELETE FROM analytics_traffic_sources');
    await pool.query('DELETE FROM analytics_events');
    await pool.query('DELETE FROM registrations');
    await pool.query('DELETE FROM tickets');
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM users WHERE email != $1', ['admin@example.com']);

    // Create default super admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminId = uuidv4();

    await pool.query(`
      INSERT INTO users (id, email, password, first_name, last_name, role, is_active, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO NOTHING
    `, [
      adminId,
      'admin@example.com',
      adminPassword,
      'Super',
      'Admin',
      'super_admin',
      true,
      true
    ]);

    // Create event managers
    const eventManagerIds = [];
    for (let i = 1; i <= 3; i++) {
      const managerPassword = await bcrypt.hash('manager123', 12);
      const managerId = uuidv4();

      await pool.query(`
        INSERT INTO users (id, email, password, first_name, last_name, role, is_active, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        managerId,
        `manager${i}@example.com`,
        managerPassword,
        `Event`,
        `Manager${i}`,
        'event_manager',
        true,
        true
      ]);

      eventManagerIds.push(managerId);
    }

    // Create check-in staff
    const staffIds = [];
    for (let i = 1; i <= 5; i++) {
      const staffPassword = await bcrypt.hash('staff123', 12);
      const staffId = uuidv4();

      await pool.query(`
        INSERT INTO users (id, email, password, first_name, last_name, role, is_active, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        staffId,
        `staff${i}@example.com`,
        staffPassword,
        `Staff`,
        `Member${i}`,
        'checkin_staff',
        true,
        true
      ]);

      staffIds.push(staffId);
    }

    // Create sample events
    const events = [];
    for (let i = 1; i <= 10; i++) {
      const eventId = uuidv4();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (i * 15)); // Events spaced 15 days apart

      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 6); // 6-hour events

      await pool.query(`
        INSERT INTO events (
          id, title, description, short_description, organizer_id,
          venue_name, venue_address, venue_city, venue_country,
          start_date, end_date, max_attendees, status, is_featured,
          tags, registration_deadline, contact_email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        eventId,
        `Tech Conference ${i}`,
        `This is a comprehensive technology conference featuring the latest trends in software development, AI, and digital transformation. Join industry leaders for workshops, keynotes, and networking sessions.`,
        `A premier tech conference with workshops and networking`,
        eventManagerIds[i % 3], // Rotate through event managers
        `Tech Hub Convention Center ${i}`,
        `123 Innovation Street, Suite ${i * 100}`,
        i % 2 === 0 ? 'San Francisco' : 'New York',
        'United States',
        startDate,
        endDate,
        500 + (i * 50),
        i <= 3 ? 'published' : i <= 7 ? 'draft' : 'published',
        i <= 5,
        ['technology', 'conference', 'networking', i % 2 === 0 ? 'AI' : 'development'],
        new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before event
        `contact@event${i}.example.com`
      ]);

      events.push(eventId);
    }

    // Create tickets for events
    for (const eventId of events) {
      // General Admission
      await pool.query(`
        INSERT INTO tickets (event_id, name, description, type, price, quantity_available, quantity_sold)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        eventId,
        'General Admission',
        'Standard access to all conference sessions and networking areas',
        'general',
        299.00,
        300,
        Math.floor(Math.random() * 150)
      ]);

      // VIP
      await pool.query(`
        INSERT INTO tickets (event_id, name, description, type, price, quantity_available, quantity_sold, benefits)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        eventId,
        'VIP Pass',
        'Premium access including keynote sessions, VIP lounge, and exclusive networking events',
        'vip',
        599.00,
        50,
        Math.floor(Math.random() * 30),
        ['Priority seating', 'VIP lounge access', 'Exclusive networking', 'Complimentary lunch']
      ]);

      // Early Bird (if event is in the future)
      const eventStart = new Date();
      eventStart.setDate(eventStart.getDate() + 30);

      if (Math.random() > 0.5) {
        await pool.query(`
          INSERT INTO tickets (event_id, name, description, type, price, early_bird_price, early_bird_deadline, quantity_available, quantity_sold)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          eventId,
          'Early Bird',
          'Special discounted rate for early registrants',
          'early_bird',
          299.00,
          199.00,
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          100,
          Math.floor(Math.random() * 60)
        ]);
      }
    }

    console.log('Database seeding completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('Super Admin: admin@example.com / admin123');
    console.log('Event Managers: manager[1-3]@example.com / manager123');
    console.log('Staff: staff[1-5]@example.com / staff123');

    // Close database connection
    await pool.end();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };