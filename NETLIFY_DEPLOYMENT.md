# Netlify Deployment Guide

## Overview

This app is now configured to deploy **completely** on Netlify - both frontend AND backend (using Netlify Functions).

### ✅ What's Included

- Frontend: HTML, CSS, JavaScript (static files)
- Backend: Netlify Functions (serverless API endpoints)
- Database: Nile PostgreSQL (cloud hosted)

Everything in one place - no separate backend deployment needed!

---

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Push Code to GitHub

Make sure all code is committed and pushed:

```bash
git add .
git commit -m "Add Netlify Functions deployment"
git push
```

### Step 2: Deploy to Netlify

1. **Sign up / Log in to Netlify:**
   - Go to: https://app.netlify.com/
   - Click "Log in" → Sign in with GitHub

2. **Create New Site:**
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Select your repository: `SMP-LIC-Policy-Manager`

3. **Configure Build Settings:**
   Netlify should auto-detect settings, but verify:
   - Build command: (leave empty)
   - Publish directory: `.` (current directory)
   - Functions directory: `netlify/functions`

   Click "Deploy site"

### Step 3: Add Environment Variables

After deployment (or before), add environment variables:

1. Go to: Site settings → Environment variables
2. Click "Add a variable"
3. Add this variable:

   **Key:** `DATABASE_URL`
   **Value:**
   ```
   postgres://0199fcf8-7f48-70bc-b823-9c7a5b79418f:708465c1-d7cc-4768-9699-e6e98a60a1b5@us-west-2.db.thenile.dev:5432/tejuDB
   ```

4. Click "Save"
5. Trigger a redeploy: Deploys → Trigger deploy → Deploy site

### Step 4: Test Your Site!

1. Netlify will give you a URL like: `https://your-site-name.netlify.app`
2. Visit the URL
3. Check browser console - should show:
   ```
   Mode: ☁️ PRODUCTION (using deployed backend)
   ✅ Staff data loaded from backend: 87 records
   ```

---

## 📁 File Structure

```
SMP-LIC-Policy-Manager/
├── netlify/
│   └── functions/
│       ├── db.js              # Shared database connection
│       ├── staff-db.js        # GET /api/staff-db
│       ├── lic-records.js     # GET/POST/PUT/DELETE /api/lic-records
│       ├── backup.js          # GET /api/backup
│       ├── restore.js         # POST /api/restore
│       ├── delete-all.js      # POST /api/delete-all
│       └── update-emp-id.js   # PUT /api/lic-records/update-emp-id
├── netlify.toml               # Netlify configuration
├── index.html                 # Frontend
├── app.js                     # Frontend logic
├── styles.css                 # Styles
├── config.js                  # Configuration
└── package.json               # Dependencies
```

---

## 🔧 How It Works

### Netlify Functions

Each API endpoint is a separate serverless function:

- `/api/staff-db` → `netlify/functions/staff-db.js`
- `/api/lic-records` → `netlify/functions/lic-records.js`
- `/api/backup` → `netlify/functions/backup.js`
- etc.

### URL Rewriting

`netlify.toml` redirects `/api/*` to `/.netlify/functions/*`:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

This means your frontend can call `/api/staff-db` and it automatically routes to the Netlify Function.

### Environment Variables

The `DATABASE_URL` environment variable is automatically injected into all Netlify Functions via `process.env.DATABASE_URL`.

---

## 🌐 Custom Domain (Optional)

1. In Netlify dashboard: Domain settings
2. Add custom domain
3. Follow DNS configuration steps

---

## 💰 Pricing

- **Netlify Free Tier:**
  - 125K function invocations/month
  - 100 GB bandwidth/month
  - Continuous deployment from GitHub
  - **More than enough for this app!**

---

## 🔍 Debugging

### Check Function Logs

1. Netlify dashboard → Functions
2. Click on a function to see logs
3. See errors and console.log output

### Test Functions Directly

Visit: `https://your-site.netlify.app/.netlify/functions/staff-db`

Should return JSON data.

### Common Issues

**Functions not found (404):**
- Check `netlify.toml` is in root directory
- Verify `functions` directory path is correct
- Redeploy site

**Database connection errors:**
- Verify `DATABASE_URL` environment variable is set
- Check Nile database is accessible
- Check function logs for detailed error

**CORS errors:**
- All functions include CORS headers
- Check browser console for specific error

---

## 🔄 Updates

To update your site:

```bash
git add .
git commit -m "Update message"
git push
```

Netlify automatically redeploys when you push to GitHub!

---

## ✅ Advantages of Netlify

- ✅ Everything in one place (frontend + backend)
- ✅ Automatic deployments from GitHub
- ✅ Free SSL/HTTPS
- ✅ Serverless (no server to maintain)
- ✅ Auto-scaling
- ✅ Built-in CDN
- ✅ Function logs and monitoring
- ✅ Easy rollbacks

---

## 🆚 vs. Other Hosting

| Feature | Netlify | Railway | GitHub Pages |
|---------|---------|---------|--------------|
| Frontend | ✅ | ❌ | ✅ |
| Backend | ✅ (Serverless) | ✅ (Always-on) | ❌ |
| Database | External (Nile) | External (Nile) | ❌ |
| Deployment | Auto from GitHub | Auto from GitHub | Auto from GitHub |
| Cost | Free tier | Free tier | Free |
| Setup | Easy | Easy | Easy (but no backend) |

**Winner for this app: Netlify** (all-in-one solution!)

---

## 📞 Support

- Netlify Docs: https://docs.netlify.com/
- Netlify Community: https://answers.netlify.com/

---

**Your app is now live on Netlify! 🎉**
