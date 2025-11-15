import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedAll(dataSource: DataSource) {
  console.log('🌱 Starting database seeding...');

  // Seed Permissions
  console.log('📝 Seeding permissions...');
  await seedPermissions(dataSource);

  // Seed Roles
  console.log('👥 Seeding roles...');
  await seedRoles(dataSource);

  // Seed Admin User
  console.log('👤 Seeding admin user...');
  await seedAdminUser(dataSource);

  // Seed Organization Settings
  console.log('⚙️  Seeding organization settings...');
  await seedOrganizationSettings(dataSource);

  // Seed Leave Types
  console.log('🏖️  Seeding leave types...');
  await seedLeaveTypes(dataSource);

  // Seed Expense Categories
  console.log('💰 Seeding expense categories...');
  await seedExpenseCategories(dataSource);

  // Seed Departments
  console.log('🏢 Seeding departments...');
  await seedDepartments(dataSource);

  // Seed Designations
  console.log('📋 Seeding designations...');
  await seedDesignations(dataSource);

  console.log('✅ Database seeding complete!');
}

async function seedPermissions(dataSource: DataSource) {
  const permissionRepository = dataSource.getRepository('Permission');

  const permissions = [
    // Employee Management
    { name: 'employee.create', displayName: 'Create Employee', description: 'Create new employees', module: 'employees', action: 'create' },
    { name: 'employee.read', displayName: 'View Employees', description: 'View employee information', module: 'employees', action: 'read' },
    { name: 'employee.update', displayName: 'Update Employee', description: 'Update employee information', module: 'employees', action: 'update' },
    { name: 'employee.delete', displayName: 'Delete Employee', description: 'Delete employees', module: 'employees', action: 'delete' },

    // User Management
    { name: 'user.create', displayName: 'Create User', description: 'Create new users', module: 'users', action: 'create' },
    { name: 'user.read', displayName: 'View Users', description: 'View user accounts', module: 'users', action: 'read' },
    { name: 'user.update', displayName: 'Update User', description: 'Update user accounts', module: 'users', action: 'update' },
    { name: 'user.delete', displayName: 'Delete User', description: 'Delete user accounts', module: 'users', action: 'delete' },

    // Role Management
    { name: 'role.create', displayName: 'Create Role', description: 'Create new roles', module: 'roles', action: 'create' },
    { name: 'role.read', displayName: 'View Roles', description: 'View roles', module: 'roles', action: 'read' },
    { name: 'role.update', displayName: 'Update Role', description: 'Update roles', module: 'roles', action: 'update' },
    { name: 'role.delete', displayName: 'Delete Role', description: 'Delete roles', module: 'roles', action: 'delete' },

    // Payroll
    { name: 'payroll.create', displayName: 'Create Payslip', description: 'Create payslips', module: 'payroll', action: 'create' },
    { name: 'payroll.read', displayName: 'View Payroll', description: 'View payroll information', module: 'payroll', action: 'read' },
    { name: 'payroll.update', displayName: 'Update Payroll', description: 'Update payroll information', module: 'payroll', action: 'update' },
    { name: 'payroll.delete', displayName: 'Delete Payslip', description: 'Delete payslips', module: 'payroll', action: 'delete' },

    // Leave Management
    { name: 'leave.create', displayName: 'Request Leave', description: 'Create leave requests', module: 'leave', action: 'create' },
    { name: 'leave.read', displayName: 'View Leave', description: 'View leave requests', module: 'leave', action: 'read' },
    { name: 'leave.update', displayName: 'Update Leave', description: 'Update leave requests', module: 'leave', action: 'update' },
    { name: 'leave.approve', displayName: 'Approve Leave', description: 'Approve leave requests', module: 'leave', action: 'approve' },
    { name: 'leave.reject', displayName: 'Reject Leave', description: 'Reject leave requests', module: 'leave', action: 'reject' },

    // Attendance
    { name: 'attendance.clock_in', displayName: 'Clock In', description: 'Clock in for work', module: 'attendance', action: 'clock_in' },
    { name: 'attendance.clock_out', displayName: 'Clock Out', description: 'Clock out from work', module: 'attendance', action: 'clock_out' },
    { name: 'attendance.read', displayName: 'View Attendance', description: 'View attendance records', module: 'attendance', action: 'read' },
    { name: 'attendance.update', displayName: 'Update Attendance', description: 'Update attendance records', module: 'attendance', action: 'update' },

    // Expenses
    { name: 'expense.create', displayName: 'Submit Expense', description: 'Submit expense claims', module: 'expenses', action: 'create' },
    { name: 'expense.read', displayName: 'View Expenses', description: 'View expense claims', module: 'expenses', action: 'read' },
    { name: 'expense.update', displayName: 'Update Expense', description: 'Update expense claims', module: 'expenses', action: 'update' },
    { name: 'expense.approve', displayName: 'Approve Expense', description: 'Approve expense claims', module: 'expenses', action: 'approve' },
    { name: 'expense.reject', displayName: 'Reject Expense', description: 'Reject expense claims', module: 'expenses', action: 'reject' },

    // Documents
    { name: 'document.upload', displayName: 'Upload Document', description: 'Upload documents', module: 'documents', action: 'upload' },
    { name: 'document.read', displayName: 'View Documents', description: 'View documents', module: 'documents', action: 'read' },
    { name: 'document.download', displayName: 'Download Document', description: 'Download documents', module: 'documents', action: 'download' },
    { name: 'document.verify', displayName: 'Verify Document', description: 'Verify documents', module: 'documents', action: 'verify' },
    { name: 'document.delete', displayName: 'Delete Document', description: 'Delete documents', module: 'documents', action: 'delete' },

    // Performance
    { name: 'performance.create', displayName: 'Create Review', description: 'Create performance reviews', module: 'performance', action: 'create' },
    { name: 'performance.read', displayName: 'View Reviews', description: 'View performance reviews', module: 'performance', action: 'read' },
    { name: 'performance.update', displayName: 'Update Review', description: 'Update performance reviews', module: 'performance', action: 'update' },
    { name: 'performance.complete', displayName: 'Complete Review', description: 'Complete performance reviews', module: 'performance', action: 'complete' },
    { name: 'performance.acknowledge', displayName: 'Acknowledge Review', description: 'Acknowledge performance reviews', module: 'performance', action: 'acknowledge' },

    // Compliance
    { name: 'compliance.create', displayName: 'Add Certification', description: 'Add certifications/training', module: 'compliance', action: 'create' },
    { name: 'compliance.read', displayName: 'View Compliance', description: 'View compliance records', module: 'compliance', action: 'read' },
    { name: 'compliance.update', displayName: 'Update Compliance', description: 'Update compliance records', module: 'compliance', action: 'update' },
    { name: 'compliance.verify', displayName: 'Verify Certification', description: 'Verify certifications', module: 'compliance', action: 'verify' },

    // Shifts
    { name: 'shift.create', displayName: 'Create Shift', description: 'Create shift schedules', module: 'shifts', action: 'create' },
    { name: 'shift.read', displayName: 'View Shifts', description: 'View shift schedules', module: 'shifts', action: 'read' },
    { name: 'shift.update', displayName: 'Update Shift', description: 'Update shift schedules', module: 'shifts', action: 'update' },
    { name: 'shift.swap', displayName: 'Request Shift Swap', description: 'Request shift swaps', module: 'shifts', action: 'swap' },
    { name: 'shift.approve_swap', displayName: 'Approve Shift Swap', description: 'Approve shift swap requests', module: 'shifts', action: 'approve_swap' },

    // Settings
    { name: 'settings.read', displayName: 'View Settings', description: 'View system settings', module: 'settings', action: 'read' },
    { name: 'settings.update', displayName: 'Update Settings', description: 'Update system settings', module: 'settings', action: 'update' },

    // Audit Logs
    { name: 'audit.read', displayName: 'View Audit Logs', description: 'View audit logs', module: 'audit', action: 'read' },
  ];

  for (const permission of permissions) {
    const existing = await permissionRepository.findOne({ where: { name: permission.name } });
    if (!existing) {
      await permissionRepository.save(permission);
    }
  }

  console.log(`   ✓ Seeded ${permissions.length} permissions`);
}

