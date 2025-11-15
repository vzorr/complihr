# CompliHR - Audit Logging & History Tracking Strategy

> **Comprehensive audit trail system for compliance, security, and debugging**
>
> Version: 1.0 | Date: January 2025 | Target: UK Retail Market

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Regulatory Requirements](#regulatory-requirements)
3. [Audit Strategy Overview](#audit-strategy-overview)
4. [Implementation Patterns](#implementation-patterns)
5. [Database Schema](#database-schema)
6. [Best Practices](#best-practices)
7. [Performance Optimization](#performance-optimization)
8. [Retention & Compliance](#retention--compliance)
9. [Implementation Examples](#implementation-examples)

---

## Executive Summary

### Why Audit Logging Matters

**Compliance Requirements:**
- **GDPR (UK)**: Demonstrate data processing activities, subject access requests
- **Employment Law**: Prove fair treatment, document disciplinary actions
- **HMRC**: Audit trail for payroll submissions, tax calculations
- **Data Protection Act 2018**: Right to be informed, data processing records
- **ISO 27001**: Information security audit requirements

**Business Benefits:**
- **Debugging**: Trace issues back to source
- **Accountability**: Who changed what and when
- **Security**: Detect unauthorized access
- **Compliance**: Prove regulatory compliance
- **Dispute Resolution**: Evidence for employment tribunals

### Our Approach

✅ **3-Tier Audit Strategy:**
1. **Column-Level Audit** (Standard): `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`
2. **Row-Level History** (High-Value): Full change history for sensitive tables (employees, payroll, performance)
3. **Activity Logging** (System-Wide): Comprehensive audit log of all system actions

---

## Regulatory Requirements

### UK GDPR & Data Protection Act 2018

**Article 30 - Records of Processing Activities:**
- Must maintain records of all data processing activities
- Who accessed what data, when, and why
- Retention: Minimum 6 years for employment records

**Article 15 - Right of Access:**
- Employees can request all data held about them
- Must provide copy within 1 month
- Includes audit trail of who accessed their data

**Practical Requirements:**
```
Employee Request: "Who has accessed my personal data in the last 6 months?"

System Must Provide:
- List of all users who viewed employee record
- Timestamps of access
- Purpose of access (if recorded)
- What data was viewed/changed
```

### UK Employment Law

**Employment Rights Act 1996:**
- Must keep records of disciplinary actions for 6 years
- Performance reviews must be documented
- Pay records must be kept for 6 years after employment ends

**Working Time Regulations 1998:**
- Attendance records for 2 years
- Break compliance records
- Opt-out agreements

**HMRC Requirements:**
- Payroll records for 6 years after tax year end
- RTI submissions audit trail
- Statutory payment calculations

### Data Retention Matrix

| Record Type | Minimum Retention | Reason |
|-------------|------------------|--------|
| Employee personal data | 6 years after leaving | Tax/employment law |
| Payroll records | 6 years after tax year | HMRC requirement |
| Attendance records | 2 years | Working Time Regulations |
| Performance reviews | 6 years | Employment tribunal evidence |
| Disciplinary records | 6 years | Employment tribunal evidence |
| Audit logs | 6 years | GDPR compliance |
| Security logs | 1 year | ISO 27001 |
| Access logs (personal data) | 6 years | GDPR Article 30 |

---

## Audit Strategy Overview

### 3-Tier Audit System

```
┌─────────────────────────────────────────────────────────────┐
│ TIER 1: COLUMN-LEVEL AUDIT (All Tables)                    │
├─────────────────────────────────────────────────────────────┤
│ • created_at, updated_at, deleted_at                        │
│ • created_by, updated_by                                    │
│ • Lightweight, minimal overhead                             │
│ • Soft delete pattern                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ TIER 2: ROW-LEVEL HISTORY (Sensitive Tables)               │
├─────────────────────────────────────────────────────────────┤
│ • Full snapshot of row before each change                   │
│ • Stored in *_history tables                                │
│ • Triggered automatically via database triggers             │
│ • For: employees, payroll, performance, compliance          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ TIER 3: ACTIVITY LOG (System-Wide)                         │
├─────────────────────────────────────────────────────────────┤
│ • All user actions logged (login, view, create, update)     │
│ • Centralized audit.activity_logs table                     │
│ • Includes: user, action, resource, IP, metadata            │
│ • For: Compliance reporting, security monitoring            │
└─────────────────────────────────────────────────────────────┘
```

### When to Use Each Tier

| Tier | Use Case | Example Tables |
|------|----------|----------------|
| **Tier 1 Only** | Reference data, low-risk changes | departments, job_titles, leave_types, shifts |
| **Tier 1 + 2** | Sensitive employee data | core.employees, payroll.payslips, performance.reviews |
| **Tier 1 + 3** | System actions, security events | auth logs, access control |
| **All Tiers** | Critical compliance data | payroll.payslips, uk_compliance.rti_submissions, performance.monthly_reviews |

---

## Implementation Patterns

### Pattern 1: Column-Level Audit (Tier 1)

**Standard Columns for ALL Tables:**

```sql
-- Every table must include these columns
CREATE TABLE example_table (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL,

  -- Business columns
  name VARCHAR(255),
  status VARCHAR(50),

  -- TIER 1: Column-level audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT REFERENCES core.employees(id),
  updated_by BIGINT REFERENCES core.employees(id),
  deleted_at TIMESTAMP, -- Soft delete

  CONSTRAINT chk_audit_trail CHECK (
    created_at IS NOT NULL AND
    created_by IS NOT NULL
  )
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_example_table_updated_at
  BEFORE UPDATE ON example_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Benefits:**
- ✅ Minimal overhead (<5% storage increase)
- ✅ Answers: "When was this created/modified?"
- ✅ Answers: "Who created/modified this?"
- ✅ Soft delete allows data recovery

---

### Pattern 2: Row-Level History (Tier 2)

**For Sensitive Tables: Full Change History**

```sql
-- Main table
CREATE TABLE core.employees (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL,

  employee_id VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  salary DECIMAL(15, 2),
  department_id BIGINT,

  -- Tier 1 audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  updated_by BIGINT,
  deleted_at TIMESTAMP
);

-- History table (mirror structure + metadata)
CREATE TABLE audit.employees_history (
  history_id BIGSERIAL PRIMARY KEY,

  -- Original row data (snapshot)
  id BIGINT NOT NULL,
  organization_id BIGINT NOT NULL,
  employee_id VARCHAR(50),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  salary DECIMAL(15, 2),
  department_id BIGINT,

  -- Original audit columns
  original_created_at TIMESTAMP,
  original_updated_at TIMESTAMP,
  original_created_by BIGINT,
  original_updated_by BIGINT,
  original_deleted_at TIMESTAMP,

  -- History metadata
  history_action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  history_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  history_user_id BIGINT,
  history_ip_address VARCHAR(50),
  history_user_agent TEXT,

  -- Change tracking
  changed_fields JSONB, -- {"salary": {"old": 30000, "new": 35000}}

  -- Index for queries
  CONSTRAINT chk_history_action CHECK (history_action IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Indexes for history queries
CREATE INDEX idx_employees_history_id ON audit.employees_history(id, history_timestamp DESC);
CREATE INDEX idx_employees_history_timestamp ON audit.employees_history(history_timestamp DESC);
CREATE INDEX idx_employees_history_user ON audit.employees_history(history_user_id);

-- Automatic history tracking trigger
CREATE OR REPLACE FUNCTION audit.track_employee_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields JSONB := '{}';
  current_user_id BIGINT;
  current_ip VARCHAR(50);
BEGIN
  -- Get current user from session (set by application)
  current_user_id := current_setting('app.current_user_id', true)::BIGINT;
  current_ip := current_setting('app.current_ip', true);

  -- For UPDATE, track which fields changed
  IF TG_OP = 'UPDATE' THEN
    IF OLD.first_name IS DISTINCT FROM NEW.first_name THEN
      changed_fields := jsonb_set(changed_fields, '{first_name}',
        jsonb_build_object('old', OLD.first_name, 'new', NEW.first_name));
    END IF;

    IF OLD.salary IS DISTINCT FROM NEW.salary THEN
      changed_fields := jsonb_set(changed_fields, '{salary}',
        jsonb_build_object('old', OLD.salary, 'new', NEW.salary));
    END IF;

    -- Add more fields as needed...
  END IF;

  -- Insert history record
  INSERT INTO audit.employees_history (
    id, organization_id, employee_id, first_name, last_name, email, salary, department_id,
    original_created_at, original_updated_at, original_created_by, original_updated_by, original_deleted_at,
    history_action, history_timestamp, history_user_id, history_ip_address, changed_fields
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.organization_id, OLD.organization_id),
    COALESCE(NEW.employee_id, OLD.employee_id),
    COALESCE(NEW.first_name, OLD.first_name),
    COALESCE(NEW.last_name, OLD.last_name),
    COALESCE(NEW.email, OLD.email),
    COALESCE(NEW.salary, OLD.salary),
    COALESCE(NEW.department_id, OLD.department_id),
    COALESCE(NEW.created_at, OLD.created_at),
    COALESCE(NEW.updated_at, OLD.updated_at),
    COALESCE(NEW.created_by, OLD.created_by),
    COALESCE(NEW.updated_by, OLD.updated_by),
    COALESCE(NEW.deleted_at, OLD.deleted_at),
    TG_OP,
    CURRENT_TIMESTAMP,
    current_user_id,
    current_ip,
    changed_fields
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER track_employee_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON core.employees
  FOR EACH ROW
  EXECUTE FUNCTION audit.track_employee_changes();
```

**Benefits:**
- ✅ Complete audit trail of every change
- ✅ Point-in-time reconstruction ("What did this record look like on 1st Jan?")
- ✅ Field-level change tracking
- ✅ Who changed what, when, and from where

**Query Examples:**

```sql
-- 1. Get complete history of an employee
SELECT
  history_timestamp,
  history_action,
  history_user_id,
  first_name,
  last_name,
  salary,
  changed_fields
FROM audit.employees_history
WHERE id = 105 -- Zain
ORDER BY history_timestamp DESC;

-- 2. Find who changed employee's salary
SELECT
  h.history_timestamp,
  h.changed_fields->>'salary' as salary_change,
  e.first_name || ' ' || e.last_name as changed_by
FROM audit.employees_history h
JOIN core.employees e ON h.history_user_id = e.id
WHERE h.id = 105
  AND h.changed_fields ? 'salary'
ORDER BY h.history_timestamp DESC;

-- 3. Reconstruct employee record as of specific date
SELECT *
FROM audit.employees_history
WHERE id = 105
  AND history_timestamp <= '2024-12-31 23:59:59'
ORDER BY history_timestamp DESC
LIMIT 1;

-- 4. Find all salary increases in last month
SELECT
  h.id,
  e.first_name || ' ' || e.last_name as employee,
  (h.changed_fields->'salary'->>'old')::DECIMAL as old_salary,
  (h.changed_fields->'salary'->>'new')::DECIMAL as new_salary,
  h.history_timestamp
FROM audit.employees_history h
JOIN core.employees e ON h.id = e.id
WHERE h.changed_fields ? 'salary'
  AND h.history_timestamp >= CURRENT_DATE - INTERVAL '1 month'
ORDER BY h.history_timestamp DESC;
```

---

### Pattern 3: Activity Logging (Tier 3)

**Centralized System-Wide Audit Log**

```sql
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.activity_logs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL,

  -- Who
  user_id BIGINT REFERENCES core.employees(id),
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  impersonated_by BIGINT, -- If admin is acting as another user

  -- What
  action VARCHAR(100) NOT NULL, -- login, view_employee, update_salary, run_payroll, etc.
  resource_type VARCHAR(100), -- employee, payslip, leave_request, etc.
  resource_id BIGINT,

  -- When
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Where
  ip_address VARCHAR(50),
  user_agent TEXT,
  device_type VARCHAR(50), -- web, mobile, api
  location JSONB, -- {"country": "UK", "city": "London"}

  -- How
  http_method VARCHAR(10), -- GET, POST, PUT, DELETE
  endpoint VARCHAR(500), -- /api/v1/employees/105

  -- Context
  status VARCHAR(20) DEFAULT 'success', -- success, failure, error
  error_message TEXT,
  request_id VARCHAR(100), -- Trace ID for debugging

  -- Sensitive Data Access Tracking
  contains_pii BOOLEAN DEFAULT false,
  pii_fields TEXT[], -- ['salary', 'ni_number', 'address']

  -- Additional metadata
  metadata JSONB, -- Flexible storage for extra context

  -- Performance
  duration_ms INT -- How long the action took
);

-- Partitioning by month for performance
CREATE TABLE audit.activity_logs_2025_01 PARTITION OF audit.activity_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Indexes
CREATE INDEX idx_activity_logs_user ON audit.activity_logs(user_id, timestamp DESC);
CREATE INDEX idx_activity_logs_timestamp ON audit.activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_resource ON audit.activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_action ON audit.activity_logs(action) WHERE status = 'failure';
CREATE INDEX idx_activity_logs_pii ON audit.activity_logs(timestamp DESC) WHERE contains_pii = true;
```

**Example Log Entries:**

```sql
-- User login
INSERT INTO audit.activity_logs (
  organization_id, user_id, user_email, action,
  ip_address, user_agent, device_type, status
) VALUES (
  1, 105, 'zain@complihr.com', 'user_login',
  '192.168.1.100', 'Mozilla/5.0...', 'web', 'success'
);

-- View employee record (PII access)
INSERT INTO audit.activity_logs (
  organization_id, user_id, action, resource_type, resource_id,
  contains_pii, pii_fields, endpoint, http_method
) VALUES (
  1, 101, 'view_employee', 'employee', 105,
  true, ARRAY['salary', 'ni_number', 'address'],
  '/api/v1/employees/105', 'GET'
);

-- Update salary (sensitive change)
INSERT INTO audit.activity_logs (
  organization_id, user_id, action, resource_type, resource_id,
  contains_pii, metadata
) VALUES (
  1, 101, 'update_salary', 'employee', 105,
  true, '{"old_salary": 30000, "new_salary": 35000, "reason": "Annual review"}'::JSONB
);

-- Failed login attempt (security)
INSERT INTO audit.activity_logs (
  organization_id, user_email, action, status, error_message, ip_address
) VALUES (
  1, 'zain@complihr.com', 'user_login', 'failure',
  'Invalid password', '192.168.1.100'
);

-- Payroll run (compliance)
INSERT INTO audit.activity_logs (
  organization_id, user_id, action, resource_type, resource_id,
  metadata, duration_ms
) VALUES (
  1, 101, 'run_payroll', 'payroll_run', 523,
  '{"period": "2025-01", "employees": 150, "total_amount": 375000}'::JSONB,
  12500
);
```

**Query Examples:**

```sql
-- 1. GDPR Subject Access Request: Who accessed my data?
SELECT
  al.timestamp,
  e.first_name || ' ' || e.last_name as accessed_by,
  al.action,
  al.pii_fields,
  al.ip_address
FROM audit.activity_logs al
LEFT JOIN core.employees e ON al.user_id = e.id
WHERE al.resource_type = 'employee'
  AND al.resource_id = 105 -- Zain
  AND al.timestamp >= CURRENT_DATE - INTERVAL '6 months'
ORDER BY al.timestamp DESC;

-- 2. Security: Failed login attempts
SELECT
  user_email,
  COUNT(*) as failed_attempts,
  MAX(timestamp) as last_attempt,
  array_agg(DISTINCT ip_address) as ip_addresses
FROM audit.activity_logs
WHERE action = 'user_login'
  AND status = 'failure'
  AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY user_email
HAVING COUNT(*) >= 5;

-- 3. Compliance: All payroll runs in tax year
SELECT
  al.timestamp,
  e.first_name || ' ' || e.last_name as run_by,
  al.metadata->>'period' as period,
  al.metadata->>'employees' as employees_count,
  al.metadata->>'total_amount' as total_amount
FROM audit.activity_logs al
JOIN core.employees e ON al.user_id = e.id
WHERE al.action = 'run_payroll'
  AND al.timestamp >= '2024-04-06'
  AND al.timestamp < '2025-04-06'
ORDER BY al.timestamp DESC;

-- 4. Security: Detect unusual PII access
SELECT
  user_id,
  COUNT(DISTINCT resource_id) as unique_employees_accessed,
  COUNT(*) as total_accesses,
  array_agg(DISTINCT resource_id) as employee_ids
FROM audit.activity_logs
WHERE contains_pii = true
  AND timestamp >= CURRENT_DATE
GROUP BY user_id
HAVING COUNT(DISTINCT resource_id) > 50 -- Threshold for investigation
ORDER BY total_accesses DESC;

-- 5. Performance monitoring
SELECT
  action,
  COUNT(*) as count,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration
FROM audit.activity_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day'
  AND duration_ms IS NOT NULL
GROUP BY action
ORDER BY avg_duration DESC;
```

---

## Database Schema

### Complete Audit Schema

```sql
CREATE SCHEMA IF NOT EXISTS audit;

-- Tier 3: Activity logs (already defined above)
-- See Pattern 3 for full schema

-- Tier 2: History tables for all sensitive entities
-- Template for generating history tables

CREATE TABLE audit.employees_history (
  -- See Pattern 2 for full schema
);

CREATE TABLE audit.payslips_history (
  history_id BIGSERIAL PRIMARY KEY,

  -- Original payslip data
  id BIGINT NOT NULL,
  employee_id BIGINT,
  payroll_run_id BIGINT,
  basic_salary DECIMAL(15, 2),
  gross_salary DECIMAL(15, 2),
  net_salary DECIMAL(15, 2),
  tax_amount DECIMAL(15, 2),
  ni_amount DECIMAL(15, 2),

  -- History metadata
  history_action VARCHAR(10),
  history_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  history_user_id BIGINT,
  changed_fields JSONB
);

CREATE TABLE audit.monthly_reviews_history (
  history_id BIGSERIAL PRIMARY KEY,

  -- Original review data
  id BIGINT NOT NULL,
  employee_id BIGINT,
  review_month SMALLINT,
  review_year INT,
  overall_rating DECIMAL(3, 2),
  attendance_rating SMALLINT,
  customer_service_rating SMALLINT,

  -- History metadata
  history_action VARCHAR(10),
  history_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  history_user_id BIGINT,
  changed_fields JSONB
);

CREATE TABLE audit.rti_submissions_history (
  -- RTI submissions are critical for HMRC compliance
  history_id BIGSERIAL PRIMARY KEY,

  id BIGINT NOT NULL,
  submission_type VARCHAR(50),
  tax_year VARCHAR(10),
  submission_status VARCHAR(50),
  hmrc_reference VARCHAR(100),

  history_action VARCHAR(10),
  history_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  history_user_id BIGINT,
  changed_fields JSONB
);
```

### Tables Requiring History Tracking (Tier 2)

**Priority 1: Must Have History**
- `core.employees` - Employee master data
- `payroll.payslips` - Payroll records
- `payroll.salary_structures` - Salary changes
- `uk_compliance.paye_settings` - Tax code changes
- `uk_compliance.rti_submissions` - HMRC submissions
- `performance.monthly_reviews` - Performance reviews
- `core.leave_requests` - Leave audit trail
- `uk_compliance.statutory_payments` - SSP, SMP tracking

**Priority 2: Should Have History**
- `core.documents` - Document uploads/deletions
- `core.disciplinary_actions` - Employment tribunal evidence
- `uk_compliance.pension_contributions` - Pension audit
- `retail.till_assignments` - Cash handling accountability
- `time_tracking.attendance` - Attendance disputes
- `core.expense_claims` - Expense approval trail

**Priority 3: Optional History**
- Reference data that changes infrequently
- Low-risk transactional data

---

## Best Practices

### 1. Set Session Context

Always set current user context before database operations:

```typescript
// Node.js/TypeScript example
async function executeWithAudit<T>(
  userId: number,
  ipAddress: string,
  fn: () => Promise<T>
): Promise<T> {
  await db.query('SET LOCAL app.current_user_id = $1', [userId]);
  await db.query('SET LOCAL app.current_ip = $1', [ipAddress]);

  try {
    return await fn();
  } finally {
    // Context cleared automatically at transaction end
  }
}

// Usage
await executeWithAudit(105, '192.168.1.100', async () => {
  await db.query('UPDATE core.employees SET salary = $1 WHERE id = $2', [35000, 105]);
  // Trigger automatically captures current_user_id and current_ip
});
```

### 2. Log Before and After Changes

```typescript
async function auditedUpdate(
  userId: number,
  action: string,
  resourceType: string,
  resourceId: number,
  updateFn: () => Promise<void>
) {
  const startTime = Date.now();
  let status = 'success';
  let errorMessage = null;

  try {
    await updateFn();
  } catch (error) {
    status = 'failure';
    errorMessage = error.message;
    throw error;
  } finally {
    // Log activity regardless of success/failure
    await db.query(`
      INSERT INTO audit.activity_logs (
        organization_id, user_id, action, resource_type, resource_id,
        status, error_message, duration_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      getCurrentOrgId(),
      userId,
      action,
      resourceType,
      resourceId,
      status,
      errorMessage,
      Date.now() - startTime
    ]);
  }
}
```

### 3. Classify PII Fields

```typescript
const PII_FIELDS = {
  employee: ['ni_number', 'salary', 'address', 'phone', 'email', 'dob'],
  payslip: ['gross_salary', 'net_salary', 'tax_amount'],
  leave: ['reason'], // May contain medical information
};

function containsPII(resourceType: string, fields: string[]): boolean {
  const piiFields = PII_FIELDS[resourceType] || [];
  return fields.some(field => piiFields.includes(field));
}
```

### 4. Redact Sensitive Data in Logs

```typescript
function sanitizeForLogging(data: any): any {
  const sensitive = ['password', 'ni_number', 'bank_account'];
  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    if (sensitive.includes(key)) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}
```

### 5. Automated History Table Generation

```sql
-- Function to automatically create history table for any table
CREATE OR REPLACE FUNCTION audit.create_history_table(
  source_schema TEXT,
  source_table TEXT
) RETURNS VOID AS $$
DECLARE
  history_table TEXT := source_table || '_history';
  sql TEXT;
BEGIN
  sql := format('
    CREATE TABLE audit.%I (
      history_id BIGSERIAL PRIMARY KEY,
      history_action VARCHAR(10) NOT NULL,
      history_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      history_user_id BIGINT,
      history_ip_address VARCHAR(50),
      changed_fields JSONB,

      %s
    )',
    history_table,
    (
      SELECT string_agg(
        column_name || ' ' || data_type ||
        CASE WHEN character_maximum_length IS NOT NULL
          THEN '(' || character_maximum_length || ')'
          ELSE ''
        END,
        ', '
      )
      FROM information_schema.columns
      WHERE table_schema = source_schema
        AND table_name = source_table
    )
  );

  EXECUTE sql;
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT audit.create_history_table('core', 'employees');
```

---

## Performance Optimization

### 1. Partitioning Activity Logs

```sql
-- Partition by month
CREATE TABLE audit.activity_logs (
  -- columns...
) PARTITION BY RANGE (timestamp);

-- Create partitions for each month
CREATE TABLE audit.activity_logs_2025_01 PARTITION OF audit.activity_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE audit.activity_logs_2025_02 PARTITION OF audit.activity_logs
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Automated partition creation function
CREATE OR REPLACE FUNCTION audit.create_activity_log_partition(partition_date DATE)
RETURNS VOID AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  start_date := date_trunc('month', partition_date);
  end_date := start_date + INTERVAL '1 month';
  partition_name := 'activity_logs_' || to_char(start_date, 'YYYY_MM');

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS audit.%I
    PARTITION OF audit.activity_logs
    FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly partition creation
-- (via cron job or scheduled task)
```

### 2. Archive Old Audit Data

```sql
-- Create archive schema
CREATE SCHEMA IF NOT EXISTS audit_archive;

-- Move old activity logs to archive
CREATE OR REPLACE FUNCTION audit.archive_old_logs(older_than INTERVAL)
RETURNS TABLE(archived_count BIGINT) AS $$
DECLARE
  cutoff_date TIMESTAMP;
  archive_table TEXT;
BEGIN
  cutoff_date := CURRENT_TIMESTAMP - older_than;
  archive_table := 'activity_logs_archive_' || to_char(cutoff_date, 'YYYY_MM');

  -- Create archive table
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS audit_archive.%I AS
    SELECT * FROM audit.activity_logs
    WHERE timestamp < %L
  ', archive_table, cutoff_date);

  -- Delete from main table
  EXECUTE format('
    DELETE FROM audit.activity_logs
    WHERE timestamp < %L
  ', cutoff_date);

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Archive logs older than 1 year
SELECT audit.archive_old_logs(INTERVAL '1 year');
```

### 3. Indexes for Common Queries

```sql
-- Most common query patterns
CREATE INDEX idx_activity_user_time ON audit.activity_logs(user_id, timestamp DESC);
CREATE INDEX idx_activity_resource ON audit.activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_pii_time ON audit.activity_logs(timestamp DESC)
  WHERE contains_pii = true;

-- History table indexes
CREATE INDEX idx_history_id_time ON audit.employees_history(id, history_timestamp DESC);
CREATE INDEX idx_history_user ON audit.employees_history(history_user_id);

-- Partial indexes for specific queries
CREATE INDEX idx_activity_failed_logins ON audit.activity_logs(timestamp DESC, user_email)
  WHERE action = 'user_login' AND status = 'failure';
```

### 4. Async Logging for Activity Logs

```typescript
// Use a queue to avoid blocking main operations
import { Queue } from 'bull';

const auditQueue = new Queue('audit-logs', {
  redis: { host: 'localhost', port: 6379 }
});

async function logActivity(logEntry: ActivityLog) {
  // Queue for async processing
  await auditQueue.add('log', logEntry, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
}

// Worker to process audit logs
auditQueue.process('log', async (job) => {
  const logEntry = job.data;
  await db.query(`
    INSERT INTO audit.activity_logs (...)
    VALUES (...)
  `, Object.values(logEntry));
});
```

---

## Retention & Compliance

### Retention Policy

```sql
CREATE TABLE audit.retention_policies (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  retention_years INT NOT NULL,
  archive_after_years INT, -- Move to archive before deletion
  reason TEXT,
  compliance_reference VARCHAR(255) -- e.g., "GDPR Article 5", "HMRC Retention"
);

-- Default policies
INSERT INTO audit.retention_policies (table_name, retention_years, archive_after_years, reason) VALUES
  ('audit.activity_logs', 6, 1, 'GDPR Article 30 - Records of processing activities'),
  ('audit.employees_history', 6, NULL, 'Employment Rights Act 1996'),
  ('audit.payslips_history', 6, NULL, 'HMRC payroll records retention'),
  ('audit.rti_submissions_history', 6, NULL, 'HMRC RTI retention requirement'),
  ('audit.monthly_reviews_history', 6, NULL, 'Employment tribunal evidence');
```

### Automated Cleanup Job

```sql
CREATE OR REPLACE FUNCTION audit.cleanup_expired_logs()
RETURNS TABLE(table_name TEXT, deleted_count BIGINT) AS $$
DECLARE
  policy RECORD;
  cutoff_date TIMESTAMP;
  deleted BIGINT;
BEGIN
  FOR policy IN SELECT * FROM audit.retention_policies LOOP
    cutoff_date := CURRENT_TIMESTAMP - (policy.retention_years || ' years')::INTERVAL;

    EXECUTE format('
      DELETE FROM %I
      WHERE history_timestamp < %L
    ', policy.table_name, cutoff_date);

    GET DIAGNOSTICS deleted = ROW_COUNT;

    table_name := policy.table_name;
    deleted_count := deleted;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly cleanup (via cron)
SELECT * FROM audit.cleanup_expired_logs();
```

---

## Implementation Examples

### Example 1: Track Salary Changes

```typescript
async function updateEmployeeSalary(
  employeeId: number,
  newSalary: number,
  reason: string,
  updatedBy: number
) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Set audit context
    await client.query('SET LOCAL app.current_user_id = $1', [updatedBy]);
    await client.query('SET LOCAL app.current_ip = $1', [getCurrentIP()]);

    // Get old salary for logging
    const { rows } = await client.query(
      'SELECT salary FROM core.employees WHERE id = $1',
      [employeeId]
    );
    const oldSalary = rows[0]?.salary;

    // Update salary
    await client.query(
      'UPDATE core.employees SET salary = $1, updated_by = $2 WHERE id = $3',
      [newSalary, updatedBy, employeeId]
    );
    // Database trigger automatically logs to employees_history

    // Log activity
    await client.query(`
      INSERT INTO audit.activity_logs (
        organization_id, user_id, action, resource_type, resource_id,
        contains_pii, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      getCurrentOrgId(),
      updatedBy,
      'update_salary',
      'employee',
      employeeId,
      true,
      JSON.stringify({ old_salary: oldSalary, new_salary: newSalary, reason })
    ]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Example 2: GDPR Subject Access Request

```typescript
async function generateSubjectAccessReport(employeeId: number) {
  // 1. Get all personal data
  const personalData = await db.query(`
    SELECT * FROM core.employees WHERE id = $1
  `, [employeeId]);

  // 2. Get all data changes
  const changeHistory = await db.query(`
    SELECT
      history_timestamp,
      history_action,
      changed_fields,
      e.first_name || ' ' || e.last_name as changed_by
    FROM audit.employees_history h
    LEFT JOIN core.employees e ON h.history_user_id = e.id
    WHERE h.id = $1
    ORDER BY history_timestamp DESC
  `, [employeeId]);

  // 3. Get all access logs
  const accessLogs = await db.query(`
    SELECT
      al.timestamp,
      e.first_name || ' ' || e.last_name as accessed_by,
      al.action,
      al.pii_fields,
      al.ip_address
    FROM audit.activity_logs al
    LEFT JOIN core.employees e ON al.user_id = e.id
    WHERE al.resource_type = 'employee'
      AND al.resource_id = $1
      AND al.timestamp >= CURRENT_DATE - INTERVAL '6 months'
    ORDER BY al.timestamp DESC
  `, [employeeId]);

  // 4. Generate report
  return {
    personal_data: personalData.rows[0],
    change_history: changeHistory.rows,
    access_log: accessLogs.rows,
    generated_at: new Date(),
    retention_period: '6 years from employment end'
  };
}
```

### Example 3: Security Monitoring

```typescript
// Detect suspicious activity
async function detectSuspiciousActivity() {
  // Failed login attempts
  const failedLogins = await db.query(`
    SELECT
      user_email,
      COUNT(*) as attempts,
      array_agg(DISTINCT ip_address) as ips
    FROM audit.activity_logs
    WHERE action = 'user_login'
      AND status = 'failure'
      AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
    GROUP BY user_email
    HAVING COUNT(*) >= 5
  `);

  // Unusual PII access
  const unusualAccess = await db.query(`
    SELECT
      user_id,
      COUNT(DISTINCT resource_id) as employee_count,
      COUNT(*) as total_accesses
    FROM audit.activity_logs
    WHERE contains_pii = true
      AND timestamp >= CURRENT_DATE
    GROUP BY user_id
    HAVING COUNT(DISTINCT resource_id) > 50
  `);

  // Send alerts if suspicious activity detected
  if (failedLogins.rows.length > 0) {
    await sendSecurityAlert('Multiple failed login attempts', failedLogins.rows);
  }

  if (unusualAccess.rows.length > 0) {
    await sendSecurityAlert('Unusual PII access pattern', unusualAccess.rows);
  }
}
```

---

## Conclusion

### Summary of Audit Strategy

✅ **3-Tier Approach**:
1. Column-level audit for all tables (lightweight)
2. Row-level history for sensitive data (complete trail)
3. Activity logging for compliance and security (system-wide)

✅ **Compliance Coverage**:
- GDPR/DPA 2018: Subject access requests, processing records
- Employment Law: 6-year retention of employment records
- HMRC: Payroll audit trail, RTI submissions
- ISO 27001: Security event logging

✅ **Performance Optimized**:
- Partitioned activity logs by month
- Targeted indexes for common queries
- Async logging to avoid blocking operations
- Automated archival and cleanup

✅ **Retail-Specific**:
- Till reconciliation audit trail
- Break compliance tracking
- Food safety certification changes
- Monthly review history

### Next Steps

1. **Implement Tier 1** (Column-level audit) across all existing tables
2. **Add Tier 2** (History tables) for high-priority tables (employees, payroll, reviews)
3. **Deploy Tier 3** (Activity logging) with async queue processing
4. **Set up retention policies** and automated cleanup jobs
5. **Create GDPR tools** for subject access requests and right to erasure
6. **Configure monitoring** for security alerts and suspicious activity

---

**Document Version:** 1.0
**Author:** Claude (Anthropic)
**Date:** January 2025
**Target Market:** UK Supermarket & Retail Sector
**Status:** Implementation Ready
