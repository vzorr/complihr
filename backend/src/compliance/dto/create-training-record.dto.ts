import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class CreateTrainingRecordDto {
  @IsNumber()
  employeeId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  trainingName: string;

  @IsString()
  @IsIn(['induction', 'mandatory', 'skill_development', 'refresher', 'compliance'])
  trainingType: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  trainingProvider?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  scheduledDate: string;

  @IsDateString()
  @IsOptional()
  completionDate?: string;

  @IsString()
  @IsOptional()
  @IsIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'failed'])
  status?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.5)
  durationHours?: number;

  @IsString()
  @IsOptional()
  @IsIn(['pass', 'fail', 'attended', 'not_attended'])
  outcome?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  scorePercentage?: number;

  @IsString()
  @IsOptional()
  trainerNotes?: string;

  @IsString()
  @IsOptional()
  employeeFeedback?: string;

  @IsNumber()
  @IsOptional()
  trainerId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  certificateUrl?: string;

  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @IsDateString()
  @IsOptional()
  renewalDate?: string;
}
