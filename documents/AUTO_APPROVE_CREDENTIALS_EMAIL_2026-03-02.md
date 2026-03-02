# 🎉 Auto-Approve + Credentials + Email — General Stall Application
**Date:** 2026-03-02  
**Branch:** Mobile/Stallholder/Payment  
**Status:** ✅ Implemented & Verified

---

## 📋 Summary

When a user submits a **general stall application** (no specific stall selected) via the "Apply for a Stall" button on the landing page, the system now:

1. **Automatically approves** the applicant (sets `status = 'approved'` in the `applicant` table)
2. **Generates login credentials** (username format: `YY-XXXXX`, password format: `3letters + 3digits`)
3. **Saves credentials** to the `credential` table (password stored as SHA-256 hash)
4. **Sends a real email** to the applicant via EmailJS containing their username and password

This was originally implemented previously but was **lost due to a teammate's GitHub merge**. It was re-implemented from scratch on March 2, 2026.

---

## 🗂️ Files Modified

| File | Change |
|------|--------|
| `SHARE-CONTROLLER/applicantsLanding/applicantController.js` | Added auto-approve + credential generation + DB insert + early return for general apps |
| `PUBLIC-LANDINGPAGE/FRONTEND-WEB/VIEWS/LandingPage/LandingPage/components/stalls/StallApplicationContainer.js` | Added EmailJS send after receiving credentials in response |
| `PUBLIC-LANDINGPAGE/FRONTEND-WEB/VIEWS/LandingPage/components/stalls/StallApplicationContainer.js` | Same — 2nd copy |
| `PUBLIC-LANDINGPAGE/FRONTEND-WEB/VIEWS/components/components/stalls/StallApplicationContainer.js` | Same — 3rd copy |

---

## ⚙️ Backend Changes — `applicantController.js`

### Route
```
POST /api/landing-applicants/stall-application
```

### Two-Path Logic Inside `createStallApplication()`

The function now handles two separate paths based on whether `stall_id` is null:

#### Path 1 — General Application (`stall_id` is null)
```javascript
if (!stall_id) {
  // 1. Auto-approve
  await connection.execute(
    `UPDATE applicant SET status = 'approved' WHERE applicant_id = ?`,
    [applicantId]
  );

  // 2. Generate credentials
  const year = new Date().getFullYear().toString().slice(-2); // e.g. "26"
  const randomDigits = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit
  const generatedUsername = `${year}-${randomDigits}`; // e.g. "26-31972"

  // Password: 3 random letters + 3 random digits (e.g. "xkb482")
  let generatedPassword = '';
  for (let i = 0; i < 3; i++) generatedPassword += letters[random];
  for (let i = 0; i < 3; i++) generatedPassword += numbers[random];

  // 3. Hash and save
  const hashedPassword = crypto.createHash('sha256').update(generatedPassword).digest('hex');
  await connection.execute(
    `INSERT INTO credential (applicant_id, username, password_hash) VALUES (?, ?, ?)`,
    [applicantId, generatedUsername, hashedPassword]
  );

  // 4. Return credentials to frontend for email
  return res.status(201).json({
    success: true,
    data: {
      application_status: "Approved",
      documents: [], // No documents for general applications
      credentials: {
        username: generatedUsername,
        password: generatedPassword, // plain-text, for email only
        email: email_address,
      },
    },
  });
}
```

#### Path 2 — Stall-Specific Application (`stall_id` provided)
- Checks stall availability
- Creates `application` record with `application_status = 'Pending'`
- Saves documents (signature, house_location, valid_id)
- Returns response with `application_status: "Pending"` and **no credentials**

### Bugs Fixed During Implementation

| Error | Cause | Fix |
|-------|-------|-----|
| `Unknown column 'registrationid'` | Wrong column name in SELECT | Changed to `credential_id` |
| `Unknown column 'password'` | Wrong column name in INSERT/UPDATE | Changed to `password_hash` |
| `Cannot access 'savedDocuments' before initialization` | `savedDocuments` variable declared after the `return`, but referenced in the response body | Changed `documents: savedDocuments` to `documents: []` |

