"""
Document query engine for searching and retrieving information from parsed documents.
"""
import json
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path

try:
    from aryn_sdk.client.client import Client
except ImportError:
    Client = None

from config import ArynConfig


class QueryEngine:
    """Query engine for searching parsed documents."""
    
    def __init__(self, config: ArynConfig):
        """
        Initialize query engine.
        
        Args:
            config: ArynConfig instance with API settings
        """
        self.config = config
        if Client is None:
            raise ImportError("aryn-sdk is required. Please install it with: pip install aryn-sdk")
        
        self.client = Client(aryn_api_key=config.api_key)
        self.parsed_documents: Dict[str, Dict[str, Any]] = {}
    
    def load_parsed_document(self, document_path: str, document_name: Optional[str] = None):
        """
        Load a parsed document from JSON file.
        
        Args:
            document_path: Path to the parsed document JSON file
            document_name: Optional name for the document (defaults to filename)
        """
        with open(document_path, 'r', encoding='utf-8') as f:
            parsed_data = json.load(f)
        
        name = document_name or Path(document_path).stem
        self.parsed_documents[name] = parsed_data
        print(f"Loaded document: {name}")
    
    def load_parsed_documents(self, documents_directory: str):
        """
        Load multiple parsed documents from a directory.
        
        Args:
            documents_directory: Directory containing parsed document JSON files
        """
        docs_dir = Path(documents_directory)
        if not docs_dir.exists():
            raise FileNotFoundError(f"Directory not found: {documents_directory}")
        
        json_files = list(docs_dir.glob("*.json"))
        for json_file in json_files:
            self.load_parsed_document(str(json_file))
    
    def query_documents(self, prompt: str, document_names: Optional[List[str]] = None, 
                       max_results: int = 10, docset_id: Optional[str] = None) -> str:
        """
        Query documents with a prompt and return formatted response with links.
        
        Args:
            prompt: The query prompt
            document_names: Optional list of specific documents to search (searches all if None)
            max_results: Maximum number of results to return
            docset_id: Optional Aryn docset ID for vector search
            
        Returns:
            Formatted string response with query results and links
            
        Raises:
            ValueError: If no documents are loaded and no docset_id provided
        """
        # Try Aryn vector search first if docset_id is provided
        if docset_id:
            try:
                # Use the client's search method directly
                results = self.client.search(docset_id=docset_id, query=prompt)
                return self._format_aryn_search_response(prompt, results)
            except Exception as e:
                print(f"Vector search failed, falling back to local search: {e}")
        
        # Fallback to local search through parsed documents
        if not self.parsed_documents:
            raise ValueError("No documents loaded and no docset_id provided. Please load parsed documents first or provide a docset_id.")
        
        # Filter documents if specific names provided
        search_docs = document_names if document_names else list(self.parsed_documents.keys())
        available_docs = [doc for doc in search_docs if doc in self.parsed_documents]
        
        if not available_docs:
            return "No matching documents found."
        
        # Search through elements in the specified documents
        results = []
        for doc_name in available_docs:
            doc_data = self.parsed_documents[doc_name]
            elements = doc_data.get("elements", [])
            
            # Enhanced search through elements
            for i, element in enumerate(elements):
                element_text_raw = element.get("text_representation", "")
                if element_text_raw is None:
                    element_text_raw = ""
                element_text = element_text_raw.lower()
                element_type = element.get("type", "unknown")
                
                # Check if any keyword from prompt appears in the text
                if element_text and any(keyword.lower() in element_text for keyword in prompt.split()):
                    results.append({
                        "document": doc_name,
                        "element_id": i,
                        "text": element_text_raw,
                        "type": element_type,
                        "page": element.get("properties", {}).get("page_number", 0),
                        "bbox": element.get("bbox", []),
                        "score": element.get("properties", {}).get("score", 0),
                        "relevance_score": self._calculate_relevance(element_text, prompt)
                    })
        
        # Sort by relevance score and limit results
        results.sort(key=lambda x: x["relevance_score"], reverse=True)
        results = results[:max_results]
        
        return self._format_query_response(prompt, results)
    
    def _format_aryn_search_response(self, prompt: str, results: Any) -> str:
        """
        Format Aryn SDK search results into a readable response.
        
        Args:
            prompt: Original query prompt
            results: Results from Aryn SDK search
            
        Returns:
            Formatted string response
        """
        if not results:
            return f"No relevant information found for query: '{prompt}'"
        
        response = f"# Query Results for: '{prompt}'\n\n"
        response += f"Found {len(results)} relevant results from Aryn vector search:\n\n"
        
        for i, result in enumerate(results, 1):
            response += f"## Result {i}\n"
            
            # Extract information from Aryn result object
            if hasattr(result, 'text'):
                text = result.text
            elif hasattr(result, 'content'):
                text = result.content
            else:
                text = str(result)
            
            # Truncate if too long
            if len(text) > 500:
                text = text[:500] + "..."
            
            response += f"**Content:**\n{text}\n\n"
            
            # Add metadata if available
            if hasattr(result, 'metadata'):
                metadata = result.metadata
                if metadata:
                    response += "**Metadata:**\n"
                    for key, value in metadata.items():
                        response += f"- {key}: {value}\n"
                    response += "\n"
            
            # Add source information
            if hasattr(result, 'source'):
                response += f"**Source:** {result.source}\n"
            elif hasattr(result, 'filename'):
                response += f"**Source:** {result.filename}\n"
            
            response += "---\n\n"
        
        return response
    
    def _calculate_relevance(self, chunk_text: str, prompt: str) -> float:
        """
        Calculate relevance score between chunk text and prompt.
        
        Args:
            chunk_text: Text content of the chunk
            prompt: Query prompt
            
        Returns:
            Relevance score (0.0 to 1.0)
        """
        if not chunk_text or not prompt:
            return 0.0
            
        prompt_words = set(prompt.lower().split())
        chunk_words = set(chunk_text.split())
        
        if not prompt_words or not chunk_words:
            return 0.0
        
        # Calculate Jaccard similarity
        intersection = len(prompt_words.intersection(chunk_words))
        union = len(prompt_words.union(chunk_words))
        
        return intersection / union if union > 0 else 0.0
    
    def _format_query_response(self, prompt: str, results: List[Dict[str, Any]]) -> str:
        """
        Format query results into a readable response with links.
        
        Args:
            prompt: Original query prompt
            results: List of search results
            
        Returns:
            Formatted string response
        """
        if not results:
            return f"No relevant information found for query: '{prompt}'"
        
        response = f"# Query Results for: '{prompt}'\n\n"
        response += f"Found {len(results)} relevant results:\n\n"
        
        for i, result in enumerate(results, 1):
            response += f"## Result {i}\n"
            response += f"**Document:** {result['document']}\n"
            response += f"**Type:** {result['type']}\n"
            response += f"**Page:** {result['page']}\n"
            response += f"**Relevance Score:** {result['relevance_score']:.2f}\n\n"
            
            # Add the text content (truncated if too long)
            text = result['text']
            if len(text) > 500:
                text = text[:500] + "..."
            response += f"**Content:**\n{text}\n\n"
            
            # Add links/references
            if result['bbox']:
                response += f"**Location:** Page {result['page']}, Bounding Box: {result['bbox']}\n"
            
            # Add document reference link
            response += f"**Source:** {result['document']} (Element ID: {result['element_id']})\n"
            response += "---\n\n"
        
        return response
    
    def get_document_overview(self, document_name: str) -> str:
        """
        Get an overview of a specific document.
        
        Args:
            document_name: Name of the document
            
        Returns:
            Formatted overview string
            
        Raises:
            KeyError: If document not found
        """
        if document_name not in self.parsed_documents:
            raise KeyError(f"Document '{document_name}' not found")
        
        doc_data = self.parsed_documents[document_name]
        elements = doc_data.get("elements", [])
        
        # Find title from elements
        title = "Unknown"
        for element in elements:
            if element.get("type") == "Title":
                title = element.get("text_representation", "Unknown")
                break
        
        # Count different element types
        type_counts = {}
        page_numbers = set()
        
        for element in elements:
            element_type = element.get("type", "unknown")
            type_counts[element_type] = type_counts.get(element_type, 0) + 1
            
            page_num = element.get("properties", {}).get("page_number", 0)
            if page_num > 0:
                page_numbers.add(page_num)
        
        summary = {
            "title": title,
            "page_count": len(page_numbers),
            "element_count": len(elements),
            "element_types": type_counts,
            "status_code": doc_data.get("status_code", "unknown")
        }
        
        overview = f"# Document Overview: {document_name}\n\n"
        overview += f"**Title:** {summary['title']}\n"
        overview += f"**Pages:** {summary['page_count']}\n"
        overview += f"**Elements:** {summary['element_count']}\n"
        overview += f"**Status:** {summary['status_code']}\n\n"
        
        if summary['element_types']:
            overview += "**Element Types:**\n"
            for element_type, count in summary['element_types'].items():
                overview += f"- {element_type}: {count}\n"
        
        return overview
    
    def list_loaded_documents(self) -> List[str]:
        """
        Get list of loaded document names.
        
        Returns:
            List of document names
        """
        return list(self.parsed_documents.keys())
