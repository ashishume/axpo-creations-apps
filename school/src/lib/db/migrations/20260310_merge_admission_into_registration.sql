-- Merge Admission into Registration/Admission fees (one-time)
-- Run this on existing DBs that have admission_fees and admission_paid columns.
-- New installs use schema without these columns.

-- 1. Merge admission into registration for students
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'admission_fees'
  ) THEN
    UPDATE students
    SET registration_fees = COALESCE(registration_fees, 0) + COALESCE(admission_fees, 0),
        registration_paid = registration_paid OR COALESCE(admission_paid, FALSE);
    ALTER TABLE students DROP COLUMN IF EXISTS admission_fees;
    ALTER TABLE students DROP COLUMN IF EXISTS admission_paid;
  END IF;
END $$;

-- 2. Merge admission into registration for classes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'classes' AND column_name = 'admission_fees'
  ) THEN
    UPDATE classes
    SET registration_fees = COALESCE(registration_fees, 0) + COALESCE(admission_fees, 0);
    ALTER TABLE classes DROP COLUMN IF EXISTS admission_fees;
  END IF;
END $$;
