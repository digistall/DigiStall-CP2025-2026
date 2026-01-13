# VENDOR COMPONENT ANALYSIS LOG

**Date:** January 10, 2026  
**Component:** Vendor Management System  
**Branch:** Web/Admin/Feature-Vendor

---

## 📊 DATABASE STRUCTURE ANALYSIS

Based on the provided database schema, the vendor system now includes **5 related tables** with normalized data structure:

### 1. **vendor** (Main Table)

- `vendor_id` (PK)
- Personal Info: `first_name`, `last_name`, `middle_name`, `suffix`
- Contact: `contact_number`, `email`, `birthdate`, `gender`, `address`
- Identifiers: `vendor_identifier`
- Status: `status` (enum: 'Active', 'Inactive', 'Suspended')
- Foreign Keys: `vendor_spouse_id`, `vendor_child_id`, `vendor_business_id`, `assigned_location_id`
- Timestamps: `created_at`, `updated_at`

### 2. **vendor_spouse** (Related Table)

- `vendor_spouse_id` (PK)
- `full_name`, `age`, `birthdate`
- `educational_attainment`, `contact_number`, `occupation`
- Timestamps: `created_at`, `updated_at`

### 3. **vendor_child** (Related Table)

- `vendor_child_id` (PK)
- `full_name`, `age`, `birthdate`
- Timestamps: `created_at`, `updated_at`

### 4. **vendor_business** (Related Table)

- `vendor_business_id` (PK)
- `business_name`, `business_type`, `business_description`
- `vending_time_start`, `vending_time_end`
- Timestamps: `created_at`, `updated_at`

### 5. **assigned_location** (Related Table)

- `assigned_location_id` (PK)
- `location_name`
- Timestamp: `created_at`

---

## 🚨 CRITICAL ISSUES IDENTIFIED

### Issue 1: **Data Structure Mismatch**

**Current Implementation:**

- Backend stores data in a **flat, denormalized structure** in a single `vendor` table
- Form collects spouse/child/business data but **doesn't persist** them separately

**New Database Structure:**

- Requires **5 separate tables** with proper foreign key relationships
- Spouse, child, business, and location data must be stored in **separate tables**

### Issue 2: **Missing Foreign Key Relationships**

- Current `createVendor` stored procedure doesn't handle related tables
- No cascade operations for spouse, child, business, or location data

### Issue 3: **Frontend Form Structure**

- Form collects all data including:
  - Spouse: `spouseLast`, `spouseFirst`, `spouseMiddle`
  - Child: `childLast`, `childFirst`, `childMiddle`
  - Business: `businessName`, `businessType`, `productsSold`, `vendStart`, `vendEnd`
- But backend **only accepts personal vendor data**, not related entities

### Issue 4: **Client-Side Queries Violation**

- Current implementation has **NO client-side queries** ✅
- All operations use stored procedures ✅
- **Must maintain this pattern** for new changes

---

## 🔧 REQUIRED CHANGES

### A. BACKEND CHANGES

#### 1. **New Stored Procedures Required**

##### **SP 1: `createVendorWithRelations`**

```sql
-- Purpose: Create vendor with spouse, child, business, and location
-- Handles: All 5 tables in a single transaction
-- Returns: vendor_id

CREATE PROCEDURE createVendorWithRelations(
    -- Vendor personal info
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_suffix VARCHAR(10),
    IN p_contact_number VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_birthdate DATE,
    IN p_gender VARCHAR(20),
    IN p_address TEXT,
    IN p_vendor_identifier VARCHAR(45),
    IN p_status ENUM('Active','Inactive','Suspended'),

    -- Spouse info
    IN p_spouse_full_name VARCHAR(100),
    IN p_spouse_age INT,
    IN p_spouse_birthdate DATE,
    IN p_spouse_education VARCHAR(100),
    IN p_spouse_contact VARCHAR(20),
    IN p_spouse_occupation VARCHAR(45),

    -- Child info
    IN p_child_full_name VARCHAR(45),
    IN p_child_age INT,
    IN p_child_birthdate DATE,

    -- Business info
    IN p_business_name VARCHAR(45),
    IN p_business_type VARCHAR(45),
    IN p_business_description VARCHAR(255),
    IN p_vending_start VARCHAR(45),
    IN p_vending_end VARCHAR(45),

    -- Location info
    IN p_location_name VARCHAR(45)
)
```

