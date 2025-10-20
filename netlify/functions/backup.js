// Netlify Function for backup
const pool = require('./db');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        const query = 'SELECT * FROM staff_lic_records ORDER BY id ASC';
        const result = await pool.query(query);

        const backup = {
            backup_date: new Date().toISOString(),
            record_count: result.rows.length,
            data: result.rows
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                backup: backup
            })
        };

    } catch (error) {
        console.error('Error in backup function:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to create backup',
                details: error.message
            })
        };
    }
};
