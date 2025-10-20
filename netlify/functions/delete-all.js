// Netlify Function for delete all
const pool = require('./db');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        const { password } = JSON.parse(event.body);

        // Validate password
        if (password !== 'teju2015') {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid password'
                })
            };
        }

        const query = 'DELETE FROM staff_lic_records';
        const result = await pool.query(query);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: `Successfully deleted all LIC records (${result.rowCount} records)`
            })
        };

    } catch (error) {
        console.error('Error in delete-all function:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to delete all records',
                details: error.message
            })
        };
    }
};
