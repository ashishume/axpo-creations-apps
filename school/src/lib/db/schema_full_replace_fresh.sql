-- ============================================
-- School Management System - Full schema replace (fresh)
-- ============================================
-- Run this to DROP all teaching tables/objects and recreate from scratch.
-- No data is preserved. Updated: plan_id (starter | ai_assistant), assistant:use permission.
-- ============================================

-- ============================================
-- PART 1: DROP EXISTING (triggers, tables, functions)
-- ============================================

DROP TRIGGER IF EXISTS calculate_salary_late_days ON salary_payments;
DROP TRIGGER IF EXISTS update_stock_transactions_updated_at ON stock_transactions;
DROP TRIGGER IF EXISTS update_stocks_updated_at ON stocks;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_salary_payments_updated_at ON salary_payments;
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
DROP TRIGGER IF EXISTS update_fee_payments_updated_at ON fee_payments;
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
DROP TRIGGER IF EXISTS update_schools_updated_at ON schools;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
DROP TRIGGER IF EXISTS update_fixed_monthly_costs_updated_at ON fixed_monthly_costs;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;

DROP TABLE IF EXISTS stock_transactions CASCADE;
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS salary_payments CASCADE;
DROP TABLE IF EXISTS fixed_monthly_costs CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TRIGGER IF EXISTS assistant_chat_set_org_trigger ON assistant_chat_messages;
DROP TABLE IF EXISTS assistant_chat_messages CASCADE;

DROP FUNCTION IF EXISTS assistant_chat_set_org();
DROP FUNCTION IF EXISTS calculate_salary_late_days();
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS current_organization_id();

-- ============================================
-- PART 2: CREATE TABLES
-- ============================================

-- Organizations (multi-tenant; one org has many schools)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  billing_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions
CREATE TABLE permissions (
  id VARCHAR(50) PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(50) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Users (organization_id NULL = Super Admin)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  password_hash VARCHAR(255),
  must_change_password BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  staff_id UUID,
  student_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schools (organization_id optional; plan: starter | ai_assistant)
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact VARCHAR(100),
  logo_url TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  plan_id TEXT DEFAULT 'starter' CHECK (plan_id IN ('starter', 'ai_assistant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  year VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  salary_due_day INTEGER DEFAULT 5 CHECK (salary_due_day >= 1 AND salary_due_day <= 28),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, year)
);

-- Classes
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  registration_fees DECIMAL(10,2) DEFAULT 0,  /* Registration/Admission fees (one-time) */
  annual_fund DECIMAL(10,2) DEFAULT 0,
  monthly_fees DECIMAL(10,2) DEFAULT 0,
  late_fee_amount DECIMAL(10,2) DEFAULT 0,
  late_fee_frequency VARCHAR(20) DEFAULT 'weekly',
  due_day_of_month INTEGER DEFAULT 10 CHECK (due_day_of_month >= 1 AND due_day_of_month <= 28),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, name)
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  fee_type VARCHAR(50) DEFAULT 'Regular',
  father_name VARCHAR(255),
  mother_name VARCHAR(255),
  guardian_phone VARCHAR(20),
  current_address TEXT,
  permanent_address TEXT,
  blood_group VARCHAR(5),
  health_issues TEXT,
  registration_fees DECIMAL(10,2),  /* Registration/Admission fees (one-time) */
  annual_fund DECIMAL(10,2),
  monthly_fees DECIMAL(10,2),
  transport_fees DECIMAL(10,2),
  registration_paid BOOLEAN DEFAULT FALSE,
  annual_fund_paid BOOLEAN DEFAULT FALSE,
  due_day_of_month INTEGER CHECK (due_day_of_month >= 1 AND due_day_of_month <= 28),
  late_fee_amount DECIMAL(10,2),
  late_fee_frequency VARCHAR(20),
  target_amount DECIMAL(10,2),
  fine_per_day DECIMAL(10,2),
  due_frequency VARCHAR(20),
  photo_url TEXT,
  sibling_id UUID REFERENCES students(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Fee payments
CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  receipt_number VARCHAR(100),
  fee_category VARCHAR(50) NOT NULL,
  month VARCHAR(7),
  notes TEXT,
  receipt_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL,
  monthly_salary DECIMAL(10,2) NOT NULL,
  subject_or_grade VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  salary_due_day INTEGER DEFAULT 5 CHECK (salary_due_day >= 1 AND salary_due_day <= 28),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, employee_id)
);

-- Salary payments
CREATE TABLE salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  expected_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  due_date DATE NOT NULL,
  payment_date DATE,
  late_days INTEGER DEFAULT 0,
  method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, month)
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  vendor_payee VARCHAR(255),
  payment_method VARCHAR(50),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stocks
CREATE TABLE stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  publisher_name VARCHAR(255) NOT NULL,
  description TEXT,
  purchase_date DATE NOT NULL,
  total_credit_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  settled_date DATE,
  settled_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock transactions
CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  quantity INTEGER,
  description TEXT,
  receipt_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fixed monthly costs
CREATE TABLE fixed_monthly_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assistant chat messages (per session; org-scoped via RLS when applied)
CREATE TABLE assistant_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  is_error BOOLEAN DEFAULT FALSE,
  analytics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 3: INDEXES
