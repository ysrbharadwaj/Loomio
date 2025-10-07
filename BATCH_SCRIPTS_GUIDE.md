# 🚀 Loomio Batch Scripts Guide

This directory contains several batch files to help you easily run and manage the Loomio Community Platform on Windows.

## 📋 Available Scripts

### 🔧 `start-loomio.bat` (Recommended)
**Full setup and startup script with comprehensive checks**
- Checks Node.js and npm installation
- Automatically installs dependencies if missing
- Provides database connection reminders
- Starts both backend and frontend servers
- Opens the application in your browser
- Shows detailed status information

**Usage:** Double-click the file or run from command line
```bash
start-loomio.bat
```

### ⚡ `start-dev.bat`
**Quick development startup (assumes dependencies are installed)**
- Fast startup for development
- Minimal checks
- Starts both servers immediately
- Opens browser automatically

**Usage:** 
```bash
start-dev.bat
```

### 📦 `install-dependencies.bat`
**Install project dependencies only**
- Installs backend dependencies (npm install in backend/)
- Installs frontend dependencies (npm install in frontend/)
- Useful for first-time setup or after pulling new changes

**Usage:**
```bash
install-dependencies.bat
```

### 🛑 `stop-loomio.bat`
**Stop all Loomio servers**
- Stops backend server (port 5000)
- Stops frontend server (port 5173)
- Kills Node.js processes safely

**Usage:**
```bash
stop-loomio.bat
```

## 🚦 Getting Started

### First Time Setup
1. Run `install-dependencies.bat` to install all dependencies
2. Make sure MySQL is installed and running
3. Configure your database settings in `backend/.env`
4. Run `start-loomio.bat` to start the application

### Daily Development
1. Run `start-dev.bat` for quick startup
2. Access the application at http://localhost:5173
3. Backend API available at http://localhost:5000/api

## 🔧 Prerequisites

- **Node.js** (v16 or higher) - Download from [nodejs.org](https://nodejs.org/)
- **MySQL** - Make sure it's installed and running
- **Git** (optional) - For version control

## 🌐 Application URLs

- **Frontend (React + Vite):** http://localhost:5173
- **Backend API (Node.js + Express):** http://localhost:5000/api
- **API Health Check:** http://localhost:5000/api/health

## 📁 Project Structure

```
Loomio/
├── backend/                 # Node.js + Express backend
│   ├── src/                # Source code
│   ├── package.json        # Backend dependencies
│   └── .env               # Environment configuration
├── frontend/               # React + Vite frontend
│   ├── src/               # Source code
│   └── package.json       # Frontend dependencies
├── start-loomio.bat       # Main startup script
├── start-dev.bat          # Quick development startup
├── install-dependencies.bat # Dependency installer
└── stop-loomio.bat        # Server shutdown script
```

## 🛠️ Troubleshooting

### Common Issues

1. **"Node.js is not installed"**
   - Download and install Node.js from https://nodejs.org/
   - Restart your command prompt after installation

2. **"Failed to install dependencies"**
   - Check your internet connection
   - Try running as administrator
   - Clear npm cache: `npm cache clean --force`

3. **"Port already in use"**
   - Run `stop-loomio.bat` to stop existing servers
   - Or check what's using the ports:
     ```bash
     netstat -ano | findstr :5000
     netstat -ano | findstr :5173
     ```

4. **Database connection errors**
   - Make sure MySQL is running
   - Check your database configuration in `backend/.env`
   - Verify database credentials

### Manual Commands

If batch files don't work, you can run these commands manually:

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📝 Notes

- The batch files will create separate command windows for backend and frontend servers
- Close those windows to stop the servers
- The application will automatically open in your default browser
- Backend must start before frontend for proper API connectivity

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the console output in the server windows
3. Check the project's main README.md for additional setup instructions
4. Ensure all prerequisites are properly installed

---
*Happy coding with Loomio! 🎉*