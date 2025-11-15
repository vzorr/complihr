import { Expose, Transform } from 'class-transformer';

export class TrainingRecordResponseDto {
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
  trainingName: string;

  @Expose()
  trainingType: string;

  @Expose()
  trainingProvider?: string;

  @Expose()
  description?: string;

  @Expose()
  scheduledDate: Date;

  @Expose()
  completionDate?: Date;

  @Expose()
  status: string;

  @Expose()
  durationHours?: number;

  @Expose()
  outcome?: string;

  @Expose()
  scorePercentage?: number;

  @Expose()
  trainerNotes?: string;

  @Expose()
  employeeFeedback?: string;

  @Expose()
  @Transform(({ obj }) =>
    obj.trainer ? `${obj.trainer.firstName} ${obj.trainer.lastName}` : null,
  )
  trainerName?: string;

  @Expose()
  certificateUrl?: string;

  @Expose()
  isMandatory: boolean;

  @Expose()
  renewalDate?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number;
  // employeeId: number;
  // trainerId: number;
}
