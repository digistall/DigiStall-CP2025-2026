# General Applicants Stall Display Fix

**Date:** March 1, 2026  
**Branch:** `Mobile/Stallholder/StallFetch`  
**Issue:** General applicants (registered via landing page) could not see any stalls in the mobile app  
**Status:** ✅ RESOLVED

---

## Problem Description

Users who registered through the **General Application** form on the landing page and logged into the mobile app were greeted with a "No Stalls Available" dialog. This happened because:

1. The `getStallsByType` function checked for `appliedAreas` (areas where the user had existing stall applications)
2. General applicants have **no stall applications** yet - they only have an approved applicant record
3. The function returned empty results and showed a restriction message

### Screenshot of Issue
- "No Stalls Available" dialog appeared
- Message: "You need to apply to your first stall to see more stalls in that area"

---

## Root Cause Analysis

### Before Fix
```javascript
// In stallController.js - getStallsByType function
const [appliedAreasRows] = await connection.execute('CALL sp_getAppliedAreasForApplicant(?)', [applicant_id])
const appliedAreas = appliedAreasRows[0]

if (appliedAreas.length === 0) {
  // ❌ This blocked general applicants from seeing ANY stalls
  return res.json({
    success: true,
    message: 'No applications found...',
    data: { stalls: [], ... }
  })
}
```

### General Applicant Flow
1. User fills out general application on landing page
2. System creates `applicant` record with `status = 'approved'`
3. Credentials are emailed to user
4. User logs into mobile app
5. **BUT** no `application` record exists (no `stall_id` linked)
6. `sp_getAppliedAreasForApplicant` returns empty
7. User sees "No Stalls Available"

---

## Solution Implemented

### 1. Detect General Applicants
Added logic to check if an applicant has no applied areas but IS approved:

```javascript
let isGeneralApplicant = false
if (appliedAreas.length === 0) {
  const [applicantCheck] = await connection.execute(
    'SELECT status FROM applicant WHERE applicant_id = ?',
    [applicant_id]
  )
  
  if (applicantCheck.length > 0 && applicantCheck[0].status === 'approved') {
    isGeneralApplicant = true
    console.log(`✅ General applicant ${applicant_id} - allowing access to all stalls`)
  }
}
```

### 2. Created New Stored Procedure
Created `sp_getStallsByTypeForGeneralApplicant` to fetch ALL available stalls for general applicants without area restrictions.

**File:** `DATABASE/STORED_PROCEDURES/sp_getStallsByTypeForGeneralApplicant.sql`

```sql
CREATE PROCEDURE sp_getStallsByTypeForGeneralApplicant(
    IN p_price_type VARCHAR(50),
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        s.stall_id, s.stall_number, s.stall_location, ...
        -- Plus application status check (applied/joined_raffle/joined_auction/available)
    FROM stall s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    WHERE s.price_type = p_price_type
      AND s.is_available = 1
      AND s.status = 'Available'
    ORDER BY b.branch_name, s.stall_number;
END
```

### 3. Updated Controllers
Both stall controllers now use the stored procedure:

```javascript
if (isGeneralApplicant) {
  const [stallsRows] = await connection.execute(
    'CALL sp_getStallsByTypeForGeneralApplicant(?, ?)', 
    [type, applicant_id]
  )
  stalls = stallsRows[0]
} else {
  // Regular applicants use existing stored procedure (area-restricted)
  const [stallsRows] = await connection.execute(
    'CALL sp_getStallsByTypeForApplicant(?, ?, ?)', 
    [type, applicant_id, null]
  )
  stalls = stallsRows[0]
}
```

### 4. Updated Response
Added `is_general_applicant` flag and conditional `restriction_info`:

```javascript
res.json({
  success: true,
  message: isGeneralApplicant 
    ? `All available ${type} stalls retrieved successfully...`
    : `${type} stalls retrieved successfully from your applied areas...`,
  data: {
    stalls: formattedStalls,
    is_general_applicant: isGeneralApplicant,
    restriction_info: isGeneralApplicant ? null : { ... }
  }
})
```

---

## Files Modified

| File | Changes |
|------|---------|
| `SHARE-CONTROLLER/stall/stallController.js` | Added general applicant detection, use new stored procedure, updated response |
| `STALL-HOLDER/BACKEND-MOBILE/CONTROLLERS/stallController.js` | Same changes as above (mirror file) |
| `FRONTEND-RUNNER/MOBILE/screens/.../TabbedStallScreen.js` | Updated alert logic to skip for general applicants |
| `FRONTEND-RUNNER/MOBILE/screens/.../StallScreen.js` | Updated alert logic to skip for general applicants |

## Files Created

| File | Description |
|------|-------------|
| `DATABASE/STORED_PROCEDURES/sp_getStallsByTypeForGeneralApplicant.sql` | New stored procedure for fetching stalls without area restriction |

---

## Deployment Checklist

### Database
- [ ] Run `sp_getStallsByTypeForGeneralApplicant.sql` on production database
  ```bash
  mysql -h <host> -P 25060 -u doadmin -p naga_stall < DATABASE/STORED_PROCEDURES/sp_getStallsByTypeForGeneralApplicant.sql
  ```

### Backend
- [ ] Deploy updated `stallController.js` files to production server
- [ ] Restart backend service

### Mobile
- [ ] Ensure network config has production servers first
- [ ] Rebuild mobile app if creating production APK/IPA

---

## Testing Verification

### Test Case: General Applicant Login
1. Register via landing page general application
2. Receive credentials via email
3. Login to mobile app
4. Navigate to Stall Management
5. **Expected:** All available stalls should display
6. **Expected:** No "No Stalls Available" dialog

### Server Logs (Success)
```
✅ General applicant 10 - allowing access to all stalls
🔄 General applicant - fetching ALL Fixed Price stalls via stored procedure...
✅ Found 2 Fixed Price stalls for general applicant
```

---

## Related Documents
- `GENERAL_APPLICANTS_IMPLEMENTATION_2026-03-01.md` - Admin view implementation
- `GENERAL_APPLICANTS_STATUS_FIX_2026-03-01.md` - Status badge fix

---

## Author
Generated via GitHub Copilot debugging session  
Date: March 1, 2026
