-- Add billing user: username and password both "superadmin"
-- Use the block that matches your setup (Supabase vs Backend).

-- =============================================================================
-- SUPABASE (users table has NO password_hash; auth is via Supabase Auth)
-- =============================================================================
-- Step 1: Create the user in Supabase Dashboard:
--         Authentication → Users → Add user
--         Email: superadmin@billing.local   Password: superadmin
-- Step 2: Run the SQL below to add the profile row in public.users.

INSERT INTO public.users (id, email, name, role, created_at)
SELECT id, 'superadmin@billing.local', 'Super Admin', 'admin', now() AT TIME ZONE 'utc'
FROM auth.users
WHERE email = 'superadmin@billing.local'
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- If you used a different email in Step 1, change 'superadmin@billing.local' above
-- to that email in both places. To sign in in the app, use that email and password: superadmin.


-- =============================================================================
-- BACKEND (users table HAS password_hash; local auth)
-- =============================================================================
-- Uncomment and run the block below only if your users table has a password_hash
-- column (backend billing DB). Requires: CREATE EXTENSION IF NOT EXISTS pgcrypto;

/*
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.users (id, email, name, password_hash, role, created_at)
VALUES (
  gen_random_uuid(),
  'superadmin',
  'Super Admin',
  crypt('superadmin', gen_salt('bf', 12)),
  'admin',
  now() AT TIME ZONE 'utc'
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;
*/
