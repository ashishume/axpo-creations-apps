-- School Management System Database Schema
-- All tables prefixed with school_xx_ to avoid conflicts with existing tables

-- ============================================
-- ROLES AND PERMISSIONS
-- ============================================

-- Roles table
CREATE TABLE IF NOT EXISTS school_xx_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE, -- System roles (admin) cannot be deleted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions lookup table
CREATE TABLE IF NOT EXISTS school_xx_permissions (
  id VARCHAR(50) PRIMARY KEY, -- e.g., 'students:view', 'staff:edit'
  module VARCHAR(50) NOT NULL, -- e.g., 'students', 'staff', 'expenses'
  action VARCHAR(50) NOT NULL, -- e.g., 'view', 'create', 'edit', 'delete'
  description TEXT
);

-- Role-Permission mapping
CREATE TABLE IF NOT EXISTS school_xx_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES school_xx_roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(50) NOT NULL REFERENCES school_xx_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- ============================================
-- USERS
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS school_xx_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- Link to Supabase auth.users (nullable for local auth)
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES school_xx_roles(id),
  password_hash VARCHAR(255), -- For local auth (bcrypt hash)
  must_change_password BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  staff_id UUID, -- Link to staff if this user is a staff member
  student_id UUID, -- Link to student if this user is a student
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCHOOLS AND SESSIONS
-- ============================================

-- Schools
CREATE TABLE IF NOT EXISTS school_xx_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact VARCHAR(100),
  logo_url TEXT,
  is_locked BOOLEAN DEFAULT FALSE, -- When true, app is locked for this school (only Super Admin can unlock)
  plan_id TEXT DEFAULT 'starter' CHECK (plan_id IN ('starter', 'ai_assistant')), -- Subscription plan for this school
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academic Sessions
CREATE TABLE IF NOT EXISTS school_xx_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school_xx_schools(id) ON DELETE CASCADE,
  year VARCHAR(20) NOT NULL, -- e.g., "2024-2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  salary_due_day INTEGER DEFAULT 5 CHECK (salary_due_day >= 1 AND salary_due_day <= 28), -- Day of month (1-28) salary is due
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, year)
);

-- ============================================
-- CLASSES
-- ============================================

-- Student Classes
CREATE TABLE IF NOT EXISTS school_xx_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g., "Class 1", "Nursery"
  registration_fees DECIMAL(10,2) DEFAULT 0,
  admission_fees DECIMAL(10,2) DEFAULT 0,
  annual_fund DECIMAL(10,2) DEFAULT 0,
  monthly_fees DECIMAL(10,2) DEFAULT 0,
  late_fee_amount DECIMAL(10,2) DEFAULT 0,
  late_fee_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily' or 'weekly'
  due_day_of_month INTEGER DEFAULT 10 CHECK (due_day_of_month >= 1 AND due_day_of_month <= 28),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, name)
);

-- ============================================
-- STUDENTS
-- ============================================

-- Students
CREATE TABLE IF NOT EXISTS school_xx_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES school_xx_classes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES school_xx_users(id) ON DELETE SET NULL, -- For student portal login
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  student_id VARCHAR(50) NOT NULL, -- Display ID like STU-001
  fee_type VARCHAR(50) DEFAULT 'Regular', -- Regular, Boarding, Day Scholar + Meals, Boarding + Meals
  
  -- Personal Details
  father_name VARCHAR(255),
  mother_name VARCHAR(255),
  guardian_phone VARCHAR(20),
  current_address TEXT,
  permanent_address TEXT,
  blood_group VARCHAR(5),
  health_issues TEXT,
  
  -- Fee Structure (can override class defaults)
  registration_fees DECIMAL(10,2),
  admission_fees DECIMAL(10,2),
  annual_fund DECIMAL(10,2),
  monthly_fees DECIMAL(10,2),
  transport_fees DECIMAL(10,2),
  
  -- Fee Payment Status
  registration_paid BOOLEAN DEFAULT FALSE,
  admission_paid BOOLEAN DEFAULT FALSE,
  annual_fund_paid BOOLEAN DEFAULT FALSE,
  
  -- Due Date Config (can override class)
  due_day_of_month INTEGER CHECK (due_day_of_month >= 1 AND due_day_of_month <= 28),
  late_fee_amount DECIMAL(10,2),
  late_fee_frequency VARCHAR(20),
  
  -- Legacy fields
  target_amount DECIMAL(10,2),
  fine_per_day DECIMAL(10,2),
  due_frequency VARCHAR(20),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Fee Payments (normalized from embedded array)
