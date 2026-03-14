-- =============================================================================
-- School Management – Full schema for Supabase SQL Editor (fresh database)
-- =============================================================================
-- Use this when creating a new Supabase project with no existing app tables.
-- Run the entire script once in Supabase SQL Editor.
-- Creates: all tables, RLS policies, seed data (roles, permissions, default users),
-- triggers and functions. Seed data uses ON CONFLICT DO NOTHING so safe to re-run.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PART 1: CORE TABLES
-- ============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  billing_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
  id VARCHAR(50) PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(50) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

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

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  registration_fees DECIMAL(10,2) DEFAULT 0,
  annual_fund DECIMAL(10,2) DEFAULT 0,
  monthly_fees DECIMAL(10,2) DEFAULT 0,
  late_fee_amount DECIMAL(10,2) DEFAULT 0,
  late_fee_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (late_fee_frequency IN ('daily', 'weekly')),
  due_day_of_month INTEGER DEFAULT 10 CHECK (due_day_of_month >= 1 AND due_day_of_month <= 28),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, name)
);

-- Students: identity + optional session link (school_id for enrollment model; session_id kept for compatibility)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  admission_number VARCHAR(50),
  fee_type VARCHAR(50) DEFAULT 'Regular',
  father_name VARCHAR(255),
  mother_name VARCHAR(255),
  guardian_phone VARCHAR(20),
  current_address TEXT,
  permanent_address TEXT,
  blood_group VARCHAR(5),
  health_issues TEXT,
  aadhaar_number VARCHAR(12),
  date_of_birth DATE,
  photo_url TEXT,
  sibling_id UUID REFERENCES students(id) ON DELETE SET NULL,
  has_sibling_discount BOOLEAN DEFAULT FALSE,
  is_frozen BOOLEAN DEFAULT FALSE,
  frozen_at TIMESTAMPTZ,
  registration_fees DECIMAL(10,2),
  annual_fund DECIMAL(10,2),
  monthly_fees DECIMAL(10,2),
  transport_fees DECIMAL(10,2),
  registration_paid BOOLEAN DEFAULT FALSE,
  annual_fund_paid BOOLEAN DEFAULT FALSE,
  due_day_of_month INTEGER CHECK (due_day_of_month IS NULL OR (due_day_of_month >= 1 AND due_day_of_month <= 28)),
  late_fee_amount DECIMAL(10,2),
  late_fee_frequency VARCHAR(20),
  target_amount DECIMAL(10,2),
  fine_per_day DECIMAL(10,2),
  due_frequency VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_session ON students(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_school_student_id ON students(school_id, student_id) WHERE school_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_session_student_id ON students(session_id, student_id) WHERE session_id IS NOT NULL;

-- Student enrollments (session-specific fees when using school_id on students)
CREATE TABLE student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  registration_fees DECIMAL(10,2),
  annual_fund DECIMAL(10,2),
  monthly_fees DECIMAL(10,2),
  transport_fees DECIMAL(10,2),
  registration_paid BOOLEAN DEFAULT FALSE,
  annual_fund_paid BOOLEAN DEFAULT FALSE,
  due_day_of_month INTEGER CHECK (due_day_of_month IS NULL OR (due_day_of_month >= 1 AND due_day_of_month <= 28)),
  late_fee_amount DECIMAL(10,2),
  late_fee_frequency VARCHAR(20),
  target_amount DECIMAL(10,2),
  fine_per_day DECIMAL(10,2),
  due_frequency VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_session ON student_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id);

-- Fee payments (can link to enrollment_id or student_id for backward compat)
CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_fee_payments_enrollment ON fee_payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);

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
  allowed_leaves_per_month INTEGER DEFAULT 1,
  per_day_salary DECIMAL(10,2),
  classes_subjects JSONB,
  aadhaar_number VARCHAR(12),
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, employee_id)
);

-- Salary payments (with partial payment and leave tracking)
CREATE TABLE salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  expected_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Partially Paid')),
  due_date DATE NOT NULL,
  payment_date DATE,
  late_days INTEGER DEFAULT 0,
  method VARCHAR(50),
  notes TEXT,
  days_worked INTEGER DEFAULT 30,
  leaves_taken INTEGER DEFAULT 0,
  allowed_leaves INTEGER DEFAULT 1,
  excess_leaves INTEGER DEFAULT 0,
  leave_deduction DECIMAL(10,2) DEFAULT 0,
  extra_allowance DECIMAL(10,2) DEFAULT 0,
  allowance_note TEXT,
  extra_deduction DECIMAL(10,2) DEFAULT 0,
  deduction_note TEXT,
  calculated_salary DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, month)
);

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

