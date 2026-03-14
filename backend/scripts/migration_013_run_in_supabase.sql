-- =============================================================================
-- Migration 013: Add new fields for students and staff
-- Run this directly in Supabase SQL Editor
-- =============================================================================

-- Students: aadhaar, DOB, admission_number, sibling discount, frozen account
ALTER TABLE students ADD COLUMN IF NOT EXISTS admission_number VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12);
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS has_sibling_discount BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ;

-- Staff: aadhaar, DOB
ALTER TABLE staff ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Update default allowed_leaves_per_month from 2 to 1
ALTER TABLE staff ALTER COLUMN allowed_leaves_per_month SET DEFAULT 1;

-- Update default allowed_leaves from 2 to 1 for salary payments
ALTER TABLE salary_payments ALTER COLUMN allowed_leaves SET DEFAULT 1;

-- Done!
SELECT 'Migration 013 completed successfully!' AS status;
