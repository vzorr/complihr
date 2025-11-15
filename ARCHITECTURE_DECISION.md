# CompliHR - Architecture Decision: Microservices vs Modular Monolith

> **Strategic architecture analysis for UK retail HRMS**
>
> Version: 1.0 | Date: January 2025 | Target: UK Supermarket Retail

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Options](#architecture-options)
3. [Decision Framework](#decision-framework)
4. [Recommended Architecture](#recommended-architecture)
5. [Modular Monolith Design](#modular-monolith-design)
6. [Migration Path to Microservices](#migration-path-to-microservices)
7. [Implementation Blueprint](#implementation-blueprint)
8. [Technology Stack](#technology-stack)

---

## Executive Summary

### TL;DR: Start with Modular Monolith

**Recommendation:** **Modular Monolith** for initial 12-18 months, with clear service boundaries enabling future migration to microservices if needed.

**Why:**
- ✅ Faster time to market (critical for startup/SMB)
- ✅ Lower operational complexity (smaller team)
- ✅ Easier debugging and testing
- ✅ Lower infrastructure costs
- ✅ Simpler deployment pipeline
- ⚠️ Can migrate to microservices later when scale demands it

**When to migrate to microservices:**
- Multiple independent teams (>20 developers)
- Different scaling requirements per module
- Need for polyglot architecture
- 100,000+ employees managed
- Global expansion beyond UK

---

## Architecture Options

### Option 1: Microservices Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / BFF                        │
│              (Authentication, Rate Limiting)                │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼───────┐  ┌──────▼──────┐  ┌───────▼───────┐
│ Employee      │  │  Payroll    │  │ Time &        │
│ Service       │  │  Service    │  │ Attendance    │
│               │  │             │  │ Service       │
│ - Employees   │  │ - Payslips  │  │ - Attendance  │
│ - Departments │  │ - PAYE      │  │ - Shifts      │
│ - Documents   │  │ - RTI       │  │ - Timesheets  │
│               │  │ - Pensions  │  │               │
│ DB: employees │  │ DB: payroll │  │ DB: time      │
└───────────────┘  └─────────────┘  └───────────────┘

┌───────────────┐  ┌─────────────┐  ┌───────────────┐
│ Leave         │  │  Retail     │  │ Performance   │
│ Service       │  │  Operations │  │ Service       │
│               │  │  Service    │  │               │
│ - Requests    │  │ - Tills     │  │ - Reviews     │
│ - Balances    │  │ - Breaks    │  │ - KPIs        │
│ - Types       │  │ - Food Cert │  │ - Goals       │
│               │  │             │  │               │
│ DB: leave     │  │ DB: retail  │  │ DB: perf      │
└───────────────┘  └─────────────┘  └───────────────┘

┌───────────────────────────────────────────────────────────┐
│              Message Queue (Event Bus)                    │
│         (Employee Updated, Payroll Run, etc.)             │
└───────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Each service has its own database
- Services communicate via REST APIs or events
- Independent deployment and scaling
- Technology diversity (polyglot)

**Pros:**
- ✅ Independent scaling (e.g., scale payroll service during month-end)
- ✅ Technology flexibility (different languages per service)
- ✅ Team autonomy (separate teams own services)
- ✅ Fault isolation (one service failure doesn't crash all)
- ✅ Easier to add third-party integrations

**Cons:**
- ❌ High operational complexity (monitoring, logging, tracing)
- ❌ Distributed transactions are hard (SAGA pattern needed)
- ❌ Network latency between services
- ❌ Data consistency challenges
- ❌ More infrastructure costs (multiple databases, services)
- ❌ Requires DevOps expertise (Kubernetes, service mesh)
- ❌ Slower initial development

---

### Option 2: Traditional Monolith

```
┌─────────────────────────────────────────────────────────────┐
│                   CompliHR Application                      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Employee   │  │   Payroll   │  │  Time &     │        │
│  │  Module     │  │   Module    │  │  Attendance │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Leave     │  │   Retail    │  │ Performance │        │
│  │   Module    │  │   Module    │  │   Module    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│         All modules tightly coupled                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │  Single Database        │
              │  (All tables)           │
              └─────────────────────────┘
```

**Characteristics:**
- Single codebase, single deployment
- Shared database
- Direct function calls between modules
- Single technology stack

**Pros:**
- ✅ Simple deployment (one artifact)
- ✅ Easy debugging (single process)
- ✅ No network latency
- ✅ ACID transactions
- ✅ Lower infrastructure costs

**Cons:**
- ❌ All modules deployed together (one change requires full redeploy)
- ❌ Can't scale individual modules
- ❌ Risk of tight coupling
- ❌ Single point of failure
- ❌ Hard to migrate to microservices later

---

### Option 3: Modular Monolith (RECOMMENDED)

```
┌─────────────────────────────────────────────────────────────┐
│              CompliHR Modular Monolith                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ API Layer (Express.js / NestJS)                      │  │
│  │ - REST endpoints                                     │  │
│  │ - GraphQL (optional)                                 │  │
│  │ - WebSocket (real-time)                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│  ┌────────────────────────┼────────────────────────┐       │
│  │                        │                        │       │
│  ▼                        ▼                        ▼       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │ Employee    │  │   Payroll    │  │  Time &     │       │
│  │ Module      │  │   Module     │  │  Attendance │       │
│  │             │  │              │  │  Module     │       │
│  │ - Service   │  │  - Service   │  │  - Service  │       │
│  │ - Repo      │  │  - Repo      │  │  - Repo     │       │
│  │ - Events    │  │  - Events    │  │  - Events   │       │
│  └─────────────┘  └──────────────┘  └─────────────┘       │
│         │                 │                  │             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │   Leave     │  │    Retail    │  │Performance  │       │
│  │   Module    │  │  Operations  │  │   Module    │       │
│  │             │  │   Module     │  │             │       │
│  │ - Service   │  │  - Service   │  │  - Service  │       │
│  │ - Repo      │  │  - Repo      │  │  - Repo     │       │
│  │ - Events    │  │  - Events    │  │  - Events   │       │
│  └─────────────┘  └──────────────┘  └─────────────┘       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Shared Infrastructure                                │  │
│  │ - Event Bus (in-process)                             │  │
│  │ - Logging, Caching, Auth                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │  Single Database        │
              │  (Logical schemas)      │
              │  - core                 │
              │  - payroll              │
              │  - time_tracking        │
              │  - retail               │
              │  - performance          │
              └─────────────────────────┘
```

**Characteristics:**
- Single deployment unit
- Clear module boundaries with interfaces
- Modules communicate via in-process events or service layer
- Shared database but separate schemas
- Can extract modules to microservices later

**Pros:**
- ✅ Faster initial development
- ✅ Simple deployment and debugging
- ✅ Clear boundaries prepare for microservices
- ✅ Lower operational complexity
- ✅ ACID transactions when needed
- ✅ Easy to refactor before scaling
- ✅ Lower infrastructure costs
- ✅ Gradual migration path

**Cons:**
- ⚠️ All modules scale together (mitigated by horizontal scaling)
- ⚠️ Requires discipline to maintain boundaries
- ⚠️ Single technology stack (acceptable for most cases)

---

## Decision Framework

### Evaluation Criteria for CompliHR

| Criteria | Weight | Microservices | Monolith | Modular Monolith |
|----------|--------|---------------|----------|------------------|
| **Time to Market** | ⭐⭐⭐⭐⭐ | ❌ Slow (6-12 months) | ✅ Fast (3-6 months) | ✅ Fast (3-6 months) |
| **Team Size** | ⭐⭐⭐⭐ | ❌ Need 20+ devs | ✅ 3-8 devs | ✅ 3-8 devs |
| **Operational Complexity** | ⭐⭐⭐⭐ | ❌ High (K8s, service mesh) | ✅ Low (single server) | ✅ Low (single server) |
| **Scalability** | ⭐⭐⭐ | ✅ Excellent | ❌ Limited | ⚠️ Good (horizontal) |
| **Development Speed** | ⭐⭐⭐⭐ | ❌ Slow (network, contracts) | ✅ Fast | ✅ Fast |
| **Testing** | ⭐⭐⭐ | ❌ Complex (integration) | ✅ Simple | ✅ Simple |
| **Infrastructure Cost** | ⭐⭐⭐⭐ | ❌ High ($5K+/month) | ✅ Low ($500/month) | ✅ Low ($500-1K/month) |
| **Future Migration** | ⭐⭐⭐ | ✅ N/A | ❌ Hard to extract | ✅ Easy to extract |
| **UK Compliance** | ⭐⭐⭐⭐⭐ | ⚠️ Complex auditing | ✅ Simple transactions | ✅ Simple transactions |
| **Debugging** | ⭐⭐⭐ | ❌ Distributed tracing | ✅ Stack traces | ✅ Stack traces |

### Scoring

**Microservices Total:** 35/100 (Poor fit)
**Traditional Monolith Total:** 72/100 (Good fit, but risky long-term)
**Modular Monolith Total:** 90/100 (Excellent fit) ✅

---

## Recommended Architecture

### MODULAR MONOLITH with Service Boundaries

**Decision:** Start with a **well-designed modular monolith** that can be extracted to microservices later if needed.

### Why This Makes Sense for CompliHR

#### 1. **Team Size Reality**
- Current/projected team: 3-8 developers
- Microservices need 20+ developers (2-3 per service)
- Modular monolith maximizes productivity with small team

#### 2. **Time to Market**
- Need to launch in 6-9 months
- Microservices would take 12-18 months
- UK retail market window is now

#### 3. **UK Compliance Requirements**
- HMRC RTI submissions need ACID transactions
- Payroll calculations must be atomic
- Audit trail easier in single database
- GDPR data retrieval simpler

#### 4. **Operational Simplicity**
- Small startup can't afford dedicated DevOps team
- Single deployment = fewer points of failure
- Easier monitoring and logging

#### 5. **Cost Efficiency**
- Single server: £500-1,000/month
- Microservices: £5,000+/month (multiple services, databases, message queues)
- Runway critical for startup

#### 6. **UK Retail Use Case**
- Target: 40,000 employees (manageable in monolith)
- Not Amazon-scale (50M employees)
- Regional UK focus (not global distribution)

---

## Modular Monolith Design

### Module Structure

```
complihr/
├── src/
│   ├── modules/
│   │   ├── employee/              # Employee Module
│   │   │   ├── employee.service.ts
│   │   │   ├── employee.repository.ts
│   │   │   ├── employee.controller.ts
│   │   │   ├── employee.entity.ts
│   │   │   ├── employee.dto.ts
│   │   │   ├── employee.events.ts
│   │   │   └── employee.module.ts
│   │   │
│   │   ├── payroll/               # Payroll Module
│   │   │   ├── services/
│   │   │   │   ├── payroll.service.ts
│   │   │   │   ├── paye.service.ts
│   │   │   │   ├── ni.service.ts
│   │   │   │   └── rti.service.ts
│   │   │   ├── repositories/
│   │   │   │   ├── payslip.repository.ts
│   │   │   │   └── payroll-run.repository.ts
│   │   │   ├── controllers/
│   │   │   │   ├── payroll.controller.ts
│   │   │   │   └── rti.controller.ts
│   │   │   ├── entities/
│   │   │   ├── events/
│   │   │   │   ├── payroll-run-completed.event.ts
│   │   │   │   └── rti-submitted.event.ts
│   │   │   └── payroll.module.ts
│   │   │
│   │   ├── time-tracking/         # Time & Attendance Module
│   │   │   ├── services/
│   │   │   │   ├── attendance.service.ts
│   │   │   │   ├── shift.service.ts
│   │   │   │   └── timesheet.service.ts
│   │   │   ├── repositories/
│   │   │   ├── controllers/
│   │   │   ├── entities/
│   │   │   ├── events/
│   │   │   └── time-tracking.module.ts
│   │   │
│   │   ├── leave/                 # Leave Management Module
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── controllers/
│   │   │   ├── entities/
│   │   │   ├── events/
│   │   │   │   ├── leave-approved.event.ts
│   │   │   │   └── leave-rejected.event.ts
│   │   │   └── leave.module.ts
│   │   │
│   │   ├── retail/                # Retail Operations Module
│   │   │   ├── services/
│   │   │   │   ├── till.service.ts
│   │   │   │   ├── break-compliance.service.ts
│   │   │   │   └── food-safety.service.ts
│   │   │   ├── repositories/
│   │   │   ├── controllers/
│   │   │   ├── entities/
│   │   │   ├── events/
│   │   │   └── retail.module.ts
│   │   │
│   │   ├── performance/           # Performance Management Module
│   │   │   ├── services/
│   │   │   │   ├── monthly-review.service.ts
│   │   │   │   └── kpi.service.ts
│   │   │   ├── repositories/
│   │   │   ├── controllers/
│   │   │   ├── entities/
│   │   │   ├── events/
│   │   │   │   └── review-completed.event.ts
│   │   │   └── performance.module.ts
│   │   │
│   │   ├── uk-compliance/         # UK Compliance Module
│   │   │   ├── services/
│   │   │   │   ├── working-time-directive.service.ts
│   │   │   │   ├── minimum-wage.service.ts
│   │   │   │   └── pension.service.ts
│   │   │   ├── repositories/
│   │   │   ├── controllers/
│   │   │   ├── entities/
│   │   │   └── uk-compliance.module.ts
│   │   │
│   │   └── audit/                 # Audit & Logging Module
│   │       ├── services/
│   │       │   ├── activity-log.service.ts
│   │       │   └── history-tracker.service.ts
│   │       ├── repositories/
│   │       ├── entities/
│   │       └── audit.module.ts
│   │
│   ├── shared/                    # Shared Infrastructure
│   │   ├── events/
│   │   │   ├── event-bus.service.ts
│   │   │   └── event.interface.ts
│   │   ├── database/
│   │   │   ├── database.module.ts
│   │   │   └── transaction.decorator.ts
│   │   ├── auth/
│   │   │   ├── auth.guard.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── rbac.decorator.ts
│   │   ├── cache/
│   │   │   └── redis.service.ts
│   │   ├── logging/
│   │   │   └── logger.service.ts
│   │   └── utils/
│   │
│   ├── config/                    # Configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── environment.config.ts
│   │
│   └── main.ts                    # Application entry point
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── database/
│   └── migrations/
│
└── package.json
```

### Module Communication Rules

**CRITICAL: Enforce these rules to maintain boundaries**

```typescript
// ✅ ALLOWED: Module calls its own service
@Injectable()
export class EmployeeController {
  constructor(
    private employeeService: EmployeeService
  ) {}
}

// ✅ ALLOWED: Module publishes events
@Injectable()
export class EmployeeService {
  async updateSalary(employeeId: number, newSalary: number) {
    await this.employeeRepo.update(employeeId, { salary: newSalary });

    // Publish event for other modules to consume
    await this.eventBus.publish(new EmployeeSalaryUpdatedEvent({
      employeeId,
      oldSalary: 30000,
      newSalary: 35000
    }));
  }
}

// ✅ ALLOWED: Module subscribes to events
@Injectable()
export class PayrollService {
  @OnEvent('employee.salary.updated')
  async handleSalaryUpdate(event: EmployeeSalaryUpdatedEvent) {
    // Recalculate payroll for next period
    await this.updatePayrollStructure(event.employeeId, event.newSalary);
  }
}

// ❌ FORBIDDEN: Direct cross-module service calls
@Injectable()
export class PayrollService {
  constructor(
    private employeeService: EmployeeService // ❌ NO! Creates tight coupling
  ) {}
}

// ✅ ALLOWED: Query via repository or read-only API
@Injectable()
export class PayrollService {
  constructor(
    private employeeRepository: EmployeeRepository // ✅ OK - read-only data access
  ) {}

  async generatePayslip(employeeId: number) {
    const employee = await this.employeeRepository.findById(employeeId);
    // Generate payslip...
  }
}
```

### Event-Driven Communication (In-Process)

```typescript
// shared/events/event-bus.service.ts
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBus {
  constructor(private eventEmitter: EventEmitter2) {}

  async publish<T>(event: DomainEvent<T>) {
    // Log event for audit
    await this.logEvent(event);

    // Emit to subscribers (in-process, synchronous or async)
    await this.eventEmitter.emitAsync(event.name, event);
  }

  private async logEvent(event: DomainEvent<any>) {
    // Store in audit.activity_logs for compliance
    await this.db.query(`
      INSERT INTO audit.activity_logs (
        action, resource_type, resource_id, metadata
      ) VALUES ($1, $2, $3, $4)
    `, [event.name, event.aggregateType, event.aggregateId, event.payload]);
  }
}

// Employee module event
export class EmployeeSalaryUpdatedEvent implements DomainEvent<SalaryUpdatePayload> {
  readonly name = 'employee.salary.updated';
  readonly timestamp = new Date();

  constructor(
    public readonly payload: SalaryUpdatePayload,
    public readonly aggregateId: number
  ) {}
}

// Payroll module listener
@Injectable()
export class PayrollService {
  @OnEvent('employee.salary.updated', { async: true })
  async handleSalaryUpdate(event: EmployeeSalaryUpdatedEvent) {
    console.log(`Processing salary update for employee ${event.aggregateId}`);
    // Update payroll calculations...
  }
}
```

### Database Access Patterns

```typescript
// Each module has its own repositories accessing its schema

// employee.repository.ts (Employee Module)
@Injectable()
export class EmployeeRepository {
  async findById(id: number): Promise<Employee> {
    return this.db.query(`
      SELECT * FROM core.employees WHERE id = $1
    `, [id]);
  }
}

// payslip.repository.ts (Payroll Module)
@Injectable()
export class PayslipRepository {
  async create(payslip: CreatePayslipDto): Promise<Payslip> {
    return this.db.query(`
      INSERT INTO payroll.payslips (...) VALUES (...)
    `, [...]);
  }

  // ✅ Can read from core schema if needed (read-only)
  async getEmployeeForPayslip(employeeId: number) {
    return this.db.query(`
      SELECT id, first_name, last_name, salary
      FROM core.employees
      WHERE id = $1
    `, [employeeId]);
  }
}
```

---

## Migration Path to Microservices

### When to Consider Migration

Migrate when **ANY** of these conditions are met:

1. **Team Size:** >20 developers, multiple teams
2. **Scale:** >100,000 employees managed
3. **Performance:** Specific modules need independent scaling (e.g., time tracking gets 10x more traffic)
4. **Global Expansion:** Need different compliance modules per country
5. **Technology Requirements:** Need different tech stacks (e.g., Python for ML in performance module)

### Phased Migration Strategy

**Phase 1: Identify First Service to Extract**

Candidates (in order of priority):

1. **Time Tracking Service** (High traffic, independent)
   - Most API calls during clock in/out hours
   - Minimal dependencies on other modules
   - Can scale independently

2. **Retail Operations Service** (Domain isolation)
   - Till management is retail-specific
   - Clean boundaries with rest of system

3. **UK Compliance Service** (Deployment independence)
   - Needs frequent updates for HMRC changes
   - Can deploy without affecting core HR

**Phase 2: Extract First Service**

```typescript
// Step 1: Create separate service
time-tracking-service/
├── src/
│   ├── attendance/
│   ├── shifts/
│   ├── api/
│   └── main.ts
└── database/
    └── time_tracking schema

// Step 2: Keep data in same database initially
// (shared database pattern for transitional period)

// Step 3: Update main app to call service via HTTP
@Injectable()
export class MainAppTimeTrackingClient {
  async clockIn(employeeId: number) {
    // Call microservice via HTTP
    return this.http.post('http://time-tracking-service/api/attendance/clock-in', {
      employeeId
    });
  }
}

// Step 4: Migrate data to separate database (later)
// Step 5: Implement event-based communication (later)
```

**Phase 3: Repeat for Other Services**

Extract in order:
1. Time Tracking (high traffic)
2. Retail Operations (domain isolation)
3. UK Compliance (deployment frequency)
4. Payroll (complexity)
5. Performance (future ML features)

---

## Implementation Blueprint

### Tech Stack (Modular Monolith)

**Backend:**
```json
{
  "framework": "NestJS (TypeScript)",
  "why": "Built-in modules, dependency injection, easy to extract services later",
  "orm": "Prisma or TypeORM",
  "database": "PostgreSQL 14+",
  "cache": "Redis",
  "events": "@nestjs/event-emitter (in-process)",
  "validation": "class-validator + class-transformer",
  "testing": "Jest",
  "api-docs": "Swagger/OpenAPI"
}
```

**Why NestJS:**
- ✅ Module system maps to our domain modules
- ✅ Dependency injection (loose coupling)
- ✅ Easy to extract to microservices later
- ✅ TypeScript = type safety for payroll calculations
- ✅ Strong community, extensive docs
- ✅ Built-in decorators for RBAC, validation

**Alternative:** Express.js with manual module structure (lighter, more flexibility)

### Folder Structure

```typescript
// NestJS Module Structure
import { Module } from '@nestjs/common';

@Module({
  imports: [
    DatabaseModule,
    EventEmitterModule.forRoot(),
    // Domain modules
    EmployeeModule,
    PayrollModule,
    TimeTrackingModule,
    LeaveModule,
    RetailModule,
    PerformanceModule,
    UKComplianceModule,
    AuditModule,
  ],
  controllers: [HealthController],
  providers: [AppService],
})
export class AppModule {}

// Employee Module (example)
@Module({
  imports: [DatabaseModule],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    EmployeeRepository,
  ],
  exports: [
    EmployeeRepository, // Export for read-only access by other modules
  ],
})
export class EmployeeModule {}

// Payroll Module
@Module({
  imports: [
    DatabaseModule,
    EmployeeModule, // Import to access EmployeeRepository
  ],
  controllers: [
    PayrollController,
    RTIController,
  ],
  providers: [
    PayrollService,
    PAYECalculationService,
    NICalculationService,
    RTISubmissionService,
    PayslipRepository,
    PayrollRunRepository,
  ],
})
export class PayrollModule {
  // Listen to employee events
  constructor(private payrollService: PayrollService) {}

  @OnEvent('employee.salary.updated')
  handleSalaryUpdate(event: EmployeeSalaryUpdatedEvent) {
    return this.payrollService.updateSalaryStructure(event);
  }
}
```

### Service Layer Pattern

```typescript
// employee/employee.service.ts
@Injectable()
export class EmployeeService {
  constructor(
    private employeeRepo: EmployeeRepository,
    private eventBus: EventBus,
    private auditLog: AuditLogService,
  ) {}

  async updateSalary(
    employeeId: number,
    newSalary: number,
    updatedBy: number,
  ): Promise<Employee> {
    // 1. Get current state
    const employee = await this.employeeRepo.findById(employeeId);
    const oldSalary = employee.salary;

    // 2. Update database
    const updated = await this.employeeRepo.update(employeeId, {
      salary: newSalary,
      updated_by: updatedBy,
    });

    // 3. Log activity (audit trail)
    await this.auditLog.log({
      action: 'update_salary',
      userId: updatedBy,
      resourceType: 'employee',
      resourceId: employeeId,
      metadata: { old_salary: oldSalary, new_salary: newSalary },
    });

    // 4. Publish event for other modules
    await this.eventBus.publish(new EmployeeSalaryUpdatedEvent({
      employeeId,
      oldSalary,
      newSalary,
      effectiveDate: new Date(),
    }));

    return updated;
  }
}
```

### Transaction Management

```typescript
// shared/database/transaction.decorator.ts
export function Transactional() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const client = await this.db.getClient();

      try {
        await client.query('BEGIN');

        const result = await originalMethod.apply(this, args);

        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    };

    return descriptor;
  };
}

// Usage
@Injectable()
export class PayrollService {
  @Transactional()
  async runPayroll(payrollRunId: number): Promise<void> {
    // All database operations in this method are wrapped in a transaction
    await this.createPayslips(payrollRunId);
    await this.calculateTax(payrollRunId);
    await this.submitRTI(payrollRunId);
    // If any step fails, entire operation rolls back
  }
}
```

---

## Technology Stack

### Complete Stack Recommendation

```yaml
Backend:
  Framework: NestJS 10+ (TypeScript)
  Runtime: Node.js 20 LTS
  ORM: Prisma (type-safe queries)
  Validation: class-validator, class-transformer
  Events: @nestjs/event-emitter
  API Docs: @nestjs/swagger
  Testing: Jest + Supertest

Database:
  Primary: PostgreSQL 14+
  Cache: Redis 7+
  Search: PostgreSQL Full Text Search (initially)

Frontend:
  Framework: Vue 3 or React 18
  Build Tool: Vite
  UI Library: Tailwind CSS (already using)
  State: Pinia (Vue) or Zustand (React)
  API Client: Axios + React Query / TanStack Query

Mobile:
  Framework: React Native
  UI: React Native Paper or NativeBase
  State: Zustand
  Offline: AsyncStorage + Queue

DevOps:
  Hosting: AWS or Digital Ocean
  CI/CD: GitHub Actions
  Containers: Docker
  Orchestration: Docker Compose (initially), Kubernetes (later)
  Monitoring: Sentry + LogRocket
  APM: New Relic or DataDog (when scaling)

Infrastructure:
  Server: AWS EC2 t3.large or DO Droplet (8GB RAM)
  Database: AWS RDS PostgreSQL or DO Managed DB
  Cache: AWS ElastiCache Redis or DO Managed Redis
  Storage: AWS S3 or DO Spaces
  CDN: CloudFlare

Estimated Costs (Initial):
  - Server: £200/month
  - Database: £150/month
  - Redis: £50/month
  - Storage: £20/month
  - Monitoring: £50/month
  Total: ~£500/month
```

### Development Tools

```json
{
  "IDE": "VS Code",
  "Extensions": [
    "ESLint",
    "Prettier",
    "Prisma",
    "GitLens",
    "Thunder Client"
  ],
  "Code Quality": {
    "Linting": "ESLint + Prettier",
    "Type Checking": "TypeScript strict mode",
    "Pre-commit": "Husky + lint-staged",
    "Testing": "Jest (80%+ coverage target)"
  },
  "Database Tools": {
    "Migrations": "Prisma Migrate",
    "Seeding": "Prisma Seed",
    "GUI": "Prisma Studio or pgAdmin"
  }
}
```

---

## Conclusion

### Summary

**✅ RECOMMENDATION: Modular Monolith**

**Reasoning:**
1. **Team Size:** 3-8 developers → Monolith is optimal
2. **Time to Market:** 6-9 months → Can't afford microservices complexity
3. **Scale:** 40K employees → Well within monolith capacity
4. **UK Compliance:** ACID transactions critical → Easier in monolith
5. **Cost:** Limited runway → £500/month vs £5K+/month
6. **Future-Proof:** Can extract to microservices when needed

### Success Metrics

**When Modular Monolith is Working:**
- ✅ Deploy 2-3x per week
- ✅ Response time <200ms for 95% of requests
- ✅ Can handle 40,000 employees
- ✅ New feature development: 1-2 weeks
- ✅ Bug fixes deployed within 24 hours

**When to Migrate to Microservices:**
- ⚠️ Team grows to 20+ developers
- ⚠️ Managing 100,000+ employees
- ⚠️ Specific modules need different scaling (10x+ traffic difference)
- ⚠️ Deployment becomes bottleneck (>1 week between deployments)
- ⚠️ Global expansion requires polyglot architecture

### Migration Readiness Checklist

Keep these principles to enable future migration:

- ✅ Clear module boundaries (no cross-module service calls)
- ✅ Event-driven communication between modules
- ✅ Each module has its own database schema
- ✅ Repositories abstract database access
- ✅ API versioning from day one
- ✅ Comprehensive integration tests
- ✅ Metrics per module (to identify bottlenecks)

**If you follow these principles, extracting a module to a microservice is a 2-week effort, not a 6-month rewrite.**

---

**Document Version:** 1.0
**Author:** Claude (Anthropic)
**Date:** January 2025
**Recommendation:** Modular Monolith → Microservices (when scale demands)
**Target Market:** UK Supermarket Retail (40K employees)
**Status:** Decision Ready
