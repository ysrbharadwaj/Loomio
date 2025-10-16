# 🚀 Deploy Loomio - Simple Guide

Deploy your app for **FREE** in 30 minutes.

**Stack:**
- Frontend: Vercel
- Backend: Render  
- Database: Render PostgreSQL

**Cost: $0/month**

---

## Step 1: Create Render Account (2 min)

1. Go to https://render.com
2. Sign up with GitHub
3. Done!

---

## Step 2: Create Database (5 min)

1. Render → **New +** → **PostgreSQL**
2. Settings:
   ```
   Name: loomio-db
   Database: loomio_db
   User: loomio_user
   Region: Oregon (US West)
   Plan: Free
   ```
3. Click **Create Database**
4. **WAIT for database to be ready** (status shows "Available")
5. Click on your database → **"Info"** tab
6. **Copy the "Internal Database URL"**
   - Format: `postgres://loomio_user:xxxPASSWORDxxx@dpg-xxxxx-a.oregon-postgres.render.com/loomio_db`
   - This is the FULL connection string you need!

⚠️ **IMPORTANT:** The database must show "Available" status before proceeding!

---

## Step 3: Deploy Backend (10 min)

1. Render → **New +** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   ```
   Name: loomio-backend
   Region: Oregon (same as database)
   Root Directory: backend
   Build: npm install
   Start: npm start
   Plan: Free
   ```

4. **Environment Variables** (click Advanced):

   ⚠️ **CRITICAL:** Make sure you created the database in Step 2 first!

   Add these one by one:
   
   **Key:** `NODE_ENV`  
   **Value:** `production`
   
   **Key:** `DATABASE_URL`  
   **Value:** `<paste the FULL Internal Database URL from Step 2>`  
   Example: `postgres://loomio_user:Ax3kL9mP2nQ5rS8t@dpg-cq1234abcd-a.oregon-postgres.render.com/loomio_db`
   
   **Key:** `JWT_SECRET`  
   **Value:** `<run command below to generate>`
   
   **Key:** `SESSION_SECRET`  
   **Value:** `<run command below to generate another one>`
   
   **Key:** `FRONTEND_URL`  
   **Value:** `https://temp.vercel.app` (we'll update this later)

   **Generate secrets (run in your terminal):**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   ✅ **Double-check DATABASE_URL:**
   - Starts with `postgres://`
   - Has the password in it (not `***`)
   - Ends with `/loomio_db`
   - Is from the "Internal Database URL" (faster than External)

5. Click **Create Web Service**
6. Wait 3-5 minutes
7. **Save your backend URL:** `https://loomio.onrender.com`

---

## Step 4: Deploy Frontend (5 min)

1. Go to https://vercel.com
2. Sign in with GitHub
3. **New Project** → Import your repo
4. Settings:
   ```
   Framework: Vite
   Root Directory: frontend
   ```

5. **Environment Variable:**
   ```
   VITE_API_URL=https://loomio.onrender.com/api
   ```
   (Use YOUR backend URL with `/api` at the end!)

6. Click **Deploy**
7. Wait 2-3 minutes
8. **Save your frontend URL:** `https://loomio-frontend.vercel.app`

---

## Step 5: Connect Everything (5 min)

1. **Update CORS:**
   - Render → loomio-backend → Environment
   - Edit `FRONTEND_URL` → Your Vercel URL
   - Save (auto-redeploys)

2. **Initialize Database:**
   - Render → loomio-backend → Shell
   - Run:
     ```bash
     node -e "require('./src/config/database').sync({force:false})"
     ```

---

## Step 6: Test! (2 min)

1. Open your Vercel URL
2. Register a new account
3. Login
4. Create a task

**Works? You're LIVE! 🎉**

---

## Troubleshooting

### ❌ "ConnectionRefusedError" or "Unable to connect to database"

**Cause:** Database not created or DATABASE_URL is wrong

**Fix:**
1. Go to Render → Databases
2. Make sure database status is **"Available"** (not "Creating")
3. Click database → Info tab
4. Copy the **"Internal Database URL"** (not External)
5. Go to your backend service → Environment
6. Update `DATABASE_URL` with the FULL string
7. Click "Save Changes" (triggers redeploy)
8. Wait 2-3 minutes for redeploy

**Example correct DATABASE_URL:**
```
postgres://loomio_user:Ax3kL9mP2nQ5rS8t@dpg-cq1234abcd-a.oregon-postgres.render.com/loomio_db
```

### "Network Error" on frontend
- Check VITE_API_URL matches backend URL
- Redeploy frontend

### "CORS Error"
- Update FRONTEND_URL in backend
- Wait for redeploy

### Backend Slow (30s first request)
- Normal! Free tier sleeps after 15 min
- Use UptimeRobot.com to keep awake (free)

### Database tables don't exist
- Run Step 5 (Initialize Database) in Render Shell

---

## Your Live App

```
Frontend:  https://loomio-frontend.vercel.app
Backend:   https://loomio-backend.onrender.com
Database:  Render PostgreSQL (Internal)

Cost:      $0/month
```

---

## Updates

Push to GitHub = Auto-deploys both services!

```bash
git add .
git commit -m "Update"
git push
```

---

## Need Help?

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs

**You're live! 🚀**
