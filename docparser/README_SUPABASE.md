# Supabase-Integrated DocParser

Enhanced version of the DocParser that integrates with Supabase for PDF processing, embedding storage, and semantic search capabilities.

## 🚀 Features

### Core Functionality
- **PDF Processing**: Parse PDFs using Aryn AI with intelligent caching
- **Embedding Generation**: Create vector embeddings for semantic search
- **Supabase Integration**: Store documents and embeddings in PostgreSQL with vector search
- **Semantic Search**: Query documents using natural language
- **Workspace Management**: Organize documents by workspace
- **Batch Processing**: Efficient processing of multiple documents

### Enhanced Capabilities
- **Vector Search**: Fast semantic similarity search using pgvector
- **Metadata Storage**: Rich metadata storage with JSONB
- **Chunk Management**: Intelligent text chunking with overlap
- **Real-time Processing**: Process PDFs from URLs or local files
- **Query Optimization**: Optimized queries with proper indexing

## 📋 Requirements

### Environment Variables
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# OpenAI Configuration (for embeddings)
OPENAI_API_KEY=your_openai_api_key

# Aryn AI Configuration (for PDF parsing)
ARYN_API_KEY=your_aryn_api_key
ARYN_BASE_URL=https://api.aryn.ai
ARYN_REGION=US
```

### Python Dependencies
```bash
pip install -r requirements_supabase.txt
```

## 🗄️ Database Setup

1. **Enable Extensions** in your Supabase project:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Run Schema**: Execute the SQL commands in `database_schema.sql` in your Supabase SQL editor.

3. **Verify Setup**: Check that tables and functions are created correctly.

## 🏗️ Architecture

```
docparser/
├── supabase_config.py          # Supabase configuration
├── supabase_processor.py       # Core processing logic
├── supabase_docquery.py        # Main interface
├── embeddings.py               # Embedding utilities
├── database_schema.sql         # Database schema
├── example_supabase_usage.py   # Usage examples
└── requirements_supabase.txt   # Dependencies
```

### Key Components

#### SupabaseDocumentProcessor
- Handles PDF parsing and embedding generation
- Manages document and chunk storage
- Provides semantic search capabilities

#### SupabaseDocQuery
- Main interface for document operations
- Query processing and result formatting
- Workspace and document management

#### Embedding Utilities
- Text chunking and cleaning
- OpenAI embedding generation
- Metadata extraction and management

## 📖 Usage Examples

### Basic Setup
```python
from supabase_docquery import SupabaseDocQuery

# Initialize with environment variables
doc_query = SupabaseDocQuery()

# Or with explicit credentials
doc_query = SupabaseDocQuery(
    supabase_url="your_url",
    supabase_key="your_key",
    aryn_api_key="your_aryn_key"
)
```

### Process a PDF File
```python
# Process local PDF
result = doc_query.process_local_pdf(
    pdf_path="path/to/document.pdf",
    workspace_id="your-workspace-id",
    document_metadata={"source": "upload", "category": "research"}
)

if result["success"]:
    print(f"Document processed: {result['document_id']}")
    print(f"Chunks created: {result['chunks_processed']}")
```

### Process PDF from URL
```python
# Process PDF from URL
result = doc_query.process_pdf_from_url(
    pdf_url="https://example.com/document.pdf",
    workspace_id="your-workspace-id"
)
```

### Query Documents
```python
# Semantic search
results = doc_query.query_documents(
    workspace_id="your-workspace-id",
    query="What are the main findings?",
    limit=5
)

if results["success"]:
    print(results["formatted_response"])
```

### Get Document Overview
```python
# Get document statistics
overview = doc_query.get_document_overview(document_id)

print(f"Title: {overview['title']}")
print(f"Pages: {overview['page_count']}")
print(f"Chunks: {overview['chunk_count']}")
```

### List Workspace Documents
```python
# List all documents in workspace
documents = doc_query.list_workspace_documents(workspace_id)

for doc in documents:
    print(f"- {doc['filename']} ({doc['status']})")
```

## 🔧 Advanced Features

### Custom Chunking
```python
# Modify chunk size and overlap
processor = SupabaseDocumentProcessor(supabase_config, aryn_config)
processor.chunk_size = 1500  # Larger chunks
processor.chunk_overlap = 150  # More overlap
```

### Batch Processing
```python
# Process multiple PDFs
pdf_files = ["doc1.pdf", "doc2.pdf", "doc3.pdf"]
workspace_id = "your-workspace"

