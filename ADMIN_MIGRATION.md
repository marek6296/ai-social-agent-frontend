# Admin rozhranie - Databázová migrácia

## ⚠️ DÔLEŽITÉ: Pre Supabase použite "Možnosť B" (users_profile tabuľka)

Ak používate Supabase, **vždy použite "Možnosť B"** - vytvorenie `users_profile` tabuľky. 
Dotaz z "Možnosť A" (UPDATE users) nebude fungovať, pretože `auth.users` je systémová tabuľka.

## 1. Pridanie stĺpcov do auth.users alebo vytvorenie users tabuľky

Ak už máš `users` tabuľku (nie Supabase auth.users), použij prvý príkaz. Ak nie, vytvor novú tabuľku.

### Možnosť A: Pridanie stĺpcov do existujúcej users tabuľky

```sql
-- Pridanie stĺpcov pre admin funkcionalitu
ALTER TABLE users
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'agency')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credits_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_credit_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Nastavenie admin práva pre tvoj účet
-- POZNÁMKA: Tento dotaz funguje len ak máš users tabuľku s UUID stĺpcom.
-- Pre Supabase použij namiesto toho dotaz z "Možnosť B" nižšie!
-- UPDATE users
-- SET is_admin = true
-- WHERE id = 'faeb1920-35fe-47be-a169-1393591cc3e4';

-- Vytvorenie indexov pre rýchlejšie vyhľadávanie
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
```

### Možnosť B: Vytvorenie novej users_profile tabuľky (ak nemáš users tabuľku)

```sql
-- Vytvorenie tabuľky pre user profily
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

-- Nastavenie admin práva pre tvoj účet
INSERT INTO users_profile (id, is_admin, plan)
VALUES ('faeb1920-35fe-47be-a169-1393591cc3e4', true, 'agency')
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- Vytvorenie indexov
CREATE INDEX IF NOT EXISTS idx_users_profile_plan ON users_profile(plan);
CREATE INDEX IF NOT EXISTS idx_users_profile_is_active ON users_profile(is_active);
CREATE INDEX IF NOT EXISTS idx_users_profile_is_admin ON users_profile(is_admin);

-- RLS (Row Level Security)
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- Policy pre používateľov - môžu vidieť a upravovať svoj vlastný profil
CREATE POLICY "Users can view their own profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users_profile FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy pre adminov - môžu vidieť všetko
CREATE POLICY "Admin can view all profiles"
  ON users_profile FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy pre adminov - môžu upravovať všetko
CREATE POLICY "Admin can update all profiles"
  ON users_profile FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

## 2. Funkcia pre automatické resetovanie kreditov každý mesiac

```sql
-- Funkcia pre reset kreditov
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE users_profile
  SET 
    credits_used_this_month = 0,
    last_credit_reset = NOW()
  WHERE last_credit_reset < date_trunc('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- Vytvorenie cron jobu (ak máš pg_cron extension)
-- SELECT cron.schedule('reset-monthly-credits', '0 0 1 * *', 'SELECT reset_monthly_credits();');
```

## 3. Overenie

```sql
-- Skontroluj, či máš admin práva
SELECT id, email, plan, is_active, is_admin, credits_used_this_month
FROM users_profile
WHERE id = 'faeb1920-35fe-47be-a169-1393591cc3e4';

-- Zobraz všetkých userov
SELECT 
  u.id,
  u.email,
  up.plan,
  up.is_active,
  up.credits_used_this_month,
  up.last_credit_reset
FROM auth.users u
LEFT JOIN users_profile up ON u.id = up.id
ORDER BY u.created_at DESC;
```

## Poznámky

- **Plan hodnoty**: 'starter' (1000 konverzácií), 'pro' (10000 konverzácií), 'agency' (999999 konverzácií)
- **is_active**: true = účet aktívny, false = účet zablokovaný
- **is_admin**: true = má admin práva
- **credits_used_this_month**: počet konverzácií tento mesiac
- **last_credit_reset**: dátum posledného resetu kreditov

## 🚀 Rýchly dotaz: Nastavenie admin práv (ak už máš users_profile tabuľku)

Ak už máš `users_profile` tabuľku a len potrebuješ nastaviť admin práva, spusti tento dotaz:

```sql
INSERT INTO users_profile (id, is_admin, plan)
VALUES ('faeb1920-35fe-47be-a169-1393591cc3e4', true, 'agency')
ON CONFLICT (id) DO UPDATE SET is_admin = true;
```

