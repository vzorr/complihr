import { Expose } from 'class-transformer';

export class AuditLogResponseDto {
  @Expose()
  id: number;

  @Expose()
  userPublicId?: string;

  @Expose()
  userEmail?: string;

  @Expose()
  action: string;

  @Expose()
  resourceType: string;

  @Expose()
  resourceId?: string;

  @Expose()
  description?: string;

  @Expose()
  httpMethod?: string;

  @Expose()
  endpoint?: string;

  @Expose()
  ipAddress?: string;

  @Expose()
  userAgent?: string;

  @Expose()
  containsPii: boolean;

  @Expose()
  piiFields?: string[];

  @Expose()
  statusCode?: number;

  @Expose()
  success: boolean;

  @Expose()
  errorMessage?: string;

  @Expose()
  metadata?: Record<string, any>;

  @Expose()
  createdAt: Date;

  // ❌ NEVER expose these fields in responses
  // userId: number;
  // oldValues: Record<string, any>;  // Contains sensitive data
  // newValues: Record<string, any>;  // Contains sensitive data
}
