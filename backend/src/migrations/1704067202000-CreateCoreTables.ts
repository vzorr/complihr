import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreTables1704067202000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Departments table
    await queryRunner.query(`
      CREATE TABLE core.departments (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE,
        description TEXT,
        parent_department_id BIGINT REFERENCES core.departments(id),
        department_head_id BIGINT, -- Will reference employees
        cost_center VARCHAR(50),
        location VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id),
        deleted_at TIMESTAMP
      )
    `);

    // Designations (job titles)
    await queryRunner.query(`
      CREATE TABLE core.designations (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE,
        description TEXT,
        job_description TEXT,
        level INT, -- Junior=1, Mid=2, Senior=3, Lead=4, Manager=5
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id),
        deleted_at TIMESTAMP
      )
    `);

    // Employees table (core employee data)
    await queryRunner.query(`
      CREATE TABLE core.employees (
        id BIGSERIAL PRIMARY KEY,
        employee_number VARCHAR(50) NOT NULL UNIQUE,
        user_id BIGINT REFERENCES admin.users(id) ON DELETE SET NULL,

        -- Personal Information
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        last_name VARCHAR(100) NOT NULL,
        preferred_name VARCHAR(100),
        date_of_birth DATE NOT NULL,
        gender VARCHAR(20),
        nationality VARCHAR(50) DEFAULT 'British',

        -- Contact Information
        personal_email VARCHAR(255),
        work_email VARCHAR(255),
        mobile_phone VARCHAR(20),
        home_phone VARCHAR(20),

        -- Address
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(100),
        county VARCHAR(100),
        postcode VARCHAR(10),
        country VARCHAR(2) DEFAULT 'GB',

        -- Emergency Contact
        emergency_contact_name VARCHAR(255),
        emergency_contact_relationship VARCHAR(50),
        emergency_contact_phone VARCHAR(20),
        emergency_contact_email VARCHAR(255),

        -- Employment Details
        department_id BIGINT REFERENCES core.departments(id),
        designation_id BIGINT REFERENCES core.designations(id),
        reporting_manager_id BIGINT REFERENCES core.employees(id),
        employment_type VARCHAR(20) NOT NULL, -- FullTime, PartTime, Casual, Contract
        employment_status VARCHAR(20) DEFAULT 'Active', -- Active, Probation, Notice, Suspended, Terminated
        date_of_joining DATE NOT NULL,
        probation_end_date DATE,
        confirmation_date DATE,
        date_of_leaving DATE,
        notice_period_days INT DEFAULT 30,

        -- Salary (basic info, detailed in payroll schema)
        salary DECIMAL(15, 2),
        hourly_rate DECIMAL(10, 2),
        currency VARCHAR(3) DEFAULT 'GBP',
        pay_frequency VARCHAR(20) DEFAULT 'Monthly', -- Weekly, Fortnightly, Monthly

        -- Profile
        profile_photo_url TEXT,
        biography TEXT,
        skills TEXT[],
        languages TEXT[],

        -- Audit fields
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id),
        deleted_at TIMESTAMP
      )
    `);

    // Add foreign key for department head (circular reference)
    await queryRunner.query(`
      ALTER TABLE core.departments
      ADD CONSTRAINT fk_departments_head
      FOREIGN KEY (department_head_id) REFERENCES core.employees(id)
    `);

    // Employment details (additional info)
    await queryRunner.query(`
      CREATE TABLE core.employment_details (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL UNIQUE REFERENCES core.employees(id) ON DELETE CASCADE,

        -- Contract details
        contract_type VARCHAR(50),
        contract_start_date DATE,
        contract_end_date DATE,
        contract_document_url TEXT,

        -- Work pattern
        weekly_hours DECIMAL(5, 2) DEFAULT 40.00,
        work_pattern VARCHAR(50), -- Fixed, Flexible, Shift
        is_remote BOOLEAN DEFAULT false,
        office_location VARCHAR(255),

        -- Bank details
        bank_name VARCHAR(100),
        bank_account_number VARCHAR(20),
        bank_sort_code VARCHAR(10),
        bank_account_holder_name VARCHAR(255),

        -- Other
        uniform_size VARCHAR(10),
        parking_space_number VARCHAR(20),
        key_card_number VARCHAR(50),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Emergency contacts (can have multiple)
    await queryRunner.query(`
      CREATE TABLE core.emergency_contacts (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        relationship VARCHAR(50) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        alternate_phone VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employee documents
    await queryRunner.query(`
      CREATE TABLE core.employee_documents (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL, -- CV, Contract, Certificate, ID, etc
        document_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size BIGINT, -- in bytes
        mime_type VARCHAR(100),
        description TEXT,
        upload_date DATE DEFAULT CURRENT_DATE,
        expiry_date DATE,
        is_verified BOOLEAN DEFAULT false,
        verified_by BIGINT REFERENCES admin.users(id),
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Employee notes/comments
    await queryRunner.query(`
      CREATE TABLE core.employee_notes (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        note_type VARCHAR(20) DEFAULT 'general', -- general, warning, achievement, disciplinary
        title VARCHAR(255),
        note TEXT NOT NULL,
        is_private BOOLEAN DEFAULT true, -- Only visible to managers/HR
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT NOT NULL REFERENCES admin.users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Employee work history (previous employers)
    await queryRunner.query(`
      CREATE TABLE core.work_history (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        job_title VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        responsibilities TEXT,
        reason_for_leaving TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employee education
    await queryRunner.query(`
      CREATE TABLE core.education (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        institution_name VARCHAR(255) NOT NULL,
        degree VARCHAR(100) NOT NULL,
        field_of_study VARCHAR(100),
        start_year INT,
        end_year INT,
        grade VARCHAR(50),
        is_completed BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX idx_employees_employee_number ON core.employees(employee_number)`);
    await queryRunner.query(`CREATE INDEX idx_employees_department ON core.employees(department_id) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_employees_status ON core.employees(employment_status) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_employees_manager ON core.employees(reporting_manager_id)`);
    await queryRunner.query(`CREATE INDEX idx_employee_documents_employee ON core.employee_documents(employee_id)`);
    await queryRunner.query(`CREATE INDEX idx_emergency_contacts_employee ON core.emergency_contacts(employee_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core.education CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS core.work_history CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS core.employee_notes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS core.employee_documents CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS core.emergency_contacts CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS core.employment_details CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS core.employees CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS core.designations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS core.departments CASCADE`);
  }
}
