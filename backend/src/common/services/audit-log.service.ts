import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

export interface AuditLogOptions {
  userId?: number;
  userPublicId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  description?: string;
  httpMethod?: string;
  endpoint?: string;
  ipAddress?: string;
  userAgent?: string;
  containsPii?: boolean;
  piiFields?: string[];
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  statusCode?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Create an audit log entry
   */
  async log(options: AuditLogOptions): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId: options.userId,
      userPublicId: options.userPublicId,
      userEmail: options.userEmail,
      action: options.action,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      description: options.description,
      httpMethod: options.httpMethod,
      endpoint: options.endpoint,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      containsPii: options.containsPii || false,
      piiFields: options.piiFields,
      oldValues: options.oldValues,
      newValues: options.newValues,
      statusCode: options.statusCode,
      success: options.success !== undefined ? options.success : true,
      errorMessage: options.errorMessage,
      metadata: options.metadata,
    });

    return await this.auditLogRepository.save(auditLog);
  }

  /**
   * Log employee access (PII access)
   */
  async logEmployeeAccess(
    userId: number,
    userPublicId: string,
    userEmail: string,
    employeePublicId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.log({
      userId,
      userPublicId,
      userEmail,
      action,
      resourceType: 'employee',
      resourceId: employeePublicId,
      description: `User accessed employee record`,
      containsPii: true,
      piiFields: ['firstName', 'lastName', 'email', 'dateOfBirth', 'address'],
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log payroll access (financial PII)
   */
  async logPayrollAccess(
    userId: number,
    userPublicId: string,
    userEmail: string,
    payslipPublicId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.log({
      userId,
      userPublicId,
      userEmail,
      action,
      resourceType: 'payslip',
      resourceId: payslipPublicId,
      description: `User accessed payslip record`,
      containsPii: true,
      piiFields: ['salary', 'ni_number', 'tax_code', 'bank_details'],
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET',
    userEmail: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string,
  ): Promise<AuditLog> {
    return this.log({
      userEmail,
      action,
      resourceType: 'authentication',
      description: `User ${action.toLowerCase()} attempt`,
      ipAddress,
      userAgent,
      success,
      errorMessage,
    });
  }

  /**
   * Find audit logs for a user
   */
  async findByUser(
    userId: number,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find audit logs for a resource
   */
  async findByResource(
    resourceType: string,
    resourceId: string,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { resourceType, resourceId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Find PII access logs
   */
  async findPiiAccess(
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.contains_pii = true')
      .orderBy('audit_log.created_at', 'DESC')
      .take(limit);

    if (startDate) {
      query.andWhere('audit_log.created_at >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('audit_log.created_at <= :endDate', { endDate });
    }

    return await query.getMany();
  }

  /**
   * Find failed actions
   */
  async findFailedActions(
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.success = false')
      .orderBy('audit_log.created_at', 'DESC')
      .take(limit);

    if (startDate) {
      query.andWhere('audit_log.created_at >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('audit_log.created_at <= :endDate', { endDate });
    }

    return await query.getMany();
  }
}