for pdf_file in pdf_files:
    result = doc_query.process_local_pdf(pdf_file, workspace_id)
    print(f"Processed {pdf_file}: {result['success']}")
```

### Direct Database Queries
```python
# Use Supabase client directly for custom queries
client = doc_query.supabase

# Get document chunks
chunks = client.table("doc_chunks").select("*").eq("document_id", document_id).execute()

# Search with custom filters
results = client.rpc("match_document_chunks", {
    "query_embedding": query_embedding,
    "workspace_id": workspace_id,
    "match_threshold": 0.8,
    "match_count": 20
}).execute()
```

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Create .env file
cp .env.example .env
# Edit .env with your credentials
```

### 2. Install Dependencies
```bash
pip install -r requirements_supabase.txt
```

### 3. Database Setup
```bash
# Run the schema in your Supabase SQL editor
# File: database_schema.sql
```

### 4. Test Installation
```python
python example_supabase_usage.py quick
```

### 5. Full Example
```python
python example_supabase_usage.py
```

## 📊 Database Schema

### Documents Table
- `id`: UUID primary key
- `workspace_id`: Workspace identifier
- `filename`: Original filename
- `file_type`: File type (pdf, docx, etc.)
- `file_size`: File size in bytes
- `status`: Processing status
- `metadata`: JSONB metadata
- `upload_date`: Upload timestamp

### Doc Chunks Table
- `id`: UUID primary key
- `document_id`: Foreign key to documents
- `chunk_idx`: Chunk index within document
- `text`: Chunk text content
- `embedding`: Vector embedding (1536 dimensions)
- `metadata`: JSONB chunk metadata

### Key Functions
- `match_document_chunks()`: Vector similarity search
- `get_document_stats()`: Workspace statistics
- `search_documents_text()`: Text-based search fallback

## 🔍 Query Examples

### Semantic Search
```sql
-- Find similar chunks using vector search
SELECT * FROM match_document_chunks(
    query_embedding := '[0.1, 0.2, ...]'::vector,
    workspace_id := 'workspace-uuid',
    match_threshold := 0.7,
    match_count := 10
);
```

### Text Search
```sql
-- Fallback text search
SELECT * FROM search_documents_text(
    search_query := 'machine learning',
    workspace_id := 'workspace-uuid',
    match_count := 5
);
```

### Statistics
```sql
-- Get workspace statistics
SELECT * FROM get_document_stats('workspace-uuid');
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Supabase Connection Failed
```bash
# Check your credentials
echo $SUPABASE_URL
echo $SUPABASE_KEY

# Test connection
python -c "from supabase_config import SupabaseConfig; SupabaseConfig().test_connection()"
```

#### 2. OpenAI API Error
```bash
# Check API key
echo $OPENAI_API_KEY

# Test embedding generation
python -c "from embeddings import embed_text; print(embed_text('test'))"
```

#### 3. Aryn AI Error
```bash
# Check Aryn API key
echo $ARYN_API_KEY

# Test PDF parsing
python -c "from config import ArynConfig; print(ArynConfig())"
```

#### 4. Database Schema Issues
- Ensure pgvector extension is enabled
- Check that all tables are created
- Verify RLS policies if using authentication

### Performance Optimization

#### 1. Embedding Generation
- Process documents in batches
- Use appropriate chunk sizes
- Cache embeddings when possible

#### 2. Vector Search
- Ensure proper indexing
- Use appropriate similarity thresholds
- Limit result counts

#### 3. Database Queries
- Use proper indexes
- Optimize query patterns
- Consider connection pooling

## 🔐 Security

### Row Level Security (RLS)
- Documents are isolated by workspace
- Users can only access their workspace documents
- Chunks inherit document permissions

### API Keys
- Store credentials in environment variables
- Use Supabase service role key for admin operations
- Rotate API keys regularly

### Data Privacy
- Embeddings are stored locally in your database
- No data is sent to external services except OpenAI/Aryn
- Full control over your document data

## 📈 Monitoring

### Database Monitoring
```sql
-- Check document processing status
SELECT status, COUNT(*) FROM documents GROUP BY status;

-- Monitor chunk counts
SELECT workspace_id, COUNT(*) as chunk_count 
FROM doc_chunks dc
JOIN documents d ON dc.document_id = d.id
GROUP BY workspace_id;
```

### Performance Metrics
- Processing time per document
- Embedding generation time
- Query response times
- Database query performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review the example usage
3. Check Supabase and OpenAI documentation
4. Open an issue for bugs or feature requests
