# Team Database Access Setup

**Document Version**: 1.0
**Last Updated**: 2026-03-26
**Purpose**: Guide for team members to set up access to the DigiStall DigitalOcean database

---

## Overview

The DigiStall project uses a **DigitalOcean Managed MySQL Database** for both local development and production. For security, DigitalOcean requires each developer's IP address to be whitelisted before they can connect.

**Important**: You cannot connect to the database until you complete this setup, even if you have the correct code and credentials.

---

## Prerequisites

Before starting, make sure you have:
- ✅ Access to the DigitalOcean account (ask team lead for access)
- ✅ Cloned the DigiStall repository to your local machine
- ✅ Installed Node.js (v16 or higher)
- ✅ Installed MySQL Workbench (optional, but recommended)

---

## Step-by-Step Setup

### Step 1: Install Project Dependencies

```bash
cd DigiStall-CP2025-2026
npm install
```

### Step 2: Configure Environment

```bash
# Copy the environment template
cp .env.example .env

# Switch to cloud database
npm run db:cloud
```

### Step 3: Find Your Public IP Address

Your **public IP** is different from your local IP (10.x.x.x or 192.168.x.x). You need your public internet IP.

**Method 1: PowerShell (Windows)**
```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```

**Method 2: Browser**
Visit: https://whatismyipaddress.com/

**Method 3: Quick website**
Visit: https://ipinfo.io/ip

