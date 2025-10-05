-- Database schema for context orchestration pipeline
-- Run these commands in your Supabase SQL editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- RULES table for workspace-specific tone, style, and constraints
CREATE TABLE IF NOT EXISTS rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL,
    content jsonb NOT NULL DEFAULT '{}',
    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Create index for faster workspace lookups
CREATE INDEX IF NOT EXISTS idx_rules_workspace_id ON rules(workspace_id);

-- LIVE_DOCS table for semantic caching of active writing documents
CREATE TABLE IF NOT EXISTS live_docs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL,
    filename text NOT NULL,
    chunk_idx int NOT NULL,
    text text NOT NULL,
    embedding vector(1536), -- OpenAI ada-002 embedding dimension
    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_live_docs_workspace_id ON live_docs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_live_docs_filename ON live_docs(filename);
CREATE INDEX IF NOT EXISTS idx_live_docs_workspace_filename ON live_docs(workspace_id, filename);

-- Create vector similarity index for live_docs (if using pgvector)
-- Note: This requires the pgvector extension and may need adjustment based on your setup
-- CREATE INDEX IF NOT EXISTS idx_live_docs_embedding ON live_docs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- CHAT_MESSAGES table for storing individual chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id bigserial PRIMARY KEY,
    chat_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    embedding vector(1536), -- OpenAI ada-002 embedding dimension
    created_at timestamptz DEFAULT now()
);

-- Create indexes for chat messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Create vector similarity index for chat_messages (if using pgvector)
-- CREATE INDEX IF NOT EXISTS idx_chat_messages_embedding ON chat_messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- CHAT_SUMMARIES table for storing summarized chat history
CREATE TABLE IF NOT EXISTS chat_summaries (
    chat_id uuid PRIMARY KEY,
    summary text NOT NULL,
    embedding vector(1536), -- OpenAI ada-002 embedding dimension
    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Create vector similarity index for chat_summaries (if using pgvector)
-- CREATE INDEX IF NOT EXISTS idx_chat_summaries_embedding ON chat_summaries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Optional: DOCUMENTS table for tracking uploaded documents (if not already exists)
CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL,
    filename text NOT NULL,
    file_type text,
    file_size bigint,
    upload_date timestamptz DEFAULT now(),
    status text DEFAULT 'processed'
);

CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);

-- Optional: DOC_CHUNKS table for storing document chunks with embeddings (if not already exists)
CREATE TABLE IF NOT EXISTS doc_chunks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
    chunk_idx int NOT NULL,
    text text NOT NULL,
    embedding vector(1536), -- OpenAI ada-002 embedding dimension
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_document_id ON doc_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_chunk_idx ON doc_chunks(chunk_idx);

-- Create vector similarity index for doc_chunks (if using pgvector)
-- CREATE INDEX IF NOT EXISTS idx_doc_chunks_embedding ON doc_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Row Level Security (RLS) policies (optional but recommended)
-- Enable RLS on all tables
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_chunks ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust based on your authentication setup)
-- These assume you have a user_id or similar in your auth context

-- Rules: Users can only access rules for their workspaces
CREATE POLICY "Users can access their workspace rules" ON rules
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM user_workspaces 
        WHERE user_id = auth.uid()
    ));

-- Live docs: Users can only access live docs for their workspaces
CREATE POLICY "Users can access their workspace live docs" ON live_docs
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM user_workspaces 
        WHERE user_id = auth.uid()
    ));

-- Chat messages: Users can only access their own chat messages
CREATE POLICY "Users can access their own chat messages" ON chat_messages
    FOR ALL USING (chat_id IN (
        SELECT id FROM chats 
        WHERE user_id = auth.uid()
    ));

-- Chat summaries: Users can only access their own chat summaries
CREATE POLICY "Users can access their own chat summaries" ON chat_summaries
    FOR ALL USING (chat_id IN (
        SELECT id FROM chats 
        WHERE user_id = auth.uid()
    ));

-- Documents: Users can only access documents for their workspaces
CREATE POLICY "Users can access their workspace documents" ON documents
    FOR ALL USING (workspace_id IN (
        SELECT workspace_id FROM user_workspaces 
        WHERE user_id = auth.uid()
    ));

-- Doc chunks: Users can only access chunks for their documents
CREATE POLICY "Users can access chunks for their documents" ON doc_chunks
    FOR ALL USING (document_id IN (
        SELECT id FROM documents 
        WHERE workspace_id IN (
            SELECT workspace_id FROM user_workspaces 
            WHERE user_id = auth.uid()
        )
    ));

-- Helper functions for vector similarity search (if using pgvector)

-- Function to find similar live document chunks
CREATE OR REPLACE FUNCTION find_similar_live_docs(
    query_embedding vector(1536),
    target_workspace_id uuid,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    filename text,
    chunk_idx int,
    text text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ld.id,
        ld.filename,
        ld.chunk_idx,
        ld.text,
        1 - (ld.embedding <=> query_embedding) as similarity
    FROM live_docs ld
    WHERE ld.workspace_id = target_workspace_id
    ORDER BY ld.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to find similar chat messages
CREATE OR REPLACE FUNCTION find_similar_chat_messages(
    query_embedding vector(1536),
    target_chat_id uuid,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id bigint,
    role text,
    content text,
    created_at timestamptz,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.role,
        cm.content,
        cm.created_at,
        1 - (cm.embedding <=> query_embedding) as similarity
    FROM chat_messages cm
    WHERE cm.chat_id = target_chat_id
    ORDER BY cm.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to find similar chat summaries
CREATE OR REPLACE FUNCTION find_similar_chat_summaries(
    query_embedding vector(1536),
    target_chat_id uuid,
    match_count int DEFAULT 3
)
RETURNS TABLE (
    chat_id uuid,
    summary text,
    updated_at timestamptz,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.chat_id,
        cs.summary,
        cs.updated_at,
        1 - (cs.embedding <=> query_embedding) as similarity
    FROM chat_summaries cs
    WHERE cs.chat_id = target_chat_id
    ORDER BY cs.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
