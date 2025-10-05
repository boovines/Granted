"""
Embedding utilities for generating vector embeddings.
"""
import openai
import os
from typing import List, Union
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

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
    
    try:
        response = openai.Embedding.create(
            input=text.strip(),
            model="text-embedding-ada-002"
        )
        return response.data[0]["embedding"]
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
    
    try:
        response = openai.Embedding.create(
            input=valid_texts,
            model="text-embedding-ada-002"
        )
        return [item["embedding"] for item in response.data]
    except Exception as e:
        raise Exception(f"Failed to generate embeddings: {str(e)}")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
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
        
        # Try to break at word boundary
        if end < len(text):
            # Look for the last space before the end
            last_space = text.rfind(' ', start, end)
            if last_space > start:
                end = last_space
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        # Move start position with overlap
        start = end - overlap
        if start >= len(text):
            break
    
    return chunks
