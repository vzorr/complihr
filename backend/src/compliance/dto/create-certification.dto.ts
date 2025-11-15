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
} from 'class-validator';

export class CreateCertificationDto {
  @IsNumber()
  employeeId: number;

  @IsString()
  @IsIn([
    'food_hygiene',
    'health_safety',
    'first_aid',
    'fire_safety',
    'manual_handling',
    'safeguarding',
    'data_protection',
    'allergen_awareness',
    'age_verification',
    'conflict_resolution',
    'other',
  ])
  certificationType: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  certificationName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  issuingBody?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  certificateNumber?: string;

  @IsString()
  @IsOptional()
  @IsIn(['level_1', 'level_2', 'level_3', 'level_4', 'advanced'])
  level?: string;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  expiryDate: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  documentUrl?: string;

  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  renewalReminderDays?: number;
}
