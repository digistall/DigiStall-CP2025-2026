# Database Restore Guide

This guide will help you restore the database to a clean state before the encryption changes caused issues.

## Background

The database got corrupted due to multiple encryption/decryption migration scripts that were applied incorrectly. This restoration removes all encryption-related changes and returns the database to a working state.

## What Was Changed

### 1. Database Migrations Removed
The following 40 encryption/decryption migration files were removed from `database/migrations/`:
- All files containing "encrypt" or "decrypt" in their names
- `099_update_columns_for_encryption.sql`
- `100_decrypt_masked_data.sql`
- Files numbered 404-531 that dealt with encryption

### 2. Backend Encryption Service Disabled
The encryption service in both backends was modified to be a "pass-through":
- `Backend/Backend-Web/services/encryptionService.js`
- `Backend/Backend-Mobile/services/encryptionService.js`

Now these services:
- `encryptData()` - Returns data unchanged (no encryption)
- `decryptData()` - Returns data unchanged (will try to decrypt legacy encrypted data)

### 3. New SQL Scripts Created
Two SQL scripts were created to restore the database:

1. **`RESTORE_DATABASE_CLEAN.sql`** - Main restore script
   - Drops all encryption-related stored procedures
   - Attempts to remove `is_encrypted` columns
   - Restores clean versions of critical stored procedures

2. **`RESET_INSPECTOR_COLLECTOR_PASSWORDS.sql`** - Password reset script
   - Resets all inspector passwords to `password123`
   - Resets all collector passwords to `password123`

3. **`CLEAN_DATABASE_BACKUP.sql`** - Full database backup from before encryption
   - Contains the complete database schema and procedures from commit `0999742`

## How to Restore

### Step 1: Backup Current Database (Optional but Recommended)
```bash
mysqldump -u your_user -p naga_stall > backup_before_restore.sql
```

### Step 2: Run the Restore Script
In MySQL Workbench or command line:
```sql
SOURCE c:/Users/Jeno/DigiStall-CP2025-2026/database/RESTORE_DATABASE_CLEAN.sql;
```

Or in command line:
```bash
mysql -u your_user -p naga_stall < database/RESTORE_DATABASE_CLEAN.sql
```

### Step 3: Reset Passwords
```sql
SOURCE c:/Users/Jeno/DigiStall-CP2025-2026/database/RESET_INSPECTOR_COLLECTOR_PASSWORDS.sql;
```

### Step 4: Full Database Reset (If Needed)
If the above doesn't fix everything, you may need to drop and recreate the database:

```sql
DROP DATABASE naga_stall;
CREATE DATABASE naga_stall;
USE naga_stall;
SOURCE c:/Users/Jeno/DigiStall-CP2025-2026/database/CLEAN_DATABASE_BACKUP.sql;
```

**WARNING**: This will delete ALL data. Only do this if you have a data backup or don't need the existing data.

### Step 5: Restart Backend Servers
After running the restore scripts:
```bash
cd Backend
npm start
```

## Default Passwords After Reset
- All inspectors: `password123`
- All collectors: `password123`

**Important**: Ask users to change their passwords after the restore.

## Troubleshooting

### Login Issues
If inspectors/collectors still can't login:
1. Check their email is correct in the database
2. Verify password was reset correctly:
```sql
SELECT email, password = SHA2('password123', 256) as password_ok FROM inspector WHERE status = 'active';
```

### Data Display Issues
If names show as encrypted strings:
- The data may be corrupted. You may need to manually update the records.
- Or restore from a data backup if you have one.

### Stored Procedure Errors
If you get "procedure does not exist" errors:
- Run the migrations manually:
```bash
cd database/migrations
# Run needed migration files manually in MySQL
```

## Files Created/Modified

### Created:
- `database/RESTORE_DATABASE_CLEAN.sql` - Main restore script
- `database/RESET_INSPECTOR_COLLECTOR_PASSWORDS.sql` - Password reset script
- `database/CLEAN_DATABASE_BACKUP.sql` - Full database backup from clean commit
- `database/DATABASE_RESTORE_README.md` - This file

### Modified:
- `Backend/Backend-Web/services/encryptionService.js` - Disabled encryption
- `Backend/Backend-Mobile/services/encryptionService.js` - Disabled encryption

### Removed:
- 40 encryption/decryption migration files from `database/migrations/`
- 4 encryption-related SQL files from `database/`

## Recovery Point

The clean database state comes from commit `0999742`:
```
Merge pull request #66 from digistall/master
```

This was the last commit before any encryption was introduced.

## Need More Help?

If the restore scripts don't fully fix the issue:
1. Check the commit history for a working state
2. Use `git checkout <commit> -- database/` to restore specific files
3. Contact the development team for assistance
