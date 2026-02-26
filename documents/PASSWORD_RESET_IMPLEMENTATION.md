# 🔐 Password Reset Implementation Guide
**Date Implemented:** February 25–26, 2026  
**Branch:** TestArea

---

## Overview

Two separate password reset features were implemented in this update:

| Feature | Triggered By | Delivery Method |
|---|---|---|
| **Forgot Password** (Self-service) | Employee/User on Login page | EmailJS (frontend) |
| **Manager Reset Password** | Manager in Employee Management | Nodemailer (backend) |

---

## Feature 1: Forgot Password (Self-Service)

### What It Does
A 3-step wizard on the login page that allows any registered user to reset their own password by verifying their email.

### Flow
```
Login Page → Click "Forgot Password?"
     ↓
Step 1: Enter registered email
     ↓ Backend verifies email exists
     ↓ Frontend generates 6-digit code
     ↓ EmailJS sends code to user's email
Step 2: Enter the 6-digit code
     ↓ Backend verifies code (max 5 attempts, 10 min expiry)
Step 3: Set new password
     ↓ Backend encrypts with AES-256-GCM
     ↓ Database updated
Success → Redirected to Login
```

### Supported User Types
All user types in the system are supported:
- `system_administrator`
- `stall_business_owner`
- `business_manager`
- `business_employee`
- `inspector`
- `collector`

### Files Created
| File | Purpose |
|---|---|
| `AUTH/FRONTEND-WEB/VIEWS/ForgotPassword/ForgotPassword.vue` | 3-step wizard UI |
| `AUTH/FRONTEND-WEB/VIEWS/ForgotPassword/ForgotPassword.js` | Component logic |
| `AUTH/FRONTEND-WEB/VIEWS/ForgotPassword/ForgotPassword.css` | Styling |

### Files Modified
| File | Change |
|---|---|
| `SHARE-CONTROLLER/auth/passwordResetController.js` | New controller with `verifyEmailExists`, `storeResetCode`, `verifyResetCode`, `resetPassword` |
| `routes/webAuthRoutes.js` | Added 4 new password reset endpoints |
| `FRONTEND-RUNNER/WEB/src/router/index.js` | Added `/forgot-password` as a public route |

### API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/verify-email-exists` | Checks email exists in DB, returns user name |
| `POST` | `/api/auth/store-reset-code` | Stores 6-digit code with 10-min expiry |
| `POST` | `/api/auth/verify-reset-code` | Validates code, max 5 attempts |
| `POST` | `/api/auth/reset-password` | Encrypts & saves new password |

### Email Delivery
Uses **EmailJS** (same service as credential emails):
- **Service ID:** `service_e2awvdk`
- **Template ID:** `template_r6kxcnh`
- Code is generated on the frontend and emailed via EmailJS
- Code is simultaneously stored on the backend for server-side verification

### Security
- Codes expire after **10 minutes**
- Maximum **5 failed attempts** before code is invalidated
- Passwords encrypted with **AES-256-GCM** before storage
- Codes are deleted from memory after successful use

---

## Feature 2: Manager Reset Password (Employee Management)

### What It Does
A manager clicks **Reset Password** on any employee in the Employee Management page. A new secure password is automatically generated and emailed to the employee via Nodemailer (backend).

### Flow
```
Employee Management → Click Employee Row → Click "Reset Password"
     ↓
Confirmation Dialog appears
     ↓ Manager clicks "RESET PASSWORD"
Backend:
  1. Verifies employee belongs to manager's branch
  2. Generates a secure password
  3. Encrypts with AES-256-GCM
  4. Updates database directly (UPDATE SQL)
  5. Sends email via Nodemailer with new password
     ↓
Employee receives email with new credentials
Frontend shows ✅ success toast
```

### Supported Employee Types
- **Web Employee** (`business_employee` table) — via `/api/employees/:id/reset-password`
- **Inspector** (`inspector` table) — via `/api/mobile-staff/reset-password`
- **Collector** (`collector` table) — via `/api/mobile-staff/reset-password`

### Files Modified
| File | Change |
|---|---|
| `services/emailService.js` | Added `sendEmployeePasswordResetNotification()` method |
| `SHARE-CONTROLLER/employees/employeeController.js` | Updated `resetEmployeePassword()` — direct SQL UPDATE, AES encryption, Nodemailer email |
| `SHARE-CONTROLLER/mobileStaff/mobileStaffController.js` | Updated `resetStaffPassword()` — direct SQL UPDATE, AES encryption, Nodemailer email |
| `EMPLOYEE/WEB_EMPLOYEE/FRONTEND-WEB/VIEWS/Employees/Employees.js` | Removed EmailJS dependency for reset, uses backend email response |

### Email Content (Nodemailer)
Sent from backend via `emailService.sendEmployeePasswordResetNotification()`:
- Recipient's name
- New password (displayed prominently)
- Instruction to change password after login
- Security reminders
- Reset timestamp and reset-by name

### Key Fix Applied
The original code used a stored procedure `CALL resetBusinessEmployeePassword(...)` which did not exist in the database. This was replaced with a direct SQL statement:

```sql
UPDATE business_employee 
SET employee_password = ?, updated_at = NOW() 
WHERE business_employee_id = ?
```

Also fixed: `bcrypt` was referenced but not imported. Added `import bcrypt from 'bcrypt'` since it is used in the legacy `loginEmployee` function.

---

## Password Encryption

Both features use the same encryption method as the rest of the system:

```
Plain password → encryptData() → AES-256-GCM → stored in DB
                                  (iv:authTag:ciphertext)
```

- Function: `encryptData()` from `services/encryptionService.js`
- Algorithm: **AES-256-GCM**
- Format stored in DB: `iv:authTag:encryptedBase64`

---

## Email Service Summary

| Scenario | Method | Service |
|---|---|---|
| New employee credentials | EmailJS (frontend) | `BUSINESS/SHARED/.../Components/emailService.js` |
| Forgot Password code | EmailJS (frontend) | `ForgotPassword.js` — inline EmailJS |
| Manager resets employee password | **Nodemailer (backend)** | `services/emailService.js` → `sendEmployeePasswordResetNotification()` |

---

## Testing Checklist

### Forgot Password
- [ ] Navigate to `/login`, click **Forgot Password?**
- [ ] Enter a registered email → code email received
- [ ] Enter wrong code → see "4 attempts remaining" message
- [ ] Enter correct code → proceed to password step
- [ ] Set new password → login with new password succeeds
- [ ] Verify DB: encrypted value updated in correct table

### Manager Reset Password
- [ ] Login as Business Manager
- [ ] Go to **Employee Management**
- [ ] Click any employee → click **Reset Password**
- [ ] Confirm → toast shows success
- [ ] Employee receives email with new password
- [ ] Employee can login with new password
- [ ] Test for Web Employee, Inspector, and Collector

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| No reset code email received | EmailJS not configured / quota exceeded | Check EmailJS dashboard |
| "Invalid code" immediately | Code stored before EmailJS sends | Wait for email, check spam |
| Manager reset 500 error | Missing stored procedure | Now uses direct SQL UPDATE |
| Email not sent after manager reset | Nodemailer / SMTP not configured | Emails log to console in dev mode; configure SMTP for production |
| `bcrypt is not defined` error | Missing import in employeeController | Fixed: `import bcrypt from 'bcrypt'` added |
