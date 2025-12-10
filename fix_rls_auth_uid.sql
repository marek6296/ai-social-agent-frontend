-- ============================================
-- OPRAVA RLS POLICIES - auth.uid() problém
-- ============================================
-- Tento SQL opraví problém, kde používatelia nemôžu vidieť svoj vlastný profil
-- Spusti tento SQL v Supabase SQL Editori

-- 1. Skontroluj, či auth.uid() funguje
SELECT 
  auth.uid() as current_user_id,
  'auth.uid() test' as test_type;

-- 2. Skontroluj, či existujú profily
SELECT 
  id,
  plan,
  is_active,
  is_admin,
  'ALL_PROFILES_NO_RLS' as test_type
FROM users_profile
ORDER BY created_at DESC;

-- 3. Odstráň staré policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users_profile;
DROP POLICY IF EXISTS "Admin can view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Admin can update all profiles" ON users_profile;

-- 4. Vytvor nové policies s explicitným kontrolovaním NULL
-- Policy pre používateľov - môžu vidieť svoj vlastný profil
CREATE POLICY "Users can view their own profile"
  ON users_profile FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = id
  );

-- Policy pre používateľov - môžu upravovať svoj vlastný profil
CREATE POLICY "Users can update their own profile"
  ON users_profile FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = id
  );

-- Policy pre používateľov - môžu vytvoriť svoj vlastný profil
CREATE POLICY "Users can insert their own profile"
  ON users_profile FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = id
  );

-- Policy pre adminov - môžu vidieť všetky profily
CREATE POLICY "Admin can view all profiles"
  ON users_profile FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.id = auth.uid() 
      AND up.is_admin = true
      AND auth.uid() IS NOT NULL
    )
  );

-- Policy pre adminov - môžu upravovať všetky profily
CREATE POLICY "Admin can update all profiles"
  ON users_profile FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.id = auth.uid() 
      AND up.is_admin = true
      AND auth.uid() IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.id = auth.uid() 
      AND up.is_admin = true
      AND auth.uid() IS NOT NULL
    )
  );

-- ============================================
-- OVERENIE
-- ============================================
-- Po spustení, skús znova:
-- SELECT id, plan, is_active, is_admin
-- FROM users_profile
-- WHERE id = auth.uid();
--
-- POZNÁMKA: V SQL Editori môže auth.uid() vracať NULL.
-- V aplikácii by to malo fungovať správne, pretože používateľ je prihlásený.

