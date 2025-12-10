-- Fix RLS policies for leads table
-- This ensures users can view their own leads and admins can view all leads

-- First, check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'leads';

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;

-- Create policy: Users can view their own leads
CREATE POLICY "Users can view their own leads"
ON public.leads
FOR SELECT
USING (auth.uid()::text = owner_user_id);

-- Create policy: Users can insert leads (for API endpoints)
-- This allows the API to insert leads on behalf of users
CREATE POLICY "Users can insert their own leads"
ON public.leads
FOR INSERT
WITH CHECK (true); -- Allow inserts via service role key

-- Create policy: Admins can view all leads
-- Note: This requires users_profile table with is_admin column
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE users_profile.id = auth.uid()::text
    AND users_profile.is_admin = true
  )
);

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'leads';