CREATE TABLE stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  publisher_name VARCHAR(255) NOT NULL,
  description TEXT,
  purchase_date DATE NOT NULL,
  total_credit_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'cleared')),
  settled_date DATE,
  settled_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'sale', 'return')),
  amount DECIMAL(10,2) NOT NULL,
  quantity INTEGER,
  description TEXT,
  receipt_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Leave management
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  applicable_to VARCHAR(10) NOT NULL CHECK (applicable_to IN ('staff', 'student', 'both')),
  max_days_per_year INTEGER,
  max_days_by_role JSONB,
  requires_document BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year VARCHAR(10) NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, leave_type_id, year)
);

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES leave_types(id) ON DELETE SET NULL,
  applicant_type VARCHAR(10) NOT NULL CHECK (applicant_type IN ('staff', 'student')),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT NOT NULL,
  document_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reviewer_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (staff_id IS NOT NULL OR student_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_leave_types_session ON leave_types(session_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_staff ON leave_balances(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_session ON leave_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_student ON leave_requests(student_id);

-- Assistant chat messages
CREATE TABLE assistant_chat_messages (
  id TEXT PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  is_error BOOLEAN DEFAULT FALSE,
  analytics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_chat_session ON assistant_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_assistant_chat_org ON assistant_chat_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_assistant_chat_created ON assistant_chat_messages(session_id, created_at);

-- Subscription / premium
CREATE TABLE premium_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  max_uses INT NOT NULL DEFAULT 1,
  used_count INT NOT NULL DEFAULT 0,
  duration_days INT NOT NULL DEFAULT 365,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired', 'pending')),
  amount DECIMAL(10,2),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  coupon_code TEXT NOT NULL,
  coupon_id UUID NOT NULL REFERENCES premium_coupons(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================
-- PART 2: INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_schools_organization ON schools(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_school ON sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_session ON classes(session_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_staff_session ON staff(session_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_staff ON salary_payments(staff_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_month ON salary_payments(month);
CREATE INDEX IF NOT EXISTS idx_expenses_session ON expenses(session_id);
CREATE INDEX IF NOT EXISTS idx_stocks_session ON stocks(session_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_stock ON stock_transactions(stock_id);
CREATE INDEX IF NOT EXISTS idx_fixed_monthly_costs_session ON fixed_monthly_costs(session_id);

-- ============================================
-- PART 3: HELPER FUNCTION (for RLS)
-- ============================================

CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- PART 4: ROW LEVEL SECURITY
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
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_monthly_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running (Supabase supports IF EXISTS for policies in newer versions)
DO $$
BEGIN
  -- Roles, permissions: allow all for authenticated and anon (dev)
  DROP POLICY IF EXISTS "Allow all for authenticated" ON roles;
  DROP POLICY IF EXISTS "Allow all for authenticated" ON permissions;
  DROP POLICY IF EXISTS "Allow all for authenticated" ON role_permissions;
  CREATE POLICY "Allow all for authenticated" ON roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all for authenticated" ON permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all for authenticated" ON role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow anon for dev" ON roles;
  DROP POLICY IF EXISTS "Allow anon for dev" ON permissions;
  DROP POLICY IF EXISTS "Allow anon for dev" ON role_permissions;
  CREATE POLICY "Allow anon for dev" ON roles FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon for dev" ON permissions FOR ALL TO anon USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon for dev" ON role_permissions FOR ALL TO anon USING (true) WITH CHECK (true);
END $$;

-- Organizations
DROP POLICY IF EXISTS "Users see own org or all if platform admin" ON organizations;
DROP POLICY IF EXISTS "Users update own org" ON organizations;
DROP POLICY IF EXISTS "Platform admin can insert orgs" ON organizations;
DROP POLICY IF EXISTS "Allow anon orgs dev" ON organizations;
CREATE POLICY "Users see own org or all if platform admin" ON organizations FOR SELECT TO authenticated USING (id = current_organization_id() OR current_organization_id() IS NULL);
CREATE POLICY "Users update own org" ON organizations FOR UPDATE TO authenticated USING (id = current_organization_id()) WITH CHECK (id = current_organization_id());
CREATE POLICY "Platform admin can insert orgs" ON organizations FOR INSERT TO authenticated WITH CHECK (current_organization_id() IS NULL);
CREATE POLICY "Allow anon orgs dev" ON organizations FOR ALL TO anon USING (true) WITH CHECK (true);

-- Schools
DROP POLICY IF EXISTS "Schools by org" ON schools;
DROP POLICY IF EXISTS "Allow anon schools dev" ON schools;
CREATE POLICY "Schools by org" ON schools FOR ALL TO authenticated USING (organization_id = current_organization_id() OR current_organization_id() IS NULL) WITH CHECK (organization_id = current_organization_id() OR current_organization_id() IS NULL);
CREATE POLICY "Allow anon schools dev" ON schools FOR ALL TO anon USING (true) WITH CHECK (true);

-- Sessions
DROP POLICY IF EXISTS "Sessions by org" ON sessions;
DROP POLICY IF EXISTS "Allow anon sessions dev" ON sessions;
CREATE POLICY "Sessions by org" ON sessions FOR ALL TO authenticated USING (school_id IN (SELECT id FROM schools WHERE organization_id = current_organization_id() OR current_organization_id() IS NULL)) WITH CHECK (school_id IN (SELECT id FROM schools WHERE organization_id = current_organization_id() OR current_organization_id() IS NULL));
CREATE POLICY "Allow anon sessions dev" ON sessions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Users
DROP POLICY IF EXISTS "Users by org" ON users;
DROP POLICY IF EXISTS "Allow anon users dev" ON users;
CREATE POLICY "Users by org" ON users FOR ALL TO authenticated USING (organization_id = current_organization_id() OR current_organization_id() IS NULL) WITH CHECK (organization_id = current_organization_id() OR current_organization_id() IS NULL);
CREATE POLICY "Allow anon users dev" ON users FOR ALL TO anon USING (true) WITH CHECK (true);

-- Classes
DROP POLICY IF EXISTS "Classes by org" ON classes;
DROP POLICY IF EXISTS "Allow anon classes dev" ON classes;
CREATE POLICY "Classes by org" ON classes FOR ALL TO authenticated USING (session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)) WITH CHECK (session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL));
CREATE POLICY "Allow anon classes dev" ON classes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Students (by org via session or school)
DROP POLICY IF EXISTS "Students by org" ON students;
DROP POLICY IF EXISTS "Allow anon students dev" ON students;
CREATE POLICY "Students by org" ON students FOR ALL TO authenticated USING (
  school_id IN (SELECT id FROM schools WHERE organization_id = current_organization_id() OR current_organization_id() IS NULL)
  OR session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)
) WITH CHECK (
  school_id IN (SELECT id FROM schools WHERE organization_id = current_organization_id() OR current_organization_id() IS NULL)
  OR session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)
);
CREATE POLICY "Allow anon students dev" ON students FOR ALL TO anon USING (true) WITH CHECK (true);

-- Enrollments
DROP POLICY IF EXISTS "Enrollments by org" ON student_enrollments;
DROP POLICY IF EXISTS "Allow anon enrollments dev" ON student_enrollments;
CREATE POLICY "Enrollments by org" ON student_enrollments FOR ALL TO authenticated USING (session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)) WITH CHECK (session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL));
CREATE POLICY "Allow anon enrollments dev" ON student_enrollments FOR ALL TO anon USING (true) WITH CHECK (true);

-- Fee payments
DROP POLICY IF EXISTS "Fee payments by org" ON fee_payments;
DROP POLICY IF EXISTS "Allow anon fee_payments dev" ON fee_payments;
CREATE POLICY "Fee payments by org" ON fee_payments FOR ALL TO authenticated USING (
  enrollment_id IN (SELECT e.id FROM student_enrollments e JOIN sessions s ON s.id = e.session_id JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)
  OR student_id IN (SELECT st.id FROM students st JOIN sessions s ON s.id = st.session_id JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)
  OR student_id IN (SELECT st.id FROM students st JOIN schools sc ON sc.id = st.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)
) WITH CHECK (true);
CREATE POLICY "Allow anon fee_payments dev" ON fee_payments FOR ALL TO anon USING (true) WITH CHECK (true);

-- Staff
DROP POLICY IF EXISTS "Staff by org" ON staff;
DROP POLICY IF EXISTS "Allow anon staff dev" ON staff;
CREATE POLICY "Staff by org" ON staff FOR ALL TO authenticated USING (session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)) WITH CHECK (session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL));
CREATE POLICY "Allow anon staff dev" ON staff FOR ALL TO anon USING (true) WITH CHECK (true);

-- Salary payments
DROP POLICY IF EXISTS "Salary payments by org" ON salary_payments;
DROP POLICY IF EXISTS "Allow anon salary_payments dev" ON salary_payments;
CREATE POLICY "Salary payments by org" ON salary_payments FOR ALL TO authenticated USING (staff_id IN (SELECT st.id FROM staff st JOIN sessions s ON s.id = st.session_id JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)) WITH CHECK (true);
CREATE POLICY "Allow anon salary_payments dev" ON salary_payments FOR ALL TO anon USING (true) WITH CHECK (true);

-- Expenses
DROP POLICY IF EXISTS "Expenses by org" ON expenses;
DROP POLICY IF EXISTS "Allow anon expenses dev" ON expenses;
CREATE POLICY "Expenses by org" ON expenses FOR ALL TO authenticated USING (session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)) WITH CHECK (true);
CREATE POLICY "Allow anon expenses dev" ON expenses FOR ALL TO anon USING (true) WITH CHECK (true);

-- Stocks
DROP POLICY IF EXISTS "Stocks by org" ON stocks;
DROP POLICY IF EXISTS "Allow anon stocks dev" ON stocks;
CREATE POLICY "Stocks by org" ON stocks FOR ALL TO authenticated USING (session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)) WITH CHECK (true);
CREATE POLICY "Allow anon stocks dev" ON stocks FOR ALL TO anon USING (true) WITH CHECK (true);

