-- Migration: add plan_id to school_xx_schools (for existing databases created before this column existed)
-- Run this if your school_xx_schools table does not have plan_id yet.

ALTER TABLE school_xx_schools
  ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free';

-- Optional: add check constraint if not present (PG 9.5+)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'school_xx_schools_plan_id_check'
    AND conrelid = 'school_xx_schools'::regclass
  ) THEN
    ALTER TABLE school_xx_schools
      ADD CONSTRAINT school_xx_schools_plan_id_check
      CHECK (plan_id IN ('free', 'pro', 'enterprise'));
  END IF;
END
$$;
