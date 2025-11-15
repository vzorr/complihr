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

@Entity({ schema: 'time_tracking', name: 'clock_events' })
export class ClockEvent {
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

  @Column({ type: 'varchar', length: 20, name: 'event_type' })
  eventType: string; // clock_in, clock_out, break_start, break_end

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'event_timestamp' })
  eventTimestamp: Date;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'location_name' })
  locationName: string;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'device_type' })
  deviceType: string; // mobile, web, kiosk

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'device_id' })
  deviceId: string;

  @Column({ type: 'text', nullable: true, name: 'photo_url' })
  photoUrl: string;

  @Column({ type: 'bigint', nullable: true, name: 'shift_id' })
  shiftId: number;

  @Column({ type: 'boolean', default: false, name: 'is_manual_entry' })
  isManualEntry: boolean;

  @Column({ type: 'text', nullable: true, name: 'manual_entry_reason' })
  manualEntryReason: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Column({ type: 'bigint', nullable: true, name: 'approved_by' })
  approvedById: number;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
