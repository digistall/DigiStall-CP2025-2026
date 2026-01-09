# DigiStall Security & Database Migration Guide

## Overview

This guide covers the major security and database architectural improvements made to the DigiStall system:

1. **Collector 500 Error Fix** - Fixed the dashboard collector endpoint
2. **100% Stored Procedures** - Converted all raw SQL queries to stored procedures
3. **Data Encryption** - Added AES-256-GCM encryption for sensitive user data

---

## Part 1: Collector 500 Error Fix

### Problem
The Dashboard was returning a 500 error when accessing `/api/mobile-staff/collectors`.

### Solution
Created missing collector stored procedures and table definitions.

### How to Apply
```sql
-- Run this SQL file on your database
mysql -u your_user -p your_database < database/FIX_COLLECTOR_500_ERROR.sql
```

---

## Part 2: Stored Procedure Migration Files

### New Migration Files Created

| File | Purpose |
|------|---------|
| `400_sp_auth_and_user_management.sql` | Authentication, admin, branch manager, area, complaint, payment SPs |
| `401_sp_applicants_participants.sql` | Applicant, participant, stall management SPs |
| `402_sp_raffle_auction.sql` | Raffle, auction, live stall data SPs |
| `403_sp_branch_landing.sql` | Branch, floor, section, stall images, landing page SPs |
| `404_sp_encryption_support.sql` | Encrypted data handling, column size adjustments |
| `405_sp_remaining_crud.sql` | All remaining CRUD operations |

### Run Order
```bash
# Run migrations in order
mysql -u your_user -p your_database < database/migrations/400_sp_auth_and_user_management.sql
mysql -u your_user -p your_database < database/migrations/401_sp_applicants_participants.sql
mysql -u your_user -p your_database < database/migrations/402_sp_raffle_auction.sql
mysql -u your_user -p your_database < database/migrations/403_sp_branch_landing.sql
mysql -u your_user -p your_database < database/migrations/404_sp_encryption_support.sql
mysql -u your_user -p your_database < database/migrations/405_sp_remaining_crud.sql
```

### Or run all at once:
```bash
cd database/migrations
for file in 400*.sql 401*.sql 402*.sql 403*.sql 404*.sql 405*.sql; do
  echo "Running $file..."
  mysql -u your_user -p your_database < "$file"
done
```

---

## Part 3: Data Encryption System

### Files Created

**Backend-Web:**
- `Backend-Web/services/encryptionService.js` - Main encryption service
- `Backend-Web/middleware/dataProtection.js` - Auto-decrypt middleware

**Backend-Mobile:**
- `Backend-Mobile/services/encryptionService.js` - Mobile encryption service
- `Backend-Mobile/middleware/dataProtection.js` - Mobile auto-decrypt middleware

### Encryption Algorithm
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key**: 256-bit derived from ENCRYPTION_KEY environment variable
- **IV**: Random 16-byte initialization vector per encryption
- **Auth Tag**: 16-byte authentication tag for integrity

### Sensitive Fields Encrypted

| Entity | Encrypted Fields |
|--------|-----------------|
| Applicant | first_name, middle_name, last_name, full_name, contact_number, address, birthdate, email |
| Stallholder | stallholder_name, contact_number, email, address, business_name |
| Inspector | first_name, last_name, email, contact_no |
| Collector | first_name, last_name, email, contact_no |
| Branch Manager | first_name, last_name, email, contact_number, address |
| Spouse | spouse_full_name, spouse_contact_number, spouse_occupation |
| Business Info | business_name, business_description, tin_number |
| Participant | participant_name, contact_number, email, address |

### Environment Variables Required

Add these to your `.env` file:
```env
# Encryption key for AES-256 (must be at least 32 characters)
ENCRYPTION_KEY=your-super-secret-encryption-key-must-be-32-chars-minimum

# Optional: Set to 'true' to enable encryption (default: true)
ENABLE_ENCRYPTION=true
```

### How Encryption Works

**Encryption (on data save):**
```javascript
const encryptionService = require('./services/encryptionService');

// Encrypt individual field
const encryptedEmail = encryptionService.encryptData('user@example.com');

// Encrypt entire object
const encryptedApplicant = encryptionService.encryptObjectFields(applicantData, 'applicant');
```

**Decryption (on data read):**
```javascript
// Decrypt individual field
const decryptedEmail = encryptionService.decryptData(encryptedEmail);

// Decrypt entire object
const decryptedApplicant = encryptionService.decryptObjectFields(encryptedData, 'applicant');

// Check if data is encrypted
if (encryptionService.isEncrypted(data)) {
    // Handle encrypted data
}
```

**Automatic Decryption Middleware:**
```javascript
// In your server.js or app.js
const { decryptResponseMiddleware } = require('./middleware/dataProtection');

// Apply globally (decrypts all API responses)
app.use(decryptResponseMiddleware);
```

---

## Part 4: Updated Controllers

### Controllers Updated to Use Stored Procedures

| File | Changes |
|------|---------|
| `mobileStaffAuthController.js` | Uses sp_getInspectorByUsername, sp_getCollectorByUsername, sp_createStaffSession, etc. |
| `getCurrentUser.js` | Uses sp_getAdminById, sp_getBranchManagerForCurrentUser |
| `getBranchManagerById.js` | Uses sp_getBranchManagerById |
| `getAllParticipants.js` | Uses sp_getAllParticipants |
| `declineApplicant.js` | Uses sp_deleteApplicantCascade |
| `credentialsController.js` | Uses sp_checkUsernameExists, sp_createCredential, sp_getAllCredentials |

---

## Part 5: Integration Guide

### Step 1: Apply Database Migrations
```bash
# First, backup your database!
mysqldump -u your_user -p your_database > backup_before_migration.sql

# Run the collector fix
mysql -u your_user -p your_database < database/FIX_COLLECTOR_500_ERROR.sql

# Run all stored procedure migrations
mysql -u your_user -p your_database < database/migrations/400_sp_auth_and_user_management.sql
mysql -u your_user -p your_database < database/migrations/401_sp_applicants_participants.sql
mysql -u your_user -p your_database < database/migrations/402_sp_raffle_auction.sql
mysql -u your_user -p your_database < database/migrations/403_sp_branch_landing.sql
mysql -u your_user -p your_database < database/migrations/404_sp_encryption_support.sql
mysql -u your_user -p your_database < database/migrations/405_sp_remaining_crud.sql
```

### Step 2: Update Environment Variables
```env
# Add to .env in both Backend-Web and Backend-Mobile
ENCRYPTION_KEY=your-super-secret-encryption-key-must-be-32-chars-minimum
```

### Step 3: Apply Middleware (Optional - for automatic decryption)
```javascript
// In Backend-Web/server.js
const { decryptResponseMiddleware } = require('./middleware/dataProtection');
app.use(decryptResponseMiddleware);

// In Backend-Mobile/server.js
const { decryptResponseMiddleware } = require('./middleware/dataProtection');
app.use(decryptResponseMiddleware);
```

### Step 4: Restart Services
```bash
# Using Docker
docker-compose restart

# Or manually
pm2 restart all

# Or using the PowerShell script
.\Start-all.ps1
```

---

## Stored Procedures Reference

### Authentication SPs
- `sp_getInspectorByUsername(username)`
- `sp_getCollectorByUsername(username)`
- `sp_getMobileUserByUsername(username)`
- `sp_createStaffSession(...)`
- `sp_endStaffSession(session_id)`
- `sp_updateStaffSessionActivity(session_id)`

### Admin/Manager SPs
- `sp_getAdminById(admin_id)`
- `sp_getBranchManagerById(manager_id)`
- `sp_getAllBranchManagers()`
- `sp_createBranchManager(...)`

### Applicant/Stallholder SPs
- `sp_getApplicantById(applicant_id)`
- `sp_getApplicantWithApplicationDetails(applicant_id)`
- `sp_deleteApplicantCascade(applicant_id)`
- `sp_createStallholder(...)`
- `sp_getStallholderByApplicantId(applicant_id)`

### Credential SPs
- `sp_checkUsernameExists(username)`
- `sp_createCredential(applicant_id, username, password_hash)`
- `sp_getAllCredentials()`
- `sp_getCredentialWithApplicant(username)`

### Branch/Stall SPs
- `sp_getAllBranches()`
- `sp_getBranchDetails(branch_id)`
- `sp_getFloorsByBranch(branch_id)`
- `sp_getSectionsByFloor(floor_id)`
- `sp_getAvailableStallsForImport(branch_id)`

### Payment/Complaint SPs
- `sp_createPayment(...)`
- `sp_getPaymentsByStallholder(stallholder_id)`
- `sp_createComplaint(...)`
- `sp_getComplaintsByStallholder(stallholder_id)`
- `sp_updateComplaintStatus(...)`

### Raffle/Auction SPs
- `sp_getRaffleById(raffle_id)`
- `sp_createRaffle(...)`
- `sp_selectRaffleWinner(raffle_id, winner_id)`
- `sp_getAuctionById(auction_id)`
- `sp_placeBid(...)`

---

## Troubleshooting

### Collector 500 Error Still Occurring
1. Verify the `FIX_COLLECTOR_500_ERROR.sql` was executed successfully
2. Check if the collector table exists: `SHOW TABLES LIKE 'collector'`
3. Verify stored procedures exist: `SHOW PROCEDURE STATUS WHERE Name LIKE 'sp_get%Collector%'`

### Encryption Not Working
1. Verify `ENCRYPTION_KEY` is set in `.env` (minimum 32 characters)
2. Check if encryption service loads without errors
3. Test manually: `const enc = require('./services/encryptionService'); console.log(enc.encryptData('test'));`

### Stored Procedure Errors
1. Check MySQL version (requires 5.7+)
2. Verify user has `CREATE ROUTINE` privilege
3. Check error log: `SHOW PROCEDURE STATUS WHERE Name = 'sp_name_here'`

---

## Notes

- All passwords are hashed with bcrypt (not encrypted)
- Encryption is reversible (for display), hashing is one-way (for passwords)
- Column sizes have been increased to accommodate encrypted data (encrypted data is ~3x larger)
- The system will work with both encrypted and unencrypted data during migration period
