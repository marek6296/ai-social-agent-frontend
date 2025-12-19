-- SQL príkaz na vymazanie neplatného tokenu z databázy
-- Spusti tento príkaz v Supabase SQL Editori, ak chceš vymazať starý token

-- Nahraď UUID_ID_BOTA skutočným ID bota (napr. '44f90ab5-cf83-409a-8162-2524175fde98')
UPDATE discord_bots 
SET bot_token = NULL 
WHERE id = '44f90ab5-cf83-409a-8162-2524175fde98';

-- Alebo ak chceš vymazať token pre všetkých botov (pozor!):
-- UPDATE discord_bots SET bot_token = NULL;

-- Overenie:
SELECT id, bot_name, bot_token IS NULL as token_is_null 
FROM discord_bots 
WHERE id = '44f90ab5-cf83-409a-8162-2524175fde98';


