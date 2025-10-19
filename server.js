const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Database connection using Nile
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to Nile Database successfully!');
        console.log('Server time:', res.rows[0].now);
    }
});

// API Routes

// Get all LIC records
app.get('/api/lic-records', async (req, res) => {
    try {
        const query = `
            SELECT
                id,
                staff_sl,
                staff_emp_id,
                staff_name,
                staff_dept,
                staff_designation,
                staff_type,
                policy_no,
                premium_amount,
                maturity_date,
                created_at,
                updated_at
            FROM staff_lic_records
            ORDER BY staff_name ASC, created_at DESC
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            records: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching LIC records:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch LIC records',
            details: error.message
        });
    }
});

// Get LIC records for a specific staff member
app.get('/api/lic-records/staff/:staffSL', async (req, res) => {
    try {
        const { staffSL } = req.params;

        const query = `
            SELECT
                id,
                staff_sl,
                staff_name,
                staff_dept,
                staff_designation,
                staff_type,
                policy_no,
                premium_amount,
                maturity_date,
                created_at,
                updated_at
            FROM staff_lic_records
            WHERE staff_sl = $1
            ORDER BY created_at DESC
        `;

        const result = await pool.query(query, [staffSL]);

        res.json({
            success: true,
            records: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching staff LIC records:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch staff LIC records',
            details: error.message
        });
    }
});

// Add new LIC records (can add multiple policies at once)
app.post('/api/lic-records', async (req, res) => {
    const client = await pool.connect();

    try {
        const { policies } = req.body;

        if (!policies || !Array.isArray(policies) || policies.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: policies array is required'
            });
        }

        // Validate all policies first
        for (const policy of policies) {
            if (!policy.staff_sl || !policy.staff_name || !policy.policy_no) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: staff_sl, staff_name, and policy_no are required'
                });
            }
        }

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
                policy.staff_sl,
                policy.staff_emp_id || policy.staff_sl,
                policy.staff_name,
                policy.staff_dept,
                policy.staff_designation,
                policy.staff_type,
                policy.policy_no.toUpperCase(),
                policy.premium_amount || 0,
                policy.maturity_date || null
            );
            paramIndex += 9;
        });

        const insertQuery = `
            INSERT INTO staff_lic_records (
                staff_sl,
                staff_emp_id,
                staff_name,
                staff_dept,
                staff_designation,
                staff_type,
                policy_no,
                premium_amount,
                maturity_date
            ) VALUES ${placeholders.join(', ')}
            RETURNING *
        `;

        const result = await client.query(insertQuery, values);

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: `Successfully added ${result.rows.length} policy/policies`,
            records: result.rows
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding LIC records:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add LIC records',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// Update a LIC record
app.put('/api/lic-records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { policy_no, premium_amount, maturity_date } = req.body;

        if (!policy_no) {
            return res.status(400).json({
                success: false,
                error: 'Policy number is required'
            });
        }

        const query = `
            UPDATE staff_lic_records
            SET
                policy_no = $1,
                premium_amount = $2,
                maturity_date = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `;

        const result = await pool.query(query, [
            policy_no.toUpperCase(),
            premium_amount || 0,
            maturity_date || null,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'LIC record not found'
            });
        }

        res.json({
            success: true,
            message: 'LIC record updated successfully',
            record: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating LIC record:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update LIC record',
            details: error.message
        });
    }
});

// Delete a LIC record
app.delete('/api/lic-records/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'DELETE FROM staff_lic_records WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'LIC record not found'
            });
        }

        res.json({
            success: true,
            message: 'LIC record deleted successfully',
            record: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting LIC record:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete LIC record',
            details: error.message
        });
    }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(DISTINCT staff_sl) as staff_with_lic,
                COUNT(*) as total_policies,
                SUM(premium_amount) as total_premium
            FROM staff_lic_records
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            stats: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            success: true,
            message: 'Server is healthy',
            database: 'connected',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server is unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});

// Backup all data
app.get('/api/backup', async (req, res) => {
    try {
        const query = `
            SELECT
                id,
                staff_sl,
                staff_name,
                staff_dept,
                staff_designation,
                staff_type,
                policy_no,
                premium_amount,
                maturity_date,
                created_at,
                updated_at
            FROM staff_lic_records
            ORDER BY id ASC
        `;

        const result = await pool.query(query);

        const backupData = {
            backup_date: new Date().toISOString(),
            record_count: result.rows.length,
            data: result.rows
        };

        res.json({
            success: true,
            backup: backupData
        });
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create backup',
            details: error.message
        });
    }
});

// Restore data from backup
app.post('/api/restore', async (req, res) => {
    const client = await pool.connect();

    try {
        const { data } = req.body;

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid backup data format'
            });
        }

        await client.query('BEGIN');

        // Delete all existing data
        await client.query('DELETE FROM staff_lic_records');

        // Restore data if not empty
        if (data.length > 0) {
            const values = [];
            const placeholders = [];
            let paramIndex = 1;

            data.forEach((record) => {
                placeholders.push(
                    `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`
                );
                values.push(
                    record.staff_sl,
                    record.staff_name,
                    record.staff_dept || '',
                    record.staff_designation || '',
                    record.staff_type || '',
                    record.policy_no,
                    record.premium_amount || 0,
                    record.maturity_date || null
                );
                paramIndex += 8;
            });

            const insertQuery = `
                INSERT INTO staff_lic_records (
                    staff_sl,
                    staff_name,
                    staff_dept,
                    staff_designation,
                    staff_type,
                    policy_no,
                    premium_amount,
                    maturity_date
                ) VALUES ${placeholders.join(', ')}
            `;

            await client.query(insertQuery, values);
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Successfully restored ${data.length} records`
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error restoring data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to restore data',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// Delete all data with password
app.post('/api/delete-all', async (req, res) => {
    try {
        const { password } = req.body;

        if (password !== 'teju2015') {
            return res.status(401).json({
                success: false,
                error: 'Invalid password'
            });
        }

        const result = await pool.query('DELETE FROM staff_lic_records RETURNING *');

        res.json({
            success: true,
            message: `Successfully deleted ${result.rows.length} records`
        });
    } catch (error) {
        console.error('Error deleting all data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete all data',
            details: error.message
        });
    }
});

// Update staff CSV data
app.post('/api/staff', async (req, res) => {
    const fs = require('fs').promises;
    const path = require('path');

    try {
        const { staffData } = req.body;

        if (!staffData || !Array.isArray(staffData)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid staff data format'
            });
        }

        // Convert staff data array to CSV format
        const headers = ['Sl', 'Name', 'Designation', 'Type', 'Dept', 'Status', 'DOB', 'Emp ID', 'DOE', 'Bank Acct No', 'PAN', 'Aadhar', 'Phone', 'Mail ID'];
        const csvLines = [headers.join(',')];

        staffData.forEach(staff => {
            const row = [
                staff.sl || '',
                staff.name || '',
                staff.designation || '',
                staff.type || '',
                staff.dept || '',
                staff.status || '',
                staff.dob || '',
                staff.empId || '',
                staff.doe || '',
                staff.bankAcct || '',
                staff.pan || '',
                staff.aadhar || '',
                staff.phone || '',
                staff.email || ''
            ];
            csvLines.push(row.join(','));
        });

        const csvContent = csvLines.join('\n');
        const csvPath = path.join(__dirname, 'staff.csv');

        await fs.writeFile(csvPath, csvContent, 'utf8');

        res.json({
            success: true,
            message: `Successfully updated staff CSV with ${staffData.length} records`
        });
    } catch (error) {
        console.error('Error updating staff CSV:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update staff CSV',
            details: error.message
        });
    }
});

