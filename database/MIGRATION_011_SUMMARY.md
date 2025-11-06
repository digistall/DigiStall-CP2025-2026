# Missing Stored Procedures - Migration Summary

**Date:** November 5, 2025  
**Migration File:** `011_additional_missing_procedures.sql`  
**Status:** ✅ Successfully Applied

## Overview
This migration adds 9 missing stored procedures that were being called in the backend but didn't exist in the database.

---

## Added Stored Procedures

### 1. **Applicant Management** (3 procedures)

#### `createApplicantComplete`
- **Purpose:** Create a complete applicant record with business info, other info, and spouse details in one transaction
- **Parameters:** 16 input parameters covering all applicant data
- **Used By:** 
  - `Backend-Web/controllers/applicantsLanding/applicantController.js`
  - Web admin panel for creating applicants

#### `getApplicantComplete`
- **Purpose:** Retrieve applicant with all related information (business, spouse, other info)
- **Parameters:** `p_applicant_id` (NULL returns all applicants)
- **Used By:** 
  - `Backend-Web/controllers/applicantsLanding/applicantController.js`
  - `Backend-Web/controllers/applications/applicationController.js`
  - Multiple admin and application views

#### `updateApplicantComplete`
- **Purpose:** Update applicant and all related information atomically
- **Parameters:** 17 input parameters
- **Used By:** 
  - `Backend-Web/controllers/applicantsLanding/applicantController.js`
  - Admin panel for editing applicant records

---

### 2. **Stall Management** (1 procedure)

#### `getStallsFiltered`
- **Purpose:** Get stalls with dynamic filtering by branch, price type, status, availability
- **Parameters:** 
  - `p_stall_id` - Filter by specific stall
  - `p_branch_id` - Filter by branch
  - `p_price_type` - Filter by pricing model (Fixed/Auction/Raffle)
  - `p_status` - Filter by stall status
  - `p_is_available` - Filter by availability
- **Used By:** 
  - `Backend-Web/controllers/applications/applicationController.js`
  - Application creation and stall selection

---

### 3. **Application Management** (1 procedure)

#### `deleteApplication`
- **Purpose:** Delete an application record
- **Parameters:** `p_application_id`
- **Used By:** 
  - `Backend-Web/controllers/applications/applicationController.js`
  - Admin panel for managing applications

---

### 4. **Authentication & Security** (1 procedure)

#### `revokeAllUserTokens`
- **Purpose:** Revoke all authentication tokens for a user (security feature)
- **Parameters:**
  - `p_user_id` - User identifier
  - `p_user_type` - Type of user (admin/manager/employee)
  - `p_reason` - Reason for revocation
- **Used By:** 
  - `Backend-Web/controllers/auth/enhancedAuthController.js`
  - Enhanced authentication system

---

### 5. **Email System** (1 procedure)

#### `getEmailTemplate`
- **Purpose:** Retrieve email template by name for sending system emails
- **Parameters:** `p_template_name`
- **Used By:** 
  - `Backend-Web/services/emailService.js`
  - Employee credential emails, notifications

---

### 6. **Branch Structure** (2 procedures)

#### `createSection`
- **Purpose:** Create a new section within a floor
- **Parameters:**
  - `p_floor_id` - Parent floor
  - `p_section_name` - Name of section
  - `p_branch_id` - Branch reference (for validation)
- **Used By:** 
  - `Backend-Web/controllers/branch/branchComponents/createSection.js`
  - Admin branch management

#### `createFloor`
- **Purpose:** Create a new floor within a branch
- **Parameters:**
  - `p_branch_id` - Parent branch
  - `p_floor_name` - Name of floor
  - `p_floor_number` - Floor number
  - `p_branch_id_duplicate` - Duplicate parameter (compatibility)
- **Used By:** 
  - `Backend-Web/controllers/branch/branchComponents/createFloor.js`
  - Admin branch management

---

## Verification Results

All 9 stored procedures were successfully created in the `naga_stall` database:

```
✅ createApplicantComplete
✅ createFloor
✅ createSection
✅ deleteApplication
✅ getApplicantComplete
✅ getEmailTemplate
✅ getStallsFiltered
✅ revokeAllUserTokens
✅ updateApplicantComplete
```

---

## Testing Recommendations

### 1. **Applicant Management**
- Test creating a complete applicant with all fields
- Test retrieving all applicants
- Test retrieving a specific applicant
- Test updating applicant information

### 2. **Stall Filtering**
- Test filtering stalls by each parameter
- Test combined filters
- Verify proper JOIN results

### 3. **Application Deletion**
- Test deleting an application
- Verify cascade behavior

### 4. **Branch Structure**
- Test creating floors and sections
- Verify proper parent-child relationships

### 5. **Email System**
- Test retrieving email templates
- Verify template rendering

---

## Known Issues & Notes

1. **`createFloor` has duplicate branch_id parameter** - This appears to be for backward compatibility but only the first parameter is used.

2. **`revokeAllUserTokens` is a placeholder** - Currently returns a success message but doesn't actually revoke tokens. Implement based on your token storage mechanism (JWT blocklist, Redis, etc.).

3. **Character Set Warning** - Stored procedures were created with `cp850` character set. Consider recreating with `utf8mb4` for better Unicode support.

---

## Next Steps

1. ✅ **Migration Applied Successfully**
2. 🔄 **Test all affected features in the admin panel**
3. 🔄 **Test branch deletion specifically**
4. 🔄 **Test applicant creation/editing**
5. ⚠️ **Implement actual token revocation logic in `revokeAllUserTokens`**

---

## Files Modified

- ✅ Created: `database/migrations/011_additional_missing_procedures.sql`
- ✅ Updated: `migrations` table in database

---

## Rollback Instructions

If you need to rollback this migration:

```sql
DROP PROCEDURE IF EXISTS createApplicantComplete;
DROP PROCEDURE IF EXISTS getApplicantComplete;
DROP PROCEDURE IF EXISTS updateApplicantComplete;
DROP PROCEDURE IF EXISTS getStallsFiltered;
DROP PROCEDURE IF EXISTS deleteApplication;
DROP PROCEDURE IF EXISTS revokeAllUserTokens;
DROP PROCEDURE IF EXISTS getEmailTemplate;
DROP PROCEDURE IF EXISTS createSection;
DROP PROCEDURE IF EXISTS createFloor;

DELETE FROM migrations WHERE migration_name = '011_additional_missing_procedures';
```

---

**Migration Status:** ✅ **COMPLETE**  
**Execution Time:** 2025-11-05 22:34:08
