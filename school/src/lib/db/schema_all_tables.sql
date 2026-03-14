-- ============================================
-- Complete schema for all teaching/school tables
-- Single file: drop and recreate all tables (replace)
-- Order: dependencies first. Run in a fresh schema or after backing up data.
-- ============================================

-- Drop all tables in reverse dependency order (CASCADE removes dependent objects)
DROP TABLE IF EXISTS assistant_chat_messages CASCADE;
DROP TABLE IF EXISTS coupon_redemptions CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS premium_coupons CASCADE;
DROP TABLE IF EXISTS fixed_monthly_costs CASCADE;
DROP TABLE IF EXISTS stock_transactions CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_balances CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS salary_payments CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS student_enrollments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS org_subscriptions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================
-- 1. Organizations
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  billing_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Roles
-- ============================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Permissions
-- ============================================
CREATE TABLE permissions (
  id VARCHAR(50) PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT
);

-- ============================================
-- 4. Role-Permissions (many-to-many)
-- ============================================
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(50) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- ============================================
-- 5. Org Subscriptions
-- ============================================
CREATE TABLE org_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_org_subscriptions_org ON org_subscriptions(organization_id);

-- ============================================
-- 6. Schools
-- ============================================
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact VARCHAR(100),
  logo_url TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  plan_id VARCHAR(50) DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_schools_organization ON schools(organization_id);

-- ============================================
-- 7. Sessions
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  year VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  salary_due_day INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sessions_school ON sessions(school_id);

-- ============================================
-- 8. Users
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  organization_id UUID,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  password_hash VARCHAR(255),
  must_change_password BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  staff_id UUID,
  student_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_auth_user ON users(auth_user_id);

-- ============================================
-- 9. Classes (academic class per session)
-- ============================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  registration_fees NUMERIC(10, 2) DEFAULT 0,
  annual_fund NUMERIC(10, 2) DEFAULT 0,
  monthly_fees NUMERIC(10, 2) DEFAULT 0,
  late_fee_amount NUMERIC(10, 2) DEFAULT 0,
  late_fee_frequency VARCHAR(20) DEFAULT 'weekly',
  due_day_of_month INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_classes_session ON classes(session_id);

-- ============================================
-- 10. Students (identity only; fees in enrollments)
-- ============================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  fee_type VARCHAR(50) DEFAULT 'Regular',
  father_name VARCHAR(255),
  mother_name VARCHAR(255),
  guardian_phone VARCHAR(100),
  current_address TEXT,
  permanent_address TEXT,
  blood_group VARCHAR(10),
  health_issues TEXT,
  photo_url TEXT,
  sibling_id UUID REFERENCES students(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_user ON students(user_id);
CREATE UNIQUE INDEX idx_students_school_student_id ON students(school_id, student_id);

-- ============================================
-- 11. Student Enrollments (per session; fee structure)
-- ============================================
CREATE TABLE student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  registration_fees NUMERIC(10, 2),
  annual_fund NUMERIC(10, 2),
  monthly_fees NUMERIC(10, 2),
  transport_fees NUMERIC(10, 2),
  registration_paid BOOLEAN DEFAULT FALSE,
  annual_fund_paid BOOLEAN DEFAULT FALSE,
  due_day_of_month INTEGER CHECK (due_day_of_month IS NULL OR (due_day_of_month >= 1 AND due_day_of_month <= 28)),
  late_fee_amount NUMERIC(10, 2),
  late_fee_frequency VARCHAR(20),
  target_amount NUMERIC(10, 2),
  fine_per_day NUMERIC(10, 2),
  due_frequency VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, session_id)
);
CREATE INDEX idx_enrollments_session ON student_enrollments(session_id);
CREATE INDEX idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX idx_enrollments_class ON student_enrollments(class_id);

-- ============================================
-- 12. Fee Payments (per enrollment)
-- ============================================
CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
  student_id UUID,
  date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  receipt_number VARCHAR(100),
  fee_category VARCHAR(50) NOT NULL,
  month VARCHAR(7),
  receipt_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fee_payments_enrollment ON fee_payments(enrollment_id);

