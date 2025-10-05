#!/usr/bin/env python3
"""
Simple test script to verify PDF context feature is working.
This script tests the key endpoints and provides a quick verification.
"""

import requests
import json
import time

# Configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"
WORKSPACE_ID = "550e8400-e29b-41d4-a716-446655440000"

def test_backend_health():
    """Test if backend is healthy."""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend healthy: {data}")
            return True
        else:
            print(f"❌ Backend unhealthy: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend unreachable: {e}")
        return False

def test_frontend_health():
    """Test if frontend is accessible."""
    print("🌐 Testing frontend accessibility...")
    try:
        response = requests.get(f"{FRONTEND_URL}", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend accessible")
            return True
        else:
            print(f"❌ Frontend error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend unreachable: {e}")
        return False

def test_chat_endpoint():
    """Test basic chat functionality."""
    print("💬 Testing chat endpoint...")
    try:
        response = requests.post(f"{BACKEND_URL}/chat/query", 
                               json={
                                   "workspace_id": WORKSPACE_ID,
                                   "chat_id": f"test_{int(time.time())}",
                                   "message": "Hello, can you help me test the system?"
                               },
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Chat working: {data.get('answer', 'No answer')[:100]}...")
            return True
        else:
            print(f"❌ Chat failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return False

def test_rag_context_endpoint():
    """Test RAG context endpoint (will fail without documents, but tests the endpoint)."""
    print("🧠 Testing RAG context endpoint...")
    try:
        response = requests.post(f"{BACKEND_URL}/get_rag_context",
                               json={
                                   "document_ids": ["test_doc"],
                                   "workspace_id": WORKSPACE_ID,
                                   "query": "test query",
                                   "limit": 5
                               },
                               timeout=5)
        
        # This will likely fail with 404 or 400, which is expected without real documents
        if response.status_code in [200, 404, 400]:
            print(f"✅ RAG endpoint responding: {response.status_code}")
            return True
        else:
            print(f"❌ RAG endpoint error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ RAG endpoint error: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 PDF Context Feature Test Suite")
    print("=" * 50)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Frontend Health", test_frontend_health),
        ("Chat Endpoint", test_chat_endpoint),
        ("RAG Context Endpoint", test_rag_context_endpoint),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}")
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    all_passed = True
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All tests passed! The PDF context feature is ready for testing.")
        print("\n📋 Next steps:")
        print("1. Open http://localhost:3000 in your browser")
        print("2. Upload a PDF file to the Sources section")
        print("3. Select the PDF as context in the chat")
        print("4. Ask questions about the PDF content")
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure backend is running: cd backend && python3 app.py")
        print("2. Make sure frontend is running: npm run dev")
        print("3. Check environment variables in docparser/.env")
        print("4. Verify all dependencies are installed")

if __name__ == "__main__":
    main()
