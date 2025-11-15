import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/typeorm.config';
import { OrganizationSeeder } from './organization.seeder';
import { RolesSeeder } from './roles.seeder';
import { DepartmentsSeeder } from './departments.seeder';
import { EmployeesSeeder } from './employees.seeder';

export async function runSeeders(clear: boolean = false) {
  const dataSource: DataSource = AppDataSource;

  try {
    // Initialize connection
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    console.log('\n🌱 Starting database seeding...\n');

    const seeders = [
      new OrganizationSeeder(dataSource),
      new RolesSeeder(dataSource),
      new DepartmentsSeeder(dataSource),
      new EmployeesSeeder(dataSource),
    ];

    if (clear) {
      console.log('🗑️  Clearing existing data...\n');
      // Clear in reverse order to avoid FK constraints
      for (const seeder of seeders.reverse()) {
        await seeder.clear();
      }
      seeders.reverse(); // Reverse back to original order
      console.log('\n');
    }

    // Run seeders in order
    for (const seeder of seeders) {
      await seeder.seed();
      console.log('');
    }

    console.log('✅ Database seeding completed successfully!\n');

    // Print test credentials
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Test Credentials');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Admin User:');
    console.log('  Email: admin@acmeretail.co.uk');
    console.log('  Password: Test123!');
    console.log('');
    console.log('HR User:');
    console.log('  Email: hr@acmeretail.co.uk');
    console.log('  Password: Test123!');
    console.log('');
    console.log('Manager User:');
    console.log('  Email: manager@acmeretail.co.uk');
    console.log('  Password: Test123!');
    console.log('');
    console.log('Employee User:');
    console.log('  Email: employee@acmeretail.co.uk');
    console.log('  Password: Test123!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  const clearFlag = process.argv.includes('--clear') || process.argv.includes('-c');

  runSeeders(clearFlag)
    .then(() => {
      console.log('👍 Seeding complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding error:', error);
      process.exit(1);
    });
}
