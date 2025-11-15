import { DataSource } from 'typeorm';
import { Seeder } from './seeder.interface';
import * as bcrypt from 'bcrypt';

export class RolesSeeder implements Seeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      console.log('👥 Seeding roles and users...');

      // Create roles
      const roles = [
        {
          name: 'admin',
          displayName: 'Administrator',
          description: 'Full system access',
          isSystemRole: true,
        },
        {
          name: 'hr',
          displayName: 'HR Manager',
          description: 'Human Resources management',
          isSystemRole: true,
        },
        {
          name: 'manager',
          displayName: 'Manager',
          description: 'Department and team management',
          isSystemRole: false,
        },
        {
          name: 'employee',
          displayName: 'Employee',
          description: 'Standard employee access',
          isSystemRole: false,
        },
      ];

      const createdRoles = [];
      for (const role of roles) {
        const result = await queryRunner.query(`
          INSERT INTO admin.roles (name, display_name, description, is_system_role)
          VALUES ($1, $2, $3, $4)
          RETURNING id, public_id, name
        `, [role.name, role.displayName, role.description, role.isSystemRole]);

        createdRoles.push(result[0]);
        console.log(`✅ Created role: ${result[0].name}`);
      }

      // Create test users
      const passwordHash = await bcrypt.hash('Test123!', 10);

      // Admin user
      const adminUser = await queryRunner.query(`
        INSERT INTO admin.users (
          email, password_hash, first_name, last_name, is_active, is_verified
        ) VALUES (
          'admin@acmeretail.co.uk',
          $1,
          'Admin',
          'User',
          true,
          true
        )
        RETURNING id, public_id, email
      `, [passwordHash]);

      console.log(`✅ Created admin user: ${adminUser[0].email}`);

      // HR user
      const hrUser = await queryRunner.query(`
        INSERT INTO admin.users (
          email, password_hash, first_name, last_name, is_active, is_verified
        ) VALUES (
          'hr@acmeretail.co.uk',
          $1,
          'HR',
          'Manager',
          true,
          true
        )
        RETURNING id, public_id, email
      `, [passwordHash]);

      console.log(`✅ Created HR user: ${hrUser[0].email}`);

      // Manager user
      const managerUser = await queryRunner.query(`
        INSERT INTO admin.users (
          email, password_hash, first_name, last_name, is_active, is_verified
        ) VALUES (
          'manager@acmeretail.co.uk',
          $1,
          'Department',
          'Manager',
          true,
          true
        )
        RETURNING id, public_id, email
      `, [passwordHash]);

      console.log(`✅ Created manager user: ${managerUser[0].email}`);

      // Employee user
      const employeeUser = await queryRunner.query(`
        INSERT INTO admin.users (
          email, password_hash, first_name, last_name, is_active, is_verified
        ) VALUES (
          'employee@acmeretail.co.uk',
          $1,
          'John',
          'Doe',
          true,
          true
        )
        RETURNING id, public_id, email
      `, [passwordHash]);

      console.log(`✅ Created employee user: ${employeeUser[0].email}`);

      // Assign roles to users
      const adminRole = createdRoles.find(r => r.name === 'admin');
      const hrRole = createdRoles.find(r => r.name === 'hr');
      const managerRole = createdRoles.find(r => r.name === 'manager');
      const employeeRole = createdRoles.find(r => r.name === 'employee');

      await queryRunner.query(`
        INSERT INTO admin.user_roles (user_id, role_id)
        VALUES
          (${adminUser[0].id}, ${adminRole.id}),
          (${hrUser[0].id}, ${hrRole.id}),
          (${managerUser[0].id}, ${managerRole.id}),
          (${employeeUser[0].id}, ${employeeRole.id})
      `);

      console.log('✅ Assigned roles to users');

      // Store user IDs for other seeders
      await queryRunner.query(`
        INSERT INTO seeder_context (key, value)
        VALUES
          ('admin_user_id', '${adminUser[0].id}'),
          ('hr_user_id', '${hrUser[0].id}'),
          ('manager_user_id', '${managerUser[0].id}'),
          ('employee_user_id', '${employeeUser[0].id}'),
          ('admin_user_public_id', '${adminUser[0].public_id}'),
          ('hr_user_public_id', '${hrUser[0].public_id}'),
          ('manager_user_public_id', '${managerUser[0].public_id}'),
          ('employee_user_public_id', '${employeeUser[0].public_id}')
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `);

    } catch (error) {
      console.error('❌ Error seeding roles:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async clear(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      console.log('🗑️  Clearing roles and users...');

      await queryRunner.query(`DELETE FROM admin.user_roles`);
      await queryRunner.query(`DELETE FROM admin.users`);
      await queryRunner.query(`DELETE FROM admin.roles`);

      console.log('✅ Roles and users cleared');
    } catch (error) {
      console.error('❌ Error clearing roles:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
