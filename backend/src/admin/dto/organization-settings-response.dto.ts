import { Expose } from 'class-transformer';

export class OrganizationSettingsResponseDto {
  // ID Patterns
  @Expose()
  employeeIdPattern: string;

  @Expose()
  employeeIdSequence: number;

  @Expose()
  payrollIdPattern: string;

  @Expose()
  payrollIdSequence: number;

  @Expose()
  leaveIdPattern: string;

  @Expose()
  leaveIdSequence: number;

  @Expose()
  expenseIdPattern: string;

  @Expose()
  expenseIdSequence: number;

  @Expose()
  shiftIdPattern: string;

  @Expose()
  shiftIdSequence: number;

  @Expose()
  departmentCodePattern: string;

  @Expose()
  departmentCodeSequence: number;

  // General Settings
  @Expose()
  fiscalYearStartMonth: number;

  @Expose()
  defaultCurrency: string;

  @Expose()
  timezone: string;

  @Expose()
  dateFormat: string;

  // Payroll Settings
  @Expose()
  payrollFrequency: string;

  @Expose()
  payrollDayOfMonth: number;

  // Leave Settings
  @Expose()
  leaveYearStartMonth: number;

  @Expose()
  carryForwardEnabled: boolean;

  @Expose()
  maxCarryForwardDays: number;

  // Working Time Settings
  @Expose()
  standardWorkingHoursPerDay: number;

  @Expose()
  standardWorkingDaysPerWeek: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // organizationId: number;
}
