import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Generated,
} from 'typeorm';
import { Employee } from '../../core/entities/employee.entity';

@Entity({ schema: 'payroll', name: 'payslips' })
export class Payslip {
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

  @Column({ type: 'bigint', name: 'pay_period_id' })
  payPeriodId: number;

  // Salary details
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'base_salary' })
  baseSalary: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'gross_pay' })
  grossPay: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_deductions' })
  totalDeductions: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'net_pay' })
  netPay: number;

  // UK specific
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'tax_code' })
  taxCode: string;

  @Column({ type: 'varchar', length: 1, nullable: true, name: 'ni_category' })
  niCategory: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'paye_tax' })
  payeTax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'ni_employee' })
  niEmployee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'ni_employer' })
  niEmployer: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'student_loan_deduction' })
  studentLoanDeduction: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'pension_employee' })
  pensionEmployee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'pension_employer' })
  pensionEmployer: number;

  // YTD totals
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'ytd_gross' })
  ytdGross: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'ytd_paye' })
  ytdPaye: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'ytd_ni_employee' })
  ytdNiEmployee: number;

  // Payment
  @Column({ type: 'varchar', length: 20, default: 'pending', name: 'payment_status' })
  paymentStatus: string; // pending, processing, paid, failed

  @Column({ type: 'text', nullable: true, name: 'payslip_pdf_url' })
  payslipPdfUrl: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
