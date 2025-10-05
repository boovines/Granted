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
from prompt_builder import build_prompt
from embeddings import embed_text

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
openai.api_key = os.getenv("OPENAI_API_KEY")

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
        # Build the comprehensive prompt using all context sources
        prompt = build_prompt(
            workspace_id=request.workspace_id,
            chat_id=request.chat_id,
            user_message=request.message
        )
        
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=request.max_tokens
        )
        
        answer = response.choices[0].message["content"]
        
        # Store the assistant's response in chat memory
        supabase = get_supabase()
        supabase.table("chat_messages").insert({
            "chat_id": request.chat_id,
            "role": "assistant",
            "content": answer,
            "embedding": embed_text(answer)
        }).execute()
        
        return {"answer": answer}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/live/update")
async def update_live_document(request: LiveDocUpdateRequest):
    """
    Update the semantic cache for live document content.
    """
    try:
        from retrievers.live_doc_retriever import update_live_document_cache
        
        result = update_live_document_cache(
            workspace_id=request.workspace_id,
            filename=request.filename,
            full_text=request.full_text
        )
        
        return {"status": "success", "chunks_updated": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/message")
async def store_chat_message(request: ChatMessageRequest):
    """
    Store a chat message and generate embeddings.
    """
    try:
        supabase = get_supabase()
        
        # Generate embedding for the message content
        message_embedding = embed_text(request.content)
        
        # Store the message
        result = supabase.table("chat_messages").insert({
            "chat_id": request.chat_id,
            "role": request.role,
            "content": request.content,
            "embedding": message_embedding
        }).execute()
        
        return {"status": "success", "message_id": result.data[0]["id"]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.get("/health")
async def health_check():
    """Detailed health check."""
    try:
        # Test database connection
        supabase = get_supabase()
        supabase.table("rules").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "database": "connected",
            "openai": "configured" if openai.api_key else "not_configured"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
