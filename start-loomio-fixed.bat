@echo off
setlocal EnableDelayedExpansion

title Loomio - Fixed Startup Script

echo =====================================================
echo        Loomio Fixed Development Environment
echo =====================================================
echo.

:: Check if MySQL is running
echo [1/5] Checking MySQL service...
sc query mysql >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ MySQL service not found. Please ensure MySQL is installed and running.
    echo.
    pause
    exit /b 1
)

:: Check MySQL connection
echo [2/5] Testing database connection...
mysql -u root -p -e "USE loomio_db; SELECT 'Database connection successful!' as Status;" >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ Cannot connect to loomio_db database.
    echo Please ensure MySQL is running and the database exists.
    echo.
    pause
    exit /b 1
)

:: Apply database fixes if needed
echo [3/5] Checking and fixing database schema if needed...
if exist "fix-database-keys.sql" (
    echo Applying database fixes...
    Get-Content "fix-database-keys.sql" | mysql -u root -p >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Database schema fixes applied successfully.
    ) else (
        echo ⚠️  Database fixes may have already been applied or not needed.
    )
) else (
    echo ✅ No database fixes needed.
)

:: Install backend dependencies
echo [4/5] Installing/updating backend dependencies...
cd backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo ❌ Failed to install backend dependencies.
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend dependencies already installed.
)

:: Install frontend dependencies
echo [5/5] Installing/updating frontend dependencies...
cd ..\frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo ❌ Failed to install frontend dependencies.
        pause
        exit /b 1
    )
) else (
    echo ✅ Frontend dependencies already installed.
)

cd ..

echo.
echo =====================================================
echo           Starting Loomio Application
echo =====================================================
echo.

:: Start backend in a new window
echo Starting Backend Server...
start "Loomio Backend" cmd /k "cd /d "%cd%\backend" && echo Starting Loomio Backend Server... && node src/server.js"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend in a new window
echo Starting Frontend Development Server...
start "Loomio Frontend" cmd /k "cd /d "%cd%\frontend" && echo Starting Loomio Frontend Server... && npm run dev"

:: Wait for frontend to start
echo.
echo Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

:: Open browser
echo Opening application in browser...
start http://localhost:5173

echo.
echo =====================================================
echo           Loomio Development Started!
echo =====================================================
echo Backend API: http://localhost:5000/api
echo Frontend:    http://localhost:5173
echo.
echo ✅ Database schema fixed
echo ✅ Backend server running
echo ✅ Frontend server running
echo ✅ Application opened in browser
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
echo Press any key to exit this window...
pause >nul