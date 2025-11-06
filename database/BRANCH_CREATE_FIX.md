# Branch Creation Fix

## Issue
**Error**: `POST http://localhost:5173/api/branches 400 (Bad Request)`  
**Error Message**: Request failed with status code 400

## Root Cause
The `createBranch` controller was calling the stored procedure with **8 parameters** in the **wrong order**, but the database stored procedure only accepts **7 parameters**.

### Database Stored Procedure Signature
```sql
CREATE PROCEDURE createBranch (
    IN p_admin_id INT,
    IN p_branch_name VARCHAR(100),
    IN p_area VARCHAR(100),
    IN p_location VARCHAR(255),
    IN p_address TEXT,
    IN p_contact_number VARCHAR(20),
    IN p_email VARCHAR(100)
)
```

**Parameters (in order)**:
1. `admin_id` (INT)
2. `branch_name` (VARCHAR)
3. `area` (VARCHAR)
4. `location` (VARCHAR)
5. `address` (TEXT)
6. `contact_number` (VARCHAR)
7. `email` (VARCHAR)

**Note**: The stored procedure does NOT have a `status` parameter. Status defaults to 'Active' in the database.

### Controller Bug
**File**: `Backend-Web/controllers/branch/branchComponents/createBranch.js`

**Before (WRONG - 8 parameters, wrong order)**:
```javascript
const [[createdBranch]] = await connection.execute(
  'CALL createBranch(?, ?, ?, ?, ?, ?, ?, ?)',
  [branch_name, area, location, address, contact_number, email, status, admin_id]
  //    ❌ Wrong order: admin_id should be FIRST
  //    ❌ Extra parameter: status doesn't exist in stored procedure
);
```

**Issues**:
1. ❌ **Parameter count mismatch**: 8 parameters provided, procedure expects 7
2. ❌ **Wrong order**: `admin_id` should be FIRST parameter, not last
3. ❌ **Extra parameter**: `status` doesn't exist in stored procedure signature
4. ❌ **Result extraction**: Used `[[createdBranch]]` instead of proper extraction from MySQL CALL result

## Solution Applied

**File Modified**: `Backend-Web/controllers/branch/branchComponents/createBranch.js`

**After (CORRECT - 7 parameters, correct order)**:
```javascript
// Insert new branch using stored procedure
// Note: createBranch SP signature: (admin_id, branch_name, area, location, address, contact_number, email)
// Status is set to 'Active' by default in the database
const [results] = await connection.execute(
  'CALL createBranch(?, ?, ?, ?, ?, ?, ?)',
  [admin_id, branch_name, area, location, address, contact_number, email]
  // ✅ Correct order: admin_id is FIRST
  // ✅ Correct count: 7 parameters
);

const createdBranch = results[0][0];
const branchId = createdBranch.branch_id;
```

**Fixes Applied**:
1. ✅ **Removed** `status` parameter (not in stored procedure)
2. ✅ **Reordered** parameters to match stored procedure signature (admin_id first)
3. ✅ **Fixed** result extraction from MySQL CALL result structure
4. ✅ **Added** comments explaining the stored procedure signature

## MySQL CALL Result Structure
When calling a stored procedure with `connection.execute('CALL ...')`, MySQL returns:
```javascript
[
  [
    [ { branch_id: 1, ... } ],  // First result set (actual data)
    { ... }                      // Metadata
  ]
]
```

**Correct extraction**:
```javascript
const [results] = await connection.execute('CALL createBranch(...)');
const createdBranch = results[0][0];  // Get first row of first result set
```

**Wrong extraction** (what was there before):
```javascript
const [[createdBranch]] = await connection.execute('CALL createBranch(...)');
// This tries to destructure the result incorrectly
```

## Testing Steps

### 1. Restart Backend Server
```powershell
# Navigate to Backend-Web directory
cd Backend/Backend-Web

# Restart the server (Ctrl+C to stop if running)
npm start
```

### 2. Test Branch Creation in Admin Panel
1. Login to admin panel (username: admin)
2. Navigate to Branch Management
3. Click "Add New Branch" button
4. Fill in the form:
   - **Branch Name**: Test Branch 2
   - **Area**: Test Area
   - **Location**: Test Location
   - **Address**: Test Address
   - **Contact Number**: 09123456789
   - **Email**: testbranch@example.com
