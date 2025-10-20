// Database configuration
// NOTE: Direct browser-to-database connection is NOT possible due to CORS restrictions
// Nile's API doesn't allow direct browser access for security reasons
//
// DEPLOYMENT SETUP:
// 1. Deploy server.js to Railway/Render/Vercel
// 2. Update PRODUCTION_API_URL below with your deployed backend URL
// 3. Commit and push to GitHub
//
// Example: If you deploy to Railway and get: https://smp-lic-manager.railway.app
// Then set: PRODUCTION_API_URL = 'https://smp-lic-manager.railway.app'

const DB_CONFIG = {
    // Production backend URL (deployed server.js)
    // REPLACE THIS with your Railway/Render/Vercel URL after deployment
    PRODUCTION_API_URL: 'https://your-deployed-backend.railway.app',  // UPDATE THIS!

    // For reference only (not used in browser, kept for documentation)
    workspaceSlug: 'thejaraj',
    database: 'tejuDB'
};