##### **SP 2: `updateVendorWithRelations`**

```sql
-- Purpose: Update vendor and all related records
-- Handles: Updates or creates related records as needed
-- Returns: success status

CREATE PROCEDURE updateVendorWithRelations(
    IN p_vendor_id INT,
    -- [Same parameters as createVendorWithRelations]
)
```

##### **SP 3: `getVendorWithRelations`**

```sql
-- Purpose: Get complete vendor profile with all related data
-- Returns: Joined data from all 5 tables

CREATE PROCEDURE getVendorWithRelations(
    IN p_vendor_id INT
)
BEGIN
    SELECT
        v.*,
        vs.full_name AS spouse_name,
        vs.age AS spouse_age,
        vs.birthdate AS spouse_birthdate,
        vs.educational_attainment AS spouse_education,
        vs.contact_number AS spouse_contact,
        vs.occupation AS spouse_occupation,
        vc.full_name AS child_name,
        vc.age AS child_age,
        vc.birthdate AS child_birthdate,
        vb.business_name,
        vb.business_type,
        vb.business_description,
        vb.vending_time_start,
        vb.vending_time_end,
        al.location_name
    FROM vendor v
    LEFT JOIN vendor_spouse vs ON v.vendor_spouse_id = vs.vendor_spouse_id
    LEFT JOIN vendor_child vc ON v.vendor_child_id = vc.vendor_child_id
    LEFT JOIN vendor_business vb ON v.vendor_business_id = vb.vendor_business_id
    LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
    WHERE v.vendor_id = p_vendor_id;
END
```

##### **SP 4: `getAllVendorsWithRelations`**

```sql
-- Purpose: Get all vendors with related data for list view
-- Returns: All vendors with joined relations

CREATE PROCEDURE getAllVendorsWithRelations()
BEGIN
    SELECT
        v.vendor_id,
        v.first_name,
        v.last_name,
        v.middle_name,
        v.email,
        v.contact_number,
        v.status,
        vb.business_name,
        al.location_name,
        v.created_at,
        v.updated_at
    FROM vendor v
    LEFT JOIN vendor_business vb ON v.vendor_business_id = vb.vendor_business_id
    LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
    ORDER BY v.created_at DESC;
END
```

##### **SP 5: `deleteVendorWithRelations`**

```sql
-- Purpose: Soft delete vendor and optionally cascade to related records
-- Note: Consider whether to keep or delete related records

CREATE PROCEDURE deleteVendorWithRelations(
    IN p_vendor_id INT,
    IN p_delete_relations BOOLEAN
)
```

#### 2. **Controller Updates Required**

**File:** `Backend/Backend-Web/controllers/vendors/vendorController.js`

**Changes Needed:**

1. **Update `createVendor` function:**

   - Accept spouse, child, business, and location data
   - Call `createVendorWithRelations` stored procedure
   - Handle all parameters from frontend form

2. **Update `updateVendor` function:**

   - Accept all related entity data
   - Call `updateVendorWithRelations` stored procedure

3. **Update `getVendorById` function:**

   - Call `getVendorWithRelations` instead of `getVendorById`
   - Return full vendor profile with all relations

4. **Update `getAllVendors` function:**

   - Call `getAllVendorsWithRelations`
   - Return vendors with business and location info

5. **Update `deleteVendor` function:**
   - Call `deleteVendorWithRelations`
   - Decide on cascade deletion policy

---

### B. FRONTEND CHANGES

#### 1. **AddVendorDialog Component**

**File:** `Frontend/Web/src/components/Admin/Vendors/Components/AddVendorDialog/AddVendorDialog.js`

**Current Issues:**

- Form collects spouse/child/business data but doesn't send to backend
- Only sends basic vendor fields

**Required Changes:**

