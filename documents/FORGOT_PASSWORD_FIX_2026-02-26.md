# 🔐 Forgot Password — Bug Fix & Implementation Update
**Date:** 2026-02-26  
**Branch:** TestArea  
**Status:** ✅ Fixed & Verified

---

## 📋 Summary

The mobile app's **Forgot Password** feature was returning _"No account found with this email address"_ even when the stallholder account existed in the database. This document covers the root cause analysis, all files changed, and the resolution.

---

## 🐛 Bug 1 — Email Lookup Failure (`passwordResetController.js`)

### Symptom
Entering a valid stallholder Gmail on the Forgot Password screen returned:
> _"No account found with this email address. Please check your email and try again."_

Server logs confirmed every user type was checked and all returned 0 rows.

### Root Cause
The `applicant` user type in `userTypes` used the stored procedure `getStallholderByEmail`, which performs a direct `WHERE applicant_email = ?` equality match.

However, the `applicant_email` field is **not in the `applicant` table at all** — the email lives in the `other_information` table as `email_address`, and it is stored as **AES-256-GCM encrypted data** (format: `iv:authTag:ciphertext`).

Because AES-256-GCM uses a **random IV on every encryption**, no two ciphertexts of the same plain-text are equal. Passing a plain-text email to the stored procedure would never produce a match.

### Fix — `SHARE-CONTROLLER/auth/passwordResetController.js`

1. **Added import** for `decryptAES256GCM` from `services/mysqlDecryptionService.js`.

2. **Replaced `getStallholderByEmail` stored procedure** for the `applicant` type with `procedure: null`, since it cannot work with non-deterministic encrypted emails.

3. **Added `findApplicantByEmail()` helper function** that:
   - Fetches all applicants joined to their `credential` (active mobile users only) and `other_information` records
   - Decrypts each `email_address` at the Node.js level using `decryptAES256GCM()`
   - Returns the first row whose decrypted email matches the input (case-insensitive)

4. **Updated all three endpoint handlers** to use `findApplicantByEmail()` instead of the stored procedure when `config.type === 'applicant'`:
   - `verifyEmailExists`
   - `resendResetCode`
   - `resetPassword`

#### Query used in `findApplicantByEmail()`
```sql
SELECT a.applicant_id, a.applicant_full_name, oi.email_address
FROM applicant a
INNER JOIN credential c  ON c.applicant_id  = a.applicant_id
INNER JOIN other_information oi ON oi.applicant_id = a.applicant_id
WHERE oi.email_address IS NOT NULL
```

> **Web users are unaffected.** All other user types (`system_administrator`, `stall_business_owner`, `business_manager`, `business_employee`, `inspector`, `collector`) still use their existing stored procedures unchanged. The `if (config.type === 'applicant')` branch only runs for mobile stallholders.

---

## 🐛 Bug 2 — React Native Crash on OTP Screen (`ForgotPasswordScreen.js`)

### Symptom
After the OTP was sent successfully and the screen advanced to Step 2, the app threw:
> _`Invariant Violation: Cannot specify both value and children.`_

### Root Cause
The 6-digit OTP `<TextInput>` boxes had **both a `value` prop and a `<Text>` child** simultaneously:
```jsx
// ❌ Before — causes crash
<TextInput value={digit} ...>
  <Text style={styles.otpText}>{digit}</Text>
</TextInput>
```
React Native forbids specifying both `value` and children on a `TextInput`.

### Fix — `FRONTEND-RUNNER/MOBILE/screens/ForgotPasswordScreen/ForgotPasswordScreen.js`
Removed the inner `<Text>` child and converted `<TextInput>` to a self-closing tag. The `value={digit}` prop alone is sufficient to display the digit:
```jsx
// ✅ After — correct
<TextInput value={digit} ... />
```

---

## 📁 Files Changed

| File | Change |
|---|---|
| `SHARE-CONTROLLER/auth/passwordResetController.js` | Added `decryptAES256GCM` import; added `findApplicantByEmail()` helper; updated `verifyEmailExists`, `resendResetCode`, and `resetPassword` to use it for the `applicant` type |
| `FRONTEND-RUNNER/MOBILE/screens/ForgotPasswordScreen/ForgotPasswordScreen.js` | Removed `<Text>` child from OTP `<TextInput>` boxes to fix React Native invariant crash |
| `FRONTEND-RUNNER/MOBILE/config/shared/networkConfig.js` | Removed duplicate `console.log` lines; restored production server order |

---

## ✅ Verified Behaviour (Post-Fix)

```
🔍 Verifying email exists: josonglaurente@gmail.com
🔍 Checking system_administrator... (no match)
🔍 Checking stall_business_owner...  (no match)
🔍 Checking business_manager...      (no match)
🔍 Checking business_employee...     (no match)
🔍 Checking inspector...             (no match)
🔍 Checking collector...             (no match)
🔍 Checking applicant...
✅ Found user as applicant: Jeno Aldrei Laurente
✅ New verification code sent to: josonglaurente@gmail.com
```

The full 3-step flow (email → OTP → new password) now completes successfully for stallholder accounts.

---

## ⚠️ Important Notes

- `DATA_ENCRYPTION_KEY` should be set in the server's `.env` file. A warning will appear in logs if it is missing and the fallback development key is used.
- The `findApplicantByEmail()` function performs an **in-memory scan** of all applicants. This is acceptable for the current user count. If the `applicant` table grows very large in the future, consider adding a SHA-256 hash index column for fast email lookups.
