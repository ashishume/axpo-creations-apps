-- ============================================
-- Billing enhancements: replace tables from scratch
-- Run this when there is no data to preserve.
-- Drops and recreates: fee_payments, students, fixed_monthly_costs
-- ============================================

-- 1. Drop in order (respect foreign keys)
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS fixed_monthly_costs CASCADE;

-- 2. Recreate students (with photo_url, sibling_id)
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

-- 3. Recreate fee_payments (with receipt_photo_url)
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

-- 4. Create fixed_monthly_costs
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

-- 5. Indexes
CREATE INDEX idx_students_session ON students(session_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_sibling ON students(sibling_id);
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_fixed_monthly_costs_session ON fixed_monthly_costs(session_id);

-- 6. RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_monthly_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON fee_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON fixed_monthly_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon for dev" ON students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON fee_payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON fixed_monthly_costs FOR ALL TO anon USING (true) WITH CHECK (true);

-- 7. updated_at trigger for fixed_monthly_costs (requires update_updated_at() to exist from main schema)
DROP TRIGGER IF EXISTS update_fixed_monthly_costs_updated_at ON fixed_monthly_costs;
CREATE TRIGGER update_fixed_monthly_costs_updated_at
  BEFORE UPDATE ON fixed_monthly_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
