# PDF Context Feature Testing Guide

This guide will help you test the PDF context feature step by step.

## 🚀 Quick Start Testing

### 1. Prerequisites Check

First, make sure you have the required environment variables set up:

```bash
# Check if you have a .env file in the docparser directory
ls docparser/.env

# If not, create one with these variables:
# OPENAI_API_KEY=your_openai_api_key
# ARYN_API_KEY=your_aryn_api_key  
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_anon_key
```

### 2. Start the Backend Server

```bash
cd backend
python3 app.py
```

You should see output like:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 3. Start the Frontend

In a new terminal:
```bash
npm run dev
```

The frontend should start on `http://localhost:5173`

## 🧪 Testing Steps

### Step 1: Verify Backend Health

Open a new terminal and run:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected", 
  "openai": "configured"
}
```

### Step 2: Test PDF Upload

1. **Open the frontend** at `http://localhost:5173`
2. **Navigate to the Sources section** in the left panel
3. **Click the "+" button** next to "Sources"
4. **Select "Upload"** from the dropdown
5. **Choose a PDF file** (you can use `docparser/src/shortpaper.pdf` for testing)
6. **Watch for processing indicators** in the header

Expected behavior:
- ✅ File uploads to Supabase Storage
- ✅ Document record is created in database
- ✅ Processing status shows in header
- ✅ PDF appears in Sources list
- ✅ Toast notifications show progress

### Step 3: Test Chat with PDF Context

1. **Select the uploaded PDF** as context:
   - Click the "@ Add Context" button in the chat
   - Select your uploaded PDF from the list
2. **Ask a question** about the PDF content, for example:
   - "What is this document about?"
   - "Summarize the main points"
   - "What are the key findings?"
3. **Send the message** and wait for the AI response

Expected behavior:
- ✅ AI response references the PDF content
- ✅ Response is relevant to the document
- ✅ Citations or references to the document appear

### Step 4: Test Multiple PDFs

1. **Upload another PDF** to the Sources
2. **Select both PDFs** as context
3. **Ask a comparative question**, for example:
   - "Compare the main topics in these documents"
   - "What are the differences between these papers?"

## 🔍 Debugging Tips

### Check Backend Logs

If something isn't working, check the backend terminal for error messages.

### Test API Endpoints Directly

You can test the endpoints directly using curl:

```bash
# Test document parsing (replace with actual document ID)
curl -X POST http://localhost:8000/parse_document \
  -H "Content-Type: application/json" \
  -d '{"document_id": "your_document_id", "workspace_id": "550e8400-e29b-41d4-a716-446655440000"}'

# Test RAG context retrieval
curl -X POST http://localhost:8000/get_rag_context \
  -H "Content-Type: application/json" \
  -d '{"document_ids": ["doc1", "doc2"], "workspace_id": "550e8400-e29b-41d4-a716-446655440000", "query": "test query", "limit": 10}'
```

### Check Database

If you have access to your Supabase dashboard:
1. Check the `sources` table for uploaded files
2. Check the `documents` table for processing status
3. Check the `doc_chunks` table for embeddings

## 🐛 Common Issues and Solutions

### Issue: "Backend not available"
**Solution**: Make sure the backend server is running on port 8000

### Issue: "Document parsing failed"
**Solution**: 
- Check if Aryn API key is set correctly
- Verify the PDF file is valid
- Check backend logs for specific error messages

### Issue: "No RAG context found"
**Solution**:
- Ensure the document was parsed successfully (status = "parsed")
- Check if embeddings were generated (doc_chunks table)
- Verify the document ID mapping

### Issue: "AI responses are generic"
**Solution**:
- Make sure PDFs are selected as context
- Check if RAG context is being retrieved
- Verify the chat API is using `use_rag: true`

## 📊 Success Indicators

You'll know the feature is working when:

1. ✅ **Upload**: PDFs upload without errors
2. ✅ **Processing**: Status indicators show parsing progress  
3. ✅ **Context**: PDFs appear in context selection
4. ✅ **RAG**: AI responses reference specific PDF content
5. ✅ **Citations**: Responses include document references

## 🎯 Test Scenarios

### Scenario 1: Single PDF Analysis
- Upload a research paper
- Ask: "What is the main research question?"
- Expect: Specific answer referencing the paper

### Scenario 2: Multi-Document Comparison  
- Upload 2-3 related documents
- Ask: "Compare the methodologies used"
- Expect: Comparative analysis across documents

### Scenario 3: Specific Information Retrieval
- Upload a technical document
- Ask: "What are the key statistics mentioned?"
- Expect: Specific numbers and data from the document

## 📝 Test Results Template

```
Test Date: ___________
Backend Status: ✅/❌
Frontend Status: ✅/❌

PDF Upload Test:
- File 1: ✅/❌ (filename: ___________)
- File 2: ✅/❌ (filename: ___________)

Chat Context Test:
- Single PDF: ✅/❌
- Multiple PDFs: ✅/❌
- RAG Responses: ✅/❌

Issues Found:
- ________________
- ________________

Overall Status: ✅ Working / ❌ Needs Fixes
```

## 🚀 Next Steps

Once testing is complete:
1. Document any issues found
2. Test with different PDF types and sizes
3. Verify performance with large documents
4. Test error handling scenarios
