#!/bin/bash

# Loomio Application Fix Script
# This script fixes the database schema issues and ensures proper setup

echo "🔧 Loomio Application Fix Script"
echo "================================="

# Change to backend directory
cd backend

echo "1. 📦 Installing backend dependencies..."
npm install

echo "2. 🗄️  Running database migration to fix community_code column..."
node migrate-community-code.js

echo "3. 🚀 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Change to frontend directory
cd ../frontend

echo "4. 📦 Installing frontend dependencies..."
npm install

echo "5. 🎨 Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting up!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 Backend API: http://localhost:5000/api"
echo "🏥 Health check: http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait