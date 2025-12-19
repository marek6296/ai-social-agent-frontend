# Aktualizácia databázovej migrácie pre Discord botov

## Pridanie nových stĺpcov do existujúcej tabuľky `discord_bots`

Ak už máš tabuľku `discord_bots`, spusti tento SQL príkaz na pridanie nových stĺpcov:

```sql
-- Pridanie stĺpcov pre typ bota a obmedzenia
ALTER TABLE discord_bots
ADD COLUMN IF NOT EXISTS bot_type TEXT DEFAULT 'custom' CHECK (bot_type IN ('custom', 'shared')),
ADD COLUMN IF NOT EXISTS monthly_message_limit INTEGER,
ADD COLUMN IF NOT EXISTS max_servers INTEGER,
ADD COLUMN IF NOT EXISTS messages_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_monthly_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Nastavenie defaultných hodnôt pre existujúce záznamy (všetky budú custom)
UPDATE discord_bots SET bot_type = 'custom' WHERE bot_type IS NULL;
```

## Overenie

```sql
-- Skontroluj nové stĺpce
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'discord_bots'
AND column_name IN ('bot_type', 'monthly_message_limit', 'max_servers', 'messages_this_month', 'last_monthly_reset');
```

## Poznámky

- Existujúce boty budú automaticky nastavené ako `custom` typ
- Pre shared boty sa automaticky nastavia limity pri vytváraní (1000 správ/mesiac, 1 server)
- `messages_this_month` sa resetuje každý mesiac (treba implementovať cron job alebo scheduled function)


