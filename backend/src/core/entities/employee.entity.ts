import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Generated,
} from 'typeorm';
import { Department } from './department.entity';
import { Designation } from './designation.entity';
import { User } from '../../admin/entities/user.entity';

@Entity({ schema: 'core', name: 'employees' })
export class Employee {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number; // Internal database ID - NEVER expose in API

  @Generated('uuid')
  @Column({ type: 'uuid', unique: true, name: 'public_id' })
  publicId: string; // Public-facing UUID - USE IN ALL APIs

  @Column({ type: 'varchar', length: 50, unique: true, name: 'employee_number' })
  employeeNumber: string; // Business ID - Human-readable (EMP202400001)

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'bigint', nullable: true, name: 'user_id' })
  userId: number;

  // Personal Information
  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'middle_name' })
  middleName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'preferred_name' })
  preferredName: string;

  @Column({ type: 'date', name: 'date_of_birth' })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string;

  @Column({ type: 'varchar', length: 50, default: 'British' })
  nationality: string;

  // Contact Information
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'personal_email' })
  personalEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'work_email' })
  workEmail: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'mobile_phone' })
  mobilePhone: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'home_phone' })
  homePhone: string;

  // Address
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'address_line1' })
  addressLine1: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'address_line2' })
  addressLine2: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  county: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  postcode: string;

  @Column({ type: 'varchar', length: 2, default: 'GB' })
  country: string;

  // Emergency Contact
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'emergency_contact_name' })
  emergencyContactName: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'emergency_contact_relationship' })
  emergencyContactRelationship: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'emergency_contact_phone' })
  emergencyContactPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'emergency_contact_email' })
  emergencyContactEmail: string;

  // Employment Details
  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ type: 'bigint', nullable: true, name: 'department_id' })
  departmentId: number;

  @ManyToOne(() => Designation, { nullable: true })
  @JoinColumn({ name: 'designation_id' })
  designation: Designation;

  @Column({ type: 'bigint', nullable: true, name: 'designation_id' })
  designationId: number;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'reporting_manager_id' })
  reportingManager: Employee;

  @Column({ type: 'bigint', nullable: true, name: 'reporting_manager_id' })
  reportingManagerId: number;

  @Column({ type: 'varchar', length: 20, name: 'employment_type' })
  employmentType: string; // FullTime, PartTime, Casual, Contract

  @Column({ type: 'varchar', length: 20, default: 'Active', name: 'employment_status' })
  employmentStatus: string; // Active, Probation, Notice, Suspended, Terminated

  @Column({ type: 'date', name: 'date_of_joining' })
  dateOfJoining: Date;

  @Column({ type: 'date', nullable: true, name: 'probation_end_date' })
  probationEndDate: Date;

  @Column({ type: 'date', nullable: true, name: 'confirmation_date' })
  confirmationDate: Date;

  @Column({ type: 'date', nullable: true, name: 'date_of_leaving' })
  dateOfLeaving: Date;

  @Column({ type: 'int', default: 30, name: 'notice_period_days' })
  noticePeriodDays: number;

  // Salary
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  salary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'hourly_rate' })
  hourlyRate: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency: string;

  @Column({ type: 'varchar', length: 20, default: 'Monthly', name: 'pay_frequency' })
  payFrequency: string; // Weekly, Fortnightly, Monthly

  // Profile
  @Column({ type: 'text', nullable: true, name: 'profile_photo_url' })
  profilePhotoUrl: string;

  @Column({ type: 'text', nullable: true })
  biography: string;

  @Column({ type: 'text', array: true, nullable: true })
  skills: string[];

  @Column({ type: 'text', array: true, nullable: true })
  languages: string[];

  // Audit fields
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'bigint', nullable: true, name: 'created_by' })
  createdBy: number;

  @Column({ type: 'bigint', nullable: true, name: 'updated_by' })
  updatedBy: number;

  @DeleteDateColumn({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt: Date;

  // Virtual fields
  get fullName(): string {
    return `${this.firstName || ''} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName || ''}`.trim();
  }

  get displayName(): string {
    return this.preferredName || this.fullName;
  }

  get age(): number {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
