# GitHub Pages Setup Guide

This application now works **completely client-side** on GitHub Pages by connecting directly to the Nile cloud database from the browser.

## Prerequisites

1. A Nile database account with your data migrated
2. Your Nile API key and database credentials

## Setup Steps

### 1. Configure Database Credentials

1. Copy `config.sample.js` to `config.js`:
   ```bash
   cp config.sample.js config.js
   ```

2. Edit `config.js` and fill in your actual Nile credentials:
   ```javascript
   const DB_CONFIG = {
       apiKey: 'your_actual_nile_api_key',
       workspaceSlug: 'your_workspace_slug',
       database: 'your_database_name'
   };
   ```

3. **IMPORTANT**: Never commit `config.js` to GitHub (it's already in `.gitignore`)

### 2. Deploy to GitHub Pages

1. Commit and push all files EXCEPT `config.js`:
   ```bash
   git add .
   git commit -m "Update for GitHub Pages deployment"
   git push
   ```

2. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Select source: `main` branch
   - Save

3. Your app will be live at: `https://yourusername.github.io/your-repo-name/`

### 3. Add config.js to GitHub Pages

Since `config.js` is git-ignored, you need to add it directly to GitHub Pages:

**Option A: Use GitHub Secrets (Recommended)**
1. Create a GitHub Action workflow to inject config.js during deployment
2. Store credentials in GitHub Secrets

**Option B: Manual Upload**
1. After GitHub Pages builds, manually upload `config.js` to the deployment
2. This needs to be repeated after each deployment

**Option C: Use Environment Variables in Nile (Simplest)**
1. Since Nile supports public API access with API keys, you can commit a minimal config
2. Just ensure your API key has read-only permissions for security

## Security Notes

- The Nile API key will be visible in the browser
- Use a **read-only** API key for production deployments
- Consider implementing rate limiting in your Nile database
- For production, consider using a backend proxy to hide credentials

## How It Works

1. User opens the GitHub Pages site
2. Browser loads `index.html`, `config.js`, and `app.js`
3. App connects directly to Nile database using `executeSQL()` function
4. All CRUD operations happen client-side via Nile's REST API
5. No Node.js server needed!

## Troubleshooting

### CORS Errors
- Nile API supports CORS by default, no configuration needed

### Database Connection Fails
- Check browser console for errors
- Verify API key and database name are correct
- Ensure Nile database is in READY status

### Data Not Loading
- Check browser console for 401/403 errors (invalid API key)
- Verify table names: `staff` and `staff_lic_records`
- Use Nile dashboard to verify database is accessible

## Development vs Production

### Local Development
- Use `config.js` with your credentials
- Test all features locally

### Production (GitHub Pages)
- Use read-only API credentials
- Consider setting up a backend proxy for sensitive operations
- Monitor API usage in Nile dashboard
