import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AppDataSource } from '../src/config/typeorm.config';

describe('Employees (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let hrToken: string;
  let managerToken: string;
  let employeeToken: string;
  let employeePublicId: string;
  let managerEmployeePublicId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same validation pipe as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Initialize datasource if not already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Get tokens for different users
    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@acmeretail.co.uk', password: 'Test123!' });
    adminToken = adminRes.body.access_token;

    const hrRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'hr@acmeretail.co.uk', password: 'Test123!' });
    hrToken = hrRes.body.access_token;

    const managerRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'manager@acmeretail.co.uk', password: 'Test123!' });
    managerToken = managerRes.body.access_token;

    const employeeRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'employee@acmeretail.co.uk', password: 'Test123!' });
    employeeToken = employeeRes.body.access_token;

    // Get employee public IDs from database
    const context = await AppDataSource.query('SELECT * FROM seeder_context');
    const getContext = (key: string) => context.find(c => c.key === key)?.value;

    employeePublicId = getContext('test_employee_public_id');
    managerEmployeePublicId = getContext('manager_employee_public_id');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/employees (GET)', () => {
    it('should get all employees as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check response DTO structure
      const employee = response.body.data[0];
      expect(employee).toHaveProperty('publicId');
      expect(employee).toHaveProperty('employeeNumber');
      expect(employee).toHaveProperty('firstName');
      expect(employee).toHaveProperty('lastName');
      expect(employee).not.toHaveProperty('id'); // Internal ID should be hidden
    });

    it('should get all employees as HR', async () => {
      const response = await request(app.getHttpServer())
        .get('/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/employees')
        .expect(401);
    });
  });

  describe('/employees/:publicId (GET)', () => {
    it('should get employee by publicId as admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/employees/${employeePublicId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('publicId', employeePublicId);
      expect(response.body).toHaveProperty('employeeNumber');
      expect(response.body).toHaveProperty('email');
      expect(response.body).not.toHaveProperty('id'); // Internal ID hidden
    });

    it('should allow employee to access their own record', async () => {
      const response = await request(app.getHttpServer())
        .get(`/employees/${employeePublicId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(response.body.publicId).toBe(employeePublicId);
    });

    it('should allow manager to access their employee record', async () => {
      const response = await request(app.getHttpServer())
        .get(`/employees/${employeePublicId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.publicId).toBe(employeePublicId);
    });

    it('should fail with invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/employees/123') // Not a UUID
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400); // or 404 depending on validation
    });

    it('should fail with non-existent publicId', async () => {
      await request(app.getHttpServer())
        .get('/employees/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should prevent employee from accessing other employee records', async () => {
      await request(app.getHttpServer())
        .get(`/employees/${managerEmployeePublicId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });
  });

  describe('/employees (POST)', () => {
    let newEmployeePublicId: string;

    it('should create new employee as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeNumber: 'ACME-EMP-2024-99999',
          firstName: 'Test',
          lastName: 'Employee',
          email: 'test.new@acmeretail.co.uk',
          phoneNumber: '+44 20 7946 9999',
          dateOfBirth: '1995-01-01',
          gender: 'Male',
          nationality: 'British',
          employmentStatus: 'Active',
          employmentType: 'Full-Time',
          joinDate: '2024-01-01',
        })
        .expect(201);

      expect(response.body).toHaveProperty('publicId');
      expect(response.body).toHaveProperty('employeeNumber', 'ACME-EMP-2024-99999');
      expect(response.body).not.toHaveProperty('id');

      newEmployeePublicId = response.body.publicId;
    });

    it('should fail to create employee without required fields', async () => {
      await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Test',
          // Missing required fields
        })
        .expect(400);
    });

    it('should fail to create employee with duplicate employee number', async () => {
      await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeNumber: 'ACME-EMP-2024-99999', // Duplicate
          firstName: 'Another',
          lastName: 'Employee',
          email: 'another@acmeretail.co.uk',
          phoneNumber: '+44 20 7946 8888',
          dateOfBirth: '1995-01-01',
          gender: 'Male',
          nationality: 'British',
          employmentStatus: 'Active',
          employmentType: 'Full-Time',
          joinDate: '2024-01-01',
        })
        .expect(409); // Conflict
    });
  });

  describe('/employees/:publicId (PATCH)', () => {
    it('should update employee as admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/employees/${employeePublicId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          phoneNumber: '+44 20 7946 0000',
        })
        .expect(200);

      expect(response.body.phoneNumber).toBe('+44 20 7946 0000');
      expect(response.body.publicId).toBe(employeePublicId);
    });

    it('should allow employee to update their own record', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/employees/${employeePublicId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          phoneNumber: '+44 20 7946 1111',
        })
        .expect(200);

      expect(response.body.phoneNumber).toBe('+44 20 7946 1111');
    });

    it('should prevent employee from updating other records', async () => {
      await request(app.getHttpServer())
        .patch(`/employees/${managerEmployeePublicId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          phoneNumber: '+44 20 7946 2222',
        })
        .expect(403);
    });
  });

  describe('/employees/:publicId (DELETE)', () => {
    it('should soft delete employee as admin', async () => {
      // First create a new employee
      const createRes = await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeNumber: 'ACME-EMP-2024-88888',
          firstName: 'Delete',
          lastName: 'Test',
          email: 'delete.test@acmeretail.co.uk',
          phoneNumber: '+44 20 7946 7777',
          dateOfBirth: '1995-01-01',
          gender: 'Male',
          nationality: 'British',
          employmentStatus: 'Active',
          employmentType: 'Full-Time',
          joinDate: '2024-01-01',
        });

      const deletePublicId = createRes.body.publicId;

      // Delete it
      await request(app.getHttpServer())
        .delete(`/employees/${deletePublicId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/employees/${deletePublicId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should prevent non-admin from deleting employees', async () => {
      await request(app.getHttpServer())
        .delete(`/employees/${employeePublicId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });
  });

  describe('Security Tests', () => {
    it('should not expose internal database IDs in any response', async () => {
      const response = await request(app.getHttpServer())
        .get(`/employees/${employeePublicId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).not.toHaveProperty('id');
      expect(response.body).not.toHaveProperty('userId');
      expect(response.body).not.toHaveProperty('departmentId');
      expect(response.body).toHaveProperty('publicId');
    });

    it('should validate UUID format for publicId parameter', async () => {
      const invalidIds = ['123', 'abc', 'not-a-uuid', ''];

      for (const invalidId of invalidIds) {
        await request(app.getHttpServer())
          .get(`/employees/${invalidId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect((res) => {
            expect([400, 404]).toContain(res.status);
          });
      }
    });

    it('should not allow enumeration attacks', async () => {
      // Try sequential IDs (old pattern)
      const attempts = [1, 2, 3, 4, 5, 10, 100, 1000];

      for (const id of attempts) {
        await request(app.getHttpServer())
          .get(`/employees/${id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect((res) => {
            expect([400, 404]).toContain(res.status);
          });
      }
    });
  });
});
