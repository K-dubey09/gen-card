@echo off
echo ============================================================
echo   CARD MAKER - Starting All Services
echo ============================================================
echo.

REM Start Python AI Service
echo [1/3] Starting Python AI Service (Port 5001)...
start "AI Service" cmd /k "cd ai-service && .\venv\Scripts\python.exe app.py"
timeout /t 3 /nobreak >nul

REM Start Node.js Backend
echo [2/3] Starting Node.js Backend (Port 5000)...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul

REM Start React Frontend
echo [3/3] Starting React Frontend (Port 5173)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================
echo   All services started!
echo ============================================================
echo   AI Service:  http://localhost:5001
echo   Backend:     http://localhost:5000
echo   Frontend:    http://localhost:5173
echo ============================================================
echo.
echo Press any key to exit this window...
pause >nul
