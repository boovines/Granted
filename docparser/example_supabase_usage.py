"""
Example usage script for Supabase-integrated document processing and querying.
"""
import os
from pathlib import Path

from supabase_config import SupabaseConfig
from supabase_docquery import SupabaseDocQuery, process_pdf_to_supabase, quick_supabase_query


def main():
    """Main example function demonstrating Supabase-integrated document processing."""
    
    # Configuration
    print("Setting up Supabase-integrated DocQuery system...")
    
    try:
        # Initialize the system
        doc_query = SupabaseDocQuery()  # Will use environment variables
        print("✓ Supabase DocQuery initialized successfully")
        
        # Test connection
        if not doc_query.supabase_config.test_connection():
            print("✗ Supabase connection test failed")
            return
        print("✓ Supabase connection test passed")
        
    except Exception as e:
        print(f"✗ Initialization error: {e}")
        print("\nPlease ensure you have set the following environment variables:")
        print("- SUPABASE_URL")
        print("- SUPABASE_KEY") 
        print("- OPENAI_API_KEY")
        print("- ARYN_API_KEY")
        return
    
    # Example workspace ID
    workspace_id = "example-workspace-123"
    
    print(f"\nUsing workspace ID: {workspace_id}")
    
    # Example 1: Process a local PDF file
    print("\n" + "="*60)
    print("EXAMPLE 1: PROCESSING LOCAL PDF FILE")
    print("="*60)
    
    # Look for PDF files in the src directory
    src_dir = Path(__file__).parent / "src"
    pdf_files = list(src_dir.glob("*.pdf"))
    
    if pdf_files:
        pdf_path = pdf_files[0]  # Use the first PDF found
        print(f"Processing PDF: {pdf_path.name}")
        
        # Process the PDF
        result = doc_query.process_local_pdf(
            str(pdf_path), 
            workspace_id,
            {"source": "example_script", "processed_by": "supabase_processor"}
        )
        
        if result["success"]:
            print(f"✓ PDF processed successfully!")
            print(f"  Document ID: {result['document_id']}")
            print(f"  Chunks processed: {result['chunks_processed']}")
            print(f"  Cache stored: {result['cache_stored']}")
            
            document_id = result['document_id']
        else:
            print(f"✗ PDF processing failed: {result['error']}")
            return
    else:
        print("No PDF files found in src directory. Skipping PDF processing example.")
        print("Please add a PDF file to the src directory to test PDF processing.")
        
        # For demo purposes, we'll show how to query existing documents
        print("\nChecking for existing documents in workspace...")
        existing_docs = doc_query.list_workspace_documents(workspace_id)
        
        if existing_docs:
            document_id = existing_docs[0]["id"]
            print(f"Found existing document: {existing_docs[0]['filename']} (ID: {document_id})")
        else:
            print("No existing documents found. Please process a PDF first.")
            return
    
    # Example 2: Get document overview
    print("\n" + "="*60)
    print("EXAMPLE 2: DOCUMENT OVERVIEW")
    print("="*60)
    
    overview = doc_query.get_document_overview(document_id)
    if overview["success"]:
        print(f"Document Overview:")
        print(f"  Title: {overview['title']}")
        print(f"  Filename: {overview['filename']}")
        print(f"  Pages: {overview['page_count']}")
        print(f"  Chunks: {overview['chunk_count']}")
        print(f"  Element Types: {overview['element_types']}")
        print(f"  Upload Date: {overview['upload_date']}")
    else:
        print(f"✗ Failed to get document overview: {overview['error']}")
    
    # Example 3: Query documents
    print("\n" + "="*60)
    print("EXAMPLE 3: DOCUMENT QUERYING")
    print("="*60)
    
    example_queries = [
        "What is the main topic of this document?",
        "Summarize the key findings",
        "What methods were used?",
        "What are the conclusions?"
    ]
    
    for query in example_queries:
        print(f"\nQuery: '{query}'")
        print("-" * 40)
        
        results = doc_query.query_documents(workspace_id, query, limit=3)
        
        if results["success"]:
            print(f"Found {results['total_results']} results:")
            print(results['formatted_response'])
            
            # Save results to file
            save_result = doc_query.save_query_results(query, results)
            if save_result["success"]:
                print(f"Results saved to: {save_result['filename']}")
        else:
            print(f"✗ Query failed: {results['error']}")
    
    # Example 4: List workspace documents
    print("\n" + "="*60)
    print("EXAMPLE 4: WORKSPACE DOCUMENTS")
    print("="*60)
    
    documents = doc_query.list_workspace_documents(workspace_id)
    print(f"Documents in workspace '{workspace_id}':")
    
    for doc in documents:
        print(f"  - {doc['filename']} (ID: {doc['id']})")
        print(f"    Status: {doc['status']}, Uploaded: {doc['upload_date']}")
    
    # Example 5: Get document chunks
    print("\n" + "="*60)
    print("EXAMPLE 5: DOCUMENT CHUNKS")
    print("="*60)
    
    chunks = doc_query.get_document_chunks(document_id, limit=5)
    print(f"First 5 chunks of document {document_id}:")
    
    for i, chunk in enumerate(chunks, 1):
        print(f"\nChunk {i} (ID: {chunk['id']}):")
        print(f"  Text: {chunk['text'][:100]}...")
        print(f"  Metadata: {chunk['metadata']}")
    
    # Interactive query mode
    print("\n" + "="*60)
    print("INTERACTIVE QUERY MODE")
    print("="*60)
    print("Enter queries to search the documents (type 'quit' to exit)")
    print("Available commands:")
    print("- 'list' - Show workspace documents")
    print("- 'overview <doc_id>' - Show document overview")
    print("- 'chunks <doc_id>' - Show document chunks")
    print("- 'delete <doc_id>' - Delete document")
    print("- 'quit' - Exit")
    
    while True:
        try:
            user_input = input("\nEnter query: ").strip()
            
            if user_input.lower() == 'quit':
                break
            elif user_input.lower() == 'list':
                docs = doc_query.list_workspace_documents(workspace_id)
                print(f"Workspace documents:")
                for doc in docs:
                    print(f"  - {doc['filename']} (ID: {doc['id']})")
            elif user_input.lower().startswith('overview '):
                doc_id = user_input[9:].strip()
                overview = doc_query.get_document_overview(doc_id)
                if overview["success"]:
                    print(f"Document Overview: {overview}")
                else:
                    print(f"Error: {overview['error']}")
            elif user_input.lower().startswith('chunks '):
                doc_id = user_input[7:].strip()
                chunks = doc_query.get_document_chunks(doc_id, limit=10)
                print(f"Document chunks:")
                for i, chunk in enumerate(chunks, 1):
                    print(f"  {i}. {chunk['text'][:100]}...")
            elif user_input.lower().startswith('delete '):
                doc_id = user_input[7:].strip()
                if doc_query.delete_document(doc_id):
                    print(f"Document {doc_id} deleted successfully")
                else:
                    print(f"Failed to delete document {doc_id}")
            elif user_input:
                results = doc_query.query_documents(workspace_id, user_input)
                if results["success"]:
                    print(results['formatted_response'])
                else:
                    print(f"Query failed: {results['error']}")
            
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Error: {e}")
    
    print("Thank you for using the Supabase-integrated PDF Document Processor!")


def quick_example():
    """Quick example using convenience functions."""
    print("Quick Supabase DocQuery Example")
    print("="*40)
    
    workspace_id = "quick-example-workspace"
    
    # Quick query (if documents exist)
    query = "What is the main topic?"
    result = quick_supabase_query(workspace_id, query)
    print(f"Query: {query}")
    print(f"Result: {result}")
    
    # Process PDF (if available)
    src_dir = Path(__file__).parent / "src"
    pdf_files = list(src_dir.glob("*.pdf"))
    
    if pdf_files:
        pdf_path = pdf_files[0]
        print(f"\nProcessing PDF: {pdf_path.name}")
        
        result = process_pdf_to_supabase(str(pdf_path), workspace_id)
        if result["success"]:
            print(f"✓ PDF processed successfully! Document ID: {result['document_id']}")
        else:
            print(f"✗ Processing failed: {result['error']}")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "quick":
        quick_example()
    else:
        main()
