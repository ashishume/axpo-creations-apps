-- =============================================================================
-- School (Teaching) schema: full SQL to create all tables from scratch
-- Backend-compatible (teaching API). Run in Supabase SQL Editor or any Postgres.
-- Tables prefixed with school_xx_. For fresh DB run as-is; to recreate see bottom.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Roles and permissions (no FKs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);
CREATE UNIQUE INDEX IF NOT EXISTS school_xx_roles_name_key ON school_xx_roles (name);

CREATE TABLE IF NOT EXISTS school_xx_permissions (
  id VARCHAR(50) PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS school_xx_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES school_xx_roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(50) NOT NULL REFERENCES school_xx_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  UNIQUE(role_id, permission_id)
);

-- -----------------------------------------------------------------------------
-- Organizations (tenant boundary)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100),
  billing_email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);
CREATE UNIQUE INDEX IF NOT EXISTS school_xx_organizations_slug_key ON school_xx_organizations (slug) WHERE slug IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Users (depends: roles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES school_xx_roles(id),
  password_hash VARCHAR(255),
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  staff_id UUID,
  student_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);
CREATE UNIQUE INDEX IF NOT EXISTS school_xx_users_username_key ON school_xx_users (username);

-- -----------------------------------------------------------------------------
-- Schools (no FK)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact VARCHAR(100),
  logo_url TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  plan_id VARCHAR(50) NOT NULL DEFAULT 'starter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT school_xx_schools_plan_id_check CHECK (plan_id IN ('starter', 'ai_assistant'))
);

-- -----------------------------------------------------------------------------
-- Sessions (depends: schools)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school_xx_schools(id) ON DELETE CASCADE,
  year VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  salary_due_day INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT school_xx_sessions_salary_due_day_check CHECK (salary_due_day >= 1 AND salary_due_day <= 28),
  UNIQUE(school_id, year)
);

-- -----------------------------------------------------------------------------
-- Classes (depends: sessions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  registration_fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
  admission_fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
  annual_fund NUMERIC(10, 2) NOT NULL DEFAULT 0,
  monthly_fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
  late_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  late_fee_frequency VARCHAR(20) NOT NULL DEFAULT 'weekly',
  due_day_of_month INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT school_xx_classes_due_day_check CHECK (due_day_of_month >= 1 AND due_day_of_month <= 28),
  CONSTRAINT school_xx_classes_late_fee_frequency_check CHECK (late_fee_frequency IN ('daily', 'weekly')),
  UNIQUE(session_id, name)
);

-- -----------------------------------------------------------------------------
-- Students (depends: sessions, classes, users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES school_xx_classes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES school_xx_users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  fee_type VARCHAR(50) NOT NULL DEFAULT 'Regular',
  father_name VARCHAR(255),
  mother_name VARCHAR(255),
  guardian_phone VARCHAR(20),
  current_address TEXT,
  permanent_address TEXT,
  blood_group VARCHAR(5),
  health_issues TEXT,
  registration_fees NUMERIC(10, 2),
  admission_fees NUMERIC(10, 2),
  annual_fund NUMERIC(10, 2),
  monthly_fees NUMERIC(10, 2),
  transport_fees NUMERIC(10, 2),
  registration_paid BOOLEAN NOT NULL DEFAULT FALSE,
  admission_paid BOOLEAN NOT NULL DEFAULT FALSE,
  annual_fund_paid BOOLEAN NOT NULL DEFAULT FALSE,
  due_day_of_month INTEGER,
  late_fee_amount NUMERIC(10, 2),
  late_fee_frequency VARCHAR(20),
  target_amount NUMERIC(10, 2),
  fine_per_day NUMERIC(10, 2),
  due_frequency VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT school_xx_students_due_day_check CHECK (due_day_of_month IS NULL OR (due_day_of_month >= 1 AND due_day_of_month <= 28)),
  UNIQUE(session_id, student_id)
);

-- -----------------------------------------------------------------------------
-- Fee payments (depends: students)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES school_xx_students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  receipt_number VARCHAR(100),
  fee_category VARCHAR(50) NOT NULL,
  month VARCHAR(7),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- -----------------------------------------------------------------------------
