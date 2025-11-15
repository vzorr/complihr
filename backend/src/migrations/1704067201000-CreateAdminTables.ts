import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminTables1704067201000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Organizations table
    await queryRunner.query(`
      CREATE TABLE admin.organizations (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        legal_name VARCHAR(255),
        registration_number VARCHAR(50),
        vat_number VARCHAR(20),
        logo_url TEXT,
        primary_color VARCHAR(7) DEFAULT '#1976d2',
        secondary_color VARCHAR(7) DEFAULT '#dc004e',
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(100),
        county VARCHAR(100),
        postcode VARCHAR(10),
        country VARCHAR(2) DEFAULT 'GB',
        phone VARCHAR(20),
        email VARCHAR(255),
        website VARCHAR(255),
        timezone VARCHAR(50) DEFAULT 'Europe/London',
        date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
        currency VARCHAR(3) DEFAULT 'GBP',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);

    // Users table (for authentication)
    await queryRunner.query(`
      CREATE TABLE admin.users (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        last_login_at TIMESTAMP,
        last_login_ip VARCHAR(45),
        failed_login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP,
        password_changed_at TIMESTAMP,
        must_change_password BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT,
        updated_by BIGINT,
        deleted_at TIMESTAMP
      )
    `);

    // Roles table (RBAC)
    await queryRunner.query(`
      CREATE TABLE admin.roles (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        is_system_role BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id),
        deleted_at TIMESTAMP
      )
    `);

    // Permissions table
    await queryRunner.query(`
      CREATE TABLE admin.permissions (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        module VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Role-Permission mapping (many-to-many)
    await queryRunner.query(`
      CREATE TABLE admin.role_permissions (
        role_id BIGINT NOT NULL REFERENCES admin.roles(id) ON DELETE CASCADE,
        permission_id BIGINT NOT NULL REFERENCES admin.permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    // User-Role mapping (many-to-many)
    await queryRunner.query(`
      CREATE TABLE admin.user_roles (
        user_id BIGINT NOT NULL REFERENCES admin.users(id) ON DELETE CASCADE,
        role_id BIGINT NOT NULL REFERENCES admin.roles(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        PRIMARY KEY (user_id, role_id)
      )
    `);

    // Sessions table
    await queryRunner.query(`
      CREATE TABLE admin.sessions (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES admin.users(id) ON DELETE CASCADE,
        token VARCHAR(500) NOT NULL UNIQUE,
        refresh_token VARCHAR(500),
        ip_address VARCHAR(45),
        user_agent TEXT,
        device_type VARCHAR(50),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Password reset tokens
    await queryRunner.query(`
      CREATE TABLE admin.password_resets (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES admin.users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Email verification tokens
    await queryRunner.query(`
      CREATE TABLE admin.email_verifications (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES admin.users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Two-factor authentication
    await queryRunner.query(`
      CREATE TABLE admin.two_factor_auth (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL UNIQUE REFERENCES admin.users(id) ON DELETE CASCADE,
        secret VARCHAR(255) NOT NULL,
        backup_codes TEXT[], -- Array of backup codes
        is_enabled BOOLEAN DEFAULT false,
        enabled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications table
    await queryRunner.query(`
      CREATE TABLE admin.notifications (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES admin.users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- email, sms, push, in_app
        channel VARCHAR(50), -- specific channel like slack, teams
        title VARCHAR(255),
        message TEXT NOT NULL,
        data JSONB, -- Additional data
        priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        sent_at TIMESTAMP,
        failed_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notification preferences
    await queryRunner.query(`
      CREATE TABLE admin.notification_preferences (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES admin.users(id) ON DELETE CASCADE,
        notification_type VARCHAR(50) NOT NULL, -- leave_request, payslip_ready, etc
        email_enabled BOOLEAN DEFAULT true,
        sms_enabled BOOLEAN DEFAULT false,
        push_enabled BOOLEAN DEFAULT true,
        in_app_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, notification_type)
      )
    `);

    // Email queue for batch sending
    await queryRunner.query(`
      CREATE TABLE admin.email_queue (
        id BIGSERIAL PRIMARY KEY,
        to_email VARCHAR(255) NOT NULL,
        to_name VARCHAR(255),
        from_email VARCHAR(255) NOT NULL,
        from_name VARCHAR(255),
        subject VARCHAR(500) NOT NULL,
        body_html TEXT,
        body_text TEXT,
        template_name VARCHAR(100),
        template_data JSONB,
        priority INT DEFAULT 5, -- 1-10, higher = more priority
        status VARCHAR(20) DEFAULT 'pending', -- pending, sending, sent, failed
        attempts INT DEFAULT 0,
        max_attempts INT DEFAULT 3,
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        failed_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Email templates
    await queryRunner.query(`
      CREATE TABLE admin.email_templates (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body_html TEXT NOT NULL,
        body_text TEXT,
        variables TEXT[], -- List of available variables
        category VARCHAR(50), -- payroll, leave, attendance, etc
        is_system_template BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // System settings (key-value store)
    await queryRunner.query(`
      CREATE TABLE admin.settings (
        id BIGSERIAL PRIMARY KEY,
        key VARCHAR(100) NOT NULL UNIQUE,
        value TEXT,
        type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
        category VARCHAR(50),
        description TEXT,
        is_public BOOLEAN DEFAULT false, -- Can be accessed by frontend
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // System messages/announcements
    await queryRunner.query(`
      CREATE TABLE admin.system_messages (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'info', -- info, warning, error, success
        target_audience VARCHAR(20) DEFAULT 'all', -- all, employees, managers, admins
        department_id BIGINT, -- If targeting specific department
        is_active BOOLEAN DEFAULT true,
        show_from TIMESTAMP,
        show_until TIMESTAMP,
        is_dismissible BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX idx_users_email ON admin.users(email)`);
    await queryRunner.query(`CREATE INDEX idx_users_active ON admin.users(is_active) WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE INDEX idx_sessions_user_id ON admin.sessions(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_sessions_token ON admin.sessions(token)`);
    await queryRunner.query(`CREATE INDEX idx_notifications_user_id ON admin.notifications(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_notifications_read ON admin.notifications(is_read)`);
    await queryRunner.query(`CREATE INDEX idx_email_queue_status ON admin.email_queue(status, scheduled_at)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS admin.system_messages CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.settings CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.email_templates CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.email_queue CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.notification_preferences CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.notifications CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.two_factor_auth CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.email_verifications CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.password_resets CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.sessions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.user_roles CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.role_permissions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.permissions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.roles CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.users CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admin.organizations CASCADE`);
  }
}
