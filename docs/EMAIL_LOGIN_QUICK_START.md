# Email Login Migration - Quick Start Guide

## Summary of Changes

The system has been updated to use **EMAIL** for login instead of username, with **AES-256-GCM encrypted passwords**.

## Files Modified

### Backend
- `Backend/Backend-Web/controllers/auth/unifiedAuthController.js` - Email-based authentication
- `Backend/Backend-Web/controllers/employees/employeeController.js` - Encrypted password creation
- `Backend/Backend-Web/controllers/mobileStaff/mobileStaffController.js` - Encrypted password creation
- `Backend/Backend-Web/utils/passwordGenerator.js` - **NEW** - Secure password generation

### Frontend
- `Frontend/Web/src/stores/authStore.js` - Changed login(username) to login(email)
- `Frontend/Web/src/components/Admin/Login/LoginPage.vue` - Email input field
- `Frontend/Web/src/components/Admin/Login/LoginPage_Enhanced.js` - Email validation

### Database
- `database/MASTER_EMAIL_LOGIN_MIGRATION.sql` - **NEW** - Complete migration script
- `database/CREATE_USER_PROCEDURES.sql` - **NEW** - User creation procedures
- `database/ADD_LOGIN_PROCEDURES.sql` - Updated login procedures
- `database/seed-encrypted-admin.js` - Admin seeding script

## Migration Steps

### Step 1: Run Database Migration
In MySQL Workbench, execute:
```sql
SOURCE database/MASTER_EMAIL_LOGIN_MIGRATION.sql
```

Or copy and paste the contents of `MASTER_EMAIL_LOGIN_MIGRATION.sql` into MySQL Workbench and run.

### Step 2: Seed Admin User
```powershell
cd database
node seed-encrypted-admin.js
```

**IMPORTANT**: Save the generated password displayed in the console!

Example output:
```
📧 ========================================
🔐 SYSTEM ADMIN CREDENTIALS
========================================
Email: admin@digistall.com
Password: Xk9#mPt@3Qw2
========================================
⚠️  SAVE THIS PASSWORD! It will be encrypted in database.
```

### Step 3: Restart Backend
```powershell
# Stop existing servers
# Then restart:
.\Start-all.ps1
```

### Step 4: Test Login
1. Open web app: http://localhost:5173
2. Login with:
   - **Email**: admin@digistall.com
   - **Password**: (from step 2)

## How It Works

### Login Flow
1. User enters **email** and password
2. Frontend sends `{ email, password }` to backend
3. Backend **encrypts email** to search database
4. Backend finds user and **decrypts stored password**
5. Backend compares plain passwords
6. If match, generates JWT token and returns user data

### Password Storage
- Passwords are **encrypted** with AES-256-GCM (not hashed)
- This allows the system to:
  - Auto-generate passwords for new users
  - Send passwords via email to users
  - Display passwords in admin panel (if needed)

### Encryption Format
```
iv:authTag:encryptedData (all base64)
Example: yK8vX1tP2Qa4...==:nH9mL3kW8Zx...==:xP4cV7bN5Mp...==
```

## Creating New Users

When creating inspectors, collectors, employees, etc:

1. System auto-generates a 12-character secure password
2. Password is encrypted before storing in database
3. **Plain password is returned in API response** for emailing to user

Example response:
```json
{
  "success": true,
  "data": {
    "inspectorId": 5,
    "credentials": {
      "email": "inspector@example.com",
      "password": "Xk9#mPt@3Qw2"
    }
  }
}
```

## Security Notes

### Encryption Key
Located in `Backend/.env`:
```
DATA_ENCRYPTION_KEY=DigiStall2025SecureKeyForEncryption123
```

**CRITICAL**: 
- Keep this key secure
- Never commit to git
- Use different key for production
- If key is lost, all encrypted data is unrecoverable

### Why Encrypt Instead of Hash?

| Feature | Hashing (SHA-256/bcrypt) | Encryption (AES-256-GCM) |
|---------|--------------------------|--------------------------|
| Reversible | ❌ No | ✅ Yes |
| Can email passwords | ❌ No | ✅ Yes |
| Auto-generate passwords | ❌ Limited | ✅ Yes |
| Industry standard for passwords | ✅ Yes | ⚠️ Requires key management |

We use encryption because the system needs to:
1. Auto-generate passwords for new staff
2. Email credentials to users
3. Allow admins to reset and view passwords

## Troubleshooting

### "User not found" error
- Email is encrypted in database
- Check if stored procedure is using `getSystemAdminByEmail` (not `getSystemAdminByUsername`)

### "Invalid password" error
- Ensure password is being **decrypted** (not hashed)
- Check encryption key matches between seed script and backend

### Login form still shows "Username"
- Clear browser cache
- Rebuild frontend: `npm run build`

### Database procedures missing
- Re-run `MASTER_EMAIL_LOGIN_MIGRATION.sql`
