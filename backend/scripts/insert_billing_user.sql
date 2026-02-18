-- Create a billing user in Supabase (run in SQL Editor).
-- Requires pgcrypto extension (Supabase has it; enable if needed).
-- Replace email, name, password, and role as desired.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.users (
  id,
  email,
  name,
  password_hash,
  role,
  created_at
) VALUES (
  gen_random_uuid(),
  'admin@example.com',                    -- your email
  'Admin',                                 -- display name (optional)
  crypt('yourpassword', gen_salt('bf', 12)),  -- password (bcrypt, 12 rounds)
  'admin',                                 -- 'admin' or 'user'
  now() AT TIME ZONE 'utc'
);

-- Example: add a regular user
-- INSERT INTO public.users (id, email, name, password_hash, role, created_at)
-- VALUES (
--   gen_random_uuid(),
--   'user@example.com',
--   'Jane',
--   crypt('secret123', gen_salt('bf', 12)),
--   'user',
--   now() AT TIME ZONE 'utc'
-- );
