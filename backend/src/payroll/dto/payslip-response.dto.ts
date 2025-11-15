import { Expose, Transform } from 'class-transformer';

export class PayslipResponseDto {
  @Expose()
  publicId: string;

  @Expose()
  @Transform(({ obj }) =>
    obj.employee
      ? `${obj.employee.firstName} ${obj.employee.lastName}`
      : null,
  )
  employeeName?: string;

  @Expose()
  @Transform(({ obj }) => obj.employee?.employeeNumber || null)
  employeeNumber?: string;

  @Expose()
  payPeriodId: number;

  @Expose()
  baseSalary: number;

  @Expose()
  grossPay: number;

  @Expose()
  totalDeductions: number;

  @Expose()
  netPay: number;

  @Expose()
  taxCode?: string;

  @Expose()
  niCategory?: string;

  @Expose()
  payeTax: number;

  @Expose()
  niEmployee: number;

  @Expose()
  niEmployer: number;

  @Expose()
  studentLoanDeduction: number;

  @Expose()
  pensionEmployee: number;

  @Expose()
  pensionEmployer: number;

  @Expose()
  ytdGross: number;

  @Expose()
  ytdPaye: number;

  @Expose()
  ytdNiEmployee: number;

  @Expose()
  paymentStatus: string;

  @Expose()
  payslipPdfUrl?: string;

  @Expose()
  createdAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // employeeId: number;
}