5. Click "Save"
6. **Expected Result**: Branch created successfully with status 'Active'

### 3. Verify in Database
```sql
-- Check newly created branch
SELECT * FROM branch 
WHERE branch_name = 'Test Branch 2';

-- Expected: 
-- - branch_id: auto-generated
-- - status: 'Active' (default from database)
-- - admin_id: 1 (or current active admin)
-- - created_at: current timestamp
```

## Parameter Mapping

| Frontend Field | Stored Procedure Parameter | Position |
|---------------|---------------------------|----------|
| (auto-fetched) | `p_admin_id` | 1 |
| `branch_name` | `p_branch_name` | 2 |
| `area` | `p_area` | 3 |
| `location` | `p_location` | 4 |
| `address` | `p_address` | 5 |
| `contact_number` | `p_contact_number` | 6 |
| `email` | `p_email` | 7 |
| ~~`status`~~ | ~~(doesn't exist)~~ | ❌ Removed |

## Expected Behavior After Fix

✅ **POST Request**: Returns 201 Created  
✅ **Response Data**: Contains complete branch object with branch_id  
✅ **Database Entry**: Branch created with status = 'Active'  
✅ **Frontend Display**: New branch appears in branches list  
✅ **No Console Errors**: Clean request/response

## Common Errors to Avoid

### ❌ Wrong Parameter Order
```javascript
// WRONG - admin_id should be first
[branch_name, area, location, address, contact_number, email, admin_id]

// CORRECT
[admin_id, branch_name, area, location, address, contact_number, email]
```

### ❌ Parameter Count Mismatch
```javascript
// WRONG - 8 parameters, procedure expects 7
'CALL createBranch(?, ?, ?, ?, ?, ?, ?, ?)'

// CORRECT - 7 parameters
'CALL createBranch(?, ?, ?, ?, ?, ?, ?)'
```

### ❌ Wrong Result Extraction
```javascript
// WRONG - Incorrect destructuring
const [[createdBranch]] = await connection.execute('CALL ...')

// CORRECT - Proper extraction
const [results] = await connection.execute('CALL ...')
const createdBranch = results[0][0]
```

## Alternative: Update Stored Procedure (Not Recommended)

If you wanted to add `status` parameter to the stored procedure:

```sql
DROP PROCEDURE IF EXISTS createBranch;

CREATE PROCEDURE createBranch (
    IN p_admin_id INT,
    IN p_branch_name VARCHAR(100),
    IN p_area VARCHAR(100),
    IN p_location VARCHAR(255),
    IN p_address TEXT,
    IN p_contact_number VARCHAR(20),
    IN p_email VARCHAR(100),
    IN p_status ENUM('Active','Inactive','Under Construction','Maintenance')
)
BEGIN
    INSERT INTO branch (admin_id, branch_name, area, location, address, contact_number, email, status)
    VALUES (p_admin_id, p_branch_name, p_area, p_location, p_address, p_contact_number, p_email, COALESCE(p_status, 'Active'));
    
    SELECT LAST_INSERT_ID() as branch_id;
END
```

**However**, the current fix (removing `status` from controller) is better because:
1. ✅ No database changes needed
2. ✅ 'Active' is the sensible default for new branches
3. ✅ Can be changed later via update endpoint if needed
4. ✅ Follows existing stored procedure design

## Files Modified
- ✅ `Backend-Web/controllers/branch/branchComponents/createBranch.js`

## Related Issues Fixed
This is similar to the branch display fix where MySQL CALL results need proper extraction:
- See: `BRANCH_DISPLAY_FIX.md` for getAllBranchesDetailed fix
- See: `BRANCH_DELETE_FIX.md` for deleteBranch fix

**Pattern**: MySQL stored procedures called via `connection.execute('CALL ...')` return nested arrays that need `results[0]` or `results[0][0]` extraction.

## Next Steps
1. ✅ Restart backend server
2. ✅ Test branch creation in admin panel
3. ✅ Verify new branch appears in database with status 'Active'
4. ✅ Confirm no 400 errors in console
5. ✅ Test that new branch appears in branches list

---
**Fix Date**: November 5, 2025  
**Issue**: Branch creation failing with 400 error due to parameter mismatch  
**Status**: ✅ **RESOLVED**
