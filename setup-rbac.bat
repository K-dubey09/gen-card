@echo off
echo ========================================
echo   RBAC & MongoDB Setup
echo ========================================
echo.

echo Step 1: Installing backend dependencies...
cd backend
call npm install
echo.

echo Step 2: Initializing MongoDB database...
node init-db.js
echo.

echo Step 3: Setup complete!
echo.
echo ========================================
echo   IMPORTANT INFORMATION
echo ========================================
echo.
echo Default Admin Credentials:
echo   Email: admin@cardmaker.com
echo   Password: admin123
echo.
echo CHANGE THIS PASSWORD IMMEDIATELY!
echo.
echo Admin Panel: http://localhost:5173/admin
echo.
echo ========================================
echo.

cd ..
pause
