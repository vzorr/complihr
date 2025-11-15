import { Expose, Transform } from 'class-transformer';

export class CertificationResponseDto {
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
  certificationType: string;

  @Expose()
  certificationName: string;

  @Expose()
  issuingBody?: string;

  @Expose()
  certificateNumber?: string;

  @Expose()
  level: string;

  @Expose()
  issueDate: Date;

  @Expose()
  expiryDate: Date;

  @Expose()
  status: string;

  @Expose()
  notes?: string;

  @Expose()
  documentUrl?: string;

  @Expose()
  isMandatory: boolean;

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
  renewalReminderDays?: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // employeeId: number;
  // verifiedById: number;
}
