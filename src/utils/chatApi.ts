/**
 * API utilities for chat functionality
 */

interface ChatRequest {
  message: string;
  workspace_id?: string;
  chat_id?: string;
  context_files?: string[]; // File IDs for context
  use_rag?: boolean; // Whether to use RAG for context
}

interface ChatResponse {
  success: boolean;
  response: string;
  error?: string;
}

/**
 * Send a chat message to the backend and get a response
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const backendUrl = 'http://localhost:8001';
    
    // If we have context files and RAG is enabled, get RAG context first
    let ragContext = '';
    if (request.use_rag && request.context_files && request.context_files.length > 0) {
      try {
        const ragResponse = await fetch(`${backendUrl}/get_rag_context`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            document_ids: request.context_files,
            workspace_id: request.workspace_id || '550e8400-e29b-41d4-a716-446655440000',
            query: request.message,
            limit: 20
          }),
        });

        if (ragResponse.ok) {
          const ragData = await ragResponse.json();
          if (ragData.success && ragData.context) {
            ragContext = ragData.context;
          }
        }
      } catch (ragError) {
        console.warn('RAG context retrieval failed:', ragError);
        // Continue without RAG context
      }
    }

    // Build the message with RAG context if available
    let finalMessage = request.message;
    if (ragContext) {
      finalMessage = `Context from documents:\n\n${ragContext}\n\nUser question: ${request.message}`;
    }
    
    const response = await fetch(`${backendUrl}/chat/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspace_id: request.workspace_id || '550e8400-e29b-41d4-a716-446655440000',
        chat_id: request.chat_id || `chat-${Date.now()}`,
        message: finalMessage,
        context_files: request.context_files || []
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      response: data.answer || data.response || data.message || 'No response received'
    };

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Fallback to a simple response if the backend is not available
    return {
      success: false,
      response: `I apologize, but I'm having trouble connecting to the backend right now. Your message was: "${request.message}". Please ensure the backend server is running.`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test if the backend is available
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    const backendUrl = 'http://localhost:8001';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Backend not available:', error);
    return false;
  }
}
