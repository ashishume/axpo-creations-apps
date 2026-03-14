-- Migration: add plan_id to schools (for existing databases created before this column existed)
-- Run this if your schools table does not have plan_id yet.

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free';

-- Optional: add check constraint if not present (PG 9.5+)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'schools_plan_id_check'
    AND conrelid = 'schools'::regclass
  ) THEN
    ALTER TABLE schools
      ADD CONSTRAINT schools_plan_id_check
      CHECK (plan_id IN ('free', 'pro', 'enterprise'));
  END IF;
END
$$;
