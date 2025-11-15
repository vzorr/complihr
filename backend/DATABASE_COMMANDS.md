# Database Commands Quick Reference

## Essential Commands

### First Time Setup
```bash
npm run db:setup      # Run migrations + seed data
npm run db:verify     # Verify everything is set up correctly
```

### Daily Development
```bash
npm run db:migrate              # Run pending migrations
npm run db:seed                 # Seed/re-seed data
npm run db:verify               # Check database state
```

### Migration Management
```bash
npm run db:migrate              # Run all pending migrations
npm run db:migrate:revert       # Revert last migration
npm run db:migrate:generate -- MigrationName   # Generate migration from entity changes
```

### Database Reset (Development Only)
```bash
npm run db:reset      # Drop all + migrate + seed (DESTRUCTIVE!)
```

---

## All Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run all pending migrations |
| `npm run db:migrate:revert` | Revert the last migration |
| `npm run db:migrate:generate -- <name>` | Generate a new migration from entity changes |
| `npm run db:seed` | Populate database with initial data |
| `npm run db:seed:clear` | Clear all seed data |
| `npm run db:verify` | Verify database setup and seed data |
| `npm run db:setup` | Complete setup (migrate + seed) |
| `npm run db:reset` | Full reset (drop + migrate + seed) ⚠️ DESTRUCTIVE |
| `npm run schema:drop` | Drop all database schemas ⚠️ DESTRUCTIVE |
| `npm run schema:sync` | Sync schema (not recommended for production) |

---

## Default Credentials

After running `npm run db:seed`, you can log in with:

**Email:** admin@complihr.com
**Password:** Admin@123

⚠️ **Change this password immediately!**

---

## Seed Data Includes

- ✅ 52 permissions (employee, user, role, payroll, leave, attendance, expense, document, performance, compliance, shift, settings, audit)
- ✅ 4 roles (admin, hr, manager, employee)
- ✅ 5 users including admin
- ✅ 7 UK leave types (Annual, Sick, Maternity, Paternity, Parental, Compassionate, Unpaid)
- ✅ 8 expense categories
- ✅ 10 departments
- ✅ 17 designations
- ✅ Organization settings with ID patterns

---

## Troubleshooting

### Check if migrations ran
```bash
npm run db:verify
```

### Connect to database directly
```bash
psql complihr_db
```

### Reset everything (development only)
```bash
npm run db:reset
```

### Check migration status in database
```sql
SELECT * FROM migrations ORDER BY timestamp DESC;
```

---

## Notes

- All commands are idempotent and safe to re-run
- Migrations use `IF NOT EXISTS` / `IF EXISTS` clauses
- Seed script checks for existing data before inserting
- Use `db:reset` only in development - it destroys all data
