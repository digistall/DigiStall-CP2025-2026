# DigitalOcean Database Connection Troubleshooting

## Error: "connect ETIMEDOUT"

This error means your backend cannot connect to the DigitalOcean database. Here are the steps to fix it:

## Step 1: Check DigitalOcean Trusted Sources

1. **Login to DigitalOcean**
   - Go to https://cloud.digitalocean.com/

2. **Navigate to your Database**
   - Click "Databases" in left sidebar
   - Select your database: `dbaas-db-2078449-do-user-29954926-0`

3. **Add Trusted Sources**
   - Go to "Settings" tab
   - Scroll to "Trusted Sources"
   - Click "Edit"
   - Add one of these options:

   **Option A: Allow your current IP (Recommended for development)**
   - Your current IP will be shown
   - Click "Allow my IP"
   
   **Option B: Allow all IPs (NOT recommended for production)**
   - Add: `0.0.0.0/0`
   - ⚠️ Only for testing! Remove this later!

   **Option C: Add specific IP ranges**
   - Add your office/home IP range
   - Add your deployment server IP

4. **Save Changes**

## Step 2: Test Connection from Command Line

### Using MySQL Client (if installed):
```bash
mysql -h dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com \
      -P 25060 \
      -u doadmin \
      -p \
      --ssl-mode=REQUIRED \
      naga_stall
```
Password: `AVNS_hxkemfGwzsOdj4pbu35`

### Using curl to test connectivity:
```bash
curl -v telnet://dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com:25060
```

## Step 3: Verify Database Status

1. In DigitalOcean dashboard
2. Check database status is "online" (green)
3. Check "Connection Details" tab for correct credentials

## Step 4: Check Network Issues

### Test DNS resolution:
```bash
nslookup dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
```

### Test connectivity:
```bash
ping dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
```

### Test port:
```powershell
Test-NetConnection -ComputerName dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -Port 25060
```

## Step 5: Temporary Local Database (For Development)

If you can't connect to DigitalOcean right now, switch to local database:

### Edit `.env` file:
```env
# Comment out DigitalOcean
# DB_HOST=dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
# DB_PORT=25060
# DB_NAME=naga_stall
# DB_USER=doadmin
# DB_PASSWORD=AVNS_hxkemfGwzsOdj4pbu35
# DB_SSL=true

# Use local database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=naga_stall
DB_USER=root
DB_PASSWORD=
DB_SSL=false
```

### Start local MySQL:
```bash
# Make sure MySQL/XAMPP is running locally
# Then restart the backend server
```

## Step 6: Common Issues

### Issue: "Access Denied"
- Check username/password in `.env`
- Verify credentials in DigitalOcean dashboard

### Issue: "Unknown Database"
- Database name might be wrong
- Check "Connection Details" in DigitalOcean

### Issue: Connection works sometimes
- Connection pool exhausted
- Reduce `DB_CONNECTION_LIMIT` in `.env`

### Issue: Very slow queries
- Database in different region
- Consider using DigitalOcean VPC
- Check query optimization

## Step 7: Production Checklist

Before deploying to production:

- [ ] Add only necessary IPs to trusted sources
- [ ] Remove `0.0.0.0/0` if used for testing
- [ ] Use strong passwords
- [ ] Enable SSL/TLS
- [ ] Set up database backups
- [ ] Configure monitoring alerts
- [ ] Use environment-specific `.env` files
- [ ] Never commit `.env` to git

## Quick Fix Summary

**Most Common Solution**:
1. Go to DigitalOcean → Databases → Your Database
2. Settings → Trusted Sources → Edit
3. Click "Allow my IP" button
4. Save
5. Restart your backend server
6. Try again

**Verify it worked**:
```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Server and database are healthy",
  ...
}
```

---

## Need Help?

If none of these work:
1. Check DigitalOcean status page
2. Contact DigitalOcean support
3. Review firewall logs
4. Check VPN/proxy settings
5. Try from different network

**Support Contact**: support@digitalocean.com
