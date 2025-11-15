import { AppDataSource } from './src/config/typeorm.config';
import { seedAll } from './src/database/seeders/seed-all';

async function runSeed() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    await seedAll(AppDataSource);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📝 Default Admin User:');
    console.log('   Email: admin@complihr.com');
    console.log('   Password: Admin@123');
    console.log('   ⚠️  Please change this password immediately!\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
