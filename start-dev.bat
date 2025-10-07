@echo off
color 0A
echo =====================================================
echo        Starting Loomio Development Environment
echo =====================================================
echo.

:: Navigate to project root
cd /d "%~dp0"

echo [1/3] Starting Backend Server...
start "Loomio Backend Server" /D "%~dp0backend" cmd /k "npm start"

echo [2/3] Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Development Server...
start "Loomio Frontend Server" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo Opening application in browser...
start http://localhost:5173

echo.
echo =====================================================
echo            Loomio Development Started!
echo =====================================================
echo Backend API: http://localhost:5000/api
echo Frontend:    http://localhost:5173
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
echo Press any key to exit this window...
pause >nul
