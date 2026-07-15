const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const config = connectionString
  ? {
      connectionString,
      ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'yourpassword',
      database: process.env.DB_NAME || 'campuscred',
    };

const pool = new Pool(config);

async function checkDatabase() {
  console.log('Attempting to connect to PostgreSQL with config:');
  if (connectionString) {
    console.log(`Connection URL: ${connectionString.replace(/:[^:@]+@/, ':***@')}`); // Hide password
  } else {
    console.log(`Host: ${config.host}`);
    console.log(`Port: ${config.port}`);
    console.log(`User: ${config.user}`);
    console.log(`Database: ${config.database}`);
  }
  
  try {
    const client = await pool.connect();
    console.log('\n✅ Successfully connected to PostgreSQL server!');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const res = await client.query(tablesQuery);
    const tables = res.rows.map(r => r.table_name);
    
    console.log(`\nFound ${tables.length} table(s) in public schema:`);
    if (tables.length > 0) {
      tables.forEach(t => console.log(` - ${t}`));
      
      const expectedTables = ['users', 'skills', 'user_skills', 'user_availability', 'sessions', 'transactions', 'reviews', 'messages'];
      const missing = expectedTables.filter(t => !tables.includes(t));
      
      if (missing.length === 0) {
        console.log('\n✅ All CampusCred tables are present and correct!');
      } else {
        console.log(`\n⚠️ Missing tables required by CampusCred: ${missing.join(', ')}`);
        console.log('You should run the init-db.js script to initialize them: node init-db.js');
      }
    } else {
      console.log('\n⚠️ The database is empty. No tables found.');
      console.log('You should run the init-db.js script to initialize them: node init-db.js');
    }
    
    client.release();
  } catch (err) {
    console.error('\n❌ Connection failed. Detailed error:');
    console.error(err.message);
    console.log('\nSuggestions:');
    console.log('1. Make sure PostgreSQL is running locally on your machine (or your cloud URL is correct).');
    console.log('2. Verify the username, password, port, and database name in your backend/.env file.');
    console.log('3. If the database campuscred does not exist yet, you may need to create it first.');
  } finally {
    await pool.end();
  }
}

checkDatabase();