```javascript
// Current form object needs expansion:
form: {
  // Personal Info (existing)
  lastName: '',
  firstName: '',
  middleName: '',
  suffix: '',           // ADD
  phone: '',
  email: '',
  birthdate: '',
  gender: '',
  address: '',
  vendorId: '',

  // Spouse Info (expand)
  spouseLast: '',       // Remove - use full_name
  spouseFirst: '',      // Remove - use full_name
  spouseMiddle: '',     // Remove - use full_name
  spouseFullName: '',   // ADD
  spouseAge: null,      // ADD
  spouseBirthdate: '',  // ADD
  spouseEducation: '',  // ADD
  spouseContact: '',    // ADD
  spouseOccupation: '', // ADD

  // Child Info (expand)
  childLast: '',        // Remove - use full_name
  childFirst: '',       // Remove - use full_name
  childMiddle: '',      // Remove - use full_name
  childFullName: '',    // ADD
  childAge: null,       // ADD
  childBirthdate: '',   // ADD

  // Business Info (existing but rename)
  businessName: '',
  businessType: '',
  businessDescription: '', // rename from productsSold
  vendStart: '',
  vendEnd: '',

  // Location Info (ADD)
  locationName: '',     // ADD

  assignedCollector: '',
}
```

**Save Method Update:**

```javascript
save() {
  // ... validation ...

  const payload = {
    // Vendor personal info
    firstName: this.form.firstName,
    lastName: this.form.lastName,
    middleName: this.form.middleName,
    suffix: this.form.suffix,
    contactNumber: this.form.phone,
    email: this.form.email,
    birthdate: this.form.birthdate,
    gender: this.form.gender,
    address: this.form.address,
    vendorIdentifier: this.form.vendorId,
    status: 'Active',

    // Spouse info
    spouseFullName: this.form.spouseFullName,
    spouseAge: this.form.spouseAge,
    spouseBirthdate: this.form.spouseBirthdate,
    spouseEducation: this.form.spouseEducation,
    spouseContact: this.form.spouseContact,
    spouseOccupation: this.form.spouseOccupation,

    // Child info
    childFullName: this.form.childFullName,
    childAge: this.form.childAge,
    childBirthdate: this.form.childBirthdate,

    // Business info
    businessName: this.form.businessName,
    businessType: this.form.businessType,
    businessDescription: this.form.businessDescription,
    vendingTimeStart: this.form.vendStart,
    vendingTimeEnd: this.form.vendEnd,

    // Location info
    locationName: this.form.locationName,
  }

  this.$emit('save', payload)
}
```

#### 2. **EditVendorDialog Component**

**File:** `Frontend/Web/src/components/Admin/Vendors/Components/EditVendorDialog/EditVendorDialog.js`

**Required Changes:**

- Update `makeInitialForm` function to handle all new fields
- Map database fields from joined query results
- Send complete payload on update

#### 3. **Vendors.js (Main Component)**

**File:** `Frontend/Web/src/components/Admin/Vendors/Vendors.js`

**handleSave Method Update:**

```javascript
async handleSave(payload) {
  this.loading = true
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch(`${this.apiBaseUrl}/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload), // Send full payload
    })

    if (!response.ok) {
      throw new Error(`Failed to create vendor: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Vendor created:', result)

    this.showNotification('Vendor created successfully!', 'success')
    await this.initializeVendors()
  } catch (error) {
    console.error('❌ Error creating vendor:', error)
    this.showNotification('Failed to create vendor: ' + error.message, 'error')
  } finally {
    this.loading = false
  }
}
```

**handleEditUpdate Method Update:**

```javascript
async handleEditUpdate(payload) {
  this.loading = true
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch(
      `${this.apiBaseUrl}/vendors/${this.editTargetId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload), // Send full payload
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update vendor: ${response.status}`)
    }

    console.log('✅ Vendor updated successfully')
    this.showNotification('Vendor updated successfully!', 'success')
    await this.initializeVendors()
  } catch (error) {
    console.error('❌ Error updating vendor:', error)
    this.showNotification('Failed to update vendor: ' + error.message, 'error')
  } finally {
    this.loading = false
  }
}
```

**initializeVendors Method Update:**

```javascript
async initializeVendors() {
  this.loading = true
  try {
    const token = localStorage.getItem('authToken')
    const response = await fetch(`${this.apiBaseUrl}/vendors`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch vendors: ${response.status}`)
    }

    const result = await response.json()

    if (result.success && result.data) {
      this.vendors = result.data.map((vendor) => ({
        id: vendor.vendor_id,
        name: `${vendor.first_name} ${vendor.last_name}`,
        business: vendor.business_name || 'N/A',
        location: vendor.location_name || 'N/A', // ADD
        email: vendor.email || 'N/A',
        phone: vendor.contact_number || 'N/A',  // Updated field name
        status: vendor.status,
        raw: vendor, // Full vendor object with all relations
      }))

      console.log(`✅ Loaded ${this.vendors.length} vendors from database`)
    }
  } catch (error) {
    console.error('❌ Error loading vendors:', error)
  } finally {
    this.loading = false
  }
}
```

#### 4. **VendorDetailsDialog Component**

**File:** `Frontend/Web/src/components/Admin/Vendors/Components/VendorDetailsDialog/VendorDetailsDialog.js`

**Required Changes:**

- Display spouse information
- Display child information
- Display business details
- Display assigned location

---

## 📝 STORED PROCEDURE IMPLEMENTATION

### Complete SQL Migration File

**File to Create:** `database/migrations/404_vendor_relations_procedures.sql`

```sql
-- Migration: 404_vendor_relations_procedures.sql
-- Description: Stored procedures for vendor with related tables
-- Date: 2026-01-10
-- Dependencies: vendor, vendor_spouse, vendor_child, vendor_business, assigned_location tables