-- Stock transactions
DROP POLICY IF EXISTS "Stock transactions by org" ON stock_transactions;
DROP POLICY IF EXISTS "Allow anon stock_transactions dev" ON stock_transactions;
CREATE POLICY "Stock transactions by org" ON stock_transactions FOR ALL TO authenticated USING (stock_id IN (SELECT sk.id FROM stocks sk JOIN sessions s ON s.id = sk.session_id JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)) WITH CHECK (true);
CREATE POLICY "Allow anon stock_transactions dev" ON stock_transactions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Fixed monthly costs
DROP POLICY IF EXISTS "Fixed monthly costs by org" ON fixed_monthly_costs;
DROP POLICY IF EXISTS "Allow anon fixed_monthly_costs dev" ON fixed_monthly_costs;
CREATE POLICY "Fixed monthly costs by org" ON fixed_monthly_costs FOR ALL TO authenticated USING (session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)) WITH CHECK (true);
CREATE POLICY "Allow anon fixed_monthly_costs dev" ON fixed_monthly_costs FOR ALL TO anon USING (true) WITH CHECK (true);

-- Leave types
DROP POLICY IF EXISTS "Leave types by org" ON leave_types;
DROP POLICY IF EXISTS "Allow anon leave_types dev" ON leave_types;
CREATE POLICY "Leave types by org" ON leave_types FOR ALL TO authenticated USING (session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)) WITH CHECK (true);
CREATE POLICY "Allow anon leave_types dev" ON leave_types FOR ALL TO anon USING (true) WITH CHECK (true);

