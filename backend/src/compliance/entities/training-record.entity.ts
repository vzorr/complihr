import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Generated,
} from 'typeorm';
import { Employee } from '../../core/entities/employee.entity';
import { User } from '../../admin/entities/user.entity';

@Entity({ schema: 'compliance', name: 'training_records' })
export class TrainingRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Generated('uuid')
  @Column({ type: 'uuid', unique: true, name: 'public_id' })
  publicId: string;

  @Column({ type: 'int', name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'varchar', length: 200, name: 'training_name' })
  trainingName: string;

  @Column({ type: 'varchar', length: 100, name: 'training_type' })
  trainingType: string; // induction, mandatory, skill_development, refresher, compliance

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'training_provider' })
  trainingProvider: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', name: 'scheduled_date' })
  scheduledDate: Date;

  @Column({ type: 'date', nullable: true, name: 'completion_date' })
  completionDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: string; // scheduled, in_progress, completed, cancelled, failed

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'duration_hours' })
  durationHours: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  outcome: string; // pass, fail, attended, not_attended

  @Column({ type: 'int', nullable: true, name: 'score_percentage' })
  scorePercentage: number;

  @Column({ type: 'text', nullable: true, name: 'trainer_notes' })
  trainerNotes: string;

  @Column({ type: 'text', nullable: true, name: 'employee_feedback' })
  employeeFeedback: string;

  @Column({ type: 'int', nullable: true, name: 'trainer_id' })
  trainerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'trainer_id' })
  trainer: User;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'certificate_url' })
  certificateUrl: string;

  @Column({ type: 'boolean', default: false, name: 'is_mandatory' })
  isMandatory: boolean;

  @Column({ type: 'date', nullable: true, name: 'renewal_date' })
  renewalDate: Date; // If training needs to be repeated

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at' })
  deletedAt: Date;
}
