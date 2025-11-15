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
import { User } from '../../admin/entities/user.entity';

@Entity({ schema: 'time_tracking', name: 'attendance_records' })
export class AttendanceRecord {
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

  @Column({ type: 'date', name: 'attendance_date' })
  attendanceDate: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'clock_in_time' })
  clockInTime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'clock_out_time' })
  clockOutTime: Date;

  @Column({ type: 'int', default: 0, name: 'total_break_minutes' })
  totalBreakMinutes: number;

  @Column({ type: 'int', nullable: true, name: 'total_work_minutes' })
  totalWorkMinutes: number;

  @Column({ type: 'int', default: 0, name: 'overtime_minutes' })
  overtimeMinutes: number;

  @Column({ type: 'bigint', nullable: true, name: 'shift_id' })
  shiftId: number;

  @Column({ type: 'time', nullable: true, name: 'scheduled_start' })
  scheduledStart: string;

  @Column({ type: 'time', nullable: true, name: 'scheduled_end' })
  scheduledEnd: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'attendance_status' })
  attendanceStatus: string; // present, absent, late, half_day, on_leave

  @Column({ type: 'boolean', default: false, name: 'is_late' })
  isLate: boolean;

  @Column({ type: 'int', default: 0, name: 'late_by_minutes' })
  lateByMinutes: number;

  @Column({ type: 'boolean', default: false, name: 'is_early_departure' })
  isEarlyDeparture: boolean;

  @Column({ type: 'int', default: 0, name: 'early_departure_minutes' })
  earlyDepartureMinutes: number;

  @Column({ type: 'boolean', default: false, name: 'is_approved' })
  isApproved: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Column({ type: 'bigint', nullable: true, name: 'approved_by' })
  approvedById: number;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'bigint', nullable: true, name: 'created_by' })
  createdBy: number;

  @Column({ type: 'bigint', nullable: true, name: 'updated_by' })
  updatedBy: number;
}
