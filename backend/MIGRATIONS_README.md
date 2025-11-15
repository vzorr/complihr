# Database Migrations

## Migration Files

All migrations are located in `src/migrations/` and are executed in chronological order:

### 1. **1704067200000-CreateSchemas.ts**
Creates all 9 database schemas:
- `admin` - Users, roles, permissions, organizations
- `core` - Employees, departments, designations
- `time_tracking` - Attendance, shifts, overtime
- `leave` - Leave types, requests, balances
- `payroll` - Payslips, pay periods, deductions
- `expenses` - Expense claims, categories
- `compliance` - Policies, acknowledgements, documents
- `performance` - Appraisals, goals, reviews
- `documents` - Document templates, employee documents

### 2. **1704067201000-CreateAdminTables.ts**
Creates admin schema tables:
- `users` - System users
- `roles` - User roles
- `permissions` - Granular permissions
- `role_permissions` - Many-to-many mapping
- `user_roles` - Many-to-many mapping
- `organizations` - Multi-tenant organizations

### 3. **1704067202000-CreateCoreTables.ts**
Creates core HR tables:
- `employees` - Employee master data
- `departments` - Organization departments
- `designations` - Job positions/titles
- `employee_managers` - Manager hierarchy
- `employment_history` - Job changes

### 4. **1704067203000-CreateTimeTrackingTables.ts**
Creates time tracking tables:
- `attendance_records` - Clock in/out records
- `shifts` - Shift schedules
- `shift_assignments` - Employee shift assignments
- `shift_swap_requests` - Shift exchange requests
- `overtime_records` - Overtime tracking

### 5. **1704067204000-CreateLeaveTables.ts**
Creates leave management tables:
- `leave_types` - Leave categories (Annual, Sick, etc.)
- `leave_balances` - Employee leave entitlements
- `leave_requests` - Leave applications
- `leave_approval_workflow` - Approval chain

### 6. **1704067205000-CreatePayrollTables.ts**
Creates payroll tables:
- `pay_periods` - Payroll cycles
- `payslips` - Employee payslips
- `payslip_components` - Salary components
- `deductions` - Statutory/voluntary deductions
- `bonuses` - Performance/incentive bonuses

### 7. **1704067206000-CreateUKComplianceTables.ts**
Creates UK compliance tables:
- `ni_categories` - National Insurance categories
- `tax_codes` - PAYE tax codes
- `pension_schemes` - Auto-enrollment pensions
- `statutory_payments` - SSP, SMP, SPP, etc.
- `p60_records` - Annual tax summaries
- `p45_records` - Employee leaving records

### 8. **1704067207000-CreateRetailTables.ts**
Creates retail-specific tables:
- `store_locations` - Retail branches
- `store_employee_assignments` - Staff assignments
- `pos_sessions` - Point of sale tracking
- `commission_rules` - Sales commissions

### 9. **1704067208000-CreatePerformanceExpensesComplianceAuditTables.ts**
Creates remaining tables:
- Performance: `appraisal_cycles`, `appraisals`, `appraisal_goals`
- Expenses: `expense_categories`, `expense_claims`, `expense_items`
- Compliance: `policies`, `policy_acknowledgements`, `training_programs`
- Documents: `document_templates`, `employee_documents`

### 10. **1704067209000-AddPublicIdsAndOrgSettings.ts** (UPDATED)
Adds public UUIDs and organization settings:
- **Public IDs**: Adds `public_id` UUID columns to all main tables for external API references
- **Organization Settings**: Creates settings table for ID pattern configuration
- **ID Sequences**: Creates sequence management system for human-readable IDs
- **ID Generator Function**: PL/pgSQL function for atomic sequence generation

**Tables with public_id:**
- admin: users, roles, organizations, permissions
- core: employees, departments, designations
- payroll: payslips, pay_periods
- leave: leave_requests, leave_types
- time_tracking: shifts, attendance_records
- expenses: expense_claims, expense_categories

### 11. **1763184623270-CreateAuditLogsTable.ts**
Creates audit logging table:
- `audit_logs` - System-wide audit trail

## Database Commands

```bash
# Run all pending migrations
npm run db:migrate

# Revert last migration
npm run db:migrate:revert

# Generate new migration from entity changes
npm run db:migrate:generate -- MigrationName

# Seed database with initial data
npm run db:seed

# Verify database setup
npm run db:verify

# Complete setup (migrate + seed)
npm run db:setup

# Reset database (drop + migrate + seed) - DESTRUCTIVE
npm run db:reset

# Drop all database schemas (DESTRUCTIVE)
npm run schema:drop

# Sync schema (NOT recommended for production)
npm run schema:sync
```

## Database Setup Process

### First Time Setup

```bash
# 1. Ensure PostgreSQL is running and .env is configured
# 2. Create the database (if not exists)
createdb complihr_db

# 3. Run complete setup (migrations + seed)
npm run db:setup

# 4. Verify setup
npm run db:verify
```

### Reset Database (Development Only)

```bash
# Complete reset - drops all data and recreates
npm run db:reset
```

## Seed Data

The seed script (`npm run db:seed`) populates:
- **52 permissions** across all modules
- **4 roles** (admin, hr, manager, employee) with assigned permissions
- **Default admin user**: admin@complihr.com / Admin@123
- **7 UK leave types** (Annual, Sick, Maternity, Paternity, etc.)
- **8 expense categories**
- **Sample departments and designations**
- **Organization settings** with ID pattern configurations

Run `npm run db:verify` to check all seed data was created correctly.

## Migration Best Practices

1. **Never modify existing migrations** - Always create new migrations for changes
2. **Test migrations** - Test both `up()` and `down()` methods
3. **Use transactions** - TypeORM wraps migrations in transactions by default
4. **Idempotent operations** - Use `IF NOT EXISTS` / `IF EXISTS` where possible
5. **Data migrations** - Separate schema changes from data migrations
6. **Backup before migration** - Always backup production data before running migrations

## Troubleshooting

### Migration Already Run
If a migration shows as already executed but failed partially:
```sql
-- Check migration status
SELECT * FROM migrations;

-- Manually remove failed migration (BE CAREFUL)
DELETE FROM migrations WHERE name = 'MigrationName';
```

### Reset Migrations (Development Only)
```bash
# Drop all tables and re-run
npm run schema:drop
npm run migration:run
npm run seed
```

### Check Database State
```bash
# Verify schemas and seed data
npm run db:verify

# Connect to psql
psql complihr_db

# List all schemas
\dn

# List tables in a schema
\dt admin.*
```

## Notes

- All migrations use **IF NOT EXISTS** / **IF EXISTS** for idempotency
- The `organization_id` in settings tables is nullable for single-org deployments
- Public IDs (UUIDs) are used for external API references
- Internal IDs (BigInt) are used for foreign keys and joins
- Indexes are created on frequently queried columns
- Soft deletes use `deleted_at` column (where applicable)
