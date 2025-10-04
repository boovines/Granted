@echo off
echo 🚀 Installing PDF DocQuery...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python is not installed or not in PATH
    echo Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Python is installed

REM Install dependencies
echo 📦 Installing dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Error: Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Create .env file if it doesn't exist
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env
        echo 📝 Created .env file from template
        echo ⚠️  Please edit .env file and add your Aryn AI API key
    ) else (
        echo ⚠️  .env.example not found. Please create .env file manually
    )
) else (
    echo ✅ .env file already exists
)

REM Create src directory if it doesn't exist
if not exist "src" (
    mkdir src
    echo 📁 Created src directory for PDF files
)

echo.
echo 🎉 Installation complete!
echo.
echo Next steps:
echo 1. Get your Aryn AI API key from: https://www.aryn.ai/get-started
echo 2. Edit .env file and add your API key
echo 3. Place PDF files in the src\ directory
echo 4. Run: python docquery.py "your query here"
echo.
echo Example:
echo python docquery.py "What is the main topic of this document?"
echo.
pause
