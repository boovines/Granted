/**
 * API utilities for chat functionality
 */

interface ChatRequest {
  message: string;
  workspace_id?: string;
  chat_id?: string;
  context_files?: string[]; // File IDs for context
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
    // For now, we'll use a simple fetch to your backend
    // You'll need to update this URL to match your backend
    const backendUrl = 'http://localhost:8000'; // Adjust this to your backend URL
    
    const response = await fetch(`${backendUrl}/chat/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspace_id: request.workspace_id || '550e8400-e29b-41d4-a716-446655440000', // Default test workspace
        chat_id: request.chat_id || `chat-${Date.now()}`,
        message: request.message,
        context_files: request.context_files || []
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      response: data.response || data.message || 'No response received'
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
    const backendUrl = 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    return response.ok;
  } catch (error) {
    console.warn('Backend not available:', error);
    return false;
  }
}