// Update staff_emp_id in policies when staff empId changes
app.put('/api/lic-records/update-emp-id', async (req, res) => {
    try {
        const { oldEmpId, newEmpId } = req.body;

        if (!oldEmpId || !newEmpId) {
            return res.status(400).json({
                success: false,
                error: 'Both oldEmpId and newEmpId are required'
            });
        }

        const query = `
            UPDATE staff_lic_records
            SET staff_emp_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE staff_emp_id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [newEmpId, oldEmpId]);

        res.json({
            success: true,
            message: `Successfully updated ${result.rows.length} policy records with new emp ID`,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error updating emp IDs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update emp IDs',
            details: error.message
        });
    }
});

// ==================== STAFF DATABASE ENDPOINTS ====================

// Initialize staff table (run once)
app.post('/api/staff/init-table', async (req, res) => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS staff (
                id SERIAL PRIMARY KEY,
                emp_id VARCHAR(50) NOT NULL UNIQUE,
                sl VARCHAR(10),
                name VARCHAR(255) NOT NULL,
                designation VARCHAR(100),
                type VARCHAR(50),
                dept VARCHAR(100),
                status VARCHAR(50),
                dob VARCHAR(20),
                doe VARCHAR(20),
                bank_acct VARCHAR(100),
                pan VARCHAR(20),
                aadhar VARCHAR(20),
                phone VARCHAR(20),
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_staff_emp_id ON staff(emp_id);
            CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(name);
        `;

        await pool.query(createTableQuery);

        res.json({
            success: true,
            message: 'Staff table initialized successfully'
        });
    } catch (error) {
        console.error('Error initializing staff table:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initialize staff table',
            details: error.message
        });
    }
});

