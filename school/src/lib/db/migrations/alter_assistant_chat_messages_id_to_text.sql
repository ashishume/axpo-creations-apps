-- Assistant chat messages: use TEXT id to match app (welcome, generateId like "timestamp-xxxxx")
-- Run this if the table was created with id UUID and inserts fail with invalid UUID.

ALTER TABLE school_xx_assistant_chat_messages
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Remove default so we don't assume gen_random_uuid(); app always sends id.
ALTER TABLE school_xx_assistant_chat_messages
  ALTER COLUMN id DROP DEFAULT;
