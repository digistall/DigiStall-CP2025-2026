# 🔄 SQL TO STORED PROCEDURE MIGRATION GUIDE
## DigiStall CP2025-2026 Project

**Created:** November 5, 2025  
**Status:** Phase 1 Complete - Employee Module ✅  
**Remaining:** 9 modules to migrate

---

## 📋 MIGRATION STATUS

### ✅ Phase 1: Employee Module (COMPLETED)
- `Backend/Backend-Web/controllers/employees/employeeController_simple.js`
- `Backend/Backend-Web/controllers/employees/employeeController.js`

**Procedures Used:**
- `createEmployee` ✅
- `getAllEmployees` ✅
- `getEmployeeById` ✅
- `getEmployeeByUsername` ✅
- `updateEmployee` ✅
- `deleteEmployee` ✅
- `loginEmployee` ✅
- `resetEmployeePassword` ✅
- `getEmployeesByBranch` ✅

**Remaining Issue:**
- Line 40 in `employeeController_simple.js` - Email check query (keep this for validation)

---

## 🔴 Phase 2: Admin & Branch Manager Authentication (HIGH PRIORITY)

### Files to Update:
```
Backend/Backend-Web/controllers/auth/
├── loginComponents/
│   ├── adminLogin.js ⚠️
│   ├── branchManagerLogin.js ⚠️
│   └── createAdminUser.js ⚠️
└── unifiedAuthController.js ⚠️
```

### SQL Queries to Replace:

#### adminLogin.js
```javascript
// OLD:
SELECT * FROM admin WHERE admin_username = ?

// NEW:
CALL getAdminByUsernameLogin(?)
```

#### branchManagerLogin.js
```javascript
// OLD:
SELECT bm.*, b.branch_name FROM branch_manager bm...

// NEW:
CALL getBranchManagerByUsername(?)
```

#### createAdminUser.js
```javascript
// OLD:
INSERT INTO admin (...)

// NEW:
CALL createAdmin(?, ?, ?, ?, ?, ?)
```

---

## 🟡 Phase 3: Applicants Module (HIGH PRIORITY)

### Files to Update:
```
Backend/Backend-Web/controllers/applicants/
├── applicantsComponents/
│   ├── getAllApplicants.js ⚠️
│   ├── getApplicantById.js ⚠️
│   ├── createApplicant.js ⚠️
│   ├── updateApplicant.js ⚠️
│   ├── deleteApplicant.js ⚠️
│   ├── approveApplicant.js ⚠️
│   ├── declineApplicant.js ⚠️
│   ├── searchApplicants.js ⚠️
│   └── credentialsController.js ⚠️
└── applicantsController.js ⚠️
```

### Procedures Needed:
- `getAllApplicants` ✅ (EXISTS)
- `getApplicantById` ✅ (EXISTS)
- `createApplicant` ✅ (EXISTS)
- `updateApplicant` ✅ (NEW - created in migration file)
- `deleteApplicant` ✅ (NEW - created in migration file)
- `getApplicantByUsername` ✅ (NEW)
- `getApplicantByEmail` ✅ (NEW)

---

## 🟡 Phase 4: Applications Module (HIGH PRIORITY)

### Files to Update:
```
Backend/Backend-Web/controllers/applications/
└── applicationController.js ⚠️
    - getAllApplications()
    - getApplicationById()
    - createApplication()
    - updateApplicationStatus()
```

### Procedures Created:
- `createApplication` ✅
- `getAllApplications` ✅
- `getApplicationById` ✅
- `updateApplicationStatus` ✅
- `getApplicationsByApplicant` ✅

---

## 🟡 Phase 5: Stalls Module (MEDIUM PRIORITY)

### Files to Update:
```
Backend/Backend-Web/controllers/stalls/
├── stallComponents/
│   ├── getAllStalls.js ⚠️
│   ├── getStallById.js ⚠️
│   ├── addStall.js ⚠️
│   ├── updateStall.js ⚠️
│   ├── deleteStall.js ⚠️
│   ├── getAvailableStalls.js ⚠️
│   └── getStallsByFilter.js ⚠️
└── stallController.js ⚠️
```

### Procedures:
- `getStallById` ✅ (EXISTS in database)
- `getAvailableStalls` ✅ (EXISTS)
- `getAllStallsDetailed` ✅ (NEW)
- `updateStall` ✅ (NEW)
- `deleteStall` ✅ (NEW)

---

## 🟡 Phase 6: Branch Module (MEDIUM PRIORITY)

### Files to Update:
```
Backend/Backend-Web/controllers/branch/
├── branchComponents/
│   ├── createBranch.js ⚠️
│   ├── getAllBranches.js ⚠️
│   ├── getBranchById.js ⚠️
│   ├── updateBranch.js ⚠️
│   ├── deleteBranch.js ⚠️
│   ├── createFloor.js ⚠️
│   ├── getFloors.js ⚠️
│   ├── createSection.js ⚠️
│   ├── getSections.js ⚠️
│   ├── createBranchManager.js ⚠️
│   ├── getAllBranchManagers.js ⚠️
│   ├── getBranchManagerById.js ⚠️
│   └── updateBranchManager.js ⚠️
└── branchController.js ⚠️
```

### Procedures Created:
- `createBranch` ✅
- `getAllBranchesDetailed` ✅
- `getBranchById` ✅
- `updateBranch` ✅
- `deleteBranch` ✅
- `createFloor` ✅
- `getFloorsByBranch` ✅
- `createSection` ✅
- `getSectionsByFloor` ✅
- `updateBranchManager` ✅

---

## 🟠 Phase 7: Mobile Backend (MEDIUM PRIORITY)

