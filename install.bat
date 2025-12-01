@echo off
echo ============================================================
echo   CARD MAKER - Installation Script
echo ============================================================
echo.

REM Install Backend Dependencies
echo [1/3] Installing Backend (Node.js) dependencies...
cd backend
if not exist node_modules (
    call npm install
) else (
    echo Backend dependencies already installed.
)
cd ..
echo.

REM Install AI Service Dependencies
echo [2/3] Installing AI Service (Python) dependencies...
cd ai-service
if not exist venv (
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
) else (
    echo Python virtual environment already exists.
)
cd ..
echo.

REM Install Frontend Dependencies
echo [3/3] Installing Frontend (React) dependencies...
cd frontend
if not exist node_modules (
    call npm install
) else (
    echo Frontend dependencies already installed.
)
cd ..
echo.

echo ============================================================
echo   Installation Complete!
echo ============================================================
echo   Run 'start-all.bat' to start all services.
echo ============================================================
pause