CREATE TABLE IF NOT EXISTS school_xx_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES school_xx_students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL, -- Cash, Cheque, Online, Bank Transfer
  receipt_number VARCHAR(100),
  fee_category VARCHAR(50) NOT NULL, -- registration, admission, annualFund, monthly, transport, other
  month VARCHAR(7), -- For monthly fees, e.g., "2024-04"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAFF
-- ============================================

-- Staff Members
CREATE TABLE IF NOT EXISTS school_xx_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES school_xx_users(id) ON DELETE SET NULL, -- For staff portal login
  
  name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50) NOT NULL, -- Display ID like EMP-001
  role VARCHAR(50) NOT NULL, -- Teacher, Administrative, Bus Driver, Support Staff
  monthly_salary DECIMAL(10,2) NOT NULL,
  subject_or_grade VARCHAR(100), -- For teachers
  
  -- Contact Info
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  
  -- Salary Payment Settings
  salary_due_day INTEGER DEFAULT 5 CHECK (salary_due_day >= 1 AND salary_due_day <= 28),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, employee_id)
);

-- Salary Payments (normalized from embedded array)
CREATE TABLE IF NOT EXISTS school_xx_salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES school_xx_staff(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- YYYY-MM
  expected_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- Paid, Pending, Partially Paid
  due_date DATE NOT NULL, -- Expected payment date
  payment_date DATE, -- Actual payment date
  late_days INTEGER DEFAULT 0, -- Calculated: payment_date - due_date
  method VARCHAR(50), -- Cash, Cheque, Online, Bank Transfer
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, month)
);

-- ============================================
-- EXPENSES
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL, -- Transportation, Events, Utilities, Supplies, Infrastructure, Miscellaneous
  description TEXT,
  vendor_payee VARCHAR(255),
  payment_method VARCHAR(50),
  tags TEXT[], -- Array of tags
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STOCKS
-- ============================================

CREATE TABLE IF NOT EXISTS school_xx_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  publisher_name VARCHAR(255) NOT NULL,
  description TEXT,
  purchase_date DATE NOT NULL,
  total_credit_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- open, cleared
  settled_date DATE,
  settled_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Transactions (normalized from embedded array)
