# Complete Fix Guide - All Dashboard Issues

## 🚨 CRITICAL: You MUST Run the Database Migrations!

The migration files were created but **NOT EXECUTED** on your database. This is why the profile still shows encrypted data!

## Step 1: Execute Database Migrations ✅

### Option A: Using MySQL Workbench (Recommended)
1. Open MySQL Workbench
2. Connect to your database (`68.183.154.125`)
3. Open each migration file:
   - `database/migrations/433_fix_heartbeat_last_activity.sql`
   - `database/migrations/434_fix_manager_employee_decryption.sql`
4. Execute them one by one using the lightning bolt icon

### Option B: Using Command Line
```bash
# Navigate to project directory
cd c:\Users\Jeno\DigiStall-CP2025-2026

# Execute migrations
mysql -h 68.183.154.125 -u your_username -p naga_stall < database/migrations/433_fix_heartbeat_last_activity.sql
mysql -h 68.183.154.125 -u your_username -p naga_stall < database/migrations/434_fix_manager_employee_decryption.sql
```

### Verify Migrations Executed
After running the migrations, check if the stored procedures were updated:

```sql
-- Check if getBusinessManagerByUsername was updated
SHOW CREATE PROCEDURE getBusinessManagerByUsername;

-- Look for AES_DECRYPT in the output
-- You should see lines like:
-- CASE WHEN is_encrypted = 1 THEN AES_DECRYPT(encrypted_first_name, v_key) ELSE first_name END AS first_name
```

---

## Step 2: Restart Backend Servers

After migrations, restart your backend servers to clear any cached stored procedure definitions:

```powershell
# Stop all servers
docker-compose down

# Start all servers
docker-compose up -d

# Or if using Start-all.ps1
.\Start-all.ps1
```

---

## Step 3: Test the Fixes

### Test 1: Profile Data Decryption ✅
1. Logout and login as a Business Manager (e.g., "Juan Dela Cruz")
2. Check the profile header
3. **Expected Result**: Should show "Juan Dela Cruz" and "nclcarreon@gmail.com" (plain text)
4. **Previous Issue**: Was showing "Juan De***uz" and "NC***@***.com"

### Test 2: Last Activity for Web Employees ✅
1. Login as a Business Employee
2. Wait for the heartbeat to trigger (every 30 seconds)
3. Check the Dashboard > Employee table
4. **Expected Result**: Should show "just now", then "30s ago", "1m ago", etc.
5. **Previous Issue**: Was showing "N/A" or incorrect times

### Test 3: Last Activity for Mobile Staff ✅
1. Login on mobile app as Inspector or Collector
2. Check the Dashboard > Employee table on web
3. **Expected Result**: Should show "just now" or relative time like "2m ago"
4. **Previous Issue**: Was showing "Never"

### Test 4: Payment Trends ✅
1. Go to Dashboard
2. Check the Payment Trends chart
3. **Expected Result**: Chart should load without errors
4. **Previous Issue**: Was showing "RangeError: Invalid time value"

---

## What Was Fixed?

### Issue 1: Encrypted Profile Data (Juan De***uz)
**Root Cause**: Database has encrypted BLOB data in `encrypted_first_name`, `encrypted_last_name`, `encrypted_email` columns, but the stored procedures `getBusinessManagerByUsername` and `getBusinessEmployeeByUsername` were NOT decrypting this data when returning it.

**Fix**: Migration 434 updates these stored procedures to use `AES_DECRYPT()`:
```sql
CASE 
  WHEN is_encrypted = 1 THEN AES_DECRYPT(encrypted_first_name, v_key)
  ELSE first_name 
END AS first_name
```

### Issue 2: Last Activity "N/A" or Wrong Times
**Root Cause**: The `sp_heartbeatBusinessEmployee` stored procedure was only updating `business_employee.last_login` but not updating `employee_session.last_activity`.

**Fix**: Migration 433 updates the heartbeat to maintain both:
```sql
UPDATE business_employee SET last_login = NOW() WHERE employee_id = p_employee_id;
UPDATE employee_session SET last_activity = NOW() WHERE employee_id = p_employee_id AND logout_time IS NULL;
```

