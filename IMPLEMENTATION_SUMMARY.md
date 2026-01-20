# Document Types System - Database Restructure

## Summary
Successfully restructured the document types system to store all document types in the database rather than hardcoding them in the application code.

## Changes Made

### 1. Database Schema Updates

#### New `document_types` Table Structure
```sql
CREATE TABLE document_types (
  document_type_id INT(11) PRIMARY KEY AUTO_INCREMENT,
  type_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  category VARCHAR(50) DEFAULT 'General',
  is_system_default TINYINT(1) DEFAULT 0,
  display_order INT DEFAULT 0,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Key Changes:**
- Changed `document_name` to `type_name` for clarity
- Added `category` field for grouping documents (Legal, Business, Health & Safety, etc.)
- Added `is_system_default` to protect system documents from deletion
- Added `display_order` for custom sorting
- Added `updated_at` timestamp

#### Updated `branch_document_requirements` Table
```sql
CREATE TABLE branch_document_requirements (
  requirement_id INT(11) PRIMARY KEY AUTO_INCREMENT,
  branch_id INT(11) NOT NULL,
  document_type_id INT(11) NOT NULL,  -- Foreign key to document_types
  is_required TINYINT(1) NOT NULL DEFAULT 1,
  instructions TEXT DEFAULT NULL,     -- Special instructions per branch
  created_by_business_manager INT(11) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE,
  FOREIGN KEY (document_type_id) REFERENCES document_types(document_type_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_business_manager) REFERENCES business_manager(business_manager_id) ON DELETE SET NULL
);
```

**Key Changes:**
- Removed `document_name` column (now uses foreign key)
- Changed `description` to `instructions` for branch-specific notes
- Added proper foreign key relationships
- Added `updated_at` timestamp

### 2. Pre-loaded Document Types

The system now includes 15 standard document types categorized by purpose:

**Legal Documents:**
- Barangay Clearance
- Contract
- Police Clearance

**Business Documents:**
- Business Permit
- Certificate of Registration
- Mayor's Permit

**Health & Safety:**
- Health Certificate
- Fire Safety Certificate
- Sanitary Permit

**Financial Documents:**
- Tax Clearance
- Proof of Income
- Bank Statement

**Identification:**
- Photo
- Proof of Address
- Valid ID

### 3. Backend Updates

#### documentController.js
- Updated `createBranchDocumentRequirement()` to use `document_type_id` foreign key
- Updated `getAllDocumentTypes()` to return new fields: `type_name`, `category`, `display_order`
- Added validation to ensure document type exists before creating requirement
- Improved error handling

#### Stored Procedure Update
```sql
CREATE PROCEDURE getBranchDocumentRequirements(IN p_branch_id INT)
BEGIN
    SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        bdr.document_type_id,
        dt.type_name,
        dt.description,
        dt.category,
        bdr.is_required,
        bdr.instructions,
        bdr.created_by_business_manager,
        bdr.created_at,
        bdr.updated_at
    FROM branch_document_requirements bdr
    INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
    WHERE bdr.branch_id = p_branch_id AND dt.status = 'Active'
    ORDER BY dt.display_order, dt.type_name;
END
```

### 4. Frontend Updates

#### DocumentCustomization.vue & .js
- Updated to use `type_name` instead of `document_name`
- Added category display in chips
- Enhanced document type selector with category badges
- Updated all data mappings to handle new structure

### 5. Migration & Backup

- Created `branch_document_requirements_backup` table with all existing data
- Automatic migration of old `document_name` data to new `document_type_id` foreign keys
- Created view `v_branch_document_requirements` for easy querying

## Files Created

1. `/database/setup_document_types_system.sql` - Complete system setup with migration
2. `/database/update_document_procedures.sql` - Stored procedure update
3. `/Backend/update_procedure.mjs` - Node script to update stored procedures
4. `IMPLEMENTATION_SUMMARY.md` - This file

## Files Modified

1. `/Backend/Backend-Web/controllers/stallholders/documentController.js`
2. `/Frontend/Web/src/components/Admin/Stallholders/Components/DocumentCustomization/DocumentCustomization.js`
3. `/Frontend/Web/src/components/Admin/Stallholders/Components/DocumentCustomization/DocumentCustomization.vue`

## How It Works Now

1. **Manager/Employee View:**
   - Opens Document Customization dialog
   - Clicks "Add Document Requirement"
   - Selects from pre-defined document types in database
   - Document types show category badges (Legal, Business, etc.)
   - Can add special instructions per branch
   - Can mark as required or optional

2. **Database Storage:**
   - Document type definition stored in `document_types`
   - Branch-specific requirements stored in `branch_document_requirements`
   - Uses foreign key relationships for data integrity
   - Supports cascading deletes

3. **API Endpoints:**
   - `GET /api/stallholders/documents/types` - Get all available document types
   - `GET /api/stallholders/documents/requirements` - Get branch requirements
   - `POST /api/stallholders/documents/requirements` - Add requirement
   - `DELETE /api/stallholders/documents/requirements/:id` - Remove requirement

## Benefits

1. ✅ **Centralized Management:** All document types in database
2. ✅ **Easy to Extend:** Add new document types without code changes
3. ✅ **Data Integrity:** Foreign key constraints prevent orphaned records
4. ✅ **Categorization:** Documents grouped by purpose
5. ✅ **Flexible:** Branch-specific instructions and requirements
6. ✅ **Audit Trail:** Timestamps and creator tracking
7. ✅ **Future-Proof:** Can add custom document types through admin panel

## How to Apply These Changes to Another Database

If you need to set up this system on another database, run:

```bash
cd Backend
node setup_document_system.mjs
node update_procedure.mjs
```

This will:
1. Create the new `document_types` table with all 15 standard types
2. Backup existing requirements to `branch_document_requirements_backup`
3. Recreate `branch_document_requirements` with new structure
4. Update the `getBranchDocumentRequirements` stored procedure

## Testing

Run the application and:
1. Login as business manager or employee
2. Go to Stallholders page
3. Click "Document Requirements Configuration"
4. Click "Add Document Requirement"
5. Select from dropdown - should show 15 document types with categories
6. Save and verify in database

## Error Fixed

**Original Error:**
```
Unknown column 'type_name' in 'field list'
sql: 'SELECT type_name FROM document_types WHERE document_type_id = ?'
```

**Solution:**
- Restructured `document_types` table with proper columns
- Updated all queries to use new column names
- Updated stored procedures to JOIN with document_types
- Updated frontend to display new fields

## Notes

- Old data backed up in `branch_document_requirements_backup`
- System default document types protected from deletion
- All changes are backward compatible with proper migrations
