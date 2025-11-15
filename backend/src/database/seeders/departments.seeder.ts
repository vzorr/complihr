import { DataSource } from 'typeorm';
import { Seeder } from './seeder.interface';

export class DepartmentsSeeder implements Seeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      console.log('🏢 Seeding departments and designations...');

      // Get organization ID
      const orgResult = await queryRunner.query(`
        SELECT value FROM seeder_context WHERE key = 'organization_id'
      `);
      const organizationId = orgResult[0].value;

      // Create departments
      const departments = [
        {
          name: 'Sales',
          code: 'ACME-DEPT-001',
          description: 'Sales and customer relations',
          location: 'London HQ',
          costCenter: 'CC-001',
        },
        {
          name: 'Operations',
          code: 'ACME-DEPT-002',
          description: 'Store operations and logistics',
          location: 'London HQ',
          costCenter: 'CC-002',
        },
        {
          name: 'Human Resources',
          code: 'ACME-DEPT-003',
          description: 'HR and employee relations',
          location: 'London HQ',
          costCenter: 'CC-003',
        },
        {
          name: 'Finance',
          code: 'ACME-DEPT-004',
          description: 'Finance and accounting',
          location: 'London HQ',
          costCenter: 'CC-004',
        },
        {
          name: 'IT',
          code: 'ACME-DEPT-005',
          description: 'Information technology',
          location: 'London HQ',
          costCenter: 'CC-005',
        },
      ];

      const createdDepts = [];
      for (const dept of departments) {
        const result = await queryRunner.query(`
          INSERT INTO core.departments (
            name, code, description, location, cost_center, is_active
          ) VALUES ($1, $2, $3, $4, $5, true)
          RETURNING id, public_id, name, code
        `, [dept.name, dept.code, dept.description, dept.location, dept.costCenter]);

        createdDepts.push(result[0]);
        console.log(`✅ Created department: ${result[0].name} (${result[0].code})`);
      }

      // Create designations
      const designations = [
        { title: 'CEO', code: 'CEO', level: 10, description: 'Chief Executive Officer' },
        { title: 'Store Manager', code: 'MGR', level: 5, description: 'Store Management' },
        { title: 'Assistant Manager', code: 'AMGR', level: 4, description: 'Assistant Store Management' },
        { title: 'Team Leader', code: 'TL', level: 3, description: 'Team Leadership' },
        { title: 'Sales Assistant', code: 'SA', level: 2, description: 'Customer Sales' },
        { title: 'Cashier', code: 'CASH', level: 2, description: 'Checkout Operations' },
        { title: 'Stock Associate', code: 'STOCK', level: 2, description: 'Stock Management' },
        { title: 'HR Manager', code: 'HRM', level: 5, description: 'Human Resources Manager' },
        { title: 'HR Assistant', code: 'HRA', level: 3, description: 'Human Resources Assistant' },
        { title: 'Accountant', code: 'ACC', level: 4, description: 'Financial Accounting' },
        { title: 'IT Support', code: 'ITS', level: 3, description: 'Technical Support' },
      ];

      const createdDesignations = [];
      for (const desig of designations) {
        const result = await queryRunner.query(`
          INSERT INTO core.designations (
            title, code, level, description, is_active
          ) VALUES ($1, $2, $3, $4, true)
          RETURNING id, public_id, title, code
        `, [desig.title, desig.code, desig.level, desig.description]);

        createdDesignations.push(result[0]);
        console.log(`✅ Created designation: ${result[0].title} (${result[0].code})`);
      }

      // Store department and designation IDs for employee seeder
      const salesDept = createdDepts.find(d => d.name === 'Sales');
      const hrDept = createdDepts.find(d => d.name === 'Human Resources');
      const mgrDesig = createdDesignations.find(d => d.code === 'MGR');
      const saDesig = createdDesignations.find(d => d.code === 'SA');
      const hrmDesig = createdDesignations.find(d => d.code === 'HRM');

      await queryRunner.query(`
        INSERT INTO seeder_context (key, value)
        VALUES
          ('sales_dept_id', '${salesDept.id}'),
          ('hr_dept_id', '${hrDept.id}'),
          ('mgr_designation_id', '${mgrDesig.id}'),
          ('sa_designation_id', '${saDesig.id}'),
          ('hrm_designation_id', '${hrmDesig.id}'),
          ('sales_dept_public_id', '${salesDept.public_id}'),
          ('hr_dept_public_id', '${hrDept.public_id}')
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `);

    } catch (error) {
      console.error('❌ Error seeding departments:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async clear(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      console.log('🗑️  Clearing departments and designations...');

      await queryRunner.query(`DELETE FROM core.departments`);
      await queryRunner.query(`DELETE FROM core.designations`);

      console.log('✅ Departments and designations cleared');
    } catch (error) {
      console.error('❌ Error clearing departments:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