-- ========================================
-- DROP EXISTING PROCEDURES
-- ========================================

DROP PROCEDURE IF EXISTS `createVendorWithRelations`;
DROP PROCEDURE IF EXISTS `updateVendorWithRelations`;
DROP PROCEDURE IF EXISTS `getVendorWithRelations`;
DROP PROCEDURE IF EXISTS `getAllVendorsWithRelations`;
DROP PROCEDURE IF EXISTS `deleteVendorWithRelations`;

DELIMITER $$

-- ========================================
-- CREATE VENDOR WITH RELATIONS
-- ========================================

CREATE PROCEDURE `createVendorWithRelations`(
    -- Vendor personal info
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_suffix VARCHAR(10),
    IN p_contact_number VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_birthdate DATE,
    IN p_gender VARCHAR(20),
    IN p_address TEXT,
    IN p_vendor_identifier VARCHAR(45),
    IN p_status VARCHAR(20),

    -- Spouse info
    IN p_spouse_full_name VARCHAR(100),
    IN p_spouse_age INT,
    IN p_spouse_birthdate DATE,
    IN p_spouse_education VARCHAR(100),
    IN p_spouse_contact VARCHAR(20),
    IN p_spouse_occupation VARCHAR(45),

    -- Child info
    IN p_child_full_name VARCHAR(45),
    IN p_child_age INT,
    IN p_child_birthdate DATE,

    -- Business info
    IN p_business_name VARCHAR(45),
    IN p_business_type VARCHAR(45),
    IN p_business_description VARCHAR(255),
    IN p_vending_start VARCHAR(45),
    IN p_vending_end VARCHAR(45),

    -- Location info
    IN p_location_name VARCHAR(45)
)
BEGIN
    DECLARE v_spouse_id INT DEFAULT NULL;
    DECLARE v_child_id INT DEFAULT NULL;
    DECLARE v_business_id INT DEFAULT NULL;
    DECLARE v_location_id INT DEFAULT NULL;
    DECLARE v_vendor_id INT;

    -- Start transaction
    START TRANSACTION;

    -- Insert spouse if data provided
    IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
        INSERT INTO vendor_spouse (
            full_name, age, birthdate, educational_attainment,
            contact_number, occupation
        ) VALUES (
            p_spouse_full_name, p_spouse_age, p_spouse_birthdate,
            p_spouse_education, p_spouse_contact, p_spouse_occupation
        );
        SET v_spouse_id = LAST_INSERT_ID();
    END IF;

    -- Insert child if data provided
    IF p_child_full_name IS NOT NULL AND p_child_full_name != '' THEN
        INSERT INTO vendor_child (
            full_name, age, birthdate
        ) VALUES (
            p_child_full_name, p_child_age, p_child_birthdate
        );
        SET v_child_id = LAST_INSERT_ID();
    END IF;

    -- Insert business if data provided
    IF p_business_name IS NOT NULL AND p_business_name != '' THEN
        INSERT INTO vendor_business (
            business_name, business_type, business_description,
            vending_time_start, vending_time_end
        ) VALUES (
            p_business_name, p_business_type, p_business_description,
            p_vending_start, p_vending_end
        );
        SET v_business_id = LAST_INSERT_ID();
    END IF;

    -- Insert or find location
    IF p_location_name IS NOT NULL AND p_location_name != '' THEN
        -- Check if location exists
        SELECT assigned_location_id INTO v_location_id
        FROM assigned_location
        WHERE location_name = p_location_name
        LIMIT 1;

        -- Create if doesn't exist
        IF v_location_id IS NULL THEN
            INSERT INTO assigned_location (location_name)
            VALUES (p_location_name);
            SET v_location_id = LAST_INSERT_ID();
        END IF;
    END IF;

    -- Insert vendor
    INSERT INTO vendor (
        first_name, last_name, middle_name, suffix,
        contact_number, email, birthdate, gender, address,
        vendor_identifier, status,
        vendor_spouse_id, vendor_child_id, vendor_business_id,
        assigned_location_id
    ) VALUES (
        p_first_name, p_last_name, p_middle_name, p_suffix,
        p_contact_number, p_email, p_birthdate, p_gender, p_address,
        p_vendor_identifier, COALESCE(p_status, 'Active'),
        v_spouse_id, v_child_id, v_business_id, v_location_id
    );

    SET v_vendor_id = LAST_INSERT_ID();

    COMMIT;

    -- Return vendor ID
    SELECT v_vendor_id AS vendor_id;
