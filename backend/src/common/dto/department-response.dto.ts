import { Expose, Transform } from 'class-transformer';

export class DepartmentResponseDto {
  @Expose()
  publicId: string;

  @Expose()
  name: string;

  @Expose()
  code: string;

  @Expose()
  description?: string;

  @Expose()
  @Transform(({ obj }) => obj.parentDepartment?.publicId)
  parentDepartmentId?: string;

  @Expose()
  @Transform(({ obj }) => obj.parentDepartment?.name)
  parentDepartmentName?: string;

  @Expose()
  @Transform(({ obj }) => obj.departmentHead?.publicId)
  departmentHeadId?: string;

  @Expose()
  @Transform(({ obj }) => obj.departmentHead ? `${obj.departmentHead.firstName} ${obj.departmentHead.lastName}` : null)
  departmentHeadName?: string;

  @Expose()
  costCenter?: string;

  @Expose()
  location?: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose internal ID
  // id: number;
}
