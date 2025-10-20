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
                ORDER BY name ASC
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

        // POST - Add new staff
        if (event.httpMethod === 'POST') {
            const { staff } = JSON.parse(event.body);

            if (!staff || !staff.emp_id || !staff.name) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'emp_id and name are required'
                    })
                };
            }

            const query = `
                INSERT INTO staff (
                    emp_id, sl, name, designation, type, dept, status,
                    dob, doe, bank_acct, pan, aadhar, phone, email
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *
            `;

            const values = [
                staff.emp_id,
                staff.sl || null,
                staff.name,
                staff.designation || null,
                staff.type || null,
                staff.dept || null,
                staff.status || null,
                staff.dob || null,
                staff.doe || null,
                staff.bank_acct || null,
                staff.pan || null,
                staff.aadhar || null,
                staff.phone || null,
                staff.email || null
            ];

            const result = await pool.query(query, values);

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Staff added successfully',
                    staff: result.rows[0]
                })
            };
        }

        // PUT - Update staff
        if (event.httpMethod === 'PUT') {
            const pathParts = event.path.split('/');
            const emp_id = pathParts[pathParts.length - 1];
            const { staff } = JSON.parse(event.body);

            if (!staff) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Staff data is required'
                    })
                };
            }

            const query = `
                UPDATE staff
                SET
                    sl = $1,
                    name = $2,
                    designation = $3,
                    type = $4,
                    dept = $5,
                    status = $6,
                    dob = $7,
                    doe = $8,
                    bank_acct = $9,
                    pan = $10,
                    aadhar = $11,
                    phone = $12,
                    email = $13,
                    updated_at = CURRENT_TIMESTAMP
                WHERE emp_id = $14
                RETURNING *
            `;

            const values = [
                staff.sl || null,
                staff.name,
                staff.designation || null,
                staff.type || null,
                staff.dept || null,
                staff.status || null,
                staff.dob || null,
                staff.doe || null,
                staff.bank_acct || null,
                staff.pan || null,
                staff.aadhar || null,
                staff.phone || null,
                staff.email || null,
                emp_id
            ];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: 'Staff not found'
                    })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Staff updated successfully',
                    staff: result.rows[0]
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
                error: 'Failed to process staff request',
                details: error.message
            })
        };
    }
};
