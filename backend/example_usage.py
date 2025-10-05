#!/usr/bin/env python3
"""
Example usage of the PDF retriever integrated with docparser.
"""
import sys
from pathlib import Path

# Add the retrievers directory to the path
retrievers_dir = Path(__file__).parent / "retrievers"
sys.path.insert(0, str(retrievers_dir))

from pdf_retriever import PDFRetriever, get_pdf_context, search_pdf_documents

def main():
    """Example usage of the PDF retriever."""
    print("=== PDF Retriever Example Usage ===\n")
    
    # Initialize the retriever
    print("1. Initializing PDF retriever...")
    retriever = PDFRetriever()
    
    if not retriever.doc_query:
        print("❌ Failed to initialize PDF retriever")
        return
    
    print("✅ PDF retriever initialized successfully")
    
    # List available documents
    print("\n2. Available documents:")
    documents = retriever.list_available_documents()
    for i, doc in enumerate(documents, 1):
        print(f"   {i}. {doc}")
    
    # Example queries
    queries = [
        "What are the main topics discussed?",
        "How many tables are there?",
        "What is the investment memo about?",
        "What are the key findings?"
    ]
    
    print(f"\n3. Running example queries...")
    for i, query in enumerate(queries, 1):
        print(f"\n   Query {i}: '{query}'")
        results = retriever.get_pdf_context("example_workspace", query, k=2)
        
        if results:
            print(f"   ✅ Found {len(results)} results:")
            for j, result in enumerate(results, 1):
                print(f"      {j}. {result[:100]}{'...' if len(result) > 100 else ''}")
        else:
            print("   ❌ No results found")
    
    # Example of searching specific documents
    print(f"\n4. Searching specific documents...")
    if documents:
        specific_query = "tables"
        specific_results = retriever.search_specific_documents(
            specific_query, [documents[0]], k=2
        )
        print(f"   Query: '{specific_query}' in document '{documents[0]}'")
        if specific_results:
            print(f"   ✅ Found {len(specific_results)} results:")
            for j, result in enumerate(specific_results, 1):
                print(f"      {j}. {result[:100]}{'...' if len(result) > 100 else ''}")
        else:
            print("   ❌ No results found")
    
    # Example using convenience functions
    print(f"\n5. Using convenience functions...")
    convenience_results = get_pdf_context("test", "investment", k=2)
    if convenience_results:
        print(f"   ✅ Convenience function found {len(convenience_results)} results")
    else:
        print("   ❌ Convenience function found no results")
    
    print(f"\n=== Example Complete ===")

if __name__ == "__main__":
    main()