**Example Public IPs**:
- ✅ `210.4.60.147` - Valid public IP
- ✅ `203.45.123.89` - Valid public IP
- ❌ `10.0.18.104` - Private IP (won't work)
- ❌ `192.168.1.100` - Private IP (won't work)

**Write down your public IP** - you'll need it in the next step.

---

### Step 4: Whitelist Your IP in DigitalOcean

This is the **most important step**. Without this, you cannot connect to the database.

#### 4.1 Login to DigitalOcean

1. Go to: https://cloud.digitalocean.com/
2. Login with your DigitalOcean credentials
   - If you don't have access, ask the team lead to invite you

#### 4.2 Navigate to the Database

1. Click **"Databases"** in the left sidebar
2. Select: **dbaas-db-2078449-do-user-29954926-0**
3. Click the **"Settings"** tab
4. Scroll down to **"Trusted Sources"** section

#### 4.3 Add Your IP

**Option A: Quick Add (Recommended)**
1. Click **"Add trusted sources"** button (top right)
2. Look for **"RECENTLY CREATED"** section
3. Your IP should appear there (e.g., "210.4.60.147 - Your current computer's IP")
4. Select it by clicking the checkbox
5. In the description field, enter: **"Your Name - Home/Office - [Current Date]"**
   - Example: `"John Doe - Home Office - 2026-03-26"`
6. Click **"Add trusted sources"** button at the bottom
7. Wait **1-2 minutes** for changes to propagate

**Option B: Manual Entry**
1. Click **"Add trusted sources"** button
2. Switch to: **"Enter specific IP addresses or CIDR notations"** (top option)
3. Enter your public IP address in the text field
   - Example: `210.4.60.147`
4. Add description: **"Your Name - Location - Date"**
5. Click **"Add trusted sources"**
6. Wait **1-2 minutes**

#### 4.4 Verify Your IP is Added

You should now see your IP in the list of trusted sources on the Settings page.

---

### Step 5: Test Your Database Connection

After waiting 1-2 minutes, test your connection:

```bash
npm run db:test
```

**Expected Success Output:**
```
🔍 Testing Database Connection...

📊 Configuration:
   Host:     dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
   Port:     25060
   Database: naga_stall
   User:     doadmin
   SSL:      Enabled ☁️
   Type:     Cloud Database (DigitalOcean)

✅ SUCCESS: Database connection established!

📈 Connection Details:
   Host:       dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
   User:       doadmin
   Database:   naga_stall
   Pool Size:  10 connections

💡 Tips:
   - Your IP is properly whitelisted on DigitalOcean
   - You can now use MySQL Workbench to connect
```

**If you see errors**, check the [Troubleshooting](#troubleshooting) section below.

---

### Step 6: Set Up MySQL Workbench (Optional)

MySQL Workbench allows you to visually browse and manage the database.

#### 6.1 Create a New Connection

1. Open MySQL Workbench
2. Click the **+** icon next to "MySQL Connections"

#### 6.2 Configure Connection Settings

**Connection Tab:**
```
Connection Name:  DigiStall - DigitalOcean
Connection Method: Standard (TCP/IP)
Hostname:         dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
Port:             25060
Username:         doadmin
Password:         AVNS_hxkemfGwzsOdj4pbu35 (click "Store in Keychain/Vault")
Default Schema:   naga_stall
```

**SSL Tab:** (IMPORTANT)
```
Use SSL:          Required
SSL CA File:      (leave empty)
SSL Cert File:    (leave empty)
SSL Key File:     (leave empty)
```

#### 6.3 Test Connection

1. Click **"Test Connection"** button
2. You should see: **"Successfully made the MySQL connection"**
3. Click **OK** to save

#### 6.4 Connect and Verify

1. Double-click your connection to connect
2. Run a test query:
   ```sql
   SELECT COUNT(*) AS table_count
   FROM information_schema.tables
   WHERE table_schema = 'naga_stall';
   ```
3. You should see results showing the number of tables

---

### Step 7: Start Development

You're all set! You can now:

```bash
# Start the backend server
npm start

# Or start in development mode with auto-reload
npm run dev
```

The backend will start on:
- **Web API**: http://localhost:5000
- **Mobile API**: http://localhost:5001

---

## Database Commands Quick Reference

```bash
# Test database connection
npm run db:test

# Show current database configuration
npm run db:switch

# Switch to cloud database (DigitalOcean)
npm run db:cloud

# Switch to local database (if you have MySQL installed locally)
npm run db:local
```

---

## Troubleshooting

### Error: "Cannot Connect to Database Server" or "ETIMEDOUT"

**Cause**: Your IP is not whitelisted or the whitelist hasn't propagated yet.

**Solutions**:
1. **Verify your IP is whitelisted**:
   - Go to DigitalOcean → Databases → Settings → Trusted Sources
   - Check if your IP appears in the list

2. **Wait longer**: Sometimes it takes up to 5 minutes for changes to propagate

3. **Check you added the correct IP**:
   - Verify it's your **public IP**, not private IP
   - Run: `(Invoke-WebRequest -Uri "https://api.ipify.org").Content` (PowerShell)
   - Compare with what you added to DigitalOcean

4. **Test network connectivity**:
   ```powershell
   Test-NetConnection -ComputerName dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -Port 25060
   ```
   - Should show: `TcpTestSucceeded : True`
   - If False, your IP isn't whitelisted or firewall is blocking

5. **Corporate Network/VPN Issues**:
   - If you're on a corporate network, it may block port 25060
   - Try disconnecting from VPN
   - Ask your IT department about firewall rules

---

### Error: "SSL Connection Error"

**Cause**: SSL configuration is incorrect in MySQL Workbench.

**Solution**:
1. Edit your MySQL Workbench connection
2. Go to **SSL** tab
3. Set "Use SSL" to **"Required"** (not "Preferred" or "Disabled")
4. Ensure all certificate file fields are **empty**
5. Save and test again

---

### Error: "Access Denied for User 'doadmin'"

**Cause**: Wrong credentials or password.

**Solution**:
1. Check the `.env` file for correct credentials
2. Verify `DB_USER=doadmin`
3. Verify `DB_PASSWORD=AVNS_hxkemfGwzsOdj4pbu35`
4. Ensure no extra spaces or quotes in the `.env` file

---

### Your IP Changed (Dynamic IP)

If you have a dynamic IP (common with home internet), your IP may change periodically.

**Symptoms**:
- Connection worked yesterday, but not today
- Sudden ETIMEDOUT errors

**Solution**:
1. Get your new public IP: `(Invoke-WebRequest -Uri "https://api.ipify.org").Content`
2. Go to DigitalOcean Trusted Sources
3. Remove your old IP entry (if you want to keep the list clean)
4. Add your new IP using the same steps as before
5. Wait 1-2 minutes and test again

**Tip**: Keep a note of your IP and the date you added it, so you can track when it changes.

---

### Working from Different Locations

If you work from multiple locations (home, office, coffee shop), you'll need to whitelist each location's IP.

**Example**:
- Home Office: `210.4.60.147` - "John - Home"
- School/University: `203.45.123.89` - "John - School"
- Mobile Hotspot: `123.45.67.89` - "John - Mobile"

Each location needs its own entry in Trusted Sources.

---

## Important Security Notes

### DO:
- ✅ Add only your specific IP address
- ✅ Use descriptive names (Name + Location + Date)
- ✅ Update your IP if it changes
- ✅ Remove old IPs when you stop using that location
- ✅ Keep the database password secure (never commit `.env` files)

### DON'T:
- ❌ Share your IP whitelist entry with others (each person needs their own)
- ❌ Add `0.0.0.0/0` (allows anyone on the internet to connect)
- ❌ Add large IP ranges unless necessary
- ❌ Commit `.env` files to Git (they're gitignored for security)
- ❌ Share database credentials in public channels

---

## Database Information Summary

**Connection Details** (also in `.env`):
```
Host:     dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
Port:     25060
Database: naga_stall
User:     doadmin
Password: AVNS_hxkemfGwzsOdj4pbu35
SSL:      Required (Enabled)
```

**DigitalOcean Dashboard Links**:
- Main Database: https://cloud.digitalocean.com/databases/dbaas-db-2078449-do-user-29954926-0
- Trusted Sources: https://cloud.digitalocean.com/databases/dbaas-db-2078449-do-user-29954926-0/settings

**Production Server**:
- Domain: http://digi-stall.com
- IP: 68.183.154.125
- Location: NYC3 (DigitalOcean)

---

## Getting Help

### 1. Check Documentation
- **This guide**: `docs/TEAM_DATABASE_SETUP.md`
- **Detailed database setup**: `docs/DATABASE_SETUP.md`
- **Project README**: `README.md`
- **Environment variables**: `.env.example`

### 2. Test Connection
```bash
npm run db:test
```
This will show helpful error messages and troubleshooting hints.

### 3. Contact Team Lead
If you still can't connect after following this guide:
1. Share the error message from `npm run db:test`
2. Confirm your public IP address
3. Screenshot your DigitalOcean Trusted Sources page
4. Mention which step you're stuck on

### 4. Common Questions

**Q: Do I need to do this every time I clone the repo?**
A: No, only once per machine/location. Once your IP is whitelisted, it stays whitelisted.

**Q: Can I use the same database credentials as the production server?**
A: Yes! We use the same DigitalOcean database for both development and production. This ensures consistency.

**Q: What if I don't have DigitalOcean access?**
A: Ask the team lead to:
1. Invite you to the DigitalOcean team
2. Or manually add your IP to Trusted Sources for you

**Q: Can I run a local database instead?**
A: Yes! If you prefer:
1. Install MySQL locally on port 3301
2. Run: `npm run db:local`
3. Import the database schema
4. This is useful for offline development

**Q: How do I know if I'm connected to the right database?**
A: Run `npm run db:switch` to see current configuration, or check `.env` file.

---

## Checklist for New Team Members

Use this checklist to ensure you've completed all steps:

- [ ] Cloned the DigiStall repository
- [ ] Installed Node.js and npm
- [ ] Ran `npm install`
- [ ] Copied `.env.example` to `.env`
- [ ] Found your public IP address
- [ ] Logged into DigitalOcean dashboard
- [ ] Added your IP to Trusted Sources with descriptive name
- [ ] Waited 1-2 minutes for changes to propagate
- [ ] Ran `npm run db:test` successfully (shows ✅ SUCCESS)
- [ ] (Optional) Set up MySQL Workbench connection
- [ ] (Optional) Tested MySQL Workbench connection
- [ ] Started the backend server with `npm start`
- [ ] Verified API is running on http://localhost:5000

---

## Changelog

### 2026-03-26 - v1.0 (Initial Release)
- Created team database access setup guide
- Added step-by-step instructions for IP whitelisting
- Added MySQL Workbench configuration
- Added troubleshooting section
- Added security best practices

---

**Welcome to the DigiStall team! If you have any questions or suggestions for improving this guide, please let the team lead know.**
