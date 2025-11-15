# CompliHR Security Recommendations

## ID Strategy & Security

### Current Implementation
- **Type**: BIGINT auto-increment (PostgreSQL BIGSERIAL)
- **Security Level**: ⚠️ Low - Predictable, enumerable IDs
- **Risk**: Enumeration attacks, information leakage

### Recommended Implementation: **UUID v4 (GUIDs)**

#### Option 1: Full UUID Migration (RECOMMENDED)
**Pros:**
- ✅ Cryptographically random (128-bit)
- ✅ Impossible to enumerate/predict
- ✅ No information leakage
- ✅ Can generate client-side
- ✅ Safe for URLs and APIs
- ✅ Industry best practice for public-facing IDs

**Cons:**
- ❌ Larger storage (16 bytes vs 8 bytes)
- ❌ Slightly slower joins
- ❌ Not human-readable

**Migration Path:**
```sql
-- Change primary key to UUID
ALTER TABLE admin.users ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
ALTER TABLE core.employees ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
-- Update all foreign keys accordingly
```

#### Option 2: Dual ID System (HYBRID - BEST OF BOTH WORLDS)
**Internal ID (BIGINT)** + **Public ID (UUID)**

**Pros:**
- ✅ Fast internal joins (BIGINT)
- ✅ Secure public API (UUID)
- ✅ Best performance + security balance
- ✅ Can migrate gradually

**Implementation:**
```typescript
@Entity({ schema: 'core', name: 'employees' })
export class Employee {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number; // Internal use only (never exposed)

  @Column({ type: 'uuid', unique: true, default: () => 'uuid_generate_v4()' })
  publicId: string; // Used in all API responses/requests

  @Column({ type: 'varchar', length: 50, unique: true })
  employeeNumber: string; // Human-readable business ID

  // ... other fields
}
```

**API Usage:**
```typescript
// ❌ NEVER expose internal ID
GET /api/employees/123

// ✅ Always use public UUID
GET /api/employees/550e8400-e29b-41d4-a716-446655440000

// ✅ Or business identifier
GET /api/employees/EMP2024001
```

### Security Implementation Checklist

#### 1. ID Security
- [ ] Migrate all public-facing endpoints to use UUIDs
- [ ] Never expose auto-increment IDs in API responses
- [ ] Use business identifiers (employee_number) where human-readable IDs needed
- [ ] Implement UUID v4 for all new tables

#### 2. Authorization Layer (CRITICAL)
Even with UUIDs, **always verify authorization**:

```typescript
@UseGuards(JwtAuthGuard, EmployeeAccessGuard)
@Get('employees/:id')
async getEmployee(@Param('id') id: string, @Request() req) {
  // ✅ Verify user has permission to access this employee
  // Based on: role, department, manager hierarchy, etc.

  const employee = await this.employeesService.findOne(id);

  // Check if user can access this employee
  if (!this.canAccessEmployee(req.user, employee)) {
    throw new ForbiddenException();
  }

  return employee;
}
```

#### 3. Row-Level Security
Implement PostgreSQL RLS (Row Level Security):

```sql
-- Enable RLS on employees table
ALTER TABLE core.employees ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see employees in their department
CREATE POLICY employee_isolation ON core.employees
  USING (
    department_id IN (
      SELECT department_id FROM core.employees
      WHERE user_id = current_setting('app.current_user_id')::BIGINT
    )
    OR
    -- Admins can see all
    EXISTS (
      SELECT 1 FROM admin.user_roles ur
      JOIN admin.roles r ON ur.role_id = r.id
      WHERE ur.user_id = current_setting('app.current_user_id')::BIGINT
      AND r.name = 'admin'
    )
  );
```

#### 4. Rate Limiting
Prevent brute-force enumeration:

```typescript
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard) // 10 requests per minute
@Controller('employees')
export class EmployeesController {
  // ...
}
```

#### 5. Audit Logging
Track all access attempts:

```typescript
// Log every employee access
await this.auditService.log({
  userId: req.user.id,
  action: 'VIEW_EMPLOYEE',
  resourceType: 'employee',
  resourceId: employee.id,
  ipAddress: req.ip,
  containsPII: true,
  piiFields: ['email', 'dateOfBirth', 'address'],
});
```

