import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublicIdsAndOrgSettings1704067209000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // =====================================================
    // 1. Add public_id UUID columns to all main tables
    // =====================================================

    // Admin schema
    await queryRunner.query(`
      ALTER TABLE admin.users
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE admin.roles
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE admin.organizations
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE admin.permissions
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    // Add organization code for ID patterns
    await queryRunner.query(`
      ALTER TABLE admin.organizations
      ADD COLUMN IF NOT EXISTS code VARCHAR(10) UNIQUE
    `);

    // Set default codes for existing organizations (can be changed later)
    await queryRunner.query(`
      UPDATE admin.organizations
      SET code = UPPER(LEFT(name, 3)) || LPAD(id::text, 3, '0')
      WHERE code IS NULL
    `);

    // Core schema
    await queryRunner.query(`
      ALTER TABLE core.employees
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE core.departments
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE core.designations
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    // Payroll schema
    await queryRunner.query(`
      ALTER TABLE payroll.payslips
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE payroll.pay_periods
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    // Leave schema
    await queryRunner.query(`
      ALTER TABLE leave.leave_requests
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE leave.leave_types
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    // Time tracking schema
    await queryRunner.query(`
      ALTER TABLE time_tracking.shifts
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE time_tracking.attendance_records
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    // Expenses schema
    await queryRunner.query(`
      ALTER TABLE expenses.expense_claims
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE expenses.expense_categories
      ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
    `);

    // Create indexes for fast UUID lookups
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_public_id ON admin.users(public_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_employees_public_id ON core.employees(public_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_departments_public_id ON core.departments(public_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_payslips_public_id ON payroll.payslips(public_id)`);

    // =====================================================
    // 2. Organization Settings for ID Pattern Configuration
    // =====================================================

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS admin.organization_settings (
        id BIGSERIAL PRIMARY KEY,
        organization_id BIGINT,

        -- ID Pattern Configuration
        employee_id_pattern VARCHAR(100) DEFAULT '{ORG}-EMP-{YEAR}-{SEQUENCE:5}',
        employee_id_sequence INT DEFAULT 0,

        payroll_id_pattern VARCHAR(100) DEFAULT '{ORG}-PAY-{YEAR}{MONTH}-{SEQUENCE:4}',
        payroll_id_sequence INT DEFAULT 0,

        leave_id_pattern VARCHAR(100) DEFAULT '{ORG}-LV-{YEAR}-{SEQUENCE:4}',
        leave_id_sequence INT DEFAULT 0,

        expense_id_pattern VARCHAR(100) DEFAULT '{ORG}-EXP-{YEAR}-{SEQUENCE:4}',
        expense_id_sequence INT DEFAULT 0,

        shift_id_pattern VARCHAR(100) DEFAULT '{ORG}-SH-{YYYYMMDD}-{SEQUENCE:3}',
        shift_id_sequence INT DEFAULT 0,

        department_code_pattern VARCHAR(100) DEFAULT '{ORG}-DEPT-{SEQUENCE:3}',
        department_code_sequence INT DEFAULT 0,

        -- Other Settings
        fiscal_year_start_month INT DEFAULT 4, -- April (UK tax year)
        default_currency VARCHAR(3) DEFAULT 'GBP',
        timezone VARCHAR(50) DEFAULT 'Europe/London',
        date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',

        -- Payroll Settings
        payroll_frequency VARCHAR(20) DEFAULT 'Monthly', -- Weekly, Fortnightly, Monthly
        payroll_day_of_month INT DEFAULT 28,

        -- Leave Settings
        leave_year_start_month INT DEFAULT 1, -- January
        carry_forward_enabled BOOLEAN DEFAULT true,
        max_carry_forward_days INT DEFAULT 5,

        -- Working Time Settings
        standard_working_hours_per_day DECIMAL(4,2) DEFAULT 8.00,
        standard_working_days_per_week INT DEFAULT 5,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(organization_id)
      )
    `);

    // =====================================================
    // 3. ID Sequences Table (for atomic sequence generation)
    // =====================================================

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS admin.id_sequences (
        id BIGSERIAL PRIMARY KEY,
        organization_id BIGINT,
        sequence_type VARCHAR(50) NOT NULL, -- employee, payroll, leave, expense, etc.
        year INT NOT NULL,
        month INT, -- NULL for non-monthly sequences
        current_value INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(organization_id, sequence_type, year, month)
      )
    `);

    // Create index for fast sequence lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_id_sequences_lookup
      ON admin.id_sequences(organization_id, sequence_type, year, month)
    `);

    // =====================================================
    // 4. Function to generate next sequence value
    // =====================================================

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION admin.get_next_sequence_value(
        p_org_id BIGINT,
        p_type VARCHAR,
        p_year INT,
        p_month INT DEFAULT NULL
      )
      RETURNS INT
      LANGUAGE plpgsql
      AS $$
      DECLARE
        v_next_value INT;
      BEGIN
        -- Insert or update sequence
        INSERT INTO admin.id_sequences (organization_id, sequence_type, year, month, current_value)
        VALUES (p_org_id, p_type, p_year, p_month, 1)
        ON CONFLICT (organization_id, sequence_type, year, month)
        DO UPDATE SET
          current_value = admin.id_sequences.current_value + 1,
          updated_at = CURRENT_TIMESTAMP
        RETURNING current_value INTO v_next_value;

        RETURN v_next_value;
      END;
      $$;
    `);

    // =====================================================
    // 5. Insert default organization settings
    // =====================================================

    // Note: For single-organization deployment, we insert a default settings record
    // In multi-org setup, this should reference actual organization records
    await queryRunner.query(`
      INSERT INTO admin.organization_settings (organization_id)
      VALUES (1)
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Added public_id UUIDs to all main tables');
    console.log('✅ Created organization settings table');
    console.log('✅ Created ID sequence management system');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS admin.get_next_sequence_value`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS admin.id_sequences`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.organization_settings`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS admin.idx_users_public_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS core.idx_employees_public_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS core.idx_departments_public_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS payroll.idx_payslips_public_id`);

    // Remove public_id columns
    await queryRunner.query(`ALTER TABLE admin.users DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE admin.roles DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE admin.organizations DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE admin.permissions DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE core.employees DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE core.departments DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE core.designations DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE payroll.payslips DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE payroll.pay_periods DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE leave.leave_requests DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE leave.leave_types DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE time_tracking.shifts DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE time_tracking.attendance_records DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE expenses.expense_claims DROP COLUMN IF EXISTS public_id`);
    await queryRunner.query(`ALTER TABLE expenses.expense_categories DROP COLUMN IF EXISTS public_id`);
  }
}
