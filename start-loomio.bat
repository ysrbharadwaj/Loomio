@echo off
echo =====================================================
echo           Starting Loomio Community Platform
echo =====================================================
echo.

:: Set colors for better visibility
color 0A

:: Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js is installed: %NODE_VERSION%

:: Check if npm is available
echo [2/6] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm is available: v%NPM_VERSION%

:: Navigate to project root
cd /d "%~dp0"

:: Check if MySQL is running (optional check)
echo [3/6] Checking database connection...
echo ℹ Make sure MySQL is running and configured properly
echo   (Check backend/.env for database settings)
echo.

:: Install backend dependencies if needed
echo [4/6] Setting up backend...
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        echo.
        pause
        exit /b 1
    )
    cd ..
    echo ✓ Backend dependencies installed successfully
) else (
    echo ✓ Backend dependencies already installed
)

:: Install frontend dependencies if needed
echo [5/6] Setting up frontend...
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        echo.
        pause
        exit /b 1
    )
    cd ..
    echo ✓ Frontend dependencies installed successfully
) else (
    echo ✓ Frontend dependencies already installed
)

echo [6/6] Starting servers...
echo.
echo =====================================================
echo  🚀 Starting Loomio Backend Server (Port 5000)
echo  🌐 Starting Loomio Frontend Server (Port 5173)
echo =====================================================
echo.
echo Backend API will be available at: http://localhost:5000/api
echo Frontend will be available at: http://localhost:5173
echo.
echo To stop the servers, close this window or press Ctrl+C
echo =====================================================
echo.

:: Start backend server in a new window
start "Loomio Backend Server" /D "%~dp0backend" cmd /k "npm start"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend server in a new window
start "Loomio Frontend Server" /D "%~dp0frontend" cmd /k "npm run dev"

:: Wait a moment for frontend to start
timeout /t 5 /nobreak >nul

:: Open the application in the default browser
echo Opening Loomio in your default browser...
start http://localhost:5173

echo.
echo =====================================================
echo           Loomio is now running!
echo =====================================================
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000/api
echo Database: MySQL (as configured in backend/.env)
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause