#!/bin/bash

# Simple Chatbot Startup Script
# This script helps you start both the backend and frontend for the chatbot

echo "🚀 Starting Granted Chatbot System"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo "❌ Please run this script from the Granted project root directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Check if backend is already running
if check_port 8000; then
    echo "⚠️  Backend server is already running on port 8000"
    echo "   If you want to restart it, please stop it first with Ctrl+C"
else
    echo "🔧 Starting backend server..."
    echo "   Backend will run on: http://localhost:8000"
    echo "   API docs will be at: http://localhost:8000/docs"
    echo ""
    
    # Start backend in background
    cd backend
    python3 run.py &
    BACKEND_PID=$!
    cd ..
    
    echo "✅ Backend started (PID: $BACKEND_PID)"
    echo ""
fi

# Check if frontend is already running
if check_port 5173; then
    echo "⚠️  Frontend server is already running on port 5173"
    echo "   If you want to restart it, please stop it first with Ctrl+C"
else
    echo "🌐 Starting frontend server..."
    echo "   Frontend will run on: http://localhost:5173"
    echo ""
    
    # Start frontend
    npm run dev &
    FRONTEND_PID=$!
    
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
    echo ""
fi

echo "🎉 Chatbot system is starting up!"
echo ""
echo "📋 Quick Start Guide:"
echo "   1. Wait for both servers to start (should take ~10-30 seconds)"
echo "   2. Open http://localhost:5173 in your browser"
echo "   3. Type a message in the chat panel on the right"
echo "   4. Press Enter or click the send button"
echo ""
echo "🔧 Backend API:"
echo "   - Health check: http://localhost:8000/health"
echo "   - API docs: http://localhost:8000/docs"
echo "   - Chat endpoint: http://localhost:8000/chat/query"
echo ""
echo "📝 Chat Features:"
echo "   - Hardcoded grant proposal rules are automatically applied"
echo "   - PDF documents are searched semantically using embeddings"
echo "   - Context from live documents and chat history is included"
echo "   - Press Enter to send messages, Shift+Enter for new lines"
echo ""
echo "🛑 To stop the servers:"
echo "   - Press Ctrl+C in this terminal"
echo "   - Or manually kill the processes with: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Wait for user input to stop
echo "Press Ctrl+C to stop all servers..."
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ Servers stopped'; exit 0" INT

# Keep the script running
wait
