import { Expose, Transform } from 'class-transformer';

export class AttendanceResponseDto {
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
  attendanceDate: Date;

  @Expose()
  clockInTime?: Date;

  @Expose()
  clockOutTime?: Date;

  @Expose()
  totalBreakMinutes: number;

  @Expose()
  totalWorkMinutes?: number;

  @Expose()
  overtimeMinutes: number;

  @Expose()
  scheduledStart?: string;

  @Expose()
  scheduledEnd?: string;

  @Expose()
  attendanceStatus?: string;

  @Expose()
  isLate: boolean;

  @Expose()
  lateByMinutes: number;

  @Expose()
  isEarlyDeparture: boolean;

  @Expose()
  earlyDepartureMinutes: number;

  @Expose()
  isApproved: boolean;

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
  notes?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // employeeId: number;
  // shiftId: number;
  // approvedById: number;
  // createdBy: number;
  // updatedBy: number;
}

export class ClockEventResponseDto {
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
  eventType: string;

  @Expose()
  eventTimestamp: Date;

  @Expose()
  locationName?: string;

  @Expose()
  deviceType?: string;

  @Expose()
  isManualEntry: boolean;

  @Expose()
  manualEntryReason?: string;

  @Expose()
  createdAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // employeeId: number;
  // latitude: number;
  // longitude: number;
  // ipAddress: string;
  // deviceId: string;
  // photoUrl: string;
  // shiftId: number;
  // approvedById: number;
}
