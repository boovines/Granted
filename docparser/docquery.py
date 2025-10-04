"""
Simple interface for PDF document parsing and querying with Aryn AI.
This is the main entry point for the document query system.
"""
import os
import json
from pathlib import Path
from typing import Optional, List
from datetime import datetime

from config import ArynConfig
from pdf_parser import PDFParser
from query_engine import QueryEngine


class DocQuery:
    """Main interface for document parsing and querying."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize DocQuery system.
        
        Args:
            api_key: Aryn API key. If None, will use ARYN_API_KEY environment variable
        """
        self.config = ArynConfig(api_key)
        self.parser = PDFParser(self.config)
        self.query_engine = QueryEngine(self.config)
        self.src_dir = Path(__file__).parent / "src"
        self.output_dir = Path(__file__).parent / "parsed_outputs"
        self.output_dir.mkdir(exist_ok=True)
        self.query_output_dir = Path(__file__).parent / "query_outputs"
        self.query_output_dir.mkdir(exist_ok=True)
    
    def parse_pdfs(self, pdf_directory: Optional[str] = None, force_reparse: bool = False) -> dict:
        """
        Parse all PDFs in the specified directory (defaults to src folder).
        Uses intelligent caching - only re-parses if PDF files have been modified.
        
        Args:
            pdf_directory: Directory containing PDF files (defaults to src folder)
            force_reparse: Force re-parsing even if cached version exists
            
        Returns:
            Dictionary with parsing results
        """
        directory = pdf_directory or str(self.src_dir)
        print(f"Processing PDFs from: {directory}")
        
        try:
            # Use enhanced parsing with caching
            parsed_results = self.parser.parse_multiple_pdfs(
                directory, 
                output_dir=str(self.output_dir),
                force_reparse=force_reparse
            )
            
            # Report results
            for filename, parsed_data in parsed_results.items():
                if "error" not in parsed_data:
                    output_file = self.output_dir / f"{Path(filename).stem}_parsed.json"
                    print(f"✓ Processed: {filename}")
                else:
                    print(f"✗ Error: {filename} - {parsed_data['error']}")
            
            return parsed_results
            
        except Exception as e:
            print(f"✗ Processing failed: {e}")
            return {"error": str(e)}
    
    def parse_docx(self, docx_directory: Optional[str] = None, force_reparse: bool = False) -> dict:
        """
        Parse all DOCX files in the specified directory (defaults to src folder).
        Uses intelligent caching - only re-parses if DOCX files have been modified.
        
        Args:
            docx_directory: Directory containing DOCX files (defaults to src folder)
            force_reparse: Force re-parsing even if cached version exists
            
        Returns:
            Dictionary with parsing results
        """
        directory = docx_directory or str(self.src_dir)
        print(f"Processing DOCX files from: {directory}")
        
        try:
            # Use enhanced parsing with caching
            parsed_results = self.parser.parse_multiple_docx(
                directory, 
                output_dir=str(self.output_dir),
                force_reparse=force_reparse
            )
            
            # Report results
            for filename, parsed_data in parsed_results.items():
                if "error" not in parsed_data:
                    output_file = self.output_dir / f"{Path(filename).stem}_parsed.json"
                    print(f"✓ Processed: {filename}")
                else:
                    print(f"✗ Error: {filename} - {parsed_data['error']}")
            
            return parsed_results
            
        except Exception as e:
            print(f"✗ Processing failed: {e}")
            return {"error": str(e)}
    
    def parse_all_documents(self, document_directory: Optional[str] = None, force_reparse: bool = False) -> dict:
        """
        Parse all documents (PDF, DOCX, DOC) in the specified directory (defaults to src folder).
        Uses intelligent caching - only re-parses if document files have been modified.
        
        Args:
            document_directory: Directory containing document files (defaults to src folder)
            force_reparse: Force re-parsing even if cached version exists
            
        Returns:
            Dictionary with parsing results
        """
        directory = document_directory or str(self.src_dir)
        print(f"Processing all documents from: {directory}")
        
        try:
            # Parse PDFs
            pdf_results = self.parse_pdfs(directory, force_reparse)
            
            # Parse DOCX files
            docx_results = self.parse_docx(directory, force_reparse)
            
            # Combine results
            all_results = {**pdf_results, **docx_results}
            
            return all_results
            
        except Exception as e:
            print(f"✗ Processing failed: {e}")
            return {"error": str(e)}
    
    def load_documents(self):
        """Load all parsed documents into the query engine."""
        try:
            self.query_engine.load_parsed_documents(str(self.output_dir))
            loaded_docs = self.query_engine.list_loaded_documents()
            print(f"✓ Loaded {len(loaded_docs)} documents: {loaded_docs}")
            return True
        except Exception as e:
            print(f"✗ Failed to load documents: {e}")
            return False
    
    def query(self, prompt: str, document_names: Optional[List[str]] = None, 
              max_results: int = 10) -> str:
        """
        Query the loaded documents with a prompt.
        
        Args:
            prompt: The query prompt
            document_names: Optional list of specific documents to search
            max_results: Maximum number of results to return
            
        Returns:
            Formatted response with query results and links
        """
        try:
            return self.query_engine.query_documents(prompt, document_names, max_results)
        except Exception as e:
            return f"Query failed: {e}"
    
    def get_document_overview(self, document_name: str) -> str:
        """Get overview of a specific document."""
        try:
            return self.query_engine.get_document_overview(document_name)
        except Exception as e:
            return f"Failed to get overview: {e}"
    
    def list_documents(self) -> List[str]:
        """Get list of loaded document names."""
        return self.query_engine.list_loaded_documents()
    
    def get_cache_status(self) -> dict:
        """
        Get status of cached parsed documents.
        
        Returns:
            Dictionary with cache status information
        """
        # Find all supported document files
        pdf_files = list(self.src_dir.glob("*.pdf"))
        docx_files = list(self.src_dir.glob("*.docx"))
        all_files = pdf_files + docx_files
        
        cache_status = {
            "pdf_files": [f.name for f in pdf_files],
            "docx_files": [f.name for f in docx_files],
            "total_files": [f.name for f in all_files],
            "cached_files": [],
            "outdated_files": [],
            "missing_cache": []
        }
        
        for doc_file in all_files:
            cached_file = self.output_dir / f"{doc_file.stem}_parsed.json"
            
            if cached_file.exists():
                doc_mtime = doc_file.stat().st_mtime
                cached_mtime = cached_file.stat().st_mtime
                
                if cached_mtime > doc_mtime:
                    cache_status["cached_files"].append(doc_file.name)
                else:
                    cache_status["outdated_files"].append(doc_file.name)
            else:
                cache_status["missing_cache"].append(doc_file.name)
        
        return cache_status
    
    def query_and_save(self, prompt: str, document_names: Optional[List[str]] = None, 
                       max_results: int = 10, output_filename: Optional[str] = None) -> dict:
        """
        Query the loaded documents and save results to JSON file.
        
        Args:
            prompt: The query prompt
            document_names: Optional list of specific documents to search
            max_results: Maximum number of results to return
            output_filename: Optional custom filename for output JSON
            
        Returns:
            Dictionary containing query results and metadata
        """
        try:
            # Get query results
            formatted_result = self.query(prompt, document_names, max_results)
            
            # Parse the formatted result to extract structured data
            results_data = self._parse_formatted_result(formatted_result, prompt)
            
            # Generate filename if not provided
            if not output_filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                safe_prompt = "".join(c for c in prompt[:50] if c.isalnum() or c in (' ', '-', '_')).rstrip()
                safe_prompt = safe_prompt.replace(' ', '_')
                output_filename = f"query_{safe_prompt}_{timestamp}.json"
            
            # Save to JSON file
            output_path = self.query_output_dir / output_filename
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(results_data, f, indent=2, ensure_ascii=False)
            
            print(f"✓ Query results saved to: {output_path}")
            
            return {
                "success": True,
                "output_file": str(output_path),
                "results": results_data,
                "formatted_result": formatted_result
            }
            
        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e),
                "query": prompt
            }
            print(f"✗ Failed to save query results: {e}")
            return error_result
    
    def _parse_formatted_result(self, formatted_result: str, prompt: str) -> dict:
        """
        Parse the formatted query result to extract structured data.
        
        Args:
            formatted_result: The formatted string result
            prompt: The original query prompt
            
        Returns:
            Dictionary with structured query data
        """
        import re
        
        # Extract query from the formatted result
        query_match = re.search(r'# Query Results for: \'(.+?)\'', formatted_result)
        query = query_match.group(1) if query_match else prompt
        
        # Extract number of results
        results_match = re.search(r'Found (\d+) relevant results:', formatted_result)
        num_results = int(results_match.group(1)) if results_match else 0
        
        # Parse individual results
        results = []
        result_sections = re.split(r'## Result \d+', formatted_result)[1:]  # Skip the header
        
        for i, section in enumerate(result_sections):
            try:
                result_data = self._parse_result_section(section, i + 1)
                if result_data:
                    results.append(result_data)
            except Exception as e:
                print(f"Warning: Failed to parse result {i + 1}: {e}")
        
        return {
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "total_results": num_results,
            "results": results,
            "formatted_output": formatted_result
        }
    
    def _parse_result_section(self, section: str, result_number: int) -> dict:
        """
        Parse a single result section from the formatted output.
        
        Args:
            section: The result section text
            result_number: The result number
            
        Returns:
            Dictionary with parsed result data
        """
        import re
        
        # Extract document name
        doc_match = re.search(r'\*\*Document:\*\* (.+)', section)
        document = doc_match.group(1).strip() if doc_match else ""
        
        # Extract type
        type_match = re.search(r'\*\*Type:\*\* (.+)', section)
        doc_type = type_match.group(1).strip() if type_match else ""
        
        # Extract page
        page_match = re.search(r'\*\*Page:\*\* (\d+)', section)
        page = int(page_match.group(1)) if page_match else 0
        
        # Extract relevance score
        score_match = re.search(r'\*\*Relevance Score:\*\* ([\d.]+)', section)
        relevance_score = float(score_match.group(1)) if score_match else 0.0
        
        # Extract content
        content_match = re.search(r'\*\*Content:\*\*\s*\n(.+?)(?=\n\*\*Location:\*\*|\n---|\Z)', section, re.DOTALL)
        content = content_match.group(1).strip() if content_match else ""
        
        # Extract location
        location_match = re.search(r'\*\*Location:\*\* (.+)', section)
        location = location_match.group(1).strip() if location_match else ""
        
        # Extract source
        source_match = re.search(r'\*\*Source:\*\* (.+)', section)
        source = source_match.group(1).strip() if source_match else ""
        
        return {
            "result_number": result_number,
            "document": document,
            "type": doc_type,
            "page": page,
            "relevance_score": relevance_score,
            "content": content,
            "location": location,
            "source": source
        }