// Get all staff from database
app.get('/api/staff-db', async (req, res) => {
    try {
        const query = `
            SELECT
                id,
                emp_id,
                sl,
                name,
                designation,
                type,
                dept,
                status,
                dob,
                doe,
                bank_acct,
                pan,
                aadhar,
                phone,
                email,
                created_at,
                updated_at
            FROM staff
            ORDER BY name ASC
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            staff: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching staff from database:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch staff from database',
            details: error.message
        });
    }
});

// Add new staff to database
app.post('/api/staff-db', async (req, res) => {
    try {
        const { staff } = req.body;

        if (!staff || !staff.emp_id || !staff.name) {
            return res.status(400).json({
                success: false,
                error: 'emp_id and name are required'
            });
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

        res.status(201).json({
            success: true,
            message: 'Staff added successfully',
            staff: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding staff:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add staff',
            details: error.message
        });
    }
});

// Update staff in database
app.put('/api/staff-db/:emp_id', async (req, res) => {
    try {
        const { emp_id } = req.params;
        const { staff } = req.body;

        if (!staff) {
            return res.status(400).json({
                success: false,
                error: 'Staff data is required'
            });
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
            return res.status(404).json({
                success: false,
                error: 'Staff not found'
            });
        }

        res.json({
            success: true,
            message: 'Staff updated successfully',
            staff: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update staff',
            details: error.message
        });
    }
});

// Delete staff from database
app.delete('/api/staff-db/:emp_id', async (req, res) => {
    try {
        const { emp_id } = req.params;

        const query = 'DELETE FROM staff WHERE emp_id = $1 RETURNING *';
        const result = await pool.query(query, [emp_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Staff not found'
            });
        }

        res.json({
            success: true,
            message: 'Staff deleted successfully',
            staff: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete staff',
            details: error.message
        });
    }
});

// Migrate CSV data to database
app.post('/api/staff/migrate-csv', async (req, res) => {
    const client = await pool.connect();
    const fs = require('fs').promises;
    const path = require('path');

    try {
        const { staffData } = req.body;

        if (!staffData || !Array.isArray(staffData)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid staff data format'
            });
        }

        await client.query('BEGIN');

        // Clear existing data
        await client.query('DELETE FROM staff');

        // Bulk insert staff data
        if (staffData.length > 0) {
            const values = [];
            const placeholders = [];
            let paramIndex = 1;

            staffData.forEach((staff) => {
                placeholders.push(
                    `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13})`
                );
                values.push(
                    staff.empId,
                    staff.sl || null,
                    staff.name,
                    staff.designation || null,
                    staff.type || null,
                    staff.dept || null,
                    staff.status || null,
                    staff.dob || null,
                    staff.doe || null,
                    staff.bankAcct || null,
                    staff.pan || null,
                    staff.aadhar || null,
                    staff.phone || null,
                    staff.email || null
                );
                paramIndex += 14;
            });

            const insertQuery = `
                INSERT INTO staff (
                    emp_id, sl, name, designation, type, dept, status,
                    dob, doe, bank_acct, pan, aadhar, phone, email
                ) VALUES ${placeholders.join(', ')}
            `;

            await client.query(insertQuery, values);
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Successfully migrated ${staffData.length} staff records to database`
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error migrating CSV to database:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to migrate CSV to database',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`Staff LIC Management Server`);
    console.log(`========================================`);
    console.log(`Server running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log(`========================================\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await pool.end();
    console.log('Database connections closed.');
    process.exit(0);
});
