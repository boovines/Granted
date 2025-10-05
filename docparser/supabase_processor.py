"""
Supabase-integrated document processor for PDF parsing and embedding storage.
"""
import os
import json
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime

from supabase_config import SupabaseConfig
from embeddings import embed_texts, chunk_text, extract_text_from_parsed_element, create_chunk_metadata
from pdf_parser import PDFParser
from config import ArynConfig


class SupabaseDocumentProcessor:
    """Document processor that integrates with Supabase for storage and retrieval."""
    
    def __init__(self, supabase_config: SupabaseConfig, aryn_config: ArynConfig):
        """
        Initialize the Supabase document processor.
        
        Args:
            supabase_config: Supabase configuration
            aryn_config: Aryn AI configuration for parsing
        """
        self.supabase = supabase_config.get_client()
        self.parser = PDFParser(aryn_config)
        self.chunk_size = 1000  # Default chunk size for embeddings
        self.chunk_overlap = 100  # Default overlap between chunks
    
    def process_pdf_from_url(self, pdf_url: str, workspace_id: str, 
                           document_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a PDF from a URL and store in Supabase.
        
        Args:
            pdf_url: URL to the PDF file
            workspace_id: Workspace identifier
            document_metadata: Optional metadata for the document
            
        Returns:
            Processing results dictionary
        """
        try:
            # Download and parse the PDF
            print(f"Processing PDF from URL: {pdf_url}")
            
            # For now, we'll assume the PDF is already downloaded locally
            # In a full implementation, you'd download from the URL first
            pdf_path = self._download_pdf_from_url(pdf_url)
            
            return self.process_local_pdf(pdf_path, workspace_id, document_metadata)
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def process_local_pdf(self, pdf_path: str, workspace_id: str, 
                         document_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a local PDF file and store in Supabase.
        
        Args:
            pdf_path: Path to the PDF file
            workspace_id: Workspace identifier
            document_metadata: Optional metadata for the document
            
        Returns:
            Processing results dictionary
        """
        try:
            pdf_path = Path(pdf_path)
            if not pdf_path.exists():
                return {"success": False, "error": f"PDF file not found: {pdf_path}"}
            
            print(f"Processing PDF: {pdf_path.name}")
            
            # Parse the PDF using Aryn AI
            parsed_data = self.parser.parse_pdf(str(pdf_path))
            
            if "error" in parsed_data:
                return {"success": False, "error": parsed_data["error"]}
            
            # Extract document metadata
            doc_metadata = self._extract_document_metadata(parsed_data, pdf_path, document_metadata)
            
            # Store document record in Supabase
            document_id = self._store_document_record(workspace_id, doc_metadata)
            
            # Process elements and create embeddings
            chunks_processed = self._process_elements_and_embeddings(
                parsed_data, document_id, workspace_id
            )
            
            # Store parsed JSON in cache (optional)
            cache_result = self._store_parsed_json_cache(parsed_data, document_id, workspace_id)
            
            return {
                "success": True,
                "document_id": document_id,
                "chunks_processed": chunks_processed,
                "cache_stored": cache_result["success"],
                "document_name": pdf_path.name,
                "workspace_id": workspace_id
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _download_pdf_from_url(self, pdf_url: str) -> str:
        """
        Download PDF from URL to local temporary file.
        
        Args:
            pdf_url: URL to download from
            
        Returns:
            Local file path
        """
        import requests
        
        # Create temporary directory if it doesn't exist
        temp_dir = Path(__file__).parent / "temp"
        temp_dir.mkdir(exist_ok=True)
        
        # Download the PDF
        response = requests.get(pdf_url)
        response.raise_for_status()
        
        # Generate filename from URL
        filename = pdf_url.split('/')[-1]
        if not filename.endswith('.pdf'):
            filename = f"downloaded_{uuid.uuid4().hex}.pdf"
        
        local_path = temp_dir / filename
        
        # Save the file
        with open(local_path, 'wb') as f:
            f.write(response.content)
        
        return str(local_path)
    
    def _extract_document_metadata(self, parsed_data: Dict[str, Any], 
                                  pdf_path: Path, 
                                  additional_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Extract metadata from parsed document.
        
        Args:
            parsed_data: Parsed document data from Aryn AI
            pdf_path: Path to the original PDF
            additional_metadata: Additional metadata to include
            
        Returns:
            Document metadata dictionary
        """
        elements = parsed_data.get("elements", [])
        
        # Extract basic metadata
        metadata = {
            "filename": pdf_path.name,
            "file_size": pdf_path.stat().st_size,
            "file_type": "pdf",
            "upload_date": datetime.now().isoformat(),
            "status": "processed",
            "total_elements": len(elements),
            "parsing_status": parsed_data.get("status_code", "unknown")
        }
        
        # Extract title from elements
        title = "Unknown"
        for element in elements:
            if element.get("type") == "Title":
                title = element.get("text_representation", "Unknown")
                break
        
        metadata["title"] = title
        
        # Count different element types
        type_counts = {}
        page_numbers = set()
        
        for element in elements:
            element_type = element.get("type", "unknown")
            type_counts[element_type] = type_counts.get(element_type, 0) + 1
            
            page_num = element.get("properties", {}).get("page_number", 0)
            if page_num > 0:
                page_numbers.add(page_num)
        
        metadata["page_count"] = len(page_numbers)
        metadata["element_types"] = type_counts
        
        # Add any additional metadata
        if additional_metadata:
            metadata.update(additional_metadata)
        
        return metadata
    
    def _store_document_record(self, workspace_id: str, metadata: Dict[str, Any]) -> str:
        """
        Store document record in Supabase documents table.
        
        Args:
            workspace_id: Workspace identifier
            metadata: Document metadata
            
        Returns:
            Document ID
        """
        document_record = {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "filename": metadata["filename"],
            "file_type": metadata["file_type"],
            "file_size": metadata["file_size"],
            "upload_date": metadata["upload_date"],
            "status": metadata["status"],
            "metadata": metadata  # Store full metadata as JSONB
        }
        
        result = self.supabase.table("documents").insert(document_record).execute()
        
        if result.data:
            return result.data[0]["id"]
        else:
            raise Exception("Failed to store document record")
    
    def _process_elements_and_embeddings(self, parsed_data: Dict[str, Any], 
                                        document_id: str, workspace_id: str) -> int:
        """
        Process document elements and create embeddings.
        
        Args:
            parsed_data: Parsed document data
            document_id: Document ID
            workspace_id: Workspace identifier
            
        Returns:
            Number of chunks processed
        """
        elements = parsed_data.get("elements", [])
        chunks_processed = 0
        
        # Process elements in batches to avoid API limits
        batch_size = 100
        
        for i in range(0, len(elements), batch_size):
            batch = elements[i:i + batch_size]
            chunk_data = []
            
            for element in batch:
                # Extract text from element
                text = extract_text_from_parsed_element(element)
                
                if not text or len(text.strip()) < 50:  # Skip very short elements
                    continue
                
                # Chunk the text
                chunks = chunk_text(text, self.chunk_size, self.chunk_overlap)
                
                for chunk_idx, chunk_text_content in enumerate(chunks):
                    # Create chunk record
                    chunk_record = {
                        "id": str(uuid.uuid4()),
                        "document_id": document_id,
                        "chunk_idx": chunks_processed + chunk_idx,
                        "text": chunk_text_content,
                        "metadata": create_chunk_metadata(element, chunk_idx, len(chunks))
                    }
                    chunk_data.append(chunk_record)
            
            # Generate embeddings for the batch
            if chunk_data:
                texts = [chunk["text"] for chunk in chunk_data]
                try:
                    embeddings = embed_texts(texts)
                    
                    # Add embeddings to chunk data
                    for i, embedding in enumerate(embeddings):
                        chunk_data[i]["embedding"] = embedding
                    
                    # Store chunks in Supabase
                    result = self.supabase.table("doc_chunks").insert(chunk_data).execute()
                    
                    if result.data:
                        chunks_processed += len(chunk_data)
                        print(f"Stored {len(chunk_data)} chunks (total: {chunks_processed})")
                    else:
                        print(f"Failed to store chunk batch starting at element {i}")
                        
                except Exception as e:
                    print(f"Error generating embeddings for batch {i}: {e}")
                    continue
        
        return chunks_processed
    
    def _store_parsed_json_cache(self, parsed_data: Dict[str, Any], 
                                document_id: str, workspace_id: str) -> Dict[str, Any]:
        """
        Store parsed JSON data in cache for quick access.
        
        Args:
            parsed_data: Parsed document data
            document_id: Document ID
            workspace_id: Workspace identifier
            
        Returns:
            Cache storage result
        """
        try:
            # Create cache directory
            cache_dir = Path(__file__).parent / "parsed_outputs"
            cache_dir.mkdir(exist_ok=True)
            
            # Generate cache filename
            cache_filename = f"{document_id}_parsed.json"
            cache_path = cache_dir / cache_filename
            
            # Store parsed data
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(parsed_data, f, indent=2, ensure_ascii=False)
            
            return {"success": True, "cache_file": str(cache_path)}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_document_chunks(self, document_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Retrieve document chunks from Supabase.
        
        Args:
            document_id: Document ID
            limit: Maximum number of chunks to retrieve
            
        Returns:
            List of document chunks
        """
        try:
            result = self.supabase.table("doc_chunks").select("*").eq("document_id", document_id).order("chunk_idx").limit(limit).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error retrieving document chunks: {e}")
            return []
    
    def search_documents(self, workspace_id: str, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search documents using semantic similarity.
        
        Args:
            workspace_id: Workspace identifier
            query: Search query
            limit: Maximum number of results
            
        Returns:
            List of matching chunks with similarity scores
        """
        try:
            # Generate query embedding
            from embeddings import embed_text
            query_embedding = embed_text(query)
            
            # Use Supabase's vector similarity search
            # Note: This requires the pgvector extension and proper indexing
            result = self.supabase.rpc(
                "match_document_chunks",
                {
                    "query_embedding": query_embedding,
                    "workspace_id": workspace_id,
                    "match_threshold": 0.7,
                    "match_count": limit
                }
            ).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            print(f"Error searching documents: {e}")
            return []
    
    def get_workspace_documents(self, workspace_id: str) -> List[Dict[str, Any]]:
        """
        Get all documents for a workspace.
        
        Args:
            workspace_id: Workspace identifier
            
        Returns:
            List of documents
        """
        try:
            result = self.supabase.table("documents").select("*").eq("workspace_id", workspace_id).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error retrieving workspace documents: {e}")
            return []
    
    def delete_document(self, document_id: str) -> bool:
        """
        Delete a document and all its chunks.
        
        Args:
            document_id: Document ID
            
        Returns:
            True if successful
        """
        try:
            # Delete chunks first (foreign key constraint)
            self.supabase.table("doc_chunks").delete().eq("document_id", document_id).execute()
            
            # Delete document record
            self.supabase.table("documents").delete().eq("id", document_id).execute()
            
            return True
        except Exception as e:
            print(f"Error deleting document: {e}")
            return False
