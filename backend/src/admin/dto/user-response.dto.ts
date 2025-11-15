import { Expose, Transform } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  publicId: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  @Transform(({ obj }) => `${obj.firstName || ''} ${obj.lastName || ''}`.trim())
  fullName: string;

  @Expose()
  isActive: boolean;

  @Expose()
  isVerified: boolean;

  @Expose()
  mustChangePassword: boolean;

  @Expose()
  lastLoginAt?: Date;

  @Expose()
  lastLoginIp?: string;

  @Expose()
  passwordChangedAt?: Date;

  @Expose()
  @Transform(({ obj }) =>
    obj.roles ? obj.roles.map((role) => ({
      publicId: role.publicId,
      name: role.name,
      displayName: role.displayName,
    })) : [],
  )
  roles?: Array<{
    publicId: string;
    name: string;
    displayName: string;
  }>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // passwordHash: string;
  // failedLoginAttempts: number;
  // lockedUntil: Date;
  // createdBy: number;
  // updatedBy: number;
}
