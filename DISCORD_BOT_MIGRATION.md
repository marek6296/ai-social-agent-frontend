# Databázová migrácia pre Discord botov

## Vytvorenie tabuľky `discord_bots`

Spusti tento SQL príkaz v Supabase SQL Editor alebo v tvojej databáze:

```sql
-- Vytvorenie tabuľky pre Discord botov
CREATE TABLE IF NOT EXISTS discord_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_name TEXT NOT NULL,
  bot_avatar_url TEXT,
  bot_token TEXT, -- Discord bot token (šifrovaný)
  bot_client_id TEXT, -- Discord Application Client ID
  description TEXT,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Nastavenia AI chatbota
  tone TEXT DEFAULT 'friendly' CHECK (tone IN ('friendly', 'professional', 'casual', 'formal')),
  system_prompt TEXT,
  welcome_message TEXT,
  
  -- Typ bota: 'custom' = vlastný bot s vlastným tokenom, 'shared' = zdieľaný master bot
  bot_type TEXT DEFAULT 'custom' CHECK (bot_type IN ('custom', 'shared')),
  
  -- Obmedzenia pre shared boty
  monthly_message_limit INTEGER DEFAULT 1000, -- Limit správ mesačne pre shared boty
  max_servers INTEGER DEFAULT 1, -- Maximálny počet serverov pre shared boty
  
  -- Štatistiky
  total_messages INTEGER DEFAULT 0,
  total_servers INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,
  messages_this_month INTEGER DEFAULT 0, -- Počet správ tento mesiac (pre shared boty)
  last_monthly_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Reset limitu správ
);

-- Vytvorenie tabuľky pre pripojené Discord servery
CREATE TABLE IF NOT EXISTS discord_bot_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES discord_bots(id) ON DELETE CASCADE,
  server_id TEXT NOT NULL, -- Discord Server/Guild ID
  server_name TEXT,
  server_icon_url TEXT,
  owner_id TEXT, -- Discord User ID vlastníka servera
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(bot_id, server_id)
);

-- Vytvorenie indexov pre rýchlejšie vyhľadávanie
CREATE INDEX IF NOT EXISTS idx_discord_bots_user_id ON discord_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_bots_status ON discord_bots(status);
CREATE INDEX IF NOT EXISTS idx_discord_bot_servers_bot_id ON discord_bot_servers(bot_id);
CREATE INDEX IF NOT EXISTS idx_discord_bot_servers_server_id ON discord_bot_servers(server_id);

-- RLS (Row Level Security)
ALTER TABLE discord_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_bot_servers ENABLE ROW LEVEL SECURITY;

-- Policies pre discord_bots - používatelia môžu vidieť a upravovať iba svojich botov
CREATE POLICY "Users can view their own discord bots"
  ON discord_bots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own discord bots"
  ON discord_bots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discord bots"
  ON discord_bots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discord bots"
  ON discord_bots FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pre discord_bot_servers - používatelia môžu vidieť servery iba pre svojich botov
CREATE POLICY "Users can view servers for their bots"
  ON discord_bot_servers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_servers.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert servers for their bots"
  ON discord_bot_servers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_servers.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update servers for their bots"
  ON discord_bot_servers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_servers.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete servers for their bots"
  ON discord_bot_servers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_servers.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

-- Trigger pre automatické aktualizovanie updated_at
CREATE OR REPLACE FUNCTION update_discord_bots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discord_bots_updated_at
  BEFORE UPDATE ON discord_bots
  FOR EACH ROW
  EXECUTE FUNCTION update_discord_bots_updated_at();
```

## Overenie

Po spustení migrácie môžeš overiť, že tabuľky existujú:

```sql
-- Skontroluj tabuľky
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('discord_bots', 'discord_bot_servers');

-- Skontroluj stĺpce
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'discord_bots'
ORDER BY ordinal_position;
```

## Poznámky

### Bezpečnosť
- **`bot_token`** by mal byť v produkcii šifrovaný (použite Supabase Vault alebo podobné riešenie)
  - ⚠️ Toto je citlivá informácia - token dáva plný prístup k Discord botovi
  - Pre testovanie môže ostať v plain textu, ale v produkcii určite šifrujte

### Status bota
- **`status`** môže byť:
  - `'inactive'` - neaktívny (ešte nebol pripojený k Discord serveru alebo nemá token)
  - `'active'` - aktívny a pripojený (bot je online a funguje)
  - `'error'` - chyba pripojenia (napr. neplatný token alebo problém s pripojením)

### Typy botov
- **`bot_type`** môže byť:
  - `'custom'` - vlastný bot (používateľ musí vytvoriť Discord Application a zadať token)
  - `'shared'` - zdieľaný bot (používa master bot token, nevyžaduje vytvorenie Discord Application)

### OAuth a pripojenie
- **Discord OAuth flow** sa implementuje samostatne v aplikácii (pre automatické pridávanie botov na servery)
- Pre **custom boty**: Pri vytváraní Discord bota je potrebné vytvoriť Discord Application na Discord Developer Portáli
- Pre **shared boty**: Nie je potrebné vytvárať Discord Application - používa sa existujúci master bot

### Obmedzenia pre shared boty
- `monthly_message_limit` - maximálny počet správ za mesiac (default: 1000)
- `max_servers` - maximálny počet serverov, na ktoré môže byť bot pridaný (default: 1)
- `messages_this_month` - počet odoslaných správ tento mesiac (resetuje sa mesačne)

