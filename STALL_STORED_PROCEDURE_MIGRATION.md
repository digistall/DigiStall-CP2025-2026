# Complete Stored Procedure Migration for Stall CRUD

## Overview
This migration converts all stall CRUD operations to use stored procedures exclusively, with NO SQL queries in the controller code - exactly like the applicants example.

## Files Created

### 1. Database Stored Procedures
**File:** `database/migrations/stall_procedures_complete.sql`

This file contains 5 complete stored procedures that handle ALL business logic:
- `sp_addStall_complete` - Handles authorization, validation, duplicate checks, branch verification, and insertion
- `sp_updateStall_complete` - Handles authorization, validation, and updates
- `sp_deleteStall_complete` - Handles authorization and safe deletion with constraint checks
- `sp_getAllStalls_complete` - Handles authorization and returns stalls based on user type/branch
- `sp_getStallById_complete` - Handles authorization and returns single stall

### 2. Simplified Controller Files
All controller files now just call stored procedures without any SQL queries:
- `addStall.js` - Already updated ✅
- `updateStall_new.js` - New simplified version
- `deleteStall_new.js` - New simplified version
- `getAllStalls_new.js` - New simplified version
- `getStallById_new.js` - New simplified version

## Migration Steps

### Step 1: Apply Database Changes
Run the stored procedures in your MySQL database:

```sql
SOURCE c:/Users/Jeno/DigiStall-CP2025-2026/database/migrations/stall_procedures_complete.sql
```

Or manually execute the SQL file in MySQL Workbench or phpMyAdmin.

### Step 2: Backup Current Controllers (Optional)
```powershell
cd c:\Users\Jeno\DigiStall-CP2025-2026\Backend\Backend-Web\controllers\stalls\stallComponents
Copy-Item updateStall.js updateStall_backup.js
Copy-Item deleteStall.js deleteStall_backup.js
Copy-Item getAllStalls.js getAllStalls_backup.js
Copy-Item getStallById.js getStallById_backup.js
```

### Step 3: Replace Controller Files
```powershell
cd c:\Users\Jeno\DigiStall-CP2025-2026\Backend\Backend-Web\controllers\stalls\stallComponents

# Replace with new simplified versions
Move-Item -Force updateStall_new.js updateStall.js
Move-Item -Force deleteStall_new.js deleteStall.js
Move-Item -Force getAllStalls_new.js getAllStalls.js
Move-Item -Force getStallById_new.js getStallById.js
```

### Step 4: Restart Backend Server
```powershell
cd c:\Users\Jeno\DigiStall-CP2025-2026\Backend\Backend-Web
npm start
```

## What Changed

### Before (Mixed Approach)
Controllers had:
- ❌ SQL queries for authorization checks
- ❌ SQL queries for branch validation
- ❌ SQL queries for duplicate checks
- ❌ SQL queries for fetching data
- ✅ Stored procedure calls for insert/update/delete

### After (Pure Stored Procedure Approach)
Controllers now have:
- ✅ Only stored procedure calls
- ✅ No SQL queries whatsoever
- ✅ All business logic in database
- ✅ Consistent with applicants pattern

## Example: How It Works Now

### Example 1: Add Stall
```javascript
// OLD (200+ lines with SQL queries)
// Check permissions...
// Query branch info...
// Validate floor/section...
// Check duplicates...
// Call stored procedure...
// Query updated data...

// NEW (just 90 lines)
const [result] = await connection.execute(
  `CALL sp_addStall_complete(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @stall_id, @success, @message)`,
  [stallNo, location, size, floor_id, section_id, price, priceType, status, stamp, description, image, is_available, deadline, userId, userType, branchId]
);
const [outParams] = await connection.execute(
  `SELECT @stall_id as stall_id, @success as success, @message as message`
);
```

### Example 2: Get All Stalls
```javascript
// OLD (150+ lines with complex SQL)
// Check user type...
// Build different queries...
// Execute different SQL based on role...

// NEW (just 50 lines)
const [result] = await connection.execute(
  `CALL sp_getAllStalls_complete(?, ?, ?)`,
  [userId, userType, branchId]
);
const stalls = result[0] || [];
```

## Benefits

1. **Consistency** - Exactly like applicants CRUD
2. **Maintainability** - Business logic in one place (database)
3. **Performance** - Stored procedures are compiled and optimized
4. **Security** - Authorization logic in database, not exposed in code
5. **Simplicity** - Controllers are now clean and easy to understand

## Stored Procedure Features

Each stored procedure handles:
- ✅ User type verification (business_manager, business_employee)
- ✅ Branch authorization checks
- ✅ Data validation (duplicates, foreign keys, etc.)
- ✅ Transaction management (COMMIT/ROLLBACK)
- ✅ Detailed error messages
- ✅ Success/failure indicators

## Testing After Migration

Test all operations:
1. ✅ Add stall (Fixed Price, Raffle, Auction)
2. ✅ Update stall
3. ✅ Delete stall
4. ✅ Get all stalls
5. ✅ Get stall by ID

Test with different user types:
- ✅ business_manager
- ✅ business_employee (with stalls permission)
- ✅ Unauthorized users should get appropriate errors

## Rollback (if needed)

If you need to rollback:
```powershell
cd c:\Users\Jeno\DigiStall-CP2025-2026\Backend\Backend-Web\controllers\stalls\stallComponents

# Restore from backups
Copy-Item -Force updateStall_backup.js updateStall.js
Copy-Item -Force deleteStall_backup.js deleteStall.js
Copy-Item -Force getAllStalls_backup.js getAllStalls.js
Copy-Item -Force getStallById_backup.js getStallById.js
```

## Verification

After applying changes, verify:
1. No SQL queries in controller files ✅
2. All operations use stored procedures ✅
3. Authorization handled in database ✅
4. Consistent pattern across all CRUD operations ✅
5. Same simple pattern as applicants ✅
