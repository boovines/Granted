-- Add missing schema elements to existing Supabase database
-- This version handles the case where documents.id is text (not uuid)
-- Run this script if you get the foreign key constraint error

-- 1. Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create doc_chunks table with text-based document_id (to match existing documents.id)
CREATE TABLE IF NOT EXISTS doc_chunks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id text REFERENCES documents(id) ON DELETE CASCADE,  -- Changed from uuid to text
    chunk_idx int NOT NULL,
    text text NOT NULL,
    embedding vector(1536), -- OpenAI ada-002 embedding dimension
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- 3. Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Add missing columns to existing documents table (if they don't exist)
-- We'll use ALTER TABLE IF NOT EXISTS equivalent by checking first
DO $$
BEGIN
    -- Add workspace_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'workspace_id') THEN
        ALTER TABLE documents ADD COLUMN workspace_id uuid;
    END IF;
    
    -- Add filename column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'filename') THEN
        ALTER TABLE documents ADD COLUMN filename text;
    END IF;
    
    -- Add file_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'file_type') THEN
        ALTER TABLE documents ADD COLUMN file_type text DEFAULT 'pdf';
    END IF;
    
    -- Add file_size column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'file_size') THEN
        ALTER TABLE documents ADD COLUMN file_size bigint;
    END IF;
    
    -- Add upload_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'upload_date') THEN
        ALTER TABLE documents ADD COLUMN upload_date timestamptz DEFAULT now();
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'status') THEN
        ALTER TABLE documents ADD COLUMN status text DEFAULT 'pending';
    END IF;
    
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'metadata') THEN
        ALTER TABLE documents ADD COLUMN metadata jsonb DEFAULT '{}';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'created_at') THEN
        ALTER TABLE documents ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_document_id ON doc_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_chunk_idx ON doc_chunks(chunk_idx);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_created_at ON doc_chunks(created_at);

-- 6. Create vector similarity index for fast semantic search
CREATE INDEX IF NOT EXISTS idx_doc_chunks_embedding 
ON doc_chunks USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- 7. Create helper function for semantic search (updated for text-based document_id)
CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(1536),
    workspace_id uuid,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    document_id text,  -- Changed from uuid to text
    chunk_idx int,
    text text,
    metadata jsonb,
    similarity float,
    filename text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.document_id,
        dc.chunk_idx,
        dc.text,
        dc.metadata,
        1 - (dc.embedding <=> query_embedding) as similarity,
        d.filename
    FROM doc_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE d.workspace_id = match_document_chunks.workspace_id
        AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 8. Create function to get document statistics (updated for text-based document_id)
CREATE OR REPLACE FUNCTION get_document_stats(workspace_id uuid)
RETURNS TABLE (
    total_documents bigint,
    total_chunks bigint,
    avg_chunks_per_document numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT d.id) as total_documents,
        COUNT(dc.id) as total_chunks,
        CASE 
            WHEN COUNT(DISTINCT d.id) > 0 THEN 
                ROUND(COUNT(dc.id)::numeric / COUNT(DISTINCT d.id), 2)
            ELSE 0 
        END as avg_chunks_per_document
    FROM documents d
    LEFT JOIN doc_chunks dc ON d.id = dc.document_id
    WHERE d.workspace_id = get_document_stats.workspace_id;
END;
$$;

-- 9. Create view for document overview (updated for text-based document_id)
CREATE OR REPLACE VIEW document_overview AS
SELECT 
    d.id,
    d.workspace_id,
    d.filename,
    d.file_type,
    d.file_size,
    d.upload_date,
    d.status,
    COUNT(dc.id) as chunk_count,
    d.created_at,
    d.updated_at
FROM documents d
LEFT JOIN doc_chunks dc ON d.id = dc.document_id
GROUP BY d.id, d.workspace_id, d.filename, d.file_type, d.file_size, 
         d.upload_date, d.status, d.created_at, d.updated_at;

-- 10. Insert a test workspace
INSERT INTO workspaces (id, name, description) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Test Workspace', 'A test workspace for development')
ON CONFLICT (id) DO NOTHING;

-- Schema update complete!
-- Your existing data is preserved and new functionality is added.
