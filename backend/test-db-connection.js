const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default postgres DB first
  });

  try {
    console.log('🔌 Attempting to connect to PostgreSQL...');
    console.log(`   Host: ${client.host}`);
    console.log(`   Port: ${client.port}`);
    console.log(`   User: ${client.user}`);

    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL!');

    // Check if complihr database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'complihr'"
    );

    if (res.rows.length > 0) {
      console.log('✅ Database "complihr" already exists');
    } else {
      console.log('📝 Database "complihr" does not exist. Creating...');
      await client.query('CREATE DATABASE complihr');
      console.log('✅ Database "complihr" created successfully!');
    }

    await client.end();
    console.log('✅ Connection test completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error('\nPlease ensure:');
    console.error('1. PostgreSQL is installed and running');
    console.error('2. Database credentials in .env are correct');
    console.error('3. PostgreSQL is accepting connections on localhost:5432');
    await client.end().catch(() => {});
    return false;
  }
}

testConnection();
