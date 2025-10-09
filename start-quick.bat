@echo off
:: =====================================================
::        LOOMIO - Quick Start (No Checks)
:: =====================================================
:: Use this for quick restarts when you know 
:: everything is already configured
:: =====================================================

title Loomio - Quick Start

echo.
echo Starting Loomio...
echo.

:: Start Backend
start "Loomio Backend" cmd /k "cd /d "%~dp0backend" && node src/server.js"
timeout /t 3 /nobreak >nul

:: Start Frontend
start "Loomio Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 5 /nobreak >nul

:: Open Browser
start http://localhost:5173

echo.
echo ✅ Loomio started!
echo    Backend: http://localhost:5000/api
echo    Frontend: http://localhost:5173
echo.
