import {
  IsNumber,
  IsDate,
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @IsNumber()
  @IsOptional()
  employeeId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  documentName: string;

  @IsString()
  @MaxLength(100)
  documentType: string;

  @IsString()
  fileUrl: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  fileName?: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  mimeType?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  issueDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiryDate?: Date;

  @IsBoolean()
  @IsOptional()
  isConfidential?: boolean;
}
