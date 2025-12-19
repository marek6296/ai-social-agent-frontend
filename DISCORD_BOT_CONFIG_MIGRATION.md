# Pridanie konfiguračných možností pre Discord botov

## Pridanie stĺpcov do tabuľky `discord_bots`

Spusti tento SQL príkaz v Supabase SQL Editor:

```sql
-- Pridanie konfiguračných možností pre správanie bota
ALTER TABLE discord_bots
ADD COLUMN IF NOT EXISTS respond_to_all_messages BOOLEAN DEFAULT false, -- Reagovať na všetky správy (nie len @mention)
ADD COLUMN IF NOT EXISTS respond_to_mentions BOOLEAN DEFAULT true, -- Reagovať na @mention bota
ADD COLUMN IF NOT EXISTS respond_in_threads BOOLEAN DEFAULT true, -- Reagovať v threadoch
ADD COLUMN IF NOT EXISTS allowed_channels TEXT[], -- Zoznam channel IDs, kde má bot reagovať (NULL = všetky)
ADD COLUMN IF NOT EXISTS ignored_channels TEXT[], -- Zoznam channel IDs, ktoré má bot ignorovať
ADD COLUMN IF NOT EXISTS command_prefix TEXT DEFAULT '!', -- Prefix pre príkazy (napr. !help)
ADD COLUMN IF NOT EXISTS enable_commands BOOLEAN DEFAULT true, -- Zapnúť/vypnúť príkazy
ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN DEFAULT true, -- Automatické odpovede na správy
ADD COLUMN IF NOT EXISTS mention_in_reply BOOLEAN DEFAULT false; -- @mention používateľa v odpovedi

-- Komentáre pre dokumentáciu
COMMENT ON COLUMN discord_bots.respond_to_all_messages IS 'Ak true, bot reaguje na všetky správy (nie len @mention)';
COMMENT ON COLUMN discord_bots.respond_to_mentions IS 'Ak true, bot reaguje keď je @mentionovaný';
COMMENT ON COLUMN discord_bots.allowed_channels IS 'Zoznam channel IDs, kde má bot reagovať (NULL = všetky)';
COMMENT ON COLUMN discord_bots.ignored_channels IS 'Zoznam channel IDs, ktoré má bot ignorovať';
```