# Convenience function for quick queries
def quick_query(prompt: str, api_key: Optional[str] = None, force_reparse: bool = False) -> str:
    """
    Quick query function that automatically parses PDFs and queries them.
    Uses intelligent caching - only re-parses if PDF files have been modified.
    
    Args:
        prompt: Query prompt
        api_key: Optional Aryn API key
        force_reparse: Force re-parsing even if cached version exists
        
    Returns:
        Query results as formatted string
    """
    doc_query = DocQuery(api_key)
    
    # Check if we need to parse documents (will use cache if available)
    pdf_files = list(doc_query.src_dir.glob("*.pdf"))
    docx_files = list(doc_query.src_dir.glob("*.docx"))
    
    if pdf_files or docx_files:
        print("Processing documents with intelligent caching...")
        if pdf_files and docx_files:
            # Parse both types
            doc_query.parse_all_documents(force_reparse=force_reparse)
        elif pdf_files:
            # Parse only PDFs
            doc_query.parse_pdfs(force_reparse=force_reparse)
        elif docx_files:
            # Parse only DOCX files
            doc_query.parse_docx(force_reparse=force_reparse)
    
    # Load documents
    if not doc_query.load_documents():
        return "Failed to load documents for querying."
    
    # Query
    return doc_query.query(prompt)