END$$

-- ========================================
-- UPDATE VENDOR WITH RELATIONS
-- ========================================

CREATE PROCEDURE `updateVendorWithRelations`(
    IN p_vendor_id INT,
    -- Vendor personal info
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_suffix VARCHAR(10),
    IN p_contact_number VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_birthdate DATE,
    IN p_gender VARCHAR(20),
    IN p_address TEXT,
    IN p_vendor_identifier VARCHAR(45),
    IN p_status VARCHAR(20),

    -- Spouse info
    IN p_spouse_full_name VARCHAR(100),
    IN p_spouse_age INT,
    IN p_spouse_birthdate DATE,
    IN p_spouse_education VARCHAR(100),
    IN p_spouse_contact VARCHAR(20),
    IN p_spouse_occupation VARCHAR(45),

    -- Child info
    IN p_child_full_name VARCHAR(45),
    IN p_child_age INT,
    IN p_child_birthdate DATE,

    -- Business info
    IN p_business_name VARCHAR(45),
    IN p_business_type VARCHAR(45),
    IN p_business_description VARCHAR(255),
    IN p_vending_start VARCHAR(45),
    IN p_vending_end VARCHAR(45),

    -- Location info
    IN p_location_name VARCHAR(45)
)
BEGIN
    DECLARE v_spouse_id INT;
    DECLARE v_child_id INT;
    DECLARE v_business_id INT;
    DECLARE v_location_id INT;

    START TRANSACTION;

    -- Get existing foreign keys
    SELECT vendor_spouse_id, vendor_child_id, vendor_business_id, assigned_location_id
    INTO v_spouse_id, v_child_id, v_business_id, v_location_id
    FROM vendor
    WHERE vendor_id = p_vendor_id;

    -- Update or create spouse
    IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
        IF v_spouse_id IS NOT NULL THEN
            -- Update existing
            UPDATE vendor_spouse SET
                full_name = p_spouse_full_name,
                age = p_spouse_age,
                birthdate = p_spouse_birthdate,
                educational_attainment = p_spouse_education,
                contact_number = p_spouse_contact,
                occupation = p_spouse_occupation
            WHERE vendor_spouse_id = v_spouse_id;
        ELSE
            -- Create new
            INSERT INTO vendor_spouse (
                full_name, age, birthdate, educational_attainment,
                contact_number, occupation
            ) VALUES (
                p_spouse_full_name, p_spouse_age, p_spouse_birthdate,
                p_spouse_education, p_spouse_contact, p_spouse_occupation
            );
            SET v_spouse_id = LAST_INSERT_ID();
        END IF;
    END IF;

    -- Update or create child
    IF p_child_full_name IS NOT NULL AND p_child_full_name != '' THEN
        IF v_child_id IS NOT NULL THEN
            -- Update existing
            UPDATE vendor_child SET
                full_name = p_child_full_name,
                age = p_child_age,
                birthdate = p_child_birthdate
            WHERE vendor_child_id = v_child_id;
        ELSE
            -- Create new
            INSERT INTO vendor_child (
                full_name, age, birthdate
            ) VALUES (
                p_child_full_name, p_child_age, p_child_birthdate
            );
            SET v_child_id = LAST_INSERT_ID();
        END IF;
    END IF;

    -- Update or create business
    IF p_business_name IS NOT NULL AND p_business_name != '' THEN
        IF v_business_id IS NOT NULL THEN
            -- Update existing
            UPDATE vendor_business SET
                business_name = p_business_name,
                business_type = p_business_type,
                business_description = p_business_description,
                vending_time_start = p_vending_start,
                vending_time_end = p_vending_end
            WHERE vendor_business_id = v_business_id;
        ELSE
            -- Create new
            INSERT INTO vendor_business (
                business_name, business_type, business_description,
                vending_time_start, vending_time_end
            ) VALUES (
                p_business_name, p_business_type, p_business_description,
                p_vending_start, p_vending_end
            );
            SET v_business_id = LAST_INSERT_ID();
        END IF;
    END IF;

    -- Update or create location
    IF p_location_name IS NOT NULL AND p_location_name != '' THEN
        -- Check if location exists
        SELECT assigned_location_id INTO v_location_id
        FROM assigned_location
        WHERE location_name = p_location_name
        LIMIT 1;

        -- Create if doesn't exist
        IF v_location_id IS NULL THEN
            INSERT INTO assigned_location (location_name)
            VALUES (p_location_name);
            SET v_location_id = LAST_INSERT_ID();
        END IF;
    END IF;

    -- Update vendor
    UPDATE vendor SET
        first_name = p_first_name,
        last_name = p_last_name,
        middle_name = p_middle_name,
        suffix = p_suffix,
        contact_number = p_contact_number,
        email = p_email,
        birthdate = p_birthdate,
        gender = p_gender,
        address = p_address,
        vendor_identifier = p_vendor_identifier,
        status = p_status,
        vendor_spouse_id = v_spouse_id,
        vendor_child_id = v_child_id,
        vendor_business_id = v_business_id,
        assigned_location_id = v_location_id
    WHERE vendor_id = p_vendor_id;

    COMMIT;
