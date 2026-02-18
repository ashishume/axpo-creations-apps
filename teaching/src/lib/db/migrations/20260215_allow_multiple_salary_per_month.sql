-- Allow multiple salary payments per (staff, month) – e.g. bonus or second installment
-- Run this after schema / replace tables.

ALTER TABLE school_xx_salary_payments DROP CONSTRAINT IF EXISTS school_xx_salary_payments_staff_id_month_key;
