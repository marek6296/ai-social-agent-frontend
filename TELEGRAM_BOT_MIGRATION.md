# Databázová migrácia pre Telegram Bot systém

## Vytvorenie tabuľky `telegram_bots`

Spusti tento SQL príkaz v Supabase SQL Editor:

```sql
-- ============================================
-- 1. Hlavná tabuľka telegram_bots
-- ============================================
CREATE TABLE IF NOT EXISTS telegram_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Základné informácie
  bot_name TEXT NOT NULL,
  public_name TEXT, -- Názov zobrazený používateľom
  description TEXT,
  bot_avatar_url TEXT,
  tags TEXT[], -- Kategórie (support, sales, booking, atď.)
  
  -- Jazyk a lokalizácia
  bot_language TEXT DEFAULT 'SK' CHECK (bot_language IN ('SK', 'EN', 'NO', 'CZ')),
  fallback_languages TEXT[], -- Multi-select jazyky
  timezone TEXT DEFAULT 'Europe/Oslo',
  
  -- Prepojenie (Telegram)
  bot_token TEXT, -- Maskovaný v UI, encrypted
  webhook_url TEXT,
  webhook_enabled BOOLEAN DEFAULT false,
  long_polling_enabled BOOLEAN DEFAULT true, -- Default mode
  allowed_updates TEXT[], -- messages, callback_query, inline_query, edited_message, atď.
  rate_limit_per_minute INTEGER DEFAULT 30,
  cooldown_seconds INTEGER DEFAULT 1,
  
  -- Status
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'draft')),
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  last_connection_test TIMESTAMP WITH TIME ZONE,
  
  -- Prístup a bezpečnosť
  access_mode TEXT DEFAULT 'all' CHECK (access_mode IN ('all', 'whitelist')),
  allowed_users TEXT[], -- Telegram user IDs alebo @usernames
  allowed_chat_types TEXT[] DEFAULT ARRAY['private', 'group', 'channel']::TEXT[], -- private, group, channel
  admin_users TEXT[], -- Admin user IDs
  
  -- Anti-spam
  anti_spam_enabled BOOLEAN DEFAULT false,
  messages_per_user_limit INTEGER DEFAULT 10, -- Max messages per user per minute
  blocked_keywords TEXT[], -- Zakázané slová
  blocked_links BOOLEAN DEFAULT false,
  gdpr_privacy_text TEXT, -- Čo sa loguje, retention
  
  -- Správanie bota (Core)
  response_mode TEXT DEFAULT 'rules' CHECK (response_mode IN ('ai', 'rules')), -- Bot + AI alebo Len bot
  response_delay_ms INTEGER DEFAULT 500, -- Typing indicator simulácia
  respond_only_on_mention BOOLEAN DEFAULT false, -- V skupinách iba na mention
  fallback_message TEXT DEFAULT 'Prepáč, nerozumiem tejto správe.',
  
  -- Moduly (toggles)
  module_welcome BOOLEAN DEFAULT false,
  module_help BOOLEAN DEFAULT false,
  module_auto_replies BOOLEAN DEFAULT true,
  module_notifications BOOLEAN DEFAULT false,
  module_forms BOOLEAN DEFAULT false,
  module_booking BOOLEAN DEFAULT false,
  module_support_tickets BOOLEAN DEFAULT false,
  module_ai_answers BOOLEAN DEFAULT false,
  
  -- AI nastavenia (ak response_mode = 'ai')
  ai_knowledge_source_types TEXT[], -- faq, uploaded, custom, url
  ai_faq_entries JSONB DEFAULT '[]'::jsonb,
  ai_custom_knowledge_text TEXT,
  ai_uploaded_files JSONB DEFAULT '[]'::jsonb, -- Metadata o nahraných súboroch
  ai_urls TEXT[], -- URL stránky na crawl
  ai_tone TEXT DEFAULT 'friendly' CHECK (ai_tone IN ('friendly', 'professional', 'funny', 'custom')),
  ai_custom_tone TEXT, -- Ak tone = 'custom'
  ai_forbidden_topics TEXT[], -- Zakázané témy
  ai_human_handoff_enabled BOOLEAN DEFAULT false,
  ai_human_handoff_contact TEXT, -- Kontakt/odkaz pre eskaláciu
  ai_max_response_tokens INTEGER DEFAULT 300,
  
  -- Plánovanie (Schedule)
  working_hours_enabled BOOLEAN DEFAULT false,
  working_hours JSONB, -- { monday: { from: "09:00", to: "17:00" }, ... }
  after_hours_mode TEXT DEFAULT 'auto_reply' CHECK (after_hours_mode IN ('auto_reply', 'disable_ai', 'redirect_contact')),
  after_hours_message TEXT,
  after_hours_contact TEXT,
  
  -- Štatistiky
  total_messages INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  messages_today INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexy
CREATE INDEX IF NOT EXISTS idx_telegram_bots_user_id ON telegram_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_bots_status ON telegram_bots(status);
CREATE INDEX IF NOT EXISTS idx_telegram_bots_created_at ON telegram_bots(created_at);

-- RLS (Row Level Security)
ALTER TABLE telegram_bots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own telegram bots"
  ON telegram_bots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own telegram bots"
  ON telegram_bots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own telegram bots"
  ON telegram_bots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own telegram bots"
  ON telegram_bots FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. Telegram Bot Commands
-- ============================================
CREATE TABLE IF NOT EXISTS telegram_bot_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES telegram_bots(id) ON DELETE CASCADE,
  command_trigger TEXT NOT NULL, -- napr. /start, /help, /menu, custom command
  command_type TEXT DEFAULT 'text' CHECK (command_type IN ('text', 'action', 'menu')), -- text odpoveď, akcia, otvorenie menu
  response_text TEXT, -- Text odpovede (ak command_type = 'text')
  action_type TEXT, -- Ak command_type = 'action' (napr. 'open_menu', 'send_template')
  action_config JSONB, -- Konfigurácia akcie
  
  -- Podmienky
  admin_only BOOLEAN DEFAULT false,
  private_chat_only BOOLEAN DEFAULT false,
  
  -- Cooldown
  cooldown_seconds INTEGER DEFAULT 0,
  
  -- Poradie
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_bot_commands_bot_id ON telegram_bot_commands(bot_id);

-- RLS
ALTER TABLE telegram_bot_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage commands for their bots"
  ON telegram_bot_commands FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM telegram_bots
      WHERE telegram_bots.id = telegram_bot_commands.bot_id
      AND telegram_bots.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. Telegram Bot Message Templates
-- ============================================
CREATE TABLE IF NOT EXISTS telegram_bot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES telegram_bots(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL, -- welcome, help, unknown_command, after_hours, error
  template_text TEXT NOT NULL,
  template_variables JSONB DEFAULT '[]'::jsonb, -- Podporované premenné: {first_name}, {username}, {language}, {time}
  inline_keyboard JSONB, -- Inline keyboard buttons (ak má template tlačidlá)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(bot_id, template_name)
);

CREATE INDEX IF NOT EXISTS idx_telegram_bot_templates_bot_id ON telegram_bot_templates(bot_id);

-- RLS
ALTER TABLE telegram_bot_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage templates for their bots"
  ON telegram_bot_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM telegram_bots
      WHERE telegram_bots.id = telegram_bot_templates.bot_id
      AND telegram_bots.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. Telegram Bot Integrations (Webhooks out)
-- ============================================
CREATE TABLE IF NOT EXISTS telegram_bot_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES telegram_bots(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- webhook, crm, sheets, notion, discord, stripe
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- { url, secret, retry_policy, events: [...] }
  enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_bot_integrations_bot_id ON telegram_bot_integrations(bot_id);

-- RLS
ALTER TABLE telegram_bot_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage integrations for their bots"
  ON telegram_bot_integrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM telegram_bots
      WHERE telegram_bots.id = telegram_bot_integrations.bot_id
      AND telegram_bots.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Telegram Bot Logs
-- ============================================
CREATE TABLE IF NOT EXISTS telegram_bot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES telegram_bots(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- message, command, button_click, error, webhook, atď.
  user_id TEXT, -- Telegram user ID
  username TEXT, -- Telegram username (ak je dostupný)
  chat_id TEXT, -- Telegram chat ID
  chat_type TEXT, -- private, group, channel
  message_text TEXT,
  event_data JSONB, -- Ďalšie dáta eventu
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'warning')),
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_bot_logs_bot_id ON telegram_bot_logs(bot_id);
CREATE INDEX IF NOT EXISTS idx_telegram_bot_logs_created_at ON telegram_bot_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_telegram_bot_logs_event_type ON telegram_bot_logs(event_type);

-- RLS
ALTER TABLE telegram_bot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their bots"
  ON telegram_bot_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM telegram_bots
      WHERE telegram_bots.id = telegram_bot_logs.bot_id
      AND telegram_bots.user_id = auth.uid()
    )
  );

-- ============================================
-- 6. Trigger pre updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_telegram_bots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER telegram_bots_updated_at
  BEFORE UPDATE ON telegram_bots
  FOR EACH ROW
  EXECUTE FUNCTION update_telegram_bots_updated_at();

CREATE TRIGGER telegram_bot_commands_updated_at
  BEFORE UPDATE ON telegram_bot_commands
  FOR EACH ROW
  EXECUTE FUNCTION update_telegram_bots_updated_at();

CREATE TRIGGER telegram_bot_templates_updated_at
  BEFORE UPDATE ON telegram_bot_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_telegram_bots_updated_at();

CREATE TRIGGER telegram_bot_integrations_updated_at
  BEFORE UPDATE ON telegram_bot_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_telegram_bots_updated_at();
```

## Poznámky

- `bot_token` bude encrypted (rovnako ako v Discord botoch)
- `webhook_url` sa môže generovať automaticky alebo byť editovateľný
- `response_mode` podporuje dva režimy: `ai` (Bot + AI) a `rules` (Len bot), rovnako ako Discord boty
- `working_hours` je JSONB objekt s dňami v týždni a časmi
- `inline_keyboard` v templates podporuje Telegram inline keyboard format
- Všetky tabuľky majú RLS policies pre bezpečnosť
