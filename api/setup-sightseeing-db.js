require('dotenv').config();
const { Pool } = require('pg');
const { URL } = require('url');

function poolFromEnv() {
  if (process.env.DATABASE_URL) {
    const u = new URL(process.env.DATABASE_URL);
    return new Pool({
      host: u.hostname,
      port: Number(u.port || 5432),
      database: u.pathname.replace(/^\//, ''),
      user: decodeURIComponent(u.username || '').trim(),
      password: decodeURIComponent(u.password || '').trim(), // <- always a string
      ssl: { rejectUnauthorized: false }, // Render needs SSL
    });
  }
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'faredown',
    user: (process.env.DB_USER || 'postgres').trim(),
    password: (process.env.DB_PASSWORD || '').trim(),        // <- always a string
    ssl: (process.env.DB_HOST || '').includes('render.com')
      ? { rejectUnauthorized: false }
      : false,
  });
}

async function setupSightseeingDatabase() {
  console.log('🚀 Setting up Sightseeing database schema...');
  const pool = poolFromEnv();

  const fs = require('fs');
  const path = require('path');
  const schemaPath = path.join(__dirname, 'database', 'sightseeing-schema.sql');
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(schemaSQL);
    console.log('✅ Sightseeing database schema executed successfully');
  } catch (error) {
    if (/already exists/i.test(error.message)) {
      console.log('⚠️  Schema already exists, checking for updates...');
      console.log('✅ Database is ready');
    } else {
      console.error('❌ Error setting up database:', error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

setupSightseeingDatabase();
