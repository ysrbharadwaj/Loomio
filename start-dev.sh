#!/bin/bash

echo "Starting Loomio Development Environment..."
echo ""

echo "Starting Backend Server..."
cd backend && npm run dev &
BACKEND_PID=$!

sleep 3

echo "Starting Frontend Development Server..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "Both servers are starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for user input
wait
