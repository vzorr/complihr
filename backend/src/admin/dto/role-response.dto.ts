import { Expose, Transform } from 'class-transformer';

export class RoleResponseDto {
  @Expose()
  publicId: string;

  @Expose()
  name: string;

  @Expose()
  displayName: string;

  @Expose()
  description?: string;

  @Expose()
  isSystemRole: boolean;

  @Expose()
  @Transform(({ obj }) =>
    obj.permissions?.map((p: any) => ({
      publicId: p.publicId,
      name: p.name,
      displayName: p.displayName,
      resource: p.resource,
      action: p.action,
    })) || [],
  )
  permissions: Array<{
    publicId: string;
    name: string;
    displayName: string;
    resource: string;
    action: string;
  }>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // createdBy: number;
  // updatedBy: number;
}
