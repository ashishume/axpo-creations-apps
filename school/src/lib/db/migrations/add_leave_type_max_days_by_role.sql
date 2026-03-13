-- Allow different max leave days per staff role for each leave type.
-- max_days_by_role: optional JSONB e.g. {"Teacher": 12, "Admin": 18}. Falls back to max_days_per_year if role not present.
ALTER TABLE school_xx_leave_types
  ADD COLUMN IF NOT EXISTS max_days_by_role JSONB;

COMMENT ON COLUMN school_xx_leave_types.max_days_by_role IS 'Optional max days per year by staff role, e.g. {"Teacher": 12, "Admin": 18}. Fallback: max_days_per_year.';