---

## 📧 EmailJS Configuration

| Key | Value |
|-----|-------|
| Service ID | `service_am6pozg` |
| Template ID | `template_3wccajf` |
| Public Key | `F2fUGiyhf-FjatviG` |
| Sender | `digistall@unc.edu.ph` |

### Template Parameters Sent
```javascript
{
  from_name: 'Stall Management System',
  from_email: 'digistall@unc.edu.ph',
  to_email: email,         // applicant's email
  to_name: applicantName,  // applicant's full name
  subject: 'Stall Application Approved - Your Login Credentials',
  username: username,       // e.g. "26-31972"
  password: password,       // plain-text e.g. "xkb482"
  message: `...full message with instructions...`,
  reply_to: 'digistall@unc.edu.ph',
}
```

### Frontend Email Trigger (all 3 `StallApplicationContainer.js` copies)
```javascript
if (result.credentials) {
  const { username, password, email } = result.credentials
  const emailPayload = { service_id, template_id, user_id, template_params }
  const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailPayload),
  })
}
```

---

## 🗄️ Database Tables Affected

### `applicant`
- Column `status` set to `'approved'` for general applications

### `credential`
| Column | Value |
|--------|-------|
| `applicant_id` | FK to `applicant` |
| `username` | Generated `YY-XXXXX` format |
| `password_hash` | SHA-256 hash of plain-text password |

---

## 🔄 Complete Flow Diagram

```
Landing page → "Apply for a Stall" (no specific stall selected)
  → Fill 4-step form (Personal Info → Business Info → Other Info → Documents)
  → Click Submit
  → POST /api/landing-applicants/stall-application { stall_id: null, ... }

  [BACKEND]
  → createApplicantComplete() stored procedure → applicant row created
  → stall_id is null → enter auto-approve path
  → UPDATE applicant SET status = 'approved'
  → Generate username: YY-XXXXX
  → Generate password: 3letters + 3digits
  → SHA-256 hash password
  → INSERT INTO credential (applicant_id, username, password_hash)
  → return 201 { credentials: { username, password (plain), email } }

  [FRONTEND]
  → Receives response with credentials
  → Sets loadingState = 'success'
  → Calls EmailJS API → sends real email to applicant
  → Shows success screen
```

---

## 🧹 Database Cleanup Utility

During testing, test applicants need to be cleaned up. The deletion must happen in child-table-first order due to foreign key constraints:

```javascript
// Delete order (child tables first, then parent)
const tables = [
  'applicant_documents',
  'credential',
  'application',
  'business_information',
  'other_information'
];
for (const table of tables) {
  await connection.execute(`DELETE FROM ${table} WHERE applicant_id = ?`, [id]);
}
await connection.execute(`DELETE FROM applicant WHERE applicant_id = ?`, [id]);
```

**Tables with FK references to `applicant`:**
- `applicant_documents` (fk_applicant_documents)
- `business_information` (fk_business_info_applicant)
- `other_information` (fk_other_info_applicant)
- `credential` (applicant_id FK)
- `application` (applicant_id FK)

---

## ✅ Verification Checklist

- [x] General application submits successfully (HTTP 201)
- [x] `applicant.status` = `'approved'` in DB
- [x] `credential` row created with correct `username` and `password_hash`
- [x] Applicant receives email with username and password
- [x] Stall-specific application still sets `application_status = 'Pending'` (unaffected)
- [x] No errors in server console

---

## ⚠️ Notes

- The **plain-text password is never stored** in the database — only the SHA-256 hash. The plain-text is returned once in the API response solely for the purpose of sending the email.
- There are **3 duplicate copies** of `StallApplicationContainer.js` in `PUBLIC-LANDINGPAGE/FRONTEND-WEB/VIEWS/`. All 3 must be kept in sync when making changes.
- EmailJS sends from the client side (browser), not from the Node.js backend — consistent with the rest of the application's email architecture.