async function seedRoles(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository('Role');
  const permissionRepository = dataSource.getRepository('Permission');

  // Get all permissions
  const allPermissions = await permissionRepository.find();

  // Admin role - all permissions
  const adminPermissions = allPermissions;

  // HR role - most permissions except system settings
  const hrPermissions = allPermissions.filter(p =>
    !p.name.includes('settings.update') &&
    !p.name.includes('role.delete') &&
    !p.name.includes('user.delete')
  );

  // Manager role - team management permissions
  const managerPermissions = allPermissions.filter(p =>
    p.name.includes('.read') ||
    p.name.includes('leave.approve') ||
    p.name.includes('leave.reject') ||
    p.name.includes('expense.approve') ||
    p.name.includes('expense.reject') ||
    p.name.includes('performance.') ||
    p.name.includes('shift.')
  );

  // Employee role - self-service permissions
  const employeePermissions = allPermissions.filter(p =>
    p.name === 'employee.read' ||
    p.name === 'leave.create' ||
    p.name === 'leave.read' ||
    p.name === 'attendance.clock_in' ||
    p.name === 'attendance.clock_out' ||
    p.name === 'attendance.read' ||
    p.name === 'expense.create' ||
    p.name === 'expense.read' ||
    p.name === 'document.upload' ||
    p.name === 'document.read' ||
    p.name === 'document.download' ||
    p.name === 'performance.read' ||
    p.name === 'performance.acknowledge' ||
    p.name === 'compliance.read' ||
    p.name === 'shift.read' ||
    p.name === 'shift.swap' ||
    p.name === 'payroll.read'
  );

  const roles = [
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Full system access with all permissions',
      isSystemRole: true,
      permissions: adminPermissions,
    },
    {
      name: 'hr',
      displayName: 'HR Manager',
      description: 'Human Resources management access',
      isSystemRole: true,
      permissions: hrPermissions,
    },
    {
      name: 'manager',
      displayName: 'Department Manager',
      description: 'Team and department management access',
      isSystemRole: true,
      permissions: managerPermissions,
    },
    {
      name: 'employee',
      displayName: 'Employee',
      description: 'Standard employee self-service access',
      isSystemRole: true,
      permissions: employeePermissions,
    },
  ];

  for (const roleData of roles) {
    const existing = await roleRepository.findOne({ where: { name: roleData.name } });
    if (!existing) {
      await roleRepository.save(roleData);
    }
  }

  console.log(`   ✓ Seeded ${roles.length} roles`);
}

