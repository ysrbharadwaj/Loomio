# Free Hosting Deployment Guide for Loomio

## Overview
This guide provides instructions for deploying your Loomio application on free hosting platforms.

## Architecture
- **Frontend**: Vercel or Netlify (Free tier)
- **Backend**: Render or Railway (Free tier)
- **Database**: PlanetScale or Supabase (Free tier)

---

## 1. Database Setup (PlanetScale - Recommended)

### Why PlanetScale?
- ✅ 5GB storage free
- ✅ MySQL-compatible
- ✅ Automatic backups
- ✅ 1 billion row reads/month

### Setup Steps:
1. Sign up at https://planetscale.com
2. Create a new database: `loomio-db`
3. Get connection string from dashboard
4. Run migrations using PlanetScale CLI or web console

### Alternative: Supabase (PostgreSQL)
- ✅ 500MB database
- ✅ Auto-generated APIs
- Note: Requires converting MySQL to PostgreSQL

---

## 2. Backend Deployment (Render - Recommended)

### Why Render?
- ✅ 750 hours/month free
- ✅ Auto-deploys from Git
- ✅ Free SSL
- ✅ Environment variables

### Setup Steps:
1. Sign up at https://render.com
2. Connect GitHub repository
3. Create new "Web Service"
4. Configuration:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**: Add all from `.env`

### Alternative: Railway
- ✅ $5 free credit/month
- ✅ Simpler setup

---

## 3. Frontend Deployment (Vercel - Recommended)

### Why Vercel?
- ✅ Unlimited bandwidth
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero-config for React

### Setup Steps:
1. Sign up at https://vercel.com
2. Import repository
3. Framework: Vite
4. Root Directory: `frontend`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Environment Variables: 
   - `VITE_API_URL`: Your Render backend URL

### Alternative: Netlify
- Similar features
- 100GB bandwidth/month

---

## 4. Environment Variables

### Backend (.env)
```env
# Database (PlanetScale)
DB_HOST=your-planetscale-host.connect.psdb.cloud
DB_PORT=3306
DB_NAME=loomio-db
DB_USER=your-username
DB_PASSWORD=your-password
DATABASE_URL=mysql://user:pass@host/database?ssl={"rejectUnauthorized":true}

# App
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.vercel.app

# Email (Optional - use free tier)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 5. Platform Limitations & Workarounds

### Free Tier Limits:

#### Render (Backend)
- **Limitation**: Sleeps after 15 min inactivity
- **Workaround**: Use https://uptimerobot.com (free) to ping every 14 minutes
- **Free hours**: 750/month (enough for 1 service)

#### Vercel (Frontend)
- **Limitation**: 100GB bandwidth/month
- **Workaround**: Optimize images, use lazy loading
- **No worries**: Plenty for small-medium apps

#### PlanetScale (Database)
- **Limitation**: 1 database, 5GB storage
- **Workaround**: Clean old data periodically
- **No branching**: Use single branch (main)

---

## 6. Optimization for Free Hosting

### Backend Optimizations:
```javascript
// Add to server.js for better performance
app.use(compression()); // gzip compression
app.use(helmet()); // security headers

// Database connection pooling
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: true
    }
  },
  pool: {
    max: 5, // Limit for free tier
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false // Disable in production
});
```

### Frontend Optimizations:
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
});
```

---

## 7. Deployment Checklist

### Before Deploying:
- [ ] All environment variables set
- [ ] Database migrations ready
- [ ] CORS configured correctly
- [ ] JWT_SECRET changed from default
- [ ] Email service configured (optional)
- [ ] Remove console.logs from production code
- [ ] Test all API endpoints
- [ ] Optimize images (compress, use WebP)

### After Deploying:
- [ ] Test login/registration
- [ ] Create test community
- [ ] Create test task
- [ ] Check leaderboard
- [ ] Verify notifications
- [ ] Check mobile responsiveness
- [ ] Setup UptimeRobot monitoring
- [ ] Configure custom domain (optional)

---

## 8. Monitoring & Maintenance

### Free Monitoring Tools:
1. **UptimeRobot**: Monitor backend uptime
2. **Vercel Analytics**: Built-in for frontend
3. **Render Dashboard**: View logs and metrics
4. **PlanetScale Insights**: Database performance

### Regular Maintenance:
- Clean old notifications (monthly)
- Archive completed tasks (quarterly)
- Review error logs (weekly)
- Update dependencies (monthly)

---

## 9. Scaling Beyond Free Tier

When you outgrow free tiers:

### Next Steps:
1. **Database**: PlanetScale Pro ($29/mo) or Railway ($5/mo)
2. **Backend**: Render Starter ($7/mo) or Railway ($5/mo)
3. **Frontend**: Stays free on Vercel ✅

### Cost-Effective Scaling:
- Start with backend upgrade (most critical)
- Add database upgrade if you hit 5GB
- Frontend rarely needs upgrade

---

## 10. Troubleshooting

### Common Issues:

**Backend sleeps on Render**
- Solution: Setup UptimeRobot ping

**CORS errors**
- Solution: Check FRONTEND_URL matches Vercel domain

**Database connection fails**
- Solution: Verify SSL settings, check credentials

**Build fails on Vercel**
- Solution: Check Node version, verify environment variables

**Email not sending**
- Solution: Use Gmail app password, not regular password

---

## Estimated Costs

### Free Tier (Recommended for starting):
- Frontend: $0 (Vercel)
- Backend: $0 (Render - with sleep)
- Database: $0 (PlanetScale)
- **Total: $0/month**

### Minimal Paid Tier (for production):
- Frontend: $0 (Vercel)
- Backend: $7 (Render Starter - no sleep)
- Database: $0 (PlanetScale free still works)
- **Total: $7/month**

### Optimal Paid Tier (for growth):
- Frontend: $0 (Vercel)
- Backend: $7 (Render)
- Database: $29 (PlanetScale Pro)
- **Total: $36/month**

---

## Quick Start Commands

### Deploy Backend to Render:
```bash
# Render auto-detects from package.json
# Just connect repo and set env vars
```

### Deploy Frontend to Vercel:
```bash
# Install Vercel CLI
npm i -g vercel

# From frontend directory
cd frontend
vercel

# Follow prompts, set VITE_API_URL
```

### Run Migrations on PlanetScale:
```bash
# Install PlanetScale CLI
brew install planetscale/tap/pscale  # Mac
# Or download from planetscale.com

# Connect to database
pscale connect loomio-db main

# Run migrations
mysql -h 127.0.0.1 -P 3306 -u root < migrations/add-task-tags.sql
mysql -h 127.0.0.1 -P 3306 -u root < migrations/add-subtasks.sql
mysql -h 127.0.0.1 -P 3306 -u root < migrations/add-performance-tracking.sql
```

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **PlanetScale Docs**: https://planetscale.com/docs
- **UptimeRobot**: https://uptimerobot.com

---

🚀 **You're ready to deploy!** Start with the free tier and scale as needed.
