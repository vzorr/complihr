import { Expose, Transform } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  publicId: string;

  @Expose()
  email: string;

  @Expose()
  username?: string;

  @Expose()
  @Transform(({ obj }) => obj.employee?.publicId)
  employeeId?: string;

  @Expose()
  @Transform(({ obj }) => obj.employee ? `${obj.employee.firstName} ${obj.employee.lastName}` : null)
  employeeName?: string;

  @Expose()
  isActive: boolean;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  lastLogin?: Date;

  @Expose()
  @Transform(({ obj }) => obj.roles?.map(role => ({ publicId: role.publicId, name: role.name, displayName: role.displayName })))
  roles?: Array<{ publicId: string; name: string; displayName: string }>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number; // Internal ID
  // password: string; // Security risk
  // passwordHash: string; // Security risk
  // resetPasswordToken: string; // Security risk
  // twoFactorSecret: string; // Security risk
}
