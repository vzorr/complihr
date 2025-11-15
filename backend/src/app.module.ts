import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppDataSource } from './config/typeorm.config';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { DepartmentsModule } from './departments/departments.module';
import { DesignationsModule } from './designations/designations.module';
import { PayrollModule } from './payroll/payroll.module';
import { UsersModule } from './admin/users.module';
import { LeaveModule } from './leave/leave.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ExpensesModule } from './expenses/expenses.module';
import { DocumentsModule } from './documents/documents.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'complihr',
      synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
      logging: process.env.DB_LOGGING === 'true' || false,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      autoLoadEntities: true,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 100, // 100 requests per 60 seconds per IP
    }]),

    // Common module
    CommonModule,

    // Feature modules
    AuthModule,
    EmployeesModule,
    DepartmentsModule,
    DesignationsModule,
    PayrollModule,
    UsersModule,
    LeaveModule,
    AttendanceModule,
    ExpensesModule,
    DocumentsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
