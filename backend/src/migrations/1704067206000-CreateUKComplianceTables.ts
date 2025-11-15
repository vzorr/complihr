import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUKComplianceTables1704067206000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // PAYE settings (per employee)
    await queryRunner.query(`
      CREATE TABLE uk_compliance.paye_settings (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL UNIQUE REFERENCES core.employees(id) ON DELETE CASCADE,
        tax_code VARCHAR(20) NOT NULL DEFAULT '1257L',
        tax_basis VARCHAR(20) DEFAULT 'cumulative', -- cumulative, week1month1
        is_week1month1 BOOLEAN DEFAULT false,
        student_loan_plan VARCHAR(10), -- plan1, plan2, plan4, postgrad
        postgrad_loan BOOLEAN DEFAULT false,
        effective_from DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Tax bands configuration (changes per tax year)
    await queryRunner.query(`
      CREATE TABLE uk_compliance.tax_bands (
        id BIGSERIAL PRIMARY KEY,
        tax_year VARCHAR(10) NOT NULL, -- 2024/25
        band_name VARCHAR(50) NOT NULL, -- Personal Allowance, Basic Rate, Higher Rate
        lower_limit DECIMAL(12, 2) NOT NULL,
        upper_limit DECIMAL(12, 2),
        tax_rate DECIMAL(5, 4) NOT NULL, -- 0.20 for 20%
        is_current BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // NI categories (A, B, C, H, J, M, etc.)
    await queryRunner.query(`
      CREATE TABLE uk_compliance.ni_categories (
        id BIGSERIAL PRIMARY KEY,
        category VARCHAR(1) NOT NULL UNIQUE, -- A, B, C, H, J, M, V, Z
        description TEXT NOT NULL,
        employee_rate DECIMAL(5, 4) NOT NULL, -- 0.12 for 12%
        employee_rate_above_uel DECIMAL(5, 4), -- 0.02 for 2%
        employer_rate DECIMAL(5, 4) NOT NULL, -- 0.138 for 13.8%
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // NI thresholds (changes per tax year)
    await queryRunner.query(`
      CREATE TABLE uk_compliance.ni_thresholds (
        id BIGSERIAL PRIMARY KEY,
        tax_year VARCHAR(10) NOT NULL,
        threshold_type VARCHAR(50) NOT NULL, -- PT, UEL, ST, LEL, AUST
        weekly_amount DECIMAL(10, 2),
        monthly_amount DECIMAL(10, 2),
        annual_amount DECIMAL(10, 2),
        description TEXT,
        is_current BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // RTI (Real Time Information) submissions to HMRC
    await queryRunner.query(`
      CREATE TABLE uk_compliance.rti_submissions (
        id BIGSERIAL PRIMARY KEY,
        submission_type VARCHAR(10) NOT NULL, -- FPS, EPS, NVR, EAS
        tax_year VARCHAR(10) NOT NULL,
        tax_month INT, -- 1-12 (tax month, April=1)
        payroll_run_id BIGINT REFERENCES payroll.payroll_runs(id),

        -- HMRC details
        hmrc_reference VARCHAR(100), -- Employer PAYE reference
        accounts_office_reference VARCHAR(100),
        submission_id VARCHAR(100), -- Unique submission ID

        -- XML
        xml_content TEXT, -- Full XML payload
        xml_size BIGINT,

        -- Status
        status VARCHAR(20) DEFAULT 'pending', -- pending, submitted, accepted, rejected
        submitted_at TIMESTAMP,
        accepted_at TIMESTAMP,
        rejected_at TIMESTAMP,
        rejection_reason TEXT,
        hmrc_correlation_id VARCHAR(100),

        -- Employee count
        employee_count INT DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // RTI submission employees (which employees in submission)
    await queryRunner.query(`
      CREATE TABLE uk_compliance.rti_submission_employees (
        id BIGSERIAL PRIMARY KEY,
        rti_submission_id BIGINT NOT NULL REFERENCES uk_compliance.rti_submissions(id) ON DELETE CASCADE,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id),
        payslip_id BIGINT REFERENCES payroll.payslips(id),

        -- Employee details for submission
        works_number VARCHAR(50), -- Employee number
        nino VARCHAR(9), -- National Insurance Number
        surname VARCHAR(100),
        forename VARCHAR(100),

        -- Payment details
        gross_pay DECIMAL(10, 2),
        paye_tax DECIMAL(10, 2),
        ni_employee DECIMAL(10, 2),
        ni_employer DECIMAL(10, 2),
        student_loan DECIMAL(10, 2),
        postgrad_loan DECIMAL(10, 2),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Statutory Sick Pay (SSP)
    await queryRunner.query(`
      CREATE TABLE uk_compliance.statutory_sick_pay (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        absence_start_date DATE NOT NULL,
        absence_end_date DATE,

        -- SSP eligibility
        is_eligible BOOLEAN DEFAULT false,
        ineligibility_reason TEXT,

        -- Qualifying days
        qualifying_days INT DEFAULT 0,
        waiting_days INT DEFAULT 3, -- First 3 days not paid
        payable_days INT DEFAULT 0,

        -- Payment
        daily_ssp_rate DECIMAL(10, 2),
        total_ssp_amount DECIMAL(10, 2),

        -- Link to payslip
        payslip_id BIGINT REFERENCES payroll.payslips(id),

        -- Status
        status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid
        approved_by BIGINT REFERENCES admin.users(id),
        approved_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Statutory Maternity Pay (SMP)
    await queryRunner.query(`
      CREATE TABLE uk_compliance.statutory_maternity_pay (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        expected_week_of_birth DATE NOT NULL,
        maternity_leave_start_date DATE NOT NULL,
        maternity_leave_end_date DATE,

        -- SMP eligibility
        is_eligible BOOLEAN DEFAULT false,
        average_weekly_earnings DECIMAL(10, 2),
        qualifying_weeks_employed INT,

        -- Payment periods
        higher_rate_weeks INT DEFAULT 6,
        standard_rate_weeks INT DEFAULT 33,
        total_weeks INT DEFAULT 39,
        higher_rate_amount DECIMAL(10, 2),
        standard_rate_amount DECIMAL(10, 2),
        total_smp_amount DECIMAL(10, 2),

        -- Payment schedule
        payments_made INT DEFAULT 0,
        total_paid DECIMAL(10, 2) DEFAULT 0,
        remaining_amount DECIMAL(10, 2),

        status VARCHAR(20) DEFAULT 'pending',
        approved_by BIGINT REFERENCES admin.users(id),
        approved_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Statutory Paternity Pay (SPP)
    await queryRunner.query(`
      CREATE TABLE uk_compliance.statutory_paternity_pay (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        expected_week_of_birth DATE NOT NULL,
        paternity_leave_start_date DATE NOT NULL,
        paternity_leave_end_date DATE,

        -- SPP eligibility
        is_eligible BOOLEAN DEFAULT false,
        average_weekly_earnings DECIMAL(10, 2),

        -- Payment
        weeks_claimed INT DEFAULT 2, -- 1 or 2 weeks
        weekly_rate DECIMAL(10, 2),
        total_spp_amount DECIMAL(10, 2),

        -- Link to payslip
        payslip_id BIGINT REFERENCES payroll.payslips(id),

        status VARCHAR(20) DEFAULT 'pending',
        approved_by BIGINT REFERENCES admin.users(id),
        approved_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Student loan deductions
    await queryRunner.query(`
      CREATE TABLE uk_compliance.student_loan_deductions (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        loan_plan VARCHAR(10) NOT NULL, -- plan1, plan2, plan4, postgrad
        threshold_annual DECIMAL(10, 2) NOT NULL,
        deduction_rate DECIMAL(5, 4) NOT NULL, -- 0.09 for 9%
        is_active BOOLEAN DEFAULT true,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Pension auto-enrolment
    await queryRunner.query(`
      CREATE TABLE uk_compliance.pension_auto_enrolment (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL UNIQUE REFERENCES core.employees(id) ON DELETE CASCADE,

        -- Eligibility
        is_eligible BOOLEAN DEFAULT false,
        eligibility_check_date DATE,
        age_at_check INT,
        annual_earnings DECIMAL(10, 2),

        -- Enrolment status
        enrolment_status VARCHAR(20) DEFAULT 'not_enrolled', -- not_enrolled, enrolled, opted_out, ceased
        enrolment_date DATE,
        opt_out_date DATE,
        opt_out_reason TEXT,
        re_enrolment_due_date DATE,

        -- Pension scheme
        pension_scheme_name VARCHAR(255),
        pension_provider VARCHAR(255),
        pension_reference VARCHAR(100),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Pension contributions
    await queryRunner.query(`
      CREATE TABLE uk_compliance.pension_contributions (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        payslip_id BIGINT REFERENCES payroll.payslips(id),
        contribution_month DATE NOT NULL,

        -- Earnings
        qualifying_earnings DECIMAL(10, 2),

        -- Employee contribution
        employee_contribution_percentage DECIMAL(5, 2) DEFAULT 5.00,
        employee_contribution_amount DECIMAL(10, 2),

        -- Employer contribution
        employer_contribution_percentage DECIMAL(5, 2) DEFAULT 3.00,
        employer_contribution_amount DECIMAL(10, 2),

        -- Total
        total_contribution DECIMAL(10, 2),

        -- Payment to scheme
        payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid
        payment_reference VARCHAR(100),
        paid_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Pension opt-outs tracking
    await queryRunner.query(`
      CREATE TABLE uk_compliance.pension_opt_outs (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        opt_out_date DATE NOT NULL,
        opt_out_reason TEXT,
        refund_amount DECIMAL(10, 2),
        refund_paid BOOLEAN DEFAULT false,
        refund_paid_at TIMESTAMP,
        re_enrolment_due_date DATE, -- Must re-enrol every 3 years
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // P60 records (annual)
    await queryRunner.query(`
      CREATE TABLE uk_compliance.p60_records (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        tax_year VARCHAR(10) NOT NULL, -- 2024/25

        -- Totals for the year
        total_gross_pay DECIMAL(15, 2),
        total_paye_tax DECIMAL(15, 2),
        total_ni_employee DECIMAL(15, 2),
        total_ni_employer DECIMAL(15, 2),
        total_student_loan DECIMAL(15, 2),
        total_pension_employee DECIMAL(15, 2),
        total_pension_employer DECIMAL(15, 2),

        -- Employee details
        employee_number VARCHAR(50),
        national_insurance_number VARCHAR(9),
        tax_code VARCHAR(20),

        -- PDF
        p60_pdf_url TEXT,
        generated_at TIMESTAMP,
        sent_to_employee_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),

        UNIQUE(employee_id, tax_year)
      )
    `);

    // P45 records (when leaving)
    await queryRunner.query(`
      CREATE TABLE uk_compliance.p45_records (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        leaving_date DATE NOT NULL,
        tax_year VARCHAR(10) NOT NULL,

        -- Part 1A - For employee (employment details)
        employee_number VARCHAR(50),
        national_insurance_number VARCHAR(9),
        surname VARCHAR(100),
        forenames VARCHAR(100),
        date_of_birth DATE,
        gender VARCHAR(1),

        -- Part 1A - Tax details
        tax_code VARCHAR(20),
        tax_basis VARCHAR(20),
        week1_month1 BOOLEAN,

        -- Part 1A - Pay and tax in this employment
        total_gross_pay DECIMAL(15, 2),
        total_paye_tax DECIMAL(15, 2),
        student_loan_deducted DECIMAL(10, 2),

        -- Part 1A - Pay and tax in previous employment (this tax year)
        previous_gross_pay DECIMAL(15, 2),
        previous_paye_tax DECIMAL(15, 2),

        -- PDF
        p45_pdf_url TEXT,
        generated_at TIMESTAMP,
        sent_to_employee_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Minimum wage compliance tracking
    await queryRunner.query(`
      CREATE TABLE uk_compliance.minimum_wage_compliance (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        check_date DATE NOT NULL,

        -- Employee details
        date_of_birth DATE NOT NULL,
        age_at_check INT NOT NULL,

        -- Wage details
        hourly_rate DECIMAL(10, 2) NOT NULL,
        applicable_minimum_wage DECIMAL(10, 2) NOT NULL, -- Based on age
        wage_type VARCHAR(50) NOT NULL, -- national_living_wage, national_minimum_wage

        -- Compliance
        is_compliant BOOLEAN NOT NULL,
        shortfall_per_hour DECIMAL(10, 2) DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Working Time Directive compliance (48-hour week)
    await queryRunner.query(`
      CREATE TABLE uk_compliance.working_time_compliance (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        week_start_date DATE NOT NULL,
        week_end_date DATE NOT NULL,

        -- Hours worked
        total_hours_worked DECIMAL(5, 2) NOT NULL,
        average_hours_17weeks DECIMAL(5, 2), -- Rolling 17-week average

        -- Opt-out
        has_opted_out BOOLEAN DEFAULT false,
        opt_out_date DATE,
        opt_out_expiry_date DATE,

        -- Compliance
        is_compliant BOOLEAN NOT NULL,
        hours_over_limit DECIMAL(5, 2) DEFAULT 0,

        -- Alert
        alert_sent BOOLEAN DEFAULT false,
        alert_sent_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(employee_id, week_start_date)
      )
    `);

    // Holiday pay accruals (12.07% for casual workers)
    await queryRunner.query(`
      CREATE TABLE uk_compliance.holiday_pay_accruals (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        employment_type VARCHAR(20) NOT NULL, -- casual, zero_hours
        accrual_period_start DATE NOT NULL,
        accrual_period_end DATE NOT NULL,

        -- Earnings in period
        gross_earnings DECIMAL(10, 2) NOT NULL,

        -- Holiday pay accrual (12.07% for casual/zero hours)
        accrual_percentage DECIMAL(5, 2) DEFAULT 12.07,
        accrued_holiday_pay DECIMAL(10, 2) NOT NULL,

        -- Payment
        paid_amount DECIMAL(10, 2) DEFAULT 0,
        outstanding_amount DECIMAL(10, 2),
        payslip_id BIGINT REFERENCES payroll.payslips(id),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Right to work checks
    await queryRunner.query(`
      CREATE TABLE uk_compliance.right_to_work_checks (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

        -- Document type
        document_type VARCHAR(50) NOT NULL, -- passport, visa, biometric_card, share_code
        document_number VARCHAR(100),
        issuing_country VARCHAR(2),

        -- Check details
        check_date DATE NOT NULL,
        checked_by BIGINT NOT NULL REFERENCES admin.users(id),
        check_type VARCHAR(20) NOT NULL, -- manual, online
        share_code VARCHAR(50), -- For online checks

        -- Validity
        is_valid BOOLEAN NOT NULL,
        valid_from DATE,
        valid_until DATE,
        is_time_limited BOOLEAN DEFAULT false,

        -- Follow-up
        requires_follow_up BOOLEAN DEFAULT false,
        follow_up_date DATE,
        follow_up_completed BOOLEAN DEFAULT false,

        -- Document storage
        document_copy_url TEXT,

        notes TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Visa expiry tracking
    await queryRunner.query(`
      CREATE TABLE uk_compliance.visa_expiry_tracking (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        visa_type VARCHAR(50) NOT NULL,
        visa_number VARCHAR(100),
        issue_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        is_expired BOOLEAN DEFAULT false,

        -- Alerts
        alert_90_days BOOLEAN DEFAULT false,
        alert_60_days BOOLEAN DEFAULT false,
        alert_30_days BOOLEAN DEFAULT false,
        last_alert_sent_at TIMESTAMP,

        -- Renewal
        renewal_requested BOOLEAN DEFAULT false,
        renewal_request_date DATE,
        new_visa_id BIGINT REFERENCES uk_compliance.visa_expiry_tracking(id),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX idx_paye_settings_employee ON uk_compliance.paye_settings(employee_id)`);
    await queryRunner.query(`CREATE INDEX idx_rti_submissions_tax_year ON uk_compliance.rti_submissions(tax_year, tax_month)`);
    await queryRunner.query(`CREATE INDEX idx_p60_records_employee_year ON uk_compliance.p60_records(employee_id, tax_year)`);
    await queryRunner.query(`CREATE INDEX idx_pension_contributions_employee ON uk_compliance.pension_contributions(employee_id, contribution_month DESC)`);
    await queryRunner.query(`CREATE INDEX idx_working_time_week ON uk_compliance.working_time_compliance(employee_id, week_start_date DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.visa_expiry_tracking CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.right_to_work_checks CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.holiday_pay_accruals CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.working_time_compliance CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.minimum_wage_compliance CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.p45_records CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.p60_records CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.pension_opt_outs CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.pension_contributions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.pension_auto_enrolment CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.student_loan_deductions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.statutory_paternity_pay CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.statutory_maternity_pay CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.statutory_sick_pay CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.rti_submission_employees CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.rti_submissions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.ni_thresholds CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.ni_categories CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.tax_bands CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS uk_compliance.paye_settings CASCADE`);
  }
}
