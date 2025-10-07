# Loomio Application Fix Guide

## 🚨 Fixed Issues

### 1. Database Schema Mismatch
**Problem**: The application was trying to query for a `community_code` column that didn't exist in the database.

**Error**: `Unknown column 'community.community_code' in 'field list'`

**Solution Applied**:
- ✅ Modified `backend/src/server.js` to use `{ alter: true }` instead of `{ force: false }` for database sync
- ✅ Created migration script `backend/migrate-community-code.js` to manually add missing columns
- ✅ Generated unique community codes for existing communities

### 2. Environment Configuration
**Fixed**:
- ✅ Verified `.env` files are properly configured
- ✅ Confirmed frontend-backend API URL matching
- ✅ Database connection parameters validated

## 🚀 Quick Start (After Fixes)

### Option 1: Use the Fix Script (Recommended)
```bash
# Windows
fix-and-start.bat

# Linux/Mac
./fix-and-start.sh
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

## 🔧 Manual Fixes Applied

### Backend Changes:
1. **Database Sync Method** (`backend/src/server.js`):
   ```javascript
   // Changed from:
   await sequelize.sync({ force: false });
   
   // To:
   await sequelize.sync({ alter: true });
   ```

2. **Migration Script** (`backend/migrate-community-code.js`):
   - Adds missing `community_code` column
   - Generates unique codes for existing communities
   - Sets proper constraints (NOT NULL, UNIQUE)

### What Was Fixed:
- ❌ `SequelizeDatabaseError: Unknown column 'community.community_code'`
- ✅ Database schema now matches model definitions
- ✅ Community codes are automatically generated
- ✅ Proper foreign key constraints maintained

## 🧪 Testing the Fix

1. **Check Backend Health**:
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Test Login Endpoint**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"password"}'
   ```

3. **Verify Frontend**:
   - Navigate to http://localhost:5173
   - Try logging in/registering
   - Check browser console for errors

## 🛠️ Troubleshooting

### If you still get database errors:
1. Run the migration script manually:
   ```bash
   cd backend
   node migrate-community-code.js
   ```

2. Check your MySQL database:
   ```sql
   USE loomio_db;
   DESCRIBE communities;
   ```
   Ensure `community_code` column exists.

3. Reset database (if needed):
   ```bash
   # In server.js, temporarily change to:
   await sequelize.sync({ force: true });
   ```
   ⚠️ **Warning**: This will delete all data!

### If frontend won't start:
1. Clear node_modules and reinstall:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check environment variables:
   ```bash
   # Ensure frontend/.env contains:
   VITE_API_URL=http://localhost:5000/api
   ```

## 📊 Server Information

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173  
- **API Base**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## ✅ Verification Checklist

- [ ] Backend starts without database errors
- [ ] Frontend connects to backend successfully
- [ ] Login/register functions work
- [ ] No console errors in browser
- [ ] Database tables have proper schema
- [ ] Community codes are generated for new communities

---

*Last updated: September 22, 2025*
*Fixed by: GitHub Copilot*