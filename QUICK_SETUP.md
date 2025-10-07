# 🚀 Loomio Quick Setup Guide

## Prerequisites
- ✅ Node.js (v16 or higher)
- ✅ MySQL (v8.0 or higher)
- ✅ Git (optional)

## 🎯 Quick Setup (3 Steps)

### Step 1: Set up MySQL Database

#### Option A: Command Line
```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE loomio_db;
EXIT;
```

#### Option B: MySQL Workbench/phpMyAdmin
1. Open MySQL Workbench or phpMyAdmin
2. Create new database: `loomio_db`
3. Note your MySQL credentials

### Step 2: Configure Environment Variables

#### Automatic Setup (Recommended)
```bash
# Run the setup wizard
node setup.js
```

#### Manual Setup
1. **Backend**: Copy `backend/env.local` to `backend/.env` and update MySQL credentials
2. **Frontend**: Copy `frontend/env.local` to `frontend/.env`

### Step 3: Install & Start

#### Install Dependencies
```bash
# Install all dependencies
npm run install:all
```

#### Start Development Servers

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Manual (2 terminals):**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 👤 First User

1. Go to http://localhost:3000/register
2. Create account with role "platform_admin"
3. This becomes your system administrator account

## 🔧 Troubleshooting

### Database Connection Issues
- ✅ MySQL is running
- ✅ Database `loomio_db` exists
- ✅ Credentials in `.env` are correct
- ✅ Port 3306 is accessible

### Port Conflicts
- Backend (5000): Change `PORT` in backend `.env`
- Frontend (3000): Vite auto-finds next available port

### Permission Errors (Linux/Mac)
```bash
chmod +x start-dev.sh
```

## 📱 What You Get

✅ **Complete Authentication System**
- User registration and login
- JWT token-based security
- Role-based access control

✅ **Modern React Frontend**
- Responsive design with Tailwind CSS
- Protected routing
- User dashboard and profile

✅ **Express.js Backend API**
- RESTful API endpoints
- Database models with Sequelize
- Input validation and error handling

✅ **Ready for Development**
- Hot reload for both frontend and backend
- Comprehensive project structure
- Easy to extend and customize

## 🚀 Next Steps

Once running, you can:
1. **Create communities** (admin feature)
2. **Invite members** to communities
3. **Create and assign tasks**
4. **Track contributions and points**
5. **Manage events and calendar**

The foundation is solid and ready for building the full feature set!
