# Loomio Project Transfer Guide

This guide will help you transfer your complete Loomio project (frontend, backend, and database) to a different system.

## 📋 Overview

The transfer process involves:
1. **Exporting** your current database and project files
2. **Setting up** the new system with required dependencies  
3. **Importing** the database and starting the application

## 🎯 Quick Start

### On Your Current System (Windows):
```bash
# 1. Export database
.\export-database.bat

# 2. Copy entire project folder to new system
# Include the 'exports' folder with database backup
```

### On Your New System:

**Linux/Mac:**
```bash
# 1. Make scripts executable
chmod +x *.sh

# 2. Set up complete environment
./setup-project.sh

# 3. Import database
./import-database.sh

# 4. Start application
./start-loomio.sh
```

**Windows:**
```bash
# 1. Set up complete environment
setup-project.bat  # (if created)

# 2. Import database  
import-database.bat

# 3. Start application
start-loomio.bat
```

## 📂 Files Created

### Export Scripts
- `export-database.sh` - Linux/Mac database export
- `export-database.bat` - Windows database export

### Setup Scripts  
- `setup-project.sh` - Complete environment setup for Linux/Mac
- `import-database.sh` - Database import for Linux/Mac
- `import-database.bat` - Database import for Windows

### Generated Files
- `start-loomio.sh` - Application startup script (created by setup)
- `exports/` - Directory containing database backups and metadata

## 🔧 Detailed Process

### Step 1: Export Current System

**Windows (your current system):**
```bash
# Run the export script
.\export-database.bat
```

This creates:
- `exports/loomio_db_YYYYMMDD_HHMM.sql` - Database backup
- `exports/export_info_YYYYMMDD_HHMM.txt` - Export metadata

### Step 2: Transfer Files

Copy your entire project folder to the new system, including:
- All source code (`frontend/`, `backend/`, etc.)
- Configuration files (`package.json`, `*.config`, etc.)
- Database backup (`exports/` folder)
- Transfer scripts (`*.sh` or `*.bat` files)

### Step 3: Setup New System

**Linux/Mac:**
```bash
# Make scripts executable
chmod +x *.sh

# Run complete setup (installs Node.js, MySQL, dependencies)
./setup-project.sh
```

The setup script will:
- ✅ Install Node.js (via nvm)
- ✅ Install MySQL (if needed)
- ✅ Create database and user
- ✅ Install all project dependencies
- ✅ Configure environment files
- ✅ Create startup scripts

**Manual Windows Setup:**
If you don't have a Windows setup script, install manually:
1. Install Node.js from [nodejs.org](https://nodejs.org)
2. Install MySQL from [dev.mysql.com](https://dev.mysql.com/downloads/)
3. Create database: `CREATE DATABASE loomio_db;`
4. Install dependencies: `npm install` (in root, backend, and frontend folders)

### Step 4: Import Database

**Linux/Mac:**
```bash
./import-database.sh
```

**Windows:**
```bash
import-database.bat
```

This will:
- ✅ Verify database connection
- ✅ Backup existing data (if any)
- ✅ Import your database backup
- ✅ Verify successful import

### Step 5: Start Application

**Linux/Mac:**
```bash
./start-loomio.sh
```

**Windows:**
```bash
start-loomio.bat  # or use existing startup scripts
```

## 🌐 Access Your Application

After successful setup:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Database:** MySQL on localhost:3306

## ⚙️ Configuration Files

### Backend Environment (`backend/.env`):
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=loomio_db
DB_USER=loomio_user
DB_PASSWORD=loomio_password_123

# JWT Configuration  
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_123456789
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment (`frontend/.env.local`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Loomio
```

## 🛠️ Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
sudo systemctl status mysql    # Linux
brew services list | grep mysql  # Mac

# Test connection manually
mysql -u loomio_user -p loomio_db
```

### Port Conflicts
If ports 3000 or 5000 are in use:
- Frontend: Edit `frontend/vite.config.js`
- Backend: Edit `backend/.env` PORT variable

### Missing Dependencies
```bash
# Reinstall all dependencies
npm install                    # Root
cd backend && npm install      # Backend  
cd ../frontend && npm install  # Frontend
```

### Database Import Fails
- Check MySQL user permissions
- Verify database exists: `SHOW DATABASES;`
- Check backup file integrity
- Try importing manually: `mysql -u user -p database < backup.sql`

## 📊 System Requirements

### Minimum Requirements:
- **Node.js:** v16+ (v18+ recommended)
- **MySQL:** v8.0+
- **RAM:** 4GB minimum
- **Storage:** 2GB free space

### Supported Systems:
- **Linux:** Ubuntu 18.04+, CentOS 7+, Debian 9+
- **macOS:** 10.14+
- **Windows:** 10+ (with WSL recommended for shell scripts)

## 🔐 Security Notes

- Change default database passwords in production
- Use environment variables for sensitive data
- Set up proper firewall rules for database access
- Consider using SSL/TLS for database connections in production

## 📞 Support

If you encounter issues:
1. Check the generated log files in `exports/`
2. Verify all environment variables are set correctly
3. Ensure all required services are running
4. Check application logs for specific error messages

## 🎉 Success Indicators

Your transfer is successful when:
- ✅ Database import completes without errors
- ✅ Frontend loads at http://localhost:3000
- ✅ Backend API responds at http://localhost:5000/api/health
- ✅ You can log in with existing credentials
- ✅ All your communities, tasks, and users are visible

---

**🚀 Happy coding with your transferred Loomio project!**