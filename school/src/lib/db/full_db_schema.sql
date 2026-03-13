-- =============================================================================
-- Axpo School Management – Full database schema
-- =============================================================================
-- Use this script to create all tables in a new account (e.g. new Supabase
-- project or PostgreSQL database). Safe to run on an empty database.
-- Uses CREATE TABLE IF NOT EXISTS and ON CONFLICT DO NOTHING for idempotency.
-- Tables are prefixed with school_xx_.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. ROLES & PERMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

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

-- ============================================
-- 2. ORGANIZATIONS (multi-tenant)
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100),
  billing_email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);
CREATE UNIQUE INDEX IF NOT EXISTS school_xx_organizations_slug_key ON school_xx_organizations (slug) WHERE slug IS NOT NULL;

-- ============================================
-- 3. USERS (organization_id NULL = Super Admin)
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  organization_id UUID REFERENCES school_xx_organizations(id) ON DELETE SET NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
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

-- ============================================
-- 4. SCHOOLS (belong to organization)
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES school_xx_organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact VARCHAR(100),
  logo_url TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  plan_id VARCHAR(50) NOT NULL DEFAULT 'starter' CHECK (plan_id IN ('starter', 'ai_assistant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- ============================================
-- 5. SESSIONS (academic year per school)
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school_xx_schools(id) ON DELETE CASCADE,
  year VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  salary_due_day INTEGER NOT NULL DEFAULT 5 CHECK (salary_due_day >= 1 AND salary_due_day <= 28),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  UNIQUE(school_id, year)
);

-- ============================================
-- 6. CLASSES (per session)
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  registration_fees NUMERIC(10, 2) NOT NULL DEFAULT 0,  /* Registration/Admission fees (one-time) */
  annual_fund NUMERIC(10, 2) NOT NULL DEFAULT 0,
  monthly_fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
  late_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  late_fee_frequency VARCHAR(20) NOT NULL DEFAULT 'weekly',
  due_day_of_month INTEGER NOT NULL DEFAULT 10 CHECK (due_day_of_month >= 1 AND due_day_of_month <= 28),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  UNIQUE(session_id, name)
);

-- ============================================
-- 7. STUDENTS
-- ============================================

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
  registration_fees NUMERIC(10, 2),  /* Registration/Admission fees (one-time) */
  annual_fund NUMERIC(10, 2),
  monthly_fees NUMERIC(10, 2),
  transport_fees NUMERIC(10, 2),
  registration_paid BOOLEAN NOT NULL DEFAULT FALSE,
  annual_fund_paid BOOLEAN NOT NULL DEFAULT FALSE,
  due_day_of_month INTEGER CHECK (due_day_of_month IS NULL OR (due_day_of_month >= 1 AND due_day_of_month <= 28)),
  late_fee_amount NUMERIC(10, 2),
  late_fee_frequency VARCHAR(20),
  target_amount NUMERIC(10, 2),
  fine_per_day NUMERIC(10, 2),
  due_frequency VARCHAR(20),
  photo_url TEXT,
  sibling_id UUID REFERENCES school_xx_students(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  UNIQUE(session_id, student_id)
);

-- ============================================
-- 8. FEE PAYMENTS
-- ============================================

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
  receipt_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- ============================================
-- 9. STAFF
-- ============================================

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
  salary_due_day INTEGER NOT NULL DEFAULT 5 CHECK (salary_due_day >= 1 AND salary_due_day <= 28),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  UNIQUE(session_id, employee_id)
);

-- ============================================
-- 10. SALARY PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES school_xx_staff(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  expected_amount NUMERIC(10, 2) NOT NULL,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Partially Paid')),
  due_date DATE NOT NULL,
  payment_date DATE,
  late_days INTEGER NOT NULL DEFAULT 0,
  method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  UNIQUE(staff_id, month)
);

-- ============================================
-- 11. EXPENSES
-- ============================================

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

-- ============================================
-- 12. FIXED MONTHLY COSTS
-- ============================================

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

