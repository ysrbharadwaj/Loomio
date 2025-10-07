@echo off
echo Stopping Loomio servers...
echo.

:: Kill Node.js processes running on ports 5000 and 5173
echo Stopping backend server (port 5000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Stopping frontend server (port 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Alternative method: Kill all node processes (use with caution)
echo Stopping any remaining Node.js processes...
taskkill /IM node.exe /F >nul 2>&1

echo.
echo ✓ Loomio servers have been stopped.
echo.
pause