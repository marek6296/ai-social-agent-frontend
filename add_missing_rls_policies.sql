-- Pridanie chýbajúcich RLS policies pre users_profile
-- Spusti tento SQL v Supabase SQL Editori

-- Policy pre používateľov - môžu upravovať svoj vlastný profil
CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = id);

-- Policy pre používateľov - môžu vytvoriť svoj vlastný profil
CREATE POLICY IF NOT EXISTS "Users can insert their own profile"
  ON users_profile FOR INSERT
  WITH CHECK (auth.uid() = id);

