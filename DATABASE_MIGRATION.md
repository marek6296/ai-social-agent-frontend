# Databázová migrácia pre pokročilé widget nastavenia

## Pridanie stĺpcov do tabuľky `bot_settings`

Spusti tento SQL príkaz v Supabase SQL Editor alebo v tvojej databáze:

```sql
-- Pridanie stĺpcov pre pokročilé widget nastavenia
ALTER TABLE bot_settings
ADD COLUMN IF NOT EXISTS widget_primary_color TEXT,
ADD COLUMN IF NOT EXISTS widget_background_color TEXT,
ADD COLUMN IF NOT EXISTS widget_welcome_message TEXT,
ADD COLUMN IF NOT EXISTS widget_logo_url TEXT;

-- Voliteľne: Pridaj komentáre pre dokumentáciu
COMMENT ON COLUMN bot_settings.widget_primary_color IS 'Hex farba pre primárne tlačidlá a accent prvky widgetu (napr. #10b981)';
COMMENT ON COLUMN bot_settings.widget_background_color IS 'Hex farba pozadia chat widgetu (napr. #0f172a)';
COMMENT ON COLUMN bot_settings.widget_welcome_message IS 'Vlastná úvodná správa, ktorá sa zobrazí pri otvorení chatu';
COMMENT ON COLUMN bot_settings.widget_logo_url IS 'URL obrázka loga/avata bota, ktorý sa zobrazí namiesto default AI ikony';
```

## Overenie

Po spustení migrácie môžeš overiť, že stĺpce existujú:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bot_settings' 
AND column_name IN ('widget_primary_color', 'widget_background_color', 'widget_welcome_message', 'widget_logo_url');
```

## Poznámka

- Všetky stĺpce sú `TEXT` typu a môžu byť `NULL`
- Default hodnoty sa nastavujú v aplikácii, nie v databáze
- Po pridaní týchto stĺpcov by sa pokročilé nastavenia mali ukladať bez problémov


