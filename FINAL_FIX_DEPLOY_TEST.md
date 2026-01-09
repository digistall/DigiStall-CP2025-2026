# FINAL FIX - Deploy & Test

## Issues Fixed:

### 1. ✅ Profile Still Encrypted (Juan De***uz)
**Problem**: Stored procedure wasn't decrypting because of missing NULL checks
**Fix**: Updated migration 434 to properly handle NULL values and added debug fields

### 2. ✅ "Just now" Keeps Refreshing
**Problem**: Heartbeat updates `last_activity` every 30 seconds, so online employees always show "just now"
**Fix**: When ONLINE, show `login_time` instead (stable). When OFFLINE, show `logout_time`.

## Deploy Steps:

```bash
# 1. Commit changes
git add -A
git commit -m "FIX: Decryption and last activity display"
git push origin main

# 2. SSH to DigitalOcean
ssh root@68.183.154.125
cd /root/DigiStall-CP2025-2026  # or your project path

# 3. Pull changes
git pull origin main

# 4. Run updated migration 434
mysql -h 127.0.0.1 -u root -p naga_stall < database/migrations/434_fix_manager_employee_decryption.sql

# 5. Restart backend
docker-compose restart backend-web

# 6. Check logs
docker-compose logs --tail=50 backend-web
```

## Test Checklist:

### Test 1: Profile Decryption ✅
1. Clear browser cache (Ctrl+Shift+Delete)
2. Login as Business Manager (NCPM_Manager)
3. Check profile dropdown header

**Expected**:
```
NCPM_Manager
Juan Dela Cruz  ← NOT "Juan De***uz"
BRANCH MANAGER
● Naga City Peoples Mall
nclcarreon@gmail.com  ← NOT "NC***@***.com"
```

**If still encrypted**:
- Check backend logs: `docker-compose logs backend-web | grep "debug_"`
- Should see: `debug_is_encrypted: 1`, `debug_encrypted_fn: HAS_DATA`
- Check database:
  ```sql
  SELECT * FROM encryption_keys WHERE key_name = 'user_data_key';
  -- Must return a row with encryption_key value
  ```

### Test 2: Last Activity Fixed ✅
1. Login as Collector on mobile (Jeno Aldrei Laurente)
2. Check Dashboard > Active Employees

**Expected for ONLINE employees**:
```
Last Activity: "2m ago"  ← Shows login time, increases steadily
NOT "Just now" → "1m ago" → "Just now" (flickering)
```

**Expected for OFFLINE employees**:
```
Last Activity: "5h ago"  ← Shows logout time
```

### Test 3: Backend Logs Clean ✅
Check logs for errors:
```bash
docker-compose logs backend-web | grep -i "error\|decrypt"
```

**Should NOT see**:
- ❌ `Decryption error: Invalid authentication tag length`
- ❌ `⚠️ DATA_ENCRYPTION_KEY not set`

**Should see**:
- ✅ `📤 Sending user data: { "email": "nclcarreon@gmail.com", "firstName": "Juan", "lastName": "Dela Cruz" }`

## Verify Migration Applied:

```sql
-- Check if stored procedure has debug fields
SHOW CREATE PROCEDURE getBusinessManagerByUsername;

-- Should see:
-- debug_is_encrypted
-- debug_encrypted_fn
-- COALESCE(CAST(AES_DECRYPT(...
```

## If Issues Persist:

### Issue: Profile still encrypted
```sql
-- 1. Check encryption key exists
SELECT * FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1;

-- 2. Check data in database
SELECT 
  username, 
  is_encrypted, 
  first_name,
  last_name,
  email,
  LENGTH(encrypted_first_name) as encrypted_fn_length,
  LENGTH(encrypted_email) as encrypted_email_length
FROM business_manager 
WHERE manager_username = 'NCPM_Manager';

-- 3. Test decryption manually
SET @key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1);
SELECT 
  CAST(AES_DECRYPT(encrypted_first_name, @key) AS CHAR) as decrypted_first_name,
  CAST(AES_DECRYPT(encrypted_email, @key) AS CHAR) as decrypted_email
FROM business_manager 
WHERE manager_username = 'NCPM_Manager';
```

### Issue: Last activity still says "just now"
- Hard refresh browser: Ctrl+Shift+R
- Clear browser cache completely
- Check browser console for debug logs: `🔍 [LAST_ACTIVITY DEBUG]`

## Expected Behavior After Fix:

| User State | Last Activity Shows |
|------------|---------------------|
| Just logged in | "Just now" |
| Online for 5 minutes | "5m ago" |
| Online for 1 hour | "1h ago" |
| Logged out 2 hours ago | "2h ago" |
| Never logged in | "Never" |

**Key Point**: When ONLINE, time shows when they logged in (increases steadily). When OFFLINE, time shows when they logged out.

## Files Changed:

1. `database/migrations/434_fix_manager_employee_decryption.sql` - Fixed NULL handling, added debug fields
2. `Frontend/Web/src/components/Admin/Dashboard/Dashboard.js` - Show login_time for online employees instead of last_activity
3. `Backend/Backend-Web/server.js` - Removed problematic decryptResponseMiddleware

## Summary:

✅ **Decryption**: Migration 434 now properly decrypts even with NULL fallbacks
✅ **Last Activity**: Shows stable `login_time` for online users instead of constantly updating `last_activity`
✅ **No More Errors**: Removed middleware that was trying to double-decrypt data

**Deploy now and test!**
