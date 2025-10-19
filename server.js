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
                `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`
            );
            values.push(
                policy.staff_sl,
                policy.staff_name,
                policy.staff_dept,
                policy.staff_designation,
                policy.staff_type,
                policy.policy_no.toUpperCase(),
                policy.premium_amount || 0,
                policy.maturity_date || null
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
