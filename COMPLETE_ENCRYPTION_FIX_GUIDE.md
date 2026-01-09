# 🔧 COMPLETE FIX FOR ENCRYPTED DATA DISPLAY ISSUES

## 📋 Issues Identified

1. **Mobile app showing masked names**: "Jo***as La***te" instead of "Jonas Laurente"
2. **Sidebar showing masked data**: Inspector/Collector profile shows encrypted data
3. **Compliance.js had duplicate mounted() hooks** ✅ FIXED
4. **Inspector table missing `encrypted_phone` column data** - NULL values
5. **Collector table has `encrypted_phone` as NULL**
6. **Stored procedures not updated** - Still returning masked data from plain columns

## 🔍 Root Cause Analysis

The encrypted data EXISTS in `encrypted_first_name`, `encrypted_last_name`, `encrypted_email` as BLOBs (binary data). However:

1. **Old stored procedures** are returning the MASKED data from `first_name`, `last_name`, `email` columns
2. **Migration 432 not run yet** - Updated procedures not in database
3. **`encrypted_phone` column is NULL** - Needs to be populated from `contact_no`

## ✅ Files Fixed

1. ✅ **Compliance.js** - Removed duplicate `mounted()` hook
2. ✅ **Migration 432** - Added `encrypted_phone` for inspector table
3. ✅ **Migration 432** - Updated all stored procedures to decrypt and return real names

## 📝 Step-by-Step Fix Instructions

### STEP 1: Check Current Encryption Status (Optional but Recommended)

This will help verify that the encrypted data is good before running the migration.

1. Open MySQL Workbench
2. Connect to `naga_stall` database  
3. Open and run: `database/CHECK_AND_FIX_ENCRYPTION_DATA.sql`
4. **Check the output**:
   - `decrypted_first_name` should show "Jonas" (not "Jo***as")
   - `decrypted_last_name` should show "Laurente" (not "La***te")
   - `decrypted_email` should show full email (not "jo***@***.com")

**If the decrypted values show correctly**, the encrypted data is good! Proceed to Step 2.

**If the decrypted values are still masked**, we have a bigger problem - the encrypted BLOBs contain masked data. Contact support.

---

### STEP 2: Run Migration 432

This migration will:
- Add missing `encrypted_phone` columns
- Populate `encrypted_phone` with encrypted data from `contact_no`
- Update all stored procedures to decrypt and return real names
- Set `is_encrypted = 0` in returned data to prevent Node.js double-decryption

1. In MySQL Workbench, open: `database/migrations/432_fix_all_encryption_issues.sql`
2. Execute the entire script (Ctrl+Shift+Enter or click ⚡ Execute button)
3. **Watch the output** - You should see:
   ```
   ✅ Checking inspector table encryption status...
   ✅ Checking collector table encryption status...
   ✅ Migration 432 complete! All encryption issues fixed.
   ```

4. **Verify the procedures were created**:
   ```sql
   SHOW PROCEDURE STATUS WHERE Db = 'naga_stall';
   ```
   You should see:
   - `sp_getInspectorByUsername`
   - `sp_getCollectorByUsername`
   - `sp_getInspectorsAllDecrypted`
   - `sp_getCollectorsAllDecrypted`
   - `getAllComplianceRecordsDecrypted`

---

### STEP 3: Restart Backend Servers

The stored procedure changes won't take effect until the backend servers restart.

1. **Stop all servers** (if running):
   - Press Ctrl+C in the PowerShell terminal
   - Or close the terminal window

2. **Restart with Start-all.ps1**:
   ```powershell
   cd C:\Users\Jeno\DigiStall-CP2025-2026
   .\Start-all.ps1
   ```

3. **Wait for all servers to start**:
   - Backend-Web should start on port 3001
   - Backend-Mobile should start on port 5000
   - Look for "Server running on port..." messages

---

### STEP 4: Clear Mobile App Cache and Re-login

The mobile app caches the user data, so you need to log out and log back in.

1. **In the mobile app**:
   - Tap the sidebar menu
   - Tap "Sign Out"

2. **Log back in** with inspector/collector credentials:
   - Username: `CGJona` (or other inspector/collector)
   - Password: (your password)

3. **Check the LoadingScreen**:
   - Should show: "Welcome! Jonas Laurente" 
   - NOT: "Welcome! Jo***as La***te"

4. **Check the Sidebar**:
   - Name should show: "Jonas Laurente"
   - Email should show full email (not masked)
   - NOT: "Jo***as La***te" or "jo***@***.com"

