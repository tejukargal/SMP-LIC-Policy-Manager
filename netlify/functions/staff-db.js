// Netlify Function for staff database operations
const pool = require('./db');

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // GET - Fetch all staff
        if (event.httpMethod === 'GET') {
            const query = `
                SELECT
                    id, emp_id, sl, name, designation, type, dept, status,
                    dob, doe, bank_acct, pan, aadhar, phone, email,
                    created_at, updated_at
                FROM staff
                ORDER BY sl ASC
            `;

            const result = await pool.query(query);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    staff: result.rows,
                    count: result.rows.length
                })
            };
        }

        // Method not allowed
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Method not allowed'
            })
        };

    } catch (error) {
        console.error('Error in staff-db function:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch staff data',
                details: error.message
            })
        };
    }
};
