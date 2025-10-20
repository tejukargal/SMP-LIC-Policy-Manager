// Shared database connection for Netlify Functions
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Export the pool for use in all functions
module.exports = pool;
