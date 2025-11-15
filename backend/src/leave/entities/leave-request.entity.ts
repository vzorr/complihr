import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Generated,
} from 'typeorm';
import { Employee } from '../../core/entities/employee.entity';
import { LeaveType } from './leave-type.entity';
import { User } from '../../admin/entities/user.entity';

@Entity({ schema: 'leave', name: 'leave_requests' })
export class LeaveRequest {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Generated('uuid')
  @Column({ type: 'uuid', unique: true, name: 'public_id' })
  publicId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'bigint', name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => LeaveType)
  @JoinColumn({ name: 'leave_type_id' })
  leaveType: LeaveType;

  @Column({ type: 'bigint', name: 'leave_type_id' })
  leaveTypeId: number;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'total_days' })
  totalDays: number;

  @Column({ type: 'boolean', default: false, name: 'is_half_day' })
  isHalfDay: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'half_day_period' })
  halfDayPeriod: string; // first_half, second_half

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'emergency_contact_during_leave' })
  emergencyContactDuringLeave: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // pending, approved, rejected, cancelled

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'requested_at' })
  requestedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Column({ type: 'bigint', nullable: true, name: 'approved_by' })
  approvedById: number;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'rejected_by' })
  rejectedBy: User;

  @Column({ type: 'bigint', nullable: true, name: 'rejected_by' })
  rejectedById: number;

  @Column({ type: 'timestamp', nullable: true, name: 'rejected_at' })
  rejectedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string;

  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason: string;

  @Column({ type: 'text', nullable: true, name: 'admin_notes' })
  adminNotes: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'bigint', nullable: true, name: 'created_by' })
  createdBy: number;

  @Column({ type: 'bigint', nullable: true, name: 'updated_by' })
  updatedBy: number;
}
