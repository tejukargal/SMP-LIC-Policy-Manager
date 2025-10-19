# Nile Database MCP for Claude Code

A comprehensive guide to setting up and using the Nile Database MCP (Model Context Protocol) server with Claude Code.

## What is Nile Database MCP?

The Nile Database MCP allows Claude Code to interact directly with your Nile databases. You can create databases, manage tenants, execute SQL queries, and manage your database schema - all through natural language conversations with Claude.

## Prerequisites

Before you begin, make sure you have:

- **Node.js** installed (version 14 or higher)
- **npm** (comes with Node.js)
- **Claude Code** installed and configured
- A **Nile account** with:
  - API Key
  - Workspace Slug

### Getting Your Nile Credentials

1. Sign up or log in at [Nile.app](https://nile.app)
2. Navigate to your workspace settings
3. Generate an API key
4. Note your workspace slug (found in your workspace URL)

## Installation

### Step 1: Install the Nile MCP Server

Open your terminal and run:

```bash
npm install -g @niledatabase/nile-mcp-server
```

This installs the Nile MCP server globally on your system.

### Step 2: Locate the Installation Path

You need to find where the MCP server was installed. Run:

**On Windows:**
```bash
npm root -g
```

**On macOS/Linux:**
```bash
npm root -g
```

The output will show a path like:
- Windows: `C:\Users\YourName\AppData\Roaming\npm\node_modules`
- macOS/Linux: `/usr/local/lib/node_modules`

### Step 3: Configure Claude Code

Create or edit the `.mcp.json` file in your project directory:

**For Windows:**
```json
{
  "mcpServers": {
    "nile-database": {
      "type": "stdio",
      "command": "node",
      "args": ["C:\\Users\\YourName\\AppData\\Roaming\\npm\\node_modules\\@niledatabase\\nile-mcp-server\\dist\\index.js"],
      "env": {
        "NILE_API_KEY": "your_api_key_here",
        "NILE_WORKSPACE_SLUG": "your_workspace_slug_here"
      }
    }
  }
}
```

**For macOS/Linux:**
```json
{
  "mcpServers": {
    "nile-database": {
      "type": "stdio",
      "command": "node",
      "args": ["/usr/local/lib/node_modules/@niledatabase/nile-mcp-server/dist/index.js"],
      "env": {
        "NILE_API_KEY": "your_api_key_here",
        "NILE_WORKSPACE_SLUG": "your_workspace_slug_here"
      }
    }
  }
}
```

**Important:** Replace the following placeholders:
- `your_api_key_here` - Your actual Nile API key
- `your_workspace_slug_here` - Your actual workspace slug
- Update the path in `args` to match your npm installation location

### Step 4: Restart Claude Code

After configuring the MCP server, restart Claude Code to load the new configuration.

## Verifying Installation

To verify the installation works, start a conversation with Claude Code and try:

```
List all my Nile databases
```

If configured correctly, Claude will use the Nile MCP to fetch and display your databases.

## Available Features

The Nile Database MCP provides the following capabilities:

### Database Management
- **List databases** - View all databases in your workspace
- **Create database** - Create new databases in AWS regions (US_WEST_2, EU_CENTRAL_1)
- **Get database details** - View detailed information about a specific database
- **Delete database** - Remove databases from your workspace
- **Get connection string** - Retrieve PostgreSQL connection strings with fresh credentials

### Tenant Management
- **Create tenant** - Add new tenants to a database
- **List tenants** - View all tenants in a database
- **Delete tenant** - Remove tenants from a database

### Schema Management
- **List resources** - View all tables and their descriptions
- **Read resource** - Get detailed schema information for specific tables

### SQL Operations
- **Execute SQL** - Run SQL queries directly on your databases

## Usage Examples

### Example 1: Creating a New Database

```
Create a new Nile database called "my-app-db" in the US West region
```

Claude will execute the create-database command and confirm the creation.

### Example 2: Managing Tenants

```
Create a tenant named "acme-corp" in my-app-db database
```

```
List all tenants in my-app-db
```

### Example 3: Executing SQL Queries

```
Execute this SQL query on my-app-db:
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    price DECIMAL(10,2)
);
```

### Example 4: Exploring Schema

```
Show me all tables in my-app-db database
```

```
Get the schema details for the products table in my-app-db
```

### Example 5: Getting Connection Details

```
Get the connection string for my-app-db
```

## Common Commands

Here are some natural language commands you can use:

- "List all my databases"
- "Create a database called [name] in [region]"
- "Show me the tables in [database-name]"
- "Create a tenant named [tenant-name] in [database-name]"
- "Execute this SQL query: [your-query]"
- "Get connection details for [database-name]"
- "Delete the database [database-name]"
- "Show me all tenants in [database-name]"

## Troubleshooting

### MCP Server Not Found

**Error:** Claude Code cannot find the Nile MCP server

**Solution:**
1. Verify the installation: `npm list -g @niledatabase/nile-mcp-server`
2. Check the path in `.mcp.json` matches your npm global installation
3. Try reinstalling: `npm install -g @niledatabase/nile-mcp-server`

### Authentication Errors

**Error:** Invalid API key or workspace slug

**Solution:**
1. Verify your API key is correct in `.mcp.json`
2. Check your workspace slug matches your Nile account
3. Ensure there are no extra spaces or quotes in the credentials
4. Try generating a new API key from Nile dashboard

### Connection Issues

**Error:** Cannot connect to database

**Solution:**
1. Verify the database exists: "List all my databases"
2. Check your internet connection
3. Ensure the database is in an active state
4. Try getting a fresh connection string

### Node.js Version Issues

**Error:** Syntax or runtime errors

**Solution:**
1. Check your Node.js version: `node --version`
2. Update to Node.js 14 or higher if needed
3. Reinstall the MCP server after updating Node.js

## Security Best Practices

1. **Never commit `.mcp.json` with real credentials** - Add it to `.gitignore`
2. **Use environment variables** - Consider storing credentials in `.env` files
3. **Rotate API keys regularly** - Generate new keys periodically
4. **Limit API key permissions** - Use keys with minimal required permissions
5. **Keep backups** - Regularly backup your databases before making schema changes

## Additional Resources

- [Nile Documentation](https://docs.nile.app)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Nile Dashboard](https://nile.app)

## Need Help?

If you encounter issues:

1. Check the logs in your Claude Code session
2. Review the [Nile documentation](https://docs.nile.app)
3. Contact Nile support through their dashboard
4. Report Claude Code issues at [github.com/anthropics/claude-code/issues](https://github.com/anthropics/claude-code/issues)

## Example Project Structure

```
your-project/
├── .mcp.json          # MCP server configuration (DO NOT COMMIT)
├── .env               # Environment variables (DO NOT COMMIT)
├── .gitignore         # Include .mcp.json and .env
├── README.md          # This file
└── src/
    └── your-code.js
```

## .gitignore Template

Add these lines to your `.gitignore`:

```
.mcp.json
.env
```

---

Happy coding with Nile and Claude Code!
