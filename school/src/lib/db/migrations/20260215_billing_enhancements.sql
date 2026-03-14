-- Billing Enhancements Migration
-- Date: 2026-02-15

-- Add receipt photo to fee payments
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS receipt_photo_url TEXT;

-- Add student photo
ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add sibling relationship
ALTER TABLE students ADD COLUMN IF NOT EXISTS sibling_id UUID REFERENCES students(id) ON DELETE SET NULL;

-- Fixed monthly costs table
CREATE TABLE IF NOT EXISTS fixed_monthly_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fixed monthly costs
CREATE INDEX IF NOT EXISTS idx_fixed_monthly_costs_session ON fixed_monthly_costs(session_id);

-- Enable RLS on fixed monthly costs
ALTER TABLE fixed_monthly_costs ENABLE ROW LEVEL SECURITY;

-- Allow all for authenticated users
CREATE POLICY IF NOT EXISTS "Allow all for authenticated" ON fixed_monthly_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anon access for development
CREATE POLICY IF NOT EXISTS "Allow anon for dev" ON fixed_monthly_costs FOR ALL TO anon USING (true) WITH CHECK (true);

-- Update expense categories to include Stock Purchase and Salary
-- First drop existing constraint if it exists
DO $$ 
BEGIN
  ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- No need to add constraint check as we're using VARCHAR without enum constraint

-- Add updated_at trigger to fixed monthly costs
DROP TRIGGER IF EXISTS update_fixed_monthly_costs_updated_at ON fixed_monthly_costs;
CREATE TRIGGER update_fixed_monthly_costs_updated_at
  BEFORE UPDATE ON fixed_monthly_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
