import { Expose, Transform } from 'class-transformer';

export class ExpenseClaimResponseDto {
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
  claimNumber: string;

  @Expose()
  claimDate: Date;

  @Expose()
  @Transform(({ obj }) => obj.expenseCategory?.categoryName || null)
  categoryName?: string;

  @Expose()
  description: string;

  @Expose()
  expenseDate: Date;

  @Expose()
  amount: number;

  @Expose()
  currency: string;

  @Expose()
  hasReceipt: boolean;

  @Expose()
  status: string;

  @Expose()
  submittedAt: Date;

  @Expose()
  @Transform(({ obj }) =>
    obj.approvedBy
      ? `${obj.approvedBy.firstName} ${obj.approvedBy.lastName}`
      : null,
  )
  approvedByName?: string;

  @Expose()
  approvedAt?: Date;

  @Expose()
  @Transform(({ obj }) =>
    obj.rejectedBy
      ? `${obj.rejectedBy.firstName} ${obj.rejectedBy.lastName}`
      : null,
  )
  rejectedByName?: string;

  @Expose()
  rejectedAt?: Date;

  @Expose()
  rejectionReason?: string;

  @Expose()
  paymentStatus: string;

  @Expose()
  paidAt?: Date;

  @Expose()
  paymentReference?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // employeeId: number;
  // expenseCategoryId: number;
  // receiptUrls: string[];
  // approvedById: number;
  // rejectedById: number;
  // payslipId: number;
}
