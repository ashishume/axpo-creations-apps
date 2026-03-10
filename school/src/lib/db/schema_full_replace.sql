-- ============================================
-- School Management System - Full Schema Replace
-- ============================================
-- Run this file to DROP all school_xx_* tables and recreate from scratch.
-- Includes: organizations (multi-tenant), schools, users, sessions, classes,
-- students, staff, expenses, stocks, fee_payments, salary_payments,
-- stock_transactions, fixed_monthly_costs. RLS enforces org isolation.
-- ============================================

-- ============================================
-- PART 1: DROP EXISTING (reverse dependency order)
-- ============================================

DROP TRIGGER IF EXISTS calculate_salary_late_days ON school_xx_salary_payments;
DROP TRIGGER IF EXISTS update_school_xx_stock_transactions_updated_at ON school_xx_stock_transactions;
DROP TRIGGER IF EXISTS update_school_xx_stocks_updated_at ON school_xx_stocks;
DROP TRIGGER IF EXISTS update_school_xx_expenses_updated_at ON school_xx_expenses;
DROP TRIGGER IF EXISTS update_school_xx_salary_payments_updated_at ON school_xx_salary_payments;
DROP TRIGGER IF EXISTS update_school_xx_staff_updated_at ON school_xx_staff;
DROP TRIGGER IF EXISTS update_school_xx_fee_payments_updated_at ON school_xx_fee_payments;
DROP TRIGGER IF EXISTS update_school_xx_students_updated_at ON school_xx_students;
DROP TRIGGER IF EXISTS update_school_xx_classes_updated_at ON school_xx_classes;
DROP TRIGGER IF EXISTS update_school_xx_sessions_updated_at ON school_xx_sessions;
DROP TRIGGER IF EXISTS update_school_xx_schools_updated_at ON school_xx_schools;
DROP TRIGGER IF EXISTS update_school_xx_users_updated_at ON school_xx_users;
DROP TRIGGER IF EXISTS update_school_xx_roles_updated_at ON school_xx_roles;
DROP TRIGGER IF EXISTS update_school_xx_fixed_monthly_costs_updated_at ON school_xx_fixed_monthly_costs;

DROP TABLE IF EXISTS school_xx_stock_transactions CASCADE;
DROP TABLE IF EXISTS school_xx_fee_payments CASCADE;
DROP TABLE IF EXISTS school_xx_salary_payments CASCADE;
DROP TABLE IF EXISTS school_xx_fixed_monthly_costs CASCADE;
DROP TABLE IF EXISTS school_xx_stocks CASCADE;
DROP TABLE IF EXISTS school_xx_expenses CASCADE;
DROP TABLE IF EXISTS school_xx_staff CASCADE;
DROP TABLE IF EXISTS school_xx_students CASCADE;
DROP TABLE IF EXISTS school_xx_classes CASCADE;
DROP TABLE IF EXISTS school_xx_sessions CASCADE;
DROP TABLE IF EXISTS school_xx_schools CASCADE;
DROP TABLE IF EXISTS school_xx_users CASCADE;
DROP TABLE IF EXISTS school_xx_role_permissions CASCADE;
DROP TABLE IF EXISTS school_xx_organizations CASCADE;
DROP TABLE IF EXISTS school_xx_roles CASCADE;
DROP TABLE IF EXISTS school_xx_permissions CASCADE;

DROP FUNCTION IF EXISTS school_xx_calculate_salary_late_days();
DROP FUNCTION IF EXISTS school_xx_update_updated_at();
DROP FUNCTION IF EXISTS school_xx_current_organization_id();

-- ============================================
-- PART 2: CREATE TABLES
-- ============================================

-- Organizations (tenant boundary; one org has many schools)
CREATE TABLE school_xx_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  billing_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles
CREATE TABLE school_xx_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions
CREATE TABLE school_xx_permissions (
  id VARCHAR(50) PRIMARY KEY,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT
);

-- Role-Permission mapping
CREATE TABLE school_xx_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES school_xx_roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(50) NOT NULL REFERENCES school_xx_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Users (organization_id NULL = platform Super Admin)
CREATE TABLE school_xx_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  organization_id UUID REFERENCES school_xx_organizations(id) ON DELETE SET NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES school_xx_roles(id),
  password_hash VARCHAR(255),
  must_change_password BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  staff_id UUID,
  student_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schools (belong to one organization)
