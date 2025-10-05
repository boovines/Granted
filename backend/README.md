# Context Orchestration Pipeline Backend

This backend implements a comprehensive context orchestration pipeline that merges four key inputs for enhanced AI responses:

1. **Rules** - Tone/style constraints and workspace-specific guidelines
2. **Live Document Context** - Semantic representation of active writing documents
3. **Chat Memory** - Rolling short-term + summarized long-term conversation history
4. **PDF Sources** - Embedded and queryable document knowledge base

## Architecture

```
/backend
├── app.py                  # FastAPI entrypoint with all endpoints
├── db.py                   # Supabase/Postgres connection management
├── embeddings.py           # OpenAI embedding utilities
├── prompt_builder.py       # Orchestrates all context sources
├── retrievers/
│   ├── rules_manager.py    # System prompt generation
│   ├── live_doc_retriever.py # Live document semantic caching
│   ├── chat_retriever.py   # Chat memory and summarization
│   └── pdf_retriever.py    # PDF document retrieval
├── requirements.txt        # Python dependencies
├── database_schema.sql     # Database schema and setup
└── env.example            # Environment variables template
```

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `env.example` to `.env` and fill in your credentials:

```bash
cp env.example .env
```

Required environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key
- `OPENAI_API_KEY` - Your OpenAI API key
- `ARYN_API_KEY` - Your Aryn AI API key (for PDF parsing)

### 3. Database Setup

Run the SQL commands in `database_schema.sql` in your Supabase SQL editor to create the required tables and indexes.

### 4. Start the Server

```bash
python app.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Chat Query
```http
POST /chat/query
Content-Type: application/json

{
    "workspace_id": "uuid",
    "chat_id": "uuid", 
    "message": "Your question here",
    "max_tokens": 2000
}
```

### Update Live Document
```http
POST /live/update
Content-Type: application/json

{
    "workspace_id": "uuid",
    "filename": "document.txt",
    "full_text": "Full document content..."
}
```

### Store Chat Message
```http
POST /chat/message
Content-Type: application/json

{
    "chat_id": "uuid",
    "role": "user",
    "content": "Message content"
}
```

### Update Workspace Rules
```http
POST /rules/update
Content-Type: application/json

{
    "workspace_id": "uuid",
    "content": {
        "tone": "professional",
        "style": "clear and concise",
        "constraints": "Be accurate and helpful",
        "domain": "technical writing"
    }
}
```

### Get Workspace Rules
```http
GET /rules/{workspace_id}
```

### Health Check
```http
GET /health
```

## Context Sources

### 1. Rules Manager
- Stores workspace-specific tone, style, and constraint preferences
- Generates system prompts that guide AI behavior
- Supports JSON-based configuration for flexible rule definition

### 2. Live Document Retriever
- Maintains semantic embeddings of active writing documents
- Automatically chunks and embeds document content
- Enables context-aware responses based on current work

### 3. Chat Retriever
- Stores individual chat messages with embeddings
- Maintains rolling window of recent conversation
- Auto-summarizes older conversations for long-term memory
- Supports semantic search through chat history

### 4. PDF Retriever
- Integrates with existing docparser system
- Leverages Aryn AI for document parsing and embedding
- Enables semantic search through uploaded documents
- Supports filtering by specific documents

## Prompt Building

The `prompt_builder.py` orchestrates all context sources into a coherent prompt:

1. **System Prompt** - Generated from workspace rules
2. **Recent Chat** - Last 5 messages for immediate context
3. **Summarized Memory** - Relevant past topics via semantic search
4. **Live Document Context** - Relevant chunks from current document
5. **PDF Source Material** - Relevant content from knowledge base
6. **User Query** - The actual question or request

## Database Schema

### Core Tables

- `rules` - Workspace-specific configuration (JSONB)
- `live_docs` - Live document chunks with embeddings
- `chat_messages` - Individual chat messages with embeddings  
- `chat_summaries` - Summarized conversation history
- `documents` - Document metadata
- `doc_chunks` - Document chunks with embeddings

### Vector Search

The system uses pgvector for semantic similarity search:
- OpenAI ada-002 embeddings (1536 dimensions)
- Cosine similarity for context retrieval
- Indexed for efficient query performance

## Integration with Frontend

The backend is designed to work with the React frontend:

1. **Live Document Updates** - Frontend calls `/live/update` when documents are saved
2. **Chat Interface** - Frontend uses `/chat/query` for AI responses
3. **Workspace Management** - Frontend manages rules via `/rules/*` endpoints
4. **PDF Integration** - Leverages existing docparser for document processing

## Development

### Running in Development Mode

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test chat query
curl -X POST http://localhost:8000/chat/query \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "test-workspace",
    "chat_id": "test-chat", 
    "message": "Hello, how are you?"
  }'
```

## Performance Considerations

- **Embedding Generation** - Cached and batched for efficiency
- **Vector Search** - Indexed with pgvector for fast similarity queries
- **Context Truncation** - Automatic truncation to fit token limits
- **Memory Management** - Automatic cleanup of old chat messages

## Security

- Row Level Security (RLS) policies for data isolation
- CORS configuration for frontend integration
- Input validation and sanitization
- Secure environment variable handling

## Monitoring

The `/health` endpoint provides:
- Database connectivity status
- OpenAI API configuration status
- Overall system health metrics
