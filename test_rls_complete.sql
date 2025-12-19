-- ============================================
-- KOMPLETNÝ TEST RLS POLICIES
-- ============================================
-- Spusti tento SQL v Supabase SQL Editori
-- POZNÁMKA: Musíš byť prihlásený ako používateľ, ktorého profil chceš testovať

-- 1. Zobraz všetky policies pre users_profile
SELECT 
  policyname,
  cmd as command,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'HAS USING CLAUSE'
    ELSE 'NO USING CLAUSE'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'HAS WITH CHECK'
    ELSE 'NO WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'users_profile'
ORDER BY policyname;

-- 2. Skús načítať svoj vlastný profil (musíš byť prihlásený)
-- Toto by malo vrátiť tvoj profil, ak RLS policies fungujú správne
SELECT 
  id,
  plan,
  is_active,
  is_admin,
  'MY_PROFILE' as test_type
FROM users_profile
WHERE id = auth.uid();

-- 3. Skús načítať profil iného používateľa (nemal by fungovať, ak nie si admin)
-- Nahraď '3b6633a1-bfa3-4720-9aba-09471e71de48' s ID iného používateľa
SELECT 
  id,
  plan,
  is_active,
  is_admin,
  'OTHER_USER_PROFILE' as test_type
FROM users_profile
WHERE id = '3b6633a1-bfa3-4720-9aba-09471e71de48';

-- 4. Skús načítať všetky profily (malo by fungovať len pre admina)
SELECT 
  id,
  plan,
  is_active,
  is_admin,
  'ALL_PROFILES' as test_type
FROM users_profile
ORDER BY created_at DESC;

-- ============================================
-- OČAKÁVANÉ VÝSLEDKY:
-- ============================================
-- 1. Mala by sa zobraziť aspoň 3 policies:
--    - "Users can view their own profile" (SELECT)
--    - "Users can update their own profile" (UPDATE)
--    - "Users can insert their own profile" (INSERT)
--    - "Admin can view all profiles" (SELECT) - ak existuje
--    - "Admin can update all profiles" (UPDATE) - ak existuje
--
-- 2. Ak si bežný používateľ:
--    - Dotaz #2 by mal vrátiť tvoj profil
--    - Dotaz #3 by NEMAL vrátiť nič (alebo error)
--    - Dotaz #4 by NEMAL vrátiť nič (alebo error)
--
-- 3. Ak si admin:
--    - Všetky dotazy by mali vrátiť dáta




