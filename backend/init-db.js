const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function initDb() {
  console.log('Reading schema.sql...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  
  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Connecting to PostgreSQL and executing schema...');
    await pool.query(schemaSql);
    
    console.log('✅ Database initialized successfully! All tables, indexes, and constraints created.');
  } catch (err) {
    console.error('❌ Failed to initialize database:');
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

initDb();
