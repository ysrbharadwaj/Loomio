@echo off
echo =====================================================
echo        Installing Loomio Dependencies
echo =====================================================
echo.

:: Navigate to project root
cd /d "%~dp0"

:: Install backend dependencies
echo [1/2] Installing backend dependencies...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed successfully
cd ..

:: Install frontend dependencies
echo [2/2] Installing frontend dependencies...
cd frontend
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed successfully
cd ..

echo.
echo =====================================================
echo     All dependencies installed successfully!
echo =====================================================
echo.
echo You can now run the project using:
echo - start-loomio.bat (full setup with checks)
echo - start-dev.bat (quick development start)
echo.
pause