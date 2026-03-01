# Database Reset Guide - AES-256-GCM Encryption Implementation

## Overview

This guide explains how to completely reset the DigitalOcean MySQL database with clean tables and stored procedures that support proper AES-256-GCM encryption.

**IMPORTANT**: All encryption/decryption is now handled in **Node.js**, NOT in MySQL stored procedures. This provides proper AES-256-GCM encryption with authentication.

## Encryption Details

### Algorithm
- **AES-256-GCM** (Authenticated Encryption with Associated Data)
- **IV Length**: 16 bytes (randomly generated for each encryption)
- **Auth Tag Length**: 16 bytes
- **Key Length**: 32 bytes (256 bits)

### Data Format
Encrypted data is stored in format:
```
iv:authTag:encryptedData
```
All three parts are base64 encoded.

### Key Derivation
The encryption key is derived from the environment variable `DATA_ENCRYPTION_KEY`:
```javascript
crypto.scryptSync(key, 'digistall-salt-v2', 32)
```

### Environment Variable
Add to your `.env` file:
```
DATA_ENCRYPTION_KEY=DigiStall2025SecureKeyForEncryption123
```

## Encrypted Fields

The following fields are encrypted for each entity type:

### Applicant
- applicant_full_name
- applicant_address
- applicant_contact_number
- email_address

### Stallholder
- stallholder_name
- first_name, middle_name, last_name
- contact_number
- email
- address

### Inspector & Collector
- first_name
- last_name
- email
- contact_no

### Employee & Manager
- first_name
- last_name
- email
- contact_no / phone_number
- address

### Spouse
- spouse_full_name
- spouse_contact_number
- spouse_occupation

---

## Database Reset Steps

### Step 1: Backup Current Data (Optional)
If you need to preserve data, export it first:
```bash
mysqldump -h dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -P 25060 -u doadmin -p naga_stall > backup_before_reset.sql
```

### Step 2: Run the SQL Files in Order

Connect to your DigitalOcean MySQL database and run these files in order:

#### Option A: Using MySQL CLI
```bash
# 1. Run the clean schema (drops old tables, creates new ones)
mysql -h dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -P 25060 -u doadmin -p naga_stall < database/CLEAN_DATABASE_SCHEMA.sql

# 2. Run stored procedures Part 1 (Inspector, Collector, Employee, Manager)
mysql -h dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -P 25060 -u doadmin -p naga_stall < database/STORED_PROCEDURES_PART1.sql

# 3. Run stored procedures Part 2 (Applicant, Stallholder, Application)
mysql -h dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -P 25060 -u doadmin -p naga_stall < database/STORED_PROCEDURES_PART2.sql

# 4. Run stored procedures Part 3 (Branch, Stall, Payment, Violation)
mysql -h dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -P 25060 -u doadmin -p naga_stall < database/STORED_PROCEDURES_PART3.sql

# 5. Run master reset (seed data, events, views)
mysql -h dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -P 25060 -u doadmin -p naga_stall < database/MASTER_DATABASE_RESET.sql
```

#### Option B: Using MySQL Workbench
1. Connect to the DigitalOcean database
2. Open and run each file in order:
   - `database/CLEAN_DATABASE_SCHEMA.sql`
   - `database/STORED_PROCEDURES_PART1.sql`
   - `database/STORED_PROCEDURES_PART2.sql`
   - `database/STORED_PROCEDURES_PART3.sql`
   - `database/MASTER_DATABASE_RESET.sql`

### Step 3: Verify the Reset

After running all files, verify:

```sql
-- Check tables were created
SHOW TABLES;

-- Check procedures were created
SHOW PROCEDURE STATUS WHERE Db = 'naga_stall';

-- Check initial data
SELECT * FROM system_administrator;
SELECT * FROM violation;
SELECT * FROM subscription_plans;
```

---

## Default Login Credentials

After reset, the system administrator login is:
- **Username**: admin
- **Password**: admin123

---

## How Encryption Works

### When Saving Data (POST/PUT)
The Node.js controller encrypts sensitive fields BEFORE calling the stored procedure:

```javascript
import { encryptData } from '../../services/encryptionService.js';

// Encrypt before saving
const encryptedFirstName = encryptData(firstName);  // e.g., "abc123:xyz456:encrypted123"
const encryptedEmail = encryptData(email);

// Call stored procedure with encrypted data
await connection.execute(
    'CALL createInspector(?, ?, ?, ?, ?, ?)',
    [username, hashedPassword, encryptedFirstName, encryptedLastName, encryptedEmail, encryptedPhone]
);
```

### When Retrieving Data (GET)
The Node.js controller decrypts sensitive fields AFTER getting data from the stored procedure:

```javascript
import { decryptInspectors } from '../../services/encryptionService.js';

// Get encrypted data from database
const [result] = await connection.execute('CALL getAllInspectors()');
const inspectors = result[0] || [];

// Decrypt before returning to frontend
const decryptedInspectors = decryptInspectors(inspectors);

res.json({
    success: true,
    data: decryptedInspectors  // Names, emails, etc. are now readable
});
```

---

## Updated Controllers

The following controllers have been updated to use Node.js encryption:

1. **employeeController.js** - Employee CRUD with encryption
2. **mobileStaffController.js** - Inspector and Collector CRUD with encryption
3. **stallholderController.js** - Stallholder CRUD with encryption
4. **applicantController.js** - Applicant registration with encryption

---

## Encryption Service Location

The encryption service is located at:
- `Backend/Backend-Web/services/encryptionService.js`
- `Backend/Backend-Mobile/services/encryptionService.js`

Both files are identical and use the same encryption key derivation.

---

## Files Created for Database Reset

| File | Description |
|------|-------------|
| `database/CLEAN_DATABASE_SCHEMA.sql` | All 64 tables with clean structure |
| `database/STORED_PROCEDURES_PART1.sql` | Inspector, Collector, Employee, Manager procedures |
| `database/STORED_PROCEDURES_PART2.sql` | Applicant, Stallholder, Application procedures |
| `database/STORED_PROCEDURES_PART3.sql` | Branch, Stall, Payment, Violation procedures |
| `database/MASTER_DATABASE_RESET.sql` | Cleanup, seed data, events, views |
| `database/RUN_COMPLETE_RESET.sql` | Instructions file |

---

## Important Notes

1. **Passwords are NOT encrypted** - They use SHA-256 hashing (one-way)
2. **Only PII (Personally Identifiable Information) is encrypted** - Names, addresses, emails, phone numbers
3. **Encrypted data is stored as VARCHAR(500)** - To accommodate the longer encrypted strings
4. **The encryption is transparent to the frontend** - Frontend receives decrypted data
5. **Same encryption key must be used across all environments** - Or data cannot be decrypted

---

## Troubleshooting

### "Data not encrypted or different format"
This means the data in the database doesn't match the expected encryption format. It could be:
- Plain text data (before encryption was implemented)
- Data encrypted with a different key
- Corrupted data

The decryption function will return the data as-is if it can't decrypt it.

### Connection Issues
Make sure your `.env` file has the correct database connection details:
```
DB_HOST=dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com
DB_PORT=25060
DB_USER=doadmin
DB_PASSWORD=your_password
DB_NAME=naga_stall
DATA_ENCRYPTION_KEY=DigiStall2025SecureKeyForEncryption123
```