END$$

-- ========================================
-- GET VENDOR WITH RELATIONS
-- ========================================

CREATE PROCEDURE `getVendorWithRelations`(
    IN p_vendor_id INT
)
BEGIN
    SELECT
        v.vendor_id,
        v.first_name,
        v.last_name,
        v.middle_name,
        v.suffix,
        v.contact_number,
        v.email,
        v.birthdate,
        v.gender,
        v.address,
        v.vendor_identifier,
        v.status,
        v.created_at,
        v.updated_at,
        -- Spouse
        vs.vendor_spouse_id,
        vs.full_name AS spouse_full_name,
        vs.age AS spouse_age,
        vs.birthdate AS spouse_birthdate,
        vs.educational_attainment AS spouse_education,
        vs.contact_number AS spouse_contact,
        vs.occupation AS spouse_occupation,
        -- Child
        vc.vendor_child_id,
        vc.full_name AS child_full_name,
        vc.age AS child_age,
        vc.birthdate AS child_birthdate,
        -- Business
        vb.vendor_business_id,
        vb.business_name,
        vb.business_type,
        vb.business_description,
        vb.vending_time_start,
        vb.vending_time_end,
        -- Location
        al.assigned_location_id,
        al.location_name
    FROM vendor v
    LEFT JOIN vendor_spouse vs ON v.vendor_spouse_id = vs.vendor_spouse_id
    LEFT JOIN vendor_child vc ON v.vendor_child_id = vc.vendor_child_id
    LEFT JOIN vendor_business vb ON v.vendor_business_id = vb.vendor_business_id
    LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
    WHERE v.vendor_id = p_vendor_id;
END$$

-- ========================================
-- GET ALL VENDORS WITH RELATIONS
-- ========================================

CREATE PROCEDURE `getAllVendorsWithRelations`()
BEGIN
    SELECT
        v.vendor_id,
        v.first_name,
        v.last_name,
        v.middle_name,
        v.suffix,
        v.contact_number,
        v.email,
        v.status,
        vb.business_name,
        al.location_name,
        v.created_at,
        v.updated_at
    FROM vendor v
    LEFT JOIN vendor_business vb ON v.vendor_business_id = vb.vendor_business_id
    LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
    ORDER BY v.created_at DESC;