-- ============================================
-- 13. Staff
-- ============================================
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL,
  monthly_salary NUMERIC(10, 2) NOT NULL,
  subject_or_grade VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  salary_due_day INTEGER DEFAULT 5,
  allowed_leaves_per_month INTEGER DEFAULT 2,
  per_day_salary NUMERIC(10, 2),
  classes_subjects JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_staff_session ON staff(session_id);
CREATE INDEX idx_staff_user ON staff(user_id);

-- ============================================
-- 14. Salary Payments
-- ============================================
CREATE TABLE salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  expected_amount NUMERIC(10, 2) NOT NULL,
  paid_amount NUMERIC(10, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  due_date DATE NOT NULL,
  payment_date DATE,
  late_days INTEGER DEFAULT 0,
  method VARCHAR(50),
  notes TEXT,
  days_worked INTEGER DEFAULT 30,
  leaves_taken INTEGER DEFAULT 0,
  allowed_leaves INTEGER DEFAULT 2,
  excess_leaves INTEGER DEFAULT 0,
  leave_deduction NUMERIC(10, 2) DEFAULT 0,
  extra_allowance NUMERIC(10, 2) DEFAULT 0,
  allowance_note TEXT,
  extra_deduction NUMERIC(10, 2) DEFAULT 0,
  deduction_note TEXT,
  calculated_salary NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_salary_payments_staff ON salary_payments(staff_id);

-- ============================================
-- 15. Leave Types
-- ============================================
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
CREATE INDEX idx_leave_types_session ON leave_types(session_id);

-- ============================================
-- 16. Leave Balances
-- ============================================
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
CREATE INDEX idx_leave_balances_staff ON leave_balances(staff_id);
CREATE INDEX idx_leave_balances_leave_type ON leave_balances(leave_type_id);

-- ============================================
-- 17. Leave Requests
-- ============================================
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
CREATE INDEX idx_leave_requests_session ON leave_requests(session_id);
CREATE INDEX idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX idx_leave_requests_student ON leave_requests(student_id);
CREATE INDEX idx_leave_requests_leave_type ON leave_requests(leave_type_id);

-- ============================================
-- 18. Expenses
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  vendor_payee VARCHAR(255),
  payment_method VARCHAR(50),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_expenses_session ON expenses(session_id);

-- ============================================
-- 19. Stocks
-- ============================================
CREATE TABLE stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  publisher_name VARCHAR(255) NOT NULL,
  description TEXT,
  purchase_date DATE NOT NULL,
  total_credit_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  settled_date DATE,
  settled_amount NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_stocks_session ON stocks(session_id);

-- ============================================
-- 20. Stock Transactions
-- ============================================
CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  quantity INTEGER,
  description TEXT,
  receipt_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_stock_transactions_stock ON stock_transactions(stock_id);

-- ============================================
-- 21. Fixed Monthly Costs
-- ============================================
CREATE TABLE fixed_monthly_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fixed_costs_session ON fixed_monthly_costs(session_id);

-- ============================================
-- 22. User Subscriptions
-- ============================================
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'free',
  status VARCHAR(20) NOT NULL DEFAULT 'inactive',
  amount NUMERIC(10, 2),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);

-- ============================================
-- 23. Premium Coupons
-- ============================================
CREATE TABLE premium_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 365,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 24. Coupon Redemptions
-- ============================================
CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  coupon_code TEXT NOT NULL,
  coupon_id UUID NOT NULL REFERENCES premium_coupons(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_coupon_redemptions_user ON coupon_redemptions(user_id);
CREATE INDEX idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);

-- ============================================
-- 25. Assistant Chat Messages
-- ============================================
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
CREATE INDEX idx_assistant_chat_messages_session ON assistant_chat_messages(session_id);
CREATE INDEX idx_assistant_chat_messages_org ON assistant_chat_messages(organization_id);
CREATE INDEX idx_assistant_chat_messages_created ON assistant_chat_messages(session_id, created_at);

-- ============================================
-- Optional: Add FK from users to staff/student (uncomment if desired)
-- ============================================
-- ALTER TABLE users ADD CONSTRAINT fk_users_staff
--   FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL;
-- ALTER TABLE users ADD CONSTRAINT fk_users_student
--   FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

-- ============================================
-- Seed permissions (idempotent)
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
