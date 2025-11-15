const { Client } = require('pg');
require('dotenv').config();

async function verifyDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'complihr',
  });

  try {
    await client.connect();
    console.log('✅ Connected to CompliHR database\n');

    // Get all schemas
    const schemasResult = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
      ORDER BY schema_name
    `);

    console.log('📁 Created Schemas:');
    schemasResult.rows.forEach(row => {
      console.log(`   - ${row.schema_name}`);
    });
    console.log(`   Total: ${schemasResult.rows.length} schemas\n`);

    // Get table count per schema
    const tablesResult = await client.query(`
      SELECT
        table_schema,
        COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
        AND table_type = 'BASE TABLE'
      GROUP BY table_schema
      ORDER BY table_schema
    `);

    console.log('📊 Tables per Schema:');
    let totalTables = 0;
    for (const row of tablesResult.rows) {
      console.log(`   ${row.table_schema}: ${row.table_count} tables`);
      totalTables += parseInt(row.table_count);
    }
    console.log(`   Total: ${totalTables} tables\n`);

    // List all UK compliance tables
    const ukComplianceResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'uk_compliance'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('🇬🇧 UK Compliance Tables:');
    ukComplianceResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log(`   Total: ${ukComplianceResult.rows.length} tables\n`);

    // List all retail tables
    const retailResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'retail'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('🛒 Retail-Specific Tables:');
    retailResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log(`   Total: ${retailResult.rows.length} tables\n`);

    // Check partitioned tables
    const partitionsResult = await client.query(`
      SELECT
        schemaname,
        tablename
      FROM pg_tables
      WHERE schemaname = 'audit'
        AND tablename LIKE '%partition%' OR tablename LIKE '%_y%m%'
      ORDER BY tablename
    `);

    if (partitionsResult.rows.length > 0) {
      console.log('📅 Partitioned Tables:');
      partitionsResult.rows.forEach(row => {
        console.log(`   - ${row.schemaname}.${row.tablename}`);
      });
      console.log(`   Total: ${partitionsResult.rows.length} partitions\n`);
    }

    // Check migrations ran successfully
    const migrationsResult = await client.query(`
      SELECT name, timestamp
      FROM migrations
      ORDER BY timestamp
    `);

    console.log('✅ Migrations Executed:');
    migrationsResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.name}`);
    });
    console.log(`   Total: ${migrationsResult.rows.length} migrations\n`);

    await client.end();
    console.log('🎉 Database verification completed successfully!');
    console.log('\n📌 Summary:');
    console.log(`   - ${schemasResult.rows.length} schemas created`);
    console.log(`   - ${totalTables} tables created`);
    console.log(`   - ${ukComplianceResult.rows.length} UK compliance tables`);
    console.log(`   - ${retailResult.rows.length} retail-specific tables`);
    console.log(`   - ${migrationsResult.rows.length} migrations executed`);

  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

verifyDatabase();
