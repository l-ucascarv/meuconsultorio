-- Remove the temp_password_hash column from profiles table
-- This column should never exist in application-accessible tables
-- Password management is handled by Supabase auth.users
ALTER TABLE public.profiles DROP COLUMN IF EXISTS temp_password_hash;