import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';

export class CreateDesignationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  jobDescription?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  level?: number; // Junior=1, Mid=2, Senior=3, Lead=4, Manager=5, Director=6, VP=7, C-Level=8+

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
