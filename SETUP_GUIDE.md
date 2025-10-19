# Staff LIC Records Management System - Setup Guide

## Overview

This is a web application for managing staff LIC (Life Insurance Corporation) policy records. The application features:
- Display staff list from CSV file in alphabetical order
- Search and filter functionality
- Individual LIC policy entry for each staff member
- Multiple policy support per staff member
- Automatic uppercase conversion for policy numbers
- Enter key navigation between fields
- Nile database backend for data persistence
- Beautiful responsive UI with modal popups

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **Database**: Nile PostgreSQL Database
- **MCP Integration**: Nile Database MCP Server

## Prerequisites

- Node.js installed (v14 or higher)
- Nile account with API credentials
- Staff CSV file with columns: SL, Name, Dept, Designation, Type

## Installation Steps

### 1. Install Dependencies

The required packages are already installed. If you need to reinstall:

```bash
npm install
```

This installs:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `pg` - PostgreSQL client for Node.js
- `dotenv` - Environment variable management

### 2. Verify Database Setup

The database table `staff_lic_records` has already been created in your Nile database `tejuDB` with the following schema:

```sql
CREATE TABLE staff_lic_records (
    id SERIAL PRIMARY KEY,
    staff_sl INTEGER NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    staff_dept VARCHAR(100),
    staff_designation VARCHAR(100),
    staff_type VARCHAR(50),
    policy_no VARCHAR(100) NOT NULL,
    premium_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Environment Configuration

Your `.env` file is already configured with:
- `DATABASE_URL` - Nile database connection string
- `PORT` - Server port (3000)
- `NILE_API_KEY` - Your Nile API key
- `NILE_WORKSPACE_SLUG` - Your workspace identifier

**IMPORTANT**: Never commit the `.env` file to version control!

## Running the Application

### Step 1: Start the Backend Server

```bash
npm start
```

You should see:
```
========================================
Staff LIC Management Server
========================================
Server running on port 3000
API URL: http://localhost:3000
Health Check: http://localhost:3000/api/health
========================================

Connected to Nile Database successfully!
```

### Step 2: Open the Frontend

Open your web browser and navigate to:
```
http://localhost:3000
```

The application will automatically load the staff list from `staff.csv`.

## Application Features

### 1. Staff List Display

- Shows all staff members in alphabetical order
- Displays: Name, SL Number, Department, Designation, and Type
- Color-coded badges for Teaching/Non-Teaching staff
- Green indicator for staff with existing LIC records

### 2. Search and Filter

- **Search Bar**: Search by name, department, or designation
- **Filter Buttons**:
  - All Staff - Shows everyone
  - Teaching - Shows only teaching staff
  - Non-Teaching - Shows only non-teaching staff

### 3. Enter LIC Details

Click "Enter Details" button next to any staff member to:
- View staff information
- See existing policies (if any)
- Add new policy records

### 4. Policy Entry Features

- **Automatic Uppercase**: Policy numbers are automatically converted to uppercase
- **Enter Key Navigation**: Press Enter to move to the next field
- **Auto-Save on Last Field**: Press Enter on the last field to automatically save (if all fields are filled)
- **Multiple Policies**: Click "Add Another Policy" to add multiple policies at once
- **Remove Policy**: Click the × button to remove a policy entry

### 5. Statistics Dashboard

The top of the page displays:
- Total Staff Count
- Staff with LIC Policies
- Total Number of Policies Registered

## API Endpoints

The backend provides the following REST API endpoints:

### GET /api/health
Health check endpoint
```json
{
  "success": true,
  "message": "Server is healthy",
  "database": "connected",
  "timestamp": "2025-10-17T..."
}
```

### GET /api/lic-records
Get all LIC records
```json
{
  "success": true,
  "records": [...],
  "count": 25
}
```

### GET /api/lic-records/staff/:staffSL
Get LIC records for specific staff member
```json
{
  "success": true,
  "records": [...],
  "count": 2
}
```

### POST /api/lic-records
Add new LIC records
```json
{
  "policies": [
    {
      "staff_sl": 1,
      "staff_name": "JOHN DOE",
      "staff_dept": "CS",
      "staff_designation": "LECTURER",
      "staff_type": "TEACHING",
      "policy_no": "ABC123456",
      "premium_amount": 5000.00
    }
  ]
}
```

### PUT /api/lic-records/:id
Update existing LIC record

### DELETE /api/lic-records/:id
Delete LIC record

### GET /api/stats
Get statistics
```json
{
  "success": true,
  "stats": {
    "staff_with_lic": 15,
    "total_policies": 23,
    "total_premium": 125000.00
  }
}
```

## Usage Workflow

### Adding LIC Records

1. **Start the server**: `npm start`
2. **Open browser**: Navigate to `http://localhost:3000`
3. **Find staff member**: Use search or scroll through the list
4. **Click "Enter Details"**: Opens the LIC entry modal
5. **Fill in details**:
   - Enter Policy Number (automatically converts to uppercase)
   - Enter Premium Amount
   - Press Enter to move to next field
6. **Add more policies** (optional): Click "Add Another Policy"
7. **Save**: Click "Save LIC Details" or press Enter on the last field
8. **Success**: Modal closes and the staff list updates

### Viewing Existing Records

1. Staff members with LIC records show a green indicator
2. Click "View Details" to see existing policies
3. Existing policies are displayed at the top of the modal
4. You can add additional policies from this view

### Searching and Filtering

1. **Search**: Type in the search box to filter by name, department, or designation
2. **Filter**: Click filter buttons to show Teaching/Non-Teaching staff only
3. **Clear**: Clear search box or click "All Staff" to reset

## File Structure

```
Html_OfficeSMP/
├── index.html          # Main HTML file
├── styles.css          # Stylesheet
├── app.js             # Frontend JavaScript
├── server.js          # Backend Node.js server
├── staff.csv          # Staff data CSV file
├── package.json       # Node.js dependencies
├── .env              # Environment variables (DO NOT COMMIT)
├── .mcp.json         # MCP server config (DO NOT COMMIT)
├── .gitignore        # Git ignore file
├── README.md         # Nile MCP setup guide
└── SETUP_GUIDE.md    # This file
```

## Keyboard Shortcuts

- **Enter**: Navigate to next input field
- **Enter (on last field)**: Auto-save if all fields are filled
- **ESC**: Close modal (not implemented yet, but you can click outside or use × button)

## Troubleshooting

### Server won't start

**Error**: `Cannot find module 'express'`
**Solution**: Run `npm install`

**Error**: `Database connection error`
**Solution**: Check your `.env` file has the correct `DATABASE_URL`

### Frontend shows "Error loading staff data"

**Error**: Cannot read staff.csv
**Solution**: Ensure `staff.csv` exists in the project root directory

### Cannot save LIC records

**Error**: Network error or CORS error
**Solution**:
1. Ensure backend server is running on port 3000
2. Check browser console for errors
3. Verify database connection

### Page is blank

**Solution**:
1. Open browser developer console (F12)
2. Check for JavaScript errors
3. Ensure server is running
4. Clear browser cache and reload

## Security Best Practices

1. **Never commit sensitive files**:
   - `.env` (contains database credentials)
   - `.mcp.json` (contains API keys)

2. **Use .gitignore**: The `.gitignore` file is already configured

3. **Rotate credentials**: Periodically generate new API keys and database credentials

4. **Backup database**: Regularly backup your Nile database

## Database Management

### View all records using Nile MCP

You can use Claude Code to query the database:
```
Show me all LIC records in the tejuDB database
```

### Manual SQL queries

```sql
-- Get all records
SELECT * FROM staff_lic_records ORDER BY staff_name;

-- Get records for specific staff
SELECT * FROM staff_lic_records WHERE staff_sl = 1;

-- Get statistics
SELECT COUNT(DISTINCT staff_sl) as staff_count,
       COUNT(*) as policy_count,
       SUM(premium_amount) as total_premium
FROM staff_lic_records;

-- Delete all records (use with caution!)
DELETE FROM staff_lic_records;
```

## Future Enhancements

Possible improvements:
- Edit existing policy records
- Delete individual policies
- Export reports to PDF/Excel
- Email notifications
- Policy expiry tracking
- Dashboard charts and graphs
- User authentication
- Audit trail

## Support

For issues with:
- **Nile Database**: Contact Nile support or check [docs.nile.app](https://docs.nile.app)
- **Claude Code**: Report issues at [github.com/anthropics/claude-code/issues](https://github.com/anthropics/claude-code/issues)
- **Application bugs**: Check server logs and browser console

## Development

### Running in development mode

```bash
npm run dev
```

### Adding new features

1. Backend changes: Edit `server.js`
2. Frontend UI: Edit `index.html` and `styles.css`
3. Frontend logic: Edit `app.js`
4. Database schema: Use Nile MCP to execute SQL

### Testing API endpoints

Use tools like:
- **Browser**: For GET requests
- **Postman**: For all request types
- **curl**: Command-line testing
- **Claude Code**: Ask Claude to test endpoints using Nile MCP

Example curl command:
```bash
curl http://localhost:3000/api/health
```

## License

This application is for internal use only.

## Credits

Built with Nile Database MCP integration and Claude Code.

---

**Happy Managing!**
