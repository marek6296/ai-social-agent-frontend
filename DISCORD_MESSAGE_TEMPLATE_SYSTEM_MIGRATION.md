-- Discord Message Template System Migration
-- This creates tables for the interactive message builder system

-- 1. Message Templates (what client creates)
CREATE TABLE IF NOT EXISTS discord_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guild_id TEXT NOT NULL, -- Discord guild ID
  name TEXT NOT NULL,
  embed_json JSONB, -- Discord Embed structure
  components_json JSONB, -- Discord Message Components (buttons, select menus)
  pages_json JSONB DEFAULT '[]'::JSONB, -- Array of pages (for multi-page messages)
  current_page_index INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discord_message_templates_owner ON discord_message_templates(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_discord_message_templates_guild ON discord_message_templates(guild_id);

-- 2. Action Map (what happens on click/interaction)
CREATE TABLE IF NOT EXISTS discord_template_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES discord_message_templates(id) ON DELETE CASCADE,
  custom_id TEXT NOT NULL, -- e.g., "tpl_123__page_main__btn_join"
  page_index INTEGER DEFAULT 0, -- Which page this action belongs to
  action_type TEXT NOT NULL, -- reply, edit_message, open_modal, assign_role, remove_role, create_ticket, create_event_rsvp, open_url, save_to_db
  action_payload_json JSONB NOT NULL, -- Action-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, custom_id)
);

CREATE INDEX IF NOT EXISTS idx_discord_template_actions_template ON discord_template_actions(template_id);
CREATE INDEX IF NOT EXISTS idx_discord_template_actions_custom_id ON discord_template_actions(custom_id);

-- 3. Published Instances (messages sent to channels)
CREATE TABLE IF NOT EXISTS discord_published_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES discord_message_templates(id) ON DELETE CASCADE,
  bot_id UUID NOT NULL REFERENCES discord_bots(id) ON DELETE CASCADE,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL, -- Discord message ID
  current_page_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, channel_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_discord_published_messages_template ON discord_published_messages(template_id);
CREATE INDEX IF NOT EXISTS idx_discord_published_messages_message ON discord_published_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_discord_published_messages_bot ON discord_published_messages(bot_id);

-- 4. State/RSVP Tracking
CREATE TABLE IF NOT EXISTS discord_message_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES discord_message_templates(id) ON DELETE CASCADE,
  published_message_id UUID NOT NULL REFERENCES discord_published_messages(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL, -- Discord message ID (denormalized for quick lookup)
  user_id TEXT NOT NULL, -- Discord user ID
  status TEXT, -- going, maybe, no, waitlist (for RSVP)
  data_json JSONB DEFAULT '{}'::JSONB, -- Additional data (form responses, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(published_message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_discord_message_state_template ON discord_message_state(template_id);
CREATE INDEX IF NOT EXISTS idx_discord_message_state_message ON discord_message_state(message_id);
CREATE INDEX IF NOT EXISTS idx_discord_message_state_user ON discord_message_state(user_id);

-- 5. Interaction Logs (for analytics)
CREATE TABLE IF NOT EXISTS discord_template_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES discord_message_templates(id) ON DELETE CASCADE,
  published_message_id UUID REFERENCES discord_published_messages(id) ON DELETE SET NULL,
  custom_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discord_template_interactions_template ON discord_template_interactions(template_id);
CREATE INDEX IF NOT EXISTS idx_discord_template_interactions_custom_id ON discord_template_interactions(custom_id);
CREATE INDEX IF NOT EXISTS idx_discord_template_interactions_created ON discord_template_interactions(created_at);

-- Helper function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discord_message_templates_updated_at
  BEFORE UPDATE ON discord_message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discord_published_messages_updated_at
  BEFORE UPDATE ON discord_published_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discord_message_state_updated_at
  BEFORE UPDATE ON discord_message_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

