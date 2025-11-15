import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTimeTrackingTables1704067203000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Work schedules
    await queryRunner.query(`
      CREATE TABLE time_tracking.work_schedules (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        schedule_type VARCHAR(20) DEFAULT 'fixed', -- fixed, flexible, shift
        weekly_hours DECIMAL(5, 2) DEFAULT 40.00,
        days_per_week INT DEFAULT 5,
        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Work schedule details (day-by-day schedule)
    await queryRunner.query(`
      CREATE TABLE time_tracking.work_schedule_details (
        id BIGSERIAL PRIMARY KEY,
        work_schedule_id BIGINT NOT NULL REFERENCES time_tracking.work_schedules(id) ON DELETE CASCADE,
        day_of_week INT NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
        is_working_day BOOLEAN DEFAULT true,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        break_duration_minutes INT DEFAULT 60,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Schedule assignments to employees
    await queryRunner.query(`
      CREATE TABLE time_tracking.schedule_assignments (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        work_schedule_id BIGINT NOT NULL REFERENCES time_tracking.work_schedules(id),
        effective_from DATE NOT NULL,
        effective_to DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Public holidays
    await queryRunner.query(`
      CREATE TABLE time_tracking.holidays (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        is_recurring BOOLEAN DEFAULT false, -- If true, applies every year
        is_mandatory BOOLEAN DEFAULT true, -- If false, employees can work
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Shifts (for retail scheduling)
    await queryRunner.query(`
      CREATE TABLE time_tracking.shifts (
        id BIGSERIAL PRIMARY KEY,
        shift_name VARCHAR(100) NOT NULL,
        shift_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        break_duration_minutes INT DEFAULT 0,
        department_id BIGINT REFERENCES core.departments(id),
        location VARCHAR(100),
        required_staff INT DEFAULT 1,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Shift assignments
    await queryRunner.query(`
      CREATE TABLE time_tracking.shift_assignments (
        id BIGSERIAL PRIMARY KEY,
        shift_id BIGINT NOT NULL REFERENCES time_tracking.shifts(id) ON DELETE CASCADE,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        assignment_status VARCHAR(20) DEFAULT 'assigned', -- assigned, confirmed, completed, cancelled
        confirmed_at TIMESTAMP,
        completed_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        cancellation_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        UNIQUE(shift_id, employee_id)
      )
    `);

    // Shift swap requests
    await queryRunner.query(`
      CREATE TABLE time_tracking.shift_swaps (
        id BIGSERIAL PRIMARY KEY,
        requesting_employee_id BIGINT NOT NULL REFERENCES core.employees(id),
        original_shift_id BIGINT NOT NULL REFERENCES time_tracking.shifts(id),
        target_employee_id BIGINT REFERENCES core.employees(id),
        swap_shift_id BIGINT REFERENCES time_tracking.shifts(id),
        swap_type VARCHAR(20) NOT NULL, -- swap, cover, giveaway
        status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, approved, completed
        reason TEXT,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP,
        approved_at TIMESTAMP,
        approved_by BIGINT REFERENCES admin.users(id),
        completed_at TIMESTAMP
      )
    `);

    // Clock events (clock in/out)
    await queryRunner.query(`
      CREATE TABLE time_tracking.clock_events (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        event_type VARCHAR(20) NOT NULL, -- clock_in, clock_out, break_start, break_end
        event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        -- Location tracking
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        location_name VARCHAR(255),
        ip_address VARCHAR(45),
        device_type VARCHAR(50), -- mobile, web, kiosk
        device_id VARCHAR(100),

        -- Photo verification (optional)
        photo_url TEXT,

        -- Shift association
        shift_id BIGINT REFERENCES time_tracking.shifts(id),

        -- Manual entry
        is_manual_entry BOOLEAN DEFAULT false,
        manual_entry_reason TEXT,
        approved_by BIGINT REFERENCES admin.users(id),
        approved_at TIMESTAMP,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Attendance records (daily summary)
    await queryRunner.query(`
      CREATE TABLE time_tracking.attendance_records (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,

        -- Times
        clock_in_time TIMESTAMP,
        clock_out_time TIMESTAMP,
        total_break_minutes INT DEFAULT 0,
        total_work_minutes INT,
        overtime_minutes INT DEFAULT 0,

        -- Shift info
        shift_id BIGINT REFERENCES time_tracking.shifts(id),
        scheduled_start TIME,
        scheduled_end TIME,

        -- Status
        attendance_status VARCHAR(20), -- present, absent, late, half_day, on_leave
        is_late BOOLEAN DEFAULT false,
        late_by_minutes INT DEFAULT 0,
        is_early_departure BOOLEAN DEFAULT false,
        early_departure_minutes INT DEFAULT 0,

        -- Approval
        is_approved BOOLEAN DEFAULT false,
        approved_by BIGINT REFERENCES admin.users(id),
        approved_at TIMESTAMP,

        -- Notes
        notes TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id),

        UNIQUE(employee_id, attendance_date)
      )
    `);

    // Attendance summary (monthly rollup for performance)
    await queryRunner.query(`
      CREATE TABLE time_tracking.attendance_summary (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        year INT NOT NULL,
        month INT NOT NULL,

        -- Counts
        total_working_days INT DEFAULT 0,
        days_present INT DEFAULT 0,
        days_absent INT DEFAULT 0,
        days_on_leave INT DEFAULT 0,
        days_late INT DEFAULT 0,
        days_half_day INT DEFAULT 0,

        -- Hours
        total_hours_worked DECIMAL(10, 2) DEFAULT 0,
        regular_hours DECIMAL(10, 2) DEFAULT 0,
        overtime_hours DECIMAL(10, 2) DEFAULT 0,

        -- Attendance rate
        attendance_percentage DECIMAL(5, 2),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(employee_id, year, month)
      )
    `);

    // Timesheets (for project-based time tracking)
    await queryRunner.query(`
      CREATE TABLE time_tracking.timesheets (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL REFERENCES core.employees(id) ON DELETE CASCADE,
        timesheet_date DATE NOT NULL,

        -- Project/task info
        project_name VARCHAR(255),
        task_description TEXT,

        -- Time
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        duration_minutes INT,

        -- Billing
        is_billable BOOLEAN DEFAULT false,
        hourly_rate DECIMAL(10, 2),

        -- Status
        status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, approved, rejected
        submitted_at TIMESTAMP,
        approved_by BIGINT REFERENCES admin.users(id),
        approved_at TIMESTAMP,
        rejected_at TIMESTAMP,
        rejection_reason TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Rota templates (for recurring schedules)
    await queryRunner.query(`
      CREATE TABLE time_tracking.rota_templates (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        department_id BIGINT REFERENCES core.departments(id),
        template_data JSONB NOT NULL, -- Store shift pattern as JSON
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Attendance policies
    await queryRunner.query(`
      CREATE TABLE time_tracking.attendance_policies (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,

        -- Late policy
        late_threshold_minutes INT DEFAULT 15,
        grace_period_minutes INT DEFAULT 5,

        -- Early departure
        early_departure_threshold_minutes INT DEFAULT 15,

        -- Overtime
        overtime_threshold_daily_minutes INT DEFAULT 480, -- 8 hours
        overtime_multiplier DECIMAL(3, 2) DEFAULT 1.5,

        -- Break policy
        mandatory_break_after_hours DECIMAL(3, 1) DEFAULT 6.0,
        mandatory_break_duration_minutes INT DEFAULT 20,

        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES admin.users(id),
        updated_by BIGINT REFERENCES admin.users(id)
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX idx_clock_events_employee ON time_tracking.clock_events(employee_id, event_timestamp DESC)`);
    await queryRunner.query(`CREATE INDEX idx_attendance_records_employee_date ON time_tracking.attendance_records(employee_id, attendance_date DESC)`);
    await queryRunner.query(`CREATE INDEX idx_attendance_summary_employee ON time_tracking.attendance_summary(employee_id, year DESC, month DESC)`);
    await queryRunner.query(`CREATE INDEX idx_shifts_date ON time_tracking.shifts(shift_date, department_id)`);
    await queryRunner.query(`CREATE INDEX idx_shift_assignments_employee ON time_tracking.shift_assignments(employee_id, shift_id)`);
    await queryRunner.query(`CREATE INDEX idx_timesheets_employee ON time_tracking.timesheets(employee_id, timesheet_date DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.attendance_policies CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.rota_templates CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.timesheets CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.attendance_summary CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.attendance_records CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.clock_events CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.shift_swaps CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.shift_assignments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.shifts CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.holidays CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.schedule_assignments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.work_schedule_details CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_tracking.work_schedules CASCADE`);
  }
}
