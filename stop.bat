@echo off
:: =====================================================
::           LOOMIO - Stop All Servers
:: =====================================================
:: This script stops all running Loomio processes
:: =====================================================

title Loomio - Stopping Servers

echo.
echo ========================================================
echo              STOPPING LOOMIO SERVERS
echo ========================================================
echo.

:: Kill Node.js processes (Backend)
echo [1/2] Stopping Backend Server...
taskkill /F /FI "WindowTitle eq Loomio Backend*" >nul 2>&1
taskkill /F /FI "WindowTitle eq Loomio Backend Server*" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ Backend server stopped
) else (
    echo ℹ️  Backend server was not running
)

:: Kill Node.js processes (Frontend - Vite)
echo.
echo [2/2] Stopping Frontend Server...
taskkill /F /FI "WindowTitle eq Loomio Frontend*" >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ Frontend server stopped
) else (
    echo ℹ️  Frontend server was not running
)

echo.
echo ========================================================
echo              ✅ ALL SERVERS STOPPED
echo ========================================================
echo.
pause
