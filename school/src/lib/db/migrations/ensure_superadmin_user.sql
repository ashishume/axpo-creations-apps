-- Ensure Super Admin user exists with username: superadmin, password: superadmin.
-- Run this migration to fix or create the default super admin account.

-- Update password for existing Super Admin by id (bcrypt hash of 'superadmin')
UPDATE users
SET password_hash = '$2b$10$TWRDHvANAvjv3bJB72KOpOs1TdUqaGJhf/GA9M0cvcIqZ3z5d.ouG',
    username = 'superadmin',
    name = 'Super Administrator',
    email = 'superadmin@school.local',
    role_id = '00000000-0000-0000-0000-000000000000',
    must_change_password = TRUE
WHERE id = '00000000-0000-0000-0000-000000000010';

-- If your schema has organization_id, ensure it is NULL for Super Admin
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'organization_id'
  ) THEN
    UPDATE users
    SET organization_id = NULL
    WHERE id = '00000000-0000-0000-0000-000000000010';
  END IF;
END $$;
