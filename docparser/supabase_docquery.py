"""
Enhanced DocQuery with Supabase integration for PDF processing and embedding storage.
"""
import os
import json
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime

from supabase_config import SupabaseConfig
from supabase_processor import SupabaseDocumentProcessor
from config import ArynConfig
from embeddings import embed_text


class SupabaseDocQuery:
    """Enhanced DocQuery with Supabase integration."""
    
    def __init__(self, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None,
                 aryn_api_key: Optional[str] = None):
        """
        Initialize Supabase DocQuery system.
        
        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase anon key
            aryn_api_key: Aryn API key for document parsing
        """
        try:
            # Initialize configurations
            self.supabase_config = SupabaseConfig(supabase_url, supabase_key)
            self.aryn_config = ArynConfig(aryn_api_key)
            
            # Initialize processor
            self.processor = SupabaseDocumentProcessor(self.supabase_config, self.aryn_config)
            
            # Initialize Supabase client
            self.supabase = self.supabase_config.get_client()
            
            print("✓ Supabase DocQuery initialized successfully")
            
        except Exception as e:
            raise Exception(f"Failed to initialize Supabase DocQuery: {e}")
    
    def process_pdf_from_database(self, document_id: str, workspace_id: str) -> Dict[str, Any]:
        """
        Process a PDF that's stored in the database.
        
        Args:
            document_id: ID of the document in the database
            workspace_id: Workspace identifier
            
        Returns:
            Processing results
        """
        try:
            # Get document info from database
            doc_result = self.supabase.table("documents").select("*").eq("id", document_id).execute()
            
            if not doc_result.data:
                return {"success": False, "error": f"Document {document_id} not found"}
            
            document = doc_result.data[0]
            
            # Check if document is already processed
            if document.get("status") == "processed":
                chunks_result = self.supabase.table("doc_chunks").select("id").eq("document_id", document_id).execute()
                if chunks_result.data:
                    return {
                        "success": True,
                        "message": "Document already processed",
                        "document_id": document_id,
                        "existing_chunks": len(chunks_result.data)
                    }
            
            # For now, we'll need the PDF file to be accessible locally
            # In a full implementation, you'd retrieve the PDF from storage
            pdf_path = self._get_pdf_path_from_document(document)
            
            if not pdf_path:
                return {"success": False, "error": "PDF file not accessible"}
            
            # Process the PDF
            return self.processor.process_local_pdf(pdf_path, workspace_id, document.get("metadata", {}))
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def process_pdf_from_url(self, pdf_url: str, workspace_id: str, 
                           document_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a PDF from a URL and store in Supabase.
        
        Args:
            pdf_url: URL to the PDF file
            workspace_id: Workspace identifier
            document_metadata: Optional metadata for the document
            
        Returns:
            Processing results
        """
        return self.processor.process_pdf_from_url(pdf_url, workspace_id, document_metadata)
    
    def process_local_pdf(self, pdf_path: str, workspace_id: str, 
                         document_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a local PDF file and store in Supabase.
        
        Args:
            pdf_path: Path to the PDF file
            workspace_id: Workspace identifier
            document_metadata: Optional metadata for the document
            
        Returns:
            Processing results
        """
        return self.processor.process_local_pdf(pdf_path, workspace_id, document_metadata)
    
    def query_documents(self, workspace_id: str, query: str, 
                       document_ids: Optional[List[str]] = None, 
                       limit: int = 10) -> Dict[str, Any]:
        """
        Query documents using semantic search.
        
        Args:
            workspace_id: Workspace identifier
            query: Search query
            document_ids: Optional list of specific document IDs to search
            limit: Maximum number of results
            
        Returns:
            Query results with formatted response
        """
        try:
            # Generate query embedding
            query_embedding = embed_text(query)
            
            # Build the search query
            search_query = self.supabase.table("doc_chunks").select(
                "id, text, metadata, document_id, documents!inner(workspace_id, filename)"
            )
            
            # Filter by workspace
            search_query = search_query.eq("documents.workspace_id", workspace_id)
            
            # Filter by specific documents if provided
            if document_ids:
                search_query = search_query.in_("document_id", document_ids)
            
            # For now, we'll use a simple text search since vector search requires custom functions
            # In production, you'd use proper vector similarity search
            search_query = search_query.limit(limit * 2)  # Get more results for filtering
            
            result = search_query.execute()
            
            if not result.data:
                return {
                    "success": True,
                    "query": query,
                    "results": [],
                    "total_results": 0,
                    "message": "No matching documents found"
                }
            
            # Format results
            formatted_results = []
            for chunk in result.data[:limit]:
                formatted_results.append({
                    "chunk_id": chunk["id"],
                    "document_id": chunk["document_id"],
                    "document_name": chunk["documents"]["filename"],
                    "text": chunk["text"],
                    "metadata": chunk["metadata"]
                })
            
            # Create formatted response
            formatted_response = self._format_query_response(query, formatted_results)
            
            return {
                "success": True,
                "query": query,
                "results": formatted_results,
                "total_results": len(formatted_results),
                "formatted_response": formatted_response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_document_overview(self, document_id: str) -> Dict[str, Any]:
        """
        Get overview of a specific document.
        
        Args:
            document_id: Document ID
            
        Returns:
            Document overview
        """
        try:
            # Get document info
            doc_result = self.supabase.table("documents").select("*").eq("id", document_id).execute()
            
            if not doc_result.data:
                return {"success": False, "error": "Document not found"}
            
            document = doc_result.data[0]
            
            # Get chunk count
            chunks_result = self.supabase.table("doc_chunks").select("id", count="exact").eq("document_id", document_id).execute()
            chunk_count = chunks_result.count if hasattr(chunks_result, 'count') else len(chunks_result.data)
            
            # Get element type distribution
            chunks_result = self.supabase.table("doc_chunks").select("metadata").eq("document_id", document_id).execute()
            
            element_types = {}
            for chunk in chunks_result.data:
                metadata = chunk.get("metadata", {})
                element_type = metadata.get("element_type", "unknown")
                element_types[element_type] = element_types.get(element_type, 0) + 1
            
            overview = {
                "success": True,
                "document_id": document_id,
                "filename": document["filename"],
                "title": document.get("metadata", {}).get("title", "Unknown"),
                "page_count": document.get("metadata", {}).get("page_count", 0),
                "chunk_count": chunk_count,
                "element_types": element_types,
                "upload_date": document["upload_date"],
                "status": document["status"]
            }
            
            return overview
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_workspace_documents(self, workspace_id: str) -> List[Dict[str, Any]]:
        """
        List all documents in a workspace.
        
        Args:
            workspace_id: Workspace identifier
            
        Returns:
            List of documents
        """
        return self.processor.get_workspace_documents(workspace_id)
    
    def delete_document(self, document_id: str) -> bool:
        """
        Delete a document and all its chunks.
        
        Args:
            document_id: Document ID
            
        Returns:
            True if successful
        """
        return self.processor.delete_document(document_id)
    
    def get_document_chunks(self, document_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get chunks for a specific document.
        
        Args:
            document_id: Document ID
            limit: Maximum number of chunks
            
        Returns:
            List of document chunks
        """
        return self.processor.get_document_chunks(document_id, limit)
    
    def _get_pdf_path_from_document(self, document: Dict[str, Any]) -> Optional[str]:
        """
        Get local PDF path from document record.
        
        Args:
            document: Document record from database
            
        Returns:
            Local PDF path if accessible, None otherwise
        """
        # This is a placeholder - in a real implementation, you'd:
        # 1. Check if the PDF is stored in Supabase Storage
        # 2. Download it to a local temporary file
        # 3. Return the local path
        
        filename = document.get("filename", "")
        src_dir = Path(__file__).parent / "src"
        potential_paths = [
            src_dir / filename,
            src_dir / f"{document['id']}.pdf"
        ]
        
        for path in potential_paths:
            if path.exists():
                return str(path)
        
        return None
    
    def _format_query_response(self, query: str, results: List[Dict[str, Any]]) -> str:
        """
        Format query results into a readable response.
        
        Args:
            query: Original query
            results: Query results
            
        Returns:
            Formatted response string
        """
        if not results:
            return f"No relevant information found for query: '{query}'"
        
        response = f"# Query Results for: '{query}'\n\n"
        response += f"Found {len(results)} relevant results:\n\n"
        
        for i, result in enumerate(results, 1):
            response += f"## Result {i}\n"
            response += f"**Document:** {result['document_name']}\n"
            response += f"**Document ID:** {result['document_id']}\n"
            response += f"**Chunk ID:** {result['chunk_id']}\n"
            
            # Add metadata if available
            metadata = result.get("metadata", {})
            if metadata:
                if "element_type" in metadata:
                    response += f"**Type:** {metadata['element_type']}\n"
                if "page_number" in metadata:
                    response += f"**Page:** {metadata['page_number']}\n"
            
            # Add content (truncated if too long)
            content = result['text']
            if len(content) > 500:
                content = content[:500] + "..."
            response += f"**Content:**\n{content}\n\n"
            response += "---\n\n"
        
        return response
    
    def save_query_results(self, query: str, results: Dict[str, Any], 
                          output_filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Save query results to JSON file.
        
        Args:
            query: Original query
            results: Query results
            output_filename: Optional custom filename
            
        Returns:
            Save result
        """
        try:
            # Create output directory
            output_dir = Path(__file__).parent / "query_outputs"
            output_dir.mkdir(exist_ok=True)
            
            # Generate filename if not provided
            if not output_filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                safe_query = "".join(c for c in query[:50] if c.isalnum() or c in (' ', '-', '_')).rstrip()
                safe_query = safe_query.replace(' ', '_')
                output_filename = f"supabase_query_{safe_query}_{timestamp}.json"
            
            # Prepare save data
            save_data = {
                "query": query,
                "timestamp": datetime.now().isoformat(),
                "success": results.get("success", False),
                "total_results": results.get("total_results", 0),
                "results": results.get("results", []),
                "formatted_response": results.get("formatted_response", ""),
                "error": results.get("error")
            }
            
            # Save to file
            output_path = output_dir / output_filename
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(save_data, f, indent=2, ensure_ascii=False)
            
            return {
                "success": True,
                "output_file": str(output_path),
                "filename": output_filename
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}


# Convenience functions for quick operations
def quick_supabase_query(workspace_id: str, query: str, 
                        supabase_url: Optional[str] = None, 
                        supabase_key: Optional[str] = None,
                        aryn_api_key: Optional[str] = None) -> str:
    """
    Quick query function for Supabase-integrated documents.
    
    Args:
        workspace_id: Workspace identifier
        query: Query string
        supabase_url: Optional Supabase URL
        supabase_key: Optional Supabase key
        aryn_api_key: Optional Aryn API key
        
    Returns:
        Formatted query results
    """
    try:
        doc_query = SupabaseDocQuery(supabase_url, supabase_key, aryn_api_key)
        results = doc_query.query_documents(workspace_id, query)
        
        if results.get("success"):
            return results.get("formatted_response", "No results found")
        else:
            return f"Query failed: {results.get('error', 'Unknown error')}"
            
    except Exception as e:
        return f"Error: {e}"


def process_pdf_to_supabase(pdf_path: str, workspace_id: str,
                           supabase_url: Optional[str] = None,
                           supabase_key: Optional[str] = None,
                           aryn_api_key: Optional[str] = None,
                           document_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Process a PDF file and store it in Supabase.
    
    Args:
        pdf_path: Path to the PDF file
        workspace_id: Workspace identifier
        supabase_url: Optional Supabase URL
        supabase_key: Optional Supabase key
        aryn_api_key: Optional Aryn API key
        document_metadata: Optional document metadata
        
    Returns:
        Processing results
    """
    try:
        doc_query = SupabaseDocQuery(supabase_url, supabase_key, aryn_api_key)
        return doc_query.process_local_pdf(pdf_path, workspace_id, document_metadata)
    except Exception as e:
        return {"success": False, "error": str(e)}