### Issue 3: Mobile Staff "Never" Last Activity
**Root Cause**: Mobile staff (`inspector`, `collector`) login creates `staff_session` correctly with `login_time` and `last_activity` set to `NOW()`, BUT they don't have a `last_login` column in their tables. The Dashboard was only checking `employee.last_login` and not falling back to `session.login_time`.

**Fix**: Dashboard.js already updated to use `session.login_time` as fallback:
```javascript
const lastActivity = employee.last_activity || 
                    employee.last_login || 
                    employee.login_time ||
                    session?.login_time ||
                    session?.last_activity
```

### Issue 4: Payment Trends Error
**Root Cause**: Some payment records have `NULL` or invalid dates, causing `new Date(paymentDate).toISOString()` to throw "Invalid time value" error.

**Fix**: Added try-catch and null check:
```javascript
if (paymentDate) {
  try {
    const dateKey = new Date(paymentDate).toISOString().split('T')[0]
    if (dailyTotals.hasOwnProperty(dateKey)) {
      dailyTotals[dateKey] += parseFloat(payment.amountPaid) || 0
    }
  } catch (dateError) {
    console.warn('⚠️ Invalid payment date:', paymentDate)
  }
}
```

---

## Troubleshooting

### If Profile Still Shows Encrypted Data After Migration:
1. **Verify migrations executed**: 
   ```sql
   SHOW CREATE PROCEDURE getBusinessManagerByUsername;
   ```
   Look for `AES_DECRYPT` in the output.

2. **Check encryption key exists**:
   ```sql
   SELECT * FROM encryption_keys LIMIT 1;
   ```
   Should return a row with `user_data_key`.

3. **Check data is actually encrypted**:
   ```sql
   SELECT username, is_encrypted, 
          encrypted_first_name, 
          first_name
   FROM business_manager 
   WHERE username = 'businessmanager';
   ```
   If `is_encrypted = 1`, `encrypted_first_name` should have BLOB data, and `first_name` might be NULL or masked.

4. **Restart backend servers** after migration.

### If Last Activity Still Shows "N/A":
1. **Check session exists**:
   ```sql
   SELECT * FROM employee_session 
   WHERE employee_id = (SELECT employee_id FROM business_employee WHERE username = 'youremployee')
   AND logout_time IS NULL;
   ```

2. **Check heartbeat is running**: Open browser console, should see heartbeat requests every 30 seconds.

3. **Clear browser cache** and re-login.

### If Mobile Staff Still Shows "Never":
1. **Check staff_session created**:
   ```sql
   SELECT * FROM staff_session 
   WHERE staff_id = 3 
   AND is_active = 1 
   ORDER BY login_time DESC 
   LIMIT 1;
   ```
   Should show `login_time` and `last_activity` with recent timestamps.

2. **Check Dashboard API**: Open browser DevTools > Network tab, refresh Dashboard, check the `/employees/sessions/active` response. Should include mobile staff sessions.

---

## Summary Checklist

- [ ] Run migration 433 on database
- [ ] Run migration 434 on database
- [ ] Restart backend servers (docker-compose restart)
- [ ] Clear browser cache
- [ ] Test manager login - profile should show plain text names
- [ ] Test employee login - last activity should update correctly
- [ ] Test mobile staff login - should show in dashboard with correct time
- [ ] Check payment trends - no errors

---

## If Issues Persist

If after following all steps the issues still persist, check:

1. **Backend logs**: `docker-compose logs backend-web` and `docker-compose logs backend-mobile`
2. **Database connection**: Ensure backend can connect to `68.183.154.125`
3. **Migration errors**: Check if migrations had any SQL syntax errors
4. **Browser console**: Check for JavaScript errors in browser DevTools

---

## Files Modified in This Fix

1. `database/migrations/433_fix_heartbeat_last_activity.sql` - Heartbeat updates session
2. `database/migrations/434_fix_manager_employee_decryption.sql` - Decrypts profile data
3. `Backend/Backend-Web/server.js` - Added decryption middleware
4. `Frontend/Web/src/components/Admin/Dashboard/Dashboard.js` - Fixed last activity display and payment trends error

---

**Remember**: The key step is **Step 1 - Execute the migrations!** Without running the migrations on the database, the stored procedures remain unchanged and will continue to return encrypted data.
