import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { AuditLogService } from '../services/audit-log.service';

/**
 * Interceptor that logs PII access for employee and payroll endpoints
 * Automatically tracks when sensitive employee data is accessed
 */
@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';

    // Determine if this is a PII-related endpoint
    const isPiiEndpoint = this.isPiiEndpoint(url, method);

    if (!isPiiEndpoint || !user) {
      return next.handle();
    }

    // Extract resource information
    const { resourceType, resourceId, action } = this.extractResourceInfo(url, method);

    // Track start time for response time monitoring
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        // Log successful access
        const responseTime = Date.now() - startTime;

        await this.auditLogService.log({
          userId: user.id,
          userPublicId: user.publicId,
          userEmail: user.email,
          action,
          resourceType,
          resourceId,
          description: `User accessed ${resourceType} record`,
          httpMethod: method,
          endpoint: url,
          ipAddress: ip,
          userAgent,
          containsPii: true,
          piiFields: this.getPiiFields(resourceType),
          statusCode: 200,
          success: true,
          metadata: {
            responseTime,
            hasAccess: true,
          },
        });
      }),
      catchError(async (error) => {
        // Log failed access attempts
        const responseTime = Date.now() - startTime;

        await this.auditLogService.log({
          userId: user?.id,
          userPublicId: user?.publicId,
          userEmail: user?.email,
          action,
          resourceType,
          resourceId,
          description: `Failed attempt to access ${resourceType} record`,
          httpMethod: method,
          endpoint: url,
          ipAddress: ip,
          userAgent,
          containsPii: true,
          piiFields: this.getPiiFields(resourceType),
          statusCode: error.status || 500,
          success: false,
          errorMessage: error.message,
          metadata: {
            responseTime,
            hasAccess: false,
          },
        });

        throw error;
      }),
    );
  }

  /**
   * Check if the endpoint handles PII data
   */
  private isPiiEndpoint(url: string, method: string): boolean {
    const piiPatterns = [
      /\/employees\/[a-f0-9-]{36}/, // GET/PATCH/DELETE employee by UUID
      /\/employees\?/, // GET all employees
      /\/employees\/department/, // GET employees by department
      /\/payroll/, // All payroll endpoints
      /\/payslips/, // All payslip endpoints
    ];

    // Only log read and modification operations
    const relevantMethods = ['GET', 'PATCH', 'PUT', 'DELETE'];

    return (
      relevantMethods.includes(method) &&
      piiPatterns.some((pattern) => pattern.test(url))
    );
  }

  /**
   * Extract resource information from URL
   */
  private extractResourceInfo(url: string, method: string): {
    resourceType: string;
    resourceId: string | null;
    action: string;
  } {
    let resourceType = 'unknown';
    let resourceId: string | null = null;
    let action = method;

    // Employee endpoints
    if (url.includes('/employees')) {
      resourceType = 'employee';
      const uuidMatch = url.match(/\/employees\/([a-f0-9-]{36})/);
      if (uuidMatch) {
        resourceId = uuidMatch[1];
      }
      action = method === 'GET' ? 'READ_EMPLOYEE' : `${method}_EMPLOYEE`;
    }

    // Payroll endpoints
    if (url.includes('/payroll') || url.includes('/payslips')) {
      resourceType = 'payslip';
      const uuidMatch = url.match(/\/payslips\/([a-f0-9-]{36})/);
      if (uuidMatch) {
        resourceId = uuidMatch[1];
      }
      action = method === 'GET' ? 'READ_PAYSLIP' : `${method}_PAYSLIP`;
    }

    return { resourceType, resourceId, action };
  }

  /**
   * Get list of PII fields for different resource types
   */
  private getPiiFields(resourceType: string): string[] {
    const piiFieldsMap: Record<string, string[]> = {
      employee: [
        'firstName',
        'lastName',
        'email',
        'personalEmail',
        'phone',
        'dateOfBirth',
        'nationalInsuranceNumber',
        'address',
        'emergencyContact',
      ],
      payslip: [
        'salary',
        'baseSalary',
        'grossPay',
        'netPay',
        'nationalInsuranceNumber',
        'taxCode',
        'bankAccountNumber',
        'bankSortCode',
      ],
    };

    return piiFieldsMap[resourceType] || [];
  }
}
