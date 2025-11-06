const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Creating tables...');
    await db.query(schema);
    console.log('✅ Tables created successfully');

    // Read and execute seed data
    const seedPath = path.join(__dirname, 'seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');

    console.log('Inserting seed data...');
    await db.query(seed);
    console.log('✅ Seed data inserted successfully');

    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };