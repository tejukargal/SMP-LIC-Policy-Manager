# Database Migration Guide

## Overview
This guide explains the new database migration feature that moves staff data from the CSV file to the Nile cloud database for better security and data persistence.

## What Changed

### 1. User-Specific Total Policies View ✅
- **Admin users**: Can view all policies when clicking the "Total Policies" card
- **Regular users**: Only see their own policies when clicking the "Total Policies" card

### 2. Database Migration Feature ✅
Staff data containing sensitive information (Aadhar, PAN) has been migrated from CSV to the Nile cloud database.

## Key Features

### Security Benefits
- ✅ Sensitive data (Aadhar, PAN) stored securely in cloud database
- ✅ CSV file can be safely deleted after migration
- ✅ Data persists even if staff.csv is removed
- ✅ Better access control and data protection

### How It Works

#### Data Loading Priority
1. **First**: App tries to load staff from Nile database
2. **Fallback**: If database is empty, loads from staff.csv
3. **Auto-migration**: Staff CRUD operations automatically sync to both database and CSV

#### Migration Steps

1. **One-Time Setup**:
   - Click the hamburger menu (☰)
   - Click "Migrate CSV to Database"
   - Confirm the migration
   - Wait for success message

2. **After Migration**:
   - Staff data is now in the cloud database
   - CSV file is kept as backup but can be deleted
   - App will load from database on future visits

## Technical Details

### New API Endpoints

#### Staff Management
- `POST /api/staff/init-table` - Initialize staff table (auto-called during migration)
- `GET /api/staff-db` - Get all staff from database
- `POST /api/staff-db` - Add new staff to database
- `PUT /api/staff-db/:emp_id` - Update staff in database
- `DELETE /api/staff-db/:emp_id` - Delete staff from database
- `POST /api/staff/migrate-csv` - Migrate CSV data to database

### Database Schema

```sql
CREATE TABLE staff (
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
```

## Environment Setup

### Required Environment Variable

Add to your `.env` file:
```
DATABASE_URL=postgres://0199fcf8-7f48-70bc-b823-9c7a5b79418f:708465c1-d7cc-4768-9699-e6e98a60a1b5@us-west-2.db.thenile.dev:5432/tejuDB
```

⚠️ **Note**: Keep this connection string secure. Never commit it to public repositories.

## Usage Guide

### For Administrators

1. **First Time Setup**:
   ```
   1. Ensure server is running (npm start)
   2. Login as admin
   3. Click hamburger menu
   4. Click "Migrate CSV to Database"
   5. Wait for success message
   ```

2. **Daily Operations**:
   - Add/Edit/Delete staff works as before
   - Data automatically syncs to database
   - CSV is maintained as backup

### For Regular Users

- No changes to workflow
- Click "Total Policies" card to view your policies
- View-only access maintained

## Testing the Migration

1. **Before Migration**:
   - Check browser console: "⚠️ Database empty or unavailable, loading from CSV..."
   - Staff data loads from staff.csv

2. **After Migration**:
   - Check browser console: "✅ Staff data loaded from database: X records"
   - Delete staff.csv (optional test)
   - Refresh page - data still loads!

## Rollback Plan

If you need to rollback to CSV-only:

1. Keep your staff.csv file
2. Comment out database loading in `loadCSV()` function
3. Or simply don't run the migration

## Benefits Summary

| Feature | Before | After |
|---------|--------|-------|
| Data Storage | CSV file only | Cloud database + CSV backup |
| Security | File-based | Database with access control |
| Persistence | Depends on CSV file | Persists even if CSV deleted |
| Sensitive Data | Exposed in CSV | Secured in database |
| Total Policies View (User) | All policies | User's policies only |
| Total Policies View (Admin) | All policies | All policies |

## Support

For issues or questions:
- Check server logs for errors
- Verify DATABASE_URL in .env
- Ensure Nile database is accessible
- Contact system administrator

---

**Migration Status**: ✅ Ready to use
**Last Updated**: 2025-10-19
