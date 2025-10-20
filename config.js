// Database configuration for Netlify deployment
//
// NETLIFY DEPLOYMENT:
// Netlify Functions are served from the same domain as your site.
// The functions are accessible at: /.netlify/functions/function-name
// Or via the /api/ redirect: /api/function-name
//
// No separate backend URL needed - everything is on Netlify!

const DB_CONFIG = {
    // Production backend URL
    // For Netlify: Leave empty - functions are on same domain
    // netlify.toml redirects /api/* to /.netlify/functions/*
    PRODUCTION_API_URL: '',  // Empty for Netlify (same domain)

    // For reference only
    workspaceSlug: 'thejaraj',
    database: 'tejuDB'
};
