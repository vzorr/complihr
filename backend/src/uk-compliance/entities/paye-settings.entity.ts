import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from '../../core/entities/employee.entity';

@Entity({ schema: 'uk_compliance', name: 'paye_settings' })
export class PayeSettings {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'bigint', unique: true, name: 'employee_id' })
  employeeId: number;

  @Column({ type: 'varchar', length: 20, default: '1257L', name: 'tax_code' })
  taxCode: string;

  @Column({ type: 'varchar', length: 20, default: 'cumulative', name: 'tax_basis' })
  taxBasis: string; // cumulative, week1month1

  @Column({ type: 'boolean', default: false, name: 'is_week1month1' })
  isWeek1Month1: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'student_loan_plan' })
  studentLoanPlan: string; // plan1, plan2, plan4, postgrad

  @Column({ type: 'date', name: 'effective_from' })
  effectiveFrom: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
