import { Expose } from 'class-transformer';

export class DesignationResponseDto {
  @Expose()
  publicId: string;

  @Expose()
  title: string;

  @Expose()
  code?: string;

  @Expose()
  description?: string;

  @Expose()
  jobDescription?: string;

  @Expose()
  level?: number;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // createdBy: number;
  // updatedBy: number;
}
