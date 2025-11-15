# CompliHR Feature List - UK Retail Market Update Summary

**Document Version:** 1.0
**Date:** January 2025
**Updated File:** `CompliHR_Feature_List_UK_Retail_Complete.csv`

---

## Overview

The feature list has been comprehensively updated based on our strategic analysis for the **UK Supermarket Retail Market**. The updated CSV file now includes:

1. ✅ **Database schema and table mappings** for every feature
2. ✅ **UK retail-specific features** flagged with "Yes" in UK Retail Specific column
3. ✅ **Priority levels** (P1, P2, P3) aligned with competitive analysis
4. ✅ **Phase assignments** for implementation roadmap

---

## New Columns Added

### 1. Priority Column
- **P1**: Phase 1 - Critical features (0-9 months)
- **P2**: Phase 2 - Important features (9-15 months)
- **P3**: Phase 3 - Nice-to-have features (15-24 months)

### 2. Database Schema Column
Maps each feature to the PostgreSQL schema from our 10-schema architecture:
- `core` - Employee core data
- `payroll` - Payroll processing
- `time_tracking` - Time and attendance
- `leave` - Leave management
- `uk_compliance` - UK-specific compliance (PAYE, NI, RTI, pensions)
- `retail` - Retail-specific features (tills, breaks, food safety)
- `performance` - Performance reviews and KPIs
- `expenses` - Expense management
- `compliance` - General compliance
- `admin` - System administration
- `audit` - Audit logging

### 3. Database Table(s) Column
Specific table names within each schema that the feature uses.

### 4. UK Retail Specific Column
- **Yes** = Feature is unique to UK retail market
- **No** = Standard HRMS feature

### 5. Phase Column
- **Phase 1**: Mobile-First (0-9 months)
- **Phase 2**: Retail Operations (9-15 months)
- **Phase 3**: Advanced Features (15-24 months)

---

## Major Features Added (UK Retail Market)

### 📱 Mobile App (P1 - Phase 1)
**Critical for frontline workers**

| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Native iOS/Android app for clock in/out | time_tracking | clock_events, shifts | 78 |
| Mobile shift view | time_tracking | shifts, shift_assignments | 56 |
| Mobile leave requests | leave | leave_requests, leave_balances | 48 |
| Push notifications | admin | notifications | 49 |
| SMS notifications | admin | notification_preferences | 38 |

**Total Mobile App:** ~269 hours

---

### 💷 UK Payroll & Compliance (P1 - Phase 1)
**Competitive differentiator vs Deputy/RotaCloud**

#### PAYE Tax Calculation
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Configure PAYE tax codes | uk_compliance | paye_settings | 40 |
| Configure tax bands | uk_compliance | tax_bands | 31 |
| Calculate PAYE tax | payroll | payslips | (integrated) |

#### National Insurance
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Configure NI categories (A-M) | uk_compliance | ni_categories | 31 |
| Set NI thresholds | uk_compliance | ni_thresholds | 25 |
| Calculate NI | payroll | payslips | (integrated) |

#### RTI (Real Time Information) Submissions
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Generate FPS (Full Payment Submission) | uk_compliance | rti_submissions | 61 |
| Generate EPS (Employer Payment Summary) | uk_compliance | rti_submissions | 53 |
| Submit to HMRC Gateway | uk_compliance | rti_submissions | 49 |

**Total RTI:** 163 hours

#### Statutory Payments
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| SSP (Statutory Sick Pay) | uk_compliance | statutory_sick_pay | 45 |
| SMP (Statutory Maternity Pay) | uk_compliance | statutory_maternity_pay | 45 |
| SPP (Statutory Paternity Pay) | uk_compliance | statutory_paternity_pay | 36 |

**Total Statutory:** 126 hours

#### Student Loans
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Configure plans (1, 2, 4, Postgrad) | uk_compliance | student_loan_deductions | 42 |
| Calculate deductions | uk_compliance | student_loan_deductions | 34 |

**Total Student Loans:** 76 hours

#### Pensions (Auto-Enrolment)
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Auto-enrolment eligibility | uk_compliance | pension_auto_enrolment | 45 |
| Calculate contributions | uk_compliance | pension_contributions | 42 |
| Track opt-outs/re-enrolment | uk_compliance | pension_opt_outs | 34 |

**Total Pensions:** 121 hours

