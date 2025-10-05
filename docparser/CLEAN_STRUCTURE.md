# DocParser - Clean Structure

## 🎯 Core Functionality Files

### **Main Components:**
- `supabase_config.py` - Supabase connection and configuration
- `embeddings.py` - OpenAI embeddings generation
- `pdf_parser.py` - PDF parsing with Aryn AI
- `supabase_docquery.py` - **Main interface for document queries and search**
- `supabase_processor.py` - Document processing and storage
- `config.py` - Aryn AI configuration

### **Database:**
- `schema.sql` - Database schema for Supabase setup

### **Dependencies:**
- `requirements_supabase.txt` - Python dependencies for Supabase integration
- `requirements.txt` - Basic dependencies

### **Documentation:**
- `README_SUPABASE.md` - Complete documentation for Supabase integration
- `README.md` - Original documentation

### **Examples:**
- `example_supabase_usage.py` - Examples for using Supabase integration
- `example_usage.py` - Original usage examples

## 🗂️ Data Directories

### **Parsed Outputs:**
- `parsed_outputs/` - JSON files from PDF parsing
- `query_outputs/` - Saved query results

### **Source Files:**
- `src/` - Sample PDF and document files

### **Temporary:**
- `temp/` - Temporary files during processing

## 🚀 Quick Start

### **1. Setup Database:**
```sql
-- Run schema.sql in your Supabase SQL Editor
```

### **2. Install Dependencies:**
```bash
pip install -r requirements_supabase.txt
```

### **3. Use the System:**
```python
from supabase_docquery import SupabaseDocQuery

# Initialize
doc_query = SupabaseDocQuery()

# Search documents
result = doc_query.query_documents(
    workspace_id="your-workspace-id",
    query="What is the experimental procedure?",
    limit=5
)
```

## ✅ What Was Cleaned Up

**Deleted 16 testing/debug files:**
- All `test_*.py` files
- All `check_*.py` files  
- All `debug_*.py` files
- All `setup_*.py` files
- Temporary schema files
- Cache directories

**Result:** Clean, production-ready codebase focused on core functionality.
