"""
Embedding utilities for generating vector embeddings from document content.
"""
import openai
import os
from typing import List, Union
import re

# Try to load python-dotenv if available
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        load_dotenv()
except ImportError:
    pass

# Initialize OpenAI client with OpenAI API key
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def embed_text(text: str) -> List[float]:
    """
    Generate embedding for a single text string.
    
    Args:
        text: Text to embed
        
    Returns:
        List of float values representing the embedding vector
    """
    if not text or not text.strip():
        raise ValueError("Text cannot be empty")
    
    if not client.api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    
    try:
        response = client.embeddings.create(
            input=text.strip(),
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding
    except Exception as e:
        raise Exception(f"Failed to generate embedding: {str(e)}")


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for multiple text strings.
    
    Args:
        texts: List of texts to embed
        
    Returns:
        List of embedding vectors
    """
    if not texts:
        return []
    
    # Filter out empty texts
    valid_texts = [text.strip() for text in texts if text and text.strip()]
    
    if not valid_texts:
        raise ValueError("No valid texts to embed")
    
    if not client.api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    
    try:
        response = client.embeddings.create(
            input=valid_texts,
            model="text-embedding-ada-002"
        )
        return [item.embedding for item in response.data]
    except Exception as e:
        raise Exception(f"Failed to generate embeddings: {str(e)}")


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    """
    Split text into overlapping chunks for embedding.
    
    Args:
        text: Text to chunk
        chunk_size: Maximum size of each chunk in characters
        overlap: Number of characters to overlap between chunks
        
    Returns:
        List of text chunks
    """
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # Try to break at sentence boundary first
        if end < len(text):
            # Look for sentence endings
            sentence_endings = ['. ', '! ', '? ', '\n\n', '\n']
            best_break = -1
            
            for ending in sentence_endings:
                break_pos = text.rfind(ending, start, end)
                if break_pos > start + chunk_size * 0.7:  # Don't break too early
                    best_break = break_pos + len(ending)
                    break
            
            if best_break > 0:
                end = best_break
            else:
                # Fall back to word boundary
                last_space = text.rfind(' ', start, end)
                if last_space > start + chunk_size * 0.7:
                    end = last_space
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        # Move start position with overlap
        start = end - overlap
        if start >= len(text):
            break
    
    return chunks


def clean_text_for_embedding(text: str) -> str:
    """
    Clean text for better embedding generation.
    
    Args:
        text: Raw text to clean
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters that might interfere with embeddings
    text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\[\]\"\'\/]', '', text)
    
    # Remove multiple consecutive punctuation
    text = re.sub(r'([\.\,\!\?\;\:])\1+', r'\1', text)
    
    return text.strip()


def extract_text_from_parsed_element(element: dict) -> str:
    """
    Extract clean text from a parsed document element.
    
    Args:
        element: Parsed document element from Aryn AI
        
    Returns:
        Cleaned text content
    """
    # Get text representation
    text = element.get("text_representation", "")
    
    if not text:
        # Try alternative text fields
        text = element.get("text", "") or element.get("content", "")
    
    # Clean the text
    return clean_text_for_embedding(text)


def create_chunk_metadata(element: dict, chunk_idx: int, total_chunks: int) -> dict:
    """
    Create metadata for a document chunk.
    
    Args:
        element: Original parsed element
        chunk_idx: Index of this chunk
        total_chunks: Total number of chunks for this element
        
    Returns:
        Metadata dictionary
    """
    metadata = {
        "chunk_index": chunk_idx,
        "total_chunks": total_chunks,
        "element_type": element.get("type", "unknown"),
        "element_id": element.get("id", ""),
        "page_number": element.get("properties", {}).get("page_number", 0),
        "bbox": element.get("bbox", []),
        "confidence": element.get("properties", {}).get("score", 0.0)
    }
    
    # Add any additional properties
    if "properties" in element:
        for key, value in element["properties"].items():
            if key not in ["page_number", "score"]:
                metadata[f"prop_{key}"] = value
    
    return metadata
