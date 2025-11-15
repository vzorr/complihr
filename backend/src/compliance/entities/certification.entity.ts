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

@Entity({ schema: 'compliance', name: 'certifications' })
export class Certification {
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

  @Column({ type: 'varchar', length: 100, name: 'certification_type' })
  certificationType: string; // food_hygiene, health_safety, first_aid, fire_safety, manual_handling, etc.

  @Column({ type: 'varchar', length: 200, name: 'certification_name' })
  certificationName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'issuing_body' })
  issuingBody: string; // CIEH, RSPH, St John Ambulance, etc.

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'certificate_number' })
  certificateNumber: string;

  @Column({ type: 'varchar', length: 20, default: 'level_2' })
  level: string; // level_1, level_2, level_3, level_4, advanced

  @Column({ type: 'date', name: 'issue_date' })
  issueDate: Date;

  @Column({ type: 'date', name: 'expiry_date' })
  expiryDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string; // active, expired, expiring_soon, revoked

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'document_url' })
  documentUrl: string; // Path to certificate document

  @Column({ type: 'boolean', default: false, name: 'is_mandatory' })
  isMandatory: boolean; // Required by law or company policy

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'int', nullable: true, name: 'verified_by_id' })
  verifiedById: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'verified_by_id' })
  verifiedBy: User;

  @Column({ type: 'timestamp', nullable: true, name: 'verified_at' })
  verifiedAt: Date;

  @Column({ type: 'int', nullable: true, name: 'renewal_reminder_days' })
  renewalReminderDays: number; // Days before expiry to send reminder

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at' })
  deletedAt: Date;
}
