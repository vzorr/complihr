import { Expose } from 'class-transformer';

export class LeaveTypeResponseDto {
  @Expose()
  publicId: string;

  @Expose()
  name: string;

  @Expose()
  code: string;

  @Expose()
  description?: string;

  @Expose()
  color: string;

  @Expose()
  isPaid: boolean;

  @Expose()
  requiresApproval: boolean;

  @Expose()
  requiresDocument: boolean;

  @Expose()
  maxDaysPerYear?: number;

  @Expose()
  minDaysNotice?: number;

  @Expose()
  maxConsecutiveDays?: number;

  @Expose()
  isCarryForward: boolean;

  @Expose()
  carryForwardMaxDays?: number;

  @Expose()
  isEncashable: boolean;

  @Expose()
  genderSpecific?: string;

  @Expose()
  isStatutory: boolean;

  @Expose()
  isActive: boolean;

  @Expose()
  displayOrder: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // createdBy: number;
  // updatedBy: number;
}
