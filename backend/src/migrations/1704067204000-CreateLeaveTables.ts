import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeaveTables1704067204000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Leave types
    await queryRunner.query(`
      CREATE TABLE leave.leave_types (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(20) UNIQUE,
        description TEXT,
        color VARCHAR(7) DEFAULT '#1976d2', -- For calendar display
        is_paid BOOLEAN DEFAULT true,
        requires_approval BOOLEAN DEFAULT true,
        requires_document BOOLEAN DEFAULT false,
        max_days_per_year DECIMAL(5, 2),
        min_days_notice INT, -- Minimum days notice required
        max_consecutive_days INT, -- Maximum consecutive days allowed
        is_carry_forward BOOLEAN DEFAULT false,
        carry_forward_max_days DECIMAL(5, 2),
        is_encashable BOOLEAN DEFAULT false,
        gender_specific VARCHAR(10), -- null, male, female
        is_statutory BOOLEAN DEFAULT false, -- SSP, SMP, SPP
        is_active BOOLEAN DEFAULT true,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Leave policies
    await queryRunner.query(`
      CREATE TABLE leave.leave_policies (
        id BIGSERIAL PRIMARY KEY,
        leave_type_id BIGINT NOT NULL REFERENCES leave.leave_types(id) ON DELETE CASCADE,
        policy_name VARCHAR(100) NOT NULL,

        -- Accrual rules
        accrual_type VARCHAR(20) DEFAULT 'annual', -- annual, monthly, per_payroll
        accrual_amount DECIMAL(5, 2) NOT NULL, -- Days accrued per period
        accrual_starts_from VARCHAR(20) DEFAULT 'joining_date', -- joining_date, financial_year

        -- Eligibility
        min_service_months INT DEFAULT 0,
        applicable_employment_types TEXT[], -- ['FullTime', 'PartTime']

        -- Pro-rata for part-time
        is_pro_rata BOOLEAN DEFAULT true,

        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Leave balances (per employee per leave type)
    await queryRunner.query(`
      CREATE TABLE leave.leave_balances (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        leave_type_id BIGINT NOT NULL REFERENCES leave.leave_types(id) ON DELETE CASCADE,
        year INT NOT NULL,

        -- Balance
        total_allocated DECIMAL(5, 2) DEFAULT 0,
        used DECIMAL(5, 2) DEFAULT 0,
        pending DECIMAL(5, 2) DEFAULT 0, -- Requested but not approved
        available DECIMAL(5, 2) DEFAULT 0,
        carried_forward DECIMAL(5, 2) DEFAULT 0,
        encashed DECIMAL(5, 2) DEFAULT 0,

        -- Dates
        balance_as_of_date DATE DEFAULT CURRENT_DATE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(employee_id, leave_type_id, year)
      )
    `);

    // Leave requests
    await queryRunner.query(`
      CREATE TABLE leave.leave_requests (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        leave_type_id BIGINT NOT NULL REFERENCES leave.leave_types(id),

        -- Dates
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days DECIMAL(5, 2) NOT NULL,
        is_half_day BOOLEAN DEFAULT false,
        half_day_period VARCHAR(10), -- first_half, second_half

        -- Request details
        reason TEXT,
        emergency_contact_during_leave VARCHAR(255),

        -- Status
        status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        -- Approval workflow
        approved_by BIGINT REFERENCES admin.users(id),
        approved_at TIMESTAMP,
        rejected_by BIGINT REFERENCES admin.users(id),
        rejected_at TIMESTAMP,
        rejection_reason TEXT,
        cancelled_at TIMESTAMP,
        cancellation_reason TEXT,

        -- Admin notes
        admin_notes TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Leave attachments (sick notes, etc)
    await queryRunner.query(`
      CREATE TABLE leave.leave_attachments (
        id BIGSERIAL PRIMARY KEY,
        leave_request_id BIGINT NOT NULL REFERENCES leave.leave_requests(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Leave calendar (for team view)
    await queryRunner.query(`
      CREATE TABLE leave.leave_calendar (
        id BIGSERIAL PRIMARY KEY,
        leave_request_id BIGINT NOT NULL REFERENCES leave.leave_requests(id) ON DELETE CASCADE,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        leave_date DATE NOT NULL,
        is_half_day BOOLEAN DEFAULT false,
        half_day_period VARCHAR(10),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(leave_request_id, leave_date)
      )
    `);

    // Leave approval workflow (for multi-level approval)
    await queryRunner.query(`
      CREATE TABLE leave.leave_approval_workflow (
        id BIGSERIAL PRIMARY KEY,
        leave_request_id BIGINT NOT NULL REFERENCES leave.leave_requests(id) ON DELETE CASCADE,
        approver_id BIGINT NOT NULL REFERENCES admin.users(id),
        approval_level INT NOT NULL, -- 1, 2, 3... (sequential)
        status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, skipped
        approved_at TIMESTAMP,
        rejected_at TIMESTAMP,
        rejection_reason TEXT,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Leave encashment requests
    await queryRunner.query(`
      CREATE TABLE leave.leave_encashments (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        leave_type_id BIGINT NOT NULL REFERENCES leave.leave_types(id),
        year INT NOT NULL,
        days_to_encash DECIMAL(5, 2) NOT NULL,
        amount DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, processed
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_by BIGINT REFERENCES admin.users(id),
        approved_at TIMESTAMP,
        processed_at TIMESTAMP,
        payslip_id BIGINT, -- Link to payroll.payslips
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Leave carry forward records
    await queryRunner.query(`
      CREATE TABLE leave.leave_carry_forwards (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        leave_type_id BIGINT NOT NULL REFERENCES leave.leave_types(id),
        from_year INT NOT NULL,
        to_year INT NOT NULL,
        days_carried DECIMAL(5, 2) NOT NULL,
        expires_on DATE,
        is_expired BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX idx_leave_balances_employee ON leave.leave_balances(employee_id, year)`);
    await queryRunner.query(`CREATE INDEX idx_leave_requests_employee ON leave.leave_requests(employee_id, start_date DESC)`);
    await queryRunner.query(`CREATE INDEX idx_leave_requests_status ON leave.leave_requests(status, requested_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_leave_calendar_date ON leave.leave_calendar(leave_date, employee_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS leave.leave_carry_forwards CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS leave.leave_encashments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS leave.leave_approval_workflow CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS leave.leave_calendar CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS leave.leave_attachments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS leave.leave_requests CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS leave.leave_balances CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS leave.leave_policies CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS leave.leave_types CASCADE`);
  }
}
