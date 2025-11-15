import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePerformanceExpensesComplianceAuditTables1704067208000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // =====================
    // PERFORMANCE SCHEMA
    // =====================

    // Review templates (for monthly reviews)
    await queryRunner.query(`
      CREATE TABLE performance.review_templates (
        id BIGSERIAL PRIMARY KEY,
        template_name VARCHAR(100) NOT NULL,
        description TEXT,
        review_type VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, annual, probation
        department_id BIGINT REFERENCES core.departments(id),

        -- Template structure (JSON with criteria)
        template_structure JSONB NOT NULL,

        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Monthly reviews (for retail staff)
    await queryRunner.query(`
      CREATE TABLE performance.monthly_reviews (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        reviewer_id BIGINT NOT NULL REFERENCES admin.users(id),
        review_template_id BIGINT REFERENCES performance.review_templates(id),
        review_month INT NOT NULL, -- 1-12
        review_year INT NOT NULL,

        -- Retail KPIs
        attendance_rating SMALLINT CHECK (attendance_rating BETWEEN 1 AND 5),
        punctuality_rating SMALLINT CHECK (punctuality_rating BETWEEN 1 AND 5),
        customer_service_rating SMALLINT CHECK (customer_service_rating BETWEEN 1 AND 5),
        till_accuracy_rating SMALLINT CHECK (till_accuracy_rating BETWEEN 1 AND 5),
        teamwork_rating SMALLINT CHECK (teamwork_rating BETWEEN 1 AND 5),
        product_knowledge_rating SMALLINT CHECK (product_knowledge_rating BETWEEN 1 AND 5),

        -- Overall
        overall_rating DECIMAL(3, 2), -- Average of all ratings
        performance_status VARCHAR(20) DEFAULT 'satisfactory', -- excellent, good, satisfactory, needs_improvement, unsatisfactory

        -- Comments
        strengths TEXT,
        areas_for_improvement TEXT,
        action_points TEXT,
        manager_comments TEXT,
        employee_comments TEXT,

        -- Goals
        previous_goals_achieved BOOLEAN,
        new_goals TEXT,

        -- Status
        status VARCHAR(20) DEFAULT 'draft', -- draft, completed, acknowledged
        completed_at TIMESTAMP,
        acknowledged_by_employee BOOLEAN DEFAULT false,
        acknowledged_at TIMESTAMP,

        -- Signatures
        reviewer_signature TEXT,
        employee_signature TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(employee_id, review_year, review_month)
      )
    `);

    // KPI definitions (configurable retail KPIs)
    await queryRunner.query(`
      CREATE TABLE performance.kpi_definitions (
        id BIGSERIAL PRIMARY KEY,
        kpi_name VARCHAR(100) NOT NULL,
        kpi_code VARCHAR(20) UNIQUE,
        description TEXT,
        kpi_category VARCHAR(50) NOT NULL, -- productivity, quality, customer_service, attendance
        measurement_unit VARCHAR(20), -- percentage, count, currency, time
        calculation_formula TEXT,
        target_value DECIMAL(10, 2),
        weight_percentage DECIMAL(5, 2), -- Weight in overall performance
        is_active BOOLEAN DEFAULT true,
        department_id BIGINT REFERENCES core.departments(id),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Employee KPIs (actual KPI values)
    await queryRunner.query(`
      CREATE TABLE performance.employee_kpis (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        kpi_definition_id BIGINT NOT NULL REFERENCES performance.kpi_definitions(id),
        measurement_period DATE NOT NULL, -- Monthly period

        -- Values
        target_value DECIMAL(10, 2),
        actual_value DECIMAL(10, 2),
        achievement_percentage DECIMAL(5, 2),
        variance DECIMAL(10, 2),

        -- Status
        status VARCHAR(20) DEFAULT 'on_track', -- on_track, at_risk, off_track, exceeded

        -- Comments
        comments TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(employee_id, kpi_definition_id, measurement_period)
      )
    `);

    // =====================
    // EXPENSES SCHEMA
    // =====================

    // Expense categories
    await queryRunner.query(`
      CREATE TABLE expenses.expense_categories (
        id BIGSERIAL PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL UNIQUE,
        category_code VARCHAR(20) UNIQUE,
        description TEXT,
        parent_category_id BIGINT REFERENCES expenses.expense_categories(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Expense policies
    await queryRunner.query(`
      CREATE TABLE expenses.expense_policies (
        id BIGSERIAL PRIMARY KEY,
        policy_name VARCHAR(100) NOT NULL,
        description TEXT,
        expense_category_id BIGINT REFERENCES expenses.expense_categories(id),

        -- Limits
        max_amount_per_claim DECIMAL(10, 2),
        max_amount_per_day DECIMAL(10, 2),
        max_amount_per_month DECIMAL(10, 2),

        -- Requirements
        requires_receipt BOOLEAN DEFAULT true,
        receipt_threshold_amount DECIMAL(10, 2),

        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Expense approval workflows
    await queryRunner.query(`
      CREATE TABLE expenses.expense_approval_workflows (
        id BIGSERIAL PRIMARY KEY,
        workflow_name VARCHAR(100) NOT NULL,
        description TEXT,

        -- Approval levels
        approval_levels JSONB NOT NULL, -- Array of approval levels with approver roles

        -- Amount-based routing
        min_amount DECIMAL(10, 2),
        max_amount DECIMAL(10, 2),

        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Expense claims
    await queryRunner.query(`
      CREATE TABLE expenses.expense_claims (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        claim_number VARCHAR(50) NOT NULL UNIQUE,
        claim_date DATE NOT NULL DEFAULT CURRENT_DATE,

        -- Category
        expense_category_id BIGINT NOT NULL REFERENCES expenses.expense_categories(id),

        -- Details
        description TEXT NOT NULL,
        expense_date DATE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'GBP',

        -- Receipts
        receipt_urls TEXT[],
        has_receipt BOOLEAN DEFAULT false,

        -- Approval
        status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, paid
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_by BIGINT REFERENCES admin.users(id),
        approved_at TIMESTAMP,
        rejected_by BIGINT REFERENCES admin.users(id),
        rejected_at TIMESTAMP,
        rejection_reason TEXT,

        -- Payment
        payment_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, paid, failed
        paid_at TIMESTAMP,
        payment_reference VARCHAR(100),
        payslip_id BIGINT REFERENCES payroll.payslips(id),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // =====================
    // COMPLIANCE SCHEMA
    // =====================

    // Certifications (general certifications)
    await queryRunner.query(`
      CREATE TABLE compliance.certifications (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        certification_name VARCHAR(255) NOT NULL,
        certification_type VARCHAR(50),
        issuing_organization VARCHAR(255),
        certification_number VARCHAR(100),
        issue_date DATE NOT NULL,
        expiry_date DATE,
        is_perpetual BOOLEAN DEFAULT false,
        is_expired BOOLEAN DEFAULT false,

        -- Document
        certificate_url TEXT,

        -- Verification
        is_verified BOOLEAN DEFAULT false,
        verified_by BIGINT REFERENCES admin.users(id),
        verified_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Training assignments
    await queryRunner.query(`
      CREATE TABLE compliance.training_assignments (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        training_course VARCHAR(255) NOT NULL,
        training_provider VARCHAR(255),
        is_mandatory BOOLEAN DEFAULT false,

        -- Dates
        assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE,
        started_date DATE,
        completed_date DATE,

        -- Status
        status VARCHAR(20) DEFAULT 'assigned', -- assigned, in_progress, completed, failed, cancelled

        assigned_by BIGINT NOT NULL REFERENCES admin.users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Training completions
    await queryRunner.query(`
      CREATE TABLE compliance.training_completions (
        id BIGSERIAL PRIMARY KEY,
        training_assignment_id BIGINT NOT NULL REFERENCES compliance.training_assignments(id) ON DELETE CASCADE,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        completion_date DATE NOT NULL,
        score DECIMAL(5, 2),
        pass_mark DECIMAL(5, 2),
        passed BOOLEAN,
        certificate_url TEXT,
        certificate_id BIGINT REFERENCES compliance.certifications(id),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Compliance logs (audit trail for compliance activities)
    await queryRunner.query(`
      CREATE TABLE compliance.compliance_logs (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT REFERENCES core.employees(id),
        compliance_type VARCHAR(50) NOT NULL, -- training, certification, policy_acknowledgment, etc
        activity VARCHAR(255) NOT NULL,
        description TEXT,
        compliance_data JSONB, -- Flexible JSON field for compliance data
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        logged_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // =====================
    // AUDIT SCHEMA
    // =====================

    // Activity logs (Tier 3 audit logging) - Partitioned by created_at
    await queryRunner.query(`
      CREATE TABLE audit.activity_logs (
        id BIGSERIAL,
        user_id BIGINT REFERENCES admin.users(id),
        employee_id BIGINT REFERENCES core.employees(id),
        action VARCHAR(100) NOT NULL, -- login, logout, create, update, delete, view, export
        resource_type VARCHAR(100), -- employee, payslip, leave_request, etc
        resource_id BIGINT,
        description TEXT,

        -- Request details
        ip_address VARCHAR(45),
        user_agent TEXT,
        device_type VARCHAR(50),

        -- PII tracking
        contains_pii BOOLEAN DEFAULT false,
        pii_fields TEXT[], -- Array of field names containing PII

        -- Additional data
        changes JSONB, -- Before/after values for updates
        metadata JSONB,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (id, created_at)
      ) PARTITION BY RANGE (created_at)
    `);

    // Create partitioned table for activity_logs (partition by month)
    await queryRunner.query(`
      CREATE TABLE audit.activity_logs_y2024m01 PARTITION OF audit.activity_logs
      FOR VALUES FROM ('2024-01-01') TO ('2024-02-01')
    `);

    await queryRunner.query(`
      CREATE TABLE audit.activity_logs_y2024m02 PARTITION OF audit.activity_logs
      FOR VALUES FROM ('2024-02-01') TO ('2024-03-01')
    `);

    // History tables will be created via triggers (Tier 2 audit)
    // For now, we'll create one example for employees
    await queryRunner.query(`
      CREATE TABLE audit.employees_history (
        history_id BIGSERIAL PRIMARY KEY,
        id BIGINT NOT NULL, -- Original employee ID
        employee_number VARCHAR(50),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255),
        salary DECIMAL(15, 2),
        employment_status VARCHAR(20),

        -- History metadata
        history_action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
        history_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        history_user_id BIGINT,
        changed_fields JSONB -- {"salary": {"old": 30000, "new": 35000}}
      )
    `);

    // Retention policies (for GDPR/compliance)
    await queryRunner.query(`
      CREATE TABLE audit.retention_policies (
        id BIGSERIAL PRIMARY KEY,
        table_schema VARCHAR(100) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        retention_years INT NOT NULL,
        reason TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT REFERENCES admin.users(id),
        UNIQUE(table_schema, table_name)
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX idx_monthly_reviews_employee ON performance.monthly_reviews(employee_id, review_year DESC, review_month DESC)`);
    await queryRunner.query(`CREATE INDEX idx_employee_kpis_employee ON performance.employee_kpis(employee_id, measurement_period DESC)`);
    await queryRunner.query(`CREATE INDEX idx_expense_claims_employee ON expenses.expense_claims(employee_id, claim_date DESC)`);
    await queryRunner.query(`CREATE INDEX idx_expense_claims_status ON expenses.expense_claims(status, submitted_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_certifications_employee ON compliance.certifications(employee_id, expiry_date)`);
    await queryRunner.query(`CREATE INDEX idx_activity_logs_user ON audit.activity_logs(user_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_activity_logs_resource ON audit.activity_logs(resource_type, resource_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_activity_logs_action ON audit.activity_logs(action, created_at DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Audit
    await queryRunner.query(`DROP TABLE IF EXISTS audit.retention_policies CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit.employees_history CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit.activity_logs_y2024m02 CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit.activity_logs_y2024m01 CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit.activity_logs CASCADE`);

    // Compliance
    await queryRunner.query(`DROP TABLE IF EXISTS compliance.compliance_logs CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS compliance.training_completions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS compliance.training_assignments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS compliance.certifications CASCADE`);

    // Expenses
    await queryRunner.query(`DROP TABLE IF EXISTS expenses.expense_claims CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS expenses.expense_approval_workflows CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS expenses.expense_policies CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS expenses.expense_categories CASCADE`);

    // Performance
    await queryRunner.query(`DROP TABLE IF EXISTS performance.employee_kpis CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS performance.kpi_definitions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS performance.monthly_reviews CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS performance.review_templates CASCADE`);
  }
}
