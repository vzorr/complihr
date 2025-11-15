import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from 'typeorm';

@Entity({ schema: 'leave', name: 'leave_types' })
export class LeaveType {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Generated('uuid')
  @Column({ type: 'uuid', unique: true, name: 'public_id' })
  publicId: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 7, default: '#1976d2' })
  color: string;

  @Column({ type: 'boolean', default: true, name: 'is_paid' })
  isPaid: boolean;

  @Column({ type: 'boolean', default: true, name: 'requires_approval' })
  requiresApproval: boolean;

  @Column({ type: 'boolean', default: false, name: 'requires_document' })
  requiresDocument: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'max_days_per_year' })
  maxDaysPerYear: number;

  @Column({ type: 'int', nullable: true, name: 'min_days_notice' })
  minDaysNotice: number;

  @Column({ type: 'int', nullable: true, name: 'max_consecutive_days' })
  maxConsecutiveDays: number;

  @Column({ type: 'boolean', default: false, name: 'is_carry_forward' })
  isCarryForward: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'carry_forward_max_days' })
  carryForwardMaxDays: number;

  @Column({ type: 'boolean', default: false, name: 'is_encashable' })
  isEncashable: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'gender_specific' })
  genderSpecific: string; // null, male, female

  @Column({ type: 'boolean', default: false, name: 'is_statutory' })
  isStatutory: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'bigint', nullable: true, name: 'created_by' })
  createdBy: number;

  @Column({ type: 'bigint', nullable: true, name: 'updated_by' })
  updatedBy: number;
}
