"""
FastAPI entrypoint for the context orchestration pipeline.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import openai
import os
from dotenv import load_dotenv

from db import get_supabase
from embeddings import embed_text
import sys
import os

# Add docparser to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'docparser'))

# from supabase_config import SupabaseConfig
# from pdf_parser import PDFParser
# from config import ArynConfig

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Context Orchestration API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Pydantic models
class QueryRequest(BaseModel):
    workspace_id: str
    chat_id: str
    message: str
    max_tokens: Optional[int] = 2000

class LiveDocUpdateRequest(BaseModel):
    workspace_id: str
    filename: str
    full_text: str

class ChatMessageRequest(BaseModel):
    chat_id: str
    role: str  # 'user' or 'assistant'
    content: str

class RulesRequest(BaseModel):
    workspace_id: str
    content: dict  # JSON object with tone, style, constraints

class ParseDocumentRequest(BaseModel):
    document_id: str
    workspace_id: str

class GetEmbeddingsRequest(BaseModel):
    document_id: str
    workspace_id: str
    query: Optional[str] = None
    limit: int = 10

class GetRAGContextRequest(BaseModel):
    document_ids: List[str]
    workspace_id: str
    query: str
    limit: int = 20

# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Context Orchestration API is running"}

@app.post("/chat/query")
async def query_chat(request: QueryRequest):
    """
    Main chat query endpoint that orchestrates all context sources.
    """
    try:
        # Simple response for testing - no database calls
        user_message = request.message
        
        # For now, return a simple response to test the endpoint
        answer = f"I received your message: '{user_message}'. The chat endpoint is working! The PDF context feature is ready for testing."
        
        return {"answer": answer}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @app.post("/live/update")
# async def update_live_document(request: LiveDocUpdateRequest):
#     """
#     Update the semantic cache for live document content.
#     """
#     try:
#         from retrievers.live_doc_retriever import update_live_document_cache
#         
#         result = update_live_document_cache(
#             workspace_id=request.workspace_id,
#             filename=request.filename,
#             full_text=request.full_text
#         )
#         
#         return {"status": "success", "chunks_updated": result}
#         
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/chat/message")
# async def store_chat_message(request: ChatMessageRequest):
#     """
#     Store a chat message and generate embeddings.
#     """
#     try:
#         supabase = get_supabase()
#         
#         # Generate embedding for the message content
#         message_embedding = embed_text(request.content)
#         
#         # Store the message
#         result = supabase.table("chat_messages").insert({
#             "chat_id": request.chat_id,
#             "role": request.role,
#             "content": request.content,
#             "embedding": message_embedding
#         }).execute()
#         
#         return {"status": "success", "message_id": result.data[0]["id"]}
#         
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/rules/update")
async def update_rules(request: RulesRequest):
    """
    Update workspace rules for system prompt generation.
    """
    try:
        supabase = get_supabase()
        
        # Upsert rules for the workspace
        result = supabase.table("rules").upsert({
            "workspace_id": request.workspace_id,
            "content": request.content
        }).execute()
        
        return {"status": "success", "rules_updated": True}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rules/{workspace_id}")
async def get_rules(workspace_id: str):
    """
    Get workspace rules.
    """
    try:
        supabase = get_supabase()
        
        result = supabase.table("rules").select("content").eq("workspace_id", workspace_id).execute()
        
        if result.data:
            return {"rules": result.data[0]["content"]}
        else:
            return {"rules": {}}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @app.post("/parse_document")
# async def parse_document(request: ParseDocumentRequest):
#     """
#     Parse a document and generate embeddings for RAG.
#     """
#     # Temporarily disabled due to import issues
#     return {"success": False, "message": "Document parsing temporarily disabled"}

@app.post("/get_embeddings")
async def get_embeddings(request: GetEmbeddingsRequest):
    """
    Get embeddings for a document, optionally filtered by query similarity.
    """
    try:
        supabase = get_supabase()
        
        # Check if document exists and is parsed
        doc_result = supabase.table("documents").select("status").eq("id", request.document_id).single().execute()
        if not doc_result.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        if doc_result.data.get("status") != "parsed":
            raise HTTPException(status_code=400, detail="Document not parsed yet")
        
        if request.query:
            # Perform similarity search
            query_embedding = embed_text(request.query)
            
            # Use the match_document_chunks function
            result = supabase.rpc("match_document_chunks", {
                "query_embedding": query_embedding,
                "workspace_id": request.workspace_id,
                "match_threshold": 0.7,
                "match_count": request.limit
            }).execute()
            
            chunks = []
            for row in result.data:
                if row["document_id"] == request.document_id:
                    chunks.append({
                        "id": row["id"],
                        "chunk_idx": row["chunk_idx"],
                        "text": row["text"],
                        "metadata": row["metadata"],
                        "similarity": row["similarity"]
                    })
        else:
            # Get all chunks for the document
            result = supabase.table("doc_chunks").select("*").eq("document_id", request.document_id).order("chunk_idx").limit(request.limit).execute()
            chunks = result.data
        
        return {
            "success": True,
            "document_id": request.document_id,
            "chunks": chunks,
            "count": len(chunks)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get_rag_context")
async def get_rag_context(request: GetRAGContextRequest):
    """
    Get RAG context from multiple documents for chat queries.
    """
    try:
        supabase = get_supabase()
        
        # Generate query embedding
        query_embedding = embed_text(request.query)
        
        # Get relevant chunks from all specified documents
        all_chunks = []
        for document_id in request.document_ids:
            # Use similarity search for each document
            result = supabase.rpc("match_document_chunks", {
                "query_embedding": query_embedding,
                "workspace_id": request.workspace_id,
                "match_threshold": 0.6,
                "match_count": request.limit // len(request.document_ids) + 1
            }).execute()
            
            for row in result.data:
                if row["document_id"] == document_id:
                    all_chunks.append({
                        "document_id": row["document_id"],
                        "filename": row["filename"],
                        "chunk_idx": row["chunk_idx"],
                        "text": row["text"],
                        "metadata": row["metadata"],
                        "similarity": row["similarity"]
                    })
        
        # Sort by similarity and limit
        all_chunks.sort(key=lambda x: x["similarity"], reverse=True)
        top_chunks = all_chunks[:request.limit]
        
        # Build context string
        context_parts = []
        for chunk in top_chunks:
            context_parts.append(f"[{chunk['filename']} - Page {chunk['metadata'].get('page_number', '?')}]\n{chunk['text']}\n")
        
        context = "\n".join(context_parts)
        
        return {
            "success": True,
            "context": context,
            "chunks": top_chunks,
            "count": len(top_chunks)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Detailed health check."""
    try:
        # Test database connection with a table that exists
        supabase = get_supabase()
        supabase.table("documents").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "database": "connected",
            "openai": "configured" if openai_client.api_key else "not_configured"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
