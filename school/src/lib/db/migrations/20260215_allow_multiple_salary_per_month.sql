-- Allow multiple salary payments per (staff, month) – e.g. bonus or second installment
-- Run this after schema / replace tables.

ALTER TABLE salary_payments DROP CONSTRAINT IF EXISTS salary_payments_staff_id_month_key;