async function seedAdminUser(dataSource: DataSource) {
  const userRepository = dataSource.getRepository('User');
  const roleRepository = dataSource.getRepository('Role');

  const adminRole = await roleRepository.findOne({ where: { name: 'admin' } });

  const adminExists = await userRepository.findOne({ where: { email: 'admin@complihr.com' } });

  if (!adminExists && adminRole) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('Admin@123', saltRounds);

    await userRepository.save({
      email: 'admin@complihr.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
      emailVerified: true,
      roles: [adminRole],
    });

    console.log('   ✓ Created admin user (admin@complihr.com / Admin@123)');
  } else {
    console.log('   ℹ Admin user already exists');
  }
}

async function seedOrganizationSettings(dataSource: DataSource) {
  const settingsRepository = dataSource.getRepository('OrganizationSettings');

  const existing = await settingsRepository.findOne({ where: { organizationId: 1 } });

  if (!existing) {
    await settingsRepository.save({
      organizationId: 1,
      employeeIdPattern: '{ORG}-EMP-{YEAR}-{SEQUENCE:5}',
      employeeIdSequence: 0,
      payrollIdPattern: '{ORG}-PAY-{YEAR}{MONTH}-{SEQUENCE:4}',
      payrollIdSequence: 0,
      leaveIdPattern: '{ORG}-LV-{YEAR}-{SEQUENCE:4}',
      leaveIdSequence: 0,
      expenseIdPattern: '{ORG}-EXP-{YEAR}-{SEQUENCE:4}',
      expenseIdSequence: 0,
      shiftIdPattern: '{ORG}-SH-{YYYYMMDD}-{SEQUENCE:3}',
      shiftIdSequence: 0,
      departmentCodePattern: '{ORG}-DEPT-{SEQUENCE:3}',
      departmentCodeSequence: 0,
      fiscalYearStartMonth: 4, // April (UK tax year)
      defaultCurrency: 'GBP',
      timezone: 'Europe/London',
      dateFormat: 'DD/MM/YYYY',
      payrollFrequency: 'Monthly',
      payrollDayOfMonth: 28,
      leaveYearStartMonth: 1, // January
      carryForwardEnabled: true,
      maxCarryForwardDays: 5,
      standardWorkingHoursPerDay: 8.0,
      standardWorkingDaysPerWeek: 5,
    });

    console.log('   ✓ Created organization settings');
  } else {
    console.log('   ℹ Organization settings already exist');
  }
}

