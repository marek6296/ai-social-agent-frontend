-- ============================================
-- NASTAVENIE SYSTÉMU KREDITOV
-- ============================================
-- Tento SQL nastaví last_credit_reset pre existujúce účty
-- Spusti tento SQL v Supabase SQL Editori

-- 1. Nastav last_credit_reset na created_at pre účty, ktoré ho nemajú
UPDATE users_profile
SET last_credit_reset = created_at
WHERE last_credit_reset IS NULL;

-- 2. Skontroluj, či všetky účty majú správne nastavené hodnoty
SELECT 
  id,
  plan,
  credits_used_this_month,
  created_at,
  last_credit_reset,
  CASE 
    WHEN last_credit_reset IS NULL THEN '❌ Chýba last_credit_reset'
    WHEN credits_used_this_month IS NULL THEN '❌ Chýba credits_used_this_month'
    ELSE '✅ OK'
  END as status
FROM users_profile
ORDER BY created_at DESC;

-- ============================================
-- POZNÁMKY:
-- ============================================
-- - Kredity sa resetujú automaticky každých 30 dní od created_at (alebo od last_credit_reset)
-- - Pri každej konverzácii sa zvýši credits_used_this_month o 1
-- - Reset sa deje automaticky v /api/chat/route.ts pri kontrole limitov
-- - Admin/Super Admin účty majú unlimited kredity


