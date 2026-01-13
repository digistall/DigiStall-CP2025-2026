# VENDOR COMPONENT - QUICK START GUIDE

**Date:** January 10, 2026  
**Purpose:** Quick reference for testing and using the new vendor component

---

## 🚀 QUICK START - APPLY DATABASE MIGRATION

### Step 1: Run the Migration

Open your MySQL client or terminal and run:

```bash
# Navigate to project directory
cd C:\Users\Giuseppe\Desktop\DigiStall-CP2025-2026

# Connect to your database (update credentials)
mysql -u root -p naga_stall_digitalocean

# Run the migration file
source database/migrations/404_vendor_relations_procedures.sql;
```

### Step 2: Verify Procedures Created

```sql
-- Check if all 5 procedures exist
SHOW PROCEDURE STATUS WHERE Db = 'naga_stall_digitalocean'
AND Name LIKE '%VendorWithRelations%';

-- Expected output:
-- createVendorWithRelations
-- updateVendorWithRelations
-- getVendorWithRelations
-- getAllVendorsWithRelations
-- deleteVendorWithRelations
```

---

## 🧪 TESTING THE IMPLEMENTATION

### Test 1: Create Vendor with All Relations

Use the web app or test via API:

**API Endpoint:** `POST /api/vendors`

**Sample Payload:**

```json
{
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "middleName": "Santos",
  "suffix": "Jr.",
  "contactNumber": "09171234567",
  "email": "juan.delacruz@example.com",
  "birthdate": "1985-05-15",
  "gender": "Male",
  "address": "123 Main Street, Naga City",
  "vendorIdentifier": "VND-001",
  "status": "Active",

  "spouseFullName": "Maria Dela Cruz",
  "spouseAge": 38,
  "spouseBirthdate": "1987-08-20",
  "spouseEducation": "College Graduate",
  "spouseContact": "09187654321",
  "spouseOccupation": "Teacher",

  "childFullName": "Jose Dela Cruz",
  "childAge": 10,
  "childBirthdate": "2015-03-10",

  "businessName": "Juan's Tindahan",
  "businessType": "Retail",
  "businessDescription": "Selling groceries and household items",
  "vendingTimeStart": "08:00",
  "vendingTimeEnd": "18:00",

  "locationName": "Market Area 1"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Vendor created successfully",
  "data": {
    "vendorId": 1,
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "businessName": "Juan's Tindahan",
    "locationName": "Market Area 1"
  }
}
```

### Test 2: Create Vendor with Minimal Data (Only Required Fields)

```json
{
  "firstName": "Pedro",
  "lastName": "Santos"
}
```

### Test 3: Get All Vendors

**API Endpoint:** `GET /api/vendors`

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "vendor_id": 1,
      "first_name": "Juan",
      "last_name": "Dela Cruz",
      "middle_name": "Santos",
      "suffix": "Jr.",
      "contact_number": "09171234567",
      "email": "juan.delacruz@example.com",
      "status": "Active",
      "business_name": "Juan's Tindahan",
      "location_name": "Market Area 1",
      "created_at": "2026-01-10T10:00:00.000Z",
      "updated_at": "2026-01-10T10:00:00.000Z"
    }
  ]
}
```

### Test 4: Get Single Vendor with All Relations

**API Endpoint:** `GET /api/vendors/:id`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "vendor_id": 1,
    "first_name": "Juan",
    "last_name": "Dela Cruz",
    "middle_name": "Santos",
    "suffix": "Jr.",
    "contact_number": "09171234567",
    "email": "juan.delacruz@example.com",
    "birthdate": "1985-05-15",
    "gender": "Male",
    "address": "123 Main Street, Naga City",
    "vendor_identifier": "VND-001",
    "status": "Active",
    "created_at": "2026-01-10T10:00:00.000Z",
    "updated_at": "2026-01-10T10:00:00.000Z",

    "vendor_spouse_id": 1,
    "spouse_full_name": "Maria Dela Cruz",
    "spouse_age": 38,
    "spouse_birthdate": "1987-08-20",
    "spouse_education": "College Graduate",
    "spouse_contact": "09187654321",
    "spouse_occupation": "Teacher",

    "vendor_child_id": 1,
    "child_full_name": "Jose Dela Cruz",
    "child_age": 10,
    "child_birthdate": "2015-03-10",

    "vendor_business_id": 1,
    "business_name": "Juan's Tindahan",
    "business_type": "Retail",
    "business_description": "Selling groceries and household items",
    "vending_time_start": "08:00",
    "vending_time_end": "18:00",

    "assigned_location_id": 1,
    "location_name": "Market Area 1"
  }
}
```

### Test 5: Update Vendor

**API Endpoint:** `PUT /api/vendors/:id`

**Sample Payload (Update business info only):**

```json
{
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "middleName": "Santos",
  "suffix": "Jr.",
  "contactNumber": "09171234567",
  "email": "juan.delacruz@example.com",
  "birthdate": "1985-05-15",
  "gender": "Male",
  "address": "123 Main Street, Naga City",
  "vendorIdentifier": "VND-001",
  "status": "Active",

  "businessName": "Juan's Super Store",
  "businessType": "Retail",
  "businessDescription": "Expanded to include electronics",
  "vendingTimeStart": "07:00",
  "vendingTimeEnd": "20:00",

  "locationName": "Market Area 2"
}
```

