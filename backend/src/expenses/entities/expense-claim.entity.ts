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
import { ExpenseCategory } from './expense-category.entity';

@Entity({ schema: 'expenses', name: 'expense_claims' })
export class ExpenseClaim {
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

  @Column({ type: 'varchar', length: 50, unique: true, name: 'claim_number' })
  claimNumber: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE', name: 'claim_date' })
  claimDate: Date;

  @ManyToOne(() => ExpenseCategory)
  @JoinColumn({ name: 'expense_category_id' })
  expenseCategory: ExpenseCategory;

  @Column({ type: 'bigint', name: 'expense_category_id' })
  expenseCategoryId: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date', name: 'expense_date' })
  expenseDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'text', array: true, nullable: true, name: 'receipt_urls' })
  receiptUrls: string[];

  @Column({ type: 'boolean', default: false, name: 'has_receipt' })
  hasReceipt: boolean;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // pending, approved, rejected, paid

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'submitted_at' })
  submittedAt: Date;

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

  @Column({ type: 'varchar', length: 20, default: 'pending', name: 'payment_status' })
  paymentStatus: string; // pending, processing, paid, failed

  @Column({ type: 'timestamp', nullable: true, name: 'paid_at' })
  paidAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'payment_reference' })
  paymentReference: string;

  @Column({ type: 'bigint', nullable: true, name: 'payslip_id' })
  payslipId: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
