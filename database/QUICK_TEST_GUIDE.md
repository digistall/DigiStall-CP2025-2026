# Quick Reference: Testing Branch Deletion

## 🎯 Testing the Branch Delete Feature

### **Test Case: Admin Branch Deletion**

#### **Steps to Test:**

1. **Login as Admin**
   - Go to web admin panel
   - Login with admin credentials

2. **Navigate to Branch Management**
   - Go to Branches section
   - View list of all branches

3. **Select Branch to Delete**
   - Choose a test branch (preferably one you created for testing)
   - Click Delete button

4. **Verify Deletion**
   - Branch should be marked as "Inactive"
   - Branch should still exist in database (soft delete)

#### **Expected Behavior:**

```javascript
// Backend Call
CALL deleteBranch(?) 
// Where ? is the branch_id
```

**Database Changes:**
```sql
UPDATE branch 
SET status = 'Inactive', updated_at = NOW()
WHERE branch_id = ?;
```

**NOT:**
```sql
DELETE FROM branch WHERE branch_id = ?; -- ❌ This should NOT happen
```

---

## 🧪 Testing Other Critical Features

### **1. Create Applicant (Web)**

**Route:** POST `/api/applicants-landing/create`

**Backend Procedure:** `createApplicantComplete`

**Test Data:**
```json
{
  "applicant_full_name": "Test User",
  "applicant_contact_number": "09123456789",
  "applicant_address": "Test Address",
  "applicant_birthdate": "1990-01-01",
  "applicant_civil_status": "Single",
  "applicant_educational_attainment": "College Graduate",
  "nature_of_business": "Food",
  "capitalization": 50000,
  "source_of_capital": "Personal Savings",
  "email_address": "test@example.com"
}
```

---

### **2. Create Application**

**Route:** POST `/api/applications/create`

**Backend Procedure:** `createApplication`

**Test Data:**
```json
{
  "stall_id": 1,
  "applicant_id": 1,
  "application_date": "2025-11-05"
}
```

---

### **3. Filter Stalls**

**Route:** GET `/api/applications/stalls?branch_id=1`

**Backend Procedure:** `getStallsFiltered`

**Query Parameters:**
- `stall_id` (optional)
- `branch_id` (optional)
- `price_type` (optional: "Fixed Price", "Auction", "Raffle")
- `status` (optional: "Active", "Inactive")
- `is_available` (optional: 0 or 1)

---

### **4. Delete Application**

**Route:** DELETE `/api/applications/:id`

**Backend Procedure:** `deleteApplication`

**Test:**
1. Create a test application
2. Note the application_id
3. Send DELETE request to `/api/applications/{application_id}`
4. Verify application is removed from database

---

## 🔍 Database Verification Queries

### **Check if Branch is Soft Deleted:**
```sql
SELECT branch_id, branch_name, status, updated_at 
FROM branch 
WHERE branch_id = ? 
AND status = 'Inactive';
```

### **Check All Stored Procedures:**
```sql
SELECT 
    ROUTINE_NAME,
    CREATED,
    LAST_ALTERED
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'naga_stall'
AND ROUTINE_TYPE = 'PROCEDURE'
ORDER BY ROUTINE_NAME;
```

### **Check Recent Migrations:**
```sql
SELECT * FROM migrations 
ORDER BY executed_at DESC 
LIMIT 5;
```

---

## 📞 Common Issues & Solutions

### **Issue 1: "Procedure doesn't exist"**
**Solution:** Run the migration file again:
```powershell
Get-Content "c:\Users\Jeno\DigiStall-CP2025-2026\database\migrations\011_additional_missing_procedures.sql" | & "C:\xampp\mysql\bin\mysql.exe" -u root -p naga_stall
```

### **Issue 2: "Cannot delete branch with foreign key"**
**Solution:** The `deleteBranch` procedure does NOT actually delete the branch, it sets status to 'Inactive'. This is a soft delete and should work fine.

### **Issue 3: "Wrong number of parameters"**
**Solution:** Check the stored procedure signature:
```sql
SHOW CREATE PROCEDURE deleteBranch;
```

### **Issue 4: Branch still showing after delete**
**Solution:** Check your frontend filter - it might be showing all branches including inactive ones. Add filter for `status = 'Active'`.

---

## ✅ Quick Verification Script

Run this to verify all is working:

```powershell
# Connect to MySQL and run tests
& "C:\xampp\mysql\bin\mysql.exe" -u root -p naga_stall -e "
-- Check stored procedures exist
SELECT COUNT(*) as total_procedures 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall' 
AND ROUTINE_TYPE = 'PROCEDURE';

-- Check deleteBranch exists
SELECT ROUTINE_NAME 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall' 
AND ROUTINE_NAME = 'deleteBranch';

-- Check branch status
SELECT branch_id, branch_name, status 
FROM branch 
LIMIT 5;
"
```

---

## 🎉 Success Indicators

When testing is successful, you should see:

✅ Admin can delete a branch  
✅ Branch status changes to "Inactive"  
✅ Branch is NOT physically removed from database  
✅ Applicants can be created (web and mobile)  
✅ Applications can be created and deleted  
✅ Stalls can be filtered properly  
✅ Employees can be managed  
✅ No "stored procedure not found" errors  

---

**Need Help?** Check these files:
- `database/STORED_PROCEDURES_VERIFICATION_REPORT.md` - Complete list
- `database/MIGRATION_011_SUMMARY.md` - Migration details
- `Backend-Web/controllers/branch/branchComponents/deleteBranch.js` - Delete logic
