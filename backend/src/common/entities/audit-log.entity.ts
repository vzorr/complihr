import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ schema: 'admin', name: 'audit_logs' })
@Index(['userId', 'createdAt'])
@Index(['resourceType', 'resourceId'])
@Index(['action'])
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  // User who performed the action
  @Column({ type: 'bigint', nullable: true, name: 'user_id' })
  userId: number;

  @Column({ type: 'uuid', nullable: true, name: 'user_public_id' })
  userPublicId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'user_email' })
  userEmail: string;

  // Action details
  @Column({ type: 'varchar', length: 100 })
  action: string; // CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, etc.

  @Column({ type: 'varchar', length: 100, name: 'resource_type' })
  resourceType: string; // employee, user, payslip, etc.

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'resource_id' })
  resourceId: string; // publicId of the resource

  @Column({ type: 'text', nullable: true })
  description: string;

  // Request details
  @Column({ type: 'varchar', length: 10, nullable: true, name: 'http_method' })
  httpMethod: string; // GET, POST, PUT, PATCH, DELETE

  @Column({ type: 'text', nullable: true })
  endpoint: string;

  @Column({ type: 'inet', nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string;

  // Data sensitivity
  @Column({ type: 'boolean', default: false, name: 'contains_pii' })
  containsPii: boolean;

  @Column({ type: 'text', array: true, nullable: true, name: 'pii_fields' })
  piiFields: string[]; // ['email', 'nationalInsuranceNumber', etc.]

  // Changes (for UPDATE actions)
  @Column({ type: 'jsonb', nullable: true, name: 'old_values' })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'new_values' })
  newValues: Record<string, any>;

  // Response status
  @Column({ type: 'int', nullable: true, name: 'status_code' })
  statusCode: number;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
