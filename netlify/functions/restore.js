// Netlify Function for restore
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
        const { data } = JSON.parse(event.body);

        if (!data || !Array.isArray(data)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid request: data array is required'
                })
            };
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Delete all existing records
            await client.query('DELETE FROM staff_lic_records');

            // Insert backup data
            let insertedCount = 0;

            for (const record of data) {
                const insertQuery = `
                    INSERT INTO staff_lic_records
                    (staff_emp_id, staff_sl, staff_name, staff_dept, staff_designation, staff_type, policy_no, premium_amount, maturity_date)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `;

                await client.query(insertQuery, [
                    record.staff_emp_id,
                    record.staff_sl,
                    record.staff_name,
                    record.staff_dept,
                    record.staff_designation,
                    record.staff_type,
                    record.policy_no,
                    record.premium_amount,
                    record.maturity_date
                ]);

                insertedCount++;
            }

            await client.query('COMMIT');

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: `Successfully restored ${insertedCount} LIC records`,
                    count: insertedCount
                })
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error in restore function:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to restore data',
                details: error.message
            })
        };
    }
};
