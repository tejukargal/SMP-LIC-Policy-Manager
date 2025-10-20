// Netlify Function for LIC records operations
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
        // GET - Fetch all LIC records
        if (event.httpMethod === 'GET') {
            const query = `
                SELECT
                    id, staff_sl, staff_emp_id, staff_name, staff_dept,
                    staff_designation, staff_type, policy_no, premium_amount,
                    maturity_date, created_at, updated_at
                FROM staff_lic_records
                ORDER BY staff_name ASC, created_at DESC
            `;

            const result = await pool.query(query);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    records: result.rows,
                    count: result.rows.length
                })
            };
        }

        // POST - Add new LIC records (multiple policies)
        if (event.httpMethod === 'POST') {
            const { policies } = JSON.parse(event.body);

            if (!policies || !Array.isArray(policies) || policies.length === 0) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Invalid request: policies array is required'
                    })
                };
            }

            // Validate all policies
            for (const policy of policies) {
                if (!policy.staff_sl || !policy.staff_name || !policy.policy_no) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: 'Missing required fields: staff_sl, staff_name, and policy_no are required'
                        })
                    };
                }
            }

            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                // Build bulk insert query
                const values = [];
                const placeholders = [];
                let paramIndex = 1;

                policies.forEach((policy) => {
                    placeholders.push(
                        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8})`
                    );
                    values.push(
                        policy.staff_emp_id || null,
                        policy.staff_sl,
                        policy.staff_name,
                        policy.staff_dept || null,
                        policy.staff_designation || null,
                        policy.staff_type || null,
                        policy.policy_no,
                        policy.premium_amount || 0,
                        policy.maturity_date || null
                    );
                    paramIndex += 9;
                });

                const insertQuery = `
                    INSERT INTO staff_lic_records
                    (staff_emp_id, staff_sl, staff_name, staff_dept, staff_designation, staff_type, policy_no, premium_amount, maturity_date)
                    VALUES ${placeholders.join(', ')}
                    RETURNING *
                `;

                const result = await client.query(insertQuery, values);

                await client.query('COMMIT');

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        records: result.rows,
                        count: result.rows.length,
                        message: `Successfully added ${result.rows.length} LIC record(s)`
                    })
                };

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        }

        // PUT - Update LIC record
        if (event.httpMethod === 'PUT') {
            const pathParts = event.path.split('/');
            const policyId = pathParts[pathParts.length - 1];
            const { policy_no, premium_amount, maturity_date } = JSON.parse(event.body);

            const query = `
                UPDATE staff_lic_records
                SET policy_no = $1, premium_amount = $2, maturity_date = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING *
            `;

            const result = await pool.query(query, [policy_no, premium_amount, maturity_date, policyId]);

            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'LIC record not found'
                    })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    record: result.rows[0],
                    message: 'LIC record updated successfully'
                })
            };
        }

        // DELETE - Delete LIC record
        if (event.httpMethod === 'DELETE') {
            const pathParts = event.path.split('/');
            const policyId = pathParts[pathParts.length - 1];

            const query = 'DELETE FROM staff_lic_records WHERE id = $1 RETURNING *';
            const result = await pool.query(query, [policyId]);

            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'LIC record not found'
                    })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'LIC record deleted successfully'
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
        console.error('Error in lic-records function:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                details: error.message
            })
        };
    }
};
