// src/hooks/usePDFHandler.ts
import { useCallback, useState } from "react";
import { supabase } from "../config/supabaseClient";
import type { ExplorerFile } from "../components/Explorer";

interface PDFUploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  needsParsing?: boolean;
}

interface PDFHandlerOptions {
  workspaceId?: string;
  userId?: string;
}

export function usePDFHandler(options: PDFHandlerOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");

  const { workspaceId = '550e8400-e29b-41d4-a716-446655440000', userId = 'demo-user-123' } = options;

  /**
   * Upload a PDF file to Supabase Storage and create a document record
   */
  const uploadPDF = useCallback(async (file: File): Promise<PDFUploadResult> => {
    try {
      setIsProcessing(true);
      setProcessingStatus("Uploading file...");

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setProcessingStatus("Creating document record...");

      // Create document record in sources table (for frontend display)
      const { data: sourceData, error: sourceError } = await supabase
        .from('sources')
        .insert({
          user_id: userId,
          file_name: file.name,
          file_path: filePath,
          file_type: fileExt,
          uploaded_time: new Date().toISOString()
        })
        .select()
        .single();

      if (sourceError) {
        throw new Error(`Source record creation failed: ${sourceError.message}`);
      }

      setProcessingStatus("Creating backend document record...");

      // Create document record in documents table (for backend processing)
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          id: `doc_${timestamp}`,
          workspace_id: workspaceId,
          filename: file.name,
          file_type: fileExt,
          file_size: file.size,
          upload_date: new Date().toISOString(),
          status: 'pending',
          metadata: {
            storage_path: filePath,
            source_id: sourceData.id,
            user_id: userId
          }
        })
        .select()
        .single();

      if (docError) {
        throw new Error(`Document record creation failed: ${docError.message}`);
      }

      return {
        success: true,
        documentId: docData.id,
        needsParsing: true
      };

    } catch (error) {
      console.error('PDF upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  }, [workspaceId, userId]);

  /**
   * Check if a document needs parsing and trigger the parsing process
   */
  const parseDocumentIfNeeded = useCallback(async (documentId: string): Promise<boolean> => {
    try {
      setIsProcessing(true);
      setProcessingStatus("Checking document status...");

      // Check if document is already parsed
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('status, filename')
        .eq('id', documentId)
        .single();

      if (docError) {
        throw new Error(`Failed to check document status: ${docError.message}`);
      }

      if (docData.status === 'parsed') {
        setProcessingStatus("Document already parsed");
        return false; // No parsing needed
      }

      setProcessingStatus("Starting document parsing...");

      // Call backend parsing endpoint
      const response = await fetch('http://localhost:8000/parse_document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          workspace_id: workspaceId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Parsing failed: ${errorData.detail || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setProcessingStatus("Document parsed successfully");
        return true;
      } else {
        throw new Error(result.error || 'Parsing failed');
      }

    } catch (error) {
      console.error('Document parsing error:', error);
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessingStatus(""), 3000);
    }
  }, [workspaceId]);

  /**
   * Get embeddings for a document (for RAG context)
   */
  const getDocumentEmbeddings = useCallback(async (documentId: string, query?: string) => {
    try {
      const response = await fetch('http://localhost:8000/get_embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          workspace_id: workspaceId,
          query: query,
          limit: 10
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get embeddings: ${errorData.detail || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get embeddings error:', error);
      throw error;
    }
  }, [workspaceId]);

  /**
   * Process a PDF file: upload, parse, and embed
   */
  const processPDF = useCallback(async (file: File): Promise<PDFUploadResult> => {
    // Step 1: Upload the file
    const uploadResult = await uploadPDF(file);
    if (!uploadResult.success || !uploadResult.documentId) {
      return uploadResult;
    }

    // Step 2: Parse the document if needed
    const needsParsing = await parseDocumentIfNeeded(uploadResult.documentId);
    
    return {
      ...uploadResult,
      needsParsing
    };
  }, [uploadPDF, parseDocumentIfNeeded]);

  /**
   * Get RAG context for multiple documents
   */
  const getRAGContext = useCallback(async (documentIds: string[], query: string) => {
    try {
      const response = await fetch('http://localhost:8000/get_rag_context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_ids: documentIds,
          workspace_id: workspaceId,
          query: query,
          limit: 20
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get RAG context: ${errorData.detail || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get RAG context error:', error);
      throw error;
    }
  }, [workspaceId]);

  return {
    uploadPDF,
    parseDocumentIfNeeded,
    getDocumentEmbeddings,
    processPDF,
    getRAGContext,
    isProcessing,
    processingStatus
  };
}
