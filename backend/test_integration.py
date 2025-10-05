"""
Integration test script for the context orchestration pipeline.
"""
import os
import sys
import json
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db import get_supabase
from retrievers.rules_manager import get_rules, build_system_prompt, update_rules
from retrievers.live_doc_retriever import update_live_document_cache, get_live_context
from retrievers.chat_retriever import store_chat_message, get_recent_messages
from retrievers.pdf_retriever import get_pdf_context
from embeddings import embed_text
from prompt_builder import build_prompt


def test_database_connection():
    """Test database connection."""
    print("🔍 Testing database connection...")
    try:
        supabase = get_supabase()
        # Test a simple query
        result = supabase.table("rules").select("id").limit(1).execute()
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def test_rules_manager():
    """Test rules manager functionality."""
    print("\n🔍 Testing rules manager...")
    try:
        test_workspace_id = "test-workspace-123"
        test_rules = {
            "tone": "professional",
            "style": "clear and concise",
            "constraints": "Be accurate and helpful",
            "domain": "technical writing"
        }
        
        # Update rules
        success = update_rules(test_workspace_id, test_rules)
        if not success:
            print("❌ Failed to update rules")
            return False
        
        # Get rules
        retrieved_rules = get_rules(test_workspace_id)
        if not retrieved_rules:
            print("❌ Failed to retrieve rules")
            return False
        
        # Build system prompt
        system_prompt = build_system_prompt(retrieved_rules)
        if not system_prompt:
            print("❌ Failed to build system prompt")
            return False
        
        print("✅ Rules manager test successful")
        print(f"   System prompt: {system_prompt[:100]}...")
        return True
        
    except Exception as e:
        print(f"❌ Rules manager test failed: {e}")
        return False


def test_embeddings():
    """Test embedding generation."""
    print("\n🔍 Testing embeddings...")
    try:
        test_text = "This is a test sentence for embedding generation."
        embedding = embed_text(test_text)
        
        if not embedding or len(embedding) != 1536:
            print(f"❌ Invalid embedding: length={len(embedding) if embedding else 0}")
            return False
        
        print("✅ Embeddings test successful")
        print(f"   Embedding dimension: {len(embedding)}")
        return True
        
    except Exception as e:
        print(f"❌ Embeddings test failed: {e}")
        return False


def test_live_doc_retriever():
    """Test live document retriever."""
    print("\n🔍 Testing live document retriever...")
    try:
        test_workspace_id = "test-workspace-123"
        test_filename = "test-document.txt"
        test_text = """
        This is a test document for the live document retriever.
        It contains multiple paragraphs with different topics.
        
        The first paragraph discusses the importance of context in AI systems.
        Context helps AI understand what the user is working on and provides relevant responses.
        
        The second paragraph talks about semantic search capabilities.
        By using embeddings, we can find relevant content even when exact keywords don't match.
        
        The third paragraph covers the integration with existing systems.
        This pipeline integrates with the docparser system for PDF processing.
        """
        
        # Update live document cache
        chunks_updated = update_live_document_cache(test_workspace_id, test_filename, test_text)
        if chunks_updated <= 0:
            print("❌ Failed to update live document cache")
            return False
        
        # Test retrieval
        query = "What does this document say about context?"
        query_vec = embed_text(query)
        live_context = get_live_context(test_workspace_id, query_vec, k=3)
        
        if not live_context:
            print("❌ Failed to retrieve live context")
            return False
        
        print("✅ Live document retriever test successful")
        print(f"   Chunks updated: {chunks_updated}")
        print(f"   Retrieved context: {len(live_context)} chunks")
        return True
        
    except Exception as e:
        print(f"❌ Live document retriever test failed: {e}")
        return False


def test_chat_retriever():
    """Test chat retriever functionality."""
    print("\n🔍 Testing chat retriever...")
    try:
        test_chat_id = "test-chat-123"
        
        # Store some test messages
        messages = [
            ("user", "Hello, I'm working on a technical document about AI systems."),
            ("assistant", "I'd be happy to help you with your technical document about AI systems. What specific aspects would you like to focus on?"),
            ("user", "I need help with the section about context and memory management."),
            ("assistant", "Context and memory management are crucial for AI systems. Would you like me to help you structure that section or provide specific information about these topics?"),
            ("user", "Can you help me explain how semantic search works?")
        ]
        
        for role, content in messages:
            success = store_chat_message(test_chat_id, role, content)
            if not success:
                print(f"❌ Failed to store message: {role}")
                return False
        
        # Test retrieval of recent messages
        recent_messages = get_recent_messages(test_chat_id, n=3)
        if not recent_messages:
            print("❌ Failed to retrieve recent messages")
            return False
        
        print("✅ Chat retriever test successful")
        print(f"   Messages stored: {len(messages)}")
        print(f"   Recent messages retrieved: {len(recent_messages)}")
        return True
        
    except Exception as e:
        print(f"❌ Chat retriever test failed: {e}")
        return False


def test_pdf_retriever():
    """Test PDF retriever functionality."""
    print("\n🔍 Testing PDF retriever...")
    try:
        test_workspace_id = "test-workspace-123"
        test_query = "What are the main topics discussed in the documents?"
        
        # Test PDF context retrieval
        pdf_context = get_pdf_context(test_workspace_id, test_query, k=3)
        
        # Note: This might return empty if no PDFs are loaded in the docparser system
        print("✅ PDF retriever test completed")
        print(f"   Retrieved context: {len(pdf_context)} chunks")
        if pdf_context:
            print(f"   Sample context: {pdf_context[0][:100]}...")
        else:
            print("   No PDF context available (this is normal if no PDFs are loaded)")
        return True
        
    except Exception as e:
        print(f"❌ PDF retriever test failed: {e}")
        return False


def test_prompt_builder():
    """Test the complete prompt building pipeline."""
    print("\n🔍 Testing prompt builder...")
    try:
        test_workspace_id = "test-workspace-123"
        test_chat_id = "test-chat-123"
        test_message = "Can you help me summarize the key points from my document?"
        
        # Build comprehensive prompt
        prompt = build_prompt(test_workspace_id, test_chat_id, test_message)
        
        if not prompt:
            print("❌ Failed to build prompt")
            return False
        
        print("✅ Prompt builder test successful")
        print(f"   Prompt length: {len(prompt)} characters")
        print(f"   Prompt preview: {prompt[:200]}...")
        return True
        
    except Exception as e:
        print(f"❌ Prompt builder test failed: {e}")
        return False


def cleanup_test_data():
    """Clean up test data."""
    print("\n🧹 Cleaning up test data...")
    try:
        supabase = get_supabase()
        
        # Clean up test rules
        supabase.table("rules").delete().eq("workspace_id", "test-workspace-123").execute()
        
        # Clean up test live docs
        supabase.table("live_docs").delete().eq("workspace_id", "test-workspace-123").execute()
        
        # Clean up test chat messages
        supabase.table("chat_messages").delete().eq("chat_id", "test-chat-123").execute()
        
        print("✅ Test data cleanup completed")
        
    except Exception as e:
        print(f"⚠️  Cleanup warning: {e}")


def main():
    """Run all integration tests."""
    print("🚀 Starting Context Orchestration Pipeline Integration Tests\n")
    
    tests = [
        test_database_connection,
        test_rules_manager,
        test_embeddings,
        test_live_doc_retriever,
        test_chat_retriever,
        test_pdf_retriever,
        test_prompt_builder
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The context orchestration pipeline is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the configuration and try again.")
    
    # Clean up test data
    cleanup_test_data()
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
