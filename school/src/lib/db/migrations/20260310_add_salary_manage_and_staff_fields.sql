-- ============================================
-- Migration: Add salary:manage permission and staff/salary payment fields
-- ============================================
-- 1. Add salary:manage permission for managing salary payments, leaves, attendance
-- 2. Add new fields to staff table for leave/salary configuration
-- 3. Add new fields to salary_payments table for leave tracking and allowances
-- ============================================

-- 1. Add salary:manage permission
INSERT INTO permissions (id, module, action, description) VALUES
  ('salary:manage', 'salary', 'manage', 'Manage salary payments, leaves, and attendance data')
ON CONFLICT (id) DO NOTHING;

-- 2. Grant salary:manage to Admin and Manager roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, 'salary:manage'
FROM roles r
WHERE r.name IN ('Admin', 'Manager', 'Super Admin')
ON CONFLICT DO NOTHING;

-- 3. Add new fields to staff table
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS allowed_leaves_per_month INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS per_day_salary NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS classes_subjects JSONB;

-- 4. Add new fields to salary_payments table
ALTER TABLE salary_payments
ADD COLUMN IF NOT EXISTS days_worked INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS leaves_taken INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS allowed_leaves INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS excess_leaves INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS leave_deduction NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_allowance NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS allowance_note TEXT,
ADD COLUMN IF NOT EXISTS extra_deduction NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deduction_note TEXT,
ADD COLUMN IF NOT EXISTS calculated_salary NUMERIC(10, 2) DEFAULT 0;

-- 5. Update existing salary payments to set calculated_salary = paid_amount if not set
UPDATE salary_payments
SET calculated_salary = paid_amount
WHERE calculated_salary = 0 OR calculated_salary IS NULL;
