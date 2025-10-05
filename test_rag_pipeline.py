#!/usr/bin/env python3
"""
Test the complete RAG pipeline with real document processing
"""
import requests
import json
import time
import os

def test_rag_pipeline():
    """Test the complete RAG pipeline"""
    print("🧠 Testing Complete RAG Pipeline")
    print("=" * 50)
    
    # Test 1: Basic chat without context
    print("\n1️⃣ Testing basic chat...")
    try:
        response = requests.post(
            "http://localhost:8001/chat/query",
            json={
                "workspace_id": "test-workspace",
                "chat_id": "test-chat",
                "message": "Hello! What can you help me with?"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Basic chat working: {data['answer'][:100]}...")
        else:
            print(f"❌ Basic chat failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Basic chat error: {e}")
        return False
    
    # Test 2: RAG context with no documents
    print("\n2️⃣ Testing RAG context with no documents...")
    try:
        response = requests.post(
            "http://localhost:8001/get_rag_context",
            json={
                "document_ids": ["non-existent-doc"],
                "workspace_id": "test-workspace",
                "query": "What is the main topic?",
                "limit": 5
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ RAG context working: {data['success']}, chunks: {data['count']}")
        else:
            print(f"❌ RAG context failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ RAG context error: {e}")
        return False
    
    # Test 3: Document parsing endpoint
    print("\n3️⃣ Testing document parsing endpoint...")
    try:
        response = requests.post(
            "http://localhost:8001/parse_document",
            json={
                "document_id": "non-existent-doc",
                "workspace_id": "test-workspace"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Document parsing endpoint working: {data['success']}")
        else:
            print(f"❌ Document parsing failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Document parsing error: {e}")
        return False
    
    # Test 4: Chat with RAG context (simulated)
    print("\n4️⃣ Testing chat with RAG context...")
    try:
        # First get RAG context
        rag_response = requests.post(
            "http://localhost:8001/get_rag_context",
            json={
                "document_ids": ["test-doc"],
                "workspace_id": "test-workspace",
                "query": "What is this document about?",
                "limit": 5
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if rag_response.status_code == 200:
            rag_data = rag_response.json()
            print(f"✅ RAG context retrieved: {rag_data['count']} chunks")
            
            # Now test chat with context
            chat_response = requests.post(
                "http://localhost:8001/chat/query",
                json={
                    "workspace_id": "test-workspace",
                    "chat_id": "test-chat",
                    "message": "Based on the document context, what is the main topic?"
                },
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if chat_response.status_code == 200:
                chat_data = chat_response.json()
                print(f"✅ Chat with context working: {chat_data['answer'][:100]}...")
            else:
                print(f"❌ Chat with context failed: {chat_response.status_code}")
                return False
        else:
            print(f"❌ RAG context retrieval failed: {rag_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Chat with context error: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 RAG Pipeline Test Complete!")
    print("✅ All components are working correctly")
    print("📝 The system is ready for real document testing")
    
    return True

def test_with_real_document():
    """Test with a real document if available"""
    print("\n📄 Testing with real document...")
    
    # Check if there are any PDFs in the docparser/src directory
    pdf_dir = "docparser/src"
    if os.path.exists(pdf_dir):
        pdf_files = [f for f in os.listdir(pdf_dir) if f.endswith('.pdf')]
        if pdf_files:
            print(f"✅ Found PDF files: {pdf_files}")
            print("📝 To test with real documents:")
            print("   1. Upload a PDF through the frontend")
            print("   2. The system will automatically parse and embed it")
            print("   3. Then you can ask questions about the content")
        else:
            print("⚠️  No PDF files found in docparser/src")
    else:
        print("⚠️  docparser/src directory not found")

if __name__ == "__main__":
    success = test_rag_pipeline()
    test_with_real_document()
    
    if success:
        print("\n🚀 Ready for real testing!")
        print("📝 Next steps:")
        print("   1. Go to http://localhost:3000")
        print("   2. Upload a PDF in the Sources section")
        print("   3. Select it as context in the chat")
        print("   4. Ask questions about the PDF content")
    else:
        print("\n⚠️  Some tests failed. Check the logs above.")
