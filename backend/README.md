# CompliHR Backend - UK Retail HRMS

NestJS-based backend API for CompliHR, a comprehensive HR Management System for the UK retail market.

## Tech Stack

- **Framework**: NestJS 10+
- **Language**: TypeScript 5+
- **Database**: PostgreSQL 14+
- **ORM**: TypeORM 0.3+
- **Authentication**: JWT
- **Validation**: class-validator

## Database Architecture

### 10 Schemas (65+ Tables)

1. **core** - Employee core data (departments, employees, designations)
2. **payroll** - Payroll processing (salary structures, payslips)
3. **time_tracking** - Time and attendance (shifts, clock events, schedules)
4. **leave** - Leave management (leave types, requests, balances)
5. **uk_compliance** - UK-specific compliance (PAYE, NI, RTI, pensions)
6. **retail** - Retail operations (tills, breaks, food safety)
7. **performance** - Performance management (monthly reviews, KPIs)
8. **expenses** - Expense claims and management
9. **compliance** - General compliance (certifications, training)
10. **admin** - System administration (users, roles, notifications)
11. **audit** - Audit logging (activity logs, history tables)

## Getting Started

### Prerequisites

- Node.js 20 LTS
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
```

### Database Setup

```bash
# Create PostgreSQL database
createdb complihr

# Run migrations to create all schemas and tables
npm run migration:run
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start
```

The API will be available at `http://localhost:3000/api`

## Database Migrations

### Run Migrations

```bash
npm run migration:run
```

### Revert Last Migration

```bash
npm run migration:revert
```

### Generate New Migration

```bash
npm run migration:generate -- src/migrations/MigrationName
```

## Migration Files

All migration files are located in `src/migrations/`:

1. `1704067200000-CreateSchemas.ts` - Creates all 11 schemas
2. `1704067201000-CreateAdminTables.ts` - Admin schema tables
3. `1704067202000-CreateCoreTables.ts` - Core employee tables
4. `1704067203000-CreateTimeTrackingTables.ts` - Time tracking tables
5. `1704067204000-CreateLeaveTables.ts` - Leave management tables
6. `1704067205000-CreatePayrollTables.ts` - Payroll processing tables
7. `1704067206000-CreateUKComplianceTables.ts` - UK compliance tables (PAYE, NI, RTI)
8. `1704067207000-CreateRetailTables.ts` - Retail-specific tables
9. `1704067208000-CreatePerformanceExpensesComplianceAuditTables.ts` - Remaining tables

## UK Compliance Features

### PAYE (Pay As You Earn)
- Tax code management
- Tax band configuration
- Progressive tax calculation
- Week 1/Month 1 basis

### National Insurance
- All NI categories (A-M)
- Employee and employer NI
- Thresholds (PT, UEL, ST)

### RTI (Real Time Information)
- FPS (Full Payment Submission)
- EPS (Employer Payment Summary)
- HMRC Gateway integration

### Statutory Payments
- SSP (Statutory Sick Pay)
- SMP (Statutory Maternity Pay)
- SPP (Statutory Paternity Pay)

### Pensions
- Auto-enrolment eligibility
- Pension contributions
- Opt-outs and re-enrolment (3-year cycle)

### Year-End Reporting
- P60 generation
- P45 generation (leavers)

### Other Compliance
- Student loan deductions (Plans 1, 2, 4, Postgrad)
- Minimum/Living Wage tracking
- Working Time Directive (48-hour week)
- Holiday pay (12.07% for casual workers)
- Right to Work checks
- Visa expiry tracking

## Retail-Specific Features

### Till Management
- Till configuration
- Daily till assignments
- Float reconciliation
- Variance tracking

### Break Compliance
- UK 6+ hour rule monitoring
- Break tracking
- Compliance alerts
- SMS notifications to managers

### Food Safety
- Certificate management
- Expiry tracking
- Training records
- Renewal alerts

### Age-Restricted Products
- Challenge 25 authorization
- Product permissions (alcohol, tobacco, etc.)

### Performance Management
- Monthly reviews for retail staff
- Retail KPIs:
  - Till accuracy
  - Items per minute
  - Customer service ratings
  - Attendance ratings

### Labour Management
- Labour cost forecasting
- Department budgets
- POS integration (productivity tracking)

## Audit & Compliance

### 3-Tier Audit Strategy

**Tier 1: Standard Audit Columns** (All tables)
- created_at
- updated_at
- created_by
- updated_by
- deleted_at (soft delete)

**Tier 2: Row-Level History** (Sensitive tables)
- Full row snapshots
- Change tracking
- Before/after values

**Tier 3: Activity Logs** (All user actions)
- Login/logout
- CRUD operations
- PII access tracking
- IP and device tracking

### GDPR Compliance
- 6-year retention for payroll records
- PII field tracking
- Right to erasure support
- Data export capabilities

## API Structure (Future)

```
/api
  /auth
    POST /login
    POST /register
    POST /logout
    POST /refresh
  /employees
    GET /employees
    POST /employees
    GET /employees/:id
    PUT /employees/:id
    DELETE /employees/:id
  /payroll
    POST /payroll/run
    GET /payroll/payslips
    GET /payroll/payslips/:id
    POST /payroll/rti/fps
    POST /payroll/rti/eps
  /time-tracking
    POST /clock-in
    POST /clock-out
    GET /attendance
  /leave
    GET /leave/balance
    POST /leave/request
    GET /leave/requests
  /retail
    GET /tills
    POST /till-assignments
    GET /break-compliance
  /performance
    GET /reviews
    POST /monthly-review
```

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=complihr

# Application
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# HMRC Gateway
HMRC_GATEWAY_URL=https://api.service.hmrc.gov.uk
HMRC_VENDOR_ID=your-vendor-id

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASSWORD=your-api-key

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=complihr-documents
```

## Development Roadmap

### Phase 1 (0-9 months) - CURRENT
- ✅ Database schema design
- ✅ Migration files
- 🔄 Core modules (employee, auth, payroll)
- 🔄 UK compliance features (PAYE, NI, RTI)
- 🔄 Retail features (tills, breaks)
- 🔄 Mobile API endpoints

### Phase 2 (9-15 months)
- Labour forecasting
- POS integration
- Advanced scheduling
- Rust payroll engine (optional)

### Phase 3 (15-24 months)
- Right to Work verification
- Employee self-service portal
- Advanced analytics
- Reporting engine

## License

MIT License - CompliHR 2025

## Support

For issues and feature requests, please contact the development team.
