import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRetailTables1704067207000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tills configuration
    await queryRunner.query(`
      CREATE TABLE retail.tills (
        id BIGSERIAL PRIMARY KEY,
        till_number VARCHAR(20) NOT NULL UNIQUE,
        till_name VARCHAR(100),
        location VARCHAR(100),
        department_id BIGINT REFERENCES core.departments(id),
        is_active BOOLEAN DEFAULT true,
        is_self_checkout BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Till assignments (daily till assignments to employees)
    await queryRunner.query(`
      CREATE TABLE retail.till_assignments (
        id BIGSERIAL PRIMARY KEY,
        till_id BIGINT NOT NULL REFERENCES retail.tills(id),
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        shift_id BIGINT REFERENCES time_tracking.shifts(id),
        assignment_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME,

        -- Float management
        opening_float DECIMAL(10, 2),
        closing_float DECIMAL(10, 2),
        expected_float DECIMAL(10, 2),
        variance DECIMAL(10, 2) DEFAULT 0,

        -- Sales data
        total_sales DECIMAL(12, 2),
        total_transactions INT,
        cash_sales DECIMAL(10, 2),
        card_sales DECIMAL(10, 2),
        refunds DECIMAL(10, 2),
        voids DECIMAL(10, 2),

        -- Reconciliation
        is_reconciled BOOLEAN DEFAULT false,
        reconciled_at TIMESTAMP,
        reconciled_by BIGINT REFERENCES admin.users(id),
        variance_reason TEXT,

        -- Accuracy (for performance KPIs)
        scanning_errors INT DEFAULT 0,
        till_accuracy_percentage DECIMAL(5, 2),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(till_id, assignment_date, employee_id)
      )
    `);

    // Break compliance tracking (UK 6+ hour rule)
    await queryRunner.query(`
      CREATE TABLE retail.break_compliance (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        shift_id BIGINT REFERENCES time_tracking.shifts(id),
        shift_date DATE NOT NULL,

        -- Shift duration
        shift_start_time TIME NOT NULL,
        shift_end_time TIME,
        total_shift_hours DECIMAL(4, 2),

        -- Break entitlement (UK law: 20 mins for 6+ hours)
        entitled_to_break BOOLEAN DEFAULT false,
        minimum_break_minutes INT DEFAULT 20,

        -- Break taken
        break_taken BOOLEAN DEFAULT false,
        break_start_time TIME,
        break_end_time TIME,
        break_duration_minutes INT,

        -- Compliance
        is_compliant BOOLEAN DEFAULT true,
        non_compliance_reason TEXT,

        -- Alerts
        alert_sent BOOLEAN DEFAULT false,
        alert_sent_at TIMESTAMP,
        alert_sent_to BIGINT REFERENCES admin.users(id),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(employee_id, shift_date, shift_id)
      )
    `);

    // Food safety certifications
    await queryRunner.query(`
      CREATE TABLE retail.food_safety_certifications (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        certification_type VARCHAR(50) NOT NULL, -- Level 1, Level 2, Level 3, Allergen Awareness
        certification_number VARCHAR(100),
        issuing_body VARCHAR(255),
        issue_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        is_expired BOOLEAN DEFAULT false,

        -- Document
        certificate_url TEXT,

        -- Renewal alerts
        renewal_alert_90_days BOOLEAN DEFAULT false,
        renewal_alert_30_days BOOLEAN DEFAULT false,
        renewal_requested BOOLEAN DEFAULT false,
        renewal_request_date DATE,

        -- Status
        status VARCHAR(20) DEFAULT 'active', -- active, expired, suspended, renewed

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Food safety training records
    await queryRunner.query(`
      CREATE TABLE retail.food_safety_training (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        training_course VARCHAR(255) NOT NULL,
        training_provider VARCHAR(255),
        training_date DATE NOT NULL,
        completion_status VARCHAR(20) DEFAULT 'completed', -- enrolled, in_progress, completed, failed
        score DECIMAL(5, 2),
        pass_mark DECIMAL(5, 2) DEFAULT 80.00,
        passed BOOLEAN,
        certificate_issued BOOLEAN DEFAULT false,
        certificate_id BIGINT REFERENCES retail.food_safety_certifications(id),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Age-restricted product authorizations (Challenge 25)
    await queryRunner.query(`
      CREATE TABLE retail.age_restricted_products (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

        -- Authorization
        is_authorized BOOLEAN DEFAULT false,
        authorization_date DATE,
        authorized_by BIGINT REFERENCES admin.users(id),

        -- Training
        challenge_25_training_completed BOOLEAN DEFAULT false,
        training_date DATE,
        training_expiry_date DATE,

        -- Products authorized for
        alcohol BOOLEAN DEFAULT false,
        tobacco BOOLEAN DEFAULT false,
        knives BOOLEAN DEFAULT false,
        lottery BOOLEAN DEFAULT false,

        -- Status
        status VARCHAR(20) DEFAULT 'pending', -- pending, authorized, suspended, revoked
        suspension_reason TEXT,
        suspended_at TIMESTAMP,
        suspended_by BIGINT REFERENCES admin.users(id),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // POS transactions (imported from POS system for productivity tracking)
    await queryRunner.query(`
      CREATE TABLE retail.pos_transactions (
        id BIGSERIAL PRIMARY KEY,
        transaction_id VARCHAR(100) NOT NULL UNIQUE, -- From POS system
        till_id BIGINT REFERENCES retail.tills(id),
        employee_id BIGINT REFERENCES core.employees(id),
        transaction_date DATE NOT NULL,
        transaction_time TIME NOT NULL,

        -- Transaction details
        transaction_type VARCHAR(20) NOT NULL, -- sale, refund, void
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(20), -- cash, card, contactless, mobile

        -- Items
        total_items INT DEFAULT 0,
        items_scanned INT DEFAULT 0,
        items_keyed INT DEFAULT 0,

        -- Performance metrics
        transaction_duration_seconds INT,
        items_per_minute DECIMAL(5, 2),

        -- Errors
        scan_errors INT DEFAULT 0,
        void_items INT DEFAULT 0,

        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Labour forecasts (weekly labour cost predictions)
    await queryRunner.query(`
      CREATE TABLE retail.labour_forecasts (
        id BIGSERIAL PRIMARY KEY,
        forecast_week_start DATE NOT NULL,
        forecast_week_end DATE NOT NULL,
        department_id BIGINT REFERENCES core.departments(id),

        -- Forecasted hours
        forecasted_hours DECIMAL(10, 2) NOT NULL,
        forecasted_staff_count INT,

        -- Forecasted costs
        average_hourly_rate DECIMAL(10, 2),
        forecasted_labour_cost DECIMAL(12, 2) NOT NULL,

        -- Sales forecast (for productivity ratio)
        forecasted_sales DECIMAL(12, 2),
        labour_percentage DECIMAL(5, 2), -- Labour cost as % of sales

        -- Actual (after the week)
        actual_hours DECIMAL(10, 2),
        actual_labour_cost DECIMAL(12, 2),
        actual_sales DECIMAL(12, 2),
        variance DECIMAL(12, 2),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Labour budgets (department budgets)
    await queryRunner.query(`
      CREATE TABLE retail.labour_budgets (
        id BIGSERIAL PRIMARY KEY,
        department_id BIGINT NOT NULL REFERENCES core.departments(id),
        budget_year INT NOT NULL,
        budget_month INT NOT NULL,

        -- Budget
        budgeted_hours DECIMAL(10, 2) NOT NULL,
        budgeted_cost DECIMAL(12, 2) NOT NULL,
        budgeted_sales DECIMAL(12, 2),
        target_labour_percentage DECIMAL(5, 2),

        -- Actual
        actual_hours DECIMAL(10, 2) DEFAULT 0,
        actual_cost DECIMAL(12, 2) DEFAULT 0,
        actual_sales DECIMAL(12, 2) DEFAULT 0,

        -- Variance
        hours_variance DECIMAL(10, 2),
        cost_variance DECIMAL(12, 2),
        percentage_variance DECIMAL(5, 2),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id),

        UNIQUE(department_id, budget_year, budget_month)
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX idx_till_assignments_employee_date ON retail.till_assignments(employee_id, assignment_date DESC)`);
    await queryRunner.query(`CREATE INDEX idx_break_compliance_employee ON retail.break_compliance(employee_id, shift_date DESC)`);
    await queryRunner.query(`CREATE INDEX idx_break_compliance_non_compliant ON retail.break_compliance(is_compliant) WHERE is_compliant = false`);
    await queryRunner.query(`CREATE INDEX idx_food_safety_certs_employee ON retail.food_safety_certifications(employee_id, expiry_date)`);
    await queryRunner.query(`CREATE INDEX idx_food_safety_certs_expiry ON retail.food_safety_certifications(expiry_date) WHERE is_expired = false`);
    await queryRunner.query(`CREATE INDEX idx_pos_transactions_employee ON retail.pos_transactions(employee_id, transaction_date DESC)`);
    await queryRunner.query(`CREATE INDEX idx_labour_forecasts_week ON retail.labour_forecasts(forecast_week_start, department_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS retail.labour_budgets CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS retail.labour_forecasts CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS retail.pos_transactions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS retail.age_restricted_products CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS retail.food_safety_training CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS retail.food_safety_certifications CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS retail.break_compliance CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS retail.till_assignments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS retail.tills CASCADE`);
  }
}