### Test 6: Delete Vendor (Soft Delete)

**API Endpoint:** `DELETE /api/vendors/:id`

**Expected Behavior:**

- Vendor status changed to "Inactive"
- Related records (spouse, child, business) preserved
- Vendor still appears in database but marked as Inactive

---

## 🎨 USING THE WEB INTERFACE

### Create New Vendor

1. Navigate to `/app/vendors`
2. Click "Add Vendor" button
3. Fill in the form with vendor information
   - **Page 1:** Personal info, spouse info, child info
   - **Page 2:** Business info, location, documents
4. Click "Save"
5. Vendor list automatically refreshes

### Edit Existing Vendor

1. Click the edit icon on any vendor row
2. Edit dialog opens with all existing data populated
3. Modify any fields
4. Click "Update"
5. Changes saved and list refreshes

### View Vendor Details

1. Click on vendor name or view icon
2. Details dialog shows:
   - Personal information
   - Spouse information (if available)
   - Child information (if available)
   - Business details
   - Assigned location

---

## 🔍 TROUBLESHOOTING

### Issue: "Procedure does not exist"

**Solution:** Run the migration file again

```bash
source database/migrations/404_vendor_relations_procedures.sql;
```

### Issue: "Missing required fields"

**Solution:** Only firstName and lastName are required. All other fields are optional.

### Issue: "Email already exists"

**Solution:** Each vendor must have a unique email address. Use a different email or leave it blank.

### Issue: "Location not showing"

**Solution:** Make sure locationName is provided. The system will create the location if it doesn't exist.

### Issue: "Spouse/Child data not saving"

**Solution:** Check that you're providing at least the full_name field for spouse/child. Empty strings will be treated as NULL.

---

## 📊 DATABASE QUERY EXAMPLES

### Check Vendor and Relations

```sql
-- Get vendor with all relations
SELECT
    v.vendor_id,
    v.first_name,
    v.last_name,
    vs.full_name AS spouse,
    vc.full_name AS child,
    vb.business_name,
    al.location_name
FROM vendor v
LEFT JOIN vendor_spouse vs ON v.vendor_spouse_id = vs.vendor_spouse_id
LEFT JOIN vendor_child vc ON v.vendor_child_id = vc.vendor_child_id
LEFT JOIN vendor_business vb ON v.vendor_business_id = vb.vendor_business_id
LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
WHERE v.vendor_id = 1;
```

### Count Vendors by Location

```sql
SELECT
    al.location_name,
    COUNT(v.vendor_id) AS vendor_count
FROM assigned_location al
LEFT JOIN vendor v ON v.assigned_location_id = al.assigned_location_id
GROUP BY al.location_name
ORDER BY vendor_count DESC;
```

### Find Vendors Without Business

```sql
SELECT
    v.vendor_id,
    v.first_name,
    v.last_name,
    v.email
FROM vendor v
WHERE v.vendor_business_id IS NULL
AND v.status = 'Active';
```

---

## ✅ VERIFICATION CHECKLIST

Before going to production, verify:

- [ ] All 5 stored procedures exist in database
- [ ] Can create vendor with all fields
- [ ] Can create vendor with minimal fields (firstName, lastName only)
- [ ] Can update vendor information
- [ ] Can view vendor list
- [ ] Can view single vendor with all relations
- [ ] Can soft delete vendor
- [ ] Location deduplication works (same location name reused)
- [ ] Frontend form validation works
- [ ] Error messages display correctly
- [ ] No console errors in browser
- [ ] No SQL errors in backend logs

---

## 📱 FRONTEND FORM FIELDS

### Personal Information Tab

- First Name\* (required)
- Last Name\* (required)
- Middle Name
- Suffix
- Phone Number
- Email
- Birthdate
- Gender
- Address
- Vendor ID

### Spouse Information Section

- Spouse Full Name
- Spouse Age
- Spouse Birthdate
- Spouse Education
- Spouse Contact Number
- Spouse Occupation

### Child Information Section

- Child Full Name
- Child Age
- Child Birthdate

### Business Information Tab

- Business Name
- Business Type
- Business Description
- Vending Time Start
- Vending Time End
- Location Name

### Documents Tab (Optional)

- Barangay Clearance
- Cedula
- Association ID
- Voter's ID
- Picture
- Health Card

---

## 🔧 CONFIGURATION

### Backend API Base URL

Configured in: `Frontend/Web/src/components/Admin/Vendors/Vendors.js`

```javascript
apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:3001";
```

### Database Connection

Configured in: `Backend/Backend-Web/config/database.js`

### Authentication

All vendor API endpoints require authentication token:

```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

---

## 📞 SUPPORT

For issues or questions:

1. Check the console for error messages
2. Check backend logs for SQL errors
3. Verify stored procedures exist
4. Review [VENDOR_COMPONENT_ANALYSIS_LOG.md](VENDOR_COMPONENT_ANALYSIS_LOG.md)
5. Review [VENDOR_COMPONENT_IMPLEMENTATION_SUMMARY.md](VENDOR_COMPONENT_IMPLEMENTATION_SUMMARY.md)

---

**Last Updated:** January 10, 2026
