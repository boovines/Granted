#!/bin/bash

# PDF DocQuery Installation Script
echo "🚀 Installing PDF DocQuery..."

# Check Python version
python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
required_version="3.10"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Error: Python 3.10 or higher is required. Current version: $python_version"
    exit 1
fi

echo "✅ Python version: $python_version"

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 Created .env file from template"
        echo "⚠️  Please edit .env file and add your Aryn AI API key"
    else
        echo "⚠️  .env.example not found. Please create .env file manually"
    fi
else
    echo "✅ .env file already exists"
fi

# Create src directory if it doesn't exist
if [ ! -d "src" ]; then
    mkdir src
    echo "📁 Created src directory for PDF files"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "1. Get your Aryn AI API key from: https://www.aryn.ai/get-started"
echo "2. Edit .env file and add your API key"
echo "3. Place PDF files in the src/ directory"
echo "4. Run: python3 docquery.py 'your query here'"
echo ""
echo "Example:"
echo "python3 docquery.py 'What is the main topic of this document?'"