---

### STEP 5: Test Web Compliance Page

1. **Open web browser**: http://localhost:8080 (or your web URL)
2. **Login as admin**
3. **Navigate to**: Admin → Compliances
4. **Check**:
   - ✅ Page loads without 500 error
   - ✅ Inspector names show as "Jonas Laurente" (not masked)
   - ✅ Stallholder names are decrypted
   - ✅ Email addresses are decrypted

---

### STEP 6: Test Employee Management Page

1. **Navigate to**: Admin → Employee Management
2. **Check Inspector tab**:
   - Email column should show full email addresses (not masked)
   - Names should be fully decrypted
3. **Check Collector tab**:
   - Same as above

---

## 🔍 How the Fix Works

### Before Migration:
```
Database: encrypted_first_name = BLOB (contains "Jonas")
Database: first_name = "Jo***as" (masked)
Stored Procedure: Returns first_name → "Jo***as"
Mobile App: Displays "Jo***as" ❌
```

### After Migration:
```
Database: encrypted_first_name = BLOB (contains "Jonas")
Database: first_name = "Jo***as" (masked, ignored)
Stored Procedure: Decrypts encrypted_first_name → "Jonas"
Stored Procedure: Returns "Jonas" as first_name, is_encrypted = 0
Node.js: Sees is_encrypted = 0, returns "Jonas" as-is
Mobile App: Displays "Jonas" ✅
```

### Key Changes in Stored Procedures:

1. **Decryption happens in MySQL**:
   ```sql
   CAST(AES_DECRYPT(encrypted_first_name, v_key) AS CHAR(100)) as first_name
   ```

2. **Returns decrypted value in the same column name**:
   - Returns as `first_name` (not `decrypted_first_name`)
   - This maintains compatibility with existing mobile/web code

3. **Sets is_encrypted = 0**:
   ```sql
   0 as is_encrypted  -- Prevents Node.js from trying to decrypt again
   ```

4. **Node.js decryptStaffData() checks**:
   ```javascript
   if (!isEncrypted && !hasEncryptedFields) {
     return staffData; // Returns as-is
   }
   ```

---

## 🐛 Troubleshooting

### Issue: Mobile still shows "Jo***as" after all steps

**Solution:**
1. Make sure you logged OUT and back IN (not just refreshed)
2. Clear app cache:
   - Android: Settings → Apps → DigiStall → Clear Cache
   - iOS: Uninstall and reinstall
3. Check backend logs for decryption errors

### Issue: Compliance page still shows 500 error

**Solution:**
1. Check backend-web logs for errors
2. Verify `getAllComplianceRecordsDecrypted` procedure exists:
   ```sql
   SHOW CREATE PROCEDURE getAllComplianceRecordsDecrypted;
   ```
3. Check if `violation_report` table has required columns

### Issue: Decrypted names are wrong (gibberish)

**Solution:**
1. Encryption key mismatch - check encryption_keys table:
   ```sql
   SELECT * FROM encryption_keys WHERE key_name = 'user_data_key';
   ```
2. Make sure `is_active = 1`

### Issue: Some fields decrypted, others not

**Solution:**
1. Check which `encrypted_*` columns have NULL:
   ```sql
   SELECT * FROM inspector WHERE encrypted_email IS NULL;
   ```
2. Re-run migration 432 to populate NULL encrypted columns

---

## ✅ Expected Results After Fix

### Mobile App:
- ✅ LoadingScreen shows: "Welcome! Jonas Laurente"
- ✅ Sidebar shows: "Jonas Laurente" and full email
- ✅ All inspector/collector names fully decrypted

### Web App:
- ✅ Compliance page loads without errors
- ✅ Inspector names show fully: "Jonas Laurente"
- ✅ Employee Management shows decrypted emails
- ✅ All sensitive data properly decrypted for display

### Database:
- ✅ `encrypted_phone` populated for both inspector and collector
- ✅ All `encrypted_*` columns have BLOB data
- ✅ Stored procedures return decrypted values
- ✅ `is_encrypted` flag set correctly

---

## 📞 Support

If issues persist after following all steps:

1. **Check backend logs** for decryption errors
2. **Run diagnostic script** again: `CHECK_AND_FIX_ENCRYPTION_DATA.sql`
3. **Verify stored procedures** were updated (check LAST_ALTERED timestamp)
4. **Share error logs** for further debugging

---

**Created:** January 9, 2026  
**Migration:** 432_fix_all_encryption_issues.sql  
**Status:** Ready to deploy
