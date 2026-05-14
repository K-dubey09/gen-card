@echo off
echo ========================================
echo   Card Maker - RBAC System Status
echo ========================================
echo.

echo Checking required files...
echo.

set "FILES_OK=1"

if exist "backend\middleware\rbac.js" (
    echo [OK] RBAC Middleware
) else (
    echo [MISSING] RBAC Middleware
    set "FILES_OK=0"
)

if exist "backend\routes\admin.js" (
    echo [OK] Admin Routes
) else (
    echo [MISSING] Admin Routes
    set "FILES_OK=0"
)

if exist "backend\routes\authMongo.js" (
    echo [OK] MongoDB Auth
) else (
    echo [MISSING] MongoDB Auth
    set "FILES_OK=0"
)

if exist "backend\init-db.js" (
    echo [OK] Database Init Script
) else (
    echo [MISSING] Database Init Script
    set "FILES_OK=0"
)

if exist "frontend\src\pages\AdminPanel.jsx" (
    echo [OK] Admin Panel Component
) else (
    echo [MISSING] Admin Panel Component
    set "FILES_OK=0"
)

if exist "frontend\src\pages\AdminPanel.css" (
    echo [OK] Admin Panel Styles
) else (
    echo [MISSING] Admin Panel Styles
    set "FILES_OK=0"
)

if exist "backend\.env" (
    echo [OK] Environment Config
) else (
    echo [MISSING] Environment Config
    set "FILES_OK=0"
)

echo.
echo ========================================
echo.

if "%FILES_OK%"=="1" (
    echo Status: [READY] All files present
    echo.
    echo Next Steps:
    echo 1. Run: setup-rbac.bat
    echo 2. Run: start-all.bat
    echo 3. Login as admin@cardmaker.com / admin123
    echo 4. Access: http://localhost:5173/admin
) else (
    echo Status: [ERROR] Some files missing
    echo Please check the implementation
)

echo.
echo ========================================
echo.

echo Checking MongoDB Status...
echo.

net start MongoDB >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] MongoDB Service Running
) else (
    echo [WARNING] MongoDB not running
    echo Run: net start MongoDB
)

echo.
echo ========================================
echo.

pause
