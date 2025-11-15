import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../admin/entities/user.entity';
import { Employee } from '../core/entities/employee.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { SelfOrRoleGuard } from './guards/self-or-role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Employee]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'complihr-super-secret-jwt-key-change-in-production-2024',
      signOptions: {
        expiresIn: '24h',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, SelfOrRoleGuard],
  exports: [AuthService, RolesGuard, SelfOrRoleGuard],
})
export class AuthModule {}