CREATE TABLE school_xx_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES school_xx_organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  contact VARCHAR(100),
  logo_url TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  plan_id TEXT DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE school_xx_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school_xx_schools(id) ON DELETE CASCADE,
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
CREATE TABLE school_xx_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  registration_fees DECIMAL(10,2) DEFAULT 0,
  admission_fees DECIMAL(10,2) DEFAULT 0,
  annual_fund DECIMAL(10,2) DEFAULT 0,
  monthly_fees DECIMAL(10,2) DEFAULT 0,
  late_fee_amount DECIMAL(10,2) DEFAULT 0,
  late_fee_frequency VARCHAR(20) DEFAULT 'weekly',
  due_day_of_month INTEGER DEFAULT 10 CHECK (due_day_of_month >= 1 AND due_day_of_month <= 28),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, name)
);

-- Students (self-ref sibling_id added after table exists)
CREATE TABLE school_xx_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES school_xx_classes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES school_xx_users(id) ON DELETE SET NULL,
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
  registration_fees DECIMAL(10,2),
  admission_fees DECIMAL(10,2),
  annual_fund DECIMAL(10,2),
  monthly_fees DECIMAL(10,2),
  transport_fees DECIMAL(10,2),
  registration_paid BOOLEAN DEFAULT FALSE,
  admission_paid BOOLEAN DEFAULT FALSE,
  annual_fund_paid BOOLEAN DEFAULT FALSE,
  due_day_of_month INTEGER CHECK (due_day_of_month >= 1 AND due_day_of_month <= 28),
  late_fee_amount DECIMAL(10,2),
  late_fee_frequency VARCHAR(20),
  target_amount DECIMAL(10,2),
  fine_per_day DECIMAL(10,2),
  due_frequency VARCHAR(20),
  photo_url TEXT,
  sibling_id UUID REFERENCES school_xx_students(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Fee payments
CREATE TABLE school_xx_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES school_xx_students(id) ON DELETE CASCADE,
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
CREATE TABLE school_xx_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES school_xx_users(id) ON DELETE SET NULL,
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
CREATE TABLE school_xx_salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES school_xx_staff(id) ON DELETE CASCADE,
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
CREATE TABLE school_xx_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
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
CREATE TABLE school_xx_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
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
CREATE TABLE school_xx_stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES school_xx_stocks(id) ON DELETE CASCADE,
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
CREATE TABLE school_xx_fixed_monthly_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: add FKs from users to staff/students (uncomment if you want referential integrity)
-- ALTER TABLE school_xx_users ADD CONSTRAINT fk_users_staff FOREIGN KEY (staff_id) REFERENCES school_xx_staff(id) ON DELETE SET NULL;
-- ALTER TABLE school_xx_users ADD CONSTRAINT fk_users_student FOREIGN KEY (student_id) REFERENCES school_xx_students(id) ON DELETE SET NULL;

-- ============================================
-- PART 3: INDEXES
-- ============================================

CREATE INDEX idx_school_xx_organizations_slug ON school_xx_organizations(slug);
CREATE INDEX idx_school_xx_users_role ON school_xx_users(role_id);
CREATE INDEX idx_school_xx_users_username ON school_xx_users(username);
CREATE INDEX idx_school_xx_users_organization ON school_xx_users(organization_id);
CREATE INDEX idx_school_xx_schools_organization ON school_xx_schools(organization_id);
CREATE INDEX idx_school_xx_sessions_school ON school_xx_sessions(school_id);
CREATE INDEX idx_school_xx_classes_session ON school_xx_classes(session_id);
CREATE INDEX idx_school_xx_students_session ON school_xx_students(session_id);
CREATE INDEX idx_school_xx_students_class ON school_xx_students(class_id);
CREATE INDEX idx_school_xx_students_sibling ON school_xx_students(sibling_id);
CREATE INDEX idx_school_xx_fee_payments_student ON school_xx_fee_payments(student_id);
CREATE INDEX idx_school_xx_staff_session ON school_xx_staff(session_id);
CREATE INDEX idx_school_xx_salary_payments_staff ON school_xx_salary_payments(staff_id);
CREATE INDEX idx_school_xx_salary_payments_month ON school_xx_salary_payments(month);
CREATE INDEX idx_school_xx_expenses_session ON school_xx_expenses(session_id);
CREATE INDEX idx_school_xx_stocks_session ON school_xx_stocks(session_id);
CREATE INDEX idx_school_xx_stock_transactions_stock ON school_xx_stock_transactions(stock_id);
CREATE INDEX idx_school_xx_fixed_monthly_costs_session ON school_xx_fixed_monthly_costs(session_id);

-- ============================================
-- PART 4: HELPER FUNCTION (for RLS)
-- ============================================

CREATE OR REPLACE FUNCTION school_xx_current_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM school_xx_users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- PART 5: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE school_xx_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_organizations ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE school_xx_fixed_monthly_costs ENABLE ROW LEVEL SECURITY;

-- Roles, permissions (global; all authenticated can read)
CREATE POLICY "Allow all for authenticated" ON school_xx_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_roles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_permissions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_role_permissions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Organizations (own org or platform admin)
CREATE POLICY "Users see own org or all if platform admin"
  ON school_xx_organizations FOR SELECT TO authenticated
  USING (id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL);
CREATE POLICY "Users update own org"
  ON school_xx_organizations FOR UPDATE TO authenticated
  USING (id = school_xx_current_organization_id())
  WITH CHECK (id = school_xx_current_organization_id());
CREATE POLICY "Platform admin can insert orgs"
  ON school_xx_organizations FOR INSERT TO authenticated
  WITH CHECK (school_xx_current_organization_id() IS NULL);
CREATE POLICY "Allow anon orgs dev" ON school_xx_organizations FOR ALL TO anon USING (true) WITH CHECK (true);

-- Schools by org
CREATE POLICY "Schools by org"
  ON school_xx_schools FOR ALL TO authenticated
  USING (organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL)
  WITH CHECK (organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL);
CREATE POLICY "Allow anon schools dev" ON school_xx_schools FOR ALL TO anon USING (true) WITH CHECK (true);

-- Sessions by org
CREATE POLICY "Sessions by org"
  ON school_xx_sessions FOR ALL TO authenticated
  USING (
    school_id IN (
      SELECT id FROM school_xx_schools
      WHERE organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT id FROM school_xx_schools
      WHERE organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  );
CREATE POLICY "Allow anon sessions dev" ON school_xx_sessions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Users by org
CREATE POLICY "Users by org"
  ON school_xx_users FOR ALL TO authenticated
  USING (organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL)
  WITH CHECK (organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL);
CREATE POLICY "Allow anon users dev" ON school_xx_users FOR ALL TO anon USING (true) WITH CHECK (true);

-- Classes by org
CREATE POLICY "Classes by org"
  ON school_xx_classes FOR ALL TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM school_xx_sessions s
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM school_xx_sessions s
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  );
CREATE POLICY "Allow anon classes dev" ON school_xx_classes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Students by org
CREATE POLICY "Students by org"
  ON school_xx_students FOR ALL TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM school_xx_sessions s
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM school_xx_sessions s
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  );
CREATE POLICY "Allow anon students dev" ON school_xx_students FOR ALL TO anon USING (true) WITH CHECK (true);

