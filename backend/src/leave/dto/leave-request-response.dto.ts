import { Expose, Transform } from 'class-transformer';

export class LeaveRequestResponseDto {
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
  @Transform(({ obj }) => obj.leaveType?.name || null)
  leaveTypeName?: string;

  @Expose()
  @Transform(({ obj }) => obj.leaveType?.color || null)
  leaveTypeColor?: string;

  @Expose()
  startDate: Date;

  @Expose()
  endDate: Date;

  @Expose()
  totalDays: number;

  @Expose()
  isHalfDay: boolean;

  @Expose()
  halfDayPeriod?: string;

  @Expose()
  reason?: string;

  @Expose()
  emergencyContactDuringLeave?: string;

  @Expose()
  status: string;

  @Expose()
  requestedAt: Date;

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
  cancelledAt?: Date;

  @Expose()
  cancellationReason?: string;

  @Expose()
  adminNotes?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // employeeId: number;
  // leaveTypeId: number;
  // approvedById: number;
  // rejectedById: number;
  // createdBy: number;
  // updatedBy: number;
}
