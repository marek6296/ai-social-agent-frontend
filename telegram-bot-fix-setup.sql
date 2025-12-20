-- Rýchle nastavenie Telegram bota pre správne fungovanie
-- Spusti tento SQL v Supabase SQL Editor pre tvojho bota

-- Najprv zisti ID svojho bota:
-- SELECT id, bot_name FROM telegram_bots WHERE user_id = auth.uid();

-- Potom spusti tento UPDATE (nahraď 'TU_POUZI_TVOJE_BOT_ID' skutočným ID):
UPDATE telegram_bots 
SET 
  -- Aktivuj bota
  status = 'active',
  long_polling_enabled = true,
  connection_status = 'connected',
  
  -- Nastavenia pre AI odpovede
  response_mode = 'ai',  -- alebo 'rules' ak chceš len príkazy
  module_auto_replies = true,  -- DÔLEŽITÉ: musí byť true aby bot reagoval
  
  -- Nastavenia pre reagovanie na správy
  respond_only_on_mention = false,  -- false = reaguje na všetky správy, true = len keď je spomenutý
  access_mode = 'all',  -- 'all' = všetci používatelia, 'whitelist' = len povolení
  
  -- Povolené typy chatov (private = DM, group = skupiny, channel = kanály)
  allowed_chat_types = ARRAY['private', 'group']::text[],
  
  -- Zruš cooldown a delay (pre testovanie)
  cooldown_seconds = 1,
  response_delay_ms = 0,
  
  -- AI nastavenia (ak používaš AI)
  ai_tone = 'friendly',
  ai_max_response_tokens = 300,
  
  -- Zruš anti-spam (pre testovanie)
  anti_spam_enabled = false,
  
  updated_at = NOW()
WHERE id = 'TU_POUZI_TVOJE_BOT_ID';  -- <-- NAHRAD TOTO!

-- Pre kontrolu, či to funguje:
-- SELECT 
--   bot_name, 
--   status, 
--   long_polling_enabled, 
--   response_mode, 
--   module_auto_replies, 
--   respond_only_on_mention,
--   allowed_chat_types
-- FROM telegram_bots 
-- WHERE id = 'TU_POUZI_TVOJE_BOT_ID';

