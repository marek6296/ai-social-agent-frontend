-- ============================================
-- TEST RLS POLICIES PRE users_profile
-- ============================================
-- Tento SQL testuje, či RLS policies fungujú správne
-- Spusti tento SQL v Supabase SQL Editori

-- 1. Skontroluj, či vidíš všetky profily (len pre admina)
-- Toto by malo vrátiť všetky profily, ak si admin
SELECT id, plan, is_active, is_admin
FROM users_profile
ORDER BY created_at DESC;

-- 2. Skontroluj, či vidíš svoj vlastný profil
-- Toto by malo vrátiť tvoj profil, ak si prihlásený
SELECT id, plan, is_active, is_admin
FROM users_profile
WHERE id = auth.uid();

-- 3. Skontroluj, či existujú správne policies
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
WHERE tablename = 'users_profile'
ORDER BY policyname;

-- 4. Skontroluj, či je RLS zapnuté
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users_profile';

-- ============================================
-- OČAKÁVANÉ VÝSLEDKY:
-- ============================================
-- 1. Ak si admin: Mala by sa zobraziť všetky profily
-- 2. Ak si bežný používateľ: Mala by sa zobraziť len tvoja položka
-- 3. Mala by sa zobraziť aspoň 3 policies:
--    - "Users can view their own profile"
--    - "Users can update their own profile"
--    - "Users can insert their own profile"
--    - "Admin can view all profiles" (ak existuje)
--    - "Admin can update all profiles" (ak existuje)
-- 4. rowsecurity by malo byť 'true'


