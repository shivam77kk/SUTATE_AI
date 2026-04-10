@echo off
echo ========================================
echo UniSight Setup & Verification
echo ========================================
echo.

echo [1/4] Checking Backend Dependencies...
cd /d %~dp0backend
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
) else (
    echo Backend dependencies already installed.
)

echo.
echo [2/4] Checking Frontend Dependencies...
cd /d %~dp0frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
) else (
    echo Frontend dependencies already installed.
)

echo.
echo [3/4] Verifying Configuration Files...
cd /d %~dp0backend
if not exist .env (
    echo WARNING: backend/.env not found!
    echo Please create .env file with required variables.
) else (
    echo Backend .env found.
)

cd /d %~dp0frontend
if not exist .env.local (
    echo WARNING: frontend/.env.local not found!
    echo Please create .env.local file with required variables.
) else (
    echo Frontend .env.local found.
)

echo.
echo [4/4] Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Ensure MongoDB is running
echo 2. Run START.bat to launch the application
echo 3. Access http://localhost:3000
echo.
echo ========================================
pause
