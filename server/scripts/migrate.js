#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Get executed migrations
    const result = await pool.query('SELECT filename FROM migrations ORDER BY filename');
    const executedMigrations = result.rows.map(row => row.filename);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        console.log(`Running migration: ${file}`);

        const filePath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(filePath, 'utf8');

        try {
          await pool.query('BEGIN');

          // Execute migration
          await pool.query(migrationSQL);

          // Record migration
          await pool.query(
            'INSERT INTO migrations (filename) VALUES ($1)',
            [file]
          );

          await pool.query('COMMIT');
          console.log(`✓ Migration ${file} completed successfully`);
        } catch (error) {
          await pool.query('ROLLBACK');
          console.error(`✗ Migration ${file} failed:`, error.message);
          throw error;
        }
      } else {
        console.log(`- Skipping ${file} (already executed)`);
      }
    }

    console.log('All migrations completed successfully!');

    // Close database connection
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };