import { Expose, Transform } from 'class-transformer';

export class ShiftResponseDto {
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
  @Transform(({ obj }) => obj.department?.name || null)
  departmentName?: string;

  @Expose()
  shiftDate: Date;

  @Expose()
  startTime: string;

  @Expose()
  endTime: string;

  @Expose()
  durationHours: number;

  @Expose()
  shiftType: string;

  @Expose()
  status: string;

  @Expose()
  isBreakPaid: boolean;

  @Expose()
  breakDurationMinutes: number;

  @Expose()
  notes?: string;

  @Expose()
  location?: string;

  @Expose()
  position?: string;

  @Expose()
  requiresReplacement: boolean;

  @Expose()
  @Transform(({ obj }) =>
    obj.replacementEmployee
      ? `${obj.replacementEmployee.firstName} ${obj.replacementEmployee.lastName}`
      : null,
  )
  replacementEmployeeName?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // employeeId: number;
  // departmentId: number;
  // replacementEmployeeId: number;
}
