# Oprava RLS policies pre users_profile

## Problém
RLS policies v `users_profile` tabuľke umožňujú len adminom vidieť a upravovať profily, ale používatelia si nemôžu načítať svoj vlastný profil. To spôsobuje, že plán sa nezobrazuje v dashboarde.

## Riešenie
Pridajte túto policy, aby používatelia mohli vidieť a upravovať svoj vlastný profil:

```sql
-- Policy pre používateľov - môžu vidieť a upravovať svoj vlastný profil
CREATE POLICY "Users can view their own profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = id);
```

## Kompletný SQL pre opravu

Ak ešte nemáš `users_profile` tabuľku, spusti celý tento SQL:

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

-- Policy pre INSERT - používatelia môžu vytvoriť svoj vlastný profil
CREATE POLICY "Users can insert their own profile"
  ON users_profile FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## Ak už máš tabuľku, len pridaj chýbajúce policies:

```sql
-- Odstráň staré policies (ak existujú)
DROP POLICY IF EXISTS "Users can view their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users_profile;

-- Pridaj nové policies
CREATE POLICY "Users can view their own profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users_profile FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## Overenie

Po spustení SQL, skontroluj, či funguje:

```sql
-- Skontroluj, či vidíš svoj profil (prihlás sa ako používateľ)
SELECT id, plan, is_active, is_admin
FROM users_profile
WHERE id = auth.uid();
```




