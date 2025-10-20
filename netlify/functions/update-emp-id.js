// Netlify Function for updating policy emp IDs
const pool = require('./db');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'PUT') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        const { oldEmpId, newEmpId } = JSON.parse(event.body);

        if (!oldEmpId || !newEmpId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Both oldEmpId and newEmpId are required'
                })
            };
        }

        const query = `
            UPDATE staff_lic_records
            SET staff_emp_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE staff_emp_id = $2
        `;

        const result = await pool.query(query, [newEmpId, oldEmpId]);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: `Updated ${result.rowCount} record(s)`,
                count: result.rowCount
            })
        };

    } catch (error) {
        console.error('Error in update-emp-id function:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to update emp IDs',
                details: error.message
            })
        };
    }
};