async function seedLeaveTypes(dataSource: DataSource) {
  const leaveTypeRepository = dataSource.getRepository('LeaveType');

  const leaveTypes = [
    {
      name: 'Annual Leave',
      code: 'AL',
      description: 'Statutory annual leave (28 days minimum for full-time)',
      color: '#1976d2',
      isPaid: true,
      requiresApproval: true,
      requiresDocument: false,
      maxDaysPerYear: 28,
      minDaysNotice: 7,
      maxConsecutiveDays: 15,
      isCarryForward: true,
      carryForwardMaxDays: 5,
      isEncashable: false,
      isStatutory: true,
      isActive: true,
      displayOrder: 1,
    },
    {
      name: 'Sick Leave',
      code: 'SL',
      description: 'Statutory Sick Pay (SSP) eligible',
      color: '#f44336',
      isPaid: true,
      requiresApproval: false,
      requiresDocument: true, // Fit note required after 7 days
      isCarryForward: false,
      isEncashable: false,
      isStatutory: true,
      isActive: true,
      displayOrder: 2,
    },
    {
      name: 'Maternity Leave',
      code: 'ML',
      description: 'Statutory maternity leave (up to 52 weeks)',
      color: '#e91e63',
      isPaid: true, // First 39 weeks
      requiresApproval: true,
      requiresDocument: true,
      maxDaysPerYear: 364, // 52 weeks
      minDaysNotice: 90,
      isCarryForward: false,
      isEncashable: false,
      genderSpecific: 'female',
      isStatutory: true,
      isActive: true,
      displayOrder: 3,
    },
    {
      name: 'Paternity Leave',
      code: 'PL',
      description: 'Statutory paternity leave (2 weeks)',
      color: '#3f51b5',
      isPaid: true,
      requiresApproval: true,
      requiresDocument: true,
      maxDaysPerYear: 14, // 2 weeks
      minDaysNotice: 90,
      isCarryForward: false,
      isEncashable: false,
      genderSpecific: 'male',
      isStatutory: true,
      isActive: true,
      displayOrder: 4,
    },
    {
      name: 'Parental Leave',
      code: 'PRNL',
      description: 'Unpaid parental leave (up to 18 weeks)',
      color: '#9c27b0',
      isPaid: false,
      requiresApproval: true,
      requiresDocument: true,
      maxDaysPerYear: 28, // 4 weeks per year
      minDaysNotice: 21,
      isCarryForward: false,
      isEncashable: false,
      isStatutory: true,
      isActive: true,
      displayOrder: 5,
    },
    {
      name: 'Compassionate Leave',
      code: 'CL',
      description: 'Leave for bereavement and family emergencies',
      color: '#607d8b',
      isPaid: true,
      requiresApproval: true,
      requiresDocument: false,
      maxDaysPerYear: 5,
      isCarryForward: false,
      isEncashable: false,
      isStatutory: false,
      isActive: true,
      displayOrder: 6,
    },
    {
      name: 'Unpaid Leave',
      code: 'UL',
      description: 'Unpaid leave for personal reasons',
      color: '#795548',
      isPaid: false,
      requiresApproval: true,
      requiresDocument: false,
      minDaysNotice: 14,
      isCarryForward: false,
      isEncashable: false,
      isStatutory: false,
      isActive: true,
      displayOrder: 7,
    },
  ];

  for (const leaveType of leaveTypes) {
    const existing = await leaveTypeRepository.findOne({ where: { code: leaveType.code } });
    if (!existing) {
      await leaveTypeRepository.save(leaveType);
    }
  }

  console.log(`   ✓ Seeded ${leaveTypes.length} leave types`);
}

