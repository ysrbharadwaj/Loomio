# Loomio Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Git

### 2. Installation

```bash
# Clone or navigate to the Loomio directory
cd Loomio

# Install all dependencies
npm run install:all
```

### 3. Database Setup

1. Create a MySQL database named `loomio_db`
2. Update the backend environment file:

```bash
cd backend
cp env.example .env
```

Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=loomio_db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
```

### 4. Frontend Configuration

```bash
cd frontend
cp env.example .env
```

The `.env` file should contain:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Start Development Servers

**Option 1: Use the startup script**
```bash
# Windows
start-dev.bat

# Linux/Mac
chmod +x start-dev.sh
./start-dev.sh
```

**Option 2: Start manually**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- API Health Check: http://localhost:5000/api/health

### 7. First User Registration

1. Go to http://localhost:3000/register
2. Create an account with role "platform_admin"
3. This will be your system administrator account

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Verify database credentials in `.env`
- Check if the database `loomio_db` exists

### Port Already in Use
- Backend (port 5000): Change `PORT` in backend `.env`
- Frontend (port 3000): Vite will automatically find the next available port

### Build Issues
- Ensure all dependencies are installed: `npm run install:all`
- Clear node_modules and reinstall if needed:
  ```bash
  rm -rf node_modules backend/node_modules frontend/node_modules
  npm run install:all
  ```

## Development Notes

- The backend will automatically create database tables on first run
- Hot reload is enabled for both frontend and backend
- API documentation is available at `/api/health` endpoint
- All API routes require authentication except `/auth/register` and `/auth/login`

## Production Deployment

See the main README.md for deployment instructions to Railway/Render (backend) and Vercel (frontend).

