import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayrollTables1704067205000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Salary components (earnings and deductions)
    await queryRunner.query(`
      CREATE TABLE payroll.salary_components (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        code VARCHAR(20) UNIQUE,
        component_type VARCHAR(20) NOT NULL, -- earning, deduction
        calculation_type VARCHAR(20) NOT NULL, -- fixed, percentage, formula
        default_amount DECIMAL(10, 2),
        percentage DECIMAL(5, 2),
        formula TEXT, -- For complex calculations
        is_taxable BOOLEAN DEFAULT true,
        is_statutory BOOLEAN DEFAULT false, -- SSP, SMP, etc
        affects_gross BOOLEAN DEFAULT true,
        is_pro_rata BOOLEAN DEFAULT false,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Salary structures (templates)
    await queryRunner.query(`
      CREATE TABLE payroll.salary_structures (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        designation_id BIGINT REFERENCES core.designations(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Salary structure components (which components in structure)
    await queryRunner.query(`
      CREATE TABLE payroll.salary_structure_components (
        id BIGSERIAL PRIMARY KEY,
        salary_structure_id BIGINT NOT NULL REFERENCES payroll.salary_structures(id) ON DELETE CASCADE,
        salary_component_id BIGINT NOT NULL REFERENCES payroll.salary_components(id),
        amount DECIMAL(10, 2),
        percentage DECIMAL(5, 2),
        is_variable BOOLEAN DEFAULT false,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employee salary structures (actual assignment)
    await queryRunner.query(`
      CREATE TABLE payroll.employee_salary_structures (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        salary_structure_id BIGINT NOT NULL REFERENCES payroll.salary_structures(id),
        effective_from DATE NOT NULL,
        effective_to DATE,
        base_salary DECIMAL(15, 2) NOT NULL,
        is_current BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Pay periods
    await queryRunner.query(`
      CREATE TABLE payroll.pay_periods (
        id BIGSERIAL PRIMARY KEY,
        period_name VARCHAR(50) NOT NULL, -- January 2024, Week 1 2024
        frequency VARCHAR(20) NOT NULL, -- weekly, fortnightly, monthly
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        pay_date DATE NOT NULL,
        year INT NOT NULL,
        month INT, -- For monthly
        week_number INT, -- For weekly
        is_closed BOOLEAN DEFAULT false,
        closed_at TIMESTAMP,
        closed_by BIGINT REFERENCES admin.users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(start_date, end_date, frequency)
      )
    `);

    // Payroll runs
    await queryRunner.query(`
      CREATE TABLE payroll.payroll_runs (
        id BIGSERIAL PRIMARY KEY,
        pay_period_id BIGINT NOT NULL REFERENCES payroll.pay_periods(id),
        run_name VARCHAR(100) NOT NULL,
        run_type VARCHAR(20) DEFAULT 'regular', -- regular, bonus, final_settlement
        status VARCHAR(20) DEFAULT 'draft', -- draft, processing, completed, cancelled
        total_employees INT DEFAULT 0,
        total_gross_pay DECIMAL(15, 2) DEFAULT 0,
        total_deductions DECIMAL(15, 2) DEFAULT 0,
        total_net_pay DECIMAL(15, 2) DEFAULT 0,
        total_employer_ni DECIMAL(15, 2) DEFAULT 0,
        total_paye_tax DECIMAL(15, 2) DEFAULT 0,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT NOT NULL REFERENCES admin.users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Payslips
    await queryRunner.query(`
      CREATE TABLE payroll.payslips (
        id BIGSERIAL PRIMARY KEY,
        payroll_run_id BIGINT NOT NULL REFERENCES payroll.payroll_runs(id) ON DELETE CASCADE,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        pay_period_id BIGINT NOT NULL REFERENCES payroll.pay_periods(id),

        -- Period
        period_start_date DATE NOT NULL,
        period_end_date DATE NOT NULL,
        payment_date DATE NOT NULL,

        -- Salary details
        base_salary DECIMAL(15, 2) DEFAULT 0,
        gross_pay DECIMAL(15, 2) DEFAULT 0,
        total_deductions DECIMAL(15, 2) DEFAULT 0,
        net_pay DECIMAL(15, 2) DEFAULT 0,

        -- UK specific
        tax_code VARCHAR(20),
        ni_category VARCHAR(1),
        paye_tax DECIMAL(10, 2) DEFAULT 0,
        ni_employee DECIMAL(10, 2) DEFAULT 0,
        ni_employer DECIMAL(10, 2) DEFAULT 0,
        student_loan_deduction DECIMAL(10, 2) DEFAULT 0,
        pension_employee DECIMAL(10, 2) DEFAULT 0,
        pension_employer DECIMAL(10, 2) DEFAULT 0,

        -- Year to date
        ytd_gross DECIMAL(15, 2) DEFAULT 0,
        ytd_paye DECIMAL(15, 2) DEFAULT 0,
        ytd_ni_employee DECIMAL(15, 2) DEFAULT 0,
        ytd_ni_employer DECIMAL(15, 2) DEFAULT 0,

        -- Payment
        payment_method VARCHAR(20) DEFAULT 'bank_transfer',
        payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed
        payment_reference VARCHAR(100),
        paid_at TIMESTAMP,

        -- File
        payslip_pdf_url TEXT,
        generated_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(payroll_run_id, employee_id)
      )
    `);

    // Payslip components (line items on payslip)
    await queryRunner.query(`
      CREATE TABLE payroll.payslip_components (
        id BIGSERIAL PRIMARY KEY,
        payslip_id BIGINT NOT NULL REFERENCES payroll.payslips(id) ON DELETE CASCADE,
        component_id BIGINT REFERENCES payroll.salary_components(id),
        component_name VARCHAR(100) NOT NULL,
        component_type VARCHAR(20) NOT NULL, -- earning, deduction
        amount DECIMAL(10, 2) NOT NULL,
        is_taxable BOOLEAN DEFAULT true,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payment transactions
    await queryRunner.query(`
      CREATE TABLE payroll.payment_transactions (
        id BIGSERIAL PRIMARY KEY,
        payslip_id BIGINT NOT NULL REFERENCES payroll.payslips(id),
        transaction_type VARCHAR(20) DEFAULT 'salary', -- salary, bonus, reimbursement
        amount DECIMAL(15, 2) NOT NULL,
        payment_method VARCHAR(20) NOT NULL, -- bank_transfer, cheque, cash

        -- Bank transfer details
        bank_account_number VARCHAR(20),
        bank_sort_code VARCHAR(10),
        bank_name VARCHAR(100),
        bank_reference VARCHAR(100),

        -- Status
        status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, reversed
        initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        failed_at TIMESTAMP,
        error_message TEXT,

        -- Reversal
        reversed_at TIMESTAMP,
        reversal_reason TEXT,
        reversed_by BIGINT REFERENCES admin.users(id),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Bonuses and adhoc payments
    await queryRunner.query(`
      CREATE TABLE payroll.bonuses (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        bonus_type VARCHAR(50) NOT NULL, -- performance, festival, spot, retention
        amount DECIMAL(10, 2) NOT NULL,
        reason TEXT,
        payment_month DATE, -- Which payslip to include in
        payslip_id BIGINT REFERENCES payroll.payslips(id),
        status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid
        approved_by BIGINT REFERENCES admin.users(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT NOT NULL REFERENCES admin.users(id)
      )
    `);

    // Salary revisions/increments
    await queryRunner.query(`
      CREATE TABLE payroll.salary_revisions (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        previous_salary DECIMAL(15, 2) NOT NULL,
        new_salary DECIMAL(15, 2) NOT NULL,
        increment_amount DECIMAL(10, 2) NOT NULL,
        increment_percentage DECIMAL(5, 2),
        effective_from DATE NOT NULL,
        reason VARCHAR(255), -- annual_increment, promotion, market_adjustment
        remarks TEXT,
        approved_by BIGINT REFERENCES admin.users(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT NOT NULL REFERENCES admin.users(id)
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX idx_payslips_employee ON payroll.payslips(employee_id, payment_date DESC)`);
    await queryRunner.query(`CREATE INDEX idx_payslips_run ON payroll.payslips(payroll_run_id)`);
    await queryRunner.query(`CREATE INDEX idx_payslip_components_payslip ON payroll.payslip_components(payslip_id)`);
    await queryRunner.query(`CREATE INDEX idx_payment_transactions_payslip ON payroll.payment_transactions(payslip_id)`);
    await queryRunner.query(`CREATE INDEX idx_payroll_runs_period ON payroll.payroll_runs(pay_period_id, status)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS payroll.salary_revisions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll.bonuses CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll.payment_transactions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll.payslip_components CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll.payslips CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll.payroll_runs CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll.pay_periods CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll.employee_salary_structures CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll.salary_structure_components CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll.salary_structures CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS payroll.salary_components CASCADE`);
  }
}
