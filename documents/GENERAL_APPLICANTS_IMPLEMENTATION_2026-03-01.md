# General Applicants Feature — Implementation Guide

**Date:** March 1, 2026  
**Branch:** `Mobile/StallScreen/Feature-Payment`  
**Status:** ✅ Complete

---

## Overview

This document covers the implementation of the **General Applicants** category in the Applicants page. Previously, the Applicants page only showed Stall Applicants and Vendor Applicants. General Applicants are people who registered through the public landing page without selecting any specific stall. They are tracked in the system separately until they choose a stall.

---

## Feature Summary

| Feature | Description |
|---|---|
| Separate category | General Applicants are listed under their own dropdown option |
| Status display | Shows **PENDING** while they haven't selected a stall yet |
| Auto-promotion | Once they pick a stall, they move to Stall Applicants with **APPROVED** status |
| Info banner | A banner explains what General Applicants are |
| Date column | Shows "Date Registered" instead of "Date Applied" |
| Details dialog | Business Information, Spouse, and Other Information tabs all populated |

---

## How It Works — Full Flow

### 1. Registration (Landing Page)
- A person fills out the general application form on the public landing page
- A record is created in the `applicant` table with `status = 'approved'` (system auto-approves)
- **No** `application` record is created with a `stall_id` at this point
- Credentials (username/password) are generated so they can log in and browse stalls

### 2. General Applicants List (Admin View)
- Admin selects **"General Applicants"** from the dropdown on the Applicants page
- The frontend calls `GET /api/applicants/general`
- Backend query filters: `WHERE app.stall_id IS NULL OR app.application_id IS NULL`
- Each record is transformed with `is_general_applicant: true`
- Despite `status = 'approved'` in the DB, the frontend displays **PENDING** (see Status Logic below)

### 3. Stall Selection (Applicant Action)
- The applicant logs in and selects a stall they want to apply for
- An `application` record is created with a `stall_id` linked to their chosen stall
- This applicant now **leaves** the General Applicants list automatically (no longer matches `stall_id IS NULL`)
- They **appear** in the Stall Applicants list (matched by `app.stall_id IS NOT NULL`)
- Their status displays as **APPROVED** (green badge) in the Stall Applicants view

---

## Status Display Logic

### The Core Rule
```
General Applicant (no stall yet)  →  PENDING  (yellow badge)
Stall Applicant   (has a stall)   →  APPROVED (green badge)
```

### Why DB Says "approved" But We Show "Pending"

The `applicant.status` column is set to `'approved'` when credentials are generated — it means the **account** is approved, not the stall application. Since general applicants haven't applied for any stall yet, they are logically still pending in the context of the market application process.

### Implementation — `getEffectiveStatus()` in `ApplicantsTable.js`

```javascript
getEffectiveStatus(applicant) {
  // General applicants haven't selected a stall yet — always show as Pending
  // until they pick a stall and move to the Stall Applicants category
  if (applicant?.is_general_applicant) {
    return 'Pending'
  }
  // ... rest of status normalization for stall applicants
}
```

The `is_general_applicant` flag is set in `transformGeneralApplicantData()` in `Applicants.js`.

---

## Files Modified

### Backend

#### `SHARE-CONTROLLER/applicants/applicantsComponents/getGeneralApplicants.js`
- **Added JOINs**: `business_information`, `spouse` tables
- **Structured response**: Returns nested `business_information` and `spouse` objects instead of flat rows
- **Query filter**: `WHERE app.stall_id IS NULL OR app.application_id IS NULL`

#### `SHARE-CONTROLLER/applicants/applicantsComponents/getApplicantsByBranchManager.js`
- **Added filter**: `WHERE app.stall_id IS NOT NULL` — ensures general applicants never appear in the Stall Applicants view

### Frontend (Both `BUSINESS/SHARED/` and `APPLICANTS/FRONTEND-WEB/` — mirror copies)

#### `Applicants.js`
- Added `{ value: 'general', label: 'General Applicants' }` to `applicantTypes`
- Added `generalApplicants: []` to `data()`
- Updated `currentApplicants()` computed to handle 3 types
- Added `fetchGeneralApplicants()` method — calls `GET /api/applicants/general`
- Added `transformGeneralApplicantData()` — maps all fields + sets `is_general_applicant: true`

#### `Applicants.vue`
- Added loading overlay for General Applicants fetch
- Added error state with retry button for General Applicants

#### `Components/Table/ApplicantsTable.js`
- `getEffectiveStatus()` — early return `'Pending'` when `applicant.is_general_applicant === true`
- `getEffectiveStatus()` — added `normalize()` helper to fix case-sensitivity bug (`'approved'` lowercase from DB)
- `getStatusText()` — standard text mapping (no special case needed; status is always `'Pending'` for general applicants by the time it reaches this function)

#### `Components/Table/ApplicantsTable.vue`
- Added `general-applicants-banner` info banner (only visible for General Applicants type)
- Dynamic column header: `"Date Registered"` for General Applicants, `"Date Applied"` for others

#### `Components/Table/ApplicantsTable.css`
- Added `.general-applicants-banner` styles (blue left-border info banner)

---

## API Endpoint

```
GET /api/applicants/general
```

**Auth**: Required (session-based)  
**Response**:
```json
{
  "success": true,
  "message": "General applicants retrieved successfully",
  "data": [
    {
      "applicant_id": 1,
      "applicant_full_name": "Juan dela Cruz",
      "applicant_contact_number": "09123456789",
      "applicant_address": "Naga City",
      "status": "approved",
      "email_address": "juan@example.com",
      "business_information": {
        "nature_of_business": "Food Stall",
        "capitalization": 50000,
        "source_of_capital": "Personal Savings",
        "previous_business_experience": "3 years",
        "relative_stall_owner": "No"
      },
      "spouse": null
    }
  ],
  "count": 1
}
```

---

## State Transition Diagram

```
Landing Page Registration
         │
         ▼
  applicant table
  status = 'approved'          ← account/credential approved
  (no stall_id in application)
         │
         ▼
  General Applicants List
  Badge: 🟡 PENDING            ← no stall selected yet
         │
         │  (applicant logs in and selects a stall)
         │
         ▼
  application record created
  with stall_id = X
         │
         ▼
  Stall Applicants List        ← moves here automatically
  Badge: 🟢 APPROVED           ← real DB status now shown
```

---

## Bug Fixes Included

### 1. Business Information Empty in Details Dialog
**Root Cause**: `getGeneralApplicants.js` had no JOIN to `business_information` or `spouse` tables.  
**Fix**: Added `LEFT JOIN business_information bi` and `LEFT JOIN spouse sp` to the SQL query; structured the response as nested objects.

### 2. Status Showing "PENDING" Despite DB = "approved" (Stall Applicants)
**Root Cause**: `applicant.status` in the DB stores lowercase `'approved'`; the template compared against `=== 'Approved'` (Title Case) — a case-sensitive mismatch.  
**Fix**: Added `normalize()` helper in `getEffectiveStatus()` to convert any casing variant to Title Case before comparison.

---

## Notes

- The `is_general_applicant` flag only exists on the **frontend object** — it is not a database column. It is injected during `transformGeneralApplicantData()`.
- The status column in the `applicant` table (`'approved'`) means their **account credentials** are active, not that their market stall application is approved. This distinction is important.
- If a general applicant selects a stall, **no manual admin action** is needed to move them — the SQL queries (`IS NULL` vs `IS NOT NULL`) handle the separation automatically on the next page load.
