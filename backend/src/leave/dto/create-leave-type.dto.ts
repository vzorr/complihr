import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
  Min,
  Max,
} from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color must be a valid hex color code (e.g., #1976d2)',
  })
  color?: string;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresDocument?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDaysPerYear?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minDaysNotice?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxConsecutiveDays?: number;

  @IsBoolean()
  @IsOptional()
  isCarryForward?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  carryForwardMaxDays?: number;

  @IsBoolean()
  @IsOptional()
  isEncashable?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(['male', 'female'])
  genderSpecific?: string;

  @IsBoolean()
  @IsOptional()
  isStatutory?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  displayOrder?: number;
}
