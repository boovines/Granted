-- Fix database schema issues for chat functionality
-- Run this in your Supabase SQL editor

-- 1. Fix chat_messages table - add missing columns
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS content text;

-- 2. Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS chat_summaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id text NOT NULL,
    summary text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_docs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL,
    filename text NOT NULL,
    content text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_summaries_chat_id ON chat_summaries(chat_id);
CREATE INDEX IF NOT EXISTS idx_live_docs_workspace_id ON live_docs(workspace_id);

-- 4. Update existing chat_messages records to have default values
UPDATE chat_messages SET role = 'user' WHERE role IS NULL;
UPDATE chat_messages SET content = '' WHERE content IS NULL;

-- 5. Set NOT NULL constraints after updating existing data
ALTER TABLE chat_messages ALTER COLUMN role SET NOT NULL;
ALTER TABLE chat_messages ALTER COLUMN content SET NOT NULL;
