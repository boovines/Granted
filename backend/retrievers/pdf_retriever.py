"""
PDF retriever leveraging the Supabase-integrated docparser system for semantic document search.
"""
from typing import List, Dict, Any, Optional
import sys
import os
from pathlib import Path

# Add the docparser directory to the path so we can import its modules
current_dir = Path(__file__).parent
docparser_dir = current_dir.parent.parent / "docparser"
sys.path.insert(0, str(docparser_dir))

try:
    from supabase_docquery import SupabaseDocQuery
    from supabase_config import SupabaseConfig
except ImportError as e:
    print(f"Warning: Could not import Supabase docparser modules: {e}")
    print(f"Make sure you're running from the correct directory and docparser is properly set up")
    SupabaseDocQuery = None
    SupabaseConfig = None


class PDFRetriever:
    """PDF retriever that integrates with the Supabase docparser system."""
    
    def __init__(self):
        """Initialize the PDF retriever."""
        self.doc_query = None
        self.supabase_config = None
        self._initialize_supabase_doc_query()
    
    def _initialize_supabase_doc_query(self):
        """Initialize the SupabaseDocQuery system from docparser."""
        try:
            if SupabaseDocQuery and SupabaseConfig:
                # Initialize Supabase configuration
                self.supabase_config = SupabaseConfig()
                
                # Initialize DocQuery with Supabase integration
                self.doc_query = SupabaseDocQuery()
                
                print(f"✓ PDF retriever initialized with SupabaseDocQuery system")
                print(f"✓ Connected to Supabase database")
            else:
                print("Warning: SupabaseDocQuery not available")
        except Exception as e:
            print(f"Warning: Could not initialize SupabaseDocQuery: {e}")
    
    def get_pdf_context(self, workspace_id: str, query: str, k: int = 5) -> List[str]:
        """
        Retrieve relevant PDF context using semantic search from Supabase.
        
        Args:
            workspace_id: Unique identifier for the workspace
            query: Query string to search for
            k: Number of results to return
            
        Returns:
            List of relevant text chunks from PDFs
        """
        if not self.doc_query:
            print("PDF SupabaseDocQuery system not available")
            return []
        
        try:
            # Use the SupabaseDocQuery system to search documents
            result = self.doc_query.query_documents(
                workspace_id=workspace_id,
                query=query,
                limit=k
            )
            
            # Extract text chunks from the results
            if not result.get('success'):
                print(f"PDF search failed: {result.get('error', 'Unknown error')}")
                return []
            
            results = result.get('results', [])
            if not results:
                print("No PDF results found")
                return []
            
            # Extract text chunks from the search results
            chunks = []
            for item in results:
                text = item.get('text', '').strip()
                if text:
                    chunks.append(text)
            
            return chunks[:k] if chunks else []
            
        except Exception as e:
            print(f"Error retrieving PDF context: {e}")
            return []
    
    def get_document_overview(self, document_id: str) -> str:
        """
        Get overview of a specific document.
        
        Args:
            document_id: ID of the document
            
        Returns:
            Document overview string
        """
        if not self.doc_query:
            return "PDF SupabaseDocQuery system not available"
        
        try:
            result = self.doc_query.get_document_overview(document_id)
            if result.get('success'):
                return result.get('overview', 'No overview available')
            else:
                return f"Error getting document overview: {result.get('error')}"
        except Exception as e:
            return f"Error getting document overview: {e}"
    
    def list_available_documents(self, workspace_id: str) -> List[str]:
        """
        List all available PDF documents in a workspace.
        
        Args:
            workspace_id: Workspace to list documents from
            
        Returns:
            List of document information
        """
        if not self.doc_query:
            return []
        
        try:
            documents = self.doc_query.list_workspace_documents(workspace_id)
            return [doc.get('filename', f"Document {doc.get('id')}") for doc in documents]
        except Exception as e:
            print(f"Error listing documents: {e}")
            return []
    
    def search_specific_documents(self, workspace_id: str, query: str, document_ids: List[str], k: int = 5) -> List[str]:
        """
        Search specific documents only.
        
        Args:
            workspace_id: Workspace ID
            query: Query string
            document_ids: List of document IDs to search
            k: Number of results to return
            
        Returns:
            List of relevant text chunks
        """
        if not self.doc_query:
            return []
        
        try:
            # Use the SupabaseDocQuery system to search specific documents
            result = self.doc_query.query_documents(
                workspace_id=workspace_id,
                query=query,
                limit=k,
                document_ids=document_ids
            )
            
            # Extract text chunks from the results
            if not result.get('success'):
                print(f"PDF search failed: {result.get('error', 'Unknown error')}")
                return []
            
            results = result.get('results', [])
            if not results:
                print("No PDF results found for specific documents")
                return []
            
            # Extract text chunks from the search results
            chunks = []
            for item in results:
                text = item.get('text', '').strip()
                if text:
                    chunks.append(text)
            
            return chunks[:k] if chunks else []
            
        except Exception as e:
            print(f"Error searching specific documents: {e}")
            return []


# Global instance for easy access
pdf_retriever = PDFRetriever()


def get_pdf_context(workspace_id: str, query: str, k: int = 5) -> List[str]:
    """
    Convenience function to get PDF context.
    
    Args:
        workspace_id: Unique identifier for the workspace
        query: Query string
        k: Number of results to return
        
    Returns:
        List of relevant text chunks
    """
    return pdf_retriever.get_pdf_context(workspace_id, query, k)


def search_pdf_documents(workspace_id: str, query: str, document_ids: Optional[List[str]] = None, k: int = 5) -> List[str]:
    """
    Search PDF documents with optional filtering.
    
    Args:
        workspace_id: Workspace ID
        query: Query string
        document_ids: Optional list of specific document IDs to search
        k: Number of results to return
        
    Returns:
        List of relevant text chunks
    """
    if document_ids:
        return pdf_retriever.search_specific_documents(workspace_id, query, document_ids, k)
    else:
        return pdf_retriever.get_pdf_context(workspace_id, query, k)
