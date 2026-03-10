-- Migration: Student Enrollment System
-- Date: 2026-03-11
-- Purpose: Separate student identity from session-specific fee tracking
--          This allows students to be enrolled in multiple sessions with independent fee structures

-- ============================================
-- STEP 1: Create temporary backup table
-- ============================================
CREATE TABLE IF NOT EXISTS school_xx_students_backup AS
SELECT * FROM school_xx_students;

CREATE TABLE IF NOT EXISTS school_xx_fee_payments_backup AS
SELECT * FROM school_xx_fee_payments;

-- ============================================
-- STEP 2: Create new student_enrollments table
-- ============================================
CREATE TABLE IF NOT EXISTS school_xx_student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES school_xx_students(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  class_id UUID REFERENCES school_xx_classes(id) ON DELETE SET NULL,
  
  -- Fee structure (per enrollment)
  registration_fees DECIMAL(10,2),
  annual_fund DECIMAL(10,2),
  monthly_fees DECIMAL(10,2),
  transport_fees DECIMAL(10,2),
  
  -- Fee payment status flags
  registration_paid BOOLEAN DEFAULT FALSE,
  annual_fund_paid BOOLEAN DEFAULT FALSE,
  
  -- Due date config
  due_day_of_month INTEGER CHECK (due_day_of_month >= 1 AND due_day_of_month <= 28),
  late_fee_amount DECIMAL(10,2),
  late_fee_frequency VARCHAR(20),
  
  -- Legacy fields for backward compatibility
  target_amount DECIMAL(10,2),
  fine_per_day DECIMAL(10,2),
  due_frequency VARCHAR(20),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique enrollment per student per session
  UNIQUE(student_id, session_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_enrollments_session ON school_xx_student_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON school_xx_student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON school_xx_student_enrollments(class_id);

-- ============================================
-- STEP 3: Add school_id to students table
-- ============================================
-- Add school_id column (nullable initially for migration)
ALTER TABLE school_xx_students 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES school_xx_schools(id) ON DELETE CASCADE;

-- Populate school_id from session_id
UPDATE school_xx_students s
SET school_id = sess.school_id
FROM school_xx_sessions sess
WHERE s.session_id = sess.id
AND s.school_id IS NULL;

-- ============================================
-- STEP 4: Migrate existing student data
-- ============================================
-- Create enrollment records from existing students
INSERT INTO school_xx_student_enrollments (
  id,
  student_id,
  session_id,
  class_id,
  registration_fees,
  annual_fund,
  monthly_fees,
  transport_fees,
  registration_paid,
  annual_fund_paid,
  due_day_of_month,
  late_fee_amount,
  late_fee_frequency,
  target_amount,
  fine_per_day,
  due_frequency,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  s.id,
  s.session_id,
  s.class_id,
  s.registration_fees,
  s.annual_fund,
  s.monthly_fees,
  s.transport_fees,
  s.registration_paid,
  s.annual_fund_paid,
  s.due_day_of_month,
  s.late_fee_amount,
  s.late_fee_frequency,
  s.target_amount,
  s.fine_per_day,
  s.due_frequency,
  s.created_at,
  s.updated_at
FROM school_xx_students s
WHERE NOT EXISTS (
  SELECT 1 FROM school_xx_student_enrollments e
  WHERE e.student_id = s.id AND e.session_id = s.session_id
);

-- ============================================
-- STEP 5: Migrate fee_payments to use enrollment_id
-- ============================================
-- Add enrollment_id column to fee_payments
ALTER TABLE school_xx_fee_payments 
ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES school_xx_student_enrollments(id) ON DELETE CASCADE;

-- Populate enrollment_id from student_id + session_id
UPDATE school_xx_fee_payments fp
SET enrollment_id = e.id
FROM school_xx_students s
JOIN school_xx_student_enrollments e ON e.student_id = s.id AND e.session_id = s.session_id
WHERE fp.student_id = s.id
AND fp.enrollment_id IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_fee_payments_enrollment ON school_xx_fee_payments(enrollment_id);

-- ============================================
-- STEP 6: Remove fee columns from students table
-- ============================================
-- Drop fee-related columns from students (they now live in enrollments)
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS session_id CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS class_id CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS registration_fees CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS annual_fund CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS monthly_fees CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS transport_fees CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS registration_paid CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS annual_fund_paid CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS due_day_of_month CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS late_fee_amount CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS late_fee_frequency CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS target_amount CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS fine_per_day CASCADE;
ALTER TABLE school_xx_students DROP COLUMN IF EXISTS due_frequency CASCADE;

-- Make school_id NOT NULL after migration
ALTER TABLE school_xx_students ALTER COLUMN school_id SET NOT NULL;

-- Drop student_id from fee_payments (now uses enrollment_id)
-- Keep it temporarily for rollback capability, will be removed in future migration
-- ALTER TABLE school_xx_fee_payments DROP COLUMN IF EXISTS student_id CASCADE;

-- ============================================
-- STEP 7: Update constraints and indexes
-- ============================================
-- Add unique constraint on student_id within school (not across sessions)
-- student_id (display ID like STU-001) should be unique per school
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_school_student_id 
ON school_xx_students(school_id, student_id);

-- ============================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================
-- Verify all students have school_id
-- SELECT COUNT(*) FROM school_xx_students WHERE school_id IS NULL;

-- Verify all students have at least one enrollment
-- SELECT s.id, s.name, COUNT(e.id) as enrollment_count
-- FROM school_xx_students s
-- LEFT JOIN school_xx_student_enrollments e ON e.student_id = s.id
-- GROUP BY s.id, s.name
-- HAVING COUNT(e.id) = 0;

-- Verify all fee payments have enrollment_id
-- SELECT COUNT(*) FROM school_xx_fee_payments WHERE enrollment_id IS NULL;

-- ============================================
-- ROLLBACK PROCEDURE (if needed)
-- ============================================
-- To rollback this migration:
-- 1. DROP TABLE school_xx_student_enrollments CASCADE;
-- 2. ALTER TABLE school_xx_students DROP COLUMN school_id;
-- 3. ALTER TABLE school_xx_fee_payments DROP COLUMN enrollment_id;
-- 4. Restore from backup tables
-- 5. DROP TABLE school_xx_students_backup;
-- 6. DROP TABLE school_xx_fee_payments_backup;
