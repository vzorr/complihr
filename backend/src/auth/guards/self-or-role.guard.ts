import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../core/entities/employee.entity';

@Injectable()
export class SelfOrRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedRoles = this.reflector.getAllAndOverride<string[]>('selfOrRoles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!allowedRoles) {
      return true; // No restrictions, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const publicId = request.params.publicId;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Check if user has one of the allowed roles
    if (user.roles) {
      const userRoles = user.roles.map((role) => role.name);
      const hasAllowedRole = allowedRoles.some((role) => userRoles.includes(role));

      if (hasAllowedRole) {
        return true; // User has required role
      }
    }

    // If no role matches, check if user is accessing their own record or is the manager
    if (publicId && user.id) {
      // Find employee record for this user
      const currentUserEmployee = await this.employeeRepository.findOne({
        where: { userId: user.id },
      });

      if (currentUserEmployee) {
        // Check if accessing own record
        if (currentUserEmployee.publicId === publicId) {
          return true; // User is accessing their own record
        }

        // Check if user is a manager accessing their team member
        const targetEmployee = await this.employeeRepository.findOne({
          where: { publicId },
        });

        if (targetEmployee && targetEmployee.reportingManagerId === currentUserEmployee.id) {
          return true; // Manager is accessing their team member's record
        }
      }
    }

    throw new ForbiddenException('Access denied');
  }
}
