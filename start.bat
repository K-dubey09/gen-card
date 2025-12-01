@echo off
echo ================================
echo Card Maker - Quick Start
echo ================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
pip install -r requirements.txt

echo.
echo [2/3] Checking environment setup...
if not exist .env (
    echo WARNING: .env file not found!
    echo Please create .env file with your API keys
    echo See .env.example for template
    pause
)

echo.
echo [3/3] Starting application...
echo.
echo ================================
echo   Card Maker is starting...
echo ================================
echo.
echo Visit: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

python app.py
