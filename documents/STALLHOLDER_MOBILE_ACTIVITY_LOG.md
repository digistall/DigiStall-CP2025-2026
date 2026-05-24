# Stallholder Mobile Activity Log — Implementation Documentation
**Branch:** `Web/Admin/Feature-StallholderLogs`  
**Date:** 2026-05-22  
**Feature:** Comprehensive Activity Logging for Stallholder Mobile App

---

## Overview

This document describes all backend changes made to implement full activity logging for the stallholder mobile app. The feature tracks who did what and when inside the app, visible on the **Activity Log** tab in the Admin web panel under the Stallholders page.

All logs are stored via the existing `sp_insertStaffActivityLog` stored procedure. **No new stored procedures are required.**

---

## Bug Fix: Logout Was Never Logged

### Root Cause — Two Separate Problems

#### Problem 1: JWT Secret Mismatch
The mobile login token is signed with a different fallback secret than what `verifyToken` uses to verify it.

| File | Fallback Secret Used |
|---|---|
| `BACKEND/AUTH/login/loginController.js` | `'digistall-mobile-secret-key-2024'` |
| `middleware/auth.js` (`verifyToken`) | `'your-super-secret-jwt-key-change-this-in-production'` |
| `BACKEND/AUTH/mobileAuthController.js` | `'your-secret-key'` |

When `JWT_SECRET` is not set in the `.env` file, these fallbacks don't match. The `verifyToken` middleware rejects the token and returns `401 Unauthorized` — **so `mobileLogout` is never called at all.**

#### Problem 2: Silent Skip When Stallholder Is Not Found
Even if the token passed, the original code used a `for...of` loop over `stallholderData` without checking the array length first. If a user was an applicant but not yet a confirmed stallholder, the loop simply didn't execute and no log was written.

### Fix Applied

**File:** `routes/authRoutes.js`

The logout route was moved **before** the `router.use(verifyToken)` wall and given its own `optionalVerifyToken` middleware. This middleware:

