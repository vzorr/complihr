import { Expose, Transform } from 'class-transformer';

export class EmployeeResponseDto {
  @Expose()
  publicId: string;

  @Expose()
  employeeNumber: string;

  @Expose()
  firstName: string;

  @Expose()
  middleName?: string;

  @Expose()
  lastName: string;

  @Expose()
  @Transform(({ obj }) => obj.workEmail || obj.personalEmail || null)
  email: string;

  @Expose()
  workEmail?: string;

  @Expose()
  personalEmail?: string;

  @Expose()
  @Transform(({ obj }) => obj.mobilePhone || obj.homePhone || null)
  phoneNumber: string;

  @Expose()
  mobilePhone?: string;

  @Expose()
  homePhone?: string;

  @Expose()
  dateOfBirth: Date;

  @Expose()
  gender: string;

  @Expose()
  maritalStatus?: string;

  @Expose()
  nationality?: string;

  @Expose()
  addressLine1?: string;

  @Expose()
  addressLine2?: string;

  @Expose()
  city?: string;

  @Expose()
  county?: string;

  @Expose()
  postcode?: string;

  @Expose()
  country?: string;

  @Expose()
  @Transform(({ obj }) => obj.department?.publicId)
  departmentId?: string;

  @Expose()
  @Transform(({ obj }) => obj.department?.name)
  departmentName?: string;

  @Expose()
  @Transform(({ obj }) => obj.designation?.publicId)
  designationId?: string;

  @Expose()
  @Transform(({ obj }) => obj.designation?.title)
  designationTitle?: string;

  @Expose()
  @Transform(({ obj }) => obj.manager?.publicId)
  managerId?: string;

  @Expose()
  @Transform(({ obj }) => obj.manager ? `${obj.manager.firstName} ${obj.manager.lastName}` : null)
  managerName?: string;

  @Expose()
  employmentStatus: string;

  @Expose()
  employmentType: string;

  @Expose()
  workPattern?: string;

  @Expose()
  @Transform(({ obj }) => obj.dateOfJoining)
  joinDate: Date;

  @Expose()
  dateOfJoining?: Date;

  @Expose()
  probationEndDate?: Date;

  @Expose()
  terminationDate?: Date;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // ❌ NEVER expose these fields
  // id: number; // Internal database ID
  // nationalInsuranceNumber: string; // Sensitive PII
  // userId: number; // Internal reference
}
