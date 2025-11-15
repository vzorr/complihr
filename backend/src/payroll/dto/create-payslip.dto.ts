import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
}

export class CreatePayslipDto {
  @IsNumber()
  employeeId: number;

  @IsNumber()
  payPeriodId: number;

  @IsNumber()
  @Min(0)
  baseSalary: number;

  @IsNumber()
  @Min(0)
  grossPay: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalDeductions?: number;

  @IsNumber()
  @Min(0)
  netPay: number;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  taxCode?: string;

  @IsString()
  @MaxLength(1)
  @IsOptional()
  niCategory?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  payeTax?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  niEmployee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  niEmployer?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  studentLoanDeduction?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pensionEmployee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  pensionEmployer?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ytdGross?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ytdPaye?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ytdNiEmployee?: number;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsString()
  @IsOptional()
  payslipPdfUrl?: string;
}