-- ============================================
-- 13. STOCKS & PUBLISHERS
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  publisher_name VARCHAR(255) NOT NULL,
  description TEXT,
  purchase_date DATE NOT NULL,
  total_credit_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'cleared')),
  settled_date DATE,
  settled_amount NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

CREATE TABLE IF NOT EXISTS school_xx_stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES school_xx_stocks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'sale', 'return')),
  amount NUMERIC(10, 2) NOT NULL,
  quantity INTEGER,
  description TEXT,
  receipt_number VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- ============================================
-- 14. LEAVE MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  applicable_to VARCHAR(10) NOT NULL CHECK (applicable_to IN ('staff', 'student', 'both')),
  max_days_per_year INTEGER,
  max_days_by_role JSONB,
  requires_document BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

CREATE TABLE IF NOT EXISTS school_xx_leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES school_xx_staff(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES school_xx_leave_types(id) ON DELETE CASCADE,
  year VARCHAR(10) NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  UNIQUE(staff_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS school_xx_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES school_xx_leave_types(id) ON DELETE SET NULL,
  applicant_type VARCHAR(10) NOT NULL CHECK (applicant_type IN ('staff', 'student')),
  staff_id UUID REFERENCES school_xx_staff(id) ON DELETE CASCADE,
  student_id UUID REFERENCES school_xx_students(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT NOT NULL,
  document_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  reviewed_by UUID REFERENCES school_xx_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reviewer_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CHECK (staff_id IS NOT NULL OR student_id IS NOT NULL)
);

-- ============================================
-- 15. ASSISTANT CHAT MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_assistant_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES school_xx_organizations(id) ON DELETE SET NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  is_error BOOLEAN NOT NULL DEFAULT FALSE,
  analytics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- ============================================
-- 16. ORG SUBSCRIPTIONS (Razorpay)
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_org_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES school_xx_organizations(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'starter',
  billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly',
  status VARCHAR(20) NOT NULL DEFAULT 'inactive',
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_customer_id TEXT,
  amount NUMERIC(10, 2),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  UNIQUE(organization_id)
);

-- ============================================
-- 17. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_school_xx_users_role ON school_xx_users(role_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_users_organization ON school_xx_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_schools_organization ON school_xx_schools(organization_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_sessions_school ON school_xx_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_classes_session ON school_xx_classes(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_students_session ON school_xx_students(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_students_class ON school_xx_students(class_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_students_sibling ON school_xx_students(sibling_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_fee_payments_student ON school_xx_fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_staff_session ON school_xx_staff(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_salary_payments_staff ON school_xx_salary_payments(staff_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_salary_payments_month ON school_xx_salary_payments(month);
CREATE INDEX IF NOT EXISTS idx_school_xx_expenses_session ON school_xx_expenses(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_stocks_session ON school_xx_stocks(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_stock_transactions_stock ON school_xx_stock_transactions(stock_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_fixed_monthly_costs_session ON school_xx_fixed_monthly_costs(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_leave_types_session ON school_xx_leave_types(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_leave_balances_staff ON school_xx_leave_balances(staff_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_leave_balances_leave_type ON school_xx_leave_balances(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_leave_requests_session ON school_xx_leave_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_leave_requests_staff ON school_xx_leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_leave_requests_student ON school_xx_leave_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_leave_requests_status ON school_xx_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_school_xx_assistant_chat_messages_session ON school_xx_assistant_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_assistant_chat_messages_org ON school_xx_assistant_chat_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_assistant_chat_messages_created ON school_xx_assistant_chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS ix_school_xx_org_subscriptions_razorpay_sub_id ON school_xx_org_subscriptions(razorpay_subscription_id);

-- Pagination / list query indexes
CREATE INDEX IF NOT EXISTS ix_school_xx_students_session_created ON school_xx_students(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_school_xx_staff_session_created ON school_xx_staff(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_school_xx_expenses_session_date ON school_xx_expenses(session_id, date DESC);
CREATE INDEX IF NOT EXISTS ix_school_xx_stocks_session_created ON school_xx_stocks(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_school_xx_leave_requests_session_applied ON school_xx_leave_requests(session_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS ix_school_xx_fee_payments_student_date ON school_xx_fee_payments(student_id, date DESC);

-- ============================================
-- 18. FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION school_xx_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (now() AT TIME ZONE 'utc');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION school_xx_assistant_chat_set_org()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT sc.organization_id INTO NEW.organization_id
    FROM school_xx_sessions s
    JOIN school_xx_schools sc ON sc.id = s.school_id
    WHERE s.id = NEW.session_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION school_xx_calculate_salary_late_days()
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

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'school_xx_roles', 'school_xx_organizations', 'school_xx_users', 'school_xx_schools',
    'school_xx_sessions', 'school_xx_classes', 'school_xx_students', 'school_xx_fee_payments',
    'school_xx_staff', 'school_xx_salary_payments', 'school_xx_expenses', 'school_xx_stocks',
    'school_xx_stock_transactions', 'school_xx_fixed_monthly_costs'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS update_%s_updated_at ON %s; CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE PROCEDURE school_xx_update_updated_at()',
      t, t, t, t
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS school_xx_assistant_chat_set_org_trigger ON school_xx_assistant_chat_messages;
CREATE TRIGGER school_xx_assistant_chat_set_org_trigger
  BEFORE INSERT ON school_xx_assistant_chat_messages
  FOR EACH ROW
  EXECUTE PROCEDURE school_xx_assistant_chat_set_org();

DROP TRIGGER IF EXISTS calculate_salary_late_days ON school_xx_salary_payments;
CREATE TRIGGER calculate_salary_late_days
  BEFORE INSERT OR UPDATE ON school_xx_salary_payments
  FOR EACH ROW
  EXECUTE PROCEDURE school_xx_calculate_salary_late_days();

-- ============================================
-- 19. SEED: PERMISSIONS
-- ============================================

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
  ('sessions:create', 'sessions', 'create', 'Create sessions (school admins)'),
  ('app:lock', 'app', 'lock', 'Lock/unlock school for all users (Super Admin only)'),
  ('plans:manage', 'plans', 'manage', 'Change subscription plan for a school (Super Admin only)'),
  ('assistant:use', 'assistant', 'use', 'Use Axpo Assistant (AI chat) - premium, admin only'),
  ('leaves:view', 'leaves', 'view', 'View leave requests and types'),
  ('leaves:create', 'leaves', 'create', 'Apply for leave'),
  ('leaves:approve', 'leaves', 'approve', 'Approve or reject leave requests'),
  ('leaves:manage', 'leaves', 'manage', 'Manage leave types and balances')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 20. SEED: ROLES
-- ============================================

INSERT INTO school_xx_roles (id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Super Admin', 'SaaS provider: add schools, lock/unlock app', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Full system access (no add school / lock)', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Manager', 'School management access', FALSE),
  ('00000000-0000-0000-0000-000000000003', 'Teacher', 'Teacher access with limited permissions', FALSE),
  ('00000000-0000-0000-0000-000000000004', 'Student', 'Student portal access - view own data only', FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 21. SEED: ROLE-PERMISSION MAPPINGS
-- ============================================

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

-- ============================================
-- 22. SEED: DEFAULT USERS (optional – comment out if not needed)
-- ============================================
-- Super Admin: username 'superadmin', password 'superadmin'. Change after first login.
-- Admin: username 'admin'. Set password with: UPDATE school_xx_users SET password_hash = crypt('admin', gen_salt('bf', 12)) WHERE username = 'admin';

INSERT INTO school_xx_users (id, username, name, email, role_id, password_hash, must_change_password, organization_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'superadmin', 'Super Administrator', 'superadmin@school.local', '00000000-0000-0000-0000-000000000000', '$2b$10$TWRDHvANAvjv3bJB72KOpOs1TdUqaGJhf/GA9M0cvcIqZ3z5d.ouG', TRUE, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO school_xx_users (id, username, name, email, role_id, password_hash, must_change_password, organization_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrator', 'admin@school.local', '00000000-0000-0000-0000-000000000001', crypt('admin', gen_salt('bf', 12)), TRUE, NULL)
ON CONFLICT (id) DO NOTHING;