#### 6. Sensitive Data Protection
Never return sensitive fields by default:

```typescript
@Exclude() // Never serialize in JSON
@Column()
passwordHash: string;

@Exclude()
@Column()
nationalInsuranceNumber: string;

// Use DTOs to control what's returned
export class EmployeeResponseDto {
  publicId: string;
  firstName: string;
  lastName: string;
  // Only include what's needed
}
```

## Recommended Migration Plan

### Phase 1: Add UUID columns (Non-breaking)
```sql
-- Add publicId to all tables
ALTER TABLE admin.users ADD COLUMN public_id UUID DEFAULT uuid_generate_v4() UNIQUE;
ALTER TABLE core.employees ADD COLUMN public_id UUID DEFAULT uuid_generate_v4() UNIQUE;
ALTER TABLE core.departments ADD COLUMN public_id UUID DEFAULT uuid_generate_v4() UNIQUE;
-- ... repeat for all tables
```

### Phase 2: Update API to use UUIDs
```typescript
// Old: GET /api/employees/:id (id = BIGINT)
// New: GET /api/employees/:publicId (publicId = UUID)

@Get(':publicId')
async findOne(@Param('publicId') publicId: string) {
  return this.employeesService.findByPublicId(publicId);
}
```

### Phase 3: Deprecate integer IDs from public APIs
- Keep internal BIGINT IDs for database performance
- Use UUIDs for all external communication
- Document migration in API changelog

### Phase 4: Implement Authorization Guards
```typescript
// Department-based access control
@Injectable()
export class DepartmentAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    // Check if user can access resource based on department
    // Implement your business logic here

    return this.hasAccess(user, resourceId);
  }
}
```

## Additional Security Measures

### 1. API Key Rotation for RTI Submissions
```typescript
@Column({ type: 'varchar', select: false }) // Never auto-select
hmrcApiKey: string;

@Column()
hmrcApiKeyExpiry: Date;

// Rotate keys every 90 days
```

### 2. Encryption at Rest
```sql
-- Use pgcrypto for sensitive fields
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt NI numbers
UPDATE core.employees
SET national_insurance_number = pgp_sym_encrypt(national_insurance_number, 'encryption-key');
```

### 3. Field-Level Permissions
```typescript
// Different roles see different fields
class EmployeeDto {
  @Expose({ groups: ['admin', 'hr'] })
  salary: number;

  @Expose({ groups: ['admin', 'hr', 'manager'] })
  performanceRating: number;

  @Expose({ groups: ['admin', 'hr', 'manager', 'self'] })
  contactDetails: ContactInfo;
}
```

### 4. HTTPS Only in Production
```typescript
// main.ts
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  }));
}
```

### 5. Input Validation & Sanitization
Already implemented with class-validator, but ensure:
- SQL injection prevention (TypeORM handles this)
- XSS prevention (sanitize HTML inputs)
- CSRF tokens for state-changing operations

## Summary: Security Layers

```
┌─────────────────────────────────────────┐
│  1. HTTPS/TLS (Transport Security)     │
├─────────────────────────────────────────┤
│  2. JWT Authentication                  │
├─────────────────────────────────────────┤
│  3. Authorization Guards                │
├─────────────────────────────────────────┤
│  4. UUID/GUID Public IDs                │
├─────────────────────────────────────────┤
│  5. Row-Level Security (PostgreSQL)     │
├─────────────────────────────────────────┤
│  6. Rate Limiting                       │
├─────────────────────────────────────────┤
│  7. Audit Logging                       │
├─────────────────────────────────────────┤
│  8. Field-Level Encryption              │
└─────────────────────────────────────────┘
```

## Immediate Actions Required

1. **Decide on ID strategy**: Full UUID or Hybrid (recommend Hybrid)
2. **Implement authorization guards** on all endpoints
3. **Add rate limiting** to prevent brute force
4. **Enable audit logging** for PII access
5. **Review and test** authorization logic

**Recommended: Hybrid approach** gives best security + performance balance for UK retail HRMS.
