import { DataSource } from 'typeorm';
import { Seeder } from './seeder.interface';

export class EmployeesSeeder implements Seeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      console.log('👨‍💼 Seeding employees...');

      // Get context data
      const context = await queryRunner.query(`SELECT * FROM seeder_context`);
      const getContext = (key: string) => context.find(c => c.key === key)?.value;

      const salesDeptId = getContext('sales_dept_id');
      const hrDeptId = getContext('hr_dept_id');
      const mgrDesigId = getContext('mgr_designation_id');
      const saDesigId = getContext('sa_designation_id');
      const hrmDesigId = getContext('hrm_designation_id');

      const managerUserId = getContext('manager_user_id');
      const employeeUserId = getContext('employee_user_id');
      const hrUserId = getContext('hr_user_id');

      // Create manager employee (linked to manager user)
      const managerEmp = await queryRunner.query(`
        INSERT INTO core.employees (
          employee_number,
          first_name, middle_name, last_name,
          work_email, mobile_phone,
          date_of_birth, gender,
          nationality,
          address_line1, city, county, postcode, country,
          department_id, designation_id,
          user_id,
          employment_status, employment_type,
          date_of_joining, probation_end_date
        ) VALUES (
          'ACME-EMP-2024-00001',
          'Robert', 'James', 'Smith',
          'manager@acmeretail.co.uk',
          '+44 20 7946 1111',
          '1985-03-15',
          'Male',
          'GB',
          '456 Manager Street',
          'London',
          'Greater London',
          'SW1A 2AA',
          'GB',
          ${salesDeptId},
          ${mgrDesigId},
          ${managerUserId},
          'Active',
          'Full-Time',
          '2020-01-15',
          '2020-04-15'
        )
        RETURNING id, public_id, employee_number, first_name, last_name
      `);

      console.log(`✅ Created manager: ${managerEmp[0].first_name} ${managerEmp[0].last_name} (${managerEmp[0].employee_number})`);

      // Create employee (linked to employee user) - reports to manager
      const employee = await queryRunner.query(`
        INSERT INTO core.employees (
          employee_number,
          first_name, middle_name, last_name,
          work_email, mobile_phone,
          date_of_birth, gender,
          nationality,
          address_line1, city, county, postcode, country,
          department_id, designation_id,
          reporting_manager_id,
          user_id,
          employment_status, employment_type,
          date_of_joining, probation_end_date
        ) VALUES (
          'ACME-EMP-2024-00002',
          'John', 'Michael', 'Doe',
          'employee@acmeretail.co.uk',
          '+44 20 7946 2222',
          '1990-06-20',
          'Male',
          'GB',
          '789 Employee Road',
          'London',
          'Greater London',
          'SW1A 3BB',
          'GB',
          ${salesDeptId},
          ${saDesigId},
          ${managerEmp[0].id},
          ${employeeUserId},
          'Active',
          'Full-Time',
          '2022-03-01',
          '2022-06-01'
        )
        RETURNING id, public_id, employee_number, first_name, last_name
      `);

      console.log(`✅ Created employee: ${employee[0].first_name} ${employee[0].last_name} (${employee[0].employee_number})`);

      // Create HR employee (linked to HR user)
      const hrEmployee = await queryRunner.query(`
        INSERT INTO core.employees (
          employee_number,
          first_name, middle_name, last_name,
          work_email, mobile_phone,
          date_of_birth, gender,
          nationality,
          address_line1, city, county, postcode, country,
          department_id, designation_id,
          user_id,
          employment_status, employment_type,
          date_of_joining, probation_end_date
        ) VALUES (
          'ACME-EMP-2024-00003',
          'Sarah', 'Jane', 'Williams',
          'hr@acmeretail.co.uk',
          '+44 20 7946 3333',
          '1988-09-10',
          'Female',
          'GB',
          '321 HR Avenue',
          'London',
          'Greater London',
          'SW1A 4CC',
          'GB',
          ${hrDeptId},
          ${hrmDesigId},
          ${hrUserId},
          'Active',
          'Full-Time',
          '2019-05-01',
          '2019-08-01'
        )
        RETURNING id, public_id, employee_number, first_name, last_name
      `);

      console.log(`✅ Created HR employee: ${hrEmployee[0].first_name} ${hrEmployee[0].last_name} (${hrEmployee[0].employee_number})`);

      // Create additional employees without user accounts
      const employee2 = await queryRunner.query(`
        INSERT INTO core.employees (
          employee_number,
          first_name, last_name,
          work_email, mobile_phone,
          date_of_birth, gender,
          nationality,
          address_line1, city, county, postcode, country,
          department_id, designation_id,
          reporting_manager_id,
          employment_status, employment_type,
          date_of_joining, probation_end_date
        ) VALUES (
          'ACME-EMP-2024-00004',
          'Emma', 'Johnson',
          'emma.johnson@acmeretail.co.uk',
          '+44 20 7946 4444',
          '1992-11-25',
          'Female',
          'GB',
          '555 Sales Street',
          'London',
          'Greater London',
          'SW1A 5DD',
          'GB',
          ${salesDeptId},
          ${saDesigId},
          ${managerEmp[0].id},
          'Active',
          'Full-Time',
          '2023-01-10',
          '2023-04-10'
        )
        RETURNING id, public_id, employee_number, first_name, last_name
      `);

      console.log(`✅ Created employee: ${employee2[0].first_name} ${employee2[0].last_name} (${employee2[0].employee_number})`);

      const employee3 = await queryRunner.query(`
        INSERT INTO core.employees (
          employee_number,
          first_name, last_name,
          work_email, mobile_phone,
          date_of_birth, gender,
          nationality,
          address_line1, city, county, postcode, country,
          department_id, designation_id,
          reporting_manager_id,
          employment_status, employment_type,
          date_of_joining, probation_end_date
        ) VALUES (
          'ACME-EMP-2024-00005',
          'Michael', 'Brown',
          'michael.brown@acmeretail.co.uk',
          '+44 20 7946 5555',
          '1995-04-18',
          'Male',
          'GB',
          '777 Sales Lane',
          'London',
          'Greater London',
          'SW1A 6EE',
          'GB',
          ${salesDeptId},
          ${saDesigId},
          ${managerEmp[0].id},
          'Active',
          'Part-Time',
          '2023-06-01',
          '2023-09-01'
        )
        RETURNING id, public_id, employee_number, first_name, last_name
      `);

      console.log(`✅ Created employee: ${employee3[0].first_name} ${employee3[0].last_name} (${employee3[0].employee_number})`);

      // Store employee public IDs for tests
      await queryRunner.query(`
        INSERT INTO seeder_context (key, value)
        VALUES
          ('manager_employee_public_id', '${managerEmp[0].public_id}'),
          ('test_employee_public_id', '${employee[0].public_id}'),
          ('hr_employee_public_id', '${hrEmployee[0].public_id}')
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `);

      console.log('✅ Employee seeding completed');

    } catch (error) {
      console.error('❌ Error seeding employees:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async clear(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      console.log('🗑️  Clearing employees...');

      await queryRunner.query(`DELETE FROM core.employees`);

      console.log('✅ Employees cleared');
    } catch (error) {
      console.error('❌ Error clearing employees:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
