-- =========================================
-- CompliHR Database Setup Script
-- =========================================
-- This script creates the database and schemas
-- Run this as postgres superuser

-- Create database (if not exists)
-- You may need to run this separately:
-- CREATE DATABASE complihr;

-- Connect to complihr database
\c complihr;

-- =========================================
-- Create Schemas
-- =========================================

CREATE SCHEMA IF NOT EXISTS admin;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS leave;
CREATE SCHEMA IF NOT EXISTS time_tracking;
CREATE SCHEMA IF NOT EXISTS payroll;
CREATE SCHEMA IF NOT EXISTS expenses;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS performance;
CREATE SCHEMA IF NOT EXISTS documents;

-- =========================================
-- Grant Permissions (adjust username as needed)
-- =========================================

GRANT ALL PRIVILEGES ON SCHEMA admin TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA core TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA leave TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA time_tracking TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA payroll TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA expenses TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA compliance TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA performance TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA documents TO postgres;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA admin TO postgres;
GRANT USAGE ON SCHEMA core TO postgres;
GRANT USAGE ON SCHEMA leave TO postgres;
GRANT USAGE ON SCHEMA time_tracking TO postgres;
GRANT USAGE ON SCHEMA payroll TO postgres;
GRANT USAGE ON SCHEMA expenses TO postgres;
GRANT USAGE ON SCHEMA compliance TO postgres;
GRANT USAGE ON SCHEMA performance TO postgres;
GRANT USAGE ON SCHEMA documents TO postgres;

-- =========================================
-- Enable Extensions
-- =========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- Confirmation
-- =========================================

SELECT 'Database setup complete!' as status;
SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('admin', 'core', 'leave', 'time_tracking', 'payroll', 'expenses', 'compliance', 'performance', 'documents');
