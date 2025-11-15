import {
  IsNumber,
  IsDate,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum HalfDayPeriod {
  FIRST_HALF = 'first_half',
  SECOND_HALF = 'second_half',
}

export class CreateLeaveRequestDto {
  @IsNumber()
  employeeId: number;

  @IsNumber()
  leaveTypeId: number;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsNumber()
  @Min(0.5)
  totalDays: number;

  @IsBoolean()
  @IsOptional()
  isHalfDay?: boolean;

  @IsEnum(HalfDayPeriod)
  @IsOptional()
  halfDayPeriod?: HalfDayPeriod;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  reason?: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  emergencyContactDuringLeave?: string;
}