-- Staff (depends: sessions, users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES school_xx_users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL,
  monthly_salary NUMERIC(10, 2) NOT NULL,
  subject_or_grade VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  salary_due_day INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT school_xx_staff_salary_due_day_check CHECK (salary_due_day >= 1 AND salary_due_day <= 28),
  UNIQUE(session_id, employee_id)
);

-- -----------------------------------------------------------------------------
-- Salary payments (depends: staff)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES school_xx_staff(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  expected_amount NUMERIC(10, 2) NOT NULL,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  due_date DATE NOT NULL,
  payment_date DATE,
  late_days INTEGER NOT NULL DEFAULT 0,
  method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT school_xx_salary_payments_status_check CHECK (status IN ('Pending', 'Paid', 'Partially Paid')),
  UNIQUE(staff_id, month)
);

-- -----------------------------------------------------------------------------
-- Expenses (depends: sessions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  vendor_payee VARCHAR(255),
  payment_method VARCHAR(50),
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- -----------------------------------------------------------------------------
-- Fixed monthly costs (depends: sessions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_fixed_monthly_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- -----------------------------------------------------------------------------
-- Stocks (depends: sessions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  publisher_name VARCHAR(255) NOT NULL,
  description TEXT,
  purchase_date DATE NOT NULL,
  total_credit_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  settled_date DATE,
  settled_amount NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT school_xx_stocks_status_check CHECK (status IN ('open', 'cleared'))
);

-- -----------------------------------------------------------------------------
-- Stock transactions (depends: stocks)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_xx_stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES school_xx_stocks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  quantity INTEGER,
  description TEXT,
  receipt_number VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT school_xx_stock_transactions_type_check CHECK (type IN ('purchase', 'sale', 'return'))
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_school_xx_users_role ON school_xx_users(role_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_users_username ON school_xx_users(username);
CREATE INDEX IF NOT EXISTS idx_school_xx_sessions_school ON school_xx_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_classes_session ON school_xx_classes(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_students_session ON school_xx_students(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_students_class ON school_xx_students(class_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_fee_payments_student ON school_xx_fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_staff_session ON school_xx_staff(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_salary_payments_staff ON school_xx_salary_payments(staff_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_salary_payments_month ON school_xx_salary_payments(month);
CREATE INDEX IF NOT EXISTS idx_school_xx_expenses_session ON school_xx_expenses(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_fixed_monthly_costs_session ON school_xx_fixed_monthly_costs(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_stocks_session ON school_xx_stocks(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_stock_transactions_stock ON school_xx_stock_transactions(stock_id);

-- -----------------------------------------------------------------------------
-- Seed: permissions
-- -----------------------------------------------------------------------------
INSERT INTO school_xx_permissions (id, module, action, description) VALUES
  ('dashboard:view', 'dashboard', 'view', 'View dashboard'),
  ('students:view', 'students', 'view', 'View students'),
  ('students:create', 'students', 'create', 'Create students'),
  ('students:edit', 'students', 'edit', 'Edit students'),
  ('students:delete', 'students', 'delete', 'Delete students'),
  ('staff:view', 'staff', 'view', 'View staff'),
  ('staff:create', 'staff', 'create', 'Create staff'),
  ('staff:edit', 'staff', 'edit', 'Edit staff'),
  ('staff:delete', 'staff', 'delete', 'Delete staff'),
  ('expenses:view', 'expenses', 'view', 'View expenses'),
  ('expenses:create', 'expenses', 'create', 'Create expenses'),
  ('expenses:edit', 'expenses', 'edit', 'Edit expenses'),
  ('expenses:delete', 'expenses', 'delete', 'Delete expenses'),
  ('stocks:view', 'stocks', 'view', 'View stocks'),
  ('stocks:create', 'stocks', 'create', 'Create stocks'),
  ('stocks:edit', 'stocks', 'edit', 'Edit stocks'),
  ('stocks:delete', 'stocks', 'delete', 'Delete stocks'),
  ('reports:view', 'reports', 'view', 'View reports'),
  ('settings:view', 'settings', 'view', 'View settings'),
  ('settings:edit', 'settings', 'edit', 'Edit settings'),
  ('users:view', 'users', 'view', 'View users'),
  ('users:create', 'users', 'create', 'Create users'),
  ('users:edit', 'users', 'edit', 'Edit users'),
  ('users:delete', 'users', 'delete', 'Delete users'),
  ('roles:manage', 'roles', 'manage', 'Manage roles and permissions'),
  ('schools:view', 'schools', 'view', 'View schools'),
  ('schools:create', 'schools', 'create', 'Create schools (Super Admin only)'),
  ('schools:edit', 'schools', 'edit', 'Edit schools'),
  ('schools:delete', 'schools', 'delete', 'Delete schools'),
  ('app:lock', 'app', 'lock', 'Lock/unlock school'),
  ('plans:manage', 'plans', 'manage', 'Change subscription plan'),
  ('assistant:use', 'assistant', 'use', 'Use Axpo Assistant (AI chat)')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Seed: default roles (fixed UUIDs for compatibility)
-- -----------------------------------------------------------------------------
INSERT INTO school_xx_roles (id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Super Admin', 'SaaS provider: add schools, lock/unlock app', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Full system access (no add school / lock)', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Manager', 'School management access', FALSE),
  ('00000000-0000-0000-0000-000000000003', 'Teacher', 'Teacher access with limited permissions', FALSE),
  ('00000000-0000-0000-0000-000000000004', 'Student', 'Student portal access', FALSE)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Seed: role-permission mappings (Super Admin = all; Admin = all except 3; etc.)
-- -----------------------------------------------------------------------------
INSERT INTO school_xx_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000000', id FROM school_xx_permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO school_xx_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM school_xx_permissions
WHERE id NOT IN ('schools:create', 'app:lock', 'plans:manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO school_xx_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM school_xx_permissions
WHERE id NOT IN ('roles:manage', 'users:delete')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO school_xx_role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000003', 'dashboard:view'),
  ('00000000-0000-0000-0000-000000000003', 'students:view'),
  ('00000000-0000-0000-0000-000000000003', 'staff:view'),
  ('00000000-0000-0000-0000-000000000003', 'reports:view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO school_xx_role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000004', 'dashboard:view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Seed: default admin user (username: admin). Set password after first run.
-- Run once to set password to 'admin' (then change on first login):
--   UPDATE school_xx_users SET password_hash = crypt('admin', gen_salt('bf', 12)) WHERE username = 'admin';
-- Or create users via teaching API POST /teaching/api/v1/auth/login (register if you add it).
-- -----------------------------------------------------------------------------
INSERT INTO school_xx_users (id, username, name, email, role_id, password_hash, must_change_password) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrator', 'admin@school.local', '00000000-0000-0000-0000-000000000001', crypt('admin', gen_salt('bf', 12)), TRUE)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Optional: Row Level Security (enable if using Supabase auth)
-- =============================================================================
-- ALTER TABLE school_xx_roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE school_xx_permissions ENABLE ROW LEVEL SECURITY;
-- ... (add policies for your auth.uid() or service_role as needed)

-- =============================================================================
-- To drop all tables and recreate from scratch (destructive): run before above.
-- =============================================================================
/*
DROP TABLE IF EXISTS school_xx_stock_transactions CASCADE;
DROP TABLE IF EXISTS school_xx_stocks CASCADE;
DROP TABLE IF EXISTS school_xx_fixed_monthly_costs CASCADE;
DROP TABLE IF EXISTS school_xx_expenses CASCADE;
DROP TABLE IF EXISTS school_xx_salary_payments CASCADE;
DROP TABLE IF EXISTS school_xx_staff CASCADE;
DROP TABLE IF EXISTS school_xx_fee_payments CASCADE;
DROP TABLE IF EXISTS school_xx_students CASCADE;
DROP TABLE IF EXISTS school_xx_classes CASCADE;
DROP TABLE IF EXISTS school_xx_sessions CASCADE;
DROP TABLE IF EXISTS school_xx_schools CASCADE;
DROP TABLE IF EXISTS school_xx_users CASCADE;
DROP TABLE IF EXISTS school_xx_organizations CASCADE;
DROP TABLE IF EXISTS school_xx_role_permissions CASCADE;
DROP TABLE IF EXISTS school_xx_permissions CASCADE;
DROP TABLE IF EXISTS school_xx_roles CASCADE;
*/
