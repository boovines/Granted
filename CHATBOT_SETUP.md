# Granted Chatbot Setup

## 🎯 **Simple Chatbot Implementation**

Your chatbot is now ready! Here's what we've implemented:

### ✅ **What's Working:**

1. **Frontend Integration**
   - Updated `AssistantChat.tsx` to use real API calls instead of mock responses
   - Created `chatApi.ts` utility for backend communication
   - Modified `App.tsx` to send messages to your context orchestration backend

2. **Backend Integration**
   - Your backend already has the `/chat/query` endpoint
   - Context orchestration pipeline combines rules + PDF sources + live documents + chat memory
   - Hardcoded grant proposal rules are automatically applied

3. **User Experience**
   - Press **Enter** in the textarea to send messages
   - **Shift+Enter** for new lines
   - Send button also works
   - Loading indicators while processing
   - Error handling with fallback messages

### 🚀 **How to Start:**

#### **Option 1: Use the Startup Script (Recommended)**
```bash
cd /Users/justinhou/Development/Granted
./start_chatbot.sh
```

#### **Option 2: Manual Start**
```bash
# Terminal 1: Start Backend
cd /Users/justinhou/Development/Granted/backend
python3 run.py

# Terminal 2: Start Frontend  
cd /Users/justinhou/Development/Granted
npm run dev
```

### 🎯 **How to Use:**

1. **Open your browser** to `http://localhost:5173`
2. **Navigate to the chat panel** (right side of the interface)
3. **Type a message** like:
   - "Help me write the executive summary for the grant proposal"
   - "What are the key requirements for the solar microgrid project?"
   - "How should I structure the budget overview?"
4. **Press Enter** or click the send button
5. **Get AI response** with grant proposal guidelines automatically applied

### 🔧 **Technical Details:**

#### **API Flow:**
```
User Types Message
    ↓
Frontend sends to: POST /chat/query
    ↓
Backend Context Orchestration:
    ├── Hardcoded Rules (GreenFuture Alliance guidelines)
    ├── PDF Sources (semantic search via embeddings)
    ├── Live Documents (from Supabase documents table)
    └── Chat Memory (from Supabase chat_messages table)
    ↓
OpenAI API Call
    ↓
Response returned to frontend
```

#### **Key Files Modified:**
- `src/utils/chatApi.ts` - New API utility
- `src/App.tsx` - Updated chat handler
- `backend/retrievers/pdf_retriever.py` - Supabase integration
- `backend/retrievers/rules_manager.py` - Hardcoded rules
- `backend/prompt_builder.py` - Context orchestration

### 🎨 **Features:**

- ✅ **Automatic Rules Application**: Every response follows grant proposal guidelines
- ✅ **PDF Semantic Search**: Searches your PDF documents using embeddings
- ✅ **Context Awareness**: Includes relevant document context and chat history
- ✅ **Error Handling**: Graceful fallbacks if backend is unavailable
- ✅ **Loading States**: Visual feedback during processing
- ✅ **Citation Support**: Links to source documents (when available)

### 🐛 **Troubleshooting:**

#### **Backend Not Responding:**
- Check if backend is running: `curl http://localhost:8000/health`
- Verify environment variables in `backend/.env`
- Check backend logs for errors

#### **Frontend Issues:**
- Clear browser cache and refresh
- Check browser console for errors
- Verify frontend is running on port 5173

#### **API Connection Issues:**
- The chat will show a fallback message if backend is unavailable
- Check network connectivity
- Verify CORS settings if needed

### 🎯 **Example Conversations:**

**User:** "Help me write the executive summary"
**AI:** *[Response with GreenFuture Alliance guidelines, focusing on goal, region, funding amount, and long-term benefits]*

**User:** "What should I include in the budget overview?"
**AI:** *[Response with transparent allocation guidance, linking budget lines to outcomes, mentioning co-funding]*

**User:** "How do I demonstrate scalability?"
**AI:** *[Response emphasizing local empowerment, maintenance plans, and revenue models]*

Your chatbot is now fully integrated with your context orchestration pipeline! 🎉
