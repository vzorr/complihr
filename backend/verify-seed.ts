import { AppDataSource } from './src/config/typeorm.config';

async function verifySeed() {
  try {
    console.log('🔍 Verifying database seed data...\n');
    await AppDataSource.initialize();

    // Check permissions
    const permissionCount = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM admin.permissions;`,
    );
    console.log(`✅ Permissions: ${permissionCount[0].count}`);

    // Check roles
    const roleCount = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM admin.roles WHERE deleted_at IS NULL;`,
    );
    console.log(`✅ Roles: ${roleCount[0].count}`);

    // Check users
    const userCount = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM admin.users WHERE deleted_at IS NULL;`,
    );
    console.log(`✅ Users: ${userCount[0].count}`);

    // Check admin user
    const adminUser = await AppDataSource.query(
      `SELECT email, first_name, last_name, is_active FROM admin.users WHERE email = 'admin@complihr.com';`,
    );
    if (adminUser.length > 0) {
      console.log(`✅ Admin User: ${adminUser[0].email} (${adminUser[0].first_name} ${adminUser[0].last_name})`);
    }

    // Check organization settings
    const orgSettings = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM admin.organization_settings;`,
    );
    console.log(`✅ Organization Settings: ${orgSettings[0].count}`);

    // Check leave types
    const leaveTypes = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM leave.leave_types;`,
    );
    console.log(`✅ Leave Types: ${leaveTypes[0].count}`);

    // Check expense categories
    const expenseCategories = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM expenses.expense_categories;`,
    );
    console.log(`✅ Expense Categories: ${expenseCategories[0].count}`);

    // Check departments
    const departments = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM core.departments;`,
    );
    console.log(`✅ Departments: ${departments[0].count}`);

    // Check designations
    const designations = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM core.designations;`,
    );
    console.log(`✅ Designations: ${designations[0].count}`);

    await AppDataSource.destroy();
    console.log('\n🎉 Database verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifySeed();