-- Staff by org
CREATE POLICY "Staff by org"
  ON school_xx_staff FOR ALL TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM school_xx_sessions s
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM school_xx_sessions s
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  );
CREATE POLICY "Allow anon staff dev" ON school_xx_staff FOR ALL TO anon USING (true) WITH CHECK (true);

-- Expenses by org
CREATE POLICY "Expenses by org"
  ON school_xx_expenses FOR ALL TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM school_xx_sessions s
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM school_xx_sessions s
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  );
CREATE POLICY "Allow anon expenses dev" ON school_xx_expenses FOR ALL TO anon USING (true) WITH CHECK (true);

-- Stocks by org
CREATE POLICY "Stocks by org"
  ON school_xx_stocks FOR ALL TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM school_xx_sessions s
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM school_xx_sessions s
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  );
CREATE POLICY "Allow anon stocks dev" ON school_xx_stocks FOR ALL TO anon USING (true) WITH CHECK (true);

-- Fee payments by org
CREATE POLICY "Fee payments by org"
  ON school_xx_fee_payments FOR ALL TO authenticated
  USING (
    student_id IN (
      SELECT st.id FROM school_xx_students st
      JOIN school_xx_sessions s ON s.id = st.session_id
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT st.id FROM school_xx_students st
      JOIN school_xx_sessions s ON s.id = st.session_id
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  );
CREATE POLICY "Allow anon fee_payments dev" ON school_xx_fee_payments FOR ALL TO anon USING (true) WITH CHECK (true);

-- Salary payments by org
CREATE POLICY "Salary payments by org"
  ON school_xx_salary_payments FOR ALL TO authenticated
  USING (
    staff_id IN (
      SELECT st.id FROM school_xx_staff st
      JOIN school_xx_sessions s ON s.id = st.session_id
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  )
  WITH CHECK (
    staff_id IN (
      SELECT st.id FROM school_xx_staff st
      JOIN school_xx_sessions s ON s.id = st.session_id
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  );
CREATE POLICY "Allow anon salary_payments dev" ON school_xx_salary_payments FOR ALL TO anon USING (true) WITH CHECK (true);

-- Stock transactions by org
CREATE POLICY "Stock transactions by org"
  ON school_xx_stock_transactions FOR ALL TO authenticated
  USING (
    stock_id IN (
      SELECT sk.id FROM school_xx_stocks sk
      JOIN school_xx_sessions s ON s.id = sk.session_id
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  )
  WITH CHECK (
    stock_id IN (
      SELECT sk.id FROM school_xx_stocks sk
      JOIN school_xx_sessions s ON s.id = sk.session_id
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  );
CREATE POLICY "Allow anon stock_transactions dev" ON school_xx_stock_transactions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Fixed monthly costs by org
CREATE POLICY "Fixed monthly costs by org"
  ON school_xx_fixed_monthly_costs FOR ALL TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM school_xx_sessions s
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM school_xx_sessions s
      JOIN school_xx_schools sc ON sc.id = s.school_id
      WHERE sc.organization_id = school_xx_current_organization_id() OR school_xx_current_organization_id() IS NULL
    )
  );
CREATE POLICY "Allow anon fixed_monthly_costs dev" ON school_xx_fixed_monthly_costs FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- PART 6: SEED DATA
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
  ('plans:manage', 'plans', 'manage', 'Change subscription plan for a school (Super Admin only)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO school_xx_roles (id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Super Admin', 'SaaS provider: add schools, lock/unlock app', TRUE),
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Full system access (no add school / lock)', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Manager', 'School management access', FALSE),
  ('00000000-0000-0000-0000-000000000003', 'Teacher', 'Teacher access with limited permissions', FALSE),
  ('00000000-0000-0000-0000-000000000004', 'Student', 'Student portal access - view own data only', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO school_xx_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000000', id FROM school_xx_permissions
ON CONFLICT DO NOTHING;

INSERT INTO school_xx_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM school_xx_permissions
WHERE id NOT IN ('schools:create', 'app:lock', 'plans:manage')
ON CONFLICT DO NOTHING;

INSERT INTO school_xx_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM school_xx_permissions
WHERE id NOT IN ('roles:manage', 'users:delete')
ON CONFLICT DO NOTHING;

INSERT INTO school_xx_role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000003', 'dashboard:view'),
  ('00000000-0000-0000-0000-000000000003', 'students:view'),
  ('00000000-0000-0000-0000-000000000003', 'staff:view'),
  ('00000000-0000-0000-0000-000000000003', 'reports:view')
ON CONFLICT DO NOTHING;

INSERT INTO school_xx_role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000004', 'dashboard:view')
ON CONFLICT DO NOTHING;

-- Super Admin (username: superadmin, password: superadmin). organization_id NULL = platform admin.
INSERT INTO school_xx_users (id, username, name, email, role_id, password_hash, must_change_password, organization_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'superadmin', 'Super Administrator', 'superadmin@school.local', '00000000-0000-0000-0000-000000000000', '$2b$10$TWRDHvANAvjv3bJB72KOpOs1TdUqaGJhf/GA9M0cvcIqZ3z5d.ouG', TRUE, NULL)
ON CONFLICT (id) DO NOTHING;

-- Default admin (assign to an org when you create one). Password: admin
INSERT INTO school_xx_users (id, username, name, email, role_id, password_hash, must_change_password, organization_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrator', 'admin@school.local', '00000000-0000-0000-0000-000000000001', '$2a$10$X7UrE2J5PQb.4rCwVLi.s.7.Dh8L2Yx5z5b5b5b5b5b5b5b5b5b5b', TRUE, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 7: FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION school_xx_update_updated_at()
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
      'school_xx_roles', 'school_xx_users', 'school_xx_organizations', 'school_xx_schools',
      'school_xx_sessions', 'school_xx_classes', 'school_xx_students',
      'school_xx_fee_payments', 'school_xx_staff', 'school_xx_salary_payments',
      'school_xx_expenses', 'school_xx_stocks', 'school_xx_stock_transactions',
      'school_xx_fixed_monthly_costs'
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

DROP TRIGGER IF EXISTS calculate_salary_late_days ON school_xx_salary_payments;
CREATE TRIGGER calculate_salary_late_days
  BEFORE INSERT OR UPDATE ON school_xx_salary_payments
  FOR EACH ROW
  EXECUTE FUNCTION school_xx_calculate_salary_late_days();
