-- ============================================
-- OPRAVA RLS POLICIES PRE users_profile
-- ============================================
-- Tento SQL opraví problém, kde používatelia nemôžu vidieť svoj vlastný plán
-- Spusti tento SQL v Supabase SQL Editori

-- 1. Odstráň staré policies (ak existujú)
DROP POLICY IF EXISTS "Users can view their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users_profile;
DROP POLICY IF EXISTS "Admin can view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Admin can update all profiles" ON users_profile;

-- 2. Pridaj policies pre používateľov (môžu vidieť a upravovať svoj vlastný profil)
CREATE POLICY "Users can view their own profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users_profile FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Pridaj policies pre adminov (môžu vidieť a upravovať všetko)
CREATE POLICY "Admin can view all profiles"
  ON users_profile FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admin can update all profiles"
  ON users_profile FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- OVERENIE
-- ============================================
-- Po spustení, skontroluj, či vidíš svoj profil:
-- SELECT id, plan, is_active, is_admin
-- FROM users_profile
-- WHERE id = auth.uid();