def quick_query_and_save(prompt: str, api_key: Optional[str] = None, force_reparse: bool = False, 
                         output_filename: Optional[str] = None) -> dict:
    """
    Quick query function that automatically parses documents, queries them, and saves results to JSON.
    Uses intelligent caching - only re-parses if document files have been modified.
    
    Args:
        prompt: Query prompt
        api_key: Optional Aryn API key
        force_reparse: Force re-parsing even if cached version exists
        output_filename: Optional custom filename for output JSON
        
    Returns:
        Dictionary with query results and save status
    """
    doc_query = DocQuery(api_key)
    
    # Check if we need to parse documents (will use cache if available)
    pdf_files = list(doc_query.src_dir.glob("*.pdf"))
    docx_files = list(doc_query.src_dir.glob("*.docx"))
    
    if pdf_files or docx_files:
        print("Processing documents with intelligent caching...")
        if pdf_files and docx_files:
            # Parse both types
            doc_query.parse_all_documents(force_reparse=force_reparse)
        elif pdf_files:
            # Parse only PDFs
            doc_query.parse_pdfs(force_reparse=force_reparse)
        elif docx_files:
            # Parse only DOCX files
            doc_query.parse_docx(force_reparse=force_reparse)
    
    # Load documents
    if not doc_query.load_documents():
        return {"success": False, "error": "Failed to load documents for querying."}
    
    # Query and save
    return doc_query.query_and_save(prompt, output_filename=output_filename)


