# Rýchle vymazanie neplatného tokenu

## Možnosť 1: Vymazať token cez Supabase SQL (rýchlejšie)

1. Choď na Supabase Dashboard → SQL Editor
2. Spusti tento SQL príkaz:

```sql
UPDATE discord_bots 
SET bot_token = NULL 
WHERE id = '44f90ab5-cf83-409a-8162-2524175fde98';
```

3. Potom choď na stránku nastavení bota
4. Token pole bude prázdne - zadaj nový token
5. Ulož nastavenia
6. Aktivuj bota

## Možnosť 2: Zadať nový token priamo (bez vymazania)

1. Choď na stránku nastavení bota
2. V poli "Bot Token" vlož **NOVÝ token** (plain text)
3. Klikni "Uložiť nastavenia"
4. Nový token prepíše starý neplatný token
5. Aktivuj bota

---

**Odporúčanie:** Použi Možnosť 2 - je jednoduchšia a rýchlejšia. Stačí zadať nový token a uložiť.


