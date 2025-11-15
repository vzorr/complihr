# CompliHR Database Setup Guide

This guide will walk you through setting up the PostgreSQL database for CompliHR.

## Prerequisites

- PostgreSQL 14+ installed and running
- Node.js 18+ installed
- Access to PostgreSQL with superuser privileges

## Step 1: Install PostgreSQL (if not already installed)

### Windows
Download and install from: https://www.postgresql.org/download/windows/

### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 2: Create Database and User

### Option A: Using psql Command Line

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create the database
CREATE DATABASE complihr;

# Connect to the database
\c complihr

# Run the schema setup script
\i database-setup.sql

# Verify schemas were created
SELECT schema_name FROM information_schema.schemata
WHERE schema_name IN ('admin', 'core', 'leave', 'time_tracking', 'payroll', 'expenses', 'compliance', 'performance', 'documents');

# Exit psql
\q
```

### Option B: Using pgAdmin

1. Open pgAdmin
2. Right-click on "Databases" → Create → Database
3. Name: `complihr`
4. Click "Save"
5. Right-click on `complihr` → Query Tool
6. Open and execute `database-setup.sql`

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update database credentials in `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your-postgres-password
   DB_DATABASE=complihr
   DB_SYNCHRONIZE=false
   DB_LOGGING=true
   ```

3. Update JWT secret:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Run Migrations

This will create all the tables in the database:

```bash
npm run migration:run
```

Expected output:
```
query: SELECT * FROM "information_schema"."tables" WHERE "table_schema" = ...
query: CREATE TABLE "admin"."users" ...
query: CREATE TABLE "core"."employees" ...
...
Migration CreateSchemas has been executed successfully.
Migration CreateAdminTables has been executed successfully.
Migration CreateCoreTables has been executed successfully.
...
```

## Step 6: Seed Initial Data

This will populate the database with:
- Default permissions (60+ permissions)
- Default roles (admin, hr, manager, employee)
- Admin user (admin@complihr.com / Admin@123)
- Organization settings
- Leave types (7 types)
- Expense categories (8 categories)
- Sample departments (5 departments)
- Sample designations (10 designations)

```bash
npm run seed
```

Expected output:
```
🌱 Starting database seeding...
📝 Seeding permissions...
   ✓ Seeded 60 permissions
👥 Seeding roles...
   ✓ Seeded 4 roles
👤 Seeding admin user...
   ✓ Created admin user (admin@complihr.com / Admin@123)
⚙️  Seeding organization settings...
   ✓ Created organization settings
🏖️  Seeding leave types...
   ✓ Seeded 7 leave types
💰 Seeding expense categories...
   ✓ Seeded 8 expense categories
🏢 Seeding departments...
   ✓ Seeded 5 departments
📋 Seeding designations...
   ✓ Seeded 10 designations
✅ Database seeding complete!
```

## Step 7: Verify Database Setup

### Check database connection:
```bash
# Windows
psql -U postgres -d complihr -c "\dt admin.*"

# Linux/Mac
psql -U postgres -d complihr -c "\\dt admin.*"
```

### Check if tables were created:
```sql
-- Connect to database
psql -U postgres -d complihr

-- List all tables in admin schema
\dt admin.*

-- List all tables in core schema
\dt core.*

-- Count records in key tables
SELECT 'Permissions' as table_name, COUNT(*) as count FROM admin.permissions
UNION ALL
SELECT 'Roles', COUNT(*) FROM admin.roles
UNION ALL
SELECT 'Users', COUNT(*) FROM admin.users
UNION ALL
SELECT 'Leave Types', COUNT(*) FROM leave.leave_types
UNION ALL
SELECT 'Expense Categories', COUNT(*) FROM expenses.expense_categories;
```

Expected output:
```
     table_name      | count
--------------------+-------
 Permissions        |    60
 Roles              |     4
 Users              |     1
 Leave Types        |     7
 Expense Categories |     8
```

## Step 8: Test the Application

Start the development server:
```bash
npm run start:dev
```

The API should be running at: `http://localhost:3010`

Test authentication:
```bash
curl -X POST http://localhost:3010/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@complihr.com",
    "password": "Admin@123"
  }'
```

You should receive a JWT token in the response.

## Default Admin Credentials

⚠️ **IMPORTANT: Change these credentials immediately after first login!**

```
Email: admin@complihr.com
Password: Admin@123
```

## Troubleshooting

### Connection Refused Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL is running:
```bash
# Windows
net start postgresql-x64-14

# Linux/Mac
sudo systemctl start postgresql
# or
brew services start postgresql@14
```

### Authentication Failed
```
Error: password authentication failed for user "postgres"
```
**Solution**:
1. Check your password in `.env`
2. Reset PostgreSQL password if needed:
   ```bash
   psql -U postgres
   ALTER USER postgres WITH PASSWORD 'newpassword';
   ```

### Database Does Not Exist
```
Error: database "complihr" does not exist
```
**Solution**: Create the database manually:
```bash
psql -U postgres -c "CREATE DATABASE complihr;"
```

### Migration Already Executed
```
Error: migration ... has already been executed
```
**Solution**: This is normal if you've already run migrations. Skip this error or revert:
```bash
npm run migration:revert
```

### Schema Already Exists
```
Error: schema "admin" already exists
```
**Solution**: This is expected if running setup multiple times. You can safely ignore this.

## Database Management Commands

```bash
# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Drop all tables and re-run migrations + seed
npm run db:reset

# Just run seed data (without dropping)
npm run seed

# Generate new migration
npm run migration:generate -- -n MigrationName
```

## Database Backup & Restore

### Backup
```bash
pg_dump -U postgres -d complihr -F c -b -v -f complihr_backup.dump
```

### Restore
```bash
pg_restore -U postgres -d complihr -v complihr_backup.dump
```

## Next Steps

After database setup is complete:

1. ✅ Change admin password
2. ✅ Create additional users (HR, managers, employees)
3. ✅ Configure organization settings
4. ✅ Customize leave types for your organization
5. ✅ Set up expense categories
6. ✅ Create departments and designations
7. ✅ Start adding employees

## Database Schema Overview

The database is organized into 9 schemas:

1. **admin** - Users, roles, permissions, org settings, audit logs
2. **core** - Employees, departments, designations
3. **leave** - Leave requests, leave types
4. **time_tracking** - Attendance records, clock events, shifts
5. **payroll** - Payslips, tax calculations
6. **expenses** - Expense claims, expense categories
7. **compliance** - Certifications, training records
8. **performance** - Performance reviews, monthly assessments
9. **documents** - Document management

Total Tables: **22 tables**

## Support

If you encounter any issues:
1. Check the logs in the terminal
2. Verify PostgreSQL is running
3. Check `.env` configuration
4. Review this troubleshooting guide

For additional help, consult the main README.md or raise an issue.