1. Tries to verify the token with **all known fallback secrets** in order.
2. If all secrets fail, falls back to **unverified `jwt.decode()`** to still extract the user payload (just for logging — no security risk since logout doesn't return sensitive data).
3. Always calls `next()` — **logout is never blocked**.

```
// Before (broken)
router.use(verifyToken)
router.post('/logout', mobileLogout)        ← blocked by verifyToken on secret mismatch

// After (fixed)
router.post('/logout', optionalVerifyToken, mobileLogout)  ← always reaches mobileLogout
router.use(verifyToken)                     ← still protects all other routes
router.post('/staff-logout', ...)
...
```

**File:** `BACKEND/AUTH/mobileAuthController.js`

Added an `else` fallback so a logout log is always written even when no stallholder record matches:

```js
if (stallholderData.length > 0) {
  // Log with real stallholder details (decrypted)
} else {
  // Fallback: log with JWT user data
  await logStaffActivity({ staffId: applicantId, staffName: req.user?.username, ... });
}
```

---

## New Activity Logs Added

### 1. Documents

**File:** `BACKEND/STALLHOLDER/documents/stallholderDocumentBlobController.js`

| Action | `actionType` | `module` | API Endpoint |
|---|---|---|---|
| Upload new document | `CREATE` | `Documents` | `POST /api/mobile/stallholder/documents/blob/upload` (new) |
| Re-upload / update document | `UPDATE` | `Documents` | `POST /api/mobile/stallholder/documents/blob/upload` (existing) |
| View documents list | `VIEW` | `Documents` | `GET /api/mobile/stallholder/:id/documents/blob` |

The log differentiates upload vs. re-upload using the `isUpdate` boolean already present in the controller logic.

---

### 2. Payments

**File:** `BACKEND/STALLHOLDER/stallholder/paymentController.js`

| Action | `actionType` | `module` | API Endpoint |
|---|---|---|---|
| View payment summary | `VIEW` | `Payments` | `GET /api/mobile/stallholder/payments/summary` |
| View monthly payment status / initiate payment | `VIEW` | `Payments` | `GET /api/mobile/stallholder/payments/monthly-status` |
| View receipt / payment history | `VIEW` | `Payments` | `GET /api/mobile/stallholder/payments/all` |

---

### 3. Complaints

**File:** `BACKEND/STALLHOLDER/stallholder/complaintController.js`

| Action | `actionType` | `module` | API Endpoint |
|---|---|---|---|
| Submit complaint | `CREATE` | `Complaints` | `POST /api/mobile/stallholder/complaint` |
| View complaint status | `VIEW` | `Complaints` | `GET /api/mobile/stallholder/complaints` |

---

### 4. App Access (Dashboard, Notifications, Reports)

#### Dashboard — Auto-logged
**File:** `BACKEND/STALLHOLDER/stallholder/ownedStallController.js`

| Action | `actionType` | `module` | API Endpoint |
|---|---|---|---|
| View dashboard | `VIEW` | `Dashboard` | `GET /api/mobile/stallholder/owned-stalls` |

The dashboard log fires automatically when the stallholder loads their owned stalls.

#### Notifications & Reports — New Endpoint

**New file:** `BACKEND/STALLHOLDER/stallholder/appAccessController.js`  
**Registered in:** `routes/stallholderRoutes.js`

```
POST /api/mobile/stallholder/app-access-log
Authorization: Bearer <token>
Content-Type: application/json
Body: { "screen": "notifications" }   // or "reports" or "dashboard"
```

The mobile app should call this endpoint when the Notifications or Reports screen loads (fire-and-forget):

```js
// Example: React Native screen mount
useEffect(() => {
  fetch(`${API_BASE}/api/mobile/stallholder/app-access-log`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ screen: 'notifications' })
  }).catch(() => {}); // fire-and-forget
}, []);
```

---

## Files Changed Summary

| File | Type of Change |
|---|---|
| `routes/authRoutes.js` | Added `optionalVerifyToken` middleware; moved `/logout` before `verifyToken` wall |
| `BACKEND/AUTH/mobileAuthController.js` | Fixed logout log — added fallback branch for when no stallholder record is found |
| `BACKEND/STALLHOLDER/documents/stallholderDocumentBlobController.js` | Added upload, re-upload, and view-list logs |
| `BACKEND/STALLHOLDER/stallholder/paymentController.js` | Added view-summary, initiate-payment, and view-receipt logs |
| `BACKEND/STALLHOLDER/stallholder/complaintController.js` | Added submit-complaint and view-status logs |
| `BACKEND/STALLHOLDER/stallholder/ownedStallController.js` | Added view-dashboard log |
| `BACKEND/STALLHOLDER/stallholder/appAccessController.js` | **New file** — screen-access log endpoint controller |
| `routes/stallholderRoutes.js` | Registered new `POST /app-access-log` route |

---

## No New Stored Procedures Required

All new log calls use the existing `logStaffActivity()` helper function which internally calls `sp_insertStaffActivityLog`. The stored procedure signature (12 parameters) is unchanged.

```sql
CALL sp_insertStaffActivityLog(
  staffType,         -- 'stallholder'
  staffId,           -- stallholder_id or applicant_id
  staffName,         -- decrypted full name
  branchId,          -- branch_id or NULL
  actionType,        -- 'LOGIN', 'LOGOUT', 'VIEW', 'CREATE', 'UPDATE'
  actionDescription, -- human-readable description
  module,            -- 'Documents', 'Payments', 'Complaints', 'Dashboard', 'mobile_app'
  ipAddress,         -- client IP
  userAgent,         -- client user agent string
  requestMethod,     -- HTTP method
  requestPath,       -- API path
  status             -- 'success' or 'failed'
);
```

---

## Activity Log Modules Reference

| Module Name | Covers |
|---|---|
| `mobile_app` | Login, Logout |
| `Documents` | Upload, Re-upload, View |
| `Payments` | Payment summary, Monthly status, Receipt/history |
| `Complaints` | Submit, View status |
| `Dashboard` | Viewing owned stalls / home screen |
| `Notifications` | Viewing notifications screen |
| `Reports` | Viewing reports screen |
