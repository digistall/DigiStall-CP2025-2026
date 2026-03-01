# General Applicants Status Display Fix

**Date:** March 1, 2026  
**Issue:** General applicants (those who applied via "Apply for a Stall" button without selecting a specific stall) were showing ACCEPT/DECLINE buttons instead of APPROVED badge, even though their status in the database was `approved`.

---

## Problem Summary

When a user applies through the general application form (not for a specific stall):
1. The application is auto-approved
2. Credentials are generated and emailed
3. The applicant's `status` in the database is set to `'approved'`
4. However, on the web Applicants page, they still showed ACCEPT/DECLINE buttons instead of the APPROVED badge

**Affected User:** Clyden Rivas (applicant_id = 10)

---

## Root Causes Identified

### 1. Backend: Null Applications Being Pushed to Array
**File:** `SHARE-CONTROLLER/applicants/applicantsComponents/getApplicantsByBranchManager.js`

**Problem:** The `forEach` loop was pushing application objects even when `application_id` was `null` for general applicants:
```javascript
// BEFORE - Always pushed, even for null applications
applicantsMap.get(row.applicant_id).applications.push({
  application_id: row.application_id,  // null for general applicants
  application_status: row.current_application_status,  // null
  ...
});
```

**Impact:** Frontend's `latestApplication` was not `null` but rather `{ application_id: null, application_status: null }`, causing wrong code path execution.

---

### 2. Backend: Missing applicant_status Field
**File:** `SHARE-CONTROLLER/applicants/applicantsComponents/getApplicantsByBranchManager.js`

**Problem:** The applicant map initialization hardcoded `application_status: 'Pending'` and didn't include the applicant's own `status` field:
```javascript
// BEFORE - Missing applicant status
applicantsMap.set(row.applicant_id, {
  applicant_id: row.applicant_id,
  // ... other fields
  application_status: 'Pending',  // Hardcoded
  // applicant_status: MISSING
  // status: MISSING
});
```

---

### 3. Frontend: Wrong Code Path for General Applicants
**Files:** 
- `BUSINESS/SHARED/FRONTEND-WEB/VIEWS/Applicants/Applicants.js`
- `BUSINESS/SHARED/FRONTEND-WEB/VIEWS/Applicants/Applicants/Applicants.js` ← **Active file**
- `BUSINESS/SHARED/FRONTEND-WEB/VIEWS/Applicants/Applicants/Applicants/Applicants.js`

**Problem:** The `transformApplicantData()` function hardcoded `'No Application'` as the status for general applicants:
```javascript
// BEFORE
} else {
  // No applications yet
  transformedData.application_status = 'No Application'  // ← Wrong!
  transformedData.stall_info = null
}
```

**Impact:** `getEffectiveStatus()` in `ApplicantsTable.js` checked if `application_status !== 'Pending'` and returned `'No Application'` directly, bypassing the `applicant.status` check.

---

### 4. Multiple Duplicate Files
**Discovery:** There were 3 nested copies of `Applicants.js`:
1. `VIEWS/Applicants/Applicants.js`
2. `VIEWS/Applicants/Applicants/Applicants.js` ← **Active component**
3. `VIEWS/Applicants/Applicants/Applicants/Applicants.js`

Initial fixes were applied to file #1, but the Vue router was actually importing file #2.

---

## Solutions Applied

### Backend Fix 1: Skip Null Applications
**File:** `SHARE-CONTROLLER/applicants/applicantsComponents/getApplicantsByBranchManager.js`

```javascript
// AFTER - Only push valid applications
if (row.application_id !== null) {
  applicantsMap.get(row.applicant_id).applications.push({
    application_id: row.application_id,
    application_date: row.application_date,
    application_status: row.current_application_status,
    stall: { ... }
  });
}

// For general applicants (no application), store their status directly
if (row.application_id === null) {
  applicantsMap.get(row.applicant_id).applicant_status = row.applicant_status;
}
```

**Result:** General applicants now have `applications = []` (empty array), causing frontend to take the `else` branch correctly.

---

### Backend Fix 2: Include Applicant Status Fields
**File:** `SHARE-CONTROLLER/applicants/applicantsComponents/getApplicantsByBranchManager.js`

```javascript
// AFTER - Include status fields
applicantsMap.set(row.applicant_id, {
  applicant_id: row.applicant_id,
  // ... other fields
  applicant_status: row.applicant_status,  // From a.status
  status: row.applicant_status,            // Fallback field
  // ... rest of fields
});
```

**Result:** API response now includes `applicant_status: "approved"` for general applicants.

---

### Frontend Fix: Use Applicant's Own Status
**Files:** All 3 duplicate `Applicants.js` files

```javascript
// AFTER - Normalize applicant status
} else {
  // No stall applications - general applicant
  // Use the applicant's own status (approved/pending/rejected) so the badge shows correctly
  const rawStatus = apiData.applicant_status || apiData.status || 'pending'
  const normalizedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase()
  transformedData.application_id = null
  transformedData.application_date = null
  transformedData.application_status = normalizedStatus  // e.g. 'Approved', 'Pending'
  transformedData.status = normalizedStatus  // Also set status for getEffectiveStatus fallback
  transformedData.stall_info = null
}
```

**Result:** 
- `apiData.applicant_status = "approved"` → normalized to `"Approved"`
- `transformedData.application_status = "Approved"`
- `getEffectiveStatus()` returns `"Approved"` (not 'Pending')
- `isProcessedStatus()` returns `true`
- Badge shows **APPROVED** ✅ instead of ACCEPT/DECLINE buttons

---

