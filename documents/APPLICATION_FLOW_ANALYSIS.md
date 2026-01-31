# DigiStall - Application Flow Analysis & Fix Guide

## 🎯 Summary of Issues Found

After analyzing your entire codebase, I've identified the **root cause** of why some credentials don't work properly in the mobile app:

### The Problem
The system has **two separate processes that are NOT connected**:

1. **Approve Applicant** → Creates `credential` record (for mobile login)
2. **Create Stallholder** → Creates `stallholder` record (for stall ownership)

**These two processes are independent!** When you approve an applicant, they get login credentials, but they are NOT automatically assigned to a stall. The `stallholder` record (which links applicant to stall) must be created separately.

---

## 📊 Current Data State in Your Database

### Credential Table (Who can LOGIN to mobile app):
```
registrationid | applicant_id | user_name
9              | 12           | 25-59663
12             | 34           | 25-24154
13             | 33           | 25-13962
```

### Stallholder Table (Who OWNS a stall):
```
stallholder_id | applicant_id | stallholder_name   | stall_id
13             | 12           | Maria Santos       | 54
14             | 33           | Roberto Cruz       | 57
15             | 34           | Elena Reyes        | 58
16             | 35           | Carlos Mendoza     | 55  ❌ NO CREDENTIALS!
17             | 36           | Ana Villanueva     | 91  ❌ NO CREDENTIALS!
18             | 37           | Fernando Garcia    | 93  ❌ NO CREDENTIALS!
```

### The Mismatch:
- **applicant_id 12, 33, 34**: Have BOTH credentials AND stallholder records ✅ WORKS
- **applicant_id 35, 36, 37**: Have stallholder records BUT NO credentials ❌ CAN'T LOGIN

---

## 🔄 Correct Application Flow

### FLOW 1: Fixed Stall Application (Landing Page)

```
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 1: Applicant applies for FIXED stall on Landing Page           │
│ ────────────────────────────────────────────────────────────────────│
│ • Creates `applicant` record                                         │
│ • Creates `application` record (status: Pending)                     │
│ • Stall is still available (waiting for approval)                    │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 2: Manager/Employee APPROVES application                        │
│ ────────────────────────────────────────────────────────────────────│
│ • Updates `application` status to 'Approved'                         │
│ • Creates `credential` record (username/password)                    │
│ • Sends credentials to applicant (email/SMS)                         │
│ • ⚠️ At this point, applicant CAN LOGIN but DOESN'T OWN STALL YET   │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 3: Applicant PAYS (Onsite payment to Manager/Employee)          │
│ ────────────────────────────────────────────────────────────────────│
│ • Creates `payments` record                                          │
│ • ⚠️ This is where STALLHOLDER record should be created!            │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 4: System creates STALLHOLDER record ← MISSING STEP!            │
│ ────────────────────────────────────────────────────────────────────│
│ • Creates `stallholder` record linking applicant to stall            │
│ • Updates `stall` status to 'Occupied', is_available = 0             │
│ • NOW applicant is a STALLHOLDER and OWNS the stall                  │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 5: Stallholder submits documents via Mobile App                 │
│ ────────────────────────────────────────────────────────────────────│
│ • Creates `stallholder_documents` records                            │
│ • Manager verifies documents                                         │
└──────────────────────────────────────────────────────────────────────┘
```

### FLOW 2: Raffle/Auction Stall (Mobile App)

```
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 1: Applicant applies for GENERAL application (no specific stall)│
│ ────────────────────────────────────────────────────────────────────│
│ • Creates `applicant` record                                         │
│ • NO application record yet (just registering interest)              │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 2: Manager APPROVES general application                         │
│ ────────────────────────────────────────────────────────────────────│
│ • Creates `credential` record                                        │
│ • Applicant can now LOGIN to mobile app                              │
│ • Can browse LIVE/AUCTION stalls                                     │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 3: Applicant browses and applies for Raffle/Auction stalls      │
│ ────────────────────────────────────────────────────────────────────│
│ • Creates `application` record                                       │
│ • For Raffle: Creates `raffle_participants` record                   │
│ • For Auction: Creates `auction_bids` record                         │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 4: Manager selects WINNER                                       │
│ ────────────────────────────────────────────────────────────────────│
│ • For Raffle: Runs raffle, selects winner                            │
│ • For Auction: Highest bidder wins                                   │
│ • Updates winner's application status to 'Approved'                  │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 5: Winner PAYS (Onsite)                                         │
│ ────────────────────────────────────────────────────────────────────│
│ • Creates `payments` record                                          │
│ • ⚠️ Creates `stallholder` record ← THIS IS CRUCIAL                 │
└──────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 6: Stallholder submits documents                                │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ What Needs to Be Fixed

### Option 1: Quick Database Fix (Run the SQL Migration)

Run `database/migrations/fix_credentials_stallholder_mismatch.sql` to:
1. Add missing credentials for stallholders who don't have them
2. Verify data consistency

### Option 2: Fix the Application Workflow (Recommended)

The system should automatically create the `stallholder` record when:
- A payment is recorded for an approved application
- OR when the manager manually assigns a stall to an approved applicant

### Current Code Gap:

In `Backend/Backend-Web/controllers/applicants/applicantsComponents/approveApplicant.js`:
```javascript
// Current behavior:
// 1. Creates credential record ✅
// 2. Updates application status to 'Approved' ✅
// 3. Does NOT create stallholder record ❌
```

The `stallholder` record must be created AFTER payment is received.

---

## 📝 Mobile App Login Check

The mobile login (`Backend/Backend-Mobile/controllers/login/loginController.js`) checks:
1. Does user have valid credentials? (credential table)
2. What stalls can they apply for? (stall table)
3. What applications do they have? (application table)

But the **Documents screen** in mobile app checks:
```javascript
// From stallholderDocumentController.js
WHERE sh.applicant_id = ? AND sh.contract_status = 'Active'
```

This means it looks for the `stallholder` record. If no stallholder record exists, the user sees "No stalls owned".

---

## ✅ Solution Summary

1. **Run the database migration** to fix existing data
2. **The workflow should be**:
   - Approve Application → Create Credentials → User can LOGIN
   - Receive Payment → Create Stallholder Record → User OWNS stall
3. **Use the Stallholders section** in web admin to manually create stallholder records for approved applicants who have paid

---

## 🎯 How to Test

After running the migration:

1. Login to mobile app with credentials:
   - `25-59663` (applicant_id 12) - Should show stall 54
   - `25-13962` (applicant_id 33) - Should show stall 57
   - `25-24154` (applicant_id 34) - Should show stall 58

2. New credentials created by migration:
   - applicant_id 35, 36, 37 will have new usernames
   - Default password: `DigiStall2025!`

