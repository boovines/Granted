"""
Chat retriever for rolling chat memory and summarized long-term memory.
"""
from typing import List, Dict, Any, Optional
from db import get_supabase
from embeddings import embed_text
import openai
import os


def get_recent_messages(chat_id: str, n: int = 5) -> List[Dict[str, Any]]:
    """
    Get recent chat messages for context.
    
    Args:
        chat_id: Unique identifier for the chat session
        n: Number of recent messages to retrieve
        
    Returns:
        List of recent message dictionaries
    """
    try:
        supabase = get_supabase()
        
        result = supabase.table("chat_messages").select("role, content, created_at").eq("chat_id", chat_id).order("created_at", desc=True).limit(n).execute()
        
        # Reverse to get chronological order
        messages = result.data if result.data else []
        return list(reversed(messages))
        
    except Exception as e:
        print(f"Error retrieving recent messages for chat {chat_id}: {e}")
        return []


def get_summarized_memory(chat_id: str, query_vec: List[float], k: int = 3) -> List[str]:
    """
    Get relevant summarized memory using semantic similarity.
    
    Args:
        chat_id: Unique identifier for the chat session
        query_vec: Query embedding vector
        k: Number of top results to return
        
    Returns:
        List of relevant summary texts
    """
    try:
        supabase = get_supabase()
        
        # For now, we'll get recent summaries
        # In production, you'd want to use proper vector similarity search
        result = supabase.table("chat_summaries").select("summary").eq("chat_id", chat_id).order("updated_at", desc=True).limit(k).execute()
        
        if result.data:
            return [row["summary"] for row in result.data]
        else:
            return []
            
    except Exception as e:
        print(f"Error retrieving summarized memory for chat {chat_id}: {e}")
        return []


def store_chat_message(chat_id: str, role: str, content: str) -> bool:
    """
    Store a chat message with embedding.
    
    Args:
        chat_id: Unique identifier for the chat session
        role: Message role ('user' or 'assistant')
        content: Message content
        
    Returns:
        True if successful, False otherwise
    """
    try:
        supabase = get_supabase()
        
        # Generate embedding for the message
        message_embedding = embed_text(content)
        
        # Store the message
        supabase.table("chat_messages").insert({
            "chat_id": chat_id,
            "role": role,
            "content": content,
            "embedding": message_embedding
        }).execute()
        
        return True
        
    except Exception as e:
        print(f"Error storing chat message: {e}")
        return False


def should_summarize_chat(chat_id: str, message_count_threshold: int = 10) -> bool:
    """
    Check if chat should be summarized based on message count.
    
    Args:
        chat_id: Unique identifier for the chat session
        message_count_threshold: Threshold for triggering summarization
        
    Returns:
        True if chat should be summarized
    """
    try:
        supabase = get_supabase()
        
        # Count messages since last summary
        result = supabase.table("chat_messages").select("id", count="exact").eq("chat_id", chat_id).execute()
        
        message_count = result.count if hasattr(result, 'count') else len(result.data)
        
        return message_count >= message_count_threshold
        
    except Exception as e:
        print(f"Error checking if chat should be summarized: {e}")
        return False


def summarize_chat(chat_id: str) -> bool:
    """
    Summarize recent chat messages and store the summary.
    
    Args:
        chat_id: Unique identifier for the chat session
        
    Returns:
        True if successful, False otherwise
    """
    try:
        supabase = get_supabase()
        
        # Get recent messages that haven't been summarized
        result = supabase.table("chat_messages").select("role, content").eq("chat_id", chat_id).order("created_at", desc=True).limit(20).execute()
        
        if not result.data:
            return False
        
        # Format messages for summarization
        messages = list(reversed(result.data))  # Chronological order
        chat_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
        
        # Generate summary using OpenAI
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Summarize the following chat conversation in 2-3 sentences, focusing on key topics and decisions made."},
                {"role": "user", "content": chat_text}
            ],
            max_tokens=200
        )
        
        summary = response.choices[0].message["content"]
        
        # Generate embedding for the summary
        summary_embedding = embed_text(summary)
        
        # Store the summary
        supabase.table("chat_summaries").upsert({
            "chat_id": chat_id,
            "summary": summary,
            "embedding": summary_embedding
        }).execute()
        
        return True
        
    except Exception as e:
        print(f"Error summarizing chat {chat_id}: {e}")
        return False


def get_chat_history(chat_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get full chat history for a session.
    
    Args:
        chat_id: Unique identifier for the chat session
        limit: Maximum number of messages to retrieve
        
    Returns:
        List of chat messages
    """
    try:
        supabase = get_supabase()
        
        result = supabase.table("chat_messages").select("*").eq("chat_id", chat_id).order("created_at").limit(limit).execute()
        
        return result.data if result.data else []
        
    except Exception as e:
        print(f"Error retrieving chat history for chat {chat_id}: {e}")
        return []


def cleanup_old_messages(chat_id: str, keep_recent: int = 10) -> bool:
    """
    Clean up old messages, keeping only recent ones and summaries.
    
    Args:
        chat_id: Unique identifier for the chat session
        keep_recent: Number of recent messages to keep
        
    Returns:
        True if successful, False otherwise
    """
    try:
        supabase = get_supabase()
        
        # Get IDs of messages to keep (most recent ones)
        recent_result = supabase.table("chat_messages").select("id").eq("chat_id", chat_id).order("created_at", desc=True).limit(keep_recent).execute()
        
        if not recent_result.data:
            return True
        
        recent_ids = [msg["id"] for msg in recent_result.data]
        
        # Delete old messages (not in recent_ids)
        supabase.table("chat_messages").delete().eq("chat_id", chat_id).not_.in_("id", recent_ids).execute()
        
        return True
        
    except Exception as e:
        print(f"Error cleaning up old messages for chat {chat_id}: {e}")
        return False
