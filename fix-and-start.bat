@echo off
REM Loomio Application Fix Script for Windows
REM This script fixes the database schema issues and ensures proper setup

echo 🔧 Loomio Application Fix Script
echo =================================

REM Change to backend directory
cd backend

echo 1. 📦 Installing backend dependencies...
call npm install

echo 2. 🗄️  Running database migration to fix community_code column...
node migrate-community-code.js

echo 3. 🚀 Starting backend server...
start "Backend Server" cmd /k "npm run dev"

REM Change to frontend directory
cd ..\frontend

echo 4. 📦 Installing frontend dependencies...
call npm install

echo 5. 🎨 Starting frontend development server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Both servers are starting up!
echo 🌐 Frontend: http://localhost:5173
echo 🔗 Backend API: http://localhost:5000/api
echo 🏥 Health check: http://localhost:5000/api/health
echo.
echo Press any key to continue...
pause > nul