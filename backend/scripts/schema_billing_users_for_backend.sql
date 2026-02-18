-- Backend-compatible billing users table (local auth with password_hash).
-- Use this when the backend handles auth (POST /billing/api/v1/auth/login, register).
-- Run in Supabase SQL Editor if your billing DB is Supabase.
--
-- If you already have a "users" table from the Supabase Auth schema (id REFERENCES auth.users,
-- no password_hash), you must drop it first or the backend register will fail with
-- "column password_hash does not exist". Only drop if you are not using Supabase Auth for billing:
--   DROP TABLE IF EXISTS public.users CASCADE;
-- Then run the CREATE TABLE below.

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  subscription_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON public.users (email);

-- Optional: allow backend to insert/update (e.g. via service role or no RLS)
-- If RLS is enabled, add a policy that allows the backend's connection (e.g. service_role) to do INSERT/SELECT/UPDATE.
-- For local dev with a single connection string, you may disable RLS on this table:
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