END$$

-- ========================================
-- DELETE VENDOR WITH RELATIONS
-- ========================================

CREATE PROCEDURE `deleteVendorWithRelations`(
    IN p_vendor_id INT,
    IN p_delete_relations BOOLEAN
)
BEGIN
    DECLARE v_spouse_id INT;
    DECLARE v_child_id INT;
    DECLARE v_business_id INT;

    START TRANSACTION;

    IF p_delete_relations THEN
        -- Get foreign keys
        SELECT vendor_spouse_id, vendor_child_id, vendor_business_id
        INTO v_spouse_id, v_child_id, v_business_id
        FROM vendor
        WHERE vendor_id = p_vendor_id;

        -- Delete related records
        IF v_spouse_id IS NOT NULL THEN
            DELETE FROM vendor_spouse WHERE vendor_spouse_id = v_spouse_id;
        END IF;

        IF v_child_id IS NOT NULL THEN
            DELETE FROM vendor_child WHERE vendor_child_id = v_child_id;
        END IF;

        IF v_business_id IS NOT NULL THEN
            DELETE FROM vendor_business WHERE vendor_business_id = v_business_id;
        END IF;
    END IF;

    -- Soft delete vendor (set status to Inactive)
    UPDATE vendor SET status = 'Inactive' WHERE vendor_id = p_vendor_id;

    COMMIT;
END$$

DELIMITER ;
```

---

## 🔄 MIGRATION STRATEGY

### Step 1: Database Migration

1. Create new tables (if not already created)
2. Run `404_vendor_relations_procedures.sql` migration
3. Verify all stored procedures are created successfully

### Step 2: Backend Updates

1. Update `vendorController.js`:
   - Modify `createVendor` to accept all parameters
   - Call `createVendorWithRelations` procedure
   - Update `updateVendor` similarly
   - Change `getVendorById` to use `getVendorWithRelations`
   - Change `getAllVendors` to use `getAllVendorsWithRelations`

### Step 3: Frontend Updates

1. Update `AddVendorDialog.js`:
   - Expand form fields
   - Update save method payload
2. Update `EditVendorDialog.js`:
   - Expand form fields
   - Update mapping functions
3. Update `Vendors.js`:
   - Update API payload structures
   - Update data mapping from responses

### Step 4: Testing

1. Test vendor creation with all fields
2. Test vendor update with partial data
3. Test vendor retrieval with relations
4. Test list view performance
5. Verify no client-side queries exist

---

## ✅ VALIDATION CHECKLIST

- [ ] All 5 stored procedures created and tested
- [ ] Backend controller accepts all new fields
- [ ] Frontend form includes all required fields
- [ ] Vendor creation works with spouse/child/business/location
- [ ] Vendor update works with partial data
- [ ] Vendor list displays correctly
- [ ] No direct SQL queries on client side
- [ ] All operations use stored procedures
- [ ] Foreign key relationships maintained
- [ ] Transactions handle failures correctly
- [ ] Performance acceptable for list views
- [ ] Edit dialog populates all fields correctly
- [ ] Details view shows all related data

---

## 📌 NOTES

1. **Transaction Safety**: All create/update operations use transactions to ensure data consistency
2. **NULL Handling**: Stored procedures handle NULL/empty values for optional relations
3. **Location Reuse**: Location names are deduplicated to avoid duplicate location records
4. **Soft Delete**: Vendor deletion is soft delete (status change) to preserve historical data
5. **No Client Queries**: ✅ All database operations through stored procedures only
6. **Field Name Changes**:
   - `phone` → `contact_number`
   - `productsSold` → `business_description`
   - Spouse/child now use `full_name` instead of separate first/middle/last

---

## 🚀 NEXT STEPS

1. Create and run the stored procedures migration file
2. Update backend controller to handle new data structure
3. Update frontend forms to collect and send all required data
4. Test end-to-end vendor creation and update flows
5. Update documentation with new API endpoints
6. Consider adding validation for related entity data
7. Add UI for viewing/editing spouse, child, business, and location separately if needed

---

**End of Analysis Log**
