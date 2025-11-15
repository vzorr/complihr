import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsIn,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class UpdateOrganizationSettingsDto {
  // ID Patterns
  @IsString()
  @IsOptional()
  @MaxLength(100)
  employeeIdPattern?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  payrollIdPattern?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  leaveIdPattern?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  expenseIdPattern?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  shiftIdPattern?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  departmentCodePattern?: string;

  // General Settings
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(12)
  fiscalYearStartMonth?: number;

  @IsString()
  @IsOptional()
  @IsIn(['GBP', 'EUR', 'USD'])
  defaultCurrency?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;

  @IsString()
  @IsOptional()
  @IsIn(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
  dateFormat?: string;

  // Payroll Settings
  @IsString()
  @IsOptional()
  @IsIn(['Weekly', 'Fortnightly', 'Monthly'])
  payrollFrequency?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  payrollDayOfMonth?: number;

  // Leave Settings
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(12)
  leaveYearStartMonth?: number;

  @IsBoolean()
  @IsOptional()
  carryForwardEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(30)
  maxCarryForwardDays?: number;

  // Working Time Settings
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(24)
  standardWorkingHoursPerDay?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(7)
  standardWorkingDaysPerWeek?: number;
}