async function seedExpenseCategories(dataSource: DataSource) {
  const categoryRepository = dataSource.getRepository('ExpenseCategory');

  const categories = [
    {
      categoryName: 'Travel & Transport',
      categoryCode: 'TRAVEL',
      description: 'Business travel and transportation costs',
      isActive: true,
    },
    {
      categoryName: 'Accommodation',
      categoryCode: 'ACCOM',
      description: 'Hotel and lodging expenses',
      isActive: true,
    },
    {
      categoryName: 'Meals & Entertainment',
      categoryCode: 'MEALS',
      description: 'Business meals and entertainment',
      isActive: true,
    },
    {
      categoryName: 'Office Supplies',
      categoryCode: 'OFFICE',
      description: 'Office supplies and stationery',
      isActive: true,
    },
    {
      categoryName: 'Training & Development',
      categoryCode: 'TRAINING',
      description: 'Training courses and professional development',
      isActive: true,
    },
    {
      categoryName: 'Uniform & Equipment',
      categoryCode: 'UNIFORM',
      description: 'Work uniform and safety equipment',
      isActive: true,
    },
    {
      categoryName: 'Communication',
      categoryCode: 'COMM',
      description: 'Phone and internet expenses',
      isActive: true,
    },
    {
      categoryName: 'Parking & Tolls',
      categoryCode: 'PARKING',
      description: 'Parking fees and road tolls',
      isActive: true,
    },
  ];

  for (const category of categories) {
    const existing = await categoryRepository.findOne({ where: { categoryCode: category.categoryCode } });
    if (!existing) {
      await categoryRepository.save(category);
    }
  }

  console.log(`   ✓ Seeded ${categories.length} expense categories`);
}

async function seedDepartments(dataSource: DataSource) {
  const departmentRepository = dataSource.getRepository('Department');

  const departments = [
    {
      name: 'Sales',
      code: 'SALES',
      description: 'Sales and customer service department',
      isActive: true,
    },
    {
      name: 'Operations',
      code: 'OPS',
      description: 'Store operations and logistics',
      isActive: true,
    },
    {
      name: 'Human Resources',
      code: 'HR',
      description: 'Human resources and recruitment',
      isActive: true,
    },
    {
      name: 'Finance',
      code: 'FIN',
      description: 'Finance and accounting',
      isActive: true,
    },
    {
      name: 'IT',
      code: 'IT',
      description: 'Information technology',
      isActive: true,
    },
  ];

  for (const department of departments) {
    const existing = await departmentRepository.findOne({ where: { code: department.code } });
    if (!existing) {
      await departmentRepository.save(department);
    }
  }

  console.log(`   ✓ Seeded ${departments.length} departments`);
}

async function seedDesignations(dataSource: DataSource) {
  const designationRepository = dataSource.getRepository('Designation');

  const designations = [
    { title: 'Store Manager', level: 5, isActive: true },
    { title: 'Assistant Manager', level: 4, isActive: true },
    { title: 'Team Leader', level: 3, isActive: true },
    { title: 'Senior Sales Associate', level: 2, isActive: true },
    { title: 'Sales Associate', level: 1, isActive: true },
    { title: 'Stock Controller', level: 2, isActive: true },
    { title: 'Cashier', level: 1, isActive: true },
    { title: 'Customer Service Representative', level: 2, isActive: true },
    { title: 'HR Coordinator', level: 3, isActive: true },
    { title: 'Finance Officer', level: 3, isActive: true },
  ];

  for (const designation of designations) {
    const existing = await designationRepository.findOne({ where: { title: designation.title } });
    if (!existing) {
      await designationRepository.save(designation);
    }
  }

  console.log(`   ✓ Seeded ${designations.length} designations`);
}
