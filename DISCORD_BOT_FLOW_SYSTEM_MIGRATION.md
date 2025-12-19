-- Discord Bot Flow System Migration
-- Tento SQL vytvorí novú štruktúru pre flow-based systém (Trigger → Conditions → Actions)

-- 1. Tabulka pre flows (každý flow = jedno pravidlo/scenár)
CREATE TABLE IF NOT EXISTS discord_bot_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES discord_bots(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('message_reply', 'welcome', 'scheduled', 'rule', 'event', 'moderation', 'interaction')),
  name TEXT NOT NULL, -- Názov flow (napr. "Welcome message", "FAQ odpoveď na cenu")
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Pre poradie spracovania (nižšie = vyššia priorita)
  
  -- Trigger (čo spustí flow)
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'new_message',
    'mention',
    'slash_command',
    'member_join',
    'member_leave',
    'role_added',
    'role_removed',
    'reaction_add',
    'button_click',
    'select_menu',
    'modal_submit',
    'scheduled',
    'keyword_match',
    'regex_match',
    'inactivity'
  )),
  trigger_config JSONB, -- Konfigurácia triggeru (napr. keyword, command name, schedule)
  
  -- Conditions (kedy to platí)
  conditions JSONB, -- {
  --   channels: [id1, id2],
  --   ignored_channels: [id3],
  --   roles: [id1, id2],
  --   require_roles: [id1], -- Musí mať rolu
  --   exclude_roles: [id2], -- Nemôže mať rolu
  --   admin_only: false,
  --   dm_only: false,
  --   server_only: false,
  --   time_window: {start: "08:00", end: "22:00", timezone: "Europe/Bratislava", days: [1,2,3,4,5]},
  --   cooldown_seconds: 30,
  --   cooldown_per: "user" | "channel" | "server",
  --   once_per_user: false,
  --   language: "sk",
  --   anti_spam: true
  -- }
  
  -- Actions (čo bot spraví)
  actions JSONB NOT NULL, -- [{type: "send_message", config: {...}}, ...]
  -- Typy akcií:
  -- - send_message: {text: "", reply: true, mention_user: false}
  -- - send_embed: {title, description, fields, image, color, ...}
  -- - send_dm: {text: "", embed: {...}}
  -- - ping_role: {role_id: ""}
  -- - assign_role: {role_id: "", remove: false}
  -- - create_thread: {name: ""}
  -- - pin_message: {}
  -- - delete_message: {}
  -- - send_buttons: {buttons: [{label, style, id}]}
  -- - send_select_menu: {options: [...]}
  -- - open_modal: {title, fields: [...]}
  -- - save_to_db: {table: "leads", fields: {...}}
  -- - notify_admin: {channel_id: "", message: ""}
  
  -- AI settings (ak je akcia "ai_response")
  ai_config JSONB, -- {
  --   use_ai: true,
  --   persona: "",
  --   knowledge_sources: ["faq", "custom"],
  --   max_tokens: 300,
  --   temperature: 0.7
  -- }
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexy
CREATE INDEX IF NOT EXISTS idx_discord_bot_flows_bot_id ON discord_bot_flows(bot_id);
CREATE INDEX IF NOT EXISTS idx_discord_bot_flows_module ON discord_bot_flows(bot_id, module);
CREATE INDEX IF NOT EXISTS idx_discord_bot_flows_enabled ON discord_bot_flows(bot_id, enabled, priority);

-- RLS policies
ALTER TABLE discord_bot_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bot flows"
  ON discord_bot_flows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_flows.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert flows for their bots"
  ON discord_bot_flows FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_flows.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own bot flows"
  ON discord_bot_flows FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_flows.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own bot flows"
  ON discord_bot_flows FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_flows.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_discord_bot_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discord_bot_flows_updated_at
  BEFORE UPDATE ON discord_bot_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_discord_bot_flows_updated_at();

-- 2. Tabulka pre globálne nastavenia (úroveň 1)
-- Toto môže byť rozšírenie existujúcej tabulky discord_bots
-- alebo nová sekcia v nej

-- Globálne nastavenia už existujú v discord_bots:
-- - bot_name, description, tone
-- - bot_token, bot_client_id
-- - command_prefix, bot_language, timezone
-- - message_cooldown_seconds (globálny cooldown)
-- - logs_channel_id
-- - allowed_channels, ignored_channels (globálne)
-- - admin_roles
-- - response_mode, ai_enabled

-- Nové globálne nastavenia, ktoré pridáme:
-- ALTER TABLE discord_bots ADD COLUMN IF NOT EXISTS global_anti_loop BOOLEAN DEFAULT true;
-- ALTER TABLE discord_bots ADD COLUMN IF NOT EXISTS global_anti_spam BOOLEAN DEFAULT true;
-- ALTER TABLE discord_bots ADD COLUMN IF NOT EXISTS global_rate_limit_per_minute INTEGER DEFAULT 10;
-- ALTER TABLE discord_bots ADD COLUMN IF NOT EXISTS default_reply_mode TEXT DEFAULT 'reply' CHECK (default_reply_mode IN ('reply', 'send'));
-- ALTER TABLE discord_bots ADD COLUMN IF NOT EXISTS default_mention_in_reply BOOLEAN DEFAULT false;

-- 3. Tabulka pre zdroje vedomostí (rozšírenie)
CREATE TABLE IF NOT EXISTS discord_bot_knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES discord_bots(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('faq', 'file', 'custom_text', 'web', 'rss')),
  name TEXT NOT NULL, -- Názov zdroja (napr. "FAQ", "Pravidlá servera")
  enabled BOOLEAN DEFAULT true,
  config JSONB, -- Konfigurácia podľa typu
  -- Pre FAQ: {entries: [{q, a}]}
  -- Pre file: {file_id, file_name, file_type}
  -- Pre custom_text: {text: ""}
  -- Pre web: {url: "", crawl_depth: 2}
  -- Pre rss: {url: "", update_interval: 3600}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discord_bot_knowledge_sources_bot_id ON discord_bot_knowledge_sources(bot_id);

-- RLS policies pre knowledge sources
ALTER TABLE discord_bot_knowledge_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bot knowledge sources"
  ON discord_bot_knowledge_sources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_knowledge_sources.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_discord_bot_knowledge_sources_updated_at
  BEFORE UPDATE ON discord_bot_knowledge_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_discord_bot_flows_updated_at();

-- 4. Migrácia existujúcich dát (ak existujú)
-- Túto časť môžeš spustiť neskôr, keď už máš flows systém

-- Príklad migrácie welcome_message do flow:
-- INSERT INTO discord_bot_flows (bot_id, module, name, enabled, trigger_type, trigger_config, actions)
-- SELECT 
--   id as bot_id,
--   'welcome' as module,
--   'Welcome message' as name,
--   COALESCE(welcome_enabled, true) as enabled,
--   'member_join' as trigger_type,
--   jsonb_build_object('channel_id', welcome_channel_id) as trigger_config,
--   jsonb_build_array(
--     jsonb_build_object(
--       'type', 'send_message',
--       'config', jsonb_build_object(
--         'text', COALESCE(welcome_message_text, 'Vitaj na serveri!'),
--         'embed', welcome_embed
--       )
--     )
--   ) as actions
-- FROM discord_bots
-- WHERE welcome_enabled = true;

COMMENT ON TABLE discord_bot_flows IS 'Flow-based rules pre Discord boty (Trigger → Conditions → Actions)';
COMMENT ON TABLE discord_bot_knowledge_sources IS 'Zdroje vedomostí pre AI (FAQ, súbory, web, atď.)';