-- Leave balances (via staff -> session -> school -> org)
DROP POLICY IF EXISTS "Leave balances by org" ON leave_balances;
DROP POLICY IF EXISTS "Allow anon leave_balances dev" ON leave_balances;
CREATE POLICY "Leave balances by org" ON leave_balances FOR ALL TO authenticated USING (staff_id IN (SELECT st.id FROM staff st JOIN sessions s ON s.id = st.session_id JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)) WITH CHECK (true);
CREATE POLICY "Allow anon leave_balances dev" ON leave_balances FOR ALL TO anon USING (true) WITH CHECK (true);

-- Leave requests
DROP POLICY IF EXISTS "Leave requests by org" ON leave_requests;
DROP POLICY IF EXISTS "Allow anon leave_requests dev" ON leave_requests;
CREATE POLICY "Leave requests by org" ON leave_requests FOR ALL TO authenticated USING (session_id IN (SELECT s.id FROM sessions s JOIN schools sc ON sc.id = s.school_id WHERE sc.organization_id = current_organization_id() OR current_organization_id() IS NULL)) WITH CHECK (true);
CREATE POLICY "Allow anon leave_requests dev" ON leave_requests FOR ALL TO anon USING (true) WITH CHECK (true);

-- Assistant chat
DROP POLICY IF EXISTS "Assistant chat by org" ON assistant_chat_messages;
DROP POLICY IF EXISTS "Allow anon assistant chat dev" ON assistant_chat_messages;
CREATE POLICY "Assistant chat by org" ON assistant_chat_messages FOR ALL TO authenticated USING (organization_id = current_organization_id() OR current_organization_id() IS NULL) WITH CHECK (organization_id = current_organization_id() OR current_organization_id() IS NULL);
CREATE POLICY "Allow anon assistant chat dev" ON assistant_chat_messages FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- PART 5: ASSISTANT CHAT TRIGGER
-- ============================================

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

