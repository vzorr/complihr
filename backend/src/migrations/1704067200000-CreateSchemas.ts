import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchemas1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create all schemas for CompliHR UK Retail HRMS
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS core`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS payroll`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS time_tracking`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS leave`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS uk_compliance`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS retail`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS performance`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS expenses`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS compliance`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS admin`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS audit`);

    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all schemas (cascade will drop all tables)
    await queryRunner.query(`DROP SCHEMA IF EXISTS audit CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS admin CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS compliance CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS expenses CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS performance CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS retail CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF NOT EXISTS uk_compliance CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS leave CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS time_tracking CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS payroll CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS core CASCADE`);
  }
}
