# DigiStall Database Setup Guide

This guide explains how to connect to the DigiStall DigitalOcean Managed MySQL Database from your local machine and how to switch between local and cloud database configurations.

## Table of Contents

1. [Overview](#overview)
2. [Connecting from MySQL Workbench](#connecting-from-mysql-workbench)
3. [Environment Configuration](#environment-configuration)
4. [Switching Between Environments](#switching-between-environments)
5. [Testing Your Connection](#testing-your-connection)
6. [Troubleshooting](#troubleshooting)
7. [Security Best Practices](#security-best-practices)

---

## Overview

The DigiStall project uses a **DigitalOcean Managed MySQL Database** that can be accessed from both:
- **Local Development**: Your laptop/desktop for development and testing
- **Production Deployment**: Docker containers on DigitalOcean droplet

### Database Details

```
Host:     dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
Port:     25060
Database: naga_stall
Username: doadmin
Password: AVNS_hxkemfGwzsOdj4pbu35
SSL:      Required
```

---

## Connecting from MySQL Workbench

If you try to connect to the DigitalOcean database from MySQL Workbench and see **"Cannot Connect to Database Server"**, this is because DigitalOcean requires IP addresses to be whitelisted first.

### Step 1: Whitelist Your IP Address on DigitalOcean

1. **Login to DigitalOcean Dashboard**
   - Go to: https://cloud.digitalocean.com/
   - Sign in with your DigitalOcean account

2. **Navigate to Your Database**
   - Click **Databases** in the left sidebar
   - Click on database name: **dbaas-db-2078449-do-user-29954926-0**

3. **Add Your IP to Trusted Sources**
   - Go to the **Settings** tab
   - Scroll down to **Trusted Sources** section
   - Click the **Edit** button
   - Click **Add Trusted Source** → **My Computer's IP**
   - DigitalOcean will automatically detect and add your current IP address
   - Click **Save** (or **Allow these sources** button)

4. **Wait for Changes to Propagate**
   - Wait 1-2 minutes for the firewall rules to update
   - You can proceed to MySQL Workbench setup during this time

### Step 2: Configure MySQL Workbench Connection

1. **Open MySQL Workbench**
   - Launch MySQL Workbench on your computer

2. **Create/Edit Connection**
   - Click the **+** icon next to "MySQL Connections" (or edit existing "Naga_Stall" connection)
   - Use these settings:

   **Connection Tab:**
   ```
   Connection Name:  Naga Stall (DigitalOcean)
   Connection Method: Standard (TCP/IP)
   Hostname:         dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
   Port:             25060
   Username:         doadmin
   Password:         AVNS_hxkemfGwzsOdj4pbu35
   Default Schema:   naga_stall
   ```

   **SSL Tab:**
   ```
   Use SSL:          Required
   SSL CA File:      (leave empty)
   SSL CERT File:    (leave empty)
   SSL Key File:     (leave empty)
   ```

   > **Why leave SSL files empty?** The application uses `rejectUnauthorized: false` in the database configuration, which means certificate validation is disabled. The connection is still encrypted, but you don't need to download the CA certificate.

3. **Test Connection**
   - Click **Test Connection** button
   - You should see: **"Successfully made the MySQL connection"**
   - If you see errors, check the [Troubleshooting](#troubleshooting) section

4. **Connect and Verify**
   - Click **OK** to save the connection
   - Double-click the connection to connect
   - Run a test query to verify:
     ```sql
     SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'naga_stall';
     ```

---

## Environment Configuration

The project uses three environment files for different scenarios:

### `.env` - Active Configuration
This is the file the application reads. Copy from `.env.local` or `.env.production` as needed.

### `.env.local` - Local MySQL Database
Use this for offline development with a local MySQL server:
```env
DB_HOST=localhost
DB_PORT=3301
DB_NAME=naga_stall
DB_USER=root
DB_PASSWORD=
DB_SSL=false
NODE_ENV=development
```

### `.env.production` - DigitalOcean Cloud Database
Use this for cloud development and testing:
```env
DB_HOST=dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=naga_stall
DB_USER=doadmin
DB_PASSWORD=AVNS_hxkemfGwzsOdj4pbu35
DB_SSL=true
NODE_ENV=production
```

---

## Switching Between Environments

### Option 1: Using npm Scripts (Recommended)

```bash
# Switch to cloud database (DigitalOcean)
npm run db:cloud

# Switch to local database
npm run db:local

# Show current database configuration
npm run db:switch
```

### Option 2: Manual Switching

```bash
# Switch to cloud database
cp .env.production .env

# Switch to local database
cp .env.local .env
```

### Option 3: Using the Script Directly

```bash
# Switch to cloud database
node scripts/switch-env.js cloud

# Switch to local database
node scripts/switch-env.js local

# Show current configuration
node scripts/switch-env.js
```

---

## Testing Your Connection

### Quick Connection Test

After switching environments, test the database connection:

```bash
npm run db:test
```

**Expected Output (Success):**
```
🔍 Testing database connection...
✅ Success: Database connection successful
📊 Configuration: {
  host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  user: 'doadmin',
  database: 'naga_stall',
  poolSize: 10
}
```

**Expected Output (Failure):**
```
🔍 Testing database connection...
❌ Failed: Database connection failed
⚠️  Error: connect ETIMEDOUT

💡 Troubleshooting Hint:
Connection timeout - check DigitalOcean Trusted Sources and ensure your IP is whitelisted
```

### Testing from Application

Start your backend server and check the logs:

```bash
npm start
```

**Look for these log messages:**
```
🔧 Database Config: {
  host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  database: 'naga_stall',
  passwordSet: true,
  ssl: 'enabled',
  connectTimeout: 30000,
  connectionLimit: 10
}

🔧 Database Pool Created: {
  host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  database: 'naga_stall',
  connectionLimit: 10,
  ssl: 'enabled'
}
```

---

## Troubleshooting

### Error: "Cannot Connect to Database Server"

**Cause:** Your IP address is not whitelisted in DigitalOcean Trusted Sources.

**Solution:**
1. Follow [Step 1: Whitelist Your IP Address](#step-1-whitelist-your-ip-address-on-digitalocean)
2. Wait 1-2 minutes for changes to propagate
3. Try connecting again

### Error: "SSL connection error"

**Cause:** SSL configuration is incorrect in MySQL Workbench.

**Solution:**
1. In MySQL Workbench, edit the connection
2. Go to **SSL** tab
3. Set "Use SSL" to **Required**
4. Leave all certificate file fields **empty**
5. Save and test connection

### Error: "Access denied for user 'doadmin'@'...'

**Cause:** Incorrect username or password.

**Solution:**
1. Verify credentials in `.env` or `.env.production`:
   - `DB_USER=doadmin`
   - `DB_PASSWORD=AVNS_hxkemfGwzsOdj4pbu35`
2. Ensure there are no extra spaces or quotes
3. Update MySQL Workbench connection with correct credentials

### Error: "Connection timeout" (ETIMEDOUT)

**Possible Causes:**
1. IP not whitelisted on DigitalOcean
2. Network firewall blocking port 25060
3. Internet connection issues

**Solutions:**
1. Verify your IP is in DigitalOcean Trusted Sources
2. Check if your firewall allows outbound connections on port 25060
3. Test network connectivity:
   ```powershell
   # Windows PowerShell
   Test-NetConnection -ComputerName dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -Port 25060
   ```
   ```bash
   # Linux/Mac
   nc -zv dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com 25060
   ```

### Error: "Unknown database 'naga_stall'"

**Cause:** Database name is incorrect or database doesn't exist.

**Solution:**
1. Verify `DB_NAME=naga_stall` in `.env`
2. Check database exists by logging into DigitalOcean dashboard
3. If database is missing, restore from backup or run migrations

### Dynamic IP Address Issues

If your IP address changes frequently (common with home internet):

**Solution 1: Re-add Your IP**
- Go to DigitalOcean dashboard → Databases → Settings → Trusted Sources
- Remove old IP and add new IP using "My Computer's IP"

**Solution 2: Use IP Range (Less Secure)**
- Add a CIDR range that covers your ISP's IP pool (e.g., `123.45.0.0/16`)
- ⚠️ This is less secure - only use if absolutely necessary

**Solution 3: Use VPN with Static IP**
- Use a VPN service that provides a static IP address
- Whitelist the VPN's static IP on DigitalOcean

### Application Works But MySQL Workbench Doesn't

**Cause:** Application might be running on a different network or server where IP is already whitelisted (e.g., DigitalOcean droplet).

**Solution:**
- Whitelist your local machine's IP separately
- Each location needs its own whitelisted IP

### Testing Network Connectivity

```bash
# Windows PowerShell - Test if port 25060 is reachable
Test-NetConnection -ComputerName dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -Port 25060

# Expected output if successful:
# ComputerName     : dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
# RemoteAddress    : 167.x.x.x
# RemotePort       : 25060
# TcpTestSucceeded : True
```

---

## Security Best Practices

### IP Whitelisting

**DO:**
- ✅ Add specific IP addresses for each developer
- ✅ Add the DigitalOcean droplet IP for production
- ✅ Regularly review and remove unused IPs
- ✅ Document which IPs belong to which team members

**DON'T:**
- ❌ Use `0.0.0.0/0` (allows connections from anywhere in the world)
- ❌ Share database credentials publicly or commit them to git
- ❌ Keep old/unused IPs in the whitelist

### SSL/TLS Configuration

**Current Setup:**
- The application uses `ssl: { rejectUnauthorized: false }`
- This means connections are **encrypted** but certificate validation is **disabled**

**Why This Works:**
- Provides encryption for data in transit
- Easier to set up (no certificate files needed)
- Suitable for development and small teams

**For Stricter Security (Optional):**
1. Download the DigitalOcean CA certificate:
   - Go to DigitalOcean Dashboard → Databases → Overview
   - Click "Download CA Certificate"
2. Update `config/database.js` to use the certificate:
   ```javascript
   ssl: {
     ca: fs.readFileSync('./certs/ca-certificate.crt')
   }
   ```

### Credentials Management

**Current State:**
- `.env`, `.env.local`, `.env.production` are in `.gitignore` ✅
- `deploy-to-droplet.sh` contains passwords (tracked in git) ⚠️

**Recommendations:**
1. **For Production Deployment:**
   - Use DigitalOcean App Platform secrets management
   - Or use environment variables set on the droplet
   - Remove hardcoded passwords from `deploy-to-droplet.sh`

2. **Password Rotation:**
   - Periodically rotate the database password
   - Update all `.env` files and deployment scripts
   - Remove and re-add access for team members

3. **Team Management:**
   - Create separate database users for each team member
   - Grant appropriate permissions (don't give everyone admin access)
   - Revoke access when team members leave

### Access Patterns

| Environment | IP to Whitelist | Purpose |
|-------------|----------------|---------|
| Developer #1's Laptop | 203.x.x.x | Local development |
| Developer #2's Laptop | 123.x.x.x | Local development |
| DigitalOcean Droplet | 68.183.154.125 | Production deployment |
| CI/CD Pipeline | (varies by provider) | Automated testing |

### Monitoring

**DigitalOcean Dashboard:**
- Monitor active connections
- Check slow queries
- Review connection logs
- Set up alerts for high connection count

**Application Logs:**
- Database connection logs are in `config/database.js:43-52`
- Monitor for connection errors
- Use `utils/dbRetry.js` for retry logic on transient failures

---

## Quick Reference

### Common Commands

```bash
# Environment Management
npm run db:cloud          # Switch to DigitalOcean database
npm run db:local          # Switch to local database
npm run db:switch         # Show current configuration

# Connection Testing
npm run db:test           # Test database connection
npm start                 # Start backend (check logs for DB connection)

# Network Testing
Test-NetConnection -ComputerName dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -Port 25060
```

### Important Links

- **DigitalOcean Dashboard:** https://cloud.digitalocean.com/
- **Database Management:** https://cloud.digitalocean.com/databases/dbaas-db-2078449-do-user-29954926-0
- **Trusted Sources:** https://cloud.digitalocean.com/databases/dbaas-db-2078449-do-user-29954926-0/settings → Trusted Sources
- **Production URL:** http://digi-stall.com (68.183.154.125)

### Database Configuration Files

- `config/database.js` - Main database configuration with SSL detection, connection pooling, timeouts
- `.env` - Active configuration (used by application)
- `.env.local` - Local MySQL configuration template
- `.env.production` - DigitalOcean cloud configuration template
- `utils/dbRetry.js` - Retry logic for handling transient connection failures

---

## Support

If you encounter issues not covered in this guide:

1. Check the application logs for error details
2. Verify your IP is whitelisted on DigitalOcean
3. Test network connectivity using the commands above
4. Review the [Troubleshooting](#troubleshooting) section
5. Contact the team lead or database administrator

---

**Last Updated:** 2026-03-26
**Database Version:** MySQL 8.0 (DigitalOcean Managed Database)