CREATE TRIGGER assistant_chat_set_org_trigger
  BEFORE INSERT ON assistant_chat_messages
  FOR EACH ROW
  EXECUTE PROCEDURE assistant_chat_set_org();

-- ============================================
-- PART 6: SEED DATA (permissions, roles, role_permissions, default users)
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
  ('salary:manage', 'salary', 'manage', 'Manage salary payments, leaves, and attendance data'),
  ('salary:record', 'salary', 'record', 'Record salary payments'),
  ('fees:record', 'fees', 'record', 'Record fee payments'),
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
  ('assistant:use', 'assistant', 'use', 'Use Axpo Assistant (AI chat) - premium, admin only'),
  ('leaves:view', 'leaves', 'view', 'View leave requests and types'),
  ('leaves:create', 'leaves', 'create', 'Apply for leave'),
  ('leaves:approve', 'leaves', 'approve', 'Approve or reject leave requests'),
  ('leaves:manage', 'leaves', 'manage', 'Manage leave types and balances')
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
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions
WHERE id NOT IN ('schools:create', 'app:lock', 'plans:manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM permissions
WHERE id NOT IN ('roles:manage', 'users:delete')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000003', 'dashboard:view'),
  ('00000000-0000-0000-0000-000000000003', 'students:view'),
  ('00000000-0000-0000-0000-000000000003', 'staff:view'),
  ('00000000-0000-0000-0000-000000000003', 'reports:view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000004', 'dashboard:view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant salary:record and fees:record to Admin and Manager
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000000', 'salary:record'),
  ('00000000-0000-0000-0000-000000000000', 'fees:record'),
  ('00000000-0000-0000-0000-000000000001', 'salary:record'),
  ('00000000-0000-0000-0000-000000000001', 'fees:record'),
  ('00000000-0000-0000-0000-000000000002', 'salary:record'),
  ('00000000-0000-0000-0000-000000000002', 'fees:record')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Default admin user (password: admin – change on first login)
INSERT INTO users (id, username, name, email, role_id, password_hash, must_change_password, organization_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrator', 'admin@school.local', '00000000-0000-0000-0000-000000000001', crypt('admin', gen_salt('bf', 12)), TRUE, NULL)
ON CONFLICT (id) DO NOTHING;

-- Super Admin (optional; password: superadmin)
INSERT INTO users (id, username, name, email, role_id, password_hash, must_change_password, organization_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'superadmin', 'Super Administrator', 'superadmin@school.local', '00000000-0000-0000-0000-000000000000', crypt('superadmin', gen_salt('bf', 12)), TRUE, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 7: UPDATED_AT TRIGGERS & SALARY LATE DAYS
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
      'sessions', 'classes', 'students', 'student_enrollments',
      'fee_payments', 'staff', 'salary_payments',
      'expenses', 'stocks', 'stock_transactions',
      'fixed_monthly_costs', 'leave_types', 'leave_balances', 'leave_requests'
    ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at();
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

DROP TRIGGER IF EXISTS calculate_salary_late_days ON salary_payments;
CREATE TRIGGER calculate_salary_late_days
  BEFORE INSERT OR UPDATE ON salary_payments
  FOR EACH ROW
  EXECUTE PROCEDURE calculate_salary_late_days();

-- =============================================================================
-- Done. Run this entire script once in Supabase SQL Editor (fresh database).
-- =============================================================================
SELECT 'School schema and RLS applied successfully.' AS status;
