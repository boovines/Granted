"""
Example usage script for PDF document parsing and querying with Aryn AI.
"""
import os
from pathlib import Path

from config import ArynConfig
from pdf_parser import PDFParser
from query_engine import QueryEngine


def main():
    """Main example function demonstrating PDF parsing and querying."""
    
    # Configuration
    print("Setting up Aryn AI configuration...")
    try:
        config = ArynConfig()  # Will use ARYN_API_KEY environment variable
        print("✓ Configuration loaded successfully")
    except ValueError as e:
        print(f"✗ Configuration error: {e}")
        print("Please set your ARYN_API_KEY environment variable:")
        print("export ARYN_API_KEY='your_api_key_here'")
        return
    
    # Initialize parser and query engine
    parser = PDFParser(config)
    query_engine = QueryEngine(config)
    
    # Paths
    src_dir = Path(__file__).parent / "src"
    output_dir = Path(__file__).parent / "parsed_outputs"
    output_dir.mkdir(exist_ok=True)
    
    print(f"\nSource directory: {src_dir}")
    print(f"Output directory: {output_dir}")
    
    # Parse PDF documents
    print("\n" + "="*50)
    print("PARSING PDF DOCUMENTS")
    print("="*50)
    
    try:
        # Parse all PDFs in the src directory
        parsed_results = parser.parse_multiple_pdfs(str(src_dir))
        
        # Save parsed results
        for filename, parsed_data in parsed_results.items():
            if "error" not in parsed_data:
                output_file = output_dir / f"{Path(filename).stem}_parsed.json"
                parser.save_parsed_data(parsed_data, str(output_file))
                print(f"✓ Saved parsed data: {output_file}")
                
                # Show document summary
                summary = parser.get_document_summary(parsed_data)
                print(f"  - Pages: {summary['page_count']}")
                print(f"  - Chunks: {summary['chunk_count']}")
                print(f"  - Tables: {summary['table_count']}")
                print(f"  - Images: {summary['image_count']}")
            else:
                print(f"✗ Error parsing {filename}: {parsed_data['error']}")
    
    except Exception as e:
        print(f"✗ Error during parsing: {e}")
        return
    
    # Load parsed documents into query engine
    print("\n" + "="*50)
    print("LOADING DOCUMENTS FOR QUERYING")
    print("="*50)
    
    try:
        query_engine.load_parsed_documents(str(output_dir))
        loaded_docs = query_engine.list_loaded_documents()
        print(f"✓ Loaded {len(loaded_docs)} documents: {loaded_docs}")
    except Exception as e:
        print(f"✗ Error loading documents: {e}")
        return
    
    # Example queries
    print("\n" + "="*50)
    print("EXAMPLE QUERIES")
    print("="*50)
    
    example_queries = [
        "What is the main topic of this document?",
        "Summarize the key findings",
        "What methods were used?",
        "What are the conclusions?",
        "Find any tables or data"
    ]
    
    for query in example_queries:
        print(f"\nQuery: '{query}'")
        print("-" * 40)
        try:
            response = query_engine.query_documents(query, max_results=3)
            print(response)
        except Exception as e:
            print(f"✗ Error querying: {e}")
    
    # Interactive query mode
    print("\n" + "="*50)
    print("INTERACTIVE QUERY MODE")
    print("="*50)
    print("Enter queries to search the documents (type 'quit' to exit)")
    print("Available commands:")
    print("- 'list' - Show loaded documents")
    print("- 'overview <doc_name>' - Show document overview")
    print("- 'quit' - Exit")
    
    while True:
        try:
            user_input = input("\nEnter query: ").strip()
            
            if user_input.lower() == 'quit':
                break
            elif user_input.lower() == 'list':
                docs = query_engine.list_loaded_documents()
                print(f"Loaded documents: {docs}")
            elif user_input.lower().startswith('overview '):
                doc_name = user_input[9:].strip()
                try:
                    overview = query_engine.get_document_overview(doc_name)
                    print(overview)
                except KeyError as e:
                    print(f"Document not found: {e}")
            elif user_input:
                response = query_engine.query_documents(user_input)
                print(response)
            
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Error: {e}")
    
    print("Thank you for using the PDF Document Parser!")


if __name__ == "__main__":
    main()
