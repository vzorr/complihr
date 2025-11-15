import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Generated,
} from 'typeorm';
import { Employee } from '../../core/entities/employee.entity';
import { User } from '../../admin/entities/user.entity';

@Entity({ schema: 'performance', name: 'monthly_reviews' })
export class MonthlyReview {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Generated('uuid')
  @Column({ type: 'uuid', unique: true, name: 'public_id' })
  publicId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'bigint', name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ type: 'bigint', name: 'reviewer_id' })
  reviewerId: number;

  @Column({ type: 'bigint', nullable: true, name: 'review_template_id' })
  reviewTemplateId: number;

  @Column({ type: 'int', name: 'review_month' })
  reviewMonth: number; // 1-12

  @Column({ type: 'int', name: 'review_year' })
  reviewYear: number;

  // Retail KPIs (1-5 rating scale)
  @Column({ type: 'smallint', nullable: true, name: 'attendance_rating' })
  attendanceRating: number;

  @Column({ type: 'smallint', nullable: true, name: 'punctuality_rating' })
  punctualityRating: number;

  @Column({ type: 'smallint', nullable: true, name: 'customer_service_rating' })
  customerServiceRating: number;

  @Column({ type: 'smallint', nullable: true, name: 'till_accuracy_rating' })
  tillAccuracyRating: number;

  @Column({ type: 'smallint', nullable: true, name: 'teamwork_rating' })
  teamworkRating: number;

  @Column({ type: 'smallint', nullable: true, name: 'product_knowledge_rating' })
  productKnowledgeRating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, name: 'overall_rating' })
  overallRating: number;

  @Column({ type: 'varchar', length: 20, default: 'satisfactory', name: 'performance_status' })
  performanceStatus: string; // excellent, good, satisfactory, needs_improvement, unsatisfactory

  @Column({ type: 'text', nullable: true })
  strengths: string;

  @Column({ type: 'text', nullable: true, name: 'areas_for_improvement' })
  areasForImprovement: string;

  @Column({ type: 'text', nullable: true, name: 'action_points' })
  actionPoints: string;

  @Column({ type: 'text', nullable: true, name: 'manager_comments' })
  managerComments: string;

  @Column({ type: 'text', nullable: true, name: 'employee_comments' })
  employeeComments: string;

  @Column({ type: 'boolean', nullable: true, name: 'previous_goals_achieved' })
  previousGoalsAchieved: boolean;

  @Column({ type: 'text', nullable: true, name: 'new_goals' })
  newGoals: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string; // draft, completed, acknowledged

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'boolean', default: false, name: 'acknowledged_by_employee' })
  acknowledgedByEmployee: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'acknowledged_at' })
  acknowledgedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'reviewer_signature' })
  reviewerSignature: string;

  @Column({ type: 'text', nullable: true, name: 'employee_signature' })
  employeeSignature: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
