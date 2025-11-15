import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export enum PerformanceStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  SATISFACTORY = 'satisfactory',
  NEEDS_IMPROVEMENT = 'needs_improvement',
  UNSATISFACTORY = 'unsatisfactory',
}

export class CreateMonthlyReviewDto {
  @IsNumber()
  employeeId: number;

  @IsNumber()
  reviewerId: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  reviewMonth: number;

  @IsNumber()
  @Min(2020)
  @Max(2100)
  reviewYear: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  attendanceRating?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  punctualityRating?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  customerServiceRating?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  tillAccuracyRating?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  teamworkRating?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  productKnowledgeRating?: number;

  @IsEnum(PerformanceStatus)
  @IsOptional()
  performanceStatus?: PerformanceStatus;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  strengths?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  areasForImprovement?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  actionPoints?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  managerComments?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  employeeComments?: string;

  @IsBoolean()
  @IsOptional()
  previousGoalsAchieved?: boolean;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  newGoals?: string;
}
