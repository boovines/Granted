# PDF Processing and RAG Integration

This document describes the integration between the backend document processing pipeline (`/docparser`) and the frontend chat interface (`/src`).

## 🏗️ Architecture Overview

```
Frontend (src/)                    Backend (docparser/ + backend/)
├─ usePDFHandler.ts                ├─ pdf_parser.py
├─ chatApi.ts                      ├─ embeddings.py
├─ Explorer.tsx                    ├─ supabase_config.py
└─ App.tsx                         └─ app.py (FastAPI)
```

## 🔄 Integration Flow

### 1. PDF Upload and Processing

When a user uploads a PDF through the frontend:

1. **Frontend**: `usePDFHandler.processPDF()` is called
2. **Upload**: File is uploaded to Supabase Storage
3. **Database**: Document record is created in `sources` and `documents` tables
4. **Backend**: `/parse_document` endpoint is called
5. **Parsing**: Aryn SDK parses the PDF into structured elements
6. **Embedding**: Text chunks are generated and embedded using OpenAI
7. **Storage**: Embeddings are stored in `doc_chunks` table
8. **Status**: Document status is updated to "parsed"

### 2. Chat with RAG Context

When a user asks a question with PDF context:

1. **Frontend**: `chatApi.sendChatMessage()` is called with `use_rag: true`
2. **RAG Context**: `/get_rag_context` endpoint retrieves relevant chunks
3. **Similarity Search**: Vector similarity search finds top-K relevant chunks
4. **Context Building**: Relevant chunks are formatted into context string
5. **Chat**: Context is prepended to user message and sent to `/chat/query`
6. **Response**: AI generates response using the RAG context

## 📁 Key Files

### Frontend Files

- **`src/hooks/usePDFHandler.ts`**: Handles PDF upload, parsing, and RAG context retrieval
- **`src/utils/chatApi.ts`**: Enhanced with RAG context integration
- **`src/components/Explorer.tsx`**: Updated to use PDF processing pipeline
- **`src/App.tsx`**: Integrated PDF handler and RAG functionality

### Backend Files

- **`backend/app.py`**: FastAPI endpoints for document processing and RAG
- **`docparser/pdf_parser.py`**: PDF parsing using Aryn SDK
- **`docparser/embeddings.py`**: Text chunking and embedding generation
- **`docparser/supabase_config.py`**: Supabase client configuration
- **`docparser/config.py`**: Aryn API configuration

## 🚀 Setup Instructions

### 1. Environment Variables

Create a `.env` file in the `docparser/` directory:

```bash
# OpenAI API Key (required for embeddings)
OPENAI_API_KEY=your_openai_api_key_here

# Aryn API Key (required for PDF parsing)
ARYN_API_KEY=your_aryn_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### 2. Database Setup

Run the schema update script to create necessary tables:

```bash
cd docparser
psql -h your_host -U your_user -d your_database -f schema.sql
```

### 3. Backend Dependencies

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt

cd ../docparser
pip install -r requirements.txt
```

### 4. Start the Backend

```bash
cd backend
python app.py
```

The backend will start on `http://localhost:8000`

### 5. Start the Frontend

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🧪 Testing the Integration

### 1. Run Integration Tests

```bash
python test_integration.py
```

### 2. Manual Testing

1. **Upload a PDF**: Go to the frontend and upload a PDF file to the "Sources" category
2. **Check Processing**: Watch the header for processing status indicators
3. **Chat with Context**: Select the PDF as context and ask questions about it
4. **Verify RAG**: The AI should provide responses based on the PDF content

## 🔧 API Endpoints

### Document Processing

- **`POST /parse_document`**: Parse a document and generate embeddings
- **`POST /get_embeddings`**: Retrieve embeddings for a document
- **`POST /get_rag_context`**: Get RAG context from multiple documents

### Chat

- **`POST /chat/query`**: Main chat endpoint with RAG integration
- **`GET /health`**: Health check endpoint

## 📊 Database Schema

### Key Tables

- **`documents`**: Document metadata and processing status
- **`doc_chunks`**: Text chunks with embeddings for RAG
- **`sources`**: Frontend file references
- **`workspaces`**: Workspace management

### Vector Search

The system uses PostgreSQL with the `vector` extension for semantic search:

```sql
-- Vector similarity search function
SELECT * FROM match_document_chunks(
    query_embedding := $1,
    workspace_id := $2,
    match_threshold := 0.7,
    match_count := 10
);
```

## 🎯 Features

### ✅ Implemented

- PDF upload and storage in Supabase
- Document parsing using Aryn SDK
- Text chunking and embedding generation
- Vector similarity search for RAG
- Chat interface with RAG context
- Real-time processing status indicators
- Error handling and fallbacks

### 🔄 Workflow

1. **Upload**: User uploads PDF → Stored in Supabase Storage
2. **Parse**: Backend parses PDF → Extracts text elements
3. **Embed**: Text chunks → OpenAI embeddings → Stored in database
4. **Query**: User asks question → Vector search → Relevant chunks
5. **Respond**: AI generates response using RAG context

## 🐛 Troubleshooting

### Common Issues

1. **Backend not starting**: Check environment variables and dependencies
2. **PDF parsing fails**: Verify Aryn API key and file format
3. **Embeddings not generated**: Check OpenAI API key and quota
4. **RAG context empty**: Ensure documents are parsed and embeddings exist
5. **Database errors**: Verify Supabase connection and schema

### Debug Steps

1. Check backend logs: `cd backend && python app.py`
2. Test API endpoints: `python test_integration.py`
3. Verify database: Check Supabase dashboard
4. Check browser console: Look for frontend errors

## 🔮 Future Enhancements

- Support for more document formats (DOCX, TXT, etc.)
- Batch processing for multiple documents
- Advanced chunking strategies
- Caching for improved performance
- User-specific document management
- Advanced RAG techniques (re-ranking, multi-hop reasoning)

## 📝 Notes

- The system is designed to be modular and extensible
- All document processing is asynchronous
- Embeddings are stored in PostgreSQL for fast retrieval
- The frontend provides real-time feedback on processing status
- Error handling includes graceful fallbacks for better UX
