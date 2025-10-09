# Loomio - Batch Scripts Guide

## Available Scripts

### 🚀 `start.bat` - Complete Project Starter (Recommended)

**Use this for:** First time setup or when you want full health checks

**What it does:**
1. ✅ Checks if MySQL service is running
2. ✅ Tests database connection to `loomio_db`
3. ✅ Verifies `.env` file exists (creates from template if missing)
4. ✅ Installs dependencies if `node_modules` is missing
5. ✅ Starts backend server (http://localhost:5000/api)
6. ✅ Starts frontend server (http://localhost:5173)
7. ✅ Opens application in your default browser

**Usage:**
```bash
start.bat
```

**Features:**
- Full health checks before starting
- Automatic dependency installation
- Clear error messages with helpful tips
- Creates `.env` from template if missing
- Opens browser automatically after startup

---

### ⚡ `start-quick.bat` - Quick Start (No Checks)

**Use this for:** Quick restarts during development when everything is already configured

**What it does:**
1. Starts backend server immediately
2. Starts frontend server immediately  
3. Opens browser

**Usage:**
```bash
start-quick.bat
```

**Features:**
- No checks or validations (faster startup)
- Ideal for development workflow
- Use when you know everything is configured

---

### 🛑 `stop.bat` - Stop All Servers

**Use this for:** Cleanly stopping all running Loomio processes

**What it does:**
1. Stops backend server
2. Stops frontend server
3. Shows status of what was stopped

**Usage:**
```bash
stop.bat
```

**Note:** You can also stop servers by closing their terminal windows manually.

---

### 📦 `install-dependencies.bat` - Install All Dependencies

**Use this for:** Installing or updating npm packages for both frontend and backend

**What it does:**
1. Installs backend dependencies (`backend/node_modules`)
2. Installs frontend dependencies (`frontend/node_modules`)
3. Shows error if any installation fails

**Usage:**
```bash
install-dependencies.bat
```

**When to use:**
- After cloning the repository
- After pulling new changes that update `package.json`
- When `node_modules` folders are missing or corrupted

---

## Typical Development Workflow

### First Time Setup
```bash
# 1. Clone repository and navigate to project
git clone https://github.com/jvkousthub/Loomio.git
cd Loomio

# 2. Create .env file
copy .env.example .env
# Edit .env with your database credentials

# 3. Install dependencies (optional - start.bat does this automatically)
install-dependencies.bat

# 4. Start application with full checks
start.bat
```

### Daily Development
```bash
# Quick start (no checks needed)
start-quick.bat

# ... do your development work ...

# Stop when done
stop.bat
```

### After Pulling New Changes
```bash
# Update dependencies
install-dependencies.bat

# Start application
start.bat
```

---

## Troubleshooting

### "MySQL service not found or not running"
**Solution:**
```bash
# Start MySQL service
net start mysql
```

### "Cannot connect to loomio_db database"
**Solution:**
- Ensure MySQL is running
- Check that `loomio_db` database exists
- Verify credentials in `.env` file match your MySQL setup

### ".env file not found"
**Solution:**
- Run `start.bat` (it will create from template)
- Or manually: `copy .env.example .env`
- Then edit `.env` with your database credentials

### "Backend/Frontend dependencies not installed"
**Solution:**
```bash
install-dependencies.bat
```

### Ports Already in Use
**Solution:**
```bash
# Stop all Loomio processes
stop.bat

# Or manually kill processes using the ports
# Backend (port 5000):
taskkill /F /IM node.exe

# Then restart
start-quick.bat
```

---

## Script Comparison

| Feature | start.bat | start-quick.bat | stop.bat |
|---------|-----------|-----------------|----------|
| Health Checks | ✅ Yes | ❌ No | N/A |
| Auto Install Dependencies | ✅ Yes | ❌ No | N/A |
| Creates .env | ✅ Yes | ❌ No | N/A |
| Startup Speed | 🐢 Slower (15s) | ⚡ Fast (8s) | ⚡ Instant |
| Error Detection | ✅ Comprehensive | ❌ None | ✅ Process check |
| Best For | First time, Production | Development | Cleanup |

---

## Environment Variables

All scripts use the **single** `.env` file in the project root.

Required variables:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=loomio_db
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
PORT=5000
VITE_API_URL=http://localhost:5000/api
```

See `ENV_SETUP.md` for detailed configuration guide.

---

## Windows vs Manual Commands

### Windows (Batch Scripts)
```bash
start.bat        # Start everything
stop.bat         # Stop everything
```

### Manual (Cross-platform)
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev

# To stop: Press Ctrl+C in each terminal
```

---

## Tips

💡 **Use `start.bat` for:**
- First time running the project
- After system restart
- When you want to verify everything is working
- Demonstrating the project to others

💡 **Use `start-quick.bat` for:**
- Daily development work
- Quick restarts after code changes
- When you're actively developing

💡 **Use `stop.bat` when:**
- You're done for the day
- You need to free up ports
- Before running git operations that might conflict

---

**Last Updated:** October 9, 2025
