"""
Simple FastAPI app for testing the chatbot without complex database dependencies.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Simple Chatbot API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3004", "http://localhost:3005", "http://localhost:5173"],
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

# Hardcoded grant proposal rules
GRANT_RULES = """You are writing a grant proposal for GreenFuture Alliance, an international NGO dedicated to expanding access to renewable energy in underserved rural regions. The goal of this proposal is to secure funding from the Global Energy Impact Fund for a new solar microgrid initiative in Sub-Saharan Africa.

The proposal must emphasize measurable impact, community engagement, and sustainability. It should clearly explain how the project will reduce carbon emissions, empower local communities through job creation, and maintain long-term operation without dependency on foreign aid.

Guidelines:
	•	Length: 500–700 words total.
	•	Tone: Professional, persuasive, and impact-driven.
	•	Structure:
	1.	Executive Summary (goal, region, funding requested).
	2.	Project Rationale (problem + opportunity).
	3.	Implementation Plan (timeline, partners, community involvement).
	4.	Expected Impact (social, economic, environmental outcomes).
	5.	Budget Overview (transparent allocation).
	•	Formatting: Write in plain, concise English suitable for global reviewers; avoid jargon.
	•	Citations: Include data sources or prior project outcomes when possible.
	•	Focus: Demonstrate scalability and local empowerment rather than technological complexity.

Follow these rules strictly when generating the proposal or providing edits or feedback."""

# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Simple Chatbot API is running"}

@app.post("/chat/query")
async def query_chat(request: QueryRequest):
    """
    Simple chat query endpoint with hardcoded grant proposal rules.
    """
    try:
        # Build a simple prompt with the hardcoded rules
        prompt = f"""{GRANT_RULES}

=== USER QUERY ===
{request.message}

Please provide a helpful response following the grant proposal guidelines above."""

        # Call OpenAI API
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=request.max_tokens
        )
        
        answer = response.choices[0].message.content
        
        return {"response": answer, "success": True}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Simple health check."""
    try:
        return {
            "status": "healthy",
            "openai": "configured" if openai_client.api_key else "not_configured",
            "message": "Simple chatbot API is running"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
