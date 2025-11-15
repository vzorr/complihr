import {
  IsString,
  IsEmail,
  IsOptional,
  IsDate,
  IsNumber,
  IsEnum,
  MaxLength,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum EmploymentType {
  FULL_TIME = 'Full-Time',
  PART_TIME = 'Part-Time',
  CASUAL = 'Casual',
  CONTRACT = 'Contract',
}

export enum EmploymentStatus {
  ACTIVE = 'Active',
  PROBATION = 'Probation',
  NOTICE = 'Notice',
  SUSPENDED = 'Suspended',
  TERMINATED = 'Terminated',
}

export class CreateEmployeeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  employeeNumber: string;

  // Personal Information
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  middleName?: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  preferredName?: string;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  gender?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  nationality?: string;

  // Contact Information - Accept both 'email' (convenience) and specific email fields
  @IsEmail()
  @IsOptional()
  email?: string; // Maps to workEmail

  @IsEmail()
  @IsOptional()
  personalEmail?: string;

  @IsEmail()
  @IsOptional()
  workEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneNumber?: string; // Maps to mobilePhone

  @IsString()
  @IsOptional()
  @MaxLength(20)
  mobilePhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  homePhone?: string;

  // Address
  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine1?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine2?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  county?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  postcode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2)
  country?: string;

  // Employment Details
  @IsNumber()
  @IsOptional()
  departmentId?: number;

  @IsNumber()
  @IsOptional()
  designationId?: number;

  @IsNumber()
  @IsOptional()
  reportingManagerId?: number;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsEnum(EmploymentStatus)
  @IsOptional()
  employmentStatus?: EmploymentStatus;

  @IsDateString()
  @IsOptional()
  joinDate?: string; // Maps to dateOfJoining

  @IsDateString()
  @IsOptional()
  dateOfJoining?: string;

  @IsNumber()
  @IsOptional()
  noticePeriodDays?: number;

  // Salary
  @IsNumber()
  @IsOptional()
  salary?: number;

  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  payFrequency?: string;
}
