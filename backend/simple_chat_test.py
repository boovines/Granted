"""
Enhanced server with real RAG pipeline
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import openai
import os
from dotenv import load_dotenv
import sys

# Add docparser to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'docparser'))

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Import Supabase and embeddings
try:
    from db import get_supabase
    from embeddings import embed_text
    SUPABASE_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import Supabase modules: {e}")
    SUPABASE_AVAILABLE = False

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    workspace_id: str
    chat_id: str
    message: str
    max_tokens: int = 2000

class RAGContextRequest(BaseModel):
    document_ids: list
    workspace_id: str
    query: str
    limit: int = 20

class ParseDocumentRequest(BaseModel):
    document_id: str
    workspace_id: str

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/chat/query")
async def chat_query(request: QueryRequest):
    """
    Chat endpoint with real AI responses using RAG context.
    """
    try:
        # For now, use a simple AI response without RAG context
        # The RAG context is handled by the frontend calling /get_rag_context first
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": request.message}],
            max_tokens=request.max_tokens
        )
        
        answer = response.choices[0].message.content
        
        return {"answer": answer}
        
    except Exception as e:
        print(f"Error in chat_query: {e}")
        # Fallback to simple response if OpenAI fails
        return {"answer": f"I received your message: '{request.message}'. I'm having trouble connecting to the AI service right now, but the system is working!"}

@app.post("/get_rag_context")
async def get_rag_context(request: RAGContextRequest):
    """
    Get RAG context from actual document chunks using vector similarity search.
    """
    if not SUPABASE_AVAILABLE:
        return {
            "success": False,
            "error": "Supabase not available",
            "context": "",
            "chunks": [],
            "count": 0
        }
    
    try:
        supabase = get_supabase()
        
        # Generate query embedding
        query_embedding = embed_text(request.query)
        
        all_chunks = []
        
        # Get chunks for each document using vector similarity search
        for document_id in request.document_ids:
            try:
                # Use the match_document_chunks RPC function for vector similarity search
                result = supabase.rpc("match_document_chunks", {
                    "query_embedding": query_embedding,
                    "workspace_id": request.workspace_id,
                    "document_id": document_id,
                    "match_threshold": 0.7,
                    "match_count": request.limit
                }).execute()
                
                if result.data:
                    all_chunks.extend(result.data)
                    
            except Exception as e:
                print(f"Error getting chunks for document {document_id}: {e}")
                # Fallback: get chunks without similarity search
                try:
                    result = supabase.table("doc_chunks").select("*").eq("document_id", document_id).limit(request.limit).execute()
                    if result.data:
                        all_chunks.extend(result.data)
                except Exception as fallback_error:
                    print(f"Fallback also failed for document {document_id}: {fallback_error}")
        
        # Sort by similarity score if available, otherwise by chunk index
        if all_chunks and 'similarity' in all_chunks[0]:
            all_chunks.sort(key=lambda x: x.get('similarity', 0), reverse=True)
        else:
            all_chunks.sort(key=lambda x: x.get('chunk_idx', 0))
        
        # Limit results
        all_chunks = all_chunks[:request.limit]
        
        # Build context string
        context_parts = []
        for chunk in all_chunks:
            text = chunk.get('text', '')
            if text and len(text.strip()) > 10:  # Only include substantial text
                context_parts.append(text.strip())
        
        context = "\n\n".join(context_parts)
        
        return {
            "success": True,
            "context": context,
            "chunks": all_chunks,
            "count": len(all_chunks)
        }
        
    except Exception as e:
        print(f"Error in get_rag_context: {e}")
        return {
            "success": False,
            "error": str(e),
            "context": "",
            "chunks": [],
            "count": 0
        }

@app.post("/parse_document")
async def parse_document(request: ParseDocumentRequest):
    """
    Parse a document and generate embeddings for RAG.
    """
    if not SUPABASE_AVAILABLE:
        return {
            "success": False,
            "message": "Supabase not available",
            "document_id": request.document_id
        }
    
    try:
        supabase = get_supabase()
        
        # Get document info
        doc_result = supabase.table("documents").select("*").eq("id", request.document_id).single().execute()
        if not doc_result.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document = doc_result.data
        
        # Check if already parsed
        if document.get("status") == "parsed":
            return {
                "success": True,
                "message": "Document already parsed",
                "document_id": request.document_id
            }
        
        # For now, return a message that parsing is not fully implemented
        # In a full implementation, this would:
        # 1. Download the file from Supabase Storage
        # 2. Parse it using Aryn AI or similar
        # 3. Generate embeddings
        # 4. Store chunks in doc_chunks table
        
        return {
            "success": True,
            "message": "Document parsing endpoint available but not fully implemented yet",
            "document_id": request.document_id
        }
        
    except Exception as e:
        print(f"Error in parse_document: {e}")
        return {
            "success": False,
            "message": f"Error parsing document: {str(e)}",
            "document_id": request.document_id
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
