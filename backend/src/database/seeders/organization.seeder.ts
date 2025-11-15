import { DataSource } from 'typeorm';
import { Seeder } from './seeder.interface';

export class OrganizationSeeder implements Seeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      console.log('🏢 Seeding organizations...');

      // Create test organization
      const org = await queryRunner.query(`
        INSERT INTO admin.organizations (
          public_id, name, code, legal_name, registration_number,
          address_line1, city, county, postcode, country,
          phone, email, website, timezone, currency
        ) VALUES (
          gen_random_uuid(),
          'Acme Retail Ltd',
          'ACME',
          'Acme Retail Limited',
          '12345678',
          '123 High Street',
          'London',
          'Greater London',
          'SW1A 1AA',
          'GB',
          '+44 20 7946 0958',
          'info@acmeretail.co.uk',
          'https://acmeretail.co.uk',
          'Europe/London',
          'GBP'
        )
        RETURNING id, public_id, code
      `);

      console.log(`✅ Created organization: ${org[0].code} (ID: ${org[0].id})`);

      // Create organization settings
      await queryRunner.query(`
        INSERT INTO admin.organization_settings (
          organization_id,
          employee_id_pattern,
          payroll_id_pattern,
          leave_id_pattern,
          expense_id_pattern,
          shift_id_pattern,
          department_code_pattern,
          fiscal_year_start_month,
          default_currency,
          timezone,
          date_format,
          payroll_frequency,
          payroll_day_of_month,
          leave_year_start_month,
          carry_forward_enabled,
          max_carry_forward_days,
          standard_working_hours_per_day,
          standard_working_days_per_week
        ) VALUES (
          ${org[0].id},
          '{ORG}-EMP-{YEAR}-{SEQUENCE:5}',
          '{ORG}-PAY-{YEAR}{MONTH}-{SEQUENCE:4}',
          '{ORG}-LV-{YEAR}-{SEQUENCE:4}',
          '{ORG}-EXP-{YEAR}-{SEQUENCE:4}',
          '{ORG}-SH-{YYYYMMDD}-{SEQUENCE:3}',
          '{ORG}-DEPT-{SEQUENCE:3}',
          4,
          'GBP',
          'Europe/London',
          'DD/MM/YYYY',
          'Monthly',
          28,
          1,
          true,
          5,
          8.00,
          5
        )
      `);

      console.log('✅ Created organization settings');

      // Store org ID for other seeders
      // Create a regular table (not TEMP) so it persists across sessions for E2E tests
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS seeder_context (
          key VARCHAR(50) PRIMARY KEY,
          value TEXT
        )
      `);

      await queryRunner.query(`
        INSERT INTO seeder_context (key, value)
        VALUES ('organization_id', '${org[0].id}')
        ON CONFLICT (key) DO UPDATE SET value = '${org[0].id}'
      `);

    } catch (error) {
      console.error('❌ Error seeding organizations:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async clear(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      console.log('🗑️  Clearing organizations...');

      await queryRunner.query(`DELETE FROM admin.organization_settings`);
      await queryRunner.query(`DELETE FROM admin.organizations`);

      // Clear the seeder context table if it exists
      await queryRunner.query(`
        DROP TABLE IF EXISTS seeder_context
      `);

      console.log('✅ Organizations cleared');
    } catch (error) {
      console.error('❌ Error clearing organizations:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