#### Year-End Reporting
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Generate P60s | uk_compliance | p60_records | 45 |
| Generate P45s | uk_compliance | p45_records | 36 |

**Total Year-End:** 81 hours

#### UK Compliance Monitoring
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| National Minimum/Living Wage tracking | uk_compliance | minimum_wage_compliance | 40 |
| Working Time Directive (48-hour week) | uk_compliance | working_time_compliance | 42 |
| Holiday pay (12.07% casual workers) | uk_compliance | holiday_pay_accruals | 38 |

**Total Compliance:** 120 hours

**Total UK Payroll & Compliance:** ~758 hours

---

### 🏪 Retail-Specific Features (P1 - Phase 1)

#### Till Management
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Configure tills | retail | tills | 28 |
| Assign employees to tills | retail | till_assignments | 31 |
| Till reconciliation (variance tracking) | retail | till_assignments | 38 |
| Employee view till assignment | retail | till_assignments | 18 |
| Employee record float | retail | till_assignments | 31 |

**Total Till Management:** 146 hours

#### Break Compliance
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Break tracking (6+ hour rule) | retail | break_compliance, clock_events | 26 |
| Break compliance alerts | retail | break_compliance | 21 |
| Manager break monitoring | retail | break_compliance | 31 |
| Break compliance reports | retail | break_compliance | 25 |
| Manager violation alerts | retail | break_compliance | 23 |

**Total Break Compliance:** 126 hours

#### Food Safety Certifications
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Employee view certifications | retail | food_safety_certifications | 16 |
| Employee request renewal | retail | food_safety_certifications | 21 |
| Manager certificate management | retail | food_safety_certifications | 31 |
| Expiry tracking | retail | food_safety_certifications | 25 |
| Training records | retail | food_safety_training | 28 |

**Total Food Safety:** 121 hours

#### Age-Restricted Products
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Product authorization (Challenge 25) | retail | age_restricted_products | 31 |

**Total Age Restrictions:** 31 hours

**Total Retail Features (P1):** ~424 hours

---

### 📊 Performance Management (P1 - Phase 1)
**Monthly reviews for retail staff**

| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Employee view monthly reviews | performance | monthly_reviews | 21 |
| Employee view review history | performance | monthly_reviews | 20 |
| Employee view KPIs | performance | employee_kpis | 28 |
| Manager conduct reviews | performance | monthly_reviews | 40 |
| Manager review templates | performance | review_templates | 31 |
| Configure retail KPIs | performance | kpi_definitions | 38 |
| Track employee KPIs | performance | employee_kpis | 31 |
| KPI analytics dashboard | performance | employee_kpis, monthly_reviews | 38 |

**Total Performance Management:** 247 hours

---

### 📈 Phase 2 Features (Retail Operations)

#### Labour Cost Forecasting
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Forecast weekly labour costs | retail | labour_forecasts | 51 |
| Budget management | retail | labour_budgets | 40 |
| Department costs | retail | labour_forecasts, departments | 31 |

**Total Labour Forecasting:** 122 hours

#### Advanced Scheduling
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Rota templates | time_tracking | rota_templates | 38 |
| Skills-based scheduling | time_tracking | shifts, food_safety_certifications | 40 |
| Auto-schedule breaks | time_tracking | shifts | 34 |
| Shift swap management | time_tracking | shift_swaps | 31 |

**Total Scheduling:** 143 hours

#### POS Integration
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Import POS sales data | retail | pos_transactions | 45 |
| Link to productivity KPIs | retail | pos_transactions, employee_kpis | 42 |

**Total POS Integration:** 87 hours

**Total Phase 2 Retail Features:** 352 hours

---

### 🔐 Phase 3 Features (Advanced Compliance)

#### Right to Work
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Digital document verification | uk_compliance | right_to_work_checks | 45 |
| Visa expiry tracking | uk_compliance | visa_expiry_tracking | 34 |

**Total Right to Work:** 79 hours

#### Employee Self-Service
| Feature | Database Schema | Table | Hours |
|---------|----------------|-------|-------|
| Payslip portal | uk_compliance | payslips | 31 |
| P60 self-service | uk_compliance | p60_records | 25 |
| Pension dashboard | uk_compliance | pension_contributions | 31 |

**Total Self-Service:** 87 hours

**Total Phase 3 UK Features:** 166 hours

---

