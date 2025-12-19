# Kompletná databázová migrácia pre Discord bot systém

## Pridanie všetkých potrebných stĺpcov do tabuľky `discord_bots`

Spusti tento SQL príkaz v Supabase SQL Editor:

```sql
-- ============================================
-- 1. ZÁKLADNÉ NASTAVENIA BOTA
-- ============================================
ALTER TABLE discord_bots
-- Prefix pre príkazy (slash-only = NULL)
ADD COLUMN IF NOT EXISTS command_prefix TEXT DEFAULT NULL,
-- Jazyk bota (SK/CZ/EN/NO atď.)
ADD COLUMN IF NOT EXISTS bot_language TEXT DEFAULT 'SK',
-- Časové pásmo (napr. Europe/Bratislava)
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Bratislava',
-- Admin roly (array Discord role IDs, kto môže meniť nastavenia)
ADD COLUMN IF NOT EXISTS admin_roles TEXT[],
-- Logs channel ID (kde logovať akcie bota)
ADD COLUMN IF NOT EXISTS logs_channel_id TEXT,
-- Rate limit / cooldown (počet sekúnd medzi odpoveďami)
ADD COLUMN IF NOT EXISTS message_cooldown_seconds INTEGER DEFAULT 5,
-- Maximum dĺžka AI odpovede v tokenoch
ADD COLUMN IF NOT EXISTS max_response_tokens INTEGER DEFAULT 300;

-- ============================================
-- 2. AI CHAT / KNOWLEDGE BOT NASTAVENIA
-- ============================================
ALTER TABLE discord_bots
-- Knowledge source type (none/faq/uploaded/custom)
ADD COLUMN IF NOT EXISTS knowledge_source_type TEXT DEFAULT 'none' CHECK (knowledge_source_type IN ('none', 'faq', 'uploaded', 'custom')),
-- Uploaded knowledge files (JSON array s metadata)
ADD COLUMN IF NOT EXISTS knowledge_files JSONB DEFAULT '[]'::jsonb,
-- FAQ entries (JSON array s question/answer pairs)
ADD COLUMN IF NOT EXISTS faq_entries JSONB DEFAULT '[]'::jsonb,
-- Custom knowledge text (textarea)
ADD COLUMN IF NOT EXISTS custom_knowledge_text TEXT,
-- AI persona description
ADD COLUMN IF NOT EXISTS ai_persona TEXT,
-- Do list (čo bot MÁ robiť)
ADD COLUMN IF NOT EXISTS ai_do_list TEXT,
-- Don't list (čo bot NEMÁ robiť)
ADD COLUMN IF NOT EXISTS ai_dont_list TEXT,
-- Answer style (short/medium/long, bullet_points/paragraph)
ADD COLUMN IF NOT EXISTS ai_answer_style TEXT DEFAULT 'medium' CHECK (ai_answer_style IN ('short', 'medium', 'long', 'bullet_points', 'paragraph')),
-- Call-to-action text (napr. "Pozri si náš event: {link}")
ADD COLUMN IF NOT EXISTS ai_cta_text TEXT,
-- Blocklist slov (array slov, ktoré bot ignoruje)
ADD COLUMN IF NOT EXISTS ai_blocklist_words TEXT[],
-- Human handoff enabled (vytvoriť ticket keď bot nevie)
ADD COLUMN IF NOT EXISTS ai_human_handoff_enabled BOOLEAN DEFAULT false,
-- Human handoff channel ID
ADD COLUMN IF NOT EXISTS ai_human_handoff_channel_id TEXT;

-- ============================================
-- 3. MODERÁCIA A BEZPEČNOSŤ
-- ============================================
ALTER TABLE discord_bots
-- Automod enabled
ADD COLUMN IF NOT EXISTS automod_enabled BOOLEAN DEFAULT false,
-- Anti-spam (flood protection)
ADD COLUMN IF NOT EXISTS automod_anti_spam BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automod_anti_spam_threshold INTEGER DEFAULT 5, -- messages per X seconds
ADD COLUMN IF NOT EXISTS automod_anti_spam_period_seconds INTEGER DEFAULT 10,
-- Anti-invite links
ADD COLUMN IF NOT EXISTS automod_anti_invite BOOLEAN DEFAULT false,
-- Anti-scam keywords
ADD COLUMN IF NOT EXISTS automod_anti_scam BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automod_scam_keywords TEXT[], -- custom keywords
-- Anti-NSFW
ADD COLUMN IF NOT EXISTS automod_anti_nsfw BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automod_anti_nsfw_images BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automod_anti_nsfw_links BOOLEAN DEFAULT false,
-- Anti-mention spam
ADD COLUMN IF NOT EXISTS automod_anti_mention_spam BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automod_mention_limit INTEGER DEFAULT 5, -- max @everyone/@here per message
-- Caps lock filter
ADD COLUMN IF NOT EXISTS automod_caps_filter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automod_caps_threshold INTEGER DEFAULT 70, -- % caps in message
-- Duplicate message filter
ADD COLUMN IF NOT EXISTS automod_duplicate_filter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automod_duplicate_threshold INTEGER DEFAULT 3, -- same message X times

-- Tresty (default actions)
ADD COLUMN IF NOT EXISTS automod_action_warn BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS automod_action_timeout BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS automod_action_delete BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS automod_action_kick BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automod_action_ban BOOLEAN DEFAULT false,
-- Warn limit → timeout/kick/ban
ADD COLUMN IF NOT EXISTS automod_warn_limit_timeout INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS automod_warn_limit_kick INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS automod_warn_limit_ban INTEGER DEFAULT 7,
-- Whitelist roly a kanály (ignored by automod)
ADD COLUMN IF NOT EXISTS automod_whitelist_roles TEXT[],
ADD COLUMN IF NOT EXISTS automod_whitelist_channels TEXT[],
-- Appeal link
ADD COLUMN IF NOT EXISTS automod_appeal_link TEXT;

-- ============================================
-- 4. WELCOME / GOODBYE / ONBOARDING
-- ============================================
ALTER TABLE discord_bots
-- Welcome module enabled
ADD COLUMN IF NOT EXISTS welcome_enabled BOOLEAN DEFAULT false,
-- Welcome message (text)
ADD COLUMN IF NOT EXISTS welcome_message_text TEXT,
-- Welcome embed (JSON structure)
ADD COLUMN IF NOT EXISTS welcome_embed JSONB,
-- Welcome channel ID
ADD COLUMN IF NOT EXISTS welcome_channel_id TEXT,
-- Auto-assign roles on join
ADD COLUMN IF NOT EXISTS welcome_auto_roles TEXT[], -- array of role IDs
-- Welcome DM enabled
ADD COLUMN IF NOT EXISTS welcome_dm_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS welcome_dm_message TEXT,
-- Rules acceptance (verification)
ADD COLUMN IF NOT EXISTS welcome_rules_acceptance_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS welcome_rules_channel_id TEXT,
ADD COLUMN IF NOT EXISTS welcome_rules_message_id TEXT, -- ID of message with rules
ADD COLUMN IF NOT EXISTS welcome_rules_button_id TEXT, -- ID of button/emoji for accepting rules
ADD COLUMN IF NOT EXISTS welcome_rules_role_id TEXT, -- Role to assign after accepting rules

-- Goodbye module
ADD COLUMN IF NOT EXISTS goodbye_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS goodbye_message_text TEXT,
ADD COLUMN IF NOT EXISTS goodbye_embed JSONB,
ADD COLUMN IF NOT EXISTS goodbye_channel_id TEXT;

-- ============================================
-- 5. ROLE MANAGEMENT
-- ============================================
ALTER TABLE discord_bots
-- Role management enabled
ADD COLUMN IF NOT EXISTS role_management_enabled BOOLEAN DEFAULT false;

-- Vytvorenie samostatnej tabuľky pre role panels
CREATE TABLE IF NOT EXISTS discord_bot_role_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES discord_bots(id) ON DELETE CASCADE,
  panel_name TEXT NOT NULL,
  panel_description TEXT,
  channel_id TEXT NOT NULL,
  message_id TEXT, -- ID of embed message with role panel
  role_groups JSONB DEFAULT '[]'::jsonb, -- Array of role groups with roles and buttons/selects
  single_select BOOLEAN DEFAULT false, -- Single role selection per group
  prerequisites TEXT[], -- Role IDs that user must have before selecting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discord_bot_role_panels_bot_id ON discord_bot_role_panels(bot_id);
CREATE INDEX IF NOT EXISTS idx_discord_bot_role_panels_channel_id ON discord_bot_role_panels(channel_id);

-- ============================================
-- 6. XP / LEVELS / ECONOMY
-- ============================================
ALTER TABLE discord_bots
-- XP/Levels module enabled
ADD COLUMN IF NOT EXISTS xp_levels_enabled BOOLEAN DEFAULT false,
-- XP za správu (min/max)
ADD COLUMN IF NOT EXISTS xp_per_message_min INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS xp_per_message_max INTEGER DEFAULT 25,
-- XP cooldown (sekundy)
ADD COLUMN IF NOT EXISTS xp_cooldown_seconds INTEGER DEFAULT 60,
-- XP za voice time (per minute)
ADD COLUMN IF NOT EXISTS xp_per_voice_minute INTEGER DEFAULT 5,
-- Level rewards (JSON: {level: role_id})
ADD COLUMN IF NOT EXISTS xp_level_rewards JSONB DEFAULT '{}'::jsonb,
-- Leaderboard channel ID
ADD COLUMN IF NOT EXISTS xp_leaderboard_channel_id TEXT,
-- Reset sezóny (monthly/never)
ADD COLUMN IF NOT EXISTS xp_reset_schedule TEXT DEFAULT 'never' CHECK (xp_reset_schedule IN ('never', 'monthly'));

-- Economy (voliteľné)
ADD COLUMN IF NOT EXISTS economy_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS economy_currency_name TEXT DEFAULT 'coins',
ADD COLUMN IF NOT EXISTS economy_daily_reward INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS economy_shop_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS economy_shop_items JSONB DEFAULT '[]'::jsonb; -- Array of items with price, role, etc.

-- ============================================
-- 7. EVENTS MODUL
-- ============================================
ALTER TABLE discord_bots
-- Events module enabled
ADD COLUMN IF NOT EXISTS events_enabled BOOLEAN DEFAULT false;

-- Vytvorenie tabuľky pre events
CREATE TABLE IF NOT EXISTS discord_bot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES discord_bots(id) ON DELETE CASCADE,
  server_id TEXT NOT NULL, -- Discord Guild ID
  event_name TEXT NOT NULL,
  event_description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'Europe/Bratislava',
  location_type TEXT DEFAULT 'voice' CHECK (location_type IN ('voice', 'text', 'external')),
  location_value TEXT, -- Channel ID or external link
  max_participants INTEGER,
  role_ping TEXT[], -- Role IDs to ping
  rsvp_options JSONB DEFAULT '{"going": true, "maybe": true, "not_going": true, "waitlist": true}'::jsonb,
  rsvp_questions JSONB DEFAULT '[]'::jsonb, -- Array of questions with type and options
  rsvp_allowed_roles TEXT[], -- NULL = everyone
  rsvp_lock_hours_before INTEGER DEFAULT 0, -- Lock RSVP X hours before event
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_24h BOOLEAN DEFAULT true,
  reminder_1h BOOLEAN DEFAULT true,
  reminder_10min BOOLEAN DEFAULT true,
  auto_voice_channel BOOLEAN DEFAULT false,
  auto_role_enabled BOOLEAN DEFAULT false,
  auto_role_id TEXT,
  announcement_channel_id TEXT,
  announcement_message_id TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RSVP responses
CREATE TABLE IF NOT EXISTS discord_bot_event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES discord_bot_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Discord User ID
  username TEXT,
  rsvp_status TEXT NOT NULL CHECK (rsvp_status IN ('going', 'maybe', 'not_going', 'waitlist')),
  rsvp_answers JSONB DEFAULT '{}'::jsonb, -- Answers to custom questions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_discord_bot_events_bot_id ON discord_bot_events(bot_id);
CREATE INDEX IF NOT EXISTS idx_discord_bot_events_server_id ON discord_bot_events(server_id);
CREATE INDEX IF NOT EXISTS idx_discord_bot_events_status ON discord_bot_events(status);
CREATE INDEX IF NOT EXISTS idx_discord_bot_event_rsvps_event_id ON discord_bot_event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_discord_bot_event_rsvps_user_id ON discord_bot_event_rsvps(user_id);

-- ============================================
-- 8. ANNOUNCEMENTS & AUTO-POSTING
-- ============================================
ALTER TABLE discord_bots
-- Announcements module enabled
ADD COLUMN IF NOT EXISTS announcements_enabled BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS discord_bot_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES discord_bots(id) ON DELETE CASCADE,
  server_id TEXT NOT NULL,
  announcement_name TEXT NOT NULL,
  announcement_content TEXT, -- Text content
  announcement_embed JSONB, -- Embed structure
  channels TEXT[] NOT NULL, -- Array of channel IDs to post to
  role_ping TEXT[], -- Role IDs to ping (with rate limit)
  schedule_type TEXT DEFAULT 'once' CHECK (schedule_type IN ('once', 'repeating')),
  schedule_start TIMESTAMP WITH TIME ZONE,
  schedule_repeat TEXT, -- RRULE format for repeating
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discord_bot_announcements_bot_id ON discord_bot_announcements(bot_id);
CREATE INDEX IF NOT EXISTS idx_discord_bot_announcements_status ON discord_bot_announcements(status);

-- ============================================
-- 9. TICKETS / SUPPORT
-- ============================================
ALTER TABLE discord_bots
-- Tickets module enabled
ADD COLUMN IF NOT EXISTS tickets_enabled BOOLEAN DEFAULT false,
-- Ticket panel channel ID
ADD COLUMN IF NOT EXISTS tickets_panel_channel_id TEXT,
-- Ticket panel message ID
ADD COLUMN IF NOT EXISTS tickets_panel_message_id TEXT,
-- Ticket categories (JSON: {category: {button_id, support_roles, description}})
ADD COLUMN IF NOT EXISTS tickets_categories JSONB DEFAULT '[]'::jsonb,
-- Support role IDs
ADD COLUMN IF NOT EXISTS tickets_support_roles TEXT[],
-- Ticket naming format
ADD COLUMN IF NOT EXISTS tickets_naming_format TEXT DEFAULT 'ticket-{username}',
-- Auto-close inactive tickets after X hours
ADD COLUMN IF NOT EXISTS tickets_auto_close_hours INTEGER DEFAULT 48,
-- Transcript enabled
ADD COLUMN IF NOT EXISTS tickets_transcript_enabled BOOLEAN DEFAULT true,
-- SLA reminders enabled
ADD COLUMN IF NOT EXISTS tickets_sla_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tickets_sla_hours INTEGER DEFAULT 24;

-- Tickets table
CREATE TABLE IF NOT EXISTS discord_bot_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES discord_bots(id) ON DELETE CASCADE,
  server_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL, -- Discord User ID
  username TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(bot_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_discord_bot_tickets_bot_id ON discord_bot_tickets(bot_id);
CREATE INDEX IF NOT EXISTS idx_discord_bot_tickets_server_id ON discord_bot_tickets(server_id);
CREATE INDEX IF NOT EXISTS idx_discord_bot_tickets_user_id ON discord_bot_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_bot_tickets_status ON discord_bot_tickets(status);

-- ============================================
-- 10. UTILITY MODULES
-- ============================================
ALTER TABLE discord_bots
-- Polls enabled
ADD COLUMN IF NOT EXISTS polls_enabled BOOLEAN DEFAULT false,
-- Forms enabled
ADD COLUMN IF NOT EXISTS forms_enabled BOOLEAN DEFAULT false,
-- Giveaways enabled
ADD COLUMN IF NOT EXISTS giveaways_enabled BOOLEAN DEFAULT false,
-- Reminders enabled
ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT false,
-- Auto-delete enabled
ADD COLUMN IF NOT EXISTS auto_delete_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_delete_channels TEXT[], -- Channel IDs
ADD COLUMN IF NOT EXISTS auto_delete_after_minutes INTEGER DEFAULT 60,
-- Starboard enabled
ADD COLUMN IF NOT EXISTS starboard_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS starboard_channel_id TEXT,
ADD COLUMN IF NOT EXISTS starboard_threshold INTEGER DEFAULT 5, -- stars needed
-- Bump reminder enabled
ADD COLUMN IF NOT EXISTS bump_reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bump_reminder_channel_id TEXT;

-- ============================================
-- RLS POLICIES PRE NOVÉ TABUĽKY
-- ============================================

-- Role panels
ALTER TABLE discord_bot_role_panels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage role panels for their bots"
  ON discord_bot_role_panels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_role_panels.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

-- Events
ALTER TABLE discord_bot_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage events for their bots"
  ON discord_bot_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_events.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

-- RSVPs (public read, but only bot owner can modify)
ALTER TABLE discord_bot_event_rsvps ENABLE ROW LEVEL SECURITY;
-- Note: RSVPs should be readable by bot, but writable by bot service only
-- For now, allow bot owner to read/write
CREATE POLICY "Users can view RSVPs for their bot events"
  ON discord_bot_event_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM discord_bot_events
      JOIN discord_bots ON discord_bots.id = discord_bot_events.bot_id
      WHERE discord_bot_events.id = discord_bot_event_rsvps.event_id
      AND discord_bots.user_id = auth.uid()
    )
  );

-- Announcements
ALTER TABLE discord_bot_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage announcements for their bots"
  ON discord_bot_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_announcements.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

-- Tickets
ALTER TABLE discord_bot_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view tickets for their bots"
  ON discord_bot_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM discord_bots
      WHERE discord_bots.id = discord_bot_tickets.bot_id
      AND discord_bots.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS PRE UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_discord_bot_role_panels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discord_bot_role_panels_updated_at
  BEFORE UPDATE ON discord_bot_role_panels
  FOR EACH ROW
  EXECUTE FUNCTION update_discord_bot_role_panels_updated_at();

CREATE OR REPLACE FUNCTION update_discord_bot_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discord_bot_events_updated_at
  BEFORE UPDATE ON discord_bot_events
  FOR EACH ROW
  EXECUTE FUNCTION update_discord_bot_events_updated_at();

CREATE OR REPLACE FUNCTION update_discord_bot_event_rsvps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discord_bot_event_rsvps_updated_at
  BEFORE UPDATE ON discord_bot_event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_discord_bot_event_rsvps_updated_at();

CREATE OR REPLACE FUNCTION update_discord_bot_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discord_bot_announcements_updated_at
  BEFORE UPDATE ON discord_bot_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_discord_bot_announcements_updated_at();

CREATE OR REPLACE FUNCTION update_discord_bot_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discord_bot_tickets_updated_at
  BEFORE UPDATE ON discord_bot_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_discord_bot_tickets_updated_at();

-- ============================================
-- KOMENTÁRE PRE DOKUMENTÁCIU
-- ============================================
COMMENT ON COLUMN discord_bots.command_prefix IS 'Prefix pre príkazy (NULL = slash-only)';
COMMENT ON COLUMN discord_bots.bot_language IS 'Jazyk bota (SK/CZ/EN/NO atď.)';
COMMENT ON COLUMN discord_bots.admin_roles IS 'Array Discord role IDs, kto môže meniť nastavenia bota';
COMMENT ON COLUMN discord_bots.logs_channel_id IS 'Discord channel ID, kde sa logujú akcie bota';
COMMENT ON COLUMN discord_bots.message_cooldown_seconds IS 'Minimálny počet sekúnd medzi odpoveďami bota';
COMMENT ON COLUMN discord_bots.knowledge_source_type IS 'Zdroj vedomostí pre AI: none/faq/uploaded/custom';
COMMENT ON COLUMN discord_bots.ai_answer_style IS 'Štýl odpovedí AI: short/medium/long/bullet_points/paragraph';
```

## Overenie

Po spustení migrácie over, že všetky stĺpce existujú:

```sql
-- Skontroluj počet stĺpcov v discord_bots
SELECT COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'discord_bots';

-- Skontroluj nové tabuľky
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'discord_bot_%'
ORDER BY table_name;
```

## Poznámky

- Táto migrácia pridáva **veľké množstvo** nových stĺpcov a tabuliek
- Všetky nové stĺpce majú default hodnoty alebo môžu byť NULL
- RLS policies zabezpečujú, že používatelia môžu upravovať iba svojich botov
- Nové tabuľky sú prepojené s `discord_bots` cez foreign keys s CASCADE delete


