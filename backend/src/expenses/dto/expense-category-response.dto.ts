import { Expose } from 'class-transformer';

export class ExpenseCategoryResponseDto {
  @Expose()
  publicId: string;

  @Expose()
  categoryName: string;

  @Expose()
  categoryCode?: string;

  @Expose()
  description?: string;

  @Expose()
  parentCategoryId?: number;

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
