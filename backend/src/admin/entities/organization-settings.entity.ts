import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity({ schema: 'admin', name: 'organization_settings' })
export class OrganizationSettings {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', unique: true, name: 'organization_id' })
  organizationId: number;

  // ========================================
  // ID Pattern Configuration
  // ========================================

  @Column({
    type: 'varchar',
    length: 100,
    default: '{ORG}-EMP-{YEAR}-{SEQUENCE:5}',
    name: 'employee_id_pattern',
  })
  employeeIdPattern: string;

  @Column({ type: 'int', default: 0, name: 'employee_id_sequence' })
  employeeIdSequence: number;

  @Column({
    type: 'varchar',
    length: 100,
    default: '{ORG}-PAY-{YEAR}{MONTH}-{SEQUENCE:4}',
    name: 'payroll_id_pattern',
  })
  payrollIdPattern: string;

  @Column({ type: 'int', default: 0, name: 'payroll_id_sequence' })
  payrollIdSequence: number;

  @Column({
    type: 'varchar',
    length: 100,
    default: '{ORG}-LV-{YEAR}-{SEQUENCE:4}',
    name: 'leave_id_pattern',
  })
  leaveIdPattern: string;

  @Column({ type: 'int', default: 0, name: 'leave_id_sequence' })
  leaveIdSequence: number;

  @Column({
    type: 'varchar',
    length: 100,
    default: '{ORG}-EXP-{YEAR}-{SEQUENCE:4}',
    name: 'expense_id_pattern',
  })
  expenseIdPattern: string;

  @Column({ type: 'int', default: 0, name: 'expense_id_sequence' })
  expenseIdSequence: number;

  @Column({
    type: 'varchar',
    length: 100,
    default: '{ORG}-SH-{YYYYMMDD}-{SEQUENCE:3}',
    name: 'shift_id_pattern',
  })
  shiftIdPattern: string;

  @Column({ type: 'int', default: 0, name: 'shift_id_sequence' })
  shiftIdSequence: number;

  @Column({
    type: 'varchar',
    length: 100,
    default: '{ORG}-DEPT-{SEQUENCE:3}',
    name: 'department_code_pattern',
  })
  departmentCodePattern: string;

  @Column({ type: 'int', default: 0, name: 'department_code_sequence' })
  departmentCodeSequence: number;

  // ========================================
  // General Settings
  // ========================================

  @Column({ type: 'int', default: 4, name: 'fiscal_year_start_month' })
  fiscalYearStartMonth: number; // April = 4 (UK tax year)

  @Column({ type: 'varchar', length: 3, default: 'GBP', name: 'default_currency' })
  defaultCurrency: string;

  @Column({ type: 'varchar', length: 50, default: 'Europe/London' })
  timezone: string;

  @Column({ type: 'varchar', length: 20, default: 'DD/MM/YYYY', name: 'date_format' })
  dateFormat: string;

  // ========================================
  // Payroll Settings
  // ========================================

  @Column({ type: 'varchar', length: 20, default: 'Monthly', name: 'payroll_frequency' })
  payrollFrequency: string; // Weekly, Fortnightly, Monthly

  @Column({ type: 'int', default: 28, name: 'payroll_day_of_month' })
  payrollDayOfMonth: number;

  // ========================================
  // Leave Settings
  // ========================================

  @Column({ type: 'int', default: 1, name: 'leave_year_start_month' })
  leaveYearStartMonth: number; // January = 1

  @Column({ type: 'boolean', default: true, name: 'carry_forward_enabled' })
  carryForwardEnabled: boolean;

  @Column({ type: 'int', default: 5, name: 'max_carry_forward_days' })
  maxCarryForwardDays: number;

  // ========================================
  // Working Time Settings
  // ========================================

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 8.0,
    name: 'standard_working_hours_per_day',
  })
  standardWorkingHoursPerDay: number;

  @Column({ type: 'int', default: 5, name: 'standard_working_days_per_week' })
  standardWorkingDaysPerWeek: number;

  // ========================================
  // Audit
  // ========================================

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
