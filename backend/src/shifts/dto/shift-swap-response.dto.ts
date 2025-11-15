import { Expose, Transform } from 'class-transformer';

export class ShiftSwapResponseDto {
  @Expose()
  publicId: string;

  @Expose()
  @Transform(({ obj }) =>
    obj.requestingEmployee
      ? `${obj.requestingEmployee.firstName} ${obj.requestingEmployee.lastName}`
      : null,
  )
  requestingEmployeeName?: string;

  @Expose()
  @Transform(({ obj }) =>
    obj.targetEmployee
      ? `${obj.targetEmployee.firstName} ${obj.targetEmployee.lastName}`
      : null,
  )
  targetEmployeeName?: string;

  @Expose()
  @Transform(({ obj }) => obj.originalShift?.publicId || null)
  originalShiftPublicId?: string;

  @Expose()
  @Transform(({ obj }) => obj.replacementShift?.publicId || null)
  replacementShiftPublicId?: string;

  @Expose()
  status: string;

  @Expose()
  reason?: string;

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
  rejectionReason?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // requestingEmployeeId: number;
  // originalShiftId: number;
  // targetEmployeeId: number;
  // replacementShiftId: number;
  // approvedById: number;
}
