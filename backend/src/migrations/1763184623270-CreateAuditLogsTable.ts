import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1763184623270 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE admin.audit_logs (
        id BIGSERIAL PRIMARY KEY,

        -- User information
        user_id BIGINT,
        user_public_id UUID,
        user_email VARCHAR(255),

        -- Action details
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id VARCHAR(255),
        description TEXT,

        -- Request details
        http_method VARCHAR(10),
        endpoint TEXT,
        ip_address INET,
        user_agent TEXT,

        -- Data sensitivity
        contains_pii BOOLEAN DEFAULT FALSE,
        pii_fields TEXT[],

        -- Changes (for UPDATE actions)
        old_values JSONB,
        new_values JSONB,

        -- Response status
        status_code INT,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT,

        -- Metadata
        metadata JSONB,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_user ON admin.audit_logs(user_id, created_at)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_resource ON admin.audit_logs(resource_type, resource_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_action ON admin.audit_logs(action)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_pii ON admin.audit_logs(contains_pii) WHERE contains_pii = TRUE
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_failed ON admin.audit_logs(success) WHERE success = FALSE
    `);

    console.log('✅ Created audit_logs table with indexes');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS admin.audit_logs`);
  }
}
