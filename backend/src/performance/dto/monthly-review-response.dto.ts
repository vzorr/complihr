import { Expose, Transform } from 'class-transformer';

export class MonthlyReviewResponseDto {
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
  @Transform(({ obj }) =>
    obj.reviewer
      ? `${obj.reviewer.firstName} ${obj.reviewer.lastName}`
      : null,
  )
  reviewerName?: string;

  @Expose()
  reviewMonth: number;

  @Expose()
  reviewYear: number;

  @Expose()
  attendanceRating?: number;

  @Expose()
  punctualityRating?: number;

  @Expose()
  customerServiceRating?: number;

  @Expose()
  tillAccuracyRating?: number;

  @Expose()
  teamworkRating?: number;

  @Expose()
  productKnowledgeRating?: number;

  @Expose()
  overallRating?: number;

  @Expose()
  performanceStatus: string;

  @Expose()
  strengths?: string;

  @Expose()
  areasForImprovement?: string;

  @Expose()
  actionPoints?: string;

  @Expose()
  managerComments?: string;

  @Expose()
  employeeComments?: string;

  @Expose()
  previousGoalsAchieved?: boolean;

  @Expose()
  newGoals?: string;

  @Expose()
  status: string;

  @Expose()
  completedAt?: Date;

  @Expose()
  acknowledgedByEmployee: boolean;

  @Expose()
  acknowledgedAt?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // employeeId: number;
  // reviewerId: number;
  // reviewTemplateId: number;
  // reviewerSignature: string;
  // employeeSignature: string;
}
