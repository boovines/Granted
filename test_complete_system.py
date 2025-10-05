#!/usr/bin/env python3
"""
Complete system test for the PDF context feature
"""
import requests
import json
import time

def test_backend_health():
    """Test backend health endpoint"""
    print("🔍 Testing backend health...")
    try:
        response = requests.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend healthy: {data}")
            return True
        else:
            print(f"❌ Backend unhealthy: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_chat_endpoint():
    """Test chat endpoint"""
    print("\n💬 Testing chat endpoint...")
    try:
        payload = {
            "workspace_id": "test-workspace",
            "chat_id": "test-chat",
            "message": "Hello! Can you help me test the system?"
        }
        response = requests.post(
            "http://localhost:8001/chat/query",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Chat endpoint working: {data['answer']}")
            return True
        else:
            print(f"❌ Chat endpoint failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Chat endpoint error: {e}")
        return False

def test_frontend_accessibility():
    """Test frontend accessibility"""
    print("\n🌐 Testing frontend accessibility...")
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            if "Cursor-Style Essay App" in response.text:
                print("✅ Frontend accessible and loading correctly")
                return True
            else:
                print("❌ Frontend accessible but content not found")
                return False
        else:
            print(f"❌ Frontend not accessible: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend connection failed: {e}")
        return False

def test_rag_context_endpoint():
    """Test RAG context endpoint (if available)"""
    print("\n🧠 Testing RAG context endpoint...")
    try:
        payload = {
            "document_ids": ["test-doc"],
            "workspace_id": "test-workspace",
            "query": "What is the main topic?",
            "limit": 5
        }
        response = requests.post(
            "http://localhost:8001/get_rag_context",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ RAG context endpoint working: {data}")
            return True
        else:
            print(f"⚠️  RAG context endpoint not available: {response.status_code}")
            return False
    except Exception as e:
        print(f"⚠️  RAG context endpoint not available: {e}")
        return False

def main():
    """Run complete system test"""
    print("🚀 Complete System Test for PDF Context Feature")
    print("=" * 50)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Chat Endpoint", test_chat_endpoint),
        ("Frontend Accessibility", test_frontend_accessibility),
        ("RAG Context Endpoint", test_rag_context_endpoint),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed >= 2:  # At least backend and frontend working
        print("\n🎉 System is ready for testing!")
        print("📝 You can now:")
        print("  1. Open http://localhost:3000 in your browser")
        print("  2. Test the chat functionality")
        print("  3. Upload PDFs and test the context feature")
    else:
        print("\n⚠️  Some critical components are not working")
        print("🔧 Please check the server logs and restart if needed")

if __name__ == "__main__":
    main()