def main():
    """Main entry point for console script."""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python docquery.py '<your query>'")
        print("Example: python docquery.py 'What is the main topic?'")
        print("\nAvailable commands:")
        print("  python docquery.py '<query>'     - Query documents")
        print("  python docquery.py save '<query>' - Query documents and save to JSON")
        print("  python docquery.py list          - List loaded documents")
        print("  python docquery.py overview <doc> - Get document overview")
        print("  python docquery.py cache         - Show cache status")
        print("  python docquery.py reparse       - Force re-parse all documents")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "list":
        try:
            dq = DocQuery()
            dq.load_documents()
            docs = dq.list_documents()
            print(f"Loaded documents: {docs}")
        except Exception as e:
            print(f"Error: {e}")
        return
    
    if command == "overview" and len(sys.argv) > 2:
        try:
            doc_name = sys.argv[2]
            dq = DocQuery()
            dq.load_documents()
            overview = dq.get_document_overview(doc_name)
            print(overview)
        except Exception as e:
            print(f"Error: {e}")
        return
    
    if command == "cache":
        try:
            dq = DocQuery()
            status = dq.get_cache_status()
            print("📊 Cache Status:")
            print(f"  PDF files: {len(status['pdf_files'])}")
            print(f"  DOCX files: {len(status['docx_files'])}")
            print(f"  Total files: {len(status['total_files'])}")
            print(f"  ✅ Up-to-date cache: {len(status['cached_files'])}")
            print(f"  ⚠️  Outdated cache: {len(status['outdated_files'])}")
            print(f"  ❌ Missing cache: {len(status['missing_cache'])}")
            
            if status['cached_files']:
                print(f"\n✅ Cached and up-to-date:")
                for f in status['cached_files']:
                    print(f"    - {f}")
            
            if status['outdated_files']:
                print(f"\n⚠️  Outdated (will be re-parsed):")
                for f in status['outdated_files']:
                    print(f"    - {f}")
            
            if status['missing_cache']:
                print(f"\n❌ Missing cache (will be parsed):")
                for f in status['missing_cache']:
                    print(f"    - {f}")
        except Exception as e:
            print(f"Error: {e}")
        return
    
    if command == "reparse":
        try:
            dq = DocQuery()
            print("Force re-parsing all documents...")
            dq.parse_all_documents(force_reparse=True)
            print("Re-parsing complete!")
        except Exception as e:
            print(f"Error: {e}")
        return
    
    if command == "save" and len(sys.argv) > 2:
        try:
            query_prompt = " ".join(sys.argv[2:])
            print(f"Querying and saving: '{query_prompt}'")
            
            result = quick_query_and_save(query_prompt)
            
            if result["success"]:
                print("\n" + "="*50)
                print("QUERY RESULTS SAVED TO JSON:")
                print("="*50)
                print(f"File: {result['output_file']}")
                print(f"Total results: {result['results']['total_results']}")
                print(f"Query: {result['results']['query']}")
                print(f"Timestamp: {result['results']['timestamp']}")
            else:
                print(f"Error: {result.get('error', 'Unknown error')}")
        except Exception as e:
            print(f"Error: {e}")
        return
    
    # Default: treat as query
    query_prompt = " ".join(sys.argv[1:])
    print(f"Querying: '{query_prompt}'")
    
    result = quick_query(query_prompt)
    print("\n" + "="*50)
    print("RESULT:")
    print("="*50)
    print(result)


if __name__ == "__main__":
    main()
