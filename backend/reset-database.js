const { Client } = require('pg');
require('dotenv').config();

async function resetDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default postgres DB
  });

  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL');

    // Terminate existing connections
    console.log('📝 Terminating existing connections to complihr database...');
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'complihr'
        AND pid <> pg_backend_pid()
    `);

    // Drop database
    console.log('🗑️  Dropping complihr database...');
    await client.query('DROP DATABASE IF EXISTS complihr');

    // Recreate database
    console.log('📝 Creating fresh complihr database...');
    await client.query('CREATE DATABASE complihr');

    await client.end();
    console.log('✅ Database reset complete!');
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

resetDatabase();