## Hours Summary by Category

### Original Features (from previous CSV)
**Total:** ~2,376 hours

### New UK Retail Features Added

| Category | P1 Hours | P2 Hours | P3 Hours | Total |
|----------|---------|---------|---------|-------|
| **Mobile App** | 269 | 0 | 0 | 269 |
| **UK Payroll & Compliance** | 758 | 0 | 166 | 924 |
| **Retail Operations** | 424 | 352 | 0 | 776 |
| **Performance Management** | 247 | 0 | 0 | 247 |
| **Rust Payroll Engine** | 0 | 180 | 0 | 180 |
| **Total New Features** | **1,698** | **532** | **166** | **2,396** |

### Grand Total
- **Original features:** 2,376 hours
- **New UK retail features:** 2,396 hours
- **Grand Total:** 4,772 hours

---

## Development Timeline Estimate

### Phase 1: Mobile-First + Core UK Features (0-9 months)
**Hours:** 3,500 hours (original P1 + new UK P1)
**Team:** 4 developers
**Duration:** ~9 months

**Breakdown:**
- Month 1-3: Core HRMS + Mobile app foundation
- Month 4-6: UK payroll (PAYE, NI, RTI)
- Month 7-9: Retail features (tills, breaks, food safety)

### Phase 2: Retail Operations (9-15 months)
**Hours:** ~600 hours
**Team:** 3 developers
**Duration:** 6 months

**Breakdown:**
- Labour forecasting
- Advanced scheduling
- POS integration

### Phase 3: Advanced Features (15-24 months)
**Hours:** ~900 hours
**Team:** 2-3 developers
**Duration:** 9 months

**Breakdown:**
- Right to Work verification
- Employee self-service portal
- Advanced reporting

---

## Database Schema Utilization

### Schemas by Feature Count

| Schema | Feature Count | Key Tables |
|--------|--------------|------------|
| **uk_compliance** | 35 | paye_settings, ni_categories, rti_submissions, pensions |
| **retail** | 28 | tills, till_assignments, break_compliance, food_safety |
| **time_tracking** | 32 | clock_events, shifts, attendance_records, timesheets |
| **payroll** | 18 | payslips, payroll_runs, salary_structures |
| **leave** | 12 | leave_requests, leave_balances, leave_types |
| **performance** | 10 | monthly_reviews, employee_kpis, review_templates |
| **core** | 25 | employees, departments, designations |
| **admin** | 22 | users, roles, permissions, notifications |
| **audit** | 5 | activity_logs, *_history tables |
| **expenses** | 8 | expense_claims, expense_categories |
| **compliance** | 6 | compliance_logs, certifications |

---

## Competitive Feature Comparison

### Features CompliHR Will Have (After Phase 1)

✅ **Better than Deputy:**
- UK payroll (PAYE, NI, RTI) - Deputy doesn't have
- Till management - Deputy doesn't have
- Break compliance tracking - Deputy doesn't have
- Food safety certifications - Deputy doesn't have
- Monthly performance reviews - Deputy doesn't have

✅ **Better than RotaCloud:**
- Full payroll (RotaCloud has no payroll)
- Till management
- Performance management
- Break compliance

✅ **Better than BrightHR:**
- Till management (BrightHR is not retail-focused)
- Monthly reviews for retail staff
- Break compliance automation
- Mobile app (BrightHR is desktop-first)

✅ **Better than Paycircle:**
- Time tracking (Paycircle is payroll-only)
- Retail operations
- Performance management
- Till management

### Unique Competitive Advantages

**Only CompliHR will have:**
1. ✅ Integrated UK payroll + time tracking + retail operations + performance
2. ✅ Till management with reconciliation
3. ✅ Break compliance automation (UK 6-hour rule)
4. ✅ Food safety certification tracking
5. ✅ Monthly performance reviews (not annual)
6. ✅ Retail KPIs (till accuracy, items/min)
7. ✅ HMRC RTI ready (FPS/EPS submissions)
8. ✅ Mobile-first for frontline workers
9. ✅ Auto-enrolment pensions
10. ✅ Working Time Directive monitoring

---

## Technology Stack Updates

### Backend Changes
- **Original:** Node.js + MongoDB
- **Updated:** Node.js (NestJS) + **PostgreSQL 14+** (10 schemas)
- **Phase 2 Addition:** Rust microservice for payroll calculations (optional performance optimization)