### Files to Update:
```
Backend/Backend-Mobile/controllers/
├── mobileAuthController.js ⚠️
├── mobileApplicationController.js ⚠️
├── stall/stallController.js ⚠️
├── user/userController.js ⚠️
└── login/loginController.js ⚠️
```

### Common Queries:
- Applicant login/registration
- Application CRUD
- Stall browsing
- User profile updates
- Credential management

---

## 🟠 Phase 8: Raffle & Auction (LOW PRIORITY)

### Files to Update:
```
Backend/Backend-Web/controllers/stalls/stallComponents/
├── raffleComponents/
│   ├── createRaffle.js ⚠️
│   ├── getRaffles.js ⚠️
│   ├── joinRaffle.js ⚠️
│   ├── selectWinner.js ⚠️
│   └── manageRaffle.js ⚠️
└── auctionComponents/
    ├── createAuction.js ⚠️
    ├── getAuctions.js ⚠️
    ├── placeBid.js ⚠️
    ├── selectWinner.js ⚠️
    └── manageAuction.js ⚠️
```

**Note:** These already have complex business logic - may need custom procedures

---

## 🟢 Phase 9: Utilities (LOW PRIORITY)

### Files to Update:
- `Backend/Backend-Web/services/emailService.js` - Line 54 (email template query)
- Database configuration files (SELECT 1 health checks - KEEP THESE)

---

## 📝 IMPLEMENTATION STEPS

### Step 1: Run the Migration SQL
```bash
# Execute the migration file in your database
mysql -u root -p naga_stall < database/migrations/010_missing_stored_procedures.sql
```

### Step 2: Update Controller Files
For each controller file, replace SQL queries following this pattern:

**BEFORE:**
```javascript
const [results] = await connection.execute(
    'SELECT * FROM table WHERE id = ?',
    [id]
);
```

**AFTER:**
```javascript
const [[results]] = await connection.execute(
    'CALL getProcedureName(?)',
    [id]
);
```

**⚠️ IMPORTANT:** Stored procedures return results as `[[results]]` (double array)

---

## 🔧 QUICK REFERENCE: Common Patterns

### SELECT Queries
```javascript
// Old
const [rows] = await connection.execute('SELECT * FROM table...');

// New
const [[rows]] = await connection.execute('CALL getProcedure(?)');
```

### INSERT Queries
```javascript
// Old
const [result] = await connection.execute('INSERT INTO...');
const newId = result.insertId;

// New
const [[result]] = await connection.execute('CALL createProcedure(?)');
const newId = result.table_id; // Column name varies by procedure
```

### UPDATE Queries
```javascript
// Old
const [result] = await connection.execute('UPDATE table SET...');
if (result.affectedRows === 0) // not found

// New
const [[result]] = await connection.execute('CALL updateProcedure(?)');
if (result.affected_rows === 0) // not found
```

### DELETE Queries
```javascript
// Old
const [result] = await connection.execute('DELETE FROM...');

// New
const [[result]] = await connection.execute('CALL deleteProcedure(?)');
```

---

## ⚠️ IMPORTANT NOTES

1. **Email Validation Query** (Line 40 in employeeController_simple.js)
   - This raw SQL query can stay for pre-insert validation
   - It's checking uniqueness before calling the stored procedure

2. **Health Check Queries** (`SELECT 1`)
   - Keep these in server.js and database.js files
   - These are connection tests, not business logic

3. **Transaction Handling**
   - Some stored procedures may need BEGIN/COMMIT/ROLLBACK
   - Add transaction logic where multiple tables are affected

4. **Error Handling**
   - Stored procedures return empty arrays if no results found
   - Check for `results.length === 0` or `result.affected_rows === 0`

---

## 🧪 TESTING CHECKLIST

After each phase, test:
- [ ] CREATE operations
- [ ] READ operations (single & list)
- [ ] UPDATE operations
- [ ] DELETE operations
- [ ] Login/Authentication flows
- [ ] Permission checks
- [ ] Error handling
- [ ] Edge cases (empty results, duplicates, etc.)

---

## 📊 PROGRESS TRACKER

| Phase | Module | Status | Files Updated | Procedures Created |
|-------|--------|--------|---------------|-------------------|
| 1 | Employee | ✅ Complete | 2/2 | 9/9 |
| 2 | Admin/Manager Auth | ⏳ Pending | 0/4 | 3/3 |
| 3 | Applicants | ⏳ Pending | 0/15 | 7/7 |
| 4 | Applications | ⏳ Pending | 0/1 | 5/5 |
| 5 | Stalls | ⏳ Pending | 0/8 | 5/5 |
| 6 | Branch | ⏳ Pending | 0/15 | 10/10 |
| 7 | Mobile Backend | ⏳ Pending | 0/5 | TBD |
| 8 | Raffle/Auction | ⏳ Pending | 0/10 | TBD |
| 9 | Utilities | ⏳ Pending | 0/1 | 1/1 |

**Total Progress:** 11% (1/9 phases complete)

---

## 🚀 NEXT IMMEDIATE ACTIONS

1. ✅ **RUN THE MIGRATION SQL FILE** - Add all new stored procedures to your database
2. **Test Employee Module** - Verify all employee operations still work
3. **Start Phase 2** - Fix Admin & Branch Manager authentication (highest priority)
4. **Create automated tests** - Ensure no regression as you migrate

---

## 📞 SUPPORT

If you encounter issues during migration:
1. Check procedure exists: `SHOW PROCEDURE STATUS WHERE db = 'naga_stall';`
2. Test procedure manually: `CALL procedureName(testParams);`
3. Verify result structure matches expectations
4. Check for permission issues on stored procedure execution

---

**Last Updated:** November 5, 2025  
**Migration Version:** 1.0.0  
**Database Schema Version:** See migrations table
