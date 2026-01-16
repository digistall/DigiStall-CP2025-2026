# EMAIL LOGIN WITH FULL ENCRYPTION - COMPLETE IMPLEMENTATION GUIDE

## Overview
This update changes the system to:
1. **Use EMAIL for login** instead of username
2. **Encrypt ALL passwords** with AES-256-GCM (not hash them)
3. **Encrypt system_administrator** personal info
4. **Auto-generate passwords** for all new users
5. **Email passwords** to users after account creation

## Step-by-Step Implementation

### STEP 1: Update Database Schema
Run this SQL file in MySQL Workbench:
```
database/EMAIL_LOGIN_AND_ENCRYPTION_UPDATE.sql
```

This will:
- Drop and recreate tables with `email` as the login field
- Change password columns to store encrypted data (VARCHAR(500))
- Remove username columns
- Add indexes on email fields

### STEP 2: Run Email-Based Login Procedures
Run this SQL file:
```
database/ADD_LOGIN_PROCEDURES.sql
```

This creates stored procedures:
- `getSystemAdminByEmail()`
- `getBusinessOwnerByEmail()`
- `getBusinessManagerByEmail()`
- `getBusinessEmployeeByEmail()`
- `getInspectorByEmail()`
- `getCollectorByEmail()`
- `getStallholderByEmail()`

### STEP 3: Seed Encrypted Admin User
Run the Node.js seed script:
```powershell
cd database
node seed-encrypted-admin.js
```

This will:
- Generate a random secure password
- Encrypt admin email, password, and personal info with AES-256-GCM
- Insert into database
- Display credentials in console (SAVE THEM!)

Expected output:
```
📧 ========================================
🔐 SYSTEM ADMIN CREDENTIALS
========================================
Email: admin@digistall.com
Password: Xk9#mPt@3Qw2
========================================
⚠️  SAVE THIS PASSWORD! It will be encrypted in database.
```

### STEP 4: Update Backend Controllers

The login controller needs these changes:

**File: `Backend/Backend-Web/controllers/auth/unifiedAuthController.js`**

Changes needed:
1. Change request parameter from `username` to `email`
2. Encrypt the incoming email to search database
3. Compare passwords by decrypting stored password (not hashing)
4. Return email in response (not username)

Key code snippet:
```javascript
// Encrypt email to search
const encryptedEmail = encryptData(email);

// Search with encrypted email
const [userRows] = await connection.execute(`CALL getSystemAdminByEmail(?)`, [encryptedEmail]);

// Decrypt stored password and compare
const decryptedStoredPassword = decryptData(user.admin_password);
const isPasswordValid = password === decryptedStoredPassword;
```

### STEP 5: Update Frontend

**File: `Frontend/Web/src/stores/authStore.js`**

Change login function parameter:
```javascript
// OLD:
async function login(username, password) {
  const loginData = { username, password };

// NEW:
async function login(email, password) {
  const loginData = { email, password };
```

**File: `Frontend/Web/src/components/Admin/Login/LoginPage.vue`**

Update form field:
```vue
<!-- OLD: -->
<v-text-field
  v-model="username"
  label="Username"
  placeholder="Enter your username"
/>

<!-- NEW: -->
<v-text-field
  v-model="email"
  label="Email"
  placeholder="Enter your email address"
  type="email"
/>
```

### STEP 6: Add Password Generation Utility

Create a utility for generating random passwords:

**File: `Backend/Backend-Web/utils/passwordGenerator.js`**
```javascript
import crypto from 'crypto';

export function generateSecurePassword(length = 12) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '@#$%&*!';
  const all = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];
  
  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += all[crypto.randomInt(all.length)];
  }
  
  // Shuffle
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}
```

### STEP 7: Update User Creation Functions

When creating new users (inspector, collector, manager, employee), update controllers to:

1. **Generate password**: `const password = generateSecurePassword(12);`
2. **Encrypt password**: `const encryptedPassword = encryptData(password);`
3. **Encrypt email**: `const encryptedEmail = encryptData(email);`
4. **Store in database**: Use encrypted values
5. **Send email**: Email the plain password to the user

