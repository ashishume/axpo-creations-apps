-- Assistant chat messages: persisted per session, scoped by organization.
-- Only users with access to that session (same org or Super Admin) can read/write.

CREATE TABLE IF NOT EXISTS school_xx_assistant_chat_messages (
  id TEXT PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES school_xx_sessions(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES school_xx_organizations(id) ON DELETE SET NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  is_error BOOLEAN DEFAULT FALSE,
  analytics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_xx_assistant_chat_messages_session
  ON school_xx_assistant_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_assistant_chat_messages_org
  ON school_xx_assistant_chat_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_school_xx_assistant_chat_messages_created
  ON school_xx_assistant_chat_messages(session_id, created_at);

-- Set organization_id from session's school when inserting
CREATE OR REPLACE FUNCTION school_xx_assistant_chat_set_org()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT sc.organization_id INTO NEW.organization_id
    FROM school_xx_sessions s
    JOIN school_xx_schools sc ON sc.id = s.school_id
    WHERE s.id = NEW.session_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS school_xx_assistant_chat_set_org_trigger ON school_xx_assistant_chat_messages;
CREATE TRIGGER school_xx_assistant_chat_set_org_trigger
  BEFORE INSERT ON school_xx_assistant_chat_messages
  FOR EACH ROW
  EXECUTE PROCEDURE school_xx_assistant_chat_set_org();

-- RLS: only org members (or Super Admin) can see messages for their org's sessions
ALTER TABLE school_xx_assistant_chat_messages ENABLE ROW LEVEL SECURITY;

-- Authenticated: access only when message's org = current user's org, or user is Super Admin
CREATE POLICY "Assistant chat by org"
  ON school_xx_assistant_chat_messages FOR ALL TO authenticated
  USING (
    organization_id = school_xx_current_organization_id()
    OR school_xx_current_organization_id() IS NULL
  )
  WITH CHECK (
    organization_id = school_xx_current_organization_id()
    OR school_xx_current_organization_id() IS NULL
  );

-- Anon (dev): allow all
CREATE POLICY "Allow anon assistant chat dev"
  ON school_xx_assistant_chat_messages FOR ALL TO anon
  USING (true) WITH CHECK (true);
