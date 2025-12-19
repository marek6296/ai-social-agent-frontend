-- ============================================
-- VYTVORENIE users_profile TABUĽKY S RLS POLICIES
-- ============================================
-- Spusti tento SQL v Supabase SQL Editori, ak ešte nemáš users_profile tabuľku

-- 1. Vytvorenie tabuľky pre user profily
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'agency')),
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  credits_used_this_month INTEGER DEFAULT 0,
  last_credit_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Vytvorenie indexov
CREATE INDEX IF NOT EXISTS idx_users_profile_plan ON users_profile(plan);
CREATE INDEX IF NOT EXISTS idx_users_profile_is_active ON users_profile(is_active);
CREATE INDEX IF NOT EXISTS idx_users_profile_is_admin ON users_profile(is_admin);

-- 3. RLS (Row Level Security)
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- 4. Policies pre používateľov (môžu vidieť a upravovať svoj vlastný profil)
CREATE POLICY "Users can view their own profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users_profile FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. Policies pre adminov (môžu vidieť a upravovať všetko)
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

-- 6. Nastavenie admin práva pre tvoj účet
-- ZMEŇ 'faeb1920-35fe-47be-a169-1393591cc3e4' na svoje user ID
INSERT INTO users_profile (id, is_admin, plan)
VALUES ('faeb1920-35fe-47be-a169-1393591cc3e4', true, 'agency')
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- ============================================
-- OVERENIE
-- ============================================
-- Skontroluj, či tabuľka existuje a má správne policies:
-- SELECT * FROM users_profile LIMIT 1;

-- Skontroluj, či vidíš svoj profil (prihlás sa ako používateľ):
-- SELECT id, plan, is_active, is_admin
-- FROM users_profile
-- WHERE id = auth.uid();




