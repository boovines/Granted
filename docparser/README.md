# Document Parser with Aryn AI

A modular Python system for parsing and querying PDF and DOCX documents using [Aryn AI's DocParse API](https://docs.aryn.ai/docparse/). This system allows you to parse documents, extract structured data, and query them using natural language prompts.

## Features

- **Multi-Format Support**: Parse PDF and DOCX documents using Aryn AI's advanced document understanding models
- **Intelligent Caching**: Automatically caches parsed results and only re-parses when documents are modified
- **Structured Output**: Get JSON or Markdown output with labeled bounding boxes for titles, tables, images, and text
- **Document Querying**: Search through parsed documents using natural language queries
- **Modular Design**: Separate modules for configuration, parsing, and querying
- **Batch Processing**: Parse multiple documents at once (PDF, DOCX, or mixed)
- **Format-Specific Methods**: Dedicated parsing methods for PDF and DOCX files
- **Interactive Mode**: Command-line interface for interactive document exploration
- **Cache Management**: Check cache status and force re-parsing when needed

## Installation

### Quick Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd docparser
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up your API key**:
   
   **Option A: Using .env file (Recommended)**
   ```bash
   cp .env.example .env
   # Edit .env file and add your API key
   # Note: .env file should be in the docparser/ directory
   ```
   
   **Option B: Environment variable**
   ```bash
   export ARYN_API_KEY='your_api_key_here'
   ```
   
   **Option C: Direct in code**
   ```python
   from docquery import DocQuery
   dq = DocQuery(api_key='your_api_key_here')
   ```

4. **Get Aryn AI API Key**:
   - Sign up at [Aryn AI](https://aryn.ai) for a free account
   - Get your API key from the dashboard

### For Different Machines/Deployment

The code is designed to work across different machines:

- **Dependencies**: All required packages are in `requirements.txt`
- **Configuration**: Uses `.env` files or environment variables
- **API Keys**: Never committed to git (protected by `.gitignore`)
- **Parsed Documents**: Optionally excluded from git to keep repo size small

### Docker Support (Optional)

Create a `Dockerfile` for containerized deployment:

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["python", "docquery.py", "help"]
```

## Quick Start

### Simple Query (Command Line)

```bash
# Query documents directly from command line (works with PDF and DOCX)
python docquery.py "What is the main topic of this document?"

# Check cache status for all document types
python docquery.py cache

# Force re-parse all documents (ignores cache)
python docquery.py reparse

# List loaded documents
python docquery.py list

# Get document overview
python docquery.py overview shortpaper_parsed
```

### Programmatic Usage

```python
from docquery import DocQuery

# Initialize the system
doc_query = DocQuery()

# Parse PDFs with intelligent caching (only re-parses if PDFs changed)
doc_query.parse_pdfs()

# Parse DOCX files with intelligent caching
doc_query.parse_docx()

# Parse all document types (PDF and DOCX) at once
doc_query.parse_all_documents()

# Force re-parse all documents (ignores cache)
doc_query.parse_all_documents(force_reparse=True)

# Check cache status for all document types
cache_status = doc_query.get_cache_status()
print(f"PDF files: {len(cache_status['pdf_files'])}")
print(f"DOCX files: {len(cache_status['docx_files'])}")
print(f"Up-to-date cache: {len(cache_status['cached_files'])}")

# Load parsed documents
doc_query.load_documents()

# Query the documents
result = doc_query.query("What are the key findings?")
print(result)

# Get document overview
overview = doc_query.get_document_overview("document_name")
print(overview)
```

### Advanced Usage

```python
from docquery import quick_query

# One-liner for quick queries (auto-parses if needed, uses cache)
result = quick_query("Summarize the methodology used")
print(result)

# Force re-parse even if cache exists
result = quick_query("What are the conclusions?", force_reparse=True)
print(result)
```

## File Structure

```
docparser/
├── src/                          # PDF documents to parse
│   ├── longpaper.pdf
│   └── shortpaper.pdf
├── parsed_outputs/               # Parsed document outputs (auto-created)
├── config.py                     # Configuration module
├── pdf_parser.py                 # PDF parsing module
├── query_engine.py               # Document query engine
├── docquery.py                   # Main interface
├── example_usage.py              # Comprehensive example
├── requirements.txt              # Dependencies
└── README.md                     # This file
```

## Modules

### 1. Config Module (`config.py`)
- Manages Aryn AI API configuration
- Handles API key and base URL settings
- Provides request headers and endpoint URLs

### 2. PDF Parser (`pdf_parser.py`)
- Parses PDF documents using Aryn AI API
- Supports batch processing of multiple PDFs
- Extracts tables, images, metadata, and structured text
- Saves parsed data as JSON files

### 3. Query Engine (`query_engine.py`)
- Loads and indexes parsed documents
- Performs semantic search through document chunks
- Returns formatted responses with document links and references
- Provides document overviews and summaries

### 4. Main Interface (`docquery.py`)
- Simple interface combining parsing and querying
- Command-line interface for quick queries
- Convenience functions for common operations

## Intelligent Caching System

The system includes a sophisticated caching mechanism that significantly improves performance:

### How It Works
- **Automatic Detection**: Compares PDF file modification times with cached parsed results
- **Smart Re-parsing**: Only re-parses PDFs that have been modified since last parsing
- **Cache Validation**: Ensures cached data is always up-to-date
- **Performance Boost**: Subsequent queries use cached data, avoiding expensive API calls

### Cache Commands
```bash
# Check cache status
python docquery.py cache

# Force re-parse (ignore cache)
python docquery.py reparse
```

### Cache Status Example
```
📊 Cache Status:
  PDF files: 2
  ✅ Up-to-date cache: 2
  ⚠️  Outdated cache: 0
  ❌ Missing cache: 0

✅ Cached and up-to-date:
    - shortpaper.pdf
    - longpaper.pdf
```

## API Reference

### DocQuery Class

```python
class DocQuery:
    def __init__(self, api_key: Optional[str] = None)
    def parse_pdfs(self, pdf_directory: Optional[str] = None, force_reparse: bool = False) -> dict
    def parse_docx(self, docx_directory: Optional[str] = None, force_reparse: bool = False) -> dict
    def parse_all_documents(self, document_directory: Optional[str] = None, force_reparse: bool = False) -> dict
    def load_documents(self) -> bool
    def query(self, prompt: str, document_names: Optional[List[str]] = None, max_results: int = 10) -> str
    def get_document_overview(self, document_name: str) -> str
    def list_documents(self) -> List[str]
    def get_cache_status(self) -> dict
```

### Quick Query Function

```python
def quick_query(prompt: str, api_key: Optional[str] = None, force_reparse: bool = False) -> str
```

## Usage Examples

### Parse Documents
```python
from docquery import DocQuery

doc_query = DocQuery()

# Parse PDFs only
results = doc_query.parse_pdfs("/path/to/pdf/folder")

# Parse DOCX files only
results = doc_query.parse_docx("/path/to/docx/folder")

# Parse all document types (PDF and DOCX)
results = doc_query.parse_all_documents("/path/to/documents/folder")
```

### Query Documents
```python
# Query all documents
result = doc_query.query("What is the conclusion?")

# Query specific documents
result = doc_query.query("Find methodology", document_names=["paper1", "paper2"])

# Limit results
result = doc_query.query("Key findings", max_results=5)
```

### Interactive Mode
```python
python example_usage.py
```

This will:
1. Parse all PDFs in the `src/` folder
2. Load them into the query engine
3. Run example queries
4. Start interactive query mode

## Query Response Format

The query function returns formatted responses with:

- **Document information**: Name, type, page number
- **Content**: Relevant text chunks (truncated if too long)
- **Links**: Document references, chunk IDs, and bounding box locations
- **Relevance scores**: How well each result matches your query

Example response:
```
# Query Results for: 'What is the main topic?'

Found 3 relevant results:

## Result 1
**Document:** research_paper.pdf
**Type:** text
**Page:** 1
**Relevance Score:** 0.85

**Content:**
This paper presents a novel approach to machine learning...

**Location:** Page 1, Bounding Box: {'x': 100, 'y': 200, 'width': 400, 'height': 50}
**Source:** research_paper.pdf (Chunk ID: chunk_001)
```

## Configuration

### Environment Variables
- `ARYN_API_KEY`: Your Aryn AI API key (required)

### API Settings
- Base URL: `https://api.aryn.ai` (default)
- Timeout: 5 minutes for large documents
- Output format: JSON (default) or Markdown

## Error Handling

The system includes comprehensive error handling:
- Missing API key validation
- File not found errors
- Network request failures
- Invalid document formats
- Query processing errors

## Troubleshooting

### Common Issues

1. **API Key Error**:
   ```
   ValueError: Aryn API key is required
   ```
   **Solutions:**
   - Copy `.env.example` to `.env` and add your API key
   - Set environment variable: `export ARYN_API_KEY='your_key'`
   - Pass directly: `DocQuery(api_key='your_key')`

2. **Import Errors**:
   ```
   ImportError: aryn-sdk is required
   ```
   **Solution:** Install dependencies: `pip install -r requirements.txt`

3. **File Not Found**:
   ```
   FileNotFoundError: PDF file not found
   ```
   **Solution:** Check that PDF files exist in the `src/` directory

4. **No Documents Loaded**:
   ```
   ValueError: No documents loaded
   ```
   **Solution:** Parse PDFs first using `parse_pdfs()` method

5. **Environment Issues on Different Machines**:
   - Ensure Python 3.10+ is installed
   - Use virtual environments: `python -m venv venv && source venv/bin/activate`
   - Check API key is properly set in new environment

### Setup Script

Create a `setup.py` for easy installation:

```python
from setuptools import setup, find_packages

setup(
    name="pdf-docquery",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "aryn-sdk>=0.1.0",
        "requests>=2.31.0",
        "python-dotenv>=1.0.0",
    ],
    entry_points={
        'console_scripts': [
            'docquery=docquery:main',
        ],
    },
)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the [Aryn AI Documentation](https://docs.aryn.ai/docparse/)
- Join the [Aryn AI Slack Community](https://aryn.ai/slack)
- Create an issue in this repository