### Vite Configuration Enhancement
**File:** `FRONTEND-RUNNER/WEB/vite.config.js`

**Added watch configuration** to monitor aliased MVC role-based folders outside of `src/`:

```javascript
server: {
  // CSP-friendly development server settings
  host: '0.0.0.0',
  port: 5173,
  hmr: {
    protocol: 'ws',
    host: 'localhost'
  },
  watch: {
    // Watch aliased MVC role-based folders outside of src/
    ignored: [
      '!**/BUSINESS/**', 
      '!**/AUTH/**', 
      '!**/EMPLOYEE/**', 
      '!**/SHARED/**', 
      '!**/STALL-HOLDER/**', 
      '!**/VENDOR/**', 
      '!**/APPLICANTS/**', 
      '!**/SYSTEM-ADMINISTRATOR/**', 
      '!**/SHARE-CONTROLLER/**'
    ],
  },
  // ... proxy config
}
```

**Result:** Vite now hot-reloads changes in MVC role folders automatically.

---

## Database Schema Reference

### Applicant Table
- `applicant_id` (INT, PK)
- `status` (VARCHAR) - Values: `'pending'`, `'approved'`, `'rejected'`
- Other fields: encrypted personal data

### Application Table
- `application_id` (INT, PK)
- `applicant_id` (INT, FK)
- `stall_id` (INT, FK) - **NULL for general applicants**
- `application_status` (VARCHAR)

### General Applicant Characteristics
- Has record in `applicant` table with `status = 'approved'`
- Has record in `credential` table (username/password)
- **NO** record in `application` table (or `stall_id IS NULL`)
- Should show **APPROVED** badge on web Applicants page

---

## Testing & Verification

### Test Case: Clyden Rivas (applicant_id = 10)
**Database State:**
```sql
SELECT a.applicant_id, a.status, app.application_id, app.application_status 
FROM applicant a 
LEFT JOIN application app ON a.applicant_id = app.applicant_id 
WHERE a.applicant_id = 10;

-- Result:
-- applicant_id: 10
-- status: "approved"
-- application_id: NULL
-- application_status: NULL
```

**API Response (after fix):**
```json
{
  "applicant_id": 10,
  "fullName": "Clyden Rivas",
  "applicant_status": "approved",
  "status": "approved",
  "applications": []
}
```

**Frontend Transform Result (after fix):**
```javascript
{
  applicant_id: 10,
  fullName: "Clyden Rivas",
  application_status: "Approved",  // Normalized
  status: "Approved",              // Fallback
  all_applications: [],
  stall_info: null
}
```

**UI Display:** ✅ **APPROVED** badge (green, with date)

---

## Related Features

This fix works in conjunction with the **General Application Auto-Approve Flow**:

1. User clicks "Apply for a Stall" button on mobile (no specific stall selected)
2. `applyForStallGeneral()` in `stallController.js` is called
3. Applicant record is created with `status = 'approved'`
4. Credentials are generated (username: `YY-XXXXX`, password: `3letters+3digits`)
5. Email sent via EmailJS with credentials
6. Web Applicants page shows **APPROVED** badge (this fix)

---

## Files Modified

### Backend
1. `SHARE-CONTROLLER/applicants/applicantsComponents/getApplicantsByBranchManager.js`
   - Skip pushing null applications to `applications[]` array
   - Include `applicant_status` and `status` fields in map initialization
   - Store `applicant_status` directly for general applicants

### Frontend
2. `BUSINESS/SHARED/FRONTEND-WEB/VIEWS/Applicants/Applicants.js`
3. `BUSINESS/SHARED/FRONTEND-WEB/VIEWS/Applicants/Applicants/Applicants.js` ← **Active**
4. `BUSINESS/SHARED/FRONTEND-WEB/VIEWS/Applicants/Applicants/Applicants/Applicants.js`
   - All 3 files: Changed `'No Application'` to normalized `applicant_status`
   - Set both `application_status` and `status` fields for fallback

### Configuration
5. `FRONTEND-RUNNER/WEB/vite.config.js`
   - Added `watch` configuration for MVC role folders

---

## Deployment Checklist

- [x] Backend changes applied and server restarted
- [x] Frontend changes applied to all 3 duplicate files
- [x] Vite cache cleared (`FRONTEND-RUNNER/WEB/node_modules/.vite`)
- [x] All servers restarted via `Start-all.ps1`
- [x] Browser hard refresh (Ctrl+Shift+R)
- [x] Verified APPROVED badge shows for Clyden Rivas
- [ ] **Pending:** Git commit and push to repository
- [ ] **Pending:** Deploy to DigitalOcean droplet (if needed for production)

---

## Notes

- **Duplicate Files:** The nested `Applicants/Applicants/Applicants.js` structure should be reviewed and cleaned up in a future refactor to avoid confusion
- **Status Normalization:** The fix properly normalizes status values (`'approved'` → `'Approved'`) to match the frontend's case-sensitive checks
- **Vite HMR:** The added watch configuration ensures future changes to MVC role folders trigger automatic reload
- **Database Migration:** No database changes required; all fixes are code-level only

---

## See Also

- `documents/EMAIL_LOGIN_IMPLEMENTATION_GUIDE.md` - General application auto-approve flow
- `documents/FORGOT_PASSWORD_FIX_2026-02-26.md` - Related credential/email work
- `SHARE-CONTROLLER/applicants/applicantsComponents/getApplicantsByBranchManager.js` - Main backend endpoint
- `BUSINESS/SHARED/FRONTEND-WEB/VIEWS/Applicants/Applicants/Components/Table/ApplicantsTable.js` - Status display logic
