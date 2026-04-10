@echo off
echo ========================================
echo Starting UniSight Application
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "UniSight Backend" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 5 /nobreak >nul

echo [2/2] Starting Frontend Server...
start "UniSight Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to open browser...
pause >nul

start http://localhost:3000

echo.
echo Application is running!
echo Close this window to keep servers running.
pause
