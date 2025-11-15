import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Generated,
} from 'typeorm';
import { Employee } from '../../core/entities/employee.entity';
import { Shift } from './shift.entity';
import { User } from '../../admin/entities/user.entity';

@Entity({ schema: 'time_tracking', name: 'shift_swaps' })
export class ShiftSwap {
  @PrimaryGeneratedColumn()
  id: number;

  @Generated('uuid')
  @Column({ type: 'uuid', unique: true, name: 'public_id' })
  publicId: string;

  @Column({ type: 'int', name: 'requesting_employee_id' })
  requestingEmployeeId: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'requesting_employee_id' })
  requestingEmployee: Employee;

  @Column({ type: 'int', name: 'original_shift_id' })
  originalShiftId: number;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'original_shift_id' })
  originalShift: Shift;

  @Column({ type: 'int', nullable: true, name: 'target_employee_id' })
  targetEmployeeId: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'target_employee_id' })
  targetEmployee: Employee;

  @Column({ type: 'int', nullable: true, name: 'replacement_shift_id' })
  replacementShiftId: number;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'replacement_shift_id' })
  replacementShift: Shift;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // pending, approved, rejected, cancelled

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'int', nullable: true, name: 'approved_by_id' })
  approvedById: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy: User;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at' })
  deletedAt: Date;
}
