"""
Prompt builder that orchestrates all context sources into a coherent model call.
"""
from typing import List, Dict, Any, Optional
from embeddings import embed_text
from retrievers.rules_manager import get_rules, build_system_prompt, get_hardcoded_rules
from retrievers.pdf_retriever import get_pdf_context
from retrievers.live_doc_retriever import get_live_context
from retrievers.chat_retriever import get_recent_messages, get_summarized_memory


def build_prompt(workspace_id: str, chat_id: str, user_message: str, 
                max_context_length: int = 8000) -> str:
    """
    Build comprehensive prompt by combining all context sources.
    
    Args:
        workspace_id: Unique identifier for the workspace
        chat_id: Unique identifier for the chat session
        user_message: User's query message
        max_context_length: Maximum length of context to include
        
    Returns:
        Formatted prompt string ready for the model
    """
    try:
        # Generate query embedding for semantic search
        query_vec = embed_text(user_message)
        
        # 1. Get system prompt from hardcoded rules
        system_prompt = get_hardcoded_rules()
        
        # 2. Get recent chat context
        recent_chat = get_recent_messages(chat_id, n=5)
        
        # 3. Get summarized memory
        recalled_memory = get_summarized_memory(chat_id, query_vec, k=3)
        
        # 4. Get live document context
        live_context = get_live_context(workspace_id, query_vec, k=5)
        
        # 5. Get PDF source material context
        pdf_context = get_pdf_context(workspace_id, user_message, k=5)
        
        # Build the comprehensive prompt
        prompt_parts = [system_prompt]
        
        # Add recent chat context
        if recent_chat:
            prompt_parts.append("\n=== RECENT CONVERSATION ===")
            for msg in recent_chat:
                role = "User" if msg["role"] == "user" else "Assistant"
                prompt_parts.append(f"{role}: {msg['content']}")
        
        # Add summarized memory
        if recalled_memory:
            prompt_parts.append("\n=== RELEVANT PAST TOPICS ===")
            for memory in recalled_memory:
                prompt_parts.append(f"- {memory}")
        
        # Add live document context
        if live_context:
            prompt_parts.append("\n=== CURRENT DOCUMENT CONTEXT ===")
            for i, chunk in enumerate(live_context, 1):
                prompt_parts.append(f"[Document Chunk {i}]\n{chunk}")
        
        # Add PDF source material
        if pdf_context:
            prompt_parts.append("\n=== RELEVANT SOURCE MATERIAL ===")
            for i, chunk in enumerate(pdf_context, 1):
                prompt_parts.append(f"[Source {i}]\n{chunk}")
        
        # Add user query
        prompt_parts.append(f"\n=== USER QUERY ===")
        prompt_parts.append(user_message)
        
        # Combine all parts
        full_prompt = "\n".join(prompt_parts)
        
        # Truncate if too long (simple approach - in production you'd want smarter truncation)
        if len(full_prompt) > max_context_length:
            # Keep system prompt and user query, truncate context
            context_parts = full_prompt.split("\n=== USER QUERY ===")
            if len(context_parts) == 2:
                system_and_context = context_parts[0]
                user_query = context_parts[1]
                
                # Truncate context part
                max_context_part_length = max_context_length - len(user_query) - 100  # buffer
                if len(system_and_context) > max_context_part_length:
                    # Keep system prompt and truncate context
                    system_prompt_end = system_and_context.find("\n=== RECENT CONVERSATION ===")
                    if system_prompt_end > 0:
                        system_prompt = system_and_context[:system_prompt_end]
                        context_part = system_and_context[system_prompt_end:]
                        
                        # Truncate context part
                        if len(context_part) > max_context_part_length - len(system_prompt):
                            context_part = context_part[:max_context_part_length - len(system_prompt) - 100] + "\n... [Context truncated due to length]"
                        
                        full_prompt = system_prompt + context_part + "\n=== USER QUERY ===" + user_query
        
        return full_prompt
        
    except Exception as e:
        # Fallback to simple prompt if orchestration fails
        print(f"Error building comprehensive prompt: {e}")
        return f"You are a helpful assistant.\n\nUser query: {user_message}"


def format_messages(messages: List[Dict[str, Any]]) -> str:
    """
    Format chat messages for inclusion in prompt.
    
    Args:
        messages: List of message dictionaries
        
    Returns:
        Formatted messages string
    """
    if not messages:
        return "No recent conversation."
    
    formatted = []
    for msg in messages:
        role = "User" if msg["role"] == "user" else "Assistant"
        formatted.append(f"{role}: {msg['content']}")
    
    return "\n".join(formatted)


def format_snippets(snippets: List[str], max_length: int = 500) -> str:
    """
    Format text snippets for inclusion in prompt.
    
    Args:
        snippets: List of text snippets
        max_length: Maximum length per snippet
        
    Returns:
        Formatted snippets string
    """
    if not snippets:
        return "No relevant information found."
    
    formatted = []
    for i, snippet in enumerate(snippets, 1):
        # Truncate if too long
        if len(snippet) > max_length:
            snippet = snippet[:max_length] + "..."
        formatted.append(f"[{i}] {snippet}")
    
    return "\n---\n".join(formatted)


def build_simple_prompt(user_message: str, context: Optional[str] = None) -> str:
    """
    Build a simple prompt for testing or fallback scenarios.
    
    Args:
        user_message: User's query message
        context: Optional context string
        
    Returns:
        Simple formatted prompt
    """
    prompt = "You are a helpful assistant.\n\n"
    
    if context:
        prompt += f"Context: {context}\n\n"
    
    prompt += f"User query: {user_message}"
    
    return prompt


def estimate_token_count(text: str) -> int:
    """
    Rough estimation of token count for text.
    
    Args:
        text: Text to estimate
        
    Returns:
        Estimated token count
    """
    # Rough approximation: 1 token ≈ 4 characters for English text
    return len(text) // 4


def truncate_context_by_tokens(text: str, max_tokens: int) -> str:
    """
    Truncate context to fit within token limit.
    
    Args:
        text: Text to truncate
        max_tokens: Maximum token count
        
    Returns:
        Truncated text
    """
    estimated_tokens = estimate_token_count(text)
    
    if estimated_tokens <= max_tokens:
        return text
    
    # Calculate truncation ratio
    ratio = max_tokens / estimated_tokens
    target_length = int(len(text) * ratio)
    
    # Try to truncate at word boundary
    truncated = text[:target_length]
    last_space = truncated.rfind(' ')
    
    if last_space > target_length * 0.9:  # If we can find a good word boundary
        truncated = truncated[:last_space]
    
    return truncated + "\n... [Context truncated due to length limit]"