Example for creating inspector:
```javascript
import { encryptData } from '../../services/encryptionService.js';
import { generateSecurePassword } from '../../utils/passwordGenerator.js';

export const createInspector = async (req, res) => {
  const { first_name, last_name, email, branch_id } = req.body;
  
  // Generate password
  const plainPassword = generateSecurePassword(12);
  
  // Encrypt all data
  const encryptedFirstName = encryptData(first_name);
  const encryptedLastName = encryptData(last_name);
  const encryptedEmail = encryptData(email);
  const encryptedPassword = encryptData(plainPassword);
  
  // Insert into database
  await connection.execute(
    'CALL createInspector(?, ?, ?, ?, ?, ?)',
    [encryptedFirstName, encryptedLastName, encryptedEmail, encryptedPassword, branch_id, managerId]
  );
  
  // Send email with credentials
  await sendWelcomeEmail(email, {
    name: first_name,
    email: email,
    password: plainPassword // Send plain password via email
  });
  
  // Return success (don't return password in API response)
  res.json({ success: true, message: 'Inspector created. Login details sent via email.' });
};
```

### STEP 8: Testing

1. **Test System Admin Login:**
   ```
   Email: admin@digistall.com
   Password: (from seed script output)
   ```

2. **Create a test user:**
   - Create inspector/collector/manager via admin panel
   - Check email for auto-generated password
   - Try logging in with email and password

3. **Verify encryption:**
   - Check database - all emails and passwords should be encrypted (format: `iv:authTag:data`)
   - Login should work by decrypting and comparing

## Security Notes

### Why Encrypt Passwords Instead of Hashing?

**Normal systems**: Hash passwords (one-way) → Can't recover original
**This system**: Encrypt passwords (two-way) → Can recover and email to users

This is needed because:
1. System admin creates accounts for staff
2. Auto-generates passwords
3. Must email passwords to users
4. Users can login with emailed password

### Encryption Format
All encrypted data uses AES-256-GCM:
```
format: iv:authTag:encryptedData (all base64)
example: "yK8vX1tP2Qa4...==:nH9mL3kW8Zx...==:xP4cV7bN5Mp...=="
```

### Key Management
Encryption key is stored in `.env`:
```
DATA_ENCRYPTION_KEY=DigiStall2025SecureKeyForEncryption123
```

**IMPORTANT**: 
- Keep this key secure
- Never commit to git
- Use different key for production
- If key is lost, all encrypted data is unrecoverable

## Troubleshooting

### "Cannot find email" error
- Email is encrypted in database
- Must encrypt search email: `encryptData(email)`
- Check if stored procedure is using correct parameter

### "Invalid password" error
- Decrypt stored password: `decryptData(encryptedPassword)`
- Compare with plain password: `plainPassword === decryptedPassword`
- Don't use bcrypt or hash comparison

### "Illegal mix of collations" error
- Remove COLLATE clauses from stored procedures
- Email comparison is exact match on encrypted strings

## Migration Path

If you have existing users with hashed passwords:

1. **Option A - Force password reset:**
   - Update all passwords to NULL
   - Send password reset emails
   - Users set new password (will be encrypted)

2. **Option B - Gradual migration:**
   - Check if password is hashed or encrypted
   - If hashed: Force user to reset
   - If encrypted: Use normal login
   - Eventually all passwords will be encrypted

## Complete File Checklist

✅ Database:
- [ ] EMAIL_LOGIN_AND_ENCRYPTION_UPDATE.sql
- [ ] ADD_LOGIN_PROCEDURES.sql
- [ ] seed-encrypted-admin.js

✅ Backend:
- [ ] unifiedAuthController.js (updated for email login)
- [ ] passwordGenerator.js (new utility)
- [ ] All create user controllers updated

✅ Frontend:
- [ ] authStore.js (email parameter)
- [ ] LoginPage.vue (email input)
- [ ] LoginPage_Enhanced.js (email variable)

✅ Testing:
- [ ] Admin login works
- [ ] Can create new users
- [ ] Auto-generated passwords work
- [ ] Email sending works
