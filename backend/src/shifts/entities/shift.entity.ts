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
import { Department } from '../../core/entities/department.entity';

@Entity({ schema: 'time_tracking', name: 'shifts' })
export class Shift {
  @PrimaryGeneratedColumn()
  id: number;

  @Generated('uuid')
  @Column({ type: 'uuid', unique: true, name: 'public_id' })
  publicId: string;

  @Column({ type: 'int', name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'int', nullable: true, name: 'department_id' })
  departmentId: number;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ type: 'date', name: 'shift_date' })
  shiftDate: Date;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'duration_hours' })
  durationHours: number;

  @Column({ type: 'varchar', length: 50, default: 'regular' })
  shiftType: string; // regular, opening, closing, overnight, split

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: string; // scheduled, confirmed, in_progress, completed, cancelled, no_show

  @Column({ type: 'boolean', default: false, name: 'is_break_paid' })
  isBreakPaid: boolean;

  @Column({ type: 'int', default: 30, name: 'break_duration_minutes' })
  breakDurationMinutes: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string; // Store location or specific area

  @Column({ type: 'varchar', length: 100, nullable: true })
  position: string; // Till, stockroom, customer service, etc.

  @Column({ type: 'boolean', default: false, name: 'requires_replacement' })
  requiresReplacement: boolean; // For shift swaps

  @Column({ type: 'int', nullable: true, name: 'replacement_employee_id' })
  replacementEmployeeId: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'replacement_employee_id' })
  replacementEmployee: Employee;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at' })
  deletedAt: Date;
}
