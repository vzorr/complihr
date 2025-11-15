import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  categoryName: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  categoryCode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  parentCategoryId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
