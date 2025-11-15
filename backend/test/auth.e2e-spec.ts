import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid admin credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@acmeretail.co.uk',
          password: 'Test123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('admin@acmeretail.co.uk');

      accessToken = response.body.access_token;
    });

    it('should login with valid HR credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'hr@acmeretail.co.uk',
          password: 'Test123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.email).toBe('hr@acmeretail.co.uk');
    });

    it('should login with valid manager credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'manager@acmeretail.co.uk',
          password: 'Test123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.email).toBe('manager@acmeretail.co.uk');
    });

    it('should login with valid employee credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'employee@acmeretail.co.uk',
          password: 'Test123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.email).toBe('employee@acmeretail.co.uk');
    });

    it('should fail with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'Test123!',
        })
        .expect(401);
    });

    it('should fail with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@acmeretail.co.uk',
          password: 'WrongPassword!',
        })
        .expect(401);
    });

    it('should fail with missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('publicId');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('id'); // Internal ID should not be exposed
    });

    it('should fail without authentication token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);
    });
  });
});
