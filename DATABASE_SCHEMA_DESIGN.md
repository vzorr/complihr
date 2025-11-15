# CompliHR - Database Schema Design & Backend Architecture

> **Comprehensive Database Schema for Complete HR Management System**
> Version: 1.0
> Last Updated: January 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Database Architecture Overview](#database-architecture-overview)
3. [Schema Organization](#schema-organization)
4. [Core Schemas & Tables](#core-schemas--tables)
5. [Relationships & Foreign Keys](#relationships--foreign-keys)
6. [Indexes & Performance Optimization](#indexes--performance-optimization)
7. [Backend API Requirements](#backend-api-requirements)
8. [Security & Access Control](#security--access-control)
9. [Data Migration Strategy](#data-migration-strategy)
10. [Appendix](#appendix)

---

## Executive Summary

CompliHR is a comprehensive HRMS requiring a robust, scalable database architecture. This document outlines a **PostgreSQL-based** multi-schema design with **45+ tables** organized into **8 logical schemas** for modularity and data segregation.

### Key Statistics
- **Total Tables:** 45+
- **Schemas:** 8 (Core, Payroll, Time, Assets, Recruitment, Compliance, Admin, Audit)
- **Estimated Relationships:** 60+ foreign key constraints
- **User Roles:** 6 distinct roles with granular permissions
- **Expected Scale:** 1,000-10,000 employees per instance

### Technology Recommendations
- **Database:** PostgreSQL 14+ (JSONB support, advanced indexing, row-level security)
- **Backend Framework:** Node.js (Express/NestJS) or Python (Django/FastAPI)
- **ORM:** Prisma (Node.js) or SQLAlchemy (Python)
- **Caching:** Redis for session management and frequent queries
- **File Storage:** AWS S3 or Azure Blob Storage
- **Search:** Elasticsearch (optional, for advanced search)

---

## Database Architecture Overview

### Design Principles

1. **Modular Schema Design**: Separate schemas for each major module (Payroll, Time, Assets, etc.)
2. **Normalization**: 3NF (Third Normal Form) to minimize redundancy
3. **Soft Deletes**: Use `deleted_at` timestamp instead of hard deletes
4. **Audit Trail**: Comprehensive tracking with `created_at`, `updated_at`, `created_by`, `updated_by`
5. **Multi-tenancy Ready**: Include `organization_id` for future SaaS deployment
6. **Performance Optimized**: Strategic indexing on foreign keys and search columns
7. **Data Integrity**: Enforce referential integrity with foreign key constraints
8. **Scalability**: Partitioning strategy for large tables (attendance, audit_logs)

### Database Naming Conventions

- **Schemas:** `snake_case` (e.g., `payroll_schema`, `time_tracking`)
- **Tables:** `snake_case`, plural (e.g., `employees`, `leave_requests`)
- **Columns:** `snake_case` (e.g., `first_name`, `created_at`)
- **Primary Keys:** `id` (BIGSERIAL/UUID)
- **Foreign Keys:** `<table>_id` (e.g., `employee_id`, `department_id`)
- **Indexes:** `idx_<table>_<column>` (e.g., `idx_employees_email`)
- **Constraints:** `fk_<child_table>_<parent_table>`, `chk_<table>_<condition>`

---

## Schema Organization

### 8 Logical Schemas

```sql
-- Core HR Schema
CREATE SCHEMA IF NOT EXISTS core;

-- Payroll & Compensation Schema
CREATE SCHEMA IF NOT EXISTS payroll;

-- Time & Attendance Schema
CREATE SCHEMA IF NOT EXISTS time_tracking;

-- Asset Management Schema
CREATE SCHEMA IF NOT EXISTS assets;

-- Recruitment Schema
CREATE SCHEMA IF NOT EXISTS recruitment;

-- Compliance & Training Schema
CREATE SCHEMA IF NOT EXISTS compliance;

-- System Administration Schema
CREATE SCHEMA IF NOT EXISTS admin;

-- Audit & Logging Schema
CREATE SCHEMA IF NOT EXISTS audit;
```

---

## Core Schemas & Tables

---

## 1. CORE SCHEMA (`core`)

**Purpose:** Employee master data, organizational structure, departments, and basic HR entities.

---

### 1.1 `core.organizations`

Multi-tenancy support for SaaS deployment.

```sql
CREATE TABLE core.organizations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  vat_number VARCHAR(50),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  logo_url TEXT,

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),

  -- Settings
  timezone VARCHAR(50) DEFAULT 'UTC',
  currency VARCHAR(3) DEFAULT 'USD',
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  time_format VARCHAR(20) DEFAULT '12h',
  first_day_of_week SMALLINT DEFAULT 0, -- 0=Sunday, 1=Monday
  working_day_start_time TIME DEFAULT '09:00:00',
  working_day_end_time TIME DEFAULT '17:00:00',

  -- Status
  is_active BOOLEAN DEFAULT true,
  subscription_plan VARCHAR(50),
  subscription_expires_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_organizations_is_active ON core.organizations(is_active) WHERE deleted_at IS NULL;
```

---

### 1.2 `core.departments`

Organizational departments with hierarchy support.

```sql
CREATE TABLE core.departments (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Department Info
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  parent_department_id BIGINT REFERENCES core.departments(id) ON DELETE SET NULL,

  -- Head of Department
  head_employee_id BIGINT, -- FK to core.employees (added later to avoid circular dependency)

  -- Budget & Cost
  cost_center VARCHAR(100),
  annual_budget DECIMAL(15, 2),

  -- Location
  location VARCHAR(255),
  floor_number VARCHAR(10),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  updated_by BIGINT,
  deleted_at TIMESTAMP,

  CONSTRAINT chk_department_parent CHECK (id != parent_department_id)
);

CREATE INDEX idx_departments_organization ON core.departments(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_departments_parent ON core.departments(parent_department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_departments_code ON core.departments(code) WHERE deleted_at IS NULL;
```

---

### 1.3 `core.job_titles`

Standardized job titles/positions within the organization.

```sql
CREATE TABLE core.job_titles (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Job Title Info
  title VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  level SMALLINT, -- 1=Entry, 2=Junior, 3=Mid, 4=Senior, 5=Lead, 6=Manager, 7=Executive

  -- Department
  department_id BIGINT REFERENCES core.departments(id) ON DELETE SET NULL,

  -- Compensation Range
  min_salary DECIMAL(15, 2),
  max_salary DECIMAL(15, 2),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_job_titles_organization ON core.job_titles(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_titles_department ON core.job_titles(department_id) WHERE deleted_at IS NULL;
```

---

### 1.4 `core.employees`

**The central table** - All employee master data.

```sql
CREATE TABLE core.employees (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Employee Identification
  employee_id VARCHAR(50) NOT NULL UNIQUE, -- e.g., EMP-001234
  national_id VARCHAR(50), -- SSN, NIN, Aadhar, etc.
  passport_number VARCHAR(50),

  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(255) GENERATED ALWAYS AS (
    CONCAT_WS(' ', first_name, middle_name, last_name)
  ) STORED,

  date_of_birth DATE,
  gender VARCHAR(20), -- Male, Female, Other, Prefer not to say
  marital_status VARCHAR(50), -- Single, Married, Divorced, Widowed
  nationality VARCHAR(100),

  -- Contact Information
  email VARCHAR(255) NOT NULL UNIQUE,
  personal_email VARCHAR(255),
  phone_number VARCHAR(50),
  mobile_number VARCHAR(50),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),

  -- Employment Details
  department_id BIGINT REFERENCES core.departments(id) ON DELETE SET NULL,
  job_title_id BIGINT REFERENCES core.job_titles(id) ON DELETE SET NULL,
  employment_type VARCHAR(50) NOT NULL, -- Full-Time, Part-Time, Contract, Intern, Temporary
  employment_status VARCHAR(50) DEFAULT 'Active', -- Active, Probation, Notice Period, Terminated, Resigned, Retired

  joining_date DATE NOT NULL,
  probation_end_date DATE,
  confirmation_date DATE,
  termination_date DATE,
  resignation_date DATE,
  last_working_date DATE,

  -- Work Details
  work_location VARCHAR(255), -- Office, Remote, Hybrid
  work_location_address VARCHAR(500),
  office_number VARCHAR(50),
  floor_number VARCHAR(10),

  -- Reporting Structure
  manager_id BIGINT REFERENCES core.employees(id) ON DELETE SET NULL,

  -- Compensation (Basic - detailed in payroll schema)
  basic_salary DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  salary_frequency VARCHAR(20), -- Monthly, Bi-Weekly, Weekly, Hourly

  -- Bank Details
  bank_name VARCHAR(255),
  bank_account_number VARCHAR(100),
  bank_routing_number VARCHAR(50),
  bank_branch VARCHAR(255),

  -- Emergency Contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_relationship VARCHAR(100),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_email VARCHAR(255),

  -- Profile & Media
  profile_photo_url TEXT,
  bio TEXT,
  linkedin_url VARCHAR(500),
  twitter_url VARCHAR(500),

  -- System Access
  user_id BIGINT, -- FK to admin.users
  last_login_at TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  updated_by BIGINT,
  deleted_at TIMESTAMP,

  CONSTRAINT chk_employee_manager CHECK (id != manager_id),
  CONSTRAINT chk_employment_dates CHECK (joining_date <= COALESCE(termination_date, CURRENT_DATE))
);

-- Indexes for performance
CREATE INDEX idx_employees_organization ON core.employees(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_employee_id ON core.employees(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_email ON core.employees(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_department ON core.employees(department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_manager ON core.employees(manager_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_status ON core.employees(employment_status, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_joining_date ON core.employees(joining_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_full_name ON core.employees USING gin(to_tsvector('english', full_name)); -- Full-text search
```

---

### 1.5 `core.employee_documents`

Store employee document metadata (actual files in S3/storage).

```sql
CREATE TABLE core.employee_documents (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Document Info
  document_type VARCHAR(100) NOT NULL, -- Resume, ID Proof, Address Proof, Education Certificate, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT, -- in bytes
  mime_type VARCHAR(100),

  -- Metadata
  issue_date DATE,
  expiry_date DATE,
  document_number VARCHAR(100),

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_by BIGINT REFERENCES core.employees(id),
  verified_at TIMESTAMP,

  -- Audit
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by BIGINT NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_employee_documents_employee ON core.employee_documents(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employee_documents_type ON core.employee_documents(document_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_employee_documents_expiry ON core.employee_documents(expiry_date) WHERE deleted_at IS NULL AND expiry_date IS NOT NULL;
```

---

### 1.6 `core.bank_holidays`

Public/bank holidays for leave calculations.

```sql
CREATE TABLE core.bank_holidays (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Holiday Info
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(50), -- National, Regional, Optional
  description TEXT,

  -- Applicability
  country VARCHAR(100),
  state_province VARCHAR(100),
  is_optional BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_holiday_org_date UNIQUE(organization_id, date, deleted_at)
);

CREATE INDEX idx_bank_holidays_organization ON core.bank_holidays(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bank_holidays_date ON core.bank_holidays(date) WHERE deleted_at IS NULL;
```

---

## 2. TIME & ATTENDANCE SCHEMA (`time_tracking`)

**Purpose:** Attendance, timesheets, time entries, punch clock, shifts.

---

### 2.1 `time_tracking.attendance`

Daily attendance records.

```sql
CREATE TABLE time_tracking.attendance (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Attendance Details
  attendance_date DATE NOT NULL,
  day_of_week SMALLINT, -- 0=Sunday, 1=Monday, ... 6=Saturday

  -- Time Tracking
  clock_in_time TIMESTAMP,
  clock_out_time TIMESTAMP,
  total_working_hours DECIMAL(5, 2), -- Calculated
  break_hours DECIMAL(5, 2) DEFAULT 0,
  overtime_hours DECIMAL(5, 2) DEFAULT 0,

  -- Status
  status VARCHAR(50) NOT NULL, -- Present, Absent, Late, Half-Day, Leave, Holiday, Weekend
  is_late BOOLEAN DEFAULT false,
  late_by_minutes INT,

  -- Location Tracking
  clock_in_location VARCHAR(500),
  clock_out_location VARCHAR(500),
  clock_in_ip VARCHAR(50),
  clock_out_ip VARCHAR(50),
  clock_in_device VARCHAR(255),
  clock_out_device VARCHAR(255),

  -- Notes
  notes TEXT,

  -- Shift
  shift_id BIGINT, -- FK to time_tracking.shifts

  -- Approval
  is_approved BOOLEAN DEFAULT false,
  approved_by BIGINT REFERENCES core.employees(id),
  approved_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_attendance_employee_date UNIQUE(employee_id, attendance_date, deleted_at)
);

-- Partition by month for performance (example for PostgreSQL 11+)
-- CREATE TABLE time_tracking.attendance_2025_01 PARTITION OF time_tracking.attendance
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE INDEX idx_attendance_employee ON time_tracking.attendance(employee_id, attendance_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_date ON time_tracking.attendance(attendance_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_status ON time_tracking.attendance(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_attendance_organization ON time_tracking.attendance(organization_id, attendance_date) WHERE deleted_at IS NULL;
```

---

### 2.2 `time_tracking.punch_clock`

Real-time clock in/out events.

```sql
CREATE TABLE time_tracking.punch_clock (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Punch Details
  punch_type VARCHAR(20) NOT NULL, -- CLOCK_IN, CLOCK_OUT, BREAK_START, BREAK_END
  punch_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Location & Device
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name VARCHAR(255),
  ip_address VARCHAR(50),
  device_info VARCHAR(500),
  user_agent TEXT,

  -- Status
  is_manual BOOLEAN DEFAULT false, -- Manual entry vs automated punch
  is_verified BOOLEAN DEFAULT true,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_punch_clock_employee ON time_tracking.punch_clock(employee_id, punch_timestamp DESC);
CREATE INDEX idx_punch_clock_date ON time_tracking.punch_clock(DATE(punch_timestamp), employee_id);
CREATE INDEX idx_punch_clock_type ON time_tracking.punch_clock(punch_type);
```

---

### 2.3 `time_tracking.shifts`

Shift definitions (Morning, Evening, Night, etc.).

```sql
CREATE TABLE time_tracking.shifts (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Shift Info
  name VARCHAR(100) NOT NULL, -- Morning Shift, Evening Shift, Night Shift
  code VARCHAR(50),
  description TEXT,

  -- Timing
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(5, 2), -- Calculated
  break_duration_minutes INT DEFAULT 0,

  -- Grace Period
  late_grace_minutes INT DEFAULT 0, -- Allow 15 min late without marking as late

  -- Visual
  color_code VARCHAR(7), -- Hex color for calendar display

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_shifts_organization ON time_tracking.shifts(organization_id) WHERE deleted_at IS NULL;
```

---

### 2.4 `time_tracking.shift_assignments`

Assign shifts to employees for specific dates.

```sql
CREATE TABLE time_tracking.shift_assignments (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
  shift_id BIGINT NOT NULL REFERENCES time_tracking.shifts(id) ON DELETE CASCADE,

  -- Assignment Details
  assignment_date DATE NOT NULL,
  week_start_date DATE, -- For weekly view

  -- Status
  status VARCHAR(50) DEFAULT 'Scheduled', -- Scheduled, Completed, Swapped, Cancelled

  -- Shift Swap
  swapped_with_employee_id BIGINT REFERENCES core.employees(id),
  swap_reason TEXT,
  swap_approved_by BIGINT REFERENCES core.employees(id),
  swap_approved_at TIMESTAMP,

  -- Location
  location VARCHAR(255),

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by BIGINT NOT NULL,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_shift_assignment UNIQUE(employee_id, assignment_date, deleted_at)
);

CREATE INDEX idx_shift_assignments_employee ON time_tracking.shift_assignments(employee_id, assignment_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_shift_assignments_shift ON time_tracking.shift_assignments(shift_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shift_assignments_date ON time_tracking.shift_assignments(assignment_date) WHERE deleted_at IS NULL;
```

---

### 2.5 `time_tracking.projects`

Projects for time tracking (billable/non-billable).

```sql
CREATE TABLE time_tracking.projects (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Project Info
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,

  -- Client
  client_name VARCHAR(255),
  client_contact VARCHAR(255),

  -- Timeline
  start_date DATE,
  end_date DATE,

  -- Budget
  budget_hours DECIMAL(10, 2),
  budget_amount DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Billing
  is_billable BOOLEAN DEFAULT false,
  hourly_rate DECIMAL(10, 2),

  -- Status
  status VARCHAR(50) DEFAULT 'Active', -- Active, On Hold, Completed, Cancelled
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT NOT NULL,
  updated_by BIGINT,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_projects_organization ON time_tracking.projects(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON time_tracking.projects(status) WHERE deleted_at IS NULL;
```

---

### 2.6 `time_tracking.timesheets`

Weekly timesheet submissions.

```sql
CREATE TABLE time_tracking.timesheets (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Timesheet Period
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,

  -- Summary Hours
  total_regular_hours DECIMAL(10, 2) DEFAULT 0,
  total_overtime_hours DECIMAL(10, 2) DEFAULT 0,
  total_break_hours DECIMAL(10, 2) DEFAULT 0,
  total_pto_hours DECIMAL(10, 2) DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Submitted, Approved, Rejected

  -- Submission
  submitted_at TIMESTAMP,

  -- Approval
  approved_by BIGINT REFERENCES core.employees(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_timesheet_employee_week UNIQUE(employee_id, week_start_date, deleted_at)
);

CREATE INDEX idx_timesheets_employee ON time_tracking.timesheets(employee_id, week_start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_timesheets_status ON time_tracking.timesheets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_timesheets_week ON time_tracking.timesheets(week_start_date) WHERE deleted_at IS NULL;
```

---

### 2.7 `time_tracking.time_entries`

Individual time entries within timesheets.

```sql
CREATE TABLE time_tracking.time_entries (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  timesheet_id BIGINT NOT NULL REFERENCES time_tracking.timesheets(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Entry Details
  entry_date DATE NOT NULL,
  day_of_week SMALLINT,

  -- Project & Task
  project_id BIGINT REFERENCES time_tracking.projects(id) ON DELETE SET NULL,
  task_description TEXT,

  -- Time Tracking
  clock_in_time TIMESTAMP,
  clock_out_time TIMESTAMP,
  break_duration_minutes INT DEFAULT 0,
  total_hours DECIMAL(5, 2) NOT NULL,

  -- Entry Type
  entry_type VARCHAR(50) DEFAULT 'Regular', -- Regular, Overtime, PTO, Holiday

  -- Billability
  is_billable BOOLEAN DEFAULT false,
  billable_hours DECIMAL(5, 2),

  -- Status
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_time_entries_timesheet ON time_tracking.time_entries(timesheet_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_employee ON time_tracking.time_entries(employee_id, entry_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_project ON time_tracking.time_entries(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_date ON time_tracking.time_entries(entry_date) WHERE deleted_at IS NULL;
```

---

## 3. LEAVE MANAGEMENT SCHEMA (`core`)

**Purpose:** Leave requests, balances, and policies.

---

### 3.1 `core.leave_types`

Leave type definitions (Annual, Sick, etc.).

```sql
CREATE TABLE core.leave_types (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Leave Type Info
  name VARCHAR(100) NOT NULL, -- Annual Leave, Sick Leave, Maternity, etc.
  code VARCHAR(50),
  description TEXT,

  -- Allocation
  annual_allocation DECIMAL(5, 2), -- Days per year
  accrual_frequency VARCHAR(50), -- Yearly, Monthly, Per Pay Period
  accrual_rate DECIMAL(5, 2), -- Days accrued per period

  -- Rules
  max_consecutive_days INT,
  min_days_notice INT, -- Minimum notice required for request
  max_carry_forward DECIMAL(5, 2), -- Max days that can carry to next year
  carry_forward_expiry_months INT, -- Expiry for carried forward leaves

  -- Approval
  requires_approval BOOLEAN DEFAULT true,
  requires_document BOOLEAN DEFAULT false, -- Medical certificate, etc.

  -- Financial
  is_paid BOOLEAN DEFAULT true,

  -- Color for Calendar
  color_code VARCHAR(7), -- Hex color

  -- Eligibility
  probation_eligible BOOLEAN DEFAULT false,
  gender_specific VARCHAR(20), -- NULL, Male, Female

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_leave_types_organization ON core.leave_types(organization_id) WHERE deleted_at IS NULL;
```

---

### 3.2 `core.leave_balances`

Employee leave balances by type and year.

```sql
CREATE TABLE core.leave_balances (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
  leave_type_id BIGINT NOT NULL REFERENCES core.leave_types(id) ON DELETE CASCADE,

  -- Balance Details
  calendar_year INT NOT NULL,

  -- Allocation
  total_allocated DECIMAL(5, 2) NOT NULL,
  carried_forward DECIMAL(5, 2) DEFAULT 0,
  accrued DECIMAL(5, 2) DEFAULT 0,

  -- Usage
  used DECIMAL(5, 2) DEFAULT 0,
  pending DECIMAL(5, 2) DEFAULT 0, -- Pending approval requests

  -- Calculated Balance
  available DECIMAL(5, 2) GENERATED ALWAYS AS (
    total_allocated + carried_forward + accrued - used - pending
  ) STORED,

  -- Expiry
  carry_forward_expiry_date DATE,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_leave_balance UNIQUE(employee_id, leave_type_id, calendar_year, deleted_at)
);

CREATE INDEX idx_leave_balances_employee ON core.leave_balances(employee_id, calendar_year) WHERE deleted_at IS NULL;
CREATE INDEX idx_leave_balances_type ON core.leave_balances(leave_type_id) WHERE deleted_at IS NULL;
```

---

### 3.3 `core.leave_requests`

Leave application requests.

```sql
CREATE TABLE core.leave_requests (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
  leave_type_id BIGINT NOT NULL REFERENCES core.leave_types(id) ON DELETE CASCADE,

  -- Request Details
  request_number VARCHAR(50) UNIQUE, -- e.g., LR-2025-00123

  -- Leave Period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(5, 2) NOT NULL, -- Including half-days

  -- Details
  reason TEXT,
  contact_during_leave VARCHAR(255),

  -- Attachments
  attachment_urls TEXT[], -- Array of document URLs (medical certificates, etc.)

  -- Status
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected, Cancelled

  -- Approval Workflow
  approver_id BIGINT REFERENCES core.employees(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,

  -- Cancellation
  cancelled_by BIGINT REFERENCES core.employees(id),
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,

  -- Notifications
  employee_notified BOOLEAN DEFAULT false,
  approver_notified BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT chk_leave_dates CHECK (start_date <= end_date),
  CONSTRAINT chk_leave_days CHECK (total_days > 0)
);

CREATE INDEX idx_leave_requests_employee ON core.leave_requests(employee_id, start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_leave_requests_status ON core.leave_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leave_requests_dates ON core.leave_requests(start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_leave_requests_approver ON core.leave_requests(approver_id, status) WHERE deleted_at IS NULL;
```

---

## 4. PAYROLL SCHEMA (`payroll`)

**Purpose:** Payroll processing, salary structures, components, payslips.

---

### 4.1 `payroll.pay_grades`

Salary bands/grades.

```sql
CREATE TABLE payroll.pay_grades (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Grade Info
  grade_level SMALLINT NOT NULL, -- 1, 2, 3, etc.
  grade_name VARCHAR(100) NOT NULL, -- Entry Level, Junior, Senior, etc.
  description TEXT,

  -- Salary Range
  min_salary DECIMAL(15, 2) NOT NULL,
  max_salary DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT chk_salary_range CHECK (min_salary <= max_salary),
  CONSTRAINT uq_pay_grade_level UNIQUE(organization_id, grade_level, deleted_at)
);

CREATE INDEX idx_pay_grades_organization ON payroll.pay_grades(organization_id) WHERE deleted_at IS NULL;
```

---

### 4.2 `payroll.salary_components`

Salary components (earnings and deductions).

```sql
CREATE TABLE payroll.salary_components (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Component Info
  component_name VARCHAR(255) NOT NULL,
  component_code VARCHAR(50) UNIQUE,
  component_type VARCHAR(50) NOT NULL, -- EARNING, DEDUCTION

  -- Calculation
  calculation_type VARCHAR(50) NOT NULL, -- FIXED, PERCENTAGE_OF_BASIC, PERCENTAGE_OF_GROSS
  default_value DECIMAL(15, 2),

  -- Tax Treatment
  is_taxable BOOLEAN DEFAULT true,
  tax_treatment VARCHAR(50), -- Fully Taxable, Non-Taxable, Partially Taxable

  -- Rules
  is_mandatory BOOLEAN DEFAULT false, -- Must be included in payroll
  is_statutory BOOLEAN DEFAULT false, -- Government mandated (SSN, Income Tax)
  display_order INT DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_salary_components_organization ON payroll.salary_components(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_salary_components_type ON payroll.salary_components(component_type) WHERE deleted_at IS NULL;
```

---

### 4.3 `payroll.salary_structures`

Employee-specific salary breakdown.

```sql
CREATE TABLE payroll.salary_structures (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Effective Period
  effective_from DATE NOT NULL,
  effective_to DATE,

  -- Base Salary
  basic_salary DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_frequency VARCHAR(50), -- Monthly, Bi-Weekly, Weekly

  -- CTC (Cost to Company)
  gross_salary DECIMAL(15, 2),
  total_deductions DECIMAL(15, 2),
  net_salary DECIMAL(15, 2),
  ctc DECIMAL(15, 2), -- Annual CTC

  -- Pay Grade
  pay_grade_id BIGINT REFERENCES payroll.pay_grades(id),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Approval
  approved_by BIGINT REFERENCES core.employees(id),
  approved_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_salary_structures_employee ON payroll.salary_structures(employee_id, effective_from) WHERE deleted_at IS NULL;
CREATE INDEX idx_salary_structures_active ON payroll.salary_structures(employee_id, is_active) WHERE deleted_at IS NULL;
```

---

### 4.4 `payroll.salary_structure_components`

Components within a salary structure.

```sql
CREATE TABLE payroll.salary_structure_components (
  id BIGSERIAL PRIMARY KEY,
  salary_structure_id BIGINT NOT NULL REFERENCES payroll.salary_structures(id) ON DELETE CASCADE,
  component_id BIGINT NOT NULL REFERENCES payroll.salary_components(id) ON DELETE CASCADE,

  -- Component Value
  calculation_type VARCHAR(50), -- FIXED, PERCENTAGE_OF_BASIC, PERCENTAGE_OF_GROSS
  amount DECIMAL(15, 2),
  percentage DECIMAL(5, 2),

  -- Calculated Value
  calculated_amount DECIMAL(15, 2),

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_salary_structure_components_structure ON payroll.salary_structure_components(salary_structure_id);
CREATE INDEX idx_salary_structure_components_component ON payroll.salary_structure_components(component_id);
```

---

### 4.5 `payroll.payroll_runs`

Payroll processing batches.

```sql
CREATE TABLE payroll.payroll_runs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Run Details
  run_number VARCHAR(50) UNIQUE, -- e.g., PR-2025-01
  payroll_month SMALLINT NOT NULL, -- 1-12
  payroll_year INT NOT NULL,

  -- Pay Period
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  payment_date DATE NOT NULL,

  -- Filters
  department_ids BIGINT[], -- NULL means all departments
  employee_ids BIGINT[], -- NULL means all employees

  -- Summary
  total_employees INT DEFAULT 0,
  total_gross_salary DECIMAL(15, 2) DEFAULT 0,
  total_deductions DECIMAL(15, 2) DEFAULT 0,
  total_net_salary DECIMAL(15, 2) DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Processing, Completed, Failed

  -- Payment
  payment_method VARCHAR(50), -- Bank Transfer, Check, Cash
  bank_file_generated BOOLEAN DEFAULT false,
  bank_file_url TEXT,

  -- Processing
  processed_by BIGINT REFERENCES core.employees(id),
  processed_at TIMESTAMP,

  -- Approval
  approved_by BIGINT REFERENCES core.employees(id),
  approved_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT chk_payroll_period CHECK (period_start_date <= period_end_date),
  CONSTRAINT uq_payroll_run UNIQUE(organization_id, payroll_month, payroll_year, deleted_at)
);

CREATE INDEX idx_payroll_runs_organization ON payroll.payroll_runs(organization_id, payroll_year, payroll_month) WHERE deleted_at IS NULL;
CREATE INDEX idx_payroll_runs_status ON payroll.payroll_runs(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payroll_runs_payment_date ON payroll.payroll_runs(payment_date) WHERE deleted_at IS NULL;
```

---

### 4.6 `payroll.payslips`

Individual employee payslips.

```sql
CREATE TABLE payroll.payslips (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  payroll_run_id BIGINT NOT NULL REFERENCES payroll.payroll_runs(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Payslip Details
  payslip_number VARCHAR(50) UNIQUE, -- e.g., PS-2025-01-00123

  -- Pay Period
  pay_month SMALLINT NOT NULL,
  pay_year INT NOT NULL,
  payment_date DATE NOT NULL,

  -- Attendance Summary
  total_working_days INT,
  days_present DECIMAL(5, 2),
  days_absent DECIMAL(5, 2),
  days_on_leave DECIMAL(5, 2),

  -- Salary Breakdown
  basic_salary DECIMAL(15, 2) NOT NULL,
  gross_salary DECIMAL(15, 2) NOT NULL,
  total_earnings DECIMAL(15, 2) DEFAULT 0,
  total_deductions DECIMAL(15, 2) DEFAULT 0,
  net_salary DECIMAL(15, 2) NOT NULL,

  -- Overtime & Bonuses
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  overtime_amount DECIMAL(15, 2) DEFAULT 0,
  bonus_amount DECIMAL(15, 2) DEFAULT 0,

  -- Tax
  tax_amount DECIMAL(15, 2) DEFAULT 0,

  -- Payment
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Paid, Failed
  paid_at TIMESTAMP,
  transaction_reference VARCHAR(255),

  -- PDF
  payslip_pdf_url TEXT,

  -- Status
  is_locked BOOLEAN DEFAULT false,

  -- Employee Acknowledgment
  viewed_by_employee BOOLEAN DEFAULT false,
  viewed_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_payslip_employee_month UNIQUE(employee_id, pay_month, pay_year, deleted_at)
);

CREATE INDEX idx_payslips_payroll_run ON payroll.payslips(payroll_run_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payslips_employee ON payroll.payslips(employee_id, pay_year, pay_month) WHERE deleted_at IS NULL;
CREATE INDEX idx_payslips_payment_status ON payroll.payslips(payment_status) WHERE deleted_at IS NULL;
```

---

### 4.7 `payroll.payslip_components`

Line items in payslip (earnings/deductions).

```sql
CREATE TABLE payroll.payslip_components (
  id BIGSERIAL PRIMARY KEY,
  payslip_id BIGINT NOT NULL REFERENCES payroll.payslips(id) ON DELETE CASCADE,
  component_id BIGINT NOT NULL REFERENCES payroll.salary_components(id) ON DELETE CASCADE,

  -- Component Details
  component_type VARCHAR(50) NOT NULL, -- EARNING, DEDUCTION
  component_name VARCHAR(255) NOT NULL,

  -- Amount
  amount DECIMAL(15, 2) NOT NULL,

  -- Tax
  is_taxable BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payslip_components_payslip ON payroll.payslip_components(payslip_id);
CREATE INDEX idx_payslip_components_component ON payroll.payslip_components(component_id);
```

---

## 5. EXPENSE MANAGEMENT SCHEMA (`core`)

**Purpose:** Employee expense claims, reimbursements, budgets.

---

### 5.1 `core.expense_categories`

Expense category definitions.

```sql
CREATE TABLE core.expense_categories (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Category Info
  name VARCHAR(255) NOT NULL, -- Travel, Meals, Office Supplies, etc.
  code VARCHAR(50),
  description TEXT,

  -- Rules
  requires_receipt BOOLEAN DEFAULT true,
  requires_manager_approval BOOLEAN DEFAULT true,
  max_claim_amount DECIMAL(15, 2), -- Per claim limit

  -- Tax
  is_tax_deductible BOOLEAN DEFAULT false,

  -- Budget
  has_budget BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_expense_categories_organization ON core.expense_categories(organization_id) WHERE deleted_at IS NULL;
```

---

### 5.2 `core.expense_budgets`

Monthly/yearly budgets by category and department.

```sql
CREATE TABLE core.expense_budgets (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES core.expense_categories(id) ON DELETE CASCADE,
  department_id BIGINT REFERENCES core.departments(id) ON DELETE CASCADE,

  -- Budget Period
  budget_year INT NOT NULL,
  budget_month SMALLINT, -- NULL for annual budget

  -- Budget Amount
  budget_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Usage
  spent_amount DECIMAL(15, 2) DEFAULT 0,
  pending_amount DECIMAL(15, 2) DEFAULT 0,
  remaining_amount DECIMAL(15, 2) GENERATED ALWAYS AS (
    budget_amount - spent_amount - pending_amount
  ) STORED,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_expense_budget UNIQUE(category_id, department_id, budget_year, budget_month, deleted_at)
);

CREATE INDEX idx_expense_budgets_category ON core.expense_budgets(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expense_budgets_department ON core.expense_budgets(department_id) WHERE deleted_at IS NULL;
```

---

### 5.3 `core.expense_claims`

Employee expense claims.

```sql
CREATE TABLE core.expense_claims (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES core.expense_categories(id) ON DELETE SET NULL,

  -- Claim Details
  claim_number VARCHAR(50) UNIQUE, -- e.g., EXP-2025-00123
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Amount
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Claim Date
  expense_date DATE NOT NULL,
  claim_date DATE DEFAULT CURRENT_DATE,

  -- Merchant
  merchant_name VARCHAR(255),
  merchant_location VARCHAR(255),

  -- Receipts
  receipt_urls TEXT[], -- Array of receipt image URLs
  has_receipt BOOLEAN DEFAULT false,

  -- Status
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected, Paid

  -- Approval Workflow
  approver_id BIGINT REFERENCES core.employees(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,

  -- Reimbursement
  reimbursed_by BIGINT REFERENCES core.employees(id),
  reimbursed_at TIMESTAMP,
  payment_method VARCHAR(50), -- Bank Transfer, Cash, Check
  transaction_reference VARCHAR(255),

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT chk_expense_amount CHECK (amount > 0)
);

CREATE INDEX idx_expense_claims_employee ON core.expense_claims(employee_id, expense_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_expense_claims_category ON core.expense_claims(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expense_claims_status ON core.expense_claims(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_expense_claims_approver ON core.expense_claims(approver_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_expense_claims_date ON core.expense_claims(expense_date) WHERE deleted_at IS NULL;
```

---

## 6. ASSET MANAGEMENT SCHEMA (`assets`)

**Purpose:** Company assets, assignments, maintenance.

---

### 6.1 `assets.asset_categories`

Asset category definitions.

```sql
CREATE TABLE assets.asset_categories (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Category Info
  name VARCHAR(255) NOT NULL, -- Computers, Mobile Devices, Furniture, etc.
  code VARCHAR(50),
  description TEXT,

  -- Depreciation
  depreciation_rate DECIMAL(5, 2), -- Annual depreciation %
  useful_life_years INT, -- Expected useful life

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_asset_categories_organization ON assets.asset_categories(organization_id) WHERE deleted_at IS NULL;
```

---

### 6.2 `assets.assets`

Asset inventory.

```sql
CREATE TABLE assets.assets (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES assets.asset_categories(id) ON DELETE SET NULL,

  -- Asset Identification
  asset_id VARCHAR(50) NOT NULL UNIQUE, -- e.g., AST-001
  asset_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Serial Numbers
  serial_number VARCHAR(255),
  barcode VARCHAR(255),
  qr_code VARCHAR(255),

  -- Purchase Details
  purchase_date DATE,
  purchase_cost DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  vendor_name VARCHAR(255),
  invoice_number VARCHAR(100),

  -- Depreciation
  current_value DECIMAL(15, 2),
  salvage_value DECIMAL(15, 2),
  depreciation_rate DECIMAL(5, 2),

  -- Warranty
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_provider VARCHAR(255),

  -- Physical Details
  brand VARCHAR(100),
  model VARCHAR(100),
  specifications JSONB, -- Flexible JSON for specs
  condition VARCHAR(50), -- Excellent, Good, Fair, Poor

  -- Location
  location VARCHAR(255),
  building VARCHAR(100),
  floor VARCHAR(50),
  room_number VARCHAR(50),

  -- Assignment
  status VARCHAR(50) DEFAULT 'Available', -- Available, Assigned, In Maintenance, Retired, Lost, Stolen
  assigned_to_employee_id BIGINT REFERENCES core.employees(id) ON DELETE SET NULL,
  assigned_date DATE,

  -- Photos
  image_urls TEXT[],

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT NOT NULL,
  updated_by BIGINT,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_assets_organization ON assets.assets(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_asset_id ON assets.assets(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_category ON assets.assets(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_status ON assets.assets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_assigned_to ON assets.assets(assigned_to_employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_warranty_expiry ON assets.assets(warranty_end_date) WHERE deleted_at IS NULL;
```

---

### 6.3 `assets.asset_assignments`

Asset assignment history.

```sql
CREATE TABLE assets.asset_assignments (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  asset_id BIGINT NOT NULL REFERENCES assets.assets(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Assignment Details
  assigned_date DATE NOT NULL,
  return_date DATE,
  expected_return_date DATE,

  -- Condition
  condition_on_assignment VARCHAR(50),
  condition_on_return VARCHAR(50),

  -- Status
  status VARCHAR(50) DEFAULT 'Active', -- Active, Returned, Lost, Damaged

  -- Notes
  assignment_notes TEXT,
  return_notes TEXT,

  -- Approval
  assigned_by BIGINT REFERENCES core.employees(id),
  approved_by BIGINT REFERENCES core.employees(id),

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT chk_asset_assignment_dates CHECK (
    return_date IS NULL OR assigned_date <= return_date
  )
);

CREATE INDEX idx_asset_assignments_asset ON assets.asset_assignments(asset_id, assigned_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_assignments_employee ON assets.asset_assignments(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_assignments_status ON assets.asset_assignments(status) WHERE deleted_at IS NULL;
```

---

### 6.4 `assets.asset_maintenance`

Asset maintenance records.

```sql
CREATE TABLE assets.asset_maintenance (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  asset_id BIGINT NOT NULL REFERENCES assets.assets(id) ON DELETE CASCADE,

  -- Maintenance Details
  maintenance_number VARCHAR(50) UNIQUE, -- e.g., MT-001
  maintenance_type VARCHAR(50) NOT NULL, -- Routine, Repair, Upgrade, Inspection
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  completed_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'Scheduled', -- Scheduled, In Progress, Completed, Cancelled
  priority VARCHAR(50) DEFAULT 'Medium', -- Low, Medium, High, Critical

  -- Cost
  estimated_cost DECIMAL(15, 2),
  actual_cost DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Vendor/Service Provider
  vendor_name VARCHAR(255),
  vendor_contact VARCHAR(255),

  -- Assignment
  assigned_to VARCHAR(255), -- IT Support Team, Facilities, External Vendor
  performed_by VARCHAR(255),

  -- Notes
  notes TEXT,
  resolution_notes TEXT,

  -- Attachments
  attachment_urls TEXT[],

  -- Downtime
  downtime_hours DECIMAL(5, 2),

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT NOT NULL,
  updated_by BIGINT,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_asset_maintenance_asset ON assets.asset_maintenance(asset_id, scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_maintenance_status ON assets.asset_maintenance(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_maintenance_scheduled_date ON assets.asset_maintenance(scheduled_date) WHERE deleted_at IS NULL;
```

---

## 7. RECRUITMENT SCHEMA (`recruitment`)

**Purpose:** Job postings, applicants, interviews, hiring.

---

### 7.1 `recruitment.job_postings`

Job openings/requisitions.

```sql
CREATE TABLE recruitment.job_postings (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Job Details
  job_number VARCHAR(50) UNIQUE, -- e.g., JOB-2025-001
  job_title VARCHAR(255) NOT NULL,
  department_id BIGINT REFERENCES core.departments(id) ON DELETE SET NULL,
  job_title_id BIGINT REFERENCES core.job_titles(id) ON DELETE SET NULL,

  -- Job Description
  description TEXT,
  responsibilities TEXT,
  requirements TEXT,
  qualifications TEXT,

  -- Employment Details
  employment_type VARCHAR(50), -- Full-Time, Part-Time, Contract, Intern
  work_location_type VARCHAR(50), -- On-site, Remote, Hybrid
  work_location_city VARCHAR(100),

  -- Compensation
  min_salary DECIMAL(15, 2),
  max_salary DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  salary_display VARCHAR(50), -- Show, Hide, Show Range

  -- Openings
  number_of_openings INT DEFAULT 1,

  -- Timeline
  posted_date DATE,
  application_deadline DATE,
  target_hire_date DATE,

  -- Hiring Manager
  hiring_manager_id BIGINT REFERENCES core.employees(id),
  recruiter_id BIGINT REFERENCES core.employees(id),

  -- Status
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Active, On Hold, Closed, Cancelled

  -- Job Board Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,

  -- External URLs
  external_job_board_urls TEXT[],

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT NOT NULL,
  updated_by BIGINT,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_job_postings_organization ON recruitment.job_postings(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_postings_status ON recruitment.job_postings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_postings_department ON recruitment.job_postings(department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_postings_deadline ON recruitment.job_postings(application_deadline) WHERE deleted_at IS NULL;
```

---

### 7.2 `recruitment.applicants`

Job applicants/candidates.

```sql
CREATE TABLE recruitment.applicants (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  job_posting_id BIGINT NOT NULL REFERENCES recruitment.job_postings(id) ON DELETE CASCADE,

  -- Applicant Details
  applicant_number VARCHAR(50) UNIQUE, -- e.g., APP-2025-00123
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(255) GENERATED ALWAYS AS (
    CONCAT_WS(' ', first_name, last_name)
  ) STORED,

  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),

  -- Application
  application_date DATE DEFAULT CURRENT_DATE,
  source VARCHAR(100), -- Company Website, LinkedIn, Referral, Job Board
  referrer_employee_id BIGINT REFERENCES core.employees(id),

  -- Documents
  resume_url TEXT,
  cover_letter TEXT,
  portfolio_url TEXT,
  other_documents TEXT[],

  -- Current Status
  status VARCHAR(50) DEFAULT 'Applied', -- Applied, Screening, Interview, Offer, Hired, Rejected, Withdrawn
  stage VARCHAR(100), -- Screening, Technical Round, HR Round, Final Round

  -- Rating
  overall_rating DECIMAL(3, 2), -- Out of 5

  -- Rejection
  rejection_reason TEXT,
  rejected_by BIGINT REFERENCES core.employees(id),
  rejected_at TIMESTAMP,

  -- Hiring
  hired_as_employee_id BIGINT REFERENCES core.employees(id),
  hired_at TIMESTAMP,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_applicants_job_posting ON recruitment.applicants(job_posting_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_applicants_email ON recruitment.applicants(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_applicants_status ON recruitment.applicants(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_applicants_source ON recruitment.applicants(source) WHERE deleted_at IS NULL;
```

---

### 7.3 `recruitment.interviews`

Interview schedule and feedback.

```sql
CREATE TABLE recruitment.interviews (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  applicant_id BIGINT NOT NULL REFERENCES recruitment.applicants(id) ON DELETE CASCADE,
  job_posting_id BIGINT NOT NULL REFERENCES recruitment.job_postings(id) ON DELETE CASCADE,

  -- Interview Details
  interview_number VARCHAR(50) UNIQUE, -- e.g., INT-2025-00123
  interview_type VARCHAR(50), -- Phone Screening, Video, In-Person, Technical, HR, Panel
  interview_round SMALLINT, -- 1, 2, 3, etc.

  -- Scheduling
  interview_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone VARCHAR(50),

  -- Location/Meeting
  location VARCHAR(500), -- Office address or video call link
  meeting_url TEXT,
  meeting_id VARCHAR(255),

  -- Interviewers
  interviewer_ids BIGINT[], -- Array of employee IDs

  -- Status
  status VARCHAR(50) DEFAULT 'Scheduled', -- Scheduled, Completed, Cancelled, No Show

  -- Feedback
  feedback TEXT,
  rating DECIMAL(3, 2), -- Out of 5
  recommendation VARCHAR(50), -- Strong Hire, Hire, Maybe, No Hire, Strong No Hire

  -- Skills Assessment
  technical_score DECIMAL(3, 2),
  communication_score DECIMAL(3, 2),
  cultural_fit_score DECIMAL(3, 2),

  -- Cancellation
  cancelled_by BIGINT REFERENCES core.employees(id),
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scheduled_by BIGINT NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_interviews_applicant ON recruitment.interviews(applicant_id, interview_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_interviews_job_posting ON recruitment.interviews(job_posting_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_interviews_date ON recruitment.interviews(interview_date, status) WHERE deleted_at IS NULL;
```

---

### 7.4 `recruitment.job_offers`

Job offers extended to candidates.

```sql
CREATE TABLE recruitment.job_offers (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  applicant_id BIGINT NOT NULL REFERENCES recruitment.applicants(id) ON DELETE CASCADE,
  job_posting_id BIGINT NOT NULL REFERENCES recruitment.job_postings(id) ON DELETE CASCADE,

  -- Offer Details
  offer_number VARCHAR(50) UNIQUE, -- e.g., OFF-2025-00123
  offer_date DATE NOT NULL,
  expiry_date DATE,

  -- Position
  job_title VARCHAR(255) NOT NULL,
  department_id BIGINT REFERENCES core.departments(id),

  -- Compensation
  offered_salary DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  salary_frequency VARCHAR(50), -- Monthly, Annual

  -- Benefits
  benefits TEXT,
  signing_bonus DECIMAL(15, 2),
  relocation_allowance DECIMAL(15, 2),

  -- Start Date
  proposed_start_date DATE,
  actual_start_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Accepted, Rejected, Withdrawn

  -- Response
  candidate_response_date DATE,
  rejection_reason TEXT,

  -- Documents
  offer_letter_url TEXT,

  -- Approval
  approved_by BIGINT REFERENCES core.employees(id),
  approved_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT NOT NULL,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_job_offers_applicant ON recruitment.job_offers(applicant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_offers_job_posting ON recruitment.job_offers(job_posting_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_offers_status ON recruitment.job_offers(status) WHERE deleted_at IS NULL;
```

---

## 8. COMPLIANCE & TRAINING SCHEMA (`compliance`)

**Purpose:** Training courses, certifications, compliance tracking.

---

### 8.1 `compliance.training_courses`

Training course catalog.

```sql
CREATE TABLE compliance.training_courses (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Course Info
  course_code VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Course Details
  category VARCHAR(100), -- Safety, Compliance, Technical, Soft Skills
  duration_hours DECIMAL(5, 2),
  difficulty_level VARCHAR(50), -- Beginner, Intermediate, Advanced

  -- Type
  training_type VARCHAR(50), -- Mandatory, Optional
  delivery_method VARCHAR(50), -- Online, In-Person, Hybrid

  -- Content
  content_url TEXT, -- Link to LMS or video
  content_type VARCHAR(50), -- Video, PDF, SCORM, Interactive

  -- Completion
  passing_score DECIMAL(5, 2), -- Minimum score to pass
  has_quiz BOOLEAN DEFAULT false,
  has_certificate BOOLEAN DEFAULT true,
  certificate_template_url TEXT,

  -- Validity
  validity_period_months INT, -- Re-certification required after N months

  -- Instructor
  instructor_name VARCHAR(255),
  instructor_bio TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT NOT NULL,
  updated_by BIGINT,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_training_courses_organization ON compliance.training_courses(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_training_courses_category ON compliance.training_courses(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_training_courses_type ON compliance.training_courses(training_type) WHERE deleted_at IS NULL;
```

---

### 8.2 `compliance.training_enrollments`

Employee enrollments in courses.

```sql
CREATE TABLE compliance.training_enrollments (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES compliance.training_courses(id) ON DELETE CASCADE,

  -- Enrollment Details
  enrollment_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,

  -- Progress
  status VARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, Completed, Overdue
  progress_percentage DECIMAL(5, 2) DEFAULT 0,

  -- Completion
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Assessment
  quiz_attempts INT DEFAULT 0,
  quiz_score DECIMAL(5, 2),
  passed BOOLEAN DEFAULT false,

  -- Certificate
  certificate_issued BOOLEAN DEFAULT false,
  certificate_number VARCHAR(100),
  certificate_url TEXT,
  certificate_issued_at TIMESTAMP,

  -- Re-certification
  certificate_expiry_date DATE,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  enrolled_by BIGINT,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_enrollment UNIQUE(employee_id, course_id, enrollment_date, deleted_at)
);

CREATE INDEX idx_training_enrollments_employee ON compliance.training_enrollments(employee_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_training_enrollments_course ON compliance.training_enrollments(course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_training_enrollments_due_date ON compliance.training_enrollments(due_date) WHERE deleted_at IS NULL AND status != 'Completed';
CREATE INDEX idx_training_enrollments_expiry ON compliance.training_enrollments(certificate_expiry_date) WHERE deleted_at IS NULL;
```

---

### 8.3 `compliance.certifications`

Standalone certifications (external/professional).

```sql
CREATE TABLE compliance.certifications (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Certification Details
  certification_name VARCHAR(255) NOT NULL,
  issuing_authority VARCHAR(255), -- AWS, Microsoft, PMI, etc.
  certification_number VARCHAR(100),

  -- Dates
  issue_date DATE,
  expiry_date DATE,

  -- Document
  certificate_url TEXT,

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_by BIGINT REFERENCES core.employees(id),
  verified_at TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  added_by BIGINT,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_certifications_employee ON compliance.certifications(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_certifications_expiry ON compliance.certifications(expiry_date) WHERE deleted_at IS NULL;
```

---

## 9. TASKS & INCIDENTS SCHEMA (`core`)

**Purpose:** Task management, incident tracking, events.

---

### 9.1 `core.task_categories`

Task categories for organization.

```sql
CREATE TABLE core.task_categories (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,
  color_code VARCHAR(7),

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_task_categories_organization ON core.task_categories(organization_id) WHERE deleted_at IS NULL;
```

---

### 9.2 `core.tasks`

Task assignments and tracking.

```sql
CREATE TABLE core.tasks (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Task Details
  task_number VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id BIGINT REFERENCES core.task_categories(id) ON DELETE SET NULL,

  -- Assignment
  assigned_to_employee_id BIGINT REFERENCES core.employees(id) ON DELETE SET NULL,
  created_by_employee_id BIGINT REFERENCES core.employees(id),

  -- Priority & Status
  priority VARCHAR(50) DEFAULT 'Medium', -- Low, Medium, High, Urgent
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Completed, Overdue, Cancelled

  -- Dates
  due_date DATE,
  completed_at TIMESTAMP,

  -- Location
  location VARCHAR(255),

  -- Attachments
  image_urls TEXT[],
  attachment_urls TEXT[],

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_tasks_assigned_to ON core.tasks(assigned_to_employee_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_created_by ON core.tasks(created_by_employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due_date ON core.tasks(due_date, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON core.tasks(status) WHERE deleted_at IS NULL;
```

---

### 9.3 `core.incidents`

Incident/issue tracking.

```sql
CREATE TABLE core.incidents (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Incident Details
  incident_number VARCHAR(50) UNIQUE, -- e.g., #INC-127
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Category
  category VARCHAR(100), -- Safety, Equipment, Maintenance, Security

  -- Priority & Severity
  priority VARCHAR(50) DEFAULT 'Medium', -- Low, Medium, High, Critical
  severity VARCHAR(50), -- Minor, Moderate, Major, Critical

  -- Reporting
  reported_by_employee_id BIGINT REFERENCES core.employees(id),
  reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Assignment
  assigned_to_employee_id BIGINT REFERENCES core.employees(id),

  -- Status
  status VARCHAR(50) DEFAULT 'Open', -- Open, In Progress, Resolved, Closed, Cancelled

  -- Location
  location VARCHAR(255),

  -- Resolution
  resolution_date TIMESTAMP,
  resolution_notes TEXT,
  resolved_by_employee_id BIGINT REFERENCES core.employees(id),

  -- Attachments
  attachment_urls TEXT[],

  -- Follow-up
  requires_follow_up BOOLEAN DEFAULT false,
  follow_up_date DATE,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_incidents_reported_by ON core.incidents(reported_by_employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_incidents_assigned_to ON core.incidents(assigned_to_employee_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_incidents_status ON core.incidents(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_incidents_priority ON core.incidents(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_incidents_category ON core.incidents(category) WHERE deleted_at IS NULL;
```

---

### 9.4 `core.announcements`

Company-wide announcements.

```sql
CREATE TABLE core.announcements (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Announcement Details
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,

  -- Media
  image_url TEXT,

  -- Visibility
  is_pinned BOOLEAN DEFAULT false,
  visibility VARCHAR(50) DEFAULT 'All', -- All, Department, Role
  department_ids BIGINT[], -- NULL means all

  -- Publishing
  published_by_employee_id BIGINT REFERENCES core.employees(id),
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Expiry
  expires_at TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_announcements_organization ON core.announcements(organization_id, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_announcements_pinned ON core.announcements(is_pinned, published_at DESC) WHERE deleted_at IS NULL;
```

---

### 9.5 `core.events`

Company events (social, training, etc.).

```sql
CREATE TABLE core.events (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Event Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- Team Building, Training, Social, Meeting

  -- Date & Time
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,

  -- Location
  location VARCHAR(500),
  is_virtual BOOLEAN DEFAULT false,
  meeting_url TEXT,

  -- Organizer
  organizer_employee_id BIGINT REFERENCES core.employees(id),

  -- RSVP
  rsvp_required BOOLEAN DEFAULT false,
  max_attendees INT,

  -- Media
  image_url TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'Scheduled', -- Scheduled, Ongoing, Completed, Cancelled

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_events_organization ON core.events(organization_id, event_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_date ON core.events(event_date, status) WHERE deleted_at IS NULL;
```

---

### 9.6 `core.event_attendees`

Event RSVP and attendance.

```sql
CREATE TABLE core.event_attendees (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES core.events(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- RSVP
  rsvp_status VARCHAR(50), -- Attending, Not Attending, Maybe
  rsvp_date TIMESTAMP,

  -- Check-in
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_event_attendee UNIQUE(event_id, employee_id)
);

CREATE INDEX idx_event_attendees_event ON core.event_attendees(event_id, rsvp_status);
CREATE INDEX idx_event_attendees_employee ON core.event_attendees(employee_id);
```

---

## 10. ADMINISTRATION SCHEMA (`admin`)

**Purpose:** User accounts, roles, permissions, settings, audit logs.

---

### 10.1 `admin.users`

System user accounts (linked to employees).

```sql
CREATE TABLE admin.users (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT UNIQUE REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Credentials
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,

  -- Security
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,

  -- Password Management
  password_changed_at TIMESTAMP,
  password_expires_at TIMESTAMP,
  must_change_password BOOLEAN DEFAULT false,

  -- Session
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(50),
  last_activity_at TIMESTAMP,

  -- Tokens
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  email_verification_token VARCHAR(255),

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_username ON admin.users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON admin.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_employee ON admin.users(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_organization ON admin.users(organization_id) WHERE deleted_at IS NULL;
```

---

### 10.2 `admin.roles`

Role definitions (Admin, HR Manager, Employee, etc.).

```sql
CREATE TABLE admin.roles (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Role Info
  name VARCHAR(100) NOT NULL, -- Super Admin, HR Manager, Manager, Employee
  code VARCHAR(50) UNIQUE,
  description TEXT,

  -- Hierarchy
  level SMALLINT, -- Lower number = higher privilege

  -- Status
  is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_role_name UNIQUE(organization_id, name, deleted_at)
);

CREATE INDEX idx_roles_organization ON admin.roles(organization_id) WHERE deleted_at IS NULL;
```

---

### 10.3 `admin.permissions`

Granular permissions.

```sql
CREATE TABLE admin.permissions (
  id BIGSERIAL PRIMARY KEY,

  -- Permission Info
  name VARCHAR(100) UNIQUE NOT NULL, -- employees.view, employees.create, payroll.approve
  module VARCHAR(100) NOT NULL, -- employees, payroll, attendance, etc.
  action VARCHAR(50) NOT NULL, -- view, create, edit, delete, approve
  description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_module ON admin.permissions(module);
```

---

### 10.4 `admin.role_permissions`

Map permissions to roles.

```sql
CREATE TABLE admin.role_permissions (
  id BIGSERIAL PRIMARY KEY,
  role_id BIGINT NOT NULL REFERENCES admin.roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES admin.permissions(id) ON DELETE CASCADE,

  -- Scope
  scope VARCHAR(50) DEFAULT 'All', -- All, Department, Own

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_role_permission UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON admin.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON admin.role_permissions(permission_id);
```

---

### 10.5 `admin.user_roles`

Assign roles to users.

```sql
CREATE TABLE admin.user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES admin.users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES admin.roles(id) ON DELETE CASCADE,

  -- Effective Period
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  assigned_by BIGINT REFERENCES admin.users(id),

  CONSTRAINT uq_user_role UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON admin.user_roles(user_id, is_active);
CREATE INDEX idx_user_roles_role ON admin.user_roles(role_id);
```

---

## 11. AUDIT SCHEMA (`audit`)

**Purpose:** Comprehensive audit trail for compliance and security.

---

### 11.1 `audit.audit_logs`

System-wide audit trail.

```sql
CREATE TABLE audit.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT
  entity_type VARCHAR(100) NOT NULL, -- employee, leave_request, payroll_run, etc.
  entity_id BIGINT,

  -- User
  user_id BIGINT REFERENCES admin.users(id),
  employee_id BIGINT REFERENCES core.employees(id),
  username VARCHAR(100),

  -- Change Details
  old_values JSONB, -- Previous state
  new_values JSONB, -- New state
  changes_summary TEXT,

  -- Request Info
  ip_address VARCHAR(50),
  user_agent TEXT,
  request_method VARCHAR(10), -- GET, POST, PUT, DELETE
  request_url TEXT,

  -- Metadata
  module VARCHAR(100),
  action VARCHAR(100),

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexing
  created_date DATE GENERATED ALWAYS AS (DATE(created_at)) STORED
);

-- Partition by month for performance
-- CREATE TABLE audit.audit_logs_2025_01 PARTITION OF audit.audit_logs
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE INDEX idx_audit_logs_organization ON audit.audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit.audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_event_type ON audit.audit_logs(event_type, created_at DESC);
CREATE INDEX idx_audit_logs_date ON audit.audit_logs(created_date);
```

---

## 12. NOTIFICATIONS & MESSAGING

### 12.1 `admin.notifications`

In-app notifications.

```sql
CREATE TABLE admin.notifications (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Recipient
  user_id BIGINT NOT NULL REFERENCES admin.users(id) ON DELETE CASCADE,
  employee_id BIGINT REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Notification Details
  type VARCHAR(100) NOT NULL, -- leave_approved, payroll_processed, expense_rejected, etc.
  title VARCHAR(255) NOT NULL,
  message TEXT,

  -- Action
  action_url TEXT, -- Link to relevant page
  action_label VARCHAR(100),

  -- Related Entity
  entity_type VARCHAR(100),
  entity_id BIGINT,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  -- Priority
  priority VARCHAR(50) DEFAULT 'Normal', -- Low, Normal, High, Urgent

  -- Expiry
  expires_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON admin.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_employee ON admin.notifications(employee_id, created_at DESC);
CREATE INDEX idx_notifications_type ON admin.notifications(type);
```

---

## Relationships & Foreign Keys

### Key Relationships Summary

```
core.organizations (1) ─── (N) core.departments
core.organizations (1) ─── (N) core.employees
core.departments (1) ─── (N) core.employees
core.employees (1) ─── (N) core.employees (manager relationship)
core.employees (1) ─── (N) time_tracking.attendance
core.employees (1) ─── (N) core.leave_requests
core.employees (1) ─── (N) payroll.payslips
core.employees (1) ─── (N) core.expense_claims
core.employees (1) ─── (N) assets.asset_assignments
core.leave_types (1) ─── (N) core.leave_requests
core.leave_types (1) ─── (N) core.leave_balances
payroll.payroll_runs (1) ─── (N) payroll.payslips
payroll.salary_structures (1) ─── (N) payroll.salary_structure_components
assets.assets (1) ─── (N) assets.asset_assignments
assets.assets (1) ─── (N) assets.asset_maintenance
recruitment.job_postings (1) ─── (N) recruitment.applicants
recruitment.applicants (1) ─── (N) recruitment.interviews
recruitment.applicants (1) ─── (1) recruitment.job_offers
compliance.training_courses (1) ─── (N) compliance.training_enrollments
time_tracking.timesheets (1) ─── (N) time_tracking.time_entries
admin.users (1) ─── (1) core.employees
admin.roles (1) ─── (N) admin.user_roles
admin.users (1) ─── (N) admin.user_roles
```

---

## Indexes & Performance Optimization

### Indexing Strategy

1. **Primary Keys**: Automatically indexed (BIGSERIAL)
2. **Foreign Keys**: Index all FK columns for join performance
3. **Search Columns**: Index frequently searched columns (email, employee_id, name)
4. **Date Ranges**: Index date columns used in WHERE clauses (attendance_date, leave start/end)
5. **Status Columns**: Composite indexes with status for filtering
6. **Full-Text Search**: GIN indexes on text columns (employee names, descriptions)
7. **Partial Indexes**: Use WHERE clause to index only active records (`WHERE deleted_at IS NULL`)

### Partitioning Strategy

For high-volume tables, implement table partitioning:

- **attendance**: Partition by month (range partitioning on `attendance_date`)
- **audit_logs**: Partition by month
- **punch_clock**: Partition by month
- **payslips**: Partition by year

### Query Optimization Tips

1. Use `EXPLAIN ANALYZE` to identify slow queries
2. Implement materialized views for complex reports
3. Use connection pooling (PgBouncer)
4. Enable query caching in application layer (Redis)
5. Regular `VACUUM` and `ANALYZE` maintenance

---

## Backend API Requirements

### Technology Stack Recommendation

**Option 1: Node.js + TypeScript**
- Framework: NestJS (enterprise-grade, modular)
- ORM: Prisma (type-safe, migrations)
- Validation: class-validator
- Auth: Passport.js + JWT
- File Upload: Multer + AWS S3
- Jobs: Bull (Redis-based queue)
- API Docs: Swagger/OpenAPI

**Option 2: Python**
- Framework: FastAPI or Django REST Framework
- ORM: SQLAlchemy or Django ORM
- Validation: Pydantic (FastAPI) or DRF Serializers
- Auth: Django Auth or FastAPI Security
- File Upload: boto3 (AWS S3)
- Jobs: Celery (Redis/RabbitMQ)
- API Docs: Auto-generated (FastAPI) or drf-spectacular

---

### API Architecture

**RESTful API Design**

```
Base URL: https://api.complihr.com/v1

Authentication:
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh-token
POST   /auth/forgot-password
POST   /auth/reset-password

Employees:
GET    /employees
POST   /employees
GET    /employees/:id
PUT    /employees/:id
DELETE /employees/:id
GET    /employees/:id/attendance
GET    /employees/:id/leave-balance
GET    /employees/:id/payslips
POST   /employees/:id/documents

Attendance:
GET    /attendance
POST   /attendance/punch-in
POST   /attendance/punch-out
GET    /attendance/summary?month=1&year=2025

Leave:
GET    /leave/requests
POST   /leave/requests
GET    /leave/requests/:id
PUT    /leave/requests/:id/approve
PUT    /leave/requests/:id/reject
GET    /leave/balance

Payroll:
GET    /payroll/runs
POST   /payroll/runs
GET    /payroll/runs/:id
POST   /payroll/runs/:id/process
GET    /payroll/payslips
GET    /payroll/payslips/:id

Expenses:
GET    /expenses
POST   /expenses
GET    /expenses/:id
PUT    /expenses/:id/approve
PUT    /expenses/:id/reject

Assets:
GET    /assets
POST   /assets
GET    /assets/:id
POST   /assets/:id/assign
POST   /assets/:id/return
GET    /assets/:id/maintenance

Time Tracking:
GET    /timesheets
POST   /timesheets
GET    /timesheets/:id
PUT   /timesheets/:id/submit
PUT    /timesheets/:id/approve

Recruitment:
GET    /jobs
POST   /jobs
GET    /jobs/:id/applicants
POST   /jobs/:id/apply
POST   /applicants/:id/schedule-interview

Compliance:
GET    /training/courses
GET    /training/enrollments
POST   /training/enrollments/:id/complete

Reports:
GET    /reports/attendance
GET    /reports/payroll
GET    /reports/expenses
GET    /reports/headcount
```

---

### Key Backend Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Permission-based authorization
   - Multi-factor authentication (2FA)

2. **File Uploads**
   - AWS S3 integration
   - Image compression
   - Document virus scanning
   - Signed URLs for secure access

3. **Email & Notifications**
   - Email templates (leave approval, payslip, etc.)
   - SMTP integration
   - In-app notifications
   - Push notifications (optional)

4. **Background Jobs**
   - Payroll processing
   - Leave balance accrual
   - Report generation
   - Email sending
   - Data exports

5. **Reporting & Analytics**
   - Custom report builder
   - Data export (CSV, Excel, PDF)
   - Dashboard APIs
   - Scheduled reports

6. **Webhooks**
   - Attendance events
   - Leave approvals
   - Payroll completion
   - Integration with third-party tools

7. **Audit Logging**
   - Automatic audit trail
   - Change tracking
   - Compliance reports

---

## Security & Access Control

### Row-Level Security (PostgreSQL)

```sql
-- Enable RLS on employees table
ALTER TABLE core.employees ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can view their own record
CREATE POLICY employees_view_own
  ON core.employees
  FOR SELECT
  USING (id = current_setting('app.current_employee_id')::BIGINT);

-- Policy: HR can view all employees
CREATE POLICY employees_view_hr
  ON core.employees
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin.user_roles ur
      JOIN admin.roles r ON ur.role_id = r.id
      WHERE ur.user_id = current_setting('app.current_user_id')::BIGINT
      AND r.code = 'HR_MANAGER'
    )
  );
```

### API Security

1. **Authentication**
   - JWT tokens with expiry
   - Refresh token rotation
   - Token blacklisting on logout

2. **Authorization**
   - Check user permissions on every request
   - Validate data scope (own/department/all)

3. **Input Validation**
   - Validate all inputs against schema
   - Sanitize HTML/SQL inputs
   - File upload validation (type, size)

4. **Rate Limiting**
   - API rate limits (100 req/min per user)
   - Login attempt limits (5 attempts, 15-min lockout)

5. **Data Encryption**
   - Passwords: bcrypt (12 rounds)
   - Sensitive data: AES-256 encryption
   - SSL/TLS for all connections

---

## Data Migration Strategy

### Phase 1: Schema Creation
1. Create schemas (`core`, `payroll`, `time_tracking`, etc.)
2. Create tables in dependency order
3. Create indexes
4. Create constraints

### Phase 2: Seed Data
1. Create organization
2. Create departments
3. Create job titles
4. Create roles and permissions
5. Create leave types
6. Create salary components
7. Create expense categories

### Phase 3: Import Employee Data
1. Import employee master data
2. Create user accounts
3. Assign roles
4. Setup salary structures
5. Initialize leave balances

### Phase 4: Historical Data (Optional)
1. Import attendance history
2. Import leave history
3. Import payroll history
4. Import expense claims

---

## Appendix

### A. Sample Data Seeding Script

```sql
-- Organization
INSERT INTO core.organizations (name, email, currency, timezone)
VALUES ('CompliHR Inc.', 'admin@complihr.com', 'USD', 'America/New_York');

-- Departments
INSERT INTO core.departments (organization_id, name, code) VALUES
(1, 'Human Resources', 'HR'),
(1, 'Information Technology', 'IT'),
(1, 'Sales', 'SALES'),
(1, 'Marketing', 'MKT'),
(1, 'Finance', 'FIN');

-- Leave Types
INSERT INTO core.leave_types (organization_id, name, code, annual_allocation, is_paid) VALUES
(1, 'Annual Leave', 'AL', 20, true),
(1, 'Sick Leave', 'SL', 10, true),
(1, 'Casual Leave', 'CL', 5, true),
(1, 'Maternity Leave', 'ML', 90, true),
(1, 'Paternity Leave', 'PL', 10, true);

-- Salary Components
INSERT INTO payroll.salary_components (organization_id, component_name, component_code, component_type, calculation_type) VALUES
(1, 'Basic Salary', 'BASIC', 'EARNING', 'FIXED'),
(1, 'House Rent Allowance', 'HRA', 'EARNING', 'PERCENTAGE_OF_BASIC'),
(1, 'Medical Allowance', 'MEDICAL', 'EARNING', 'FIXED'),
(1, 'Income Tax', 'TAX', 'DEDUCTION', 'PERCENTAGE_OF_GROSS'),
(1, 'Social Security', 'SSN', 'DEDUCTION', 'PERCENTAGE_OF_GROSS');

-- Roles
INSERT INTO admin.roles (organization_id, name, code, level, is_system_role) VALUES
(1, 'Super Admin', 'SUPER_ADMIN', 1, true),
(1, 'HR Manager', 'HR_MANAGER', 2, true),
(1, 'Manager', 'MANAGER', 3, true),
(1, 'Employee', 'EMPLOYEE', 4, true);
```

---

### B. Common Queries

**1. Get employee with full details**
```sql
SELECT
  e.*,
  d.name as department_name,
  jt.title as job_title,
  m.full_name as manager_name
FROM core.employees e
LEFT JOIN core.departments d ON e.department_id = d.id
LEFT JOIN core.job_titles jt ON e.job_title_id = jt.id
LEFT JOIN core.employees m ON e.manager_id = m.id
WHERE e.id = 123 AND e.deleted_at IS NULL;
```

**2. Get employee leave balance**
```sql
SELECT
  lb.*,
  lt.name as leave_type_name
FROM core.leave_balances lb
JOIN core.leave_types lt ON lb.leave_type_id = lt.id
WHERE lb.employee_id = 123
  AND lb.calendar_year = 2025
  AND lb.deleted_at IS NULL;
```

**3. Get monthly attendance summary**
```sql
SELECT
  employee_id,
  COUNT(*) FILTER (WHERE status = 'Present') as days_present,
  COUNT(*) FILTER (WHERE status = 'Absent') as days_absent,
  COUNT(*) FILTER (WHERE status = 'Late') as days_late,
  SUM(total_working_hours) as total_hours,
  SUM(overtime_hours) as total_overtime
FROM time_tracking.attendance
WHERE attendance_date >= '2025-01-01'
  AND attendance_date < '2025-02-01'
  AND deleted_at IS NULL
GROUP BY employee_id;
```

**4. Get pending approvals for manager**
```sql
SELECT 'leave' as type, id, employee_id, created_at
FROM core.leave_requests
WHERE approver_id = 123 AND status = 'Pending' AND deleted_at IS NULL
UNION ALL
SELECT 'expense', id, employee_id, created_at
FROM core.expense_claims
WHERE approver_id = 123 AND status = 'Pending' AND deleted_at IS NULL
ORDER BY created_at DESC;
```

---

### C. Estimated Database Size

For 1,000 employees over 1 year:

| Table | Estimated Rows | Avg Row Size | Total Size |
|-------|---------------|--------------|------------|
| employees | 1,000 | 2 KB | 2 MB |
| attendance | 250,000 | 500 B | 125 MB |
| leave_requests | 5,000 | 1 KB | 5 MB |
| payslips | 12,000 | 2 KB | 24 MB |
| expense_claims | 10,000 | 1 KB | 10 MB |
| audit_logs | 500,000 | 1 KB | 500 MB |
| **Total Estimated** | | | **~670 MB** |

With indexes: **~1 GB**

---

### D. Performance Benchmarks

Target performance metrics:

- Employee list (1000 records): < 200ms
- Employee details: < 50ms
- Monthly attendance: < 300ms
- Leave balance: < 50ms
- Payroll generation (1000 employees): < 2 minutes
- Report generation: < 5 seconds

---

## 9. UK-SPECIFIC COMPLIANCE SCHEMA (`uk_compliance`)

**Purpose:** UK employment law compliance, PAYE, National Insurance, statutory payments, RTI, Working Time Directive.

**Target Market:** UK supermarket retail staff (hourly workers, shift-based, monthly reviews).

---

### 9.1 `uk_compliance.paye_settings`

HMRC PAYE (Pay As You Earn) tax settings for employees.

```sql
CREATE SCHEMA IF NOT EXISTS uk_compliance;

CREATE TABLE uk_compliance.paye_settings (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- PAYE Details
  tax_code VARCHAR(20) NOT NULL, -- e.g., 1257L, BR, D0, K497
  tax_basis VARCHAR(50) DEFAULT 'Cumulative', -- Cumulative, Week 1/Month 1

  -- National Insurance
  ni_number VARCHAR(13) UNIQUE, -- e.g., QQ123456C
  ni_category VARCHAR(1) NOT NULL DEFAULT 'A', -- A, B, C, D, E, F, H, J, L, M, S, V, Z

  -- Student Loan Deductions
  student_loan_plan VARCHAR(20), -- Plan 1, Plan 2, Plan 4, Postgraduate
  has_student_loan BOOLEAN DEFAULT false,

  -- Pension
  auto_enrolled_pension BOOLEAN DEFAULT false,
  pension_opted_out BOOLEAN DEFAULT false,
  pension_opt_out_date DATE,
  workplace_pension_scheme_id BIGINT, -- FK to pension schemes

  -- Payroll Giving
  payroll_giving_amount DECIMAL(10, 2) DEFAULT 0,

  -- Effective Period
  effective_from DATE NOT NULL,
  effective_to DATE,

  -- HMRC Notifications
  p45_issued BOOLEAN DEFAULT false,
  p45_issue_date DATE,
  p60_issued_for_year INT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_paye_employee_period UNIQUE(employee_id, effective_from, deleted_at)
);

CREATE INDEX idx_paye_employee ON uk_compliance.paye_settings(employee_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_paye_ni_number ON uk_compliance.paye_settings(ni_number) WHERE deleted_at IS NULL;
```

---

### 9.2 `uk_compliance.national_insurance_rates`

NI rates by category and earnings thresholds (updated annually by HMRC).

```sql
CREATE TABLE uk_compliance.national_insurance_rates (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Tax Year
  tax_year VARCHAR(10) NOT NULL, -- e.g., 2025/2026
  start_date DATE NOT NULL, -- 6th April
  end_date DATE NOT NULL, -- 5th April next year

  -- Employee NI Thresholds (per week for clarity)
  lower_earnings_limit DECIMAL(10, 2), -- LEL (e.g., £123/week)
  primary_threshold DECIMAL(10, 2), -- PT (e.g., £242/week)
  upper_earnings_limit DECIMAL(10, 2), -- UEL (e.g., £967/week)

  -- Employee NI Rates
  employee_rate_below_uel DECIMAL(5, 2), -- e.g., 12%
  employee_rate_above_uel DECIMAL(5, 2), -- e.g., 2%

  -- Employer NI
  secondary_threshold DECIMAL(10, 2), -- ST (e.g., £175/week)
  employer_rate DECIMAL(5, 2), -- e.g., 13.8%

  -- Employment Allowance
  employment_allowance_annual DECIMAL(10, 2), -- e.g., £5,000

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_ni_rates_year UNIQUE(organization_id, tax_year, deleted_at)
);

CREATE INDEX idx_ni_rates_tax_year ON uk_compliance.national_insurance_rates(tax_year, is_active) WHERE deleted_at IS NULL;
```

---

### 9.3 `uk_compliance.statutory_payments`

Statutory Sick Pay (SSP), Statutory Maternity/Paternity/Adoption Pay, etc.

```sql
CREATE TABLE uk_compliance.statutory_payments (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Payment Type
  payment_type VARCHAR(50) NOT NULL, -- SSP, SMP, SPP, SAP, ShPP, SPBP

  -- Period
  start_date DATE NOT NULL,
  end_date DATE,
  total_days INT,
  total_weeks INT,

  -- Eligibility
  is_eligible BOOLEAN DEFAULT true,
  eligibility_checked_at TIMESTAMP,
  eligibility_notes TEXT,

  -- Payment Details
  weekly_rate DECIMAL(10, 2), -- Statutory rate (e.g., £116.75/week for SSP)
  total_amount_paid DECIMAL(10, 2) DEFAULT 0,

  -- Recovery from HMRC
  recoverable_amount DECIMAL(10, 2) DEFAULT 0,
  recovered_from_hmrc BOOLEAN DEFAULT false,

  -- Linked Records
  leave_request_id BIGINT, -- FK to core.leave_requests if applicable

  -- Medical Certificate (for SSP)
  fit_note_received BOOLEAN DEFAULT false,
  fit_note_expiry_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'Active', -- Active, Completed, Cancelled

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_statutory_payments_employee ON uk_compliance.statutory_payments(employee_id, payment_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_statutory_payments_dates ON uk_compliance.statutory_payments(start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_statutory_payments_type ON uk_compliance.statutory_payments(payment_type, status) WHERE deleted_at IS NULL;
```

---

### 9.4 `uk_compliance.working_time_directive`

Working Time Regulations 1998 - 48-hour week tracking.

```sql
CREATE TABLE uk_compliance.working_time_directive (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Reference Period (rolling 17-week average)
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  week_number SMALLINT, -- 1-52
  year INT,

  -- Hours Worked
  total_hours_worked DECIMAL(5, 2) NOT NULL,
  average_weekly_hours_17_week DECIMAL(5, 2), -- Rolling 17-week average

  -- Compliance Check
  exceeds_48_hours BOOLEAN DEFAULT false,
  exceeds_average_48_hours BOOLEAN DEFAULT false,

  -- Opt-Out Agreement
  opt_out_signed BOOLEAN DEFAULT false,
  opt_out_date DATE,
  opt_out_expiry DATE,

  -- Rest Breaks Compliance
  daily_rest_hours DECIMAL(4, 2), -- Should be 11 consecutive hours
  daily_rest_compliant BOOLEAN DEFAULT true,
  weekly_rest_hours DECIMAL(4, 2), -- Should be 24 hours uninterrupted
  weekly_rest_compliant BOOLEAN DEFAULT true,

  -- Night Workers (if applicable)
  is_night_worker BOOLEAN DEFAULT false,
  night_hours_worked DECIMAL(5, 2),

  -- Violations
  has_violations BOOLEAN DEFAULT false,
  violation_notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_wtd_employee_week UNIQUE(employee_id, week_start_date, deleted_at)
);

CREATE INDEX idx_wtd_employee ON uk_compliance.working_time_directive(employee_id, week_start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_wtd_violations ON uk_compliance.working_time_directive(has_violations) WHERE deleted_at IS NULL AND has_violations = true;
CREATE INDEX idx_wtd_exceeds ON uk_compliance.working_time_directive(exceeds_average_48_hours) WHERE deleted_at IS NULL AND exceeds_average_48_hours = true;
```

---

### 9.5 `uk_compliance.minimum_wage_tracking`

National Minimum Wage (NMW) and National Living Wage (NLW) compliance.

```sql
CREATE TABLE uk_compliance.minimum_wage_tracking (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Pay Period
  pay_month SMALLINT NOT NULL,
  pay_year INT NOT NULL,

  -- Employee Age Bracket (determines applicable rate)
  employee_age SMALLINT,
  age_bracket VARCHAR(50), -- Under 18, 18-20, 21-22, 23+ (NLW), Apprentice

  -- Applicable Minimum Wage
  applicable_hourly_rate DECIMAL(5, 2) NOT NULL, -- e.g., £11.44 for NLW

  -- Actual Pay
  total_pay_for_period DECIMAL(10, 2) NOT NULL,
  total_hours_worked DECIMAL(7, 2) NOT NULL,
  effective_hourly_rate DECIMAL(5, 2) NOT NULL, -- total_pay / total_hours

  -- Compliance
  is_compliant BOOLEAN DEFAULT true,
  shortfall_amount DECIMAL(10, 2) DEFAULT 0, -- If underpaid

  -- Deductions Check
  total_deductions DECIMAL(10, 2) DEFAULT 0,
  deductions_reduce_below_nmw BOOLEAN DEFAULT false,

  -- Accommodation Offset (if applicable)
  accommodation_offset_per_day DECIMAL(5, 2),
  accommodation_offset_total DECIMAL(10, 2),

  -- Status
  reviewed_by BIGINT REFERENCES core.employees(id),
  reviewed_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_nmw_employee_period UNIQUE(employee_id, pay_month, pay_year, deleted_at)
);

CREATE INDEX idx_nmw_employee ON uk_compliance.minimum_wage_tracking(employee_id, pay_year, pay_month) WHERE deleted_at IS NULL;
CREATE INDEX idx_nmw_compliance ON uk_compliance.minimum_wage_tracking(is_compliant) WHERE deleted_at IS NULL AND is_compliant = false;
```

---

### 9.6 `uk_compliance.rti_submissions`

Real Time Information (RTI) submissions to HMRC.

```sql
CREATE TABLE uk_compliance.rti_submissions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Submission Type
  submission_type VARCHAR(50) NOT NULL, -- FPS (Full Payment Submission), EPS (Employer Payment Summary), EYU (Earlier Year Update)

  -- Tax Period
  tax_year VARCHAR(10) NOT NULL, -- e.g., 2025/2026
  tax_month SMALLINT, -- 1-12 (April = 1)

  -- Payroll Run Link
  payroll_run_id BIGINT REFERENCES payroll.payroll_runs(id),

  -- Submission Details
  submission_date TIMESTAMP,
  payment_date DATE, -- Date employees were paid

  -- FPS Details (if applicable)
  total_employees INT,
  total_payments DECIMAL(15, 2),
  total_tax_deducted DECIMAL(15, 2),
  total_ni_deducted DECIMAL(15, 2),
  total_student_loan_deducted DECIMAL(15, 2),

  -- EPS Details (if applicable)
  no_payment_for_period BOOLEAN DEFAULT false,
  employment_allowance_claimed DECIMAL(10, 2),
  cis_deductions DECIMAL(10, 2),
  statutory_payments_recovered DECIMAL(10, 2),

  -- HMRC Response
  submission_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Submitted, Accepted, Rejected, Error
  hmrc_reference VARCHAR(100), -- IRmark or correlation ID
  hmrc_response_date TIMESTAMP,
  hmrc_error_message TEXT,

  -- File Details
  xml_file_url TEXT,
  xml_file_hash VARCHAR(64),

  -- Resubmission
  is_resubmission BOOLEAN DEFAULT false,
  original_submission_id BIGINT REFERENCES uk_compliance.rti_submissions(id),

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_rti_organization ON uk_compliance.rti_submissions(organization_id, tax_year, tax_month) WHERE deleted_at IS NULL;
CREATE INDEX idx_rti_status ON uk_compliance.rti_submissions(submission_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rti_payroll ON uk_compliance.rti_submissions(payroll_run_id) WHERE deleted_at IS NULL;
```

---

### 9.7 `uk_compliance.pension_schemes`

UK workplace pension schemes (auto-enrolment).

```sql
CREATE TABLE uk_compliance.pension_schemes (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Scheme Details
  scheme_name VARCHAR(255) NOT NULL, -- e.g., NEST, The People's Pension, Aviva
  scheme_reference VARCHAR(100), -- Pension scheme reference number
  provider_name VARCHAR(255),

  -- Contact
  provider_contact_email VARCHAR(255),
  provider_contact_phone VARCHAR(50),

  -- Contribution Rates
  employer_contribution_percentage DECIMAL(5, 2) NOT NULL, -- e.g., 3%
  employee_contribution_percentage DECIMAL(5, 2) NOT NULL, -- e.g., 5%
  total_contribution_percentage DECIMAL(5, 2) NOT NULL, -- e.g., 8%

  -- Salary Reference
  pensionable_salary_basis VARCHAR(50) DEFAULT 'Qualifying Earnings', -- Qualifying Earnings, Basic Salary, Total Earnings

  -- Thresholds (annual amounts)
  lower_earnings_threshold DECIMAL(10, 2), -- e.g., £6,240
  upper_earnings_threshold DECIMAL(10, 2), -- e.g., £50,270

  -- Auto-Enrolment
  staging_date DATE, -- Employer's duties start date
  next_re_enrolment_date DATE, -- Must re-enrol opted-out staff every 3 years

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_pension_schemes_org ON uk_compliance.pension_schemes(organization_id, is_active) WHERE deleted_at IS NULL;
```

---

### 9.8 `uk_compliance.pension_contributions`

Individual pension contribution records.

```sql
CREATE TABLE uk_compliance.pension_contributions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
  pension_scheme_id BIGINT NOT NULL REFERENCES uk_compliance.pension_schemes(id),

  -- Pay Period
  payroll_run_id BIGINT REFERENCES payroll.payroll_runs(id),
  pay_month SMALLINT NOT NULL,
  pay_year INT NOT NULL,

  -- Pensionable Earnings
  pensionable_earnings DECIMAL(10, 2) NOT NULL,

  -- Contributions
  employee_contribution DECIMAL(10, 2) NOT NULL,
  employer_contribution DECIMAL(10, 2) NOT NULL,
  total_contribution DECIMAL(10, 2) NOT NULL,

  -- Tax Relief
  tax_relief_at_source DECIMAL(10, 2) DEFAULT 0, -- If scheme uses relief at source

  -- Status
  contribution_paid BOOLEAN DEFAULT false,
  payment_date DATE,
  payment_reference VARCHAR(100),

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_pension_contrib_employee_period UNIQUE(employee_id, pay_month, pay_year, deleted_at)
);

CREATE INDEX idx_pension_contrib_employee ON uk_compliance.pension_contributions(employee_id, pay_year, pay_month) WHERE deleted_at IS NULL;
CREATE INDEX idx_pension_contrib_scheme ON uk_compliance.pension_contributions(pension_scheme_id, pay_year, pay_month) WHERE deleted_at IS NULL;
CREATE INDEX idx_pension_contrib_payroll ON uk_compliance.pension_contributions(payroll_run_id) WHERE deleted_at IS NULL;
```

---

### 9.9 `uk_compliance.holiday_entitlement`

UK statutory holiday entitlement (5.6 weeks or 28 days).

```sql
CREATE TABLE uk_compliance.holiday_entitlement (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Leave Year
  leave_year_start DATE NOT NULL,
  leave_year_end DATE NOT NULL,

  -- Statutory Entitlement
  statutory_entitlement_days DECIMAL(5, 2) NOT NULL DEFAULT 28, -- 5.6 weeks (full-time)
  contractual_entitlement_days DECIMAL(5, 2), -- May be more than statutory
  total_entitlement_days DECIMAL(5, 2) NOT NULL,

  -- Pro-Rata Calculation (for part-time/starters/leavers)
  is_pro_rata BOOLEAN DEFAULT false,
  working_days_per_week DECIMAL(3, 1) DEFAULT 5, -- e.g., 3.5 for part-time
  pro_rata_percentage DECIMAL(5, 2),

  -- Accrual Method
  accrual_method VARCHAR(50) DEFAULT 'Annual', -- Annual, Monthly Accrual

  -- Carryover
  carryover_from_previous_year DECIMAL(5, 2) DEFAULT 0,
  carryover_expiry_date DATE,
  max_carryover_days DECIMAL(5, 2) DEFAULT 8, -- Typically capped

  -- Usage Tracking
  days_taken DECIMAL(5, 2) DEFAULT 0,
  days_pending DECIMAL(5, 2) DEFAULT 0,
  days_remaining DECIMAL(5, 2),

  -- Bank Holidays
  bank_holidays_included BOOLEAN DEFAULT true, -- Are bank holidays part of the 28 days?

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_holiday_entitlement_employee_year UNIQUE(employee_id, leave_year_start, deleted_at)
);

CREATE INDEX idx_holiday_entitlement_employee ON uk_compliance.holiday_entitlement(employee_id, leave_year_start) WHERE deleted_at IS NULL;
CREATE INDEX idx_holiday_entitlement_year ON uk_compliance.holiday_entitlement(leave_year_start, leave_year_end) WHERE deleted_at IS NULL;
```

---

## 10. SUPERMARKET/RETAIL-SPECIFIC SCHEMA (`retail`)

**Purpose:** Retail operations specific to supermarket staff - tills, stock handling, food safety, break compliance.

---

### 10.1 `retail.till_assignments`

Till/checkout assignments for cashiers.

```sql
CREATE SCHEMA IF NOT EXISTS retail;

CREATE TABLE retail.till_assignments (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Till Details
  till_number VARCHAR(20) NOT NULL, -- e.g., TILL-01, TILL-02
  store_location VARCHAR(255),
  department VARCHAR(100), -- Checkouts, Customer Service, Self-Service

  -- Shift Assignment
  shift_id BIGINT REFERENCES time_tracking.shifts(id),
  shift_date DATE NOT NULL,

  -- Timing
  assigned_at TIMESTAMP NOT NULL,
  opened_at TIMESTAMP,
  closed_at TIMESTAMP,
  total_hours DECIMAL(5, 2),

  -- Till Float
  opening_float DECIMAL(10, 2), -- Starting cash
  closing_float DECIMAL(10, 2), -- Expected cash at end
  actual_cash_count DECIMAL(10, 2), -- Counted at end
  variance DECIMAL(10, 2), -- Difference (actual - expected)

  -- Transaction Summary
  total_transactions INT DEFAULT 0,
  total_sales DECIMAL(12, 2) DEFAULT 0,
  total_refunds DECIMAL(12, 2) DEFAULT 0,
  card_payments DECIMAL(12, 2) DEFAULT 0,
  cash_payments DECIMAL(12, 2) DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'Assigned', -- Assigned, Open, Closed, Reconciled

  -- Variance Investigation
  variance_within_tolerance BOOLEAN DEFAULT true,
  variance_investigated BOOLEAN DEFAULT false,
  variance_notes TEXT,

  -- Approval
  reconciled_by BIGINT REFERENCES core.employees(id),
  reconciled_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_till_employee ON retail.till_assignments(employee_id, shift_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_till_number ON retail.till_assignments(till_number, shift_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_till_variance ON retail.till_assignments(variance_within_tolerance) WHERE deleted_at IS NULL AND variance_within_tolerance = false;
CREATE INDEX idx_till_status ON retail.till_assignments(status) WHERE deleted_at IS NULL;
```

---

### 10.2 `retail.break_compliance`

Break compliance tracking (UK law: 20 min break for 6+ hour shifts).

```sql
CREATE TABLE retail.break_compliance (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Shift Details
  attendance_id BIGINT REFERENCES time_tracking.attendance(id),
  shift_date DATE NOT NULL,
  shift_start_time TIMESTAMP,
  shift_end_time TIMESTAMP,
  total_shift_hours DECIMAL(5, 2),

  -- Break Entitlement
  entitled_to_break BOOLEAN DEFAULT false, -- true if shift >= 6 hours
  minimum_break_minutes INT, -- 20 minutes for 6+ hours

  -- Actual Breaks Taken
  break_start_time TIMESTAMP,
  break_end_time TIMESTAMP,
  break_duration_minutes INT,

  -- Compliance
  is_compliant BOOLEAN DEFAULT true,
  break_taken BOOLEAN DEFAULT false,
  break_waived BOOLEAN DEFAULT false, -- Employee voluntarily waived break
  waiver_signature_url TEXT,

  -- Multiple Breaks (if applicable)
  additional_breaks JSONB, -- [{start: "", end: "", duration: 10}, ...]
  total_break_minutes INT,

  -- Violations
  violation_reason TEXT,
  manager_notified BOOLEAN DEFAULT false,
  manager_id BIGINT REFERENCES core.employees(id),

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_break_compliance_employee_date UNIQUE(employee_id, shift_date, deleted_at)
);

CREATE INDEX idx_break_compliance_employee ON retail.break_compliance(employee_id, shift_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_break_compliance_violations ON retail.break_compliance(is_compliant) WHERE deleted_at IS NULL AND is_compliant = false;
CREATE INDEX idx_break_compliance_attendance ON retail.break_compliance(attendance_id) WHERE deleted_at IS NULL;
```

---

### 10.3 `retail.food_safety_certifications`

Food safety training certifications (mandatory for food retail).

```sql
CREATE TABLE retail.food_safety_certifications (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Certification Details
  certification_type VARCHAR(100) NOT NULL, -- Level 1, Level 2 Food Hygiene, Allergen Training
  certification_level SMALLINT, -- 1, 2, 3
  certification_name VARCHAR(255),

  -- Awarding Body
  awarding_body VARCHAR(255), -- e.g., CIEH, RSPH, Highfield
  certificate_number VARCHAR(100),

  -- Dates
  issue_date DATE NOT NULL,
  expiry_date DATE, -- Typically 3 years for Level 2
  renewal_due_date DATE,

  -- Certificate Files
  certificate_file_url TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'Active', -- Active, Expired, Renewed, Revoked
  is_valid BOOLEAN DEFAULT true,

  -- Reminders
  renewal_reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_date DATE,

  -- Verification
  verified_by BIGINT REFERENCES core.employees(id),
  verified_at TIMESTAMP,

  -- Linked Training
  training_record_id BIGINT, -- FK to compliance.training_records

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_food_safety_employee ON retail.food_safety_certifications(employee_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_food_safety_expiry ON retail.food_safety_certifications(expiry_date) WHERE deleted_at IS NULL AND status = 'Active';
CREATE INDEX idx_food_safety_type ON retail.food_safety_certifications(certification_type) WHERE deleted_at IS NULL;
```

---

### 10.4 `retail.stock_handling_authorizations`

Authorization to handle specific product categories (alcohol, age-restricted, medications).

```sql
CREATE TABLE retail.stock_handling_authorizations (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Authorization Type
  authorization_type VARCHAR(100) NOT NULL, -- Alcohol Sales, Age Restricted (18+), Pharmacy Counter, Tobacco, Knives
  category VARCHAR(100),

  -- Training/Qualification
  training_completed BOOLEAN DEFAULT false,
  training_date DATE,
  training_provider VARCHAR(255),

  -- Age Verification (for alcohol/tobacco sales)
  employee_age_verified BOOLEAN DEFAULT false, -- Must be 18+ to sell alcohol
  date_of_birth_verified DATE,

  -- License/Permit (if required)
  license_required BOOLEAN DEFAULT false,
  license_number VARCHAR(100),
  license_expiry_date DATE,

  -- Effective Period
  authorized_from DATE NOT NULL,
  authorized_to DATE,

  -- Restrictions
  supervision_required BOOLEAN DEFAULT false,
  specific_restrictions TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'Active', -- Active, Suspended, Revoked, Expired

  -- Approval
  approved_by BIGINT REFERENCES core.employees(id),
  approved_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_stock_auth_employee ON retail.stock_handling_authorizations(employee_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_stock_auth_type ON retail.stock_handling_authorizations(authorization_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_stock_auth_expiry ON retail.stock_handling_authorizations(license_expiry_date) WHERE deleted_at IS NULL AND status = 'Active';
```

---

### 10.5 `retail.shift_swap_requests`

Shift swap/exchange requests between employees.

```sql
CREATE TABLE retail.shift_swap_requests (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Requesting Employee
  requesting_employee_id BIGINT NOT NULL REFERENCES core.employees(id),
  requesting_shift_id BIGINT NOT NULL REFERENCES time_tracking.shift_assignments(id),

  -- Target Employee
  target_employee_id BIGINT REFERENCES core.employees(id),
  target_shift_id BIGINT REFERENCES time_tracking.shift_assignments(id),

  -- Request Type
  request_type VARCHAR(50) NOT NULL, -- Swap (exchange), Give Away, Pick Up

  -- Dates
  original_shift_date DATE NOT NULL,
  swap_shift_date DATE,

  -- Reason
  reason TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Accepted, Rejected, Manager Approved, Completed, Cancelled

  -- Target Employee Response
  target_response VARCHAR(50), -- Accepted, Rejected
  target_responded_at TIMESTAMP,

  -- Manager Approval
  requires_manager_approval BOOLEAN DEFAULT true,
  manager_id BIGINT REFERENCES core.employees(id),
  manager_approved BOOLEAN DEFAULT false,
  manager_approved_at TIMESTAMP,
  manager_notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_shift_swap_requesting ON retail.shift_swap_requests(requesting_employee_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_shift_swap_target ON retail.shift_swap_requests(target_employee_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_shift_swap_manager ON retail.shift_swap_requests(manager_id, status) WHERE deleted_at IS NULL AND requires_manager_approval = true;
CREATE INDEX idx_shift_swap_date ON retail.shift_swap_requests(original_shift_date) WHERE deleted_at IS NULL;
```

---

## 11. MONTHLY PERFORMANCE REVIEWS SCHEMA

**Purpose:** Monthly performance reviews for retail staff (replacing annual review cycle).

---

### 11.1 Update `performance.review_cycles`

Modify existing performance review cycles to support monthly frequency.

```sql
-- Add to existing performance.review_cycles table (if not already present)
ALTER TABLE performance.review_cycles
  ADD COLUMN IF NOT EXISTS review_frequency VARCHAR(50) DEFAULT 'Annual';
  -- Values: Monthly, Quarterly, Semi-Annual, Annual

ALTER TABLE performance.review_cycles
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Create index for monthly reviews
CREATE INDEX IF NOT EXISTS idx_review_cycles_frequency
  ON performance.review_cycles(review_frequency, is_recurring)
  WHERE deleted_at IS NULL;
```

---

### 11.2 `performance.monthly_reviews`

Monthly performance reviews for frontline retail staff.

```sql
-- Create performance schema if not exists
CREATE SCHEMA IF NOT EXISTS performance;

CREATE TABLE performance.monthly_reviews (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,

  -- Review Period
  review_month SMALLINT NOT NULL, -- 1-12
  review_year INT NOT NULL,
  review_date DATE NOT NULL,

  -- Reviewer
  reviewer_id BIGINT NOT NULL REFERENCES core.employees(id), -- Line manager/supervisor
  reviewer_role VARCHAR(100), -- Store Manager, Shift Supervisor, Department Manager

  -- Attendance & Punctuality
  attendance_rating SMALLINT, -- 1-5 scale
  days_present DECIMAL(5, 2),
  days_absent DECIMAL(5, 2),
  times_late INT,
  attendance_notes TEXT,

  -- Performance Ratings (1-5 scale)
  punctuality_rating SMALLINT,
  customer_service_rating SMALLINT,
  teamwork_rating SMALLINT,
  productivity_rating SMALLINT,
  initiative_rating SMALLINT,
  compliance_rating SMALLINT, -- Following procedures, safety, hygiene

  -- Retail-Specific Ratings
  till_accuracy_rating SMALLINT, -- For cashiers
  stock_handling_rating SMALLINT,
  merchandising_rating SMALLINT,
  cleanliness_rating SMALLINT,

  -- Overall Rating
  overall_rating DECIMAL(3, 2), -- Average of all ratings
  performance_level VARCHAR(50), -- Outstanding, Exceeds Expectations, Meets Expectations, Needs Improvement, Unsatisfactory

  -- Achievements
  key_achievements TEXT,
  positive_feedback TEXT,

  -- Areas for Improvement
  areas_for_improvement TEXT,
  development_actions TEXT,

  -- Goals for Next Month
  goals_next_month TEXT,

  -- Manager Comments
  manager_comments TEXT,
  manager_recommendations TEXT,

  -- Employee Comments
  employee_comments TEXT,
  employee_concerns TEXT,

  -- Follow-Up Actions
  action_items JSONB, -- [{action: "", owner: "", due_date: ""}, ...]

  -- Sign-Off
  manager_signed BOOLEAN DEFAULT false,
  manager_signed_at TIMESTAMP,
  employee_signed BOOLEAN DEFAULT false,
  employee_signed_at TIMESTAMP,
  employee_signature_url TEXT,

  -- Review Meeting
  meeting_date TIMESTAMP,
  meeting_duration_minutes INT,
  meeting_location VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Completed, Employee Reviewed, Acknowledged, Disputed

  -- Escalation
  requires_hr_review BOOLEAN DEFAULT false,
  hr_reviewed BOOLEAN DEFAULT false,
  hr_reviewer_id BIGINT REFERENCES core.employees(id),
  hr_review_date TIMESTAMP,
  hr_notes TEXT,

  -- Linked Records
  attendance_summary_id BIGINT, -- Link to attendance summary for the month
  previous_review_id BIGINT REFERENCES performance.monthly_reviews(id),

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT NOT NULL,
  deleted_at TIMESTAMP,

  CONSTRAINT uq_monthly_review_employee_month UNIQUE(employee_id, review_month, review_year, deleted_at),
  CONSTRAINT chk_ratings_range CHECK (
    attendance_rating BETWEEN 1 AND 5 AND
    punctuality_rating BETWEEN 1 AND 5 AND
    customer_service_rating BETWEEN 1 AND 5 AND
    teamwork_rating BETWEEN 1 AND 5 AND
    productivity_rating BETWEEN 1 AND 5
  )
);

CREATE INDEX idx_monthly_reviews_employee ON performance.monthly_reviews(employee_id, review_year, review_month) WHERE deleted_at IS NULL;
CREATE INDEX idx_monthly_reviews_reviewer ON performance.monthly_reviews(reviewer_id, review_year, review_month) WHERE deleted_at IS NULL;
CREATE INDEX idx_monthly_reviews_period ON performance.monthly_reviews(review_year, review_month) WHERE deleted_at IS NULL;
CREATE INDEX idx_monthly_reviews_status ON performance.monthly_reviews(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_monthly_reviews_rating ON performance.monthly_reviews(performance_level) WHERE deleted_at IS NULL;
CREATE INDEX idx_monthly_reviews_hr_review ON performance.monthly_reviews(requires_hr_review) WHERE deleted_at IS NULL AND requires_hr_review = true;
```

---

### 11.3 `performance.monthly_review_kpis`

Specific KPIs tracked monthly for retail roles.

```sql
CREATE TABLE performance.monthly_review_kpis (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  monthly_review_id BIGINT NOT NULL REFERENCES performance.monthly_reviews(id) ON DELETE CASCADE,

  -- KPI Details
  kpi_name VARCHAR(255) NOT NULL,
  kpi_category VARCHAR(100), -- Sales, Customer Service, Efficiency, Compliance

  -- Target vs Actual
  target_value DECIMAL(15, 2),
  actual_value DECIMAL(15, 2),
  unit_of_measure VARCHAR(50), -- £, items, %, minutes, count

  -- Performance
  achievement_percentage DECIMAL(5, 2), -- (actual / target) * 100
  status VARCHAR(50), -- Exceeded, Met, Below Target, Not Met

  -- Weighting
  weight_percentage DECIMAL(5, 2), -- How much this KPI contributes to overall rating

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_monthly_review_kpis_review ON performance.monthly_review_kpis(monthly_review_id);
CREATE INDEX idx_monthly_review_kpis_category ON performance.monthly_review_kpis(kpi_category);

-- Example KPIs for retail staff:
-- - Sales per hour (£/hour)
-- - Items scanned per minute (for cashiers)
-- - Customer satisfaction score (%)
-- - Till variance (£)
-- - Attendance percentage (%)
-- - Stock replenishment speed (items/hour)
-- - Mystery shopper score (1-10)
-- - Compliance audit score (%)
```

---

## Conclusion

This database schema provides a comprehensive foundation for the CompliHR system, covering:

✅ **10 Modular Schemas** for clean separation (including UK compliance and retail)
✅ **65+ Tables** covering all HR functions plus UK-specific compliance
✅ **Comprehensive relationships** with referential integrity
✅ **Audit trail** for compliance
✅ **Performance optimization** with strategic indexing
✅ **Security** with RLS and RBAC
✅ **Scalability** with partitioning strategy
✅ **UK Market Compliance**: PAYE, NI, RTI, Working Time Directive, Statutory Payments, Pensions
✅ **Supermarket Retail Features**: Till management, break compliance, food safety, shift swaps
✅ **Monthly Performance Reviews**: Retail-focused monthly review cycle with KPIs

The schema is designed to be **PostgreSQL-native** but can be adapted to MySQL/MariaDB with minor modifications (primarily data types and JSON handling).

### UK-Specific Highlights

1. **PAYE & National Insurance**: Full tracking of UK tax codes, NI categories, student loans
2. **RTI Submissions**: FPS/EPS submission tracking with HMRC integration readiness
3. **Working Time Directive**: 48-hour week compliance with opt-out tracking
4. **Statutory Payments**: SSP, SMP, SPP with HMRC recovery tracking
5. **Pension Auto-Enrolment**: Workplace pension schemes with contribution tracking
6. **Minimum Wage Compliance**: NMW/NLW tracking by age bracket
7. **Holiday Entitlement**: 5.6-week statutory entitlement with pro-rata calculations

### Retail-Specific Highlights

1. **Till Management**: Float tracking, variance monitoring, reconciliation
2. **Break Compliance**: UK break law compliance (20 min for 6+ hour shifts)
3. **Food Safety**: Certification tracking with renewal reminders
4. **Stock Authorizations**: Age-restricted product handling permissions
5. **Shift Swaps**: Employee-initiated shift exchange with manager approval
6. **Monthly Reviews**: Comprehensive monthly performance reviews with retail KPIs

**Next Steps:**
1. Review and approve schema design
2. Create migration scripts
3. Setup development database
4. Seed initial data (UK tax rates, NI brackets, pension schemes)
5. Integrate HMRC Gateway API for RTI submissions
6. Begin backend API development
7. Implement authentication & authorization
8. Connect frontend to APIs

---

**Document Version:** 2.0 (UK Market Edition)
**Author:** Claude (Anthropic)
**Date:** January 2025
**Status:** Ready for Implementation
**Target Market:** UK Supermarket Retail
