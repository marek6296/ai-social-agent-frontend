-- ============================================
-- OVERENIE - Skontroluj, či vidíš svoj profil
-- ============================================
-- Spusti tento SQL v Supabase SQL Editori
-- POZNÁMKA: Tento dotaz funguje len ak si prihlásený v Supabase Dashboard

-- Zobraz svoj vlastný profil
SELECT id, plan, is_active, is_admin, credits_used_this_month
FROM users_profile
WHERE id = auth.uid();

-- Zobraz všetky profily (len pre admina)
-- SELECT id, plan, is_active, is_admin
-- FROM users_profile
-- ORDER BY created_at DESC;


