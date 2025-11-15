import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
  IsIn,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class CreateShiftDto {
  @IsNumber()
  employeeId: number;

  @IsNumber()
  @IsOptional()
  departmentId?: number;

  @IsDateString()
  shiftDate: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string;

  @IsNumber()
  @Min(0.5)
  @Max(24)
  durationHours: number;

  @IsString()
  @IsOptional()
  @IsIn(['regular', 'opening', 'closing', 'overnight', 'split'])
  shiftType?: string;

  @IsString()
  @IsOptional()
  @IsIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
  status?: string;

  @IsBoolean()
  @IsOptional()
  isBreakPaid?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(120)
  breakDurationMinutes?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  position?: string;
}
