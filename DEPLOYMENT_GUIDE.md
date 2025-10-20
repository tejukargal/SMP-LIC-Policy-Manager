# Backend Deployment Guide

## The Problem

Nile's REST API blocks direct browser access (CORS policy). This means:
- ❌ GitHub Pages cannot connect directly to Nile database
- ✅ You need a backend server to proxy database requests
- ✅ Local development works (using localhost:3000)

## Solution: Deploy Backend to Railway.app

### Step 1: Prepare Your Code

1. Create a `Procfile` for deployment (already exists if you follow below)

2. Make sure `package.json` has a start script:
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```

### Step 2: Deploy to Railway.app

1. **Sign up at Railway.app:**
   - Go to: https://railway.app/
   - Sign in with GitHub

2. **Create a New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `SMP-LIC-Policy-Manager` repository

3. **Add Environment Variables:**
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add these environment variables:
     ```
     DATABASE_URL=postgres://0199fcf8-7f48-70bc-b823-9c7a5b79418f:708465c1-d7cc-4768-9699-e6e98a60a1b5@us-west-2.db.thenile.dev:5432/tejuDB
     PORT=3000
     NODE_ENV=production
     ```

4. **Deploy:**
   - Railway will automatically deploy
   - Wait for deployment to finish
   - Copy your Railway app URL (something like: `https://your-app.railway.app`)

### Step 3: Update GitHub Pages Config

1. Create a new config file for production:

   **config.production.js:**
   ```javascript
   const DB_CONFIG = {
       // Your Railway backend URL
       apiBaseUrl: 'https://your-app.railway.app'  // Replace with your Railway URL
   };
   ```

2. Update `app.js` to use Railway backend for GitHub Pages:
   ```javascript
   const API_BASE_URL = isLocalhost
       ? 'http://localhost:3000'
       : 'https://your-app.railway.app';  // Your Railway URL
   ```

### Step 4: Test

1. **Local Development:**
   ```bash
   node server.js
   # Visit: http://localhost:3000
   ```

2. **Production (GitHub Pages):**
   - Visit: `https://tejukargal.github.io/SMP-LIC-Policy-Manager/`
   - Should now load data from Railway backend

## Alternative: Render.com

If Railway doesn't work, try Render.com:

1. Go to: https://render.com/
2. Sign in with GitHub
3. New → Web Service
4. Connect your GitHub repo
5. Set environment variables
6. Deploy

## Alternative: Vercel

Vercel also works but requires slight code changes for serverless functions.

## Security Notes

- Backend server keeps API keys secure (not exposed in browser)
- Railway/Render provide HTTPS automatically
- Add CORS configuration in server.js to only allow your GitHub Pages domain:

```javascript
app.use(cors({
    origin: 'https://tejukargal.github.io'
}));
```

## Costs

- Railway: Free tier (500 hours/month)
- Render: Free tier (750 hours/month)
- Both are sufficient for this application
