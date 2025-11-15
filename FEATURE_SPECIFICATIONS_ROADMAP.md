# CompliHR - Detailed Feature Specifications & Implementation Roadmap

> **Comprehensive specifications for all recommended features with user stories, requirements, and implementation details**
>
> Version: 1.0 | Date: January 2025

---

## Table of Contents

1. [Phase 1: Foundation (Months 1-3)](#phase-1-foundation-months-1-3)
2. [Phase 2: Performance & Talent (Months 4-6)](#phase-2-performance--talent-months-4-6)
3. [Phase 3: Payroll & Benefits (Months 7-9)](#phase-3-payroll--benefits-months-7-9)
4. [Phase 4: Analytics & Mobile (Months 10-12)](#phase-4-analytics--mobile-months-10-12)
5. [Phase 5: Engagement & Advanced (Months 13-18)](#phase-5-engagement--advanced-months-13-18)
6. [Technical Architecture](#technical-architecture)
7. [Implementation Guidelines](#implementation-guidelines)

---

## Phase 1: Foundation (Months 1-3)

**Goal:** Build the technical foundation and essential enterprise features

**Estimated Effort:** 3 months, 3-4 developers

---

## 1.1 API & Webhooks System

### Overview
Build a comprehensive RESTful API with webhook support to enable integrations with third-party systems (accounting, payroll providers, HRIS, etc.).

### What to Include:

#### A. REST API Endpoints

**Authentication & Authorization**
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/change-password
GET    /api/v1/auth/me
```

**Employees**
```
GET    /api/v1/employees
POST   /api/v1/employees
GET    /api/v1/employees/:id
PUT    /api/v1/employees/:id
PATCH  /api/v1/employees/:id
DELETE /api/v1/employees/:id
GET    /api/v1/employees/:id/attendance
GET    /api/v1/employees/:id/leave-balance
GET    /api/v1/employees/:id/payslips
POST   /api/v1/employees/:id/documents
GET    /api/v1/employees/:id/performance
GET    /api/v1/employees/:id/benefits
POST   /api/v1/employees/bulk-import
POST   /api/v1/employees/bulk-update
```

**Departments**
```
GET    /api/v1/departments
POST   /api/v1/departments
GET    /api/v1/departments/:id
PUT    /api/v1/departments/:id
DELETE /api/v1/departments/:id
GET    /api/v1/departments/:id/employees
GET    /api/v1/departments/:id/headcount
```

**Attendance**
```
GET    /api/v1/attendance
POST   /api/v1/attendance
GET    /api/v1/attendance/:id
PUT    /api/v1/attendance/:id
POST   /api/v1/attendance/punch-in
POST   /api/v1/attendance/punch-out
POST   /api/v1/attendance/break-start
POST   /api/v1/attendance/break-end
GET    /api/v1/attendance/summary?employee_id=123&month=1&year=2025
GET    /api/v1/attendance/team?manager_id=456&date=2025-01-15
```

**Leave**
```
GET    /api/v1/leave/requests
POST   /api/v1/leave/requests
GET    /api/v1/leave/requests/:id
PUT    /api/v1/leave/requests/:id
DELETE /api/v1/leave/requests/:id
POST   /api/v1/leave/requests/:id/approve
POST   /api/v1/leave/requests/:id/reject
POST   /api/v1/leave/requests/:id/cancel
GET    /api/v1/leave/balance/:employee_id
GET    /api/v1/leave/types
GET    /api/v1/leave/calendar?start_date=2025-01-01&end_date=2025-12-31
```

**Payroll**
```
GET    /api/v1/payroll/runs
POST   /api/v1/payroll/runs
GET    /api/v1/payroll/runs/:id
PUT    /api/v1/payroll/runs/:id
POST   /api/v1/payroll/runs/:id/process
POST   /api/v1/payroll/runs/:id/finalize
GET    /api/v1/payroll/payslips
GET    /api/v1/payroll/payslips/:id
POST   /api/v1/payroll/payslips/:id/send-email
```

**Expenses**
```
GET    /api/v1/expenses
POST   /api/v1/expenses
GET    /api/v1/expenses/:id
PUT    /api/v1/expenses/:id
DELETE /api/v1/expenses/:id
POST   /api/v1/expenses/:id/approve
POST   /api/v1/expenses/:id/reject
POST   /api/v1/expenses/:id/upload-receipt
```

**Time Tracking**
```
GET    /api/v1/timesheets
POST   /api/v1/timesheets
GET    /api/v1/timesheets/:id
PUT    /api/v1/timesheets/:id
POST   /api/v1/timesheets/:id/submit
POST   /api/v1/timesheets/:id/approve
POST   /api/v1/timesheets/:id/reject
GET    /api/v1/time-entries
POST   /api/v1/time-entries
```

**Recruitment**
```
GET    /api/v1/jobs
POST   /api/v1/jobs
GET    /api/v1/jobs/:id/applicants
POST   /api/v1/jobs/:id/apply
POST   /api/v1/applicants/:id/schedule-interview
POST   /api/v1/applicants/:id/send-offer
```

**Reports**
```
GET    /api/v1/reports/attendance?type=monthly&month=1&year=2025
GET    /api/v1/reports/payroll?period=2025-01
GET    /api/v1/reports/expenses?start_date=2025-01-01&end_date=2025-12-31
GET    /api/v1/reports/headcount
GET    /api/v1/reports/turnover
POST   /api/v1/reports/custom
```

#### B. Webhook System

**Webhook Events to Support:**
```javascript
// Employee Events
employee.created
employee.updated
employee.terminated
employee.hired

// Attendance Events
attendance.checked_in
attendance.checked_out
attendance.late_arrival
attendance.missing_punch

// Leave Events
leave.requested
leave.approved
leave.rejected
leave.cancelled

// Payroll Events
payroll.run_started
payroll.run_completed
payroll.run_failed
payslip.generated
payslip.sent

// Expense Events
expense.submitted
expense.approved
expense.rejected
expense.reimbursed

// Performance Events
goal.created
goal.completed
review.submitted
review.completed
```

**Webhook Configuration Table:**
```sql
CREATE TABLE admin.webhooks (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES core.organizations(id),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- Array of event types to subscribe to
  secret VARCHAR(255), -- For signature validation
  is_active BOOLEAN DEFAULT true,
  retry_count INT DEFAULT 3,
  timeout_seconds INT DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin.webhook_deliveries (
  id BIGSERIAL PRIMARY KEY,
  webhook_id BIGINT REFERENCES admin.webhooks(id),
  event_type VARCHAR(100),
  payload JSONB,
  status VARCHAR(50), -- pending, delivered, failed
  response_code INT,
  response_body TEXT,
  attempt_count INT DEFAULT 0,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Webhook Payload Example:**
```json
{
  "event": "leave.approved",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "leave_request_id": 12345,
    "employee_id": 456,
    "employee_name": "John Doe",
    "leave_type": "Annual Leave",
    "start_date": "2025-02-01",
    "end_date": "2025-02-05",
    "total_days": 5,
    "approved_by": 789,
    "approved_at": "2025-01-15T10:30:00Z"
  }
}
```

#### C. API Documentation

**Tools to Use:**
- Swagger/OpenAPI 3.0 specification
- Interactive API documentation (Swagger UI)
- Postman collection export
- SDK generation (JavaScript, Python, PHP)

**Documentation Must Include:**
- Authentication guide (JWT tokens, API keys)
- Rate limiting information
- Error codes and handling
- Pagination standards
- Filtering and sorting
- Field selection (sparse fieldsets)
- Webhooks setup guide
- Code examples in multiple languages

#### D. API Security

**Requirements:**
```javascript
// 1. Authentication
- JWT tokens (15-min access token, 7-day refresh token)
- API keys for server-to-server
- OAuth 2.0 for third-party apps

// 2. Authorization
- Role-based access control (RBAC)
- Scope-based permissions (read:employees, write:payroll)
- Data scoping (own, department, all)

// 3. Rate Limiting
- 100 requests/minute per user
- 1000 requests/hour per organization
- Burst allowance: 20 requests/second

// 4. Input Validation
- Request body validation (JSON Schema)
- Query parameter sanitization
- File upload validation

// 5. Encryption
- HTTPS only (TLS 1.3)
- Sensitive data encryption at rest
- API key hashing (bcrypt)
```

#### E. API Response Standards

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "abc123"
  }
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 1000,
    "page": 1,
    "per_page": 25,
    "total_pages": 40,
    "has_next": true,
    "has_prev": false
  },
  "links": {
    "first": "/api/v1/employees?page=1",
    "last": "/api/v1/employees?page=40",
    "next": "/api/v1/employees?page=2",
    "prev": null
  }
}
```

---

## 1.2 Employee Self-Service Portal

### Overview
Empower employees to manage their own HR data, view information, and submit requests without HR intervention.

### What to Include:

#### A. Dashboard Features

**Personal Dashboard:**
```
┌──────────────────────────────────────────────────────┐
│  Welcome back, John!                                 │
├──────────────────────────────────────────────────────┤
│  Quick Actions:                                      │
│  [Request Time Off] [Submit Expense] [View Payslip] │
│                                                       │
│  Leave Balance:                                      │
│  Annual: 15 days | Sick: 8 days | Casual: 3 days   │
│                                                       │
│  Upcoming Time Off:                                  │
│  Feb 1-5: Annual Leave (Approved)                   │
│                                                       │
│  Pending Approvals:                                  │
│  - Expense Claim #123 - $245.50 (Submitted)        │
│  - Timesheet Week 2 (Pending Manager Review)       │
│                                                       │
│  Recent Payslips:                                    │
│  Jan 2025 - $5,500.00 [Download]                    │
│  Dec 2024 - $5,500.00 [Download]                    │
│                                                       │
│  Announcements:                                      │
│  📢 Open Enrollment starts Feb 1st                   │
│  🎉 Company Holiday: Jan 20th (MLK Day)            │
└──────────────────────────────────────────────────────┘
```

#### B. Profile Management

**My Profile Section:**
- View and edit personal information
  - Contact details (email, phone, address)
  - Emergency contacts
  - Personal details (non-employment)
- Profile photo upload
- Social links (LinkedIn, Twitter)
- Bio/About me

**Employment Information (View Only):**
- Employee ID
- Job title
- Department
- Manager
- Joining date
- Work location
- Employment type

**Documents:**
- View uploaded documents
- Upload new documents (certificates, licenses)
- Download pay stubs, tax forms, offer letters
- Request HR documents

#### C. Time Off Management

**Request Time Off:**
- Select leave type (Annual, Sick, etc.)
- Date range picker with calendar
- Half-day options
- Reason/notes
- Attachment upload (medical certificates)
- View available balance before submitting
- See team calendar (who's out)

**My Time Off:**
- View all requests (pending, approved, rejected)
- Cancel pending requests
- View leave history
- Download leave report

**Leave Balance:**
- Visual progress bars for each leave type
- Total allocated, used, pending, available
- Accrual schedule
- Carry-forward information
- Expiry dates

#### D. Attendance & Timesheets

**Punch Clock:**
- Clock In/Out button (prominent)
- Current status display
- Location tracking (if enabled)
- Break start/end
- View today's hours

**My Attendance:**
- Monthly calendar view with color coding
  - Green: Present
  - Red: Absent
  - Yellow: Late
  - Blue: Leave
- Attendance summary (days present, absent, late)
- Overtime hours
- Regularization requests (for missed punches)

**Timesheets:**
- Weekly timesheet view
- Add time entries by project/task
- Submit for approval
- View approval status
- Timesheet history

#### E. Payroll & Compensation

**Payslips:**
- View all payslips (searchable, filterable)
- Download PDF
- Email payslip
- View breakdown (earnings, deductions)
- Year-to-date totals

**Tax Forms:**
- W-2 forms (year-end)
- 1099 forms (if applicable)
- Tax withholding forms

**Total Compensation:**
- Salary breakdown
- Benefits summary
- Bonuses and incentives

#### F. Benefits

**My Benefits:**
- Enrolled plans (Medical, Dental, Vision, 401k)
- Coverage details
- Dependents
- Beneficiaries
- Plan documents

**Open Enrollment:**
- Enroll in benefits (during open enrollment period)
- Change coverage levels
- Add/remove dependents
- Review costs

#### G. Performance

**My Goals:**
- View assigned goals
- Update progress
- Mark as complete
- Comment/notes

**Performance Reviews:**
- Complete self-assessment
- View past reviews
- View feedback received

**Feedback:**
- Request feedback from colleagues
- Give feedback to peers
- View feedback history

#### H. Learning & Development

**My Courses:**
- Assigned courses (mandatory + optional)
- Course catalog (browse and enroll)
- Progress tracking
- Certificates earned

**Skills:**
- View my skills
- Request skill endorsements
- Add certifications

#### I. Expenses

**Submit Expense:**
- Expense type/category
- Amount
- Date
- Merchant
- Receipt upload (drag-and-drop)
- Description/notes

**My Expenses:**
- View all claims (pending, approved, rejected, reimbursed)
- Edit pending claims
- Track reimbursement status
- Download expense report

#### J. Company Information

**Organization Chart:**
- Interactive org chart
- Search employees
- View team structure
- Contact information

**Employee Directory:**
- Search by name, department, role
- Contact details
- Quick message/email

**Company Documents:**
- Employee handbook
- Policies and procedures
- Forms and templates

**Announcements:**
- Company news
- Events
- Holidays

#### K. Support

**Help Center:**
- FAQs
- How-to guides
- Video tutorials

**Submit Ticket:**
- IT support
- HR inquiries
- Payroll questions

**Chat with HR:**
- Live chat (if available)
- Chatbot for common questions

---

### UI/UX Requirements:

**Responsive Design:**
- Mobile-first approach
- Works on phone, tablet, desktop
- Touch-friendly buttons and controls

**Accessibility:**
- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- High contrast mode

**Performance:**
- Page load < 2 seconds
- Smooth animations
- Optimized images
- Lazy loading

**Notifications:**
- Toast notifications for actions
- Email notifications for important events
- In-app notification center

---

## 1.3 Manager Self-Service Portal

### Overview
Enable managers to manage their team, approve requests, and access team analytics without relying on HR.

### What to Include:

#### A. Manager Dashboard

**Team Overview:**
```
┌──────────────────────────────────────────────────────┐
│  My Team Dashboard                                   │
├──────────────────────────────────────────────────────┤
│  Team Size: 12 employees                            │
│  Reporting: 8 Direct, 4 Indirect                    │
│                                                       │
│  Today's Attendance:                                 │
│  ✅ Present: 10 | ❌ Absent: 1 | 🏖️ On Leave: 1    │
│                                                       │
│  Pending Approvals:                                  │
│  - 3 Leave Requests                                 │
│  - 5 Expense Claims                                 │
│  - 8 Timesheets                                     │
│                                                       │
│  Team Performance:                                   │
│  - 2 Reviews Due This Month                         │
│  - 5 Goals Overdue                                  │
│                                                       │
│  Quick Actions:                                      │
│  [Approve Requests] [View Team] [Schedule 1-on-1]   │
└──────────────────────────────────────────────────────┘
```

#### B. Team Management

**My Team Roster:**
- List of direct reports
- Employee cards with photos
- Quick view of key info:
  - Name, title, department
  - Contact details
  - Employment status
  - Location
- Search and filter
- Export team list

**Team Org Chart:**
- Visual hierarchy
- Drag-and-drop to reorganize (if permitted)

**Team Calendar:**
- Who's in the office today
- Upcoming time off
- Birthdays and anniversaries
- Team events

#### C. Approval Workflows

**Leave Requests:**
- View all pending requests
- One-click approve/reject
- Bulk approve
- Add comments
- View team calendar before approving
- Check coverage

**Expense Claims:**
- View claim details
- View receipts
- Approve/reject with comments
- Set spending limits
- Budget tracking

**Timesheets:**
- Review team timesheets
- Approve/reject
- View project allocation
- See overtime hours
- Comment on discrepancies

**Other Approvals:**
- Asset requests
- Training enrollment
- Shift swaps
- Attendance regularization

#### D. Team Attendance

**Daily Attendance:**
- Real-time view of who's in/out
- Late arrivals
- Missing punches
- Approve regularization requests

**Attendance Reports:**
- Monthly attendance summary
- Absenteeism trends
- Overtime report
- Export to Excel

#### E. Performance Management

**Team Goals:**
- View all team member goals
- Track progress
- Set team goals
- Cascade goals

**Performance Reviews:**
- Scheduled reviews
- Conduct reviews
- 360-degree feedback coordination
- Review history

**1-on-1 Meetings:**
- Schedule 1-on-1s
- Meeting notes
- Action items
- Follow-ups

**Continuous Feedback:**
- Give real-time feedback
- Request feedback from others
- View feedback given/received

#### F. Team Analytics

**Headcount Report:**
- Current headcount
- Headcount trends
- Turnover rate
- New hires vs. exits

**Performance Metrics:**
- Goal completion rate
- Review completion rate
- Average performance rating
- High performers/low performers

**Attendance Metrics:**
- Attendance rate
- Absenteeism rate
- Late arrival rate
- Overtime trends

**Leave Metrics:**
- Leave utilization
- Most used leave types
- Upcoming leaves
- Leave balance trends

#### G. Hiring & Recruitment (If Manager is Hiring Manager)

**Open Positions:**
- View open requisitions
- Job posting status
- Applicant pipeline

**Candidate Review:**
- Review applications
- Schedule interviews
- Provide feedback
- Make hiring decisions

#### H. Team Development

**Training Assignments:**
- Assign courses to team
- Track completion
- View team skills matrix

**Succession Planning:**
- Identify successors
- Development plans
- High-potential employees

#### I. Compensation Management (If Authorized)

**Salary Review:**
- View team compensation
- Recommend increases
- Bonus allocation
- Budget constraints

---

## 1.4 Advanced Reporting & Dashboards

### Overview
Provide HR and leadership with actionable insights through interactive dashboards and customizable reports.

### What to Include:

#### A. Executive Dashboard

**KPI Cards:**
```javascript
// Real-time metrics
- Total Employees (with trend arrow)
- Active Employees
- New Hires This Month
- Exits This Month
- Turnover Rate (12-month rolling)
- Average Tenure
- Headcount by Department (chart)
- Headcount by Location (map)
- Employment Type Distribution (pie chart)
- Gender Diversity (%)
- Average Age
- Cost per Employee
```

**Charts & Visualizations:**
```javascript
// Line Charts
- Headcount Trend (12 months)
- Turnover Trend (12 months)
- Hiring vs. Exits (monthly)

// Bar Charts
- Headcount by Department
- Headcount by Location
- New Hires by Source

// Pie Charts
- Employment Type Distribution
- Gender Distribution
- Age Group Distribution

// Heatmaps
- Absence by Department and Month
- Overtime by Department and Week
```

#### B. Standard HR Reports

**Employee Reports:**
```
1. Employee Master List
   - All employees with key info
   - Filters: Department, Location, Status, Type
   - Export: Excel, PDF, CSV

2. New Hire Report
   - Employees hired in date range
   - By department, location, job title
   - Average time-to-hire

3. Termination Report
   - Employees exited in date range
   - Termination type (voluntary/involuntary)
   - Exit reasons
   - Retention rate

4. Employee Demographics
   - Age distribution
   - Gender distribution
   - Tenure distribution
   - Education levels
   - Diversity metrics

5. Organizational Structure Report
   - Reporting hierarchy
   - Span of control analysis
   - Department headcount
```

**Attendance Reports:**
```
6. Daily Attendance Report
   - Who's in/out today
   - Late arrivals
   - Missing punches

7. Monthly Attendance Summary
   - Days present, absent, late
   - Attendance percentage
   - By employee/department

8. Absenteeism Analysis
   - Absenteeism rate
   - Top absentees
   - Trends over time
   - By department

9. Overtime Report
   - Overtime hours by employee
   - Overtime costs
   - Trends
   - Budget vs. actual

10. Shift Compliance Report
    - Scheduled vs. actual shifts
    - Shift swaps
    - Coverage gaps
```

**Leave Reports:**
```
11. Leave Balance Report
    - All employees' leave balances
    - By leave type
    - Accrued, used, available

12. Leave Utilization Report
    - Leave taken in period
    - By leave type
    - By department
    - Seasonal trends

13. Pending Leave Requests
    - All pending approvals
    - By manager
    - By priority

14. Leave Forecast
    - Upcoming approved leaves
    - Potential coverage issues
```

**Payroll Reports:**
```
15. Payroll Summary
    - Total gross, deductions, net
    - By department
    - Cost center allocation

16. Payroll Register
    - Detailed employee-wise breakdown
    - All components

17. Tax Deduction Report
    - Federal, state, local taxes
    - FICA, Medicare
    - Tax filing ready

18. Compensation Analysis
    - Salary ranges by position
    - Pay equity analysis
    - Gender pay gap
    - Salary quartiles

19. Labor Cost Analysis
    - Labor cost by department
    - Labor cost per project
    - Budget vs. actual
```

**Expense Reports:**
```
20. Expense Summary
    - Total expenses by category
    - By department
    - By employee

21. Expense Approval Status
    - Pending approvals
    - Approved amounts
    - Reimbursed amounts

22. Budget Utilization
    - Expense budget by category
    - Spent vs. budget
    - Forecast to year-end

23. Top Spenders Report
    - Employees with highest expenses
    - By amount and frequency
```

**Performance Reports:**
```
24. Goal Completion Report
    - Goals completed vs. total
    - By employee, team, department
    - Overdue goals

25. Review Completion Report
    - Completed reviews
    - Pending reviews
    - Overdue reviews

26. Performance Distribution
    - Rating distribution
    - Bell curve analysis
    - By department
```

**Recruitment Reports:**
```
27. Time-to-Hire Report
    - Average days from posting to hire
    - By position
    - Trends

28. Recruitment Pipeline
    - Applicants by stage
    - Conversion rates
    - Drop-off analysis

29. Source of Hire
    - Where candidates come from
    - Cost per source
    - Quality of hire by source
```

#### C. Custom Report Builder

**Drag-and-Drop Interface:**
```javascript
// Report Builder Features
1. Data Source Selection
   - Choose table (employees, attendance, payroll)
   - Join multiple tables

2. Field Selection
   - Drag fields to include
   - Calculated fields
   - Aggregations (sum, avg, count, min, max)

3. Filters
   - Multiple filter conditions
   - AND/OR logic
   - Date ranges
   - Dropdown selections

4. Grouping
   - Group by department, location, etc.
   - Subtotals

5. Sorting
   - Multiple sort levels
   - Ascending/descending

6. Formatting
   - Column headers
   - Data types
   - Number formatting
   - Date formatting

7. Visualization
   - Choose chart type (bar, line, pie)
   - Configure axes
   - Colors and labels

8. Scheduling
   - Run daily/weekly/monthly
   - Email to recipients
   - Auto-export
```

**Sample Custom Reports Users Can Build:**
```
- Employees with Birthdays This Month
- Probation Ending in Next 30 Days
- Certifications Expiring Soon
- Employees Without Performance Reviews
- Overtime Exceeding Threshold
- Employees with Low Leave Balance
- Assets Assigned to Exited Employees
- Training Compliance by Department
```

#### D. Analytics Dashboards

**HR Analytics Dashboard:**
```javascript
// Workforce Planning
- Current vs. Budgeted Headcount
- Hiring Plan vs. Actual
- Attrition Forecast
- Retirement Eligibility

// Talent Analytics
- High Potential Employees
- Flight Risk Employees (if predictive analytics enabled)
- Succession Coverage
- Skill Gaps

// Diversity & Inclusion
- Gender diversity by level
- Ethnic diversity
- Age diversity
- Pay equity index
- Promotion rates by gender/ethnicity
```

**Operational Dashboard:**
```javascript
// Real-time Operations
- Today's Attendance Status
- Pending Approvals Count
- Open Positions
- Time-to-Fill

// Alerts
- Missing Punches
- Overdue Reviews
- Upcoming Benefits Enrollment Deadlines
- Expiring Documents
```

#### E. Data Export & Scheduling

**Export Formats:**
- Excel (.xlsx)
- PDF
- CSV
- JSON (for API consumers)

**Scheduled Reports:**
- Daily, weekly, monthly schedules
- Email to distribution list
- Auto-save to shared folder
- Webhook notification

---

## 1.5 SSO Integration (Single Sign-On)

### Overview
Enable employees to log in using their existing corporate credentials (Microsoft, Google, Okta, etc.) for seamless access.

### What to Include:

#### A. SSO Protocols

**SAML 2.0 Support:**
```xml
<!-- Support for SAML Identity Providers -->
- SAML Service Provider (SP) implementation
- Support for IdP-initiated and SP-initiated flows
- SAML assertion validation
- Attribute mapping (email, name, groups)
```

**OAuth 2.0 / OpenID Connect:**
```javascript
// OAuth 2.0 Providers
- Google Workspace
- Microsoft Azure AD / Office 365
- Okta
- OneLogin
- Auth0
```

#### B. Configuration Interface

**SSO Settings Page (Admin):**
```
┌──────────────────────────────────────────────────────┐
│  Single Sign-On Configuration                        │
├──────────────────────────────────────────────────────┤
│  SSO Provider: [Microsoft Azure AD ▼]               │
│                                                       │
│  Configuration Method:                               │
│  ( ) Manual Configuration                           │
│  (•) Metadata URL                                   │
│                                                       │
│  Metadata URL:                                       │
│  [https://login.microsoft.com/.../metadata.xml]     │
│                                                       │
│  Entity ID (SP):                                     │
│  complihr.com                                       │
│                                                       │
│  ACS URL:                                            │
│  https://complihr.com/saml/acs                      │
│                                                       │
│  Attribute Mapping:                                  │
│  Email:      [http://schemas.../emailaddress]       │
│  First Name: [http://schemas.../givenname]          │
│  Last Name:  [http://schemas.../surname]            │
│                                                       │
│  [Test SSO Connection]  [Save Configuration]        │
└──────────────────────────────────────────────────────┘
```

#### C. User Provisioning

**Just-In-Time (JIT) Provisioning:**
- Automatically create user account on first SSO login
- Map SSO attributes to employee profile
- Assign default role
- Send welcome email

**SCIM Provisioning (Optional):**
- Sync users from IdP to CompliHR
- Automatic user creation/update/deactivation
- Group membership sync
- Profile attribute sync

#### D. Login Flow

**SSO Login Page:**
```html
┌──────────────────────────────────────────────────────┐
│                  CompliHR Login                      │
├──────────────────────────────────────────────────────┤
│                                                       │
│         [Sign in with Microsoft]                    │
│         [Sign in with Google]                       │
│                                                       │
│              ─────── OR ───────                      │
│                                                       │
│         Email: [                    ]               │
│         Password: [                 ]               │
│         [ ] Remember me                             │
│                                                       │
│         [Login]   [Forgot Password?]                │
└──────────────────────────────────────────────────────┘
```

#### E. Security Features

**Session Management:**
- Single session per user (optional)
- Session timeout (configurable)
- Logout from all devices
- Activity logging

**Multi-Factor Authentication (MFA):**
- TOTP (Time-based One-Time Password)
- SMS codes
- Email codes
- Authenticator app support

---

## Phase 2: Performance & Talent (Months 4-6)

**Goal:** Build comprehensive performance management and talent development capabilities

**Estimated Effort:** 3 months, 4-5 developers

---

## 2.1 Performance Management System

### Overview
Complete performance lifecycle management from goal setting to reviews to development plans.

### What to Include:

#### A. Goal Management (OKRs / SMART Goals)

**Goal Framework Options:**
```javascript
// Support multiple goal frameworks
1. OKRs (Objectives & Key Results)
   - Objective: Qualitative goal
   - Key Results: 3-5 measurable outcomes
   - Scoring: 0.0 - 1.0 scale

2. SMART Goals
   - Specific, Measurable, Achievable, Relevant, Time-bound
   - Binary (achieved/not achieved)

3. KPIs (Key Performance Indicators)
   - Metric-based
   - Target vs. actual
   - Percentage completion
```

**Goal Creation:**
```
┌──────────────────────────────────────────────────────┐
│  Create New Goal                                     │
├──────────────────────────────────────────────────────┤
│  Goal Type: [OKR ▼]                                 │
│                                                       │
│  Objective:                                          │
│  [Increase customer satisfaction and retention]     │
│                                                       │
│  Description:                                        │
│  [Improve our customer experience through better    │
│   support and product quality...]                   │
│                                                       │
│  Time Period:                                        │
│  Q1 2025 [Jan 1, 2025] - [Mar 31, 2025]            │
│                                                       │
│  Visibility:                                         │
│  (•) Public  ( ) Team  ( ) Private                  │
│                                                       │
│  Alignment:                                          │
│  Parent Goal: [Company: Achieve $10M ARR ▼]        │
│                                                       │
│  Key Results:                                        │
│  ┌────────────────────────────────────────────────┐ │
│  │ 1. Reduce average response time to < 2 hours  │ │
│  │    Current: 0 hrs | Target: 2 hrs             │ │
│  │    [━━━━━━━━━━━━━━━━] 0%                      │ │
│  ├────────────────────────────────────────────────┤ │
│  │ 2. Achieve NPS score of 50+                   │ │
│  │    Current: 42 | Target: 50                   │ │
│  │    [━━━━━━━━━━━━━━━━] 84%                     │ │
│  ├────────────────────────────────────────────────┤ │
│  │ 3. Decrease churn rate to < 3%                │ │
│  │    Current: 5% | Target: 3%                   │ │
│  │    [━━━━━━━━━━━━━━━━] 0%                      │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  [+ Add Key Result]                                  │
│                                                       │
│  [Cancel]  [Save as Draft]  [Create Goal]           │
└──────────────────────────────────────────────────────┘
```

**Goal Features:**
- **Cascading Goals:** Link individual goals to team/company goals
- **Shared Goals:** Multiple owners (team goals)
- **Progress Tracking:** Update progress weekly/monthly
- **Check-ins:** Regular updates and comments
- **Confidence Level:** Traffic light (red/yellow/green)
- **Milestones:** Break down into smaller milestones
- **Attachments:** Add supporting documents
- **Tags/Categories:** Sales, Marketing, Product, etc.

**Goal Dashboard:**
```
My Goals (5)
├── Q1 2025 Goals (3)
│   ├── Increase customer satisfaction ⚠️ At Risk
│   ├── Launch new feature ✅ On Track
│   └── Improve team productivity ✅ On Track
├── Annual Goals (2)
│   ├── Complete leadership training ⚠️ Behind
│   └── Obtain industry certification ✅ Completed
```

**Goal Views:**
- **List View:** All goals in a table
- **Kanban View:** Drag goals between statuses (Not Started, In Progress, At Risk, Completed)
- **Timeline View:** Gantt chart of goals
- **Tree View:** Hierarchical goal alignment
- **Progress View:** Overall completion percentage

#### B. Performance Reviews

**Review Types:**
```javascript
1. Annual Performance Review
   - Comprehensive year-end review
   - Ratings on competencies
   - Overall rating
   - Promotion/compensation recommendations

2. Mid-Year Review
   - Progress check
   - Goal adjustments
   - Development plan updates

3. Probation Review
   - 30/60/90 day reviews
   - Pass/fail decision
   - Confirmation recommendation

4. Project Review
   - End-of-project assessment
   - Specific to project contributions

5. 360-Degree Feedback
   - Self-assessment
   - Manager assessment
   - Peer feedback (2-5 peers)
   - Direct report feedback (if manager)
   - External stakeholder feedback (optional)
```

**Review Cycle Configuration:**
```
┌──────────────────────────────────────────────────────┐
│  Create Review Cycle                                 │
├──────────────────────────────────────────────────────┤
│  Cycle Name: [Annual Review 2025]                   │
│  Review Type: [Annual Performance Review ▼]         │
│                                                       │
│  Review Period:                                      │
│  From: [Jan 1, 2025]  To: [Dec 31, 2025]           │
│                                                       │
│  Schedule:                                           │
│  Employee Self-Assessment: [Jan 1-15, 2026]         │
│  Manager Review:           [Jan 16-31, 2026]        │
│  Calibration:              [Feb 1-7, 2026]          │
│  Review Meetings:          [Feb 8-28, 2026]         │
│                                                       │
│  Participants:                                       │
│  ( ) All Employees                                  │
│  (•) Selected Departments: [☑ Engineering]          │
│      [☑ Sales] [☑ Marketing]                        │
│  ( ) Selected Employees                             │
│                                                       │
│  Review Template: [Annual Review Template ▼]        │
│                                                       │
│  [Cancel]  [Create Cycle]                           │
└──────────────────────────────────────────────────────┘
```

**Review Form:**
```
┌──────────────────────────────────────────────────────┐
│  Annual Performance Review - John Doe                │
│  Review Period: Jan 1, 2025 - Dec 31, 2025         │
├──────────────────────────────────────────────────────┤
│  Section 1: Goal Achievement                         │
│  ┌────────────────────────────────────────────────┐ │
│  │ Goal: Increase customer satisfaction           │ │
│  │ Target: NPS 50+ | Achieved: NPS 52             │ │
│  │ Rating: [⭐⭐⭐⭐⭐] Exceeds Expectations        │ │
│  │                                                 │ │
│  │ Comments:                                       │ │
│  │ [John exceeded the target NPS by 2 points...]  │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  Section 2: Competencies                            │
│  ┌────────────────────────────────────────────────┐ │
│  │ Leadership                                      │ │
│  │ [1] [2] [3] [4] [5]                            │ │
│  │  □   □   □   ☑   □                             │ │
│  │                                                 │ │
│  │ Communication                                   │ │
│  │ [1] [2] [3] [4] [5]                            │ │
│  │  □   □   □   □   ☑                             │ │
│  │                                                 │ │
│  │ Technical Skills                                │ │
│  │ [1] [2] [3] [4] [5]                            │ │
│  │  □   □   □   ☑   □                             │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  Section 3: Strengths                               │
│  [John is an excellent communicator and natural     │
│   leader. His technical expertise is strong...]     │
│                                                       │
│  Section 4: Areas for Development                   │
│  [Could benefit from more strategic thinking        │
│   and long-term planning skills...]                 │
│                                                       │
│  Section 5: Development Plan                        │
│  [1. Enroll in Strategic Leadership course          │
│   2. Shadow VP for 3 months                         │
│   3. Lead cross-functional project]                 │
│                                                       │
│  Overall Rating:                                     │
│  ( ) Does Not Meet Expectations                     │
│  ( ) Meets Expectations                             │
│  (•) Exceeds Expectations                           │
│  ( ) Far Exceeds Expectations                       │
│                                                       │
│  Promotion Recommendation:                           │
│  [☑] Recommend for promotion to Senior Manager     │
│                                                       │
│  Salary Increase Recommendation:                     │
│  [8%] (Within budget: 5-10%)                        │
│                                                       │
│  [Save Draft]  [Submit Review]                      │
└──────────────────────────────────────────────────────┘
```

**Review Workflow:**
```
1. Cycle Created → Employees Notified
2. Self-Assessment (Employee completes)
3. Manager Review (Manager rates and comments)
4. Peer Feedback Requested (If 360°)
5. Peer Feedback Submitted
6. Calibration Meeting (Managers align ratings)
7. Review Meeting Scheduled
8. Review Meeting Conducted
9. Employee Acknowledges Review
10. Review Finalized
```

**Rating Calibration:**
```
┌──────────────────────────────────────────────────────┐
│  Rating Calibration Session                          │
│  Department: Engineering | Date: Feb 5, 2026        │
├──────────────────────────────────────────────────────┤
│  Rating Distribution:                                │
│                                                       │
│  Far Exceeds:  5% [██                 ] (Target: 5%) │
│  Exceeds:     20% [████████           ] (Target: 20%)│
│  Meets:       65% [█████████████████  ] (Target: 65%)│
│  Below:       10% [████               ] (Target: 10%)│
│                                                       │
│  Employees to Discuss:                               │
│  ┌────────────────────────────────────────────────┐ │
│  │ Jane Smith - Exceeds (Manager A says Far Exc) │ │
│  │ Mike Johnson - Meets (Manager B says Exceeds) │ │
│  │ Sarah Lee - Below (Needs PIP?)                 │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  [Adjust Ratings]  [Finalize Calibration]           │
└──────────────────────────────────────────────────────┘
```

#### C. Continuous Feedback

**Give Feedback:**
```
┌──────────────────────────────────────────────────────┐
│  Give Feedback to John Doe                          │
├──────────────────────────────────────────────────────┤
│  Feedback Type:                                      │
│  (•) Praise  ( ) Constructive  ( ) Coaching         │
│                                                       │
│  Related To:                                         │
│  [ ] Specific Goal/Project                          │
│  [ ] General Performance                            │
│                                                       │
│  Message:                                            │
│  [Great job on the client presentation today! Your  │
│   clear communication and preparation were          │
│   excellent...]                                      │
│                                                       │
│  Visibility:                                         │
│  (•) Private (Only John sees this)                  │
│  ( ) Share with Manager                             │
│  ( ) Public (Team can see)                          │
│                                                       │
│  Request Response: [☑]                              │
│                                                       │
│  [Cancel]  [Send Feedback]                          │
└──────────────────────────────────────────────────────┘
```

**Request Feedback:**
```
Request feedback from:
[☑] My Manager
[☑] Sarah (Peer)
[☑] Mike (Peer)
[ ] Cross-functional partners

What would you like feedback on?
[ ] Recent project completion
[ ] Presentation skills
[ ] Technical expertise
[✓] Overall performance
```

**Feedback Inbox:**
```
My Feedback (Received)
├── 3 days ago - Sarah Martinez
│   💬 "Great collaboration on the Q4 project..."
│   👍 Praise | ⭐⭐⭐⭐⭐
│
├── 1 week ago - Manager
│   💡 "Consider improving your time management..."
│   🎯 Coaching | Related to: Time Management Goal
│
└── 2 weeks ago - Mike Chen
    ✅ "Your code reviews are thorough and helpful..."
    👍 Praise | ⭐⭐⭐⭐⭐
```

#### D. 1-on-1 Meetings

**1-on-1 Tracker:**
```
┌──────────────────────────────────────────────────────┐
│  1-on-1 with John Doe                               │
├──────────────────────────────────────────────────────┤
│  Frequency: [Bi-weekly ▼]  Next: Feb 15, 2026      │
│                                                       │
│  Agenda Template:                                    │
│  ☑ Check-in (How are you?)                         │
│  ☑ Progress on goals                               │
│  ☑ Blockers/Challenges                             │
│  ☑ Career development                              │
│  ☑ Feedback exchange                               │
│  ☑ Action items from last meeting                  │
│                                                       │
│  Previous Meeting: Feb 1, 2026                      │
│  └─ Notes: [View] | Action Items: 2 completed, 1 open│
│                                                       │
│  Upcoming Meeting: Feb 15, 2026                     │
│  └─ Prep Notes:                                     │
│     [John mentioned wanting to discuss promotion    │
│      timeline. Prepare career ladder doc...]        │
│                                                       │
│  [Schedule Next Meeting]  [View History]            │
└──────────────────────────────────────────────────────┘
```

**Meeting Notes:**
```
1-on-1 Notes - Feb 1, 2026
──────────────────────────
Discussion Topics:
• Q1 goals progress - On track for 2/3, behind on lead gen
• Upcoming conference - Approved to attend
• Team dynamics - Concerned about new hire onboarding

Action Items:
☑ Manager: Send conference approval (Done)
☐ John: Submit Q1 goal update by Feb 5
☑ Manager: Schedule team onboarding review (Done)
☐ John: Shadow senior rep on next sales call

Next Meeting: Feb 15, 2026
Topics to cover:
- Follow up on lead gen goal
- Discuss promotion criteria
```

#### E. Development Plans

**Individual Development Plan (IDP):**
```
┌──────────────────────────────────────────────────────┐
│  Development Plan - John Doe                         │
│  Period: 2025                                        │
├──────────────────────────────────────────────────────┤
│  Career Goal: Senior Manager within 2 years         │
│                                                       │
│  Development Areas:                                  │
│  ┌────────────────────────────────────────────────┐ │
│  │ 1. Strategic Thinking                          │ │
│  │    Activities:                                  │ │
│  │    • Enroll in Strategic Leadership course     │ │
│  │    • Read "Good Strategy Bad Strategy"         │ │
│  │    • Shadow VP in strategy meetings            │ │
│  │    Timeline: Q1-Q2 2025                        │ │
│  │    Status: [━━━━━━░░░░] 60% Complete           │ │
│  ├────────────────────────────────────────────────┤ │
│  │ 2. People Management                           │ │
│  │    Activities:                                  │ │
│  │    • Complete Management Fundamentals course   │ │
│  │    • Mentor 2 junior team members              │ │
│  │    • Lead cross-functional project             │ │
│  │    Timeline: Q2-Q3 2025                        │ │
│  │    Status: [━━░░░░░░░░] 20% Complete           │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  Training Completed:                                 │
│  ✅ Leadership Essentials (Jan 2025)                │
│  ✅ Conflict Resolution (Dec 2024)                  │
│                                                       │
│  Upcoming Training:                                  │
│  📅 Strategic Planning Workshop (Mar 2025)          │
│  📅 Executive Presence (Apr 2025)                   │
│                                                       │
│  [Update Progress]  [View Full Plan]                │
└──────────────────────────────────────────────────────┘
```

#### F. Database Schema

```sql
-- Performance Goals
CREATE SCHEMA IF NOT EXISTS performance;

CREATE TABLE performance.goals (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),
  employee_id BIGINT NOT NULL REFERENCES core.employees(id),

  -- Goal Details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  goal_type VARCHAR(50) NOT NULL, -- OKR, SMART, KPI
  category VARCHAR(100), -- Sales, Marketing, Product, Personal

  -- Alignment
  parent_goal_id BIGINT REFERENCES performance.goals(id),
  company_goal_id BIGINT,
  team_goal_id BIGINT,

  -- Timeline
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,

  -- Progress
  status VARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, At Risk, Completed, Abandoned
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  confidence_level VARCHAR(50), -- Red, Yellow, Green

  -- Measurement
  measurement_type VARCHAR(50), -- Numeric, Percentage, Binary, Milestone
  target_value DECIMAL(15, 2),
  current_value DECIMAL(15, 2),
  measurement_unit VARCHAR(50),

  -- Weight
  weight_percentage DECIMAL(5, 2), -- Importance weight for overall rating

  -- Visibility
  visibility VARCHAR(50) DEFAULT 'Public', -- Public, Team, Private

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  deleted_at TIMESTAMP
);

-- Key Results (for OKRs)
CREATE TABLE performance.key_results (
  id BIGSERIAL PRIMARY KEY,
  goal_id BIGINT NOT NULL REFERENCES performance.goals(id) ON DELETE CASCADE,

  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Measurement
  target_value DECIMAL(15, 2) NOT NULL,
  current_value DECIMAL(15, 2) DEFAULT 0,
  measurement_unit VARCHAR(50),

  -- Progress
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  confidence_level VARCHAR(50),

  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goal Check-ins
CREATE TABLE performance.goal_checkins (
  id BIGSERIAL PRIMARY KEY,
  goal_id BIGINT NOT NULL REFERENCES performance.goals(id) ON DELETE CASCADE,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id),

  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress_update TEXT,
  current_value DECIMAL(15, 2),
  confidence_level VARCHAR(50),
  blockers TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Review Cycles
CREATE TABLE performance.review_cycles (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),

  cycle_name VARCHAR(255) NOT NULL,
  review_type VARCHAR(50) NOT NULL, -- Annual, Mid-Year, Probation, Project, 360

  -- Period
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,

  -- Schedule
  self_assessment_start DATE,
  self_assessment_end DATE,
  manager_review_start DATE,
  manager_review_end DATE,
  calibration_start DATE,
  calibration_end DATE,
  meeting_start DATE,
  meeting_end DATE,

  -- Template
  review_template_id BIGINT,

  -- Status
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Active, In Progress, Calibration, Completed

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT
);

-- Performance Reviews
CREATE TABLE performance.reviews (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),
  review_cycle_id BIGINT REFERENCES performance.review_cycles(id),
  employee_id BIGINT NOT NULL REFERENCES core.employees(id),
  reviewer_id BIGINT REFERENCES core.employees(id),

  -- Review Type
  review_type VARCHAR(50) NOT NULL, -- Self, Manager, Peer, Direct Report, External

  -- Review Data (JSONB for flexibility)
  review_data JSONB, -- Stores all responses, ratings, comments

  -- Overall Rating
  overall_rating VARCHAR(50), -- Does Not Meet, Meets, Exceeds, Far Exceeds
  overall_rating_numeric DECIMAL(3, 2), -- 1.0 to 5.0

  -- Recommendations
  promotion_recommended BOOLEAN DEFAULT false,
  promotion_to_title VARCHAR(255),
  salary_increase_percentage DECIMAL(5, 2),
  bonus_percentage DECIMAL(5, 2),

  -- Status
  status VARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, Submitted, Acknowledged

  -- Dates
  started_at TIMESTAMP,
  submitted_at TIMESTAMP,
  acknowledged_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback
CREATE TABLE performance.feedback (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),
  employee_id BIGINT NOT NULL REFERENCES core.employees(id), -- Recipient
  from_employee_id BIGINT REFERENCES core.employees(id), -- Giver

  -- Feedback Details
  feedback_type VARCHAR(50) NOT NULL, -- Praise, Constructive, Coaching
  feedback_text TEXT NOT NULL,

  -- Context
  related_goal_id BIGINT REFERENCES performance.goals(id),
  related_project VARCHAR(255),

  -- Visibility
  visibility VARCHAR(50) DEFAULT 'Private', -- Private, Manager, Public
  is_anonymous BOOLEAN DEFAULT false,

  -- Response
  response_requested BOOLEAN DEFAULT false,
  response_text TEXT,
  responded_at TIMESTAMP,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1-on-1 Meetings
CREATE TABLE performance.one_on_ones (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),
  employee_id BIGINT NOT NULL REFERENCES core.employees(id),
  manager_id BIGINT NOT NULL REFERENCES core.employees(id),

  -- Meeting Details
  meeting_date DATE NOT NULL,
  duration_minutes INT DEFAULT 30,

  -- Agenda
  agenda TEXT,

  -- Notes
  meeting_notes TEXT,
  employee_notes TEXT, -- Private to employee
  manager_notes TEXT, -- Private to manager

  -- Action Items (JSONB array)
  action_items JSONB,

  -- Topics Discussed
  topics TEXT[],

  -- Next Meeting
  next_meeting_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'Scheduled', -- Scheduled, Completed, Cancelled, Rescheduled

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Development Plans
CREATE TABLE performance.development_plans (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),
  employee_id BIGINT NOT NULL REFERENCES core.employees(id),

  -- Plan Details
  plan_year INT NOT NULL,
  career_goal TEXT,

  -- Development Areas (JSONB array)
  development_areas JSONB,

  -- Progress
  overall_progress DECIMAL(5, 2) DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Active, Completed

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT
);
```

---

## 2.2 Onboarding & Offboarding Workflows

### Overview
Automate and streamline the employee onboarding and offboarding processes with checklists, task assignments, and approvals.

### What to Include:

#### A. Onboarding Module

**Pre-Boarding (After Offer Acceptance, Before Day 1):**
```
Pre-Boarding Checklist:
□ Send welcome email
□ Send new hire paperwork packet
  □ I-9 form
  □ W-4 form
  □ Direct deposit form
  □ Emergency contact form
  □ Confidentiality agreement
  □ Employee handbook acknowledgment
□ Benefits enrollment guide sent
□ Order equipment (laptop, monitor, phone)
□ Create email account
□ Create system accounts (Slack, HRIS, etc.)
□ Assign desk/workspace
□ Schedule orientation session
□ Assign buddy/mentor
□ Prepare welcome kit
□ Send first day instructions (location, time, parking)
```

**Day 1 Checklist:**
```
Manager Tasks:
□ Welcome new hire
□ Office tour
□ Introduce to team
□ Workspace setup
□ Equipment distribution
□ Review role expectations
□ Review first week schedule

HR Tasks:
□ Collect signed paperwork
□ Process I-9 verification
□ Enroll in benefits
□ Create employee file
□ Setup in payroll system
□ Issue employee badge

IT Tasks:
□ Setup computer/laptop
□ Configure email
□ Provision software licenses
□ Setup phone extension
□ Provide IT orientation
□ Setup VPN access

Employee Tasks:
□ Complete HR orientation
□ Sign documents
□ Setup workstation
□ Review employee handbook
□ Complete IT training
□ Meet team members
```

**First Week Checklist:**
```
□ Department orientation
□ Product/Service training
□ Systems training
  □ HRIS
  □ Time tracking
  □ Expense reporting
  □ Project management tools
□ Compliance training
  □ Harassment prevention
  □ Data security
  □ Safety training
□ Meet key stakeholders
□ Review company policies
□ Set 30-60-90 day goals
□ Schedule 1-on-1s with manager
```

**30-60-90 Day Milestones:**
```
30 Days:
□ Complete all required training
□ Shadow team members
□ First project contribution
□ Manager check-in
□ HR pulse survey

60 Days:
□ Lead small project/task
□ Expand cross-functional relationships
□ Contribute to team meetings
□ Mid-probation review

90 Days:
□ Probation review meeting
□ Performance assessment
□ Confirm or extend probation
□ Set quarterly goals
□ Benefits enrollment (if applicable)
```

**Onboarding Portal (Employee View):**
```
┌──────────────────────────────────────────────────────┐
│  Welcome to CompliHR, John!                          │
│  Start Date: February 1, 2025                        │
├──────────────────────────────────────────────────────┤
│  Your Onboarding Progress: [━━━━━━━━░░] 80%         │
│                                                       │
│  📋 To Do Today (3):                                 │
│  □ Complete I-9 verification with HR                │
│  □ Setup laptop and email                           │
│  □ Attend team standup at 10am                      │
│                                                       │
│  📚 Training Modules (2 of 5 complete):             │
│  ✅ Company Overview                                │
│  ✅ Harassment Prevention                           │
│  ⏳ Data Security (Due: Feb 3)                      │
│  ⏳ Product Training (Due: Feb 5)                   │
│  ⏳ Sales Process (Due: Feb 10)                     │
│                                                       │
│  📝 Documents to Sign (1 pending):                  │
│  ✅ Offer Letter - Signed                           │
│  ✅ Employee Handbook - Acknowledged                │
│  ⏳ Confidentiality Agreement - Pending             │
│                                                       │
│  👥 Meet Your Team:                                  │
│  Sarah (Manager) - [Schedule 1-on-1]               │
│  Mike (Buddy) - [Send Message]                     │
│  Team Roster - [View All]                          │
│                                                       │
│  🎯 30-60-90 Day Goals:                             │
│  [View Goals]                                       │
│                                                       │
│  📅 Upcoming Events:                                 │
│  Feb 2 - New Hire Orientation (9am)                │
│  Feb 5 - Team Lunch (12pm)                         │
│  Feb 15 - 30-Day Check-in with Manager             │
└──────────────────────────────────────────────────────┘
```

**Automated Workflows:**
```javascript
// Trigger: Offer Accepted
1. Create onboarding case
2. Assign onboarding coordinator
3. Generate pre-boarding checklist
4. Send welcome email to new hire
5. Notify IT to create accounts
6. Notify Facilities to assign desk
7. Notify Procurement to order equipment

// Trigger: 7 Days Before Start Date
1. Send reminder to manager to prepare
2. Verify equipment ready
3. Send first day instructions to new hire

// Trigger: Start Date (Day 1)
1. Create employee record
2. Activate email account
3. Send welcome notification to team
4. Assign Day 1 checklist
5. Schedule orientation meetings

// Trigger: Day 30
1. Send 30-day survey to new hire
2. Notify manager to conduct check-in
3. Generate 30-day report

// Trigger: Day 90
1. Initiate probation review
2. Notify manager to complete review form
3. Send survey to new hire
4. Generate onboarding completion report
```

#### B. Offboarding Module

**Resignation Process:**
```
Employee Submits Resignation:
□ Employee submits resignation letter
□ Manager receives notification
□ HR receives notification
□ Exit interview scheduled
□ Offboarding checklist created
□ Last working day confirmed
□ Knowledge transfer plan created
```

**Offboarding Checklist:**
```
HR Tasks:
□ Process resignation paperwork
□ Calculate final pay
□ Process accrued leave payout
□ Calculate severance (if applicable)
□ COBRA notification sent
□ Benefits termination processed
□ Final paycheck prepared
□ Exit interview conducted
□ Exit survey sent
□ Reference policy explained
□ Update employee status to "Terminated"

Manager Tasks:
□ Accept resignation
□ Plan knowledge transfer
□ Redistribute responsibilities
□ Announce departure to team (with employee consent)
□ Conduct exit interview
□ Recover company property
□ Cancel 1-on-1s
□ Remove from team channels
□ Update project assignments

IT Tasks:
□ Revoke system access on last day
□ Disable email account
□ Disable VPN/remote access
□ Remove from software licenses
□ Disable badges/physical access
□ Wipe company devices
□ Archive email/files

Finance Tasks:
□ Process final expense reimbursements
□ Cancel company credit card
□ Final payroll processing
□ 401k/benefits termination

Facilities Tasks:
□ Collect office keys
□ Collect parking pass
□ Collect access badges
□ Clear desk/workspace
```

**Exit Interview:**
```
┌──────────────────────────────────────────────────────┐
│  Exit Interview - John Doe                          │
│  Last Day: February 28, 2025                        │
├──────────────────────────────────────────────────────┤
│  Reason for Leaving:                                 │
│  ( ) New Job Opportunity                            │
│  ( ) Career Change                                  │
│  ( ) Relocation                                     │
│  ( ) Compensation                                   │
│  ( ) Work-Life Balance                              │
│  ( ) Management/Leadership                          │
│  ( ) Company Culture                                │
│  ( ) Personal Reasons                               │
│  ( ) Other: [____________]                          │
│                                                       │
│  Overall Experience (1-10): [8]                     │
│                                                       │
│  What did you enjoy most about working here?         │
│  [Great team collaboration and learning             │
│   opportunities...]                                  │
│                                                       │
│  What could we improve?                              │
│  [More professional development budget and          │
│   clearer career paths...]                          │
│                                                       │
│  Would you recommend CompliHR as a place to work?   │
│  (•) Yes  ( ) No  ( ) Maybe                         │
│                                                       │
│  Would you consider returning in the future?        │
│  (•) Yes  ( ) No  ( ) Maybe                         │
│                                                       │
│  Manager Relationship (1-10): [9]                   │
│  Comments: [Sarah was a great mentor...]            │
│                                                       │
│  Additional Comments:                                │
│  [Thank you for the opportunity...]                 │
│                                                       │
│  [Save]  [Submit Exit Interview]                    │
└──────────────────────────────────────────────────────┘
```

**Final Checklist (Last Day):**
```
Employee Final Tasks:
□ Return laptop
□ Return monitor/peripherals
□ Return mobile phone
□ Return office keys
□ Return access badge
□ Return company credit card
□ Sign equipment return form
□ Complete knowledge transfer
□ Update email auto-responder
□ Clear personal items from desk

System Tasks (Automated):
□ Revoke all system access at 5pm
□ Disable email at 5pm
□ Send exit confirmation to HR
□ Archive employee data
□ Update org chart
□ Reassign open tasks
```

**Offboarding Portal:**
```
┌──────────────────────────────────────────────────────┐
│  Offboarding - John Doe                             │
│  Last Day: February 28, 2025 (15 days remaining)    │
├──────────────────────────────────────────────────────┤
│  Completion Progress: [━━━━━━░░░░] 60%              │
│                                                       │
│  📋 Your Tasks (3 pending):                         │
│  ✅ Submit resignation letter                       │
│  ✅ Complete exit interview                         │
│  ✅ Knowledge transfer to Mike                      │
│  ⏳ Return company equipment                        │
│  ⏳ Clear personal items                            │
│  ⏳ Setup email auto-responder                      │
│                                                       │
│  💰 Final Pay Information:                          │
│  Final Paycheck Date: March 5, 2025                │
│  Estimated Amount: $3,200                           │
│  Accrued PTO Payout: $1,500                         │
│                                                       │
│  🏥 Benefits Information:                            │
│  Benefits End Date: February 28, 2025               │
│  COBRA Election Period: 60 days                     │
│  [Download COBRA Package]                           │
│                                                       │
│  📄 Documents:                                       │
│  [Download Final Payslip]                           │
│  [Download Service Certificate]                     │
│  [Download Reference Policy]                        │
│                                                       │
│  📞 Need Help?                                       │
│  [Contact HR]  [View FAQ]                           │
└──────────────────────────────────────────────────────┘
```

#### C. Database Schema

```sql
-- Onboarding Cases
CREATE TABLE core.onboarding_cases (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),
  employee_id BIGINT NOT NULL REFERENCES core.employees(id),

  -- Details
  start_date DATE NOT NULL,
  onboarding_coordinator_id BIGINT REFERENCES core.employees(id),
  buddy_id BIGINT REFERENCES core.employees(id),

  -- Progress
  status VARCHAR(50) DEFAULT 'Pre-Boarding', -- Pre-Boarding, Day 1, Week 1, 30 Days, 60 Days, 90 Days, Completed
  overall_progress DECIMAL(5, 2) DEFAULT 0,

  -- Milestones
  day_1_completed BOOLEAN DEFAULT false,
  week_1_completed BOOLEAN DEFAULT false,
  day_30_completed BOOLEAN DEFAULT false,
  day_60_completed BOOLEAN DEFAULT false,
  day_90_completed BOOLEAN DEFAULT false,

  -- Probation
  probation_status VARCHAR(50), -- Passed, Extended, Failed
  probation_end_date DATE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Tasks
CREATE TABLE core.onboarding_tasks (
  id BIGSERIAL PRIMARY KEY,
  onboarding_case_id BIGINT NOT NULL REFERENCES core.onboarding_cases(id) ON DELETE CASCADE,

  -- Task Details
  task_name VARCHAR(255) NOT NULL,
  task_description TEXT,
  task_type VARCHAR(50), -- HR, IT, Manager, Employee, Facilities, Compliance

  -- Assignment
  assigned_to BIGINT REFERENCES core.employees(id),

  -- Timeline
  due_date DATE,
  milestone VARCHAR(50), -- Pre-Boarding, Day 1, Week 1, 30 Days, etc.

  -- Status
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Completed, Skipped
  completed_at TIMESTAMP,
  completed_by BIGINT REFERENCES core.employees(id),

  -- Notes
  notes TEXT,

  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Offboarding Cases
CREATE TABLE core.offboarding_cases (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),
  employee_id BIGINT NOT NULL REFERENCES core.employees(id),

  -- Details
  resignation_date DATE,
  last_working_date DATE NOT NULL,
  termination_type VARCHAR(50), -- Voluntary, Involuntary, Retirement, End of Contract
  termination_reason TEXT,

  -- Exit Interview
  exit_interview_scheduled DATE,
  exit_interview_completed BOOLEAN DEFAULT false,
  exit_interview_data JSONB,

  -- Progress
  status VARCHAR(50) DEFAULT 'Initiated', -- Initiated, In Progress, Completed
  overall_progress DECIMAL(5, 2) DEFAULT 0,

  -- Final Pay
  final_pay_date DATE,
  final_pay_amount DECIMAL(15, 2),
  pto_payout_amount DECIMAL(15, 2),
  severance_amount DECIMAL(15, 2),

  -- Eligible for Rehire
  eligible_for_rehire BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Offboarding Tasks
CREATE TABLE core.offboarding_tasks (
  id BIGSERIAL PRIMARY KEY,
  offboarding_case_id BIGINT NOT NULL REFERENCES core.offboarding_cases(id) ON DELETE CASCADE,

  task_name VARCHAR(255) NOT NULL,
  task_description TEXT,
  task_type VARCHAR(50),
  assigned_to BIGINT REFERENCES core.employees(id),
  due_date DATE,
  status VARCHAR(50) DEFAULT 'Pending',
  completed_at TIMESTAMP,
  completed_by BIGINT,
  notes TEXT,

  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exit Surveys
CREATE TABLE core.exit_surveys (
  id BIGSERIAL PRIMARY KEY,
  offboarding_case_id BIGINT REFERENCES core.offboarding_cases(id),
  employee_id BIGINT NOT NULL REFERENCES core.employees(id),

  -- Survey Responses (JSONB)
  survey_data JSONB,

  -- Key Metrics
  overall_experience_rating INT, -- 1-10
  would_recommend BOOLEAN,
  would_return BOOLEAN,
  manager_rating INT, -- 1-10

  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2.3 Compensation Planning & Management

### Overview
Enable structured salary reviews, merit increases, bonus allocation, and total compensation visibility.

### What to Include:

#### A. Compensation Planning Cycles

**Annual Compensation Review:**
```
┌──────────────────────────────────────────────────────┐
│  Create Compensation Review Cycle                    │
├──────────────────────────────────────────────────────┤
│  Cycle Name: [2025 Annual Merit Increase]           │
│  Cycle Type: [Merit Increase ▼]                     │
│                                                       │
│  Effective Date: [April 1, 2025]                    │
│                                                       │
│  Budget Allocation:                                  │
│  Total Budget: [$500,000]                           │
│  Budget as % of Payroll: [3.5%]                     │
│                                                       │
│  Guidelines:                                         │
│  Min Increase: [0%]                                 │
│  Max Increase: [10%]                                │
│  Recommended Range: [2-5%]                          │
│                                                       │
│  Performance-Based Matrix:                           │
│  ┌────────────────────────────────────────────────┐ │
│  │ Far Exceeds:    6-10%                          │ │
│  │ Exceeds:        4-7%                           │ │
│  │ Meets:          2-4%                           │ │
│  │ Below:          0-2%                           │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  Eligible Employees:                                 │
│  ( ) All Employees                                  │
│  (•) Exclude Probation                              │
│  (•) Exclude Recent Hires (< 6 months)              │
│  (•) Exclude Recent Promotions (< 3 months)         │
│                                                       │
│  Workflow:                                           │
│  Manager Recommendations: [Feb 1-28, 2025]          │
│  HR Review:              [Mar 1-15, 2025]           │
│  Executive Approval:     [Mar 16-31, 2025]          │
│  Employee Communication: [April 1, 2025]            │
│                                                       │
│  [Cancel]  [Create Cycle]                           │
└──────────────────────────────────────────────────────┘
```

**Manager Compensation Worksheet:**
```
┌──────────────────────────────────────────────────────┐
│  2025 Merit Increase - Engineering Team              │
│  Manager: Sarah Johnson | Budget: $80,000 (3.5%)    │
├──────────────────────────────────────────────────────┤
│  Team Summary:                                       │
│  Total Team Payroll: $2,285,000                     │
│  Budget Allocated: $80,000 (3.5%)                   │
│  Budget Used: $75,500 (3.3%)                        │
│  Budget Remaining: $4,500 (0.2%)                    │
│                                                       │
│  Employee Recommendations:                           │
│  ┌────────────────────────────────────────────────┐ │
│  │ John Doe                                       │ │
│  │ Current Salary: $120,000                       │ │
│  │ Performance: Far Exceeds                       │ │
│  │ Time in Role: 2 years                          │ │
│  │ Last Increase: 4% (1 year ago)                 │ │
│  │ Market Position: 95th percentile              │ │
│  │ Recommended Increase: [8%] $9,600              │ │
│  │ New Salary: $129,600                           │ │
│  │ Justification: [Top performer, key retention  │ │
│  │   risk, below market for skillset...]          │ │
│  ├────────────────────────────────────────────────┤ │
│  │ Jane Smith                                     │ │
│  │ Current Salary: $95,000                        │ │
│  │ Performance: Exceeds                           │ │
│  │ Recommended Increase: [5%] $4,750              │ │
│  │ New Salary: $99,750                            │ │
│  ├────────────────────────────────────────────────┤ │
│  │ Mike Johnson                                   │ │
│  │ Current Salary: $105,000                       │ │
│  │ Performance: Meets                             │ │
│  │ Recommended Increase: [3%] $3,150              │ │
│  │ New Salary: $108,150                           │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  [Save Draft]  [Submit for Review]                  │
└──────────────────────────────────────────────────────┘
```

**Compensation Planning Grid:**
```
Performance vs. Position in Range Matrix

                │ Below Min │ Min-Midpoint │ Mid-Max │ Above Max
────────────────┼───────────┼──────────────┼─────────┼──────────
Far Exceeds     │   10%     │      8%      │   6%    │    4%
Exceeds         │    7%     │      5%      │   4%    │    2%
Meets           │    5%     │      3%      │   2%    │    0%
Below           │    2%     │      0%      │   0%    │    0%

Position in Range = (Current Salary - Range Min) / (Range Max - Range Min)
```

#### B. Bonus Management

**Bonus Program Setup:**
```
┌──────────────────────────────────────────────────────┐
│  Create Bonus Program                                │
├──────────────────────────────────────────────────────┤
│  Program Name: [Q4 2024 Performance Bonus]          │
│  Program Type: [Performance Bonus ▼]                │
│                 (Other: Signing, Retention, Spot)   │
│                                                       │
│  Eligibility:                                        │
│  Employee Level: [All Levels ▼]                     │
│  Departments: [☑ Sales] [☑ Marketing]               │
│  Min Tenure: [6 months]                             │
│                                                       │
│  Budget:                                             │
│  Total Budget: [$250,000]                           │
│  Currency: [USD]                                    │
│                                                       │
│  Calculation Method:                                 │
│  (•) Performance-Based Matrix                       │
│  ( ) Target Bonus % of Salary                       │
│  ( ) Fixed Amount per Employee                      │
│  ( ) Manager Discretion                             │
│                                                       │
│  Performance Multipliers:                            │
│  Far Exceeds: [150%] of target                      │
│  Exceeds:     [100%] of target                      │
│  Meets:       [50%] of target                       │
│  Below:       [0%] of target                        │
│                                                       │
│  Payment Date: [January 31, 2025]                   │
│                                                       │
│  [Cancel]  [Create Program]                         │
└──────────────────────────────────────────────────────┘
```

**Bonus Allocation:**
```
Employee Bonus Allocation:

John Doe
├─ Base Salary: $120,000
├─ Target Bonus: 15% ($18,000)
├─ Performance Rating: Far Exceeds
├─ Multiplier: 150%
└─ Actual Bonus: $27,000

Jane Smith
├─ Base Salary: $95,000
├─ Target Bonus: 10% ($9,500)
├─ Performance Rating: Exceeds
├─ Multiplier: 100%
└─ Actual Bonus: $9,500
```

#### C. Commission Tracking

**Commission Plans:**
```sql
-- Commission Plans
CREATE TABLE payroll.commission_plans (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),

  plan_name VARCHAR(255) NOT NULL,
  plan_type VARCHAR(50), -- Straight Commission, Tiered, Accelerators, Draw Against Commission

  -- Rates
  base_rate DECIMAL(5, 2), -- Percentage
  tiers JSONB, -- Array of tier definitions

  -- Eligibility
  job_title_ids BIGINT[],
  department_ids BIGINT[],

  -- Payment
  payment_frequency VARCHAR(50), -- Monthly, Quarterly, Upon Collection

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employee Commissions
CREATE TABLE payroll.commissions (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES core.employees(id),
  commission_plan_id BIGINT REFERENCES payroll.commission_plans(id),

  -- Period
  period_month SMALLINT,
  period_year INT,

  -- Sales Data
  sales_amount DECIMAL(15, 2),
  commissionable_amount DECIMAL(15, 2),

  -- Commission Calculation
  commission_rate DECIMAL(5, 2),
  commission_amount DECIMAL(15, 2),

  -- Status
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Paid

  -- Payment
  paid_in_payroll_run_id BIGINT,
  paid_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### D. Total Compensation Statements

**Total Rewards Statement:**
```
┌──────────────────────────────────────────────────────┐
│  Total Compensation Statement - 2024                 │
│  John Doe | Software Engineer                       │
├──────────────────────────────────────────────────────┤
│  CASH COMPENSATION                                   │
│  ├─ Base Salary                    $120,000          │
│  ├─ Annual Bonus                    $18,000          │
│  ├─ Overtime                          $2,400          │
│  └─ Total Cash                     $140,400          │
│                                                       │
│  BENEFITS                                            │
│  ├─ Health Insurance                 $12,000          │
│  ├─ Dental Insurance                  $1,200          │
│  ├─ Vision Insurance                    $600          │
│  ├─ Life Insurance                      $500          │
│  ├─ Disability Insurance                $800          │
│  ├─ 401(k) Employer Match             $7,200          │
│  └─ Total Benefits                   $22,300          │
│                                                       │
│  OTHER COMPENSATION                                  │
│  ├─ Stock Options (vested value)    $15,000          │
│  ├─ Commuter Benefits                 $1,500          │
│  ├─ Professional Development          $2,500          │
│  ├─ Gym Membership                      $600          │
│  └─ Total Other                      $19,600          │
│                                                       │
│  TIME OFF                                            │
│  ├─ Paid Time Off (20 days)          $9,230          │
│  ├─ Holidays (10 days)               $4,615          │
│  ├─ Sick Leave (10 days)             $4,615          │
│  └─ Total Time Off Value            $18,460          │
│                                                       │
│  ═══════════════════════════════════════════════     │
│  TOTAL COMPENSATION                 $200,760          │
│  ═══════════════════════════════════════════════     │
│                                                       │
│  [Download PDF]  [Send to Email]                    │
└──────────────────────────────────────────────────────┘
```

#### E. Pay Equity Analysis

**Pay Equity Dashboard:**
```
Pay Equity Analysis - Engineering Department

Gender Pay Gap:
├─ Average Male Salary: $115,000
├─ Average Female Salary: $108,500
├─ Gap: $6,500 (5.7%)
└─ Adjusted for Role/Level: $2,100 (1.8%) ⚠️

Pay by Job Title:
Software Engineer I
├─ Min: $75,000 | Max: $95,000 | Avg: $85,000
├─ Male: $86,200 (n=10)
└─ Female: $83,800 (n=8) [2.8% gap]

Software Engineer II
├─ Min: $95,000 | Max: $120,000 | Avg: $107,500
├─ Male: $109,000 (n=15)
└─ Female: $105,500 (n=12) [3.2% gap]

Recommendations:
⚠️ Review salaries for Software Engineer II females
⚠️ Ensure promotion rates are equitable
✅ Hiring salaries are within 2% (acceptable)
```

#### F. Database Schema

```sql
-- Compensation Review Cycles
CREATE TABLE payroll.compensation_cycles (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),

  cycle_name VARCHAR(255) NOT NULL,
  cycle_type VARCHAR(50) NOT NULL, -- Merit Increase, Bonus, Promotion, Equity Grant

  -- Budget
  total_budget DECIMAL(15, 2),
  budget_percentage DECIMAL(5, 2), -- As % of total payroll

  -- Guidelines
  min_increase_percentage DECIMAL(5, 2),
  max_increase_percentage DECIMAL(5, 2),
  recommended_range_min DECIMAL(5, 2),
  recommended_range_max DECIMAL(5, 2),

  -- Effective Date
  effective_date DATE NOT NULL,

  -- Workflow Dates
  manager_review_start DATE,
  manager_review_end DATE,
  hr_review_start DATE,
  hr_review_end DATE,
  executive_approval_start DATE,
  executive_approval_end DATE,
  communication_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Open, In Review, Approved, Completed

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT
);

-- Compensation Changes
CREATE TABLE payroll.compensation_changes (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),
  compensation_cycle_id BIGINT REFERENCES payroll.compensation_cycles(id),
  employee_id BIGINT NOT NULL REFERENCES core.employees(id),

  -- Current Compensation
  current_base_salary DECIMAL(15, 2),
  current_total_compensation DECIMAL(15, 2),

  -- Proposed Change
  change_type VARCHAR(50), -- Merit Increase, Promotion, Market Adjustment, Bonus
  proposed_base_salary DECIMAL(15, 2),
  proposed_increase_amount DECIMAL(15, 2),
  proposed_increase_percentage DECIMAL(5, 2),

  -- Bonus (if applicable)
  bonus_amount DECIMAL(15, 2),
  bonus_percentage DECIMAL(5, 2),

  -- Justification
  performance_rating VARCHAR(50),
  justification TEXT,
  market_position VARCHAR(50), -- Below, At, Above market
  retention_risk VARCHAR(50), -- Low, Medium, High

  -- Approval Workflow
  manager_recommended BOOLEAN DEFAULT false,
  manager_recommended_at TIMESTAMP,
  manager_recommended_by BIGINT,

  hr_approved BOOLEAN DEFAULT false,
  hr_approved_at TIMESTAMP,
  hr_approved_by BIGINT,

  executive_approved BOOLEAN DEFAULT false,
  executive_approved_at TIMESTAMP,
  executive_approved_by BIGINT,

  -- Effective Date
  effective_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Submitted, Approved, Rejected, Implemented

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bonus Programs
CREATE TABLE payroll.bonus_programs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),

  program_name VARCHAR(255) NOT NULL,
  program_type VARCHAR(50), -- Performance, Signing, Retention, Spot, Referral

  -- Budget
  total_budget DECIMAL(15, 2),

  -- Eligibility
  eligible_job_titles BIGINT[],
  eligible_departments BIGINT[],
  min_tenure_months INT,

  -- Calculation
  calculation_method VARCHAR(50), -- Performance Matrix, Target Percentage, Fixed Amount, Discretionary
  target_bonus_percentage DECIMAL(5, 2),
  performance_multipliers JSONB,

  -- Payment
  payment_date DATE,

  -- Status
  status VARCHAR(50) DEFAULT 'Draft',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT
);

-- Employee Bonuses
CREATE TABLE payroll.bonuses (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES core.organizations(id),
  bonus_program_id BIGINT REFERENCES payroll.bonus_programs(id),
  employee_id BIGINT NOT NULL REFERENCES core.employees(id),

  -- Calculation
  target_bonus_amount DECIMAL(15, 2),
  performance_multiplier DECIMAL(5, 2),
  actual_bonus_amount DECIMAL(15, 2),

  -- Approval
  approved_by BIGINT,
  approved_at TIMESTAMP,

  -- Payment
  payment_date DATE,
  paid_in_payroll_run_id BIGINT,
  paid_at TIMESTAMP,

  -- Status
  status VARCHAR(50) DEFAULT 'Pending',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Phase 3: UK Market Compliance & Retail Features (PRIORITY)

**Target Market:** UK Supermarket & Retail Sector

**Goal:** Implement UK-specific compliance and retail operations features

**Estimated Effort:** 6 months, 4-5 developers

**Strategic Importance:** ⭐⭐⭐⭐⭐ CRITICAL for UK market positioning

---

## 3.1 UK Payroll & HMRC Compliance

### Overview
Complete UK payroll processing with PAYE, National Insurance, RTI submissions, and statutory payments.

### What to Include:

#### A. PAYE Tax Calculation Engine

**User Story:**
> As a payroll administrator, I want the system to automatically calculate PAYE tax based on employee tax codes so that payroll is accurate and HMRC compliant.

**Requirements:**

1. **Tax Code Management**
   - Support all UK tax codes (1257L, BR, D0, D1, K codes, NT, 0T)
   - Tax basis: Cumulative vs Week 1/Month 1
   - Emergency tax codes
   - Scottish tax codes (S prefix)
   - Welsh tax codes (C prefix)

2. **Tax Calculation Logic**
   - Personal allowance calculation
   - Tax-free income
   - Taxable income (gross - personal allowance)
   - Progressive tax bands (20%, 40%, 45%)
   - Cumulative tax calculation (year-to-date)
   - Week 1/Month 1 non-cumulative

3. **Tax Year Management**
   - Tax year: 6th April to 5th April
   - Automatic tax year rollover
   - P45 starter declarations (A, B, C)
   - Tax code changes mid-year

**Database Schema:**
```sql
-- Already defined in DATABASE_SCHEMA_DESIGN.md
-- uk_compliance.paye_settings
-- payroll.payslips (with tax calculations)
```

**API Endpoints:**
```
GET    /api/v1/uk/paye/tax-codes
GET    /api/v1/uk/paye/calculate?gross=2500&tax_code=1257L&period=1
POST   /api/v1/uk/paye/employee/:id/tax-code
GET    /api/v1/uk/paye/tax-year/current
POST   /api/v1/uk/paye/tax-year/rollover
```

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ Employee PAYE Settings - Zain (EMP-105)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Tax Code: [1257L     ▼] Basis: [Cumulative  ▼]            │
│ NI Number: QQ 12 34 56 C    NI Category: [A ▼]            │
│                                                             │
│ Student Loan: [✓] Plan 2      Postgraduate Loan: [ ]      │
│                                                             │
│ Effective From: [06/04/2024] Effective To: [05/04/2025]   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Tax Calculation Preview (Monthly)                    │   │
│ ├─────────────────────────────────────────────────────┤   │
│ │ Gross Pay:                              £2,500.00    │   │
│ │ Personal Allowance (1/12):             £1,047.50    │   │
│ │ Taxable Income:                         £1,452.50    │   │
│ │ Tax (20%):                                £290.50    │   │
│ │ National Insurance (12%):                 £271.08    │   │
│ │ Student Loan (9% over £2,274):             £20.34    │   │
│ │ Net Pay:                                £1,918.08    │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ [Save Changes]  [Cancel]  [View P45]  [View P60]          │
└─────────────────────────────────────────────────────────────┘
```

**Calculation Example (JavaScript/TypeScript):**
```typescript
interface PAYECalculation {
  taxCode: string;
  taxBasis: 'Cumulative' | 'Week1Month1';
  period: number; // 1-12 for monthly, 1-52 for weekly
  grossPay: number;
  personalAllowance: number;
  taxableIncome: number;
  taxDue: number;
  previousTaxYTD?: number;
}

function calculatePAYE(
  grossPay: number,
  taxCode: string,
  period: number,
  taxBasis: 'Cumulative' | 'Week1Month1',
  previousTaxYTD: number = 0
): PAYECalculation {

  // Extract personal allowance from tax code (e.g., 1257L = £12,570)
  const allowanceCode = parseInt(taxCode.replace(/[^0-9]/g, ''));
  const annualPersonalAllowance = allowanceCode * 10;
  const periodPersonalAllowance = annualPersonalAllowance / 12; // Monthly

  // Calculate taxable income
  const taxableIncome = Math.max(0, grossPay - periodPersonalAllowance);

  // UK Tax Bands 2024/25
  const basicRate = 0.20;  // 20% on £12,571 - £50,270
  const higherRate = 0.40; // 40% on £50,271 - £125,140
  const additionalRate = 0.45; // 45% over £125,140

  const basicRateThreshold = 50270 / 12;
  const higherRateThreshold = 125140 / 12;

  let taxDue = 0;

  if (taxableIncome <= basicRateThreshold) {
    taxDue = taxableIncome * basicRate;
  } else if (taxableIncome <= higherRateThreshold) {
    taxDue = (basicRateThreshold * basicRate) +
             ((taxableIncome - basicRateThreshold) * higherRate);
  } else {
    taxDue = (basicRateThreshold * basicRate) +
             ((higherRateThreshold - basicRateThreshold) * higherRate) +
             ((taxableIncome - higherRateThreshold) * additionalRate);
  }

  // Cumulative adjustment
  if (taxBasis === 'Cumulative' && period > 1) {
    const expectedTaxYTD = taxDue * period;
    taxDue = expectedTaxYTD - previousTaxYTD;
  }

  return {
    taxCode,
    taxBasis,
    period,
    grossPay,
    personalAllowance: periodPersonalAllowance,
    taxableIncome,
    taxDue: Math.round(taxDue * 100) / 100
  };
}
```

---

#### B. National Insurance Calculation

**Requirements:**

1. **NI Categories**
   - Category A (Standard)
   - Category B (Married women, reduced rate)
   - Category C (Over state pension age, exempt)
   - Category H (Apprentice under 25)
   - Category M (Over 21, under state pension age)
   - Category Z (Under 21, exempt)

2. **NI Thresholds (2024/25)**
   - Lower Earnings Limit (LEL): £123/week, £533/month
   - Primary Threshold (PT): £242/week, £1,048/month
   - Upper Earnings Limit (UEL): £967/week, £4,189/month
   - Secondary Threshold (ST): £175/week, £758/month

3. **NI Rates**
   - Employee: 12% (between PT and UEL), 2% (above UEL)
   - Employer: 13.8% (above ST)

**Calculation Example:**
```typescript
function calculateNI(
  grossPay: number,
  niCategory: string,
  frequency: 'Weekly' | 'Monthly'
): { employeeNI: number; employerNI: number } {

  const thresholds = frequency === 'Monthly' ? {
    lel: 533,
    pt: 1048,
    uel: 4189,
    st: 758
  } : {
    lel: 123,
    pt: 242,
    uel: 967,
    st: 175
  };

  let employeeNI = 0;
  let employerNI = 0;

  // Employee NI (Category A standard)
  if (niCategory === 'A') {
    if (grossPay > thresholds.uel) {
      employeeNI = ((thresholds.uel - thresholds.pt) * 0.12) +
                   ((grossPay - thresholds.uel) * 0.02);
    } else if (grossPay > thresholds.pt) {
      employeeNI = (grossPay - thresholds.pt) * 0.12;
    }
  }

  // Employer NI (13.8% above secondary threshold)
  if (grossPay > thresholds.st) {
    employerNI = (grossPay - thresholds.st) * 0.138;
  }

  return {
    employeeNI: Math.round(employeeNI * 100) / 100,
    employerNI: Math.round(employerNI * 100) / 100
  };
}
```

---

#### C. RTI (Real Time Information) Submissions

**User Story:**
> As a payroll administrator, I want to submit FPS (Full Payment Submission) to HMRC automatically after each payroll run so that we remain compliant with RTI regulations.

**Requirements:**

1. **FPS (Full Payment Submission)**
   - Submit on or before payment date
   - Include: Employee details, payments, tax, NI, student loan deductions
   - XML format to HMRC Gateway

2. **EPS (Employer Payment Summary)**
   - Submit if no payments in a month
   - Claim Employment Allowance
   - Recover statutory payments (SSP, SMP)

3. **HMRC Gateway Integration**
   - Test environment for development
   - Production environment
   - Government Gateway credentials
   - IRmark validation

**API Endpoints:**
```
POST   /api/v1/uk/rti/fps/submit
POST   /api/v1/uk/rti/eps/submit
GET    /api/v1/uk/rti/submissions
GET    /api/v1/uk/rti/submissions/:id/status
POST   /api/v1/uk/rti/submissions/:id/resubmit
```

**FPS XML Structure (Simplified):**
```xml
<FPS>
  <Header>
    <Sender>CompliHR Ltd</Sender>
    <EmployerReference>123/AB45678</EmployerReference>
    <TaxYear>2024-25</TaxYear>
    <PaymentDate>2025-01-31</PaymentDate>
  </Header>
  <Employees>
    <Employee>
      <NINO>QQ123456C</NINO>
      <FirstName>Zain</FirstName>
      <Surname>Khan</Surname>
      <GrossPay>2500.00</GrossPay>
      <TaxDeducted>290.50</TaxDeducted>
      <EmployeeNI>271.08</EmployeeNI>
      <EmployerNI>313.44</EmployerNI>
      <StudentLoan>20.34</StudentLoan>
    </Employee>
  </Employees>
</FPS>
```

---

#### D. Statutory Payments

**1. Statutory Sick Pay (SSP)**
- Eligibility: Sick for 4+ consecutive days
- Waiting days: First 3 days unpaid
- Rate: £116.75/week (2024/25)
- Maximum: 28 weeks
- Recoverable: Small employers can recover some SSP

**2. Statutory Maternity Pay (SMP)**
- Eligibility: 26 weeks continuous employment before 15th week before baby due
- Rate: 90% of average weekly earnings for first 6 weeks, then £184.03/week or 90% (whichever lower)
- Duration: Up to 39 weeks
- Recoverable: 92% or 103% (small employers)

**UI for SSP:**
```
┌─────────────────────────────────────────────────────────────┐
│ Statutory Sick Pay (SSP) - Zain (EMP-105)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Absence Start: [15/01/2025] End: [25/01/2025]             │
│ Total Days Off: 11 days (including weekends)               │
│                                                             │
│ Waiting Days (unpaid): 3 days                              │
│ SSP Qualifying Days: 6 days (Mon-Fri)                      │
│                                                             │
│ SSP Rate: £116.75/week = £23.35/day                        │
│ Total SSP: £140.10 (6 days × £23.35)                       │
│                                                             │
│ Fit Note Received: [✓] Yes  Expiry: [25/01/2025]          │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ SSP will be included in next payroll                 │   │
│ │ Recovery from HMRC: £140.10 (if eligible)           │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ [Approve SSP]  [Reject]  [Request Fit Note]               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3.2 UK Retail Operations Features

### Overview
Retail-specific features for supermarket staff management.

---

#### A. Till Management System

**User Story:**
> As a store manager, I want to assign cashiers to specific tills and track their float reconciliation so that I can identify discrepancies and ensure accountability.

**Requirements:**

1. **Till Assignment**
   - Assign employee to till at start of shift
   - Record opening float amount
   - Track till number, department, location

2. **Till Operations**
   - Clock in/out linked to till
   - Break tracking during till operation
   - Supervisor override/access

3. **Till Reconciliation**
   - Expected closing float
   - Actual cash count
   - Variance calculation
   - Variance tolerance (e.g., ±£5)
   - Investigation workflow for out-of-tolerance variances

4. **Transaction Summary**
   - Total transactions
   - Card vs cash payments
   - Refunds processed
   - Sales total

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ Till Assignment - TILL-03                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Employee: [Zain (EMP-105)         ▼]                       │
│ Date: [15/01/2025]  Shift: [10:00 - 18:00]                │
│                                                             │
│ Opening Float: £[150.00]                                    │
│ Opened At: 10:05                                            │
│                                                             │
│ ═══════════════════════════════════════════════════════    │
│                                                             │
│ Shift in Progress...                                        │
│                                                             │
│ Transactions Today: 142                                     │
│ Total Sales: £4,267.50                                      │
│ Card Payments: £3,890.25  Cash: £377.25                    │
│ Refunds: £42.00                                             │
│                                                             │
│ ═══════════════════════════════════════════════════════    │
│                                                             │
│ [ Close Till ]                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

(After clicking Close Till)

┌─────────────────────────────────────────────────────────────┐
│ Till Reconciliation - TILL-03                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Expected Float: £527.25                                     │
│ (Opening £150 + Cash Sales £377.25)                        │
│                                                             │
│ Actual Cash Count: £[525.00]                                │
│                                                             │
│ Variance: -£2.25 ✓ Within Tolerance (±£5)                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Breakdown:                                           │   │
│ │ £50 notes:    2  = £100.00                          │   │
│ │ £20 notes:   18  = £360.00                          │   │
│ │ £10 notes:    4  = £40.00                           │   │
│ │ £5 notes:     3  = £15.00                           │   │
│ │ Coins:            = £10.00                          │   │
│ │ Total:            = £525.00                         │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Notes: [Small shortage, within acceptable range]           │
│                                                             │
│ [Reconcile & Close]  [Flag for Investigation]             │
└─────────────────────────────────────────────────────────────┘
```

**Database:** Already defined in `retail.till_assignments`

**API Endpoints:**
```
POST   /api/v1/retail/till-assignments
GET    /api/v1/retail/till-assignments/today
POST   /api/v1/retail/till-assignments/:id/open
POST   /api/v1/retail/till-assignments/:id/close
POST   /api/v1/retail/till-assignments/:id/reconcile
GET    /api/v1/retail/till-assignments/variances
```

---

#### B. Break Compliance Tracker

**User Story:**
> As a shift supervisor, I want to ensure all employees working 6+ hour shifts take their mandatory 20-minute break so that we comply with UK employment law.

**UK Law:**
- Workers are entitled to a 20-minute rest break during shifts longer than 6 hours
- Break should be uninterrupted
- Break can be unpaid (at employer's discretion)

**Requirements:**

1. **Automatic Entitlement Detection**
   - Flag shifts >= 6 hours
   - Calculate minimum break duration (20 minutes)

2. **Break Scheduling**
   - Assign break time within shift
   - Ensure break is mid-shift (not at start/end)
   - Track break start/end times

3. **Compliance Monitoring**
   - Alert if break not taken
   - Track break waivers (if employee voluntarily waives)
   - Report violations to manager

4. **Break Tracking**
   - Clock in/out for breaks
   - Multiple breaks allowed
   - Total break time calculation

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ Break Compliance - Today's Shifts                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠️  2 employees entitled to breaks have not taken them     │
│                                                             │
│ Employee          Shift         Break Due  Status          │
│ ────────────────────────────────────────────────────────   │
│ Zain (EMP-105)   10:00-18:00   20 min     ✓ Taken 13:15   │
│ Sarah (EMP-112)  09:00-17:00   20 min     ✓ Taken 12:30   │
│ Ahmed (EMP-118)  11:00-19:00   20 min     ⚠️ NOT TAKEN    │
│ Lisa (EMP-124)   08:00-16:00   20 min     ⚠️ NOT TAKEN    │
│                                                             │
│ [Send Reminder]  [Generate Report]  [View Calendar]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Break Reminder Notification:**
```
📱 SMS to Ahmed (EMP-118)
─────────────────────────────────
Hi Ahmed, you're entitled to a 20-minute break
during your shift today (11:00-19:00).

Please take your break before 16:00.

Tap here to clock out for break:
https://complihr.com/break/start?emp=118

- CompliHR System
```

**Database:** Already defined in `retail.break_compliance`

---

#### C. Food Safety Certification Management

**User Story:**
> As an HR manager, I want to track food safety certifications for all food-handling staff and receive alerts before certifications expire so that we maintain FSA compliance.

**UK Requirements:**
- All food handlers must have Level 2 Food Hygiene certification
- Certifications typically valid for 3 years
- Allergen awareness training mandatory
- FSA (Food Standards Agency) compliance

**Requirements:**

1. **Certification Tracking**
   - Certification type (Level 1, Level 2, Allergen)
   - Awarding body (CIEH, RSPH, Highfield)
   - Issue date, expiry date
   - Certificate number
   - Digital certificate upload

2. **Renewal Workflow**
   - 90-day expiry warning
   - 30-day urgent warning
   - Block shifts for expired certifications
   - Training course booking integration

3. **Compliance Reporting**
   - % of staff certified
   - Upcoming expirations
   - Training history

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ Food Safety Certifications                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠️  3 certifications expiring within 30 days               │
│                                                             │
│ Employee      Type           Expiry      Status   Action   │
│ ────────────────────────────────────────────────────────   │
│ Zain         Level 2 CIEH   15/03/2025  ⚠️ Soon   [Renew] │
│ Sarah        Level 2 RSPH   Active      ✓ Valid   -       │
│ Ahmed        Allergen       10/02/2025  ⚠️ URGENT [Book]  │
│ Lisa         Level 2 CIEH   Expired     ❌ BLOCKED [Train]│
│                                                             │
│ Compliance: 92% (138/150 staff certified)                  │
│                                                             │
│ [Upload Certificate]  [Book Training]  [Download Report]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Automated Alert Email:**
```
Subject: URGENT: Food Safety Certificate Expiring - Ahmed (EMP-118)

Hi Store Manager,

Ahmed's Allergen Awareness certification expires in 15 days (10/02/2025).

Without a valid certificate, Ahmed cannot work in food preparation areas.

Recommended Actions:
1. Book renewal training: [View Available Courses]
2. Restrict Ahmed to non-food departments until renewed
3. Download compliance report for FSA inspection

Best regards,
CompliHR Compliance System
```

---

#### D. Monthly Performance Reviews (Retail Staff)

**User Story:**
> As a shift supervisor, I want to conduct monthly performance reviews for my team members covering attendance, customer service, and till accuracy so that I can provide regular feedback and identify training needs.

**Requirements:**

1. **Review Template (Retail-Specific)**
   - Attendance & punctuality (days present, late arrivals)
   - Customer service rating (1-5)
   - Teamwork rating (1-5)
   - Till accuracy (for cashiers)
   - Stock handling (for shelf stackers)
   - Compliance (hygiene, safety)

2. **KPI Integration**
   - Auto-populate attendance data
   - Import till variance data
   - Calculate average ratings

3. **Action Planning**
   - Goals for next month
   - Training needs
   - Development actions

4. **Sign-Off Workflow**
   - Manager completes review
   - Employee reviews and signs
   - HR escalation if needed

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────┐
│ Monthly Review - Zain (EMP-105) - January 2025             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Reviewer: Sarah Johnson (Store Manager)                    │
│ Review Date: 31/01/2025                                     │
│                                                             │
│ ┌─ ATTENDANCE & PUNCTUALITY ─────────────────────────┐     │
│ │ Days Present: 22/23  Days Absent: 1  Times Late: 0 │     │
│ │ Rating: ⭐⭐⭐⭐⭐ (5/5)                                │     │
│ └────────────────────────────────────────────────────┘     │
│                                                             │
│ ┌─ PERFORMANCE RATINGS ─────────────────────────────┐      │
│ │ Customer Service:    ⭐⭐⭐⭐⭐ (5/5)                 │      │
│ │ Teamwork:            ⭐⭐⭐⭐⚫ (4/5)                 │      │
│ │ Till Accuracy:       ⭐⭐⭐⭐⭐ (5/5) -£2.25 avg    │      │
│ │ Productivity:        ⭐⭐⭐⭐⚫ (4/5) 18 items/min  │      │
│ │ Compliance:          ⭐⭐⭐⭐⭐ (5/5)                 │      │
│ └────────────────────────────────────────────────────┘     │
│                                                             │
│ Overall Rating: 4.6/5 - Exceeds Expectations               │
│                                                             │
│ ┌─ ACHIEVEMENTS ────────────────────────────────────┐      │
│ │ [Excellent attendance - no late arrivals          ]│      │
│ │ [Consistently positive customer feedback          ]│      │
│ │ [Till accuracy well within tolerance              ]│      │
│ └────────────────────────────────────────────────────┘     │
│                                                             │
│ ┌─ AREAS FOR IMPROVEMENT ───────────────────────────┐      │
│ │ [Work on stock replenishment speed                ]│      │
│ │ [Consider training for team leader role           ]│      │
│ └────────────────────────────────────────────────────┘     │
│                                                             │
│ ┌─ GOALS FOR FEBRUARY ──────────────────────────────┐      │
│ │ [ ] Maintain 100% attendance                      │      │
│ │ [ ] Complete team leader training module          │      │
│ │ [ ] Mentor new starter on till procedures         │      │
│ └────────────────────────────────────────────────────┘     │
│                                                             │
│ Manager Signature: [Sarah Johnson ✓] 31/01/2025           │
│ Employee Signature: [Pending]                              │
│                                                             │
│ [Send to Employee]  [Save Draft]  [Complete & Lock]       │
└─────────────────────────────────────────────────────────────┘
```

**Mobile View (Employee):**
```
┌──────────────────────────────┐
│  📱 Your January Review       │
├──────────────────────────────┤
│                              │
│  Overall: 4.6/5 ⭐⭐⭐⭐⭐    │
│  Exceeds Expectations        │
│                              │
│  Your Ratings:               │
│  ✓ Attendance       5/5      │
│  ✓ Customer Service 5/5      │
│  ✓ Teamwork         4/5      │
│  ✓ Till Accuracy    5/5      │
│  ✓ Productivity     4/5      │
│                              │
│  Manager Comments:           │
│  "Excellent work this month! │
│  Your customer service is    │
│  outstanding. Let's work on  │
│  stock speed next month."    │
│                              │
│  Goals for February:         │
│  □ 100% attendance           │
│  □ Team leader training      │
│  □ Mentor new starter        │
│                              │
│  [✓ I acknowledge]           │
│  [Add my comments]           │
│                              │
└──────────────────────────────┘
```

**Database:** Already defined in `performance.monthly_reviews` and `performance.monthly_review_kpis`

---

## 3.3 Mobile Application (Priority 1)

### Overview
Native iOS and Android app for frontline retail workers.

**Target Users:** Hourly/shift workers with limited desktop access

**Use Cases:**
1. Clock in/out from phone
2. View upcoming shifts
3. Request shift swaps
4. Request time off
5. View payslips
6. Acknowledge performance reviews
7. Upload documents (fit notes, certificates)

**Design Principles:**
- **Simple**: Large buttons, minimal text
- **Fast**: < 2 seconds to clock in
- **Offline-capable**: Queue actions when offline
- **Low-literacy friendly**: Icons over text where possible

**Key Screens:**

```
┌──────────────────────────────┐
│  Home Screen                 │
├──────────────────────────────┤
│                              │
│  👋 Hi Zain                  │
│                              │
│  ┌────────────────────────┐ │
│  │   CLOCK IN             │ │
│  │   ⏰ 09:58             │ │
│  │   [Tap to Start Shift] │ │
│  └────────────────────────┘ │
│                              │
│  Your Next Shifts:           │
│  ┌────────────────────────┐ │
│  │ Tomorrow                │ │
│  │ 10:00 - 18:00          │ │
│  │ TILL-03                │ │
│  └────────────────────────┘ │
│                              │
│  ┌────────────────────────┐ │
│  │ Wednesday               │ │
│  │ 14:00 - 22:00          │ │
│  │ Stock Room             │ │
│  └────────────────────────┘ │
│                              │
│  Quick Actions:              │
│  [📅 Request Leave]          │
│  [🔄 Swap Shift]             │
│  [💰 View Payslip]           │
│                              │
└──────────────────────────────┘
```

**Tech Stack:**
- React Native (cross-platform)
- Offline storage: AsyncStorage / SQLite
- Push notifications: Firebase Cloud Messaging
- Biometric auth: Face ID / Touch ID / Fingerprint

**API Integration:**
```typescript
// Clock In Example
async function clockIn(location: GeolocationPosition) {
  const response = await fetch('/api/v1/attendance/punch-in', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      employee_id: currentUser.id,
      punch_timestamp: new Date().toISOString(),
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      device_info: getDeviceInfo()
    })
  });

  if (response.ok) {
    showSuccess('Clocked in successfully!');
    vibrate();
  }
}
```

---

## Implementation Roadmap (UK Market Focus)

### Phase 1: UK Compliance (Months 1-3)
- ✅ PAYE tax calculation engine
- ✅ National Insurance calculation
- ✅ RTI submission framework (HMRC integration)
- ✅ Statutory payments (SSP, SMP)
- ✅ Auto-enrolment pensions
- ✅ P45/P60 generation

### Phase 2: Mobile App (Months 3-6)
- 📱 Mobile app MVP (iOS/Android)
- 📱 Clock in/out
- 📱 Shift viewing
- 📱 Leave requests
- 📱 Push notifications
- 📱 SMS integration

### Phase 3: Retail Operations (Months 6-9)
- 🏪 Till management system
- 🏪 Break compliance tracker
- 🏪 Food safety certifications
- 🏪 Monthly performance reviews
- 🏪 Shift swap workflow

### Phase 4: Advanced Features (Months 9-12)
- 📊 Labour cost forecasting
- 📊 Rota auto-scheduling
- 📊 POS integration
- 📊 Right to Work checks
- 📊 Advanced analytics

---

## Conclusion

This feature specification roadmap has been completely redesigned for the **UK supermarket retail market**. The focus has shifted from generic global HRMS features to:

✅ **UK Compliance First**: PAYE, NI, RTI, statutory payments
✅ **Retail Operations**: Till management, break compliance, food safety
✅ **Frontline Workers**: Mobile-first, simple UI, SMS notifications
✅ **Monthly Reviews**: Continuous feedback vs annual reviews
✅ **Hourly Worker Focus**: Shift-based scheduling, hourly wage tracking

**Strategic Positioning:**
CompliHR is positioned as the **only integrated UK retail workforce management system** that combines:
- UK payroll compliance
- Time & attendance
- Retail operations (tills, breaks, certifications)
- Performance management
- Mobile app for frontline workers

This makes CompliHR uniquely competitive in the UK retail sector, with no direct competitor offering all these features in one platform.

---

**Document Version:** 2.0 - UK Retail Market Edition
**Author:** Claude (Anthropic)
**Date:** January 2025
**Status:** Ready for Implementation
**Target Market:** UK Supermarket & Retail Sector
