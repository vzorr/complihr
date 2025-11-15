import { Expose, Transform } from 'class-transformer';

export class DocumentResponseDto {
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
  documentName: string;

  @Expose()
  documentType: string;

  @Expose()
  fileUrl: string;

  @Expose()
  fileName?: string;

  @Expose()
  fileSize?: number;

  @Expose()
  mimeType?: string;

  @Expose()
  description?: string;

  @Expose()
  issueDate?: Date;

  @Expose()
  expiryDate?: Date;

  @Expose()
  isConfidential: boolean;

  @Expose()
  isVerified: boolean;

  @Expose()
  @Transform(({ obj }) =>
    obj.verifiedBy
      ? `${obj.verifiedBy.firstName} ${obj.verifiedBy.lastName}`
      : null,
  )
  verifiedByName?: string;

  @Expose()
  verifiedAt?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // employeeId: number;
  // verifiedById: number;
  // createdBy: number;
  // updatedBy: number;
}
