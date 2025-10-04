"""
PDF document parsing module using Aryn AI DocParse API.
"""
import os
import json
from typing import Dict, List, Optional, Any
from pathlib import Path

try:
    from aryn_sdk.partition import partition_file
    from aryn_sdk.client.client import Client
except ImportError:
    partition_file = None
    Client = None

from config import ArynConfig


class PDFParser:
    """PDF parser using Aryn AI DocParse API. Also supports DOCX and DOC files."""
    
    def __init__(self, config: ArynConfig):
        """
        Initialize PDF parser.
        
        Args:
            config: ArynConfig instance with API settings
        """
        self.config = config
        if partition_file is None:
            raise ImportError("aryn-sdk is required. Please install it with: pip install aryn-sdk")
        
        # Supported file extensions for additional document types
        self.supported_extensions = {'.pdf', '.docx', '.doc'}
    
    def parse_document(self, document_path: str, output_format: str = "json") -> Dict[str, Any]:
        """
        Parse a document (PDF, DOCX, DOC) using Aryn AI DocParse SDK.
        
        Args:
            document_path: Path to the document file
            output_format: Output format ('json' or 'markdown')
            
        Returns:
            Parsed document data as dictionary
            
        Raises:
            FileNotFoundError: If document file doesn't exist
            ValueError: If file type is not supported
            Exception: If parsing fails
        """
        if not os.path.exists(document_path):
            raise FileNotFoundError(f"Document file not found: {document_path}")
        
        # Check file extension
        file_ext = Path(document_path).suffix.lower()
        if file_ext not in self.supported_extensions:
            raise ValueError(f"Unsupported file type: {file_ext}. Supported types: {self.supported_extensions}")
        
        try:
            # Use Aryn SDK to parse the file
            with open(document_path, 'rb') as document_file:
                parsed_output = partition_file(
                    document_file, 
                    aryn_api_key=self.config.api_key,
                    text_mode="auto",
                    table_mode="standard",
                    extract_images=True,
                    output_format="json"
                )
            
            # The output is already a dictionary from the Aryn SDK
            return parsed_output
            
        except Exception as e:
            raise Exception(f"Failed to parse document {document_path}: {str(e)}")
    
    def parse_pdf(self, pdf_path: str, output_format: str = "json") -> Dict[str, Any]:
        """
        Parse a PDF document using Aryn AI DocParse SDK.
        
        Args:
            pdf_path: Path to the PDF file
            output_format: Output format ('json' or 'markdown')
            
        Returns:
            Parsed document data as dictionary
            
        Raises:
            FileNotFoundError: If PDF file doesn't exist
            Exception: If parsing fails
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        try:
            # Use Aryn SDK to parse the file
            with open(pdf_path, 'rb') as pdf_file:
                parsed_output = partition_file(
                    pdf_file, 
                    aryn_api_key=self.config.api_key,
                    text_mode="auto",
                    table_mode="standard",
                    extract_images=True,
                    output_format="json"
                )
            
            # The output is already a dictionary from the Aryn SDK
            return parsed_output
            
        except Exception as e:
            raise Exception(f"Failed to parse PDF {pdf_path}: {str(e)}")
    
    def parse_docx(self, docx_path: str, output_format: str = "json") -> Dict[str, Any]:
        """
        Parse a DOCX document using Aryn AI DocParse SDK.
        
        Args:
            docx_path: Path to the DOCX file
            output_format: Output format ('json' or 'markdown')
            
        Returns:
            Parsed document data as dictionary
            
        Raises:
            FileNotFoundError: If DOCX file doesn't exist
            Exception: If parsing fails
        """
        if not os.path.exists(docx_path):
            raise FileNotFoundError(f"DOCX file not found: {docx_path}")
        
        try:
            # Use Aryn SDK to parse the file
            with open(docx_path, 'rb') as docx_file:
                parsed_output = partition_file(
                    docx_file, 
                    aryn_api_key=self.config.api_key,
                    text_mode="auto",
                    table_mode="standard",
                    extract_images=True,
                    output_format="json"
                )
            
            # The output is already a dictionary from the Aryn SDK
            return parsed_output
            
        except Exception as e:
            raise Exception(f"Failed to parse DOCX {docx_path}: {str(e)}")
    
    def parse_multiple_documents(self, document_directory: str, output_format: str = "json", 
                                output_dir: Optional[str] = None, force_reparse: bool = False) -> Dict[str, Dict[str, Any]]:
        """
        Parse multiple documents (PDF, DOCX, DOC) from a directory.
        
        Args:
            document_directory: Directory containing document files
            output_format: Output format ('json' or 'markdown')
            output_dir: Directory to save parsed outputs (optional)
            force_reparse: Force re-parsing even if cached version exists
            
        Returns:
            Dictionary mapping filenames to parsed data
            
        Raises:
            FileNotFoundError: If directory doesn't exist
        """
        doc_dir = Path(document_directory)
        if not doc_dir.exists():
            raise FileNotFoundError(f"Directory not found: {document_directory}")
        
        # Find all supported document files
        document_files = []
        for ext in self.supported_extensions:
            document_files.extend(doc_dir.glob(f"*{ext}"))
        
        if not document_files:
            raise FileNotFoundError(f"No supported document files found in: {document_directory}. Supported types: {self.supported_extensions}")
        
        # Set up output directory
        if output_dir:
            output_path = Path(output_dir)
            output_path.mkdir(exist_ok=True)
        else:
            output_path = None
        
        results = {}
        for doc_file in document_files:
            try:
                # Check if cached version exists and is newer than document
                cached_file = None
                if output_path:
                    cached_file = output_path / f"{doc_file.stem}_parsed.json"
                
                if not force_reparse and cached_file and cached_file.exists():
                    # Check if cached file is newer than document
                    doc_mtime = doc_file.stat().st_mtime
                    cached_mtime = cached_file.stat().st_mtime
                    
                    if cached_mtime > doc_mtime:
                        print(f"Using cached version for {doc_file.name} (document unchanged)")
                        # Load cached data
                        with open(cached_file, 'r', encoding='utf-8') as f:
                            import json
                            results[doc_file.name] = json.load(f)
                        continue
                    else:
                        print(f"Document {doc_file.name} has been modified, re-parsing...")
                
                print(f"Parsing {doc_file.name}...")
                results[doc_file.name] = self.parse_document(str(doc_file), output_format)
                print(f"Successfully parsed {doc_file.name}")
                
                # Save to cache if output directory is specified
                if output_path and "error" not in results[doc_file.name]:
                    self.save_parsed_data(results[doc_file.name], str(cached_file))
                    
            except Exception as e:
                print(f"Error parsing {doc_file.name}: {str(e)}")
                results[doc_file.name] = {"error": str(e)}
        
        return results
    
    def parse_multiple_docx(self, docx_directory: str, output_format: str = "json", 
                           output_dir: Optional[str] = None, force_reparse: bool = False) -> Dict[str, Dict[str, Any]]:
        """
        Parse multiple DOCX files from a directory.
        
        Args:
            docx_directory: Directory containing DOCX files
            output_format: Output format ('json' or 'markdown')
            output_dir: Directory to save parsed outputs (optional)
            force_reparse: Force re-parsing even if cached version exists
            
        Returns:
            Dictionary mapping filenames to parsed data
            
        Raises:
            FileNotFoundError: If directory doesn't exist
        """
        docx_dir = Path(docx_directory)
        if not docx_dir.exists():
            raise FileNotFoundError(f"Directory not found: {docx_directory}")
        
        docx_files = list(docx_dir.glob("*.docx"))
        if not docx_files:
            raise FileNotFoundError(f"No DOCX files found in: {docx_directory}")
        
        # Set up output directory
        if output_dir:
            output_path = Path(output_dir)
            output_path.mkdir(exist_ok=True)
        else:
            output_path = None
        
        results = {}
        for docx_file in docx_files:
            try:
                # Check if cached version exists and is newer than DOCX
                cached_file = None
                if output_path:
                    cached_file = output_path / f"{docx_file.stem}_parsed.json"
                
                if not force_reparse and cached_file and cached_file.exists():
                    # Check if cached file is newer than DOCX
                    docx_mtime = docx_file.stat().st_mtime
                    cached_mtime = cached_file.stat().st_mtime
                    
                    if cached_mtime > docx_mtime:
                        print(f"Using cached version for {docx_file.name} (DOCX unchanged)")
                        # Load cached data
                        with open(cached_file, 'r', encoding='utf-8') as f:
                            import json
                            results[docx_file.name] = json.load(f)
                        continue
                    else:
                        print(f"DOCX {docx_file.name} has been modified, re-parsing...")
                
                print(f"Parsing {docx_file.name}...")
                results[docx_file.name] = self.parse_docx(str(docx_file), output_format)
                print(f"Successfully parsed {docx_file.name}")
                
                # Save to cache if output directory is specified
                if output_path and "error" not in results[docx_file.name]:
                    self.save_parsed_data(results[docx_file.name], str(cached_file))
                    
            except Exception as e:
                print(f"Error parsing {docx_file.name}: {str(e)}")
                results[docx_file.name] = {"error": str(e)}
        
        return results
    
    def parse_multiple_pdfs(self, pdf_directory: str, output_format: str = "json", 
                           output_dir: Optional[str] = None, force_reparse: bool = False) -> Dict[str, Dict[str, Any]]:
        """
        Parse multiple PDF files from a directory.
        
        Args:
            pdf_directory: Directory containing PDF files
            output_format: Output format ('json' or 'markdown')
            output_dir: Directory to save parsed outputs (optional)
            force_reparse: Force re-parsing even if cached version exists
            
        Returns:
            Dictionary mapping filenames to parsed data
            
        Raises:
            FileNotFoundError: If directory doesn't exist
        """
        pdf_dir = Path(pdf_directory)
        if not pdf_dir.exists():
            raise FileNotFoundError(f"Directory not found: {pdf_directory}")
        
        pdf_files = list(pdf_dir.glob("*.pdf"))
        if not pdf_files:
            raise FileNotFoundError(f"No PDF files found in: {pdf_directory}")
        
        # Set up output directory
        if output_dir:
            output_path = Path(output_dir)
            output_path.mkdir(exist_ok=True)
        else:
            output_path = None
        
        results = {}
        for pdf_file in pdf_files:
            try:
                # Check if cached version exists and is newer than PDF
                cached_file = None
                if output_path:
                    cached_file = output_path / f"{pdf_file.stem}_parsed.json"
                
                if not force_reparse and cached_file and cached_file.exists():
                    # Check if cached file is newer than PDF
                    pdf_mtime = pdf_file.stat().st_mtime
                    cached_mtime = cached_file.stat().st_mtime
                    
                    if cached_mtime > pdf_mtime:
                        print(f"Using cached version for {pdf_file.name} (PDF unchanged)")
                        # Load cached data
                        with open(cached_file, 'r', encoding='utf-8') as f:
                            import json
                            results[pdf_file.name] = json.load(f)
                        continue
                    else:
                        print(f"PDF {pdf_file.name} has been modified, re-parsing...")
                
                print(f"Parsing {pdf_file.name}...")
                results[pdf_file.name] = self.parse_pdf(str(pdf_file), output_format)
                print(f"Successfully parsed {pdf_file.name}")
                
                # Save to cache if output directory is specified
                if output_path and "error" not in results[pdf_file.name]:
                    self.save_parsed_data(results[pdf_file.name], str(cached_file))
                    
            except Exception as e:
                print(f"Error parsing {pdf_file.name}: {str(e)}")
                results[pdf_file.name] = {"error": str(e)}
        
        return results
    
    def save_parsed_data(self, parsed_data: Dict[str, Any], output_path: str):
        """
        Save parsed data to a JSON file.
        
        Args:
            parsed_data: Parsed document data
            output_path: Path to save the JSON file
        """
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(parsed_data, f, indent=2, ensure_ascii=False)
    
    def get_document_summary(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract summary information from parsed document.
        
        Args:
            parsed_data: Parsed document data from Aryn API
            
        Returns:
            Dictionary containing document summary
        """
        elements = parsed_data.get("elements", [])
        
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
            "status_code": parsed_data.get("status_code", "unknown")
        }
        
        return summary