-- ============================================

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_schools_organization ON schools(organization_id);
CREATE INDEX idx_sessions_school ON sessions(school_id);
CREATE INDEX idx_classes_session ON classes(session_id);
CREATE INDEX idx_students_session ON students(session_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_sibling ON students(sibling_id);
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_staff_session ON staff(session_id);
CREATE INDEX idx_salary_payments_staff ON salary_payments(staff_id);
CREATE INDEX idx_salary_payments_month ON salary_payments(month);
CREATE INDEX idx_expenses_session ON expenses(session_id);
CREATE INDEX idx_stocks_session ON stocks(session_id);
CREATE INDEX idx_stock_transactions_stock ON stock_transactions(stock_id);
CREATE INDEX idx_fixed_monthly_costs_session ON fixed_monthly_costs(session_id);
CREATE INDEX idx_assistant_chat_messages_session ON assistant_chat_messages(session_id);
CREATE INDEX idx_assistant_chat_messages_org ON assistant_chat_messages(organization_id);
CREATE INDEX idx_assistant_chat_messages_created ON assistant_chat_messages(session_id, created_at);

-- Set organization_id from session's school on insert
CREATE OR REPLACE FUNCTION assistant_chat_set_org()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT sc.organization_id INTO NEW.organization_id
    FROM sessions s
    JOIN schools sc ON sc.id = s.school_id
    WHERE s.id = NEW.session_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assistant_chat_set_org_trigger ON assistant_chat_messages;
CREATE TRIGGER assistant_chat_set_org_trigger
  BEFORE INSERT ON assistant_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION assistant_chat_set_org();

-- ============================================
-- PART 4: HELPER FUNCTION (for RLS / dashboard RPC)
-- ============================================

CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- PART 5: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_monthly_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON organizations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON schools FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON classes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON fee_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON salary_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON stocks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON stock_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON fixed_monthly_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON assistant_chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon for dev" ON roles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON permissions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON role_permissions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON organizations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON schools FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON sessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON classes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON fee_payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON staff FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON salary_payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON expenses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON stocks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON stock_transactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON fixed_monthly_costs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON assistant_chat_messages FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- PART 6: SEED DATA
-- ============================================

INSERT INTO permissions (id, module, action, description) VALUES
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
  ('sessions:create', 'sessions', 'create', 'Create sessions (school admins)'),
  ('app:lock', 'app', 'lock', 'Lock/unlock school for all users (Super Admin only)'),
  ('plans:manage', 'plans', 'manage', 'Change subscription plan for a school (Super Admin only)'),
  ('assistant:use', 'assistant', 'use', 'Use Axpo Assistant (AI chat) - premium, admin only')
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Super Admin', 'SaaS provider: add schools, lock/unlock app', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Full system access (no add school / lock)', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Manager', 'School management access', FALSE),
  ('00000000-0000-0000-0000-000000000003', 'Teacher', 'Teacher access with limited permissions', FALSE),
  ('00000000-0000-0000-0000-000000000004', 'Student', 'Student portal access - view own data only', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000000', id FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions
WHERE id NOT IN ('schools:create', 'app:lock', 'plans:manage')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM permissions
WHERE id NOT IN ('roles:manage', 'users:delete')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000003', 'dashboard:view'),
  ('00000000-0000-0000-0000-000000000003', 'students:view'),
  ('00000000-0000-0000-0000-000000000003', 'staff:view'),
  ('00000000-0000-0000-0000-000000000003', 'reports:view')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000004', 'dashboard:view')
ON CONFLICT DO NOTHING;

-- Super Admin (username: superadmin, password: superadmin). organization_id NULL = platform admin.
INSERT INTO users (id, username, name, email, role_id, password_hash, must_change_password, organization_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'superadmin', 'Super Administrator', 'superadmin@school.local', '00000000-0000-0000-0000-000000000000', '$2b$10$TWRDHvANAvjv3bJB72KOpOs1TdUqaGJhf/GA9M0cvcIqZ3z5d.ouG', TRUE, NULL)
ON CONFLICT (id) DO NOTHING;

-- Default admin (password: admin). Change on first login.
INSERT INTO users (id, username, name, email, role_id, password_hash, must_change_password, organization_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrator', 'admin@school.local', '00000000-0000-0000-0000-000000000001', '$2a$10$X7UrE2J5PQb.4rCwVLi.s.7.Dh8L2Yx5z5b5b5b5b5b5b5b5b5b5b', TRUE, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 7: FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'roles', 'organizations', 'users', 'schools',
      'sessions', 'classes', 'students',
      'fee_payments', 'staff', 'salary_payments',
      'expenses', 'stocks', 'stock_transactions',
      'fixed_monthly_costs'
    ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_salary_late_days()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_date IS NOT NULL AND NEW.due_date IS NOT NULL THEN
    NEW.late_days = GREATEST(0, NEW.payment_date - NEW.due_date);
  ELSE
    NEW.late_days = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_salary_late_days
  BEFORE INSERT OR UPDATE ON salary_payments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_salary_late_days();
