#!/usr/bin/env python3
"""
Test script for the PDF processing and RAG integration.
This script tests the complete flow from PDF upload to chat with RAG context.
"""

import requests
import json
import time
import os
from pathlib import Path

# Configuration
BACKEND_URL = "http://localhost:8000"
WORKSPACE_ID = "550e8400-e29b-41d4-a716-446655440000"
TEST_PDF_PATH = "docparser/src/shortpaper.pdf"  # Use existing test PDF

def test_backend_health():
    """Test if the backend is running and healthy."""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Backend is healthy: {health_data}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend not reachable: {e}")
        return False

def test_document_parsing():
    """Test document parsing endpoint."""
    print("\n📄 Testing document parsing...")
    
    # First, we need to create a document record in the database
    # This would normally be done by the frontend upload process
    document_id = f"test_doc_{int(time.time())}"
    
    # For this test, we'll assume the document is already in the database
    # In a real scenario, the frontend would have uploaded it first
    
    try:
        response = requests.post(f"{BACKEND_URL}/parse_document", 
                               json={
                                   "document_id": document_id,
                                   "workspace_id": WORKSPACE_ID
                               },
                               timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Document parsing successful: {result}")
            return document_id
        else:
            print(f"❌ Document parsing failed: {response.status_code} - {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Document parsing request failed: {e}")
        return None

def test_embeddings_retrieval(document_id):
    """Test embeddings retrieval."""
    print(f"\n🧠 Testing embeddings retrieval for document {document_id}...")
    
    try:
        response = requests.post(f"{BACKEND_URL}/get_embeddings",
                               json={
                                   "document_id": document_id,
                                   "workspace_id": WORKSPACE_ID,
                                   "query": "research methodology",
                                   "limit": 5
                               },
                               timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Embeddings retrieved: {result['count']} chunks found")
            return True
        else:
            print(f"❌ Embeddings retrieval failed: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Embeddings retrieval request failed: {e}")
        return False

def test_rag_context():
    """Test RAG context retrieval."""
    print("\n🔍 Testing RAG context retrieval...")
    
    try:
        response = requests.post(f"{BACKEND_URL}/get_rag_context",
                               json={
                                   "document_ids": ["test_doc_1", "test_doc_2"],  # Mock document IDs
                                   "workspace_id": WORKSPACE_ID,
                                   "query": "What is the main research question?",
                                   "limit": 10
                               },
                               timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ RAG context retrieved: {result['count']} chunks found")
            if result.get('context'):
                print(f"📝 Context preview: {result['context'][:200]}...")
            return True
        else:
            print(f"❌ RAG context retrieval failed: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ RAG context retrieval request failed: {e}")
        return False

def test_chat_with_rag():
    """Test chat endpoint with RAG context."""
    print("\n💬 Testing chat with RAG context...")
    
    try:
        response = requests.post(f"{BACKEND_URL}/chat/query",
                               json={
                                   "workspace_id": WORKSPACE_ID,
                                   "chat_id": f"test_chat_{int(time.time())}",
                                   "message": "What are the main findings in the research papers?"
                               },
                               timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Chat response received: {result.get('answer', 'No answer')[:200]}...")
            return True
        else:
            print(f"❌ Chat request failed: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Chat request failed: {e}")
        return False

def main():
    """Run all integration tests."""
    print("🚀 Starting PDF Processing and RAG Integration Tests")
    print("=" * 60)
    
    # Test 1: Backend Health
    if not test_backend_health():
        print("\n❌ Backend is not available. Please start the backend server first.")
        print("   Run: cd backend && python app.py")
        return
    
    # Test 2: Document Parsing (this will fail without actual documents in DB)
    print("\n⚠️  Note: Document parsing test requires actual documents in the database.")
    print("   This test will likely fail without proper setup.")
    document_id = test_document_parsing()
    
    # Test 3: Embeddings Retrieval
    if document_id:
        test_embeddings_retrieval(document_id)
    else:
        print("\n⏭️  Skipping embeddings test (no document ID)")
    
    # Test 4: RAG Context
    test_rag_context()
    
    # Test 5: Chat with RAG
    test_chat_with_rag()
    
    print("\n" + "=" * 60)
    print("🏁 Integration tests completed!")
    print("\n📋 Next steps:")
    print("1. Start the backend server: cd backend && python app.py")
    print("2. Start the frontend: npm run dev")
    print("3. Upload a PDF file through the frontend")
    print("4. Ask questions about the PDF in the chat interface")

if __name__ == "__main__":
    main()
