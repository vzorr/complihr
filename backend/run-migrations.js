const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'complihr',
  synchronize: false,
  logging: true,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});

async function runMigrations() {
  try {
    console.log('🔌 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    console.log('\n📝 Running migrations...');
    const migrations = await AppDataSource.runMigrations({ transaction: 'all' });

    if (migrations.length === 0) {
      console.log('✅ No migrations to run - database is up to date');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        console.log(`   - ${migration.name}`);
      });
    }

    await AppDataSource.destroy();
    console.log('\n✅ Migration process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

runMigrations();
