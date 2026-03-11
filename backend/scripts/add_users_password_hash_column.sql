-- Add password_hash to users and allow backend-created users (no auth.users dependency).
-- Run once in Supabase SQL Editor (or any billing DB created from Supabase schema).

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Drop FK so backend can insert users with its own UUIDs (else: "violates foreign key constraint users_id_fkey")
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
