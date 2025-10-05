"""
Test the updated backend integration with Supabase docparser.
"""
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from retrievers.pdf_retriever import get_pdf_context, search_pdf_documents
from retrievers.rules_manager import get_hardcoded_rules
from prompt_builder import build_prompt


def test_pdf_retriever():
    """Test the updated PDF retriever with Supabase integration."""
    
    print("🧪 Testing PDF Retriever Integration")
    print("="*50)
    
    try:
        # Test workspace ID (the one we set up earlier)
        workspace_id = "550e8400-e29b-41d4-a716-446655440000"
        
        # Test query
        query = "What is the experimental procedure?"
        
        print(f"🔍 Searching for: '{query}'")
        print(f"📁 Workspace: {workspace_id}")
        
        # Test the PDF retriever
        results = get_pdf_context(workspace_id, query, k=3)
        
        if results:
            print(f"✅ Found {len(results)} results:")
            for i, result in enumerate(results, 1):
                print(f"   {i}. {result[:100]}...")
        else:
            print("❌ No results found")
        
        return len(results) > 0
        
    except Exception as e:
        print(f"❌ PDF retriever test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_hardcoded_rules():
    """Test the hardcoded rules."""
    
    print(f"\n🧪 Testing Hardcoded Rules")
    print("="*30)
    
    try:
        rules = get_hardcoded_rules()
        
        if "GreenFuture Alliance" in rules and "solar microgrid" in rules:
            print("✅ Hardcoded rules loaded successfully")
            print(f"   Length: {len(rules)} characters")
            print(f"   Contains grant proposal guidelines: ✓")
            return True
        else:
            print("❌ Hardcoded rules missing expected content")
            return False
            
    except Exception as e:
        print(f"❌ Rules test failed: {e}")
        return False


def test_prompt_builder():
    """Test the prompt builder integration."""
    
    print(f"\n🧪 Testing Prompt Builder")
    print("="*30)
    
    try:
        workspace_id = "550e8400-e29b-41d4-a716-446655440000"
        chat_id = "test-chat-123"
        user_message = "Help me write the executive summary for the grant proposal"
        
        print(f"🔧 Building prompt...")
        print(f"   Workspace: {workspace_id}")
        print(f"   Chat: {chat_id}")
        print(f"   Message: {user_message}")
        
        prompt = build_prompt(workspace_id, chat_id, user_message)
        
        if prompt and "GreenFuture Alliance" in prompt:
            print("✅ Prompt built successfully")
            print(f"   Length: {len(prompt)} characters")
            print(f"   Contains hardcoded rules: ✓")
            
            # Check if PDF context was included
            if "=== RELEVANT SOURCE MATERIAL ===" in prompt:
                print("   Contains PDF source material: ✓")
            else:
                print("   Contains PDF source material: ⚠️  (no PDF results found)")
            
            return True
        else:
            print("❌ Prompt missing expected content")
            return False
            
    except Exception as e:
        print(f"❌ Prompt builder test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main test function."""
    
    print("🚀 Backend Integration Test Suite")
    print("="*60)
    
    tests = [
        ("PDF Retriever Integration", test_pdf_retriever),
        ("Hardcoded Rules", test_hardcoded_rules),
        ("Prompt Builder Integration", test_prompt_builder)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"🧪 Running: {test_name}")
        print('='*60)
        
        try:
            if test_func():
                print(f"✅ {test_name} PASSED")
                passed += 1
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} CRASHED: {e}")
    
    print(f"\n{'='*60}")
    print(f"📊 TEST RESULTS: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All integration tests passed!")
        print("\n✅ Your backend is ready with:")
        print("   - Supabase-integrated PDF retrieval")
        print("   - Hardcoded grant proposal rules")
        print("   - Context orchestration pipeline")
        print("   - Semantic search capabilities")
    else:
        print("⚠️  Some tests failed. Please check the configuration.")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
