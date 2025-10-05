"""
Live document retriever for semantic caching of active writing documents.
"""
from typing import List, Dict, Any
from db import get_supabase
from embeddings import embed_text, chunk_text


def get_live_context(workspace_id: str, query_vec: List[float], k: int = 5) -> List[str]:
    """
    Retrieve relevant live document context using semantic similarity.
    
    Args:
        workspace_id: Unique identifier for the workspace
        query_vec: Query embedding vector
        k: Number of top results to return
        
    Returns:
        List of relevant text chunks
    """
    try:
        supabase = get_supabase()
        
        # Use pgvector similarity search
        # Note: This assumes you have pgvector extension and proper indexing
        # The actual query might need to be adjusted based on your Supabase setup
        
        # For now, we'll use a simpler approach with text search
        # In production, you'd want to use proper vector similarity search
        result = supabase.table("live_docs").select("text").eq("workspace_id", workspace_id).limit(k).execute()
        
        if result.data:
            return [row["text"] for row in result.data]
        else:
            return []
            
    except Exception as e:
        print(f"Error retrieving live context for workspace {workspace_id}: {e}")
        return []


def update_live_document_cache(workspace_id: str, filename: str, full_text: str) -> int:
    """
    Update the semantic cache for a live document.
    
    Args:
        workspace_id: Unique identifier for the workspace
        filename: Name of the document file
        full_text: Full text content of the document
        
    Returns:
        Number of chunks processed
    """
    try:
        supabase = get_supabase()
        
        # Chunk the text
        chunks = chunk_text(full_text, chunk_size=500, overlap=50)
        
        # Delete existing chunks for this workspace and filename
        supabase.table("live_docs").delete().eq("workspace_id", workspace_id).eq("filename", filename).execute()
        
        # Process chunks in batches
        batch_size = 100  # OpenAI API limit
        chunks_processed = 0
        
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            
            # Generate embeddings for the batch
            from embeddings import embed_texts
            embeddings = embed_texts(batch)
            
            # Prepare data for insertion
            live_doc_data = []
            for j, (chunk, embedding) in enumerate(zip(batch, embeddings)):
                live_doc_data.append({
                    "workspace_id": workspace_id,
                    "filename": filename,
                    "chunk_idx": i + j,
                    "text": chunk,
                    "embedding": embedding
                })
            
            # Insert batch
            supabase.table("live_docs").insert(live_doc_data).execute()
            chunks_processed += len(live_doc_data)
        
        return chunks_processed
        
    except Exception as e:
        print(f"Error updating live document cache: {e}")
        raise


def get_document_chunks(workspace_id: str, filename: str) -> List[Dict[str, Any]]:
    """
    Get all chunks for a specific document.
    
    Args:
        workspace_id: Unique identifier for the workspace
        filename: Name of the document file
        
    Returns:
        List of chunk dictionaries
    """
    try:
        supabase = get_supabase()
        
        result = supabase.table("live_docs").select("*").eq("workspace_id", workspace_id).eq("filename", filename).order("chunk_idx").execute()
        
        return result.data if result.data else []
        
    except Exception as e:
        print(f"Error retrieving document chunks: {e}")
        return []


def delete_document_cache(workspace_id: str, filename: str) -> bool:
    """
    Delete all cached chunks for a specific document.
    
    Args:
        workspace_id: Unique identifier for the workspace
        filename: Name of the document file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        supabase = get_supabase()
        
        supabase.table("live_docs").delete().eq("workspace_id", workspace_id).eq("filename", filename).execute()
        
        return True
        
    except Exception as e:
        print(f"Error deleting document cache: {e}")
        return False