CREATE TABLE IF NOT EXISTS school_xx_stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES school_xx_stocks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL, -- purchase, sale, return
  amount DECIMAL(10,2) NOT NULL,
  quantity INTEGER,
  description TEXT,
  receipt_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

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
CREATE INDEX IF NOT EXISTS idx_school_xx_stocks_session ON school_xx_stocks(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_stock_transactions_stock ON school_xx_stock_transactions(stock_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE school_xx_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_stock_transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (can be restricted later)
CREATE POLICY "Allow all for authenticated" ON school_xx_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_schools FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_classes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_fee_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_salary_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_stocks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_stock_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anon access for development (remove in production)
CREATE POLICY "Allow anon for dev" ON school_xx_roles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_permissions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_role_permissions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_schools FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_sessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_classes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_fee_payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_staff FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_salary_payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_expenses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_stocks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_stock_transactions FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- SEED DATA: Default Permissions
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
  ('app:lock', 'app', 'lock', 'Lock/unlock school for all users (Super Admin only)'),
  ('plans:manage', 'plans', 'manage', 'Change subscription plan for a school (Super Admin only)'),
  ('assistant:use', 'assistant', 'use', 'Use Axpo Assistant (AI chat) - premium, admin only')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED DATA: Default Roles
-- ============================================

-- Super Admin: SaaS provider, can add schools and lock app. Highest role.
-- Admin: Full access except add schools and lock (stays below Super Admin)
INSERT INTO school_xx_roles (id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Super Admin', 'SaaS provider: add schools, lock/unlock app', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Full system access (no add school / lock)', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Manager', 'School management access', FALSE),
  ('00000000-0000-0000-0000-000000000003', 'Teacher', 'Teacher access with limited permissions', FALSE),
  ('00000000-0000-0000-0000-000000000004', 'Student', 'Student portal access - view own data only', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Super Admin: all permissions (schools:create, app:lock, plans:manage, everything)
INSERT INTO school_xx_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000000', id FROM school_xx_permissions
ON CONFLICT DO NOTHING;

-- Admin: all permissions EXCEPT schools:create, app:lock, and plans:manage (Admin has assistant:use)
INSERT INTO school_xx_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM school_xx_permissions
WHERE id NOT IN ('schools:create', 'app:lock', 'plans:manage')
ON CONFLICT DO NOTHING;

-- Manager permissions (most except roles:manage)
INSERT INTO school_xx_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM school_xx_permissions
WHERE id NOT IN ('roles:manage', 'users:delete')
ON CONFLICT DO NOTHING;

-- Teacher permissions (limited)
INSERT INTO school_xx_role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000003', 'dashboard:view'),
  ('00000000-0000-0000-0000-000000000003', 'students:view'),
  ('00000000-0000-0000-0000-000000000003', 'staff:view'),
  ('00000000-0000-0000-0000-000000000003', 'reports:view')
ON CONFLICT DO NOTHING;

-- Student permissions (view own only - handled in app logic)
INSERT INTO school_xx_role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000004', 'dashboard:view')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Default Users (Super Admin + Admin)
-- ============================================

-- Default Super Admin (username: superadmin, password: superadmin) - only this account can add schools and lock app. Cannot create more Super Admins.
-- Password hash is bcrypt of 'superadmin'
INSERT INTO school_xx_users (id, username, name, email, role_id, password_hash, must_change_password) VALUES
  ('00000000-0000-0000-0000-000000000010', 'superadmin', 'Super Administrator', 'superadmin@school.local', '00000000-0000-0000-0000-000000000000', '$2b$10$TWRDHvANAvjv3bJB72KOpOs1TdUqaGJhf/GA9M0cvcIqZ3z5d.ouG', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Default admin user (username: admin, password: admin - should be changed on first login)
-- Password hash is bcrypt of 'admin'
INSERT INTO school_xx_users (id, username, name, email, role_id, password_hash, must_change_password) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrator', 'admin@school.local', '00000000-0000-0000-0000-000000000001', '$2a$10$X7UrE2J5PQb.4rCwVLi.s.7.Dh8L2Yx5z5b5b5b5b5b5b5b5b5b5b', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION school_xx_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT unnest(ARRAY[
      'school_xx_roles', 'school_xx_users', 'school_xx_schools', 
      'school_xx_sessions', 'school_xx_classes', 'school_xx_students',
      'school_xx_fee_payments', 'school_xx_staff', 'school_xx_salary_payments',
      'school_xx_expenses', 'school_xx_stocks', 'school_xx_stock_transactions'
    ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW
        EXECUTE FUNCTION school_xx_update_updated_at();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate late days for salary payments
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

CREATE TRIGGER calculate_salary_late_days
  BEFORE INSERT OR UPDATE ON school_xx_salary_payments
  FOR EACH ROW
  EXECUTE FUNCTION school_xx_calculate_salary_late_days();