### Database
- **Original:** Single MongoDB database
- **Updated:** PostgreSQL with 10 logical schemas
  - Better for complex joins (payroll calculations)
  - ACID compliance for financial transactions
  - Row-level security for multi-tenancy
  - Better audit trail support

### Mobile
- **New:** React Native + Expo
- **Push Notifications:** Firebase Cloud Messaging
- **SMS:** Twilio integration

---

## Implementation Priority Recommendations

### Must-Have for MVP (Phase 1 - 9 months)
1. ✅ Mobile app (clock in/out, shift view)
2. ✅ UK payroll (PAYE, NI, RTI)
3. ✅ Till management
4. ✅ Break compliance
5. ✅ Food safety certifications
6. ✅ Monthly performance reviews
7. ✅ Core HRMS (employees, attendance, leave)

### High Value (Phase 2 - 6 months)
1. ⭐ Labour cost forecasting
2. ⭐ Advanced scheduling (templates, skills-based)
3. ⭐ POS integration
4. ⭐ Rust payroll engine (if needed for performance)

### Nice-to-Have (Phase 3 - 9 months)
1. 💡 Right to Work verification
2. 💡 Employee self-service portal
3. 💡 Recruitment module
4. 💡 Advanced reporting

---

## Cost Estimate

### Phase 1 (9 months)
- **Team:** 4 developers @ £50K average = £200K/year
- **9 months:** £150K
- **Infrastructure:** £5K
- **Total Phase 1:** £155K

### Phase 2 (6 months)
- **Team:** 3 developers = £75K
- **Infrastructure:** £3K
- **Total Phase 2:** £78K

### Phase 3 (9 months)
- **Team:** 2.5 developers = £94K
- **Infrastructure:** £5K
- **Total Phase 3:** £99K

**Total 24-Month Cost:** £332K

---

## ROI Projections

### Year 1 (Phase 1 Complete)
- **Customers:** 5 regional supermarket chains
- **Employees:** 10,000
- **ARPU:** £20 PEPM
- **ARR:** £2.4M
- **Cost:** £155K
- **Gross Profit:** £2.245M

### Year 2 (Phase 2 Complete)
- **Customers:** 15 chains
- **Employees:** 30,000
- **ARPU:** £22 PEPM
- **ARR:** £7.92M
- **Cost:** £233K (Phases 1-2)
- **Gross Profit:** £7.687M

### Year 3 (Phase 3 Complete)
- **Customers:** 30 chains
- **Employees:** 60,000
- **ARPU:** £23 PEPM
- **ARR:** £16.56M
- **Cost:** £332K (all phases)
- **Gross Profit:** £16.228M

---

## Next Steps

1. **Review updated CSV file:** `CompliHR_Feature_List_UK_Retail_Complete.csv`
2. **Prioritize Phase 1 features** based on development capacity
3. **Set up PostgreSQL database** with 10 schemas
4. **Begin mobile app development** (React Native)
5. **Start UK payroll engine** (NestJS + TypeScript, migrate to Rust in Phase 2 if needed)
6. **Design database migrations** for all schemas

---

## Files Generated

1. ✅ `CompliHR_Feature_List_UK_Retail_Complete.csv` - Complete feature list with database mappings
2. ✅ `DATABASE_SCHEMA_DESIGN.md` - 65+ table schema design
3. ✅ `COMPETITIVE_ANALYSIS_GAP_REPORT.md` - UK market competitive analysis
4. ✅ `FEATURE_SPECIFICATIONS_ROADMAP.md` - Detailed feature specifications
5. ✅ `AUDIT_LOGGING_STRATEGY.md` - 3-tier audit approach
6. ✅ `ARCHITECTURE_DECISION.md` - Modular monolith recommendation
7. ✅ `NESTJS_VS_ALTERNATIVES.md` - Framework comparison
8. ✅ `BACKEND_FRAMEWORK_COMPARISON.md` - Multi-language comparison
9. ✅ `HYBRID_PAYROLL_ENGINE_STRATEGY.md` - Rust microservice strategy
10. ✅ `RUST_VS_CPP_PAYROLL_ENGINE.md` - Rust vs C++ analysis

---

**Document Prepared By:** Claude (Anthropic)
**Date:** January 2025
**Version:** 1.0
**Status:** Complete ✅
