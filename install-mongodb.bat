@echo off
echo ===================================
echo Card Maker - MongoDB Setup
echo ===================================
echo.

cd backend
echo Installing backend dependencies with MongoDB...
call npm install
echo.

cd ..\frontend
echo Installing frontend dependencies...
call npm install
echo.

cd ..\ai-service
echo Installing AI service dependencies...
call pip install -r requirements.txt
echo.

echo.
echo ===================================
echo Installation Complete!
echo ===================================
echo.
echo NEXT STEPS:
echo 1. Install MongoDB Community Edition from: https://www.mongodb.com/try/download/community
echo 2. Start MongoDB service: net start MongoDB
echo 3. Update backend/.env with your MONGODB_URI if needed
echo 4. Run: start-all.bat
echo.
pause
