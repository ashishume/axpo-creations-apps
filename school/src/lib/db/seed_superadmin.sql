-- ============================================
-- Seed: Super Admin role + user (username: superadmin, password: superadmin)
-- Run after schema_all_tables.sql (tables + permissions must exist).
-- Idempotent: safe to run multiple times.
-- ============================================

-- 1. Insert Super Admin role (if not exists)
INSERT INTO school_xx_roles (id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Super Admin', 'SaaS provider: add schools, lock/unlock app', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Grant all permissions to Super Admin role (if not already granted)
INSERT INTO school_xx_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000000', id FROM school_xx_permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. Insert superadmin user (username: superadmin, password: superadmin)
--    bcrypt hash of 'superadmin' (change password after first login)
INSERT INTO school_xx_users (
  id,
  username,
  name,
  email,
  role_id,
  password_hash,
  must_change_password,
  organization_id,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  'superadmin',
  'Super Administrator',
  'superadmin@school.local',
  '00000000-0000-0000-0000-000000000000',
  '$2b$10$TWRDHvANAvjv3bJB72KOpOs1TdUqaGJhf/GA9M0cvcIqZ3z5d.ouG',
  TRUE,
  NULL,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  username    = EXCLUDED.username,
  name        = EXCLUDED.name,
  email       = EXCLUDED.email,
  role_id     = EXCLUDED.role_id,
  password_hash = EXCLUDED.password_hash,
  must_change_password = EXCLUDED.must_change_password,
  organization_id = EXCLUDED.organization_id,
  is_active   = EXCLUDED.is_active,
  updated_at  = NOW();

-- If your users table has no unique on id but has unique on username, use:
-- ON CONFLICT (username) DO UPDATE SET ...
