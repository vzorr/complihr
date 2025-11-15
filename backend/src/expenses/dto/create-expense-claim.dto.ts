import {
  IsNumber,
  IsDate,
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseClaimDto {
  @IsNumber()
  employeeId: number;

  @IsNumber()
  expenseCategoryId: number;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsDate()
  @Type(() => Date)
  expenseDate: Date;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @MaxLength(3)
  @IsOptional()
  currency?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  receiptUrls?: string[];

  @IsBoolean()
  @IsOptional()
  hasReceipt?: boolean;
}
