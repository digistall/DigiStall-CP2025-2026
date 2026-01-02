# Mobile Login and Dashboard Fix Summary

## Date: January 2, 2026

## Problems Fixed

### 1. ❌ "Unknown column 'i.password_hash' in 'field list'" Error
**Cause:** The `inspector` table has two password columns: `password` (legacy SHA256) and `password_hash` (bcrypt). The query was only selecting `password_hash` which might be empty for some records.

**Fix:** Updated `mobileStaffAuthController.js` to use `COALESCE(NULLIF(i.password_hash, ''), i.password)` to get the password from either column.

### 2. ❌ "Unknown column 'c.applicant_email' in 'field list'" Error
**Cause:** The `credential` table does NOT have an `applicant_email` column. The email is stored in the `applicant` table.

**Fix:** Removed the reference to `c.applicant_email` from the fallback SQL query in `loginController.js`.

### 3. ❌ Collation Conflict Errors
**Cause:** Tables/columns were using different collations (`utf8mb4_general_ci` vs `utf8mb4_0900_ai_ci`).

**Fix:** Added `COLLATE utf8mb4_general_ci` to all string comparisons in SQL queries and created SQL migration to standardize collation across all relevant tables.

### 4. ❌ Dashboard Not Showing Correct Online Status
**Cause:** The `staff_session` table wasn't being properly queried, and the `last_logout` column might be missing from collector/inspector tables.

**Fix:** 
- SQL migration adds `last_logout` column to collector and inspector tables if missing
- SQL migration updates stored procedures to include `last_login` and `last_logout` in all queries
- Updated `getActiveSessions` function to properly return staff sessions with correct `user_id` and `user_type` mapping

### 5. ❌ Bcrypt Password Comparison Returning False
**Cause:** For inspectors, the password might be stored in the legacy `password` column (SHA256) instead of `password_hash` (bcrypt).

**Fix:** Added fallback password verification that checks both bcrypt and SHA256 hashes, plus plain text comparison for emergency cases.

## Files Modified

### Backend Code Changes:

1. **`Backend/Backend-Mobile/controllers/mobileStaffAuthController.js`**
   - Fixed inspector query to use `COALESCE(NULLIF(i.password_hash, ''), i.password)` for password field
   - This handles both legacy and new password storage formats

2. **`Backend/Backend-Mobile/controllers/login/loginController.js`**
   - Removed reference to non-existent `c.applicant_email` column
   - Updated debug logging to not reference removed field

### Database Migration Created:

3. **`database/FIX_MOBILE_LOGIN_AND_DASHBOARD.sql`**
   - Adds `last_logout` column to `collector` and `inspector` tables
   - Creates/recreates `staff_session` and `employee_session` tables
   - Creates/recreates `staff_activity_log` table
   - Fixes collation for all relevant tables (collector, inspector, credential, applicant, etc.)
   - Creates/updates stored procedures:
     - `sp_getCredentialWithApplicant` - Fixed to not reference non-existent columns
     - `sp_logStaffActivity` - For activity logging
     - `sp_updateInspectorLastLogout` / `sp_updateCollectorLastLogout` - For logout tracking
     - `sp_resetInspectorPassword` / `sp_resetCollectorPassword` - For password reset
     - `sp_getCollectorsAll` / `sp_getCollectorsByBranch` - Updated with collation fix
     - `sp_getInspectorsAll` / `sp_getInspectorsByBranch` - Updated with collation fix
   - Clears stale sessions older than 24 hours

## How to Apply Fixes

### Step 1: Apply Database Migration
Run the SQL migration script on your database:

```sql
-- Using MySQL Workbench or command line:
SOURCE /path/to/FIX_MOBILE_LOGIN_AND_DASHBOARD.sql;

-- Or execute the file contents directly
mysql -u root -p naga_stall < database/FIX_MOBILE_LOGIN_AND_DASHBOARD.sql
```

### Step 2: Restart Backend Servers
The code changes will take effect when you restart the backend servers:

```powershell
cd Backend
npm run dev
# Or restart your Node.js process
```

### Step 3: Test Mobile Login
1. Open the mobile app
2. Try logging in with a Collector account (e.g., COL6806)
3. Try logging in with an Inspector account
4. Try logging in with a Stallholder account (e.g., 25-39683)

### Step 4: Verify Dashboard
1. Log in as Collector/Inspector on mobile
2. Check the web dashboard "Active Employees" section
3. The employee should show as "ONLINE" with correct last activity time

## Expected Results After Fix

- ✅ Collector, Inspector, and Stallholder can log in on mobile
- ✅ No SQL column errors in backend logs
- ✅ No collation errors
- ✅ Dashboard "Active Employees" updates correctly when mobile staff logs in
- ✅ Login/logout time is accurate in Philippine timezone
- ✅ Online status reflects correctly (green = online, gray = offline)

## Troubleshooting

### If login still fails with bcrypt comparison error:
The password may have been changed. Try resetting the password:

```sql
-- For collector:
UPDATE collector 
SET password_hash = '$2a$12$hereIsANewBcryptHash' 
WHERE username = 'COL6806';

-- Or use the password reset API endpoint
```

### If dashboard still doesn't show online status:
1. Check if the `staff_session` table has records after mobile login
2. Verify the mobile login creates a session:
```sql
SELECT * FROM staff_session ORDER BY login_time DESC LIMIT 5;
```

### If collation errors persist:
Run these commands to fix connection-level collation:
```sql
SET NAMES utf8mb4 COLLATE utf8mb4_general_ci;
SET CHARACTER SET utf8mb4;
```
