# Pridanie response_mode a ai_enabled do discord_bots

Spusti tento SQL príkaz v Supabase SQL Editor:

```sql
ALTER TABLE discord_bots
ADD COLUMN IF NOT EXISTS response_mode TEXT DEFAULT 'ai' CHECK (response_mode IN ('ai', 'rules', 'hybrid')),
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN discord_bots.response_mode IS 'Režim odpovedania: ai = AI odpovede, rules = Pravidlá/Šablóny, hybrid = AI + fallback';
COMMENT ON COLUMN discord_bots.ai_enabled IS 'Či je AI generovanie odpovedí zapnuté (pre ai a hybrid režimy)';
```

## Overenie

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'discord_bots' 
AND column_name IN ('response_mode', 'ai_enabled');
```


