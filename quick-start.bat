@echo off
setlocal EnableDelayedExpansion

title Loomio - Quick Start (Post-Fix)

echo =====================================================
echo         Loomio Quick Start (Database Fixed)
echo =====================================================
echo.

:: Quick MySQL connection test
echo [1/2] Quick database connection test...
mysql -u root -p -e "USE loomio_db; SELECT 'Ready!' as Status;" >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ Database connection failed. Please run start-loomio-fixed.bat first.
    pause
    exit /b 1
)

echo ✅ Database connection successful!

:: Start both servers
echo [2/2] Starting servers...
echo.

:: Start backend
echo Starting Backend Server...
start "Loomio Backend" cmd /k "cd /d "%cd%\backend" && echo ========================== && echo Loomio Backend Server && echo http://localhost:5000/api && echo ========================== && node src/server.js"

:: Brief pause
timeout /t 2 /nobreak >nul

:: Start frontend  
echo Starting Frontend Server...
start "Loomio Frontend" cmd /k "cd /d "%cd%\frontend" && echo ========================== && echo Loomio Frontend Server && echo http://localhost:5173 && echo ========================== && npm run dev"

:: Wait and open browser
timeout /t 4 /nobreak >nul
echo Opening browser...
start http://localhost:5173

echo.
echo =====================================================
echo              🚀 Loomio is Running! 🚀
echo =====================================================
echo Backend API: http://localhost:5000/api
echo Frontend:    http://localhost:5173
echo.
echo ✅ Multi-community support enabled
echo ✅ Real-time UI updates working
echo ✅ Calendar personalization active
echo ✅ Settings page functional
echo.
echo Close the server windows to stop the application.
echo.
pause