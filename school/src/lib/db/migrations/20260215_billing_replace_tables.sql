-- ============================================
-- Billing enhancements: replace tables from scratch
-- Run this when there is no data to preserve.
-- Drops and recreates: school_xx_fee_payments, school_xx_students, school_xx_fixed_monthly_costs
-- ============================================

-- 1. Drop in order (respect foreign keys)
DROP TABLE IF EXISTS school_xx_fee_payments CASCADE;
DROP TABLE IF EXISTS school_xx_students CASCADE;
DROP TABLE IF EXISTS school_xx_fixed_monthly_costs CASCADE;

-- 2. Recreate school_xx_students (with photo_url, sibling_id)
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
  sibling_id UUID REFERENCES school_xx_students(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- 3. Recreate school_xx_fee_payments (with receipt_photo_url)
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

-- 4. Create school_xx_fixed_monthly_costs
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

-- 5. Indexes
CREATE INDEX idx_school_xx_students_session ON school_xx_students(session_id);
CREATE INDEX idx_school_xx_students_class ON school_xx_students(class_id);
CREATE INDEX idx_school_xx_students_sibling ON school_xx_students(sibling_id);
CREATE INDEX idx_school_xx_fee_payments_student ON school_xx_fee_payments(student_id);
CREATE INDEX idx_school_xx_fixed_monthly_costs_session ON school_xx_fixed_monthly_costs(session_id);

-- 6. RLS
ALTER TABLE school_xx_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_xx_fixed_monthly_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON school_xx_students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_fee_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON school_xx_fixed_monthly_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon for dev" ON school_xx_students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_fee_payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon for dev" ON school_xx_fixed_monthly_costs FOR ALL TO anon USING (true) WITH CHECK (true);

-- 7. updated_at trigger for fixed_monthly_costs (requires school_xx_update_updated_at() to exist from main schema)
DROP TRIGGER IF EXISTS update_school_xx_fixed_monthly_costs_updated_at ON school_xx_fixed_monthly_costs;
CREATE TRIGGER update_school_xx_fixed_monthly_costs_updated_at
  BEFORE UPDATE ON school_xx_fixed_monthly_costs
  FOR EACH ROW
  EXECUTE FUNCTION school_xx_update_updated_at();
