# Database Migrations - Stored Procedures

This folder contains all stored procedures from the `naga_stall` database, organized as individual migration files with numbered prefixes.

## Migration Files

Total: 250 stored procedure migrations (001 - 250)

### Naming Convention
- Files are numbered sequentially: `001_procedureName.sql`, `002_procedureName.sql`, etc.
- Each file contains a single stored procedure with:
  - Header comment with migration number and description
  - `DELIMITER $$` at start
  - `DROP PROCEDURE IF EXISTS` before CREATE
  - `DELIMITER ;` at end

### Running Migrations

To run all migrations in order:

```bash
# Run all migrations in sequence
for file in migrations/*.sql; do
    mysql -u root -p naga_stall < "$file"
done
```

Or in PowerShell:
```powershell
Get-ChildItem -Path "migrations/*.sql" | Sort-Object Name | ForEach-Object {
    mysql -u root -p naga_stall < $_.FullName
}
```

## Document Customization Feature Changes

### Summary
The document customization feature has been modified so that **business_manager** is now responsible for adding customization documents instead of **owner**.

### Modified Procedures

1. **004_CanCustomizeDocuments.sql**
   - Changed parameter from `p_owner_id` to `p_business_manager_id`
   - Now checks if business_manager exists and is active instead of owner

2. **093_GetOwnerDocumentRequirements.sql** (renamed to GetManagerDocumentRequirements)
   - Changed to use `p_business_manager_id` parameter
   - Now queries `branch_document_requirements` table joined with `document_type`
   - Links through `branch` and `business_manager` tables

3. **102_GetStallholderDocuments.sql**
   - Changed parameter from `p_owner_id` to `p_branch_id`
   - Now queries `applicant_documents` and `branch_document_requirements` tables
   - Reviews are now tracked by `business_manager_id` instead of owner

### Database Tables Used

- `branch_document_requirements` - Already contains `created_by_business_manager` field
- `business_manager` - Contains manager info with `status` field for active check
- `applicant_documents` - Contains document submissions
- `document_type` - Contains document type definitions

### API Changes Required

If using these procedures in your application, update the following:

1. **CanCustomizeDocuments**: Pass `business_manager_id` instead of `owner_id`
2. **GetOwnerDocumentRequirements**: Pass `business_manager_id` instead of `owner_id`
3. **GetStallholderDocuments**: Pass `branch_id` instead of `owner_id`

## Branch-Level Document Customization (NEW)

### Overview
Each branch can now have different document requirements for stallholders. Business managers and business employees can customize which documents are required for their specific branch.

### New Procedures (250_stallholder_document_management.sql)

#### Document Type Management
| Procedure | Description |
|-----------|-------------|
| `AddDocumentType` | Add a new custom document type |
| `UpdateDocumentType` | Update document type name/description |
| `DeleteDocumentType` | Remove a custom document type |
| `GetAllDocumentTypes` | Retrieve all available document types |

#### Branch Document Requirements
| Procedure | Description |
|-----------|-------------|
| `AddBranchDocumentRequirement` | Add a document requirement to a branch |
| `UpdateBranchDocumentRequirement` | Update requirement (is_required flag) |
| `RemoveBranchDocumentRequirement` | Remove a requirement from a branch |
| `GetBranchDocumentRequirementsDetailed` | Get all requirements with creator info |
| `GetAvailableDocumentTypesForBranch` | Get document types not yet added to branch |
| `CopyBranchDocumentRequirements` | Copy all requirements from one branch to another |

#### Stallholder Document Submissions
| Procedure | Description |
|-----------|-------------|
| `SubmitStallholderDocument` | Stallholder uploads a document |
| `ReviewStallholderDocument` | Manager approves/rejects a document |
| `GetStallholderDocumentSubmissions` | Get all submissions for a stallholder |
| `GetPendingDocumentReviews` | Get documents pending review for a branch |
| `GetStallholderDocumentStatus` | Get completion status (submitted/required counts) |

### Workflow Example

```sql
-- 1. Business manager adds a document requirement to their branch
CALL AddBranchDocumentRequirement(1, 3, 1, @req_id, @success, @message);
-- branch_id=1, document_type_id=3, business_manager_id=1

-- 2. Stallholder submits a document
CALL SubmitStallholderDocument(5, 1, 3, '/uploads/doc.pdf', @sub_id, @success, @message);
-- stallholder_id=5, branch_id=1, document_type_id=3

-- 3. Manager reviews the submission
CALL ReviewStallholderDocument(@sub_id, 1, 'approved', 'Looks good', @success, @message);
-- submission_id, reviewer_manager_id, status, notes

-- 4. Check stallholder's document completion status
CALL GetStallholderDocumentStatus(5, 1);
-- Returns: submitted_count, required_count, completion_percentage
```

## Procedure List by Category

### Authentication & Authorization
- 004_CanCustomizeDocuments
- 096_loginBusinessEmployee
- 097_loginSystemAdministrator
- 098_logoutBusinessEmployee

### Applicant Management
- 014_createApplicant
- 015_createApplicantComplete
- 030_deleteApplicant
- 031_deleteApplicantDocument
- 058_getApplicantAdditionalInfo
- 059_getApplicantApplicationsDetailed
- 060_getApplicantBusinessOwners
- 061_getApplicantByEmail
- 062_getApplicantById
- 063_getApplicantByUsername
- 064_getApplicantComplete
- 065_getApplicantDocumentStatus
- 066_getApplicantLoginCredentials
- 067_getApplicantRequiredDocuments
- 235_updateApplicant
- 236_updateApplicantComplete

### Application Management
- 006_checkExistingApplication
- 007_checkExistingApplicationByStall
- 010_checkPendingApplication
- 016_createApplication
- 032_deleteApplication
- 044_getAllApplications
- 068_getApplicationById
- 069_getApplicationsByApplicant

### Branch Management
- 017_createBranch
- 033_deleteBranch
- 041_getAllActiveBranches
- 045_getAllBranchesDetailed
- 073_getBranchById
- 074_getBranchDocumentRequirements
- 238_updateBranch

### Stall Management
- 026_createStallApplicationComplete
- 027_createStallBusinessOwner
- 028_createStallholder
- 037_deleteStall
- 038_deleteStallBusinessOwner
- 039_deleteStallholder
- 051_getAllStallBusinessOwners
- 052_getAllStallholdersDetailed
- 053_getAllStallsDetailed
- 085_getStallById
- 101_getStallholderById
- 102_GetStallholderDocuments (MODIFIED)
- 103_getStallholdersByBranch
- 245_updateStall
- 246_updateStallBusinessOwner
- 247_updateStallholder

### Document Management
- 049_getAllDocumentTypes
- 093_GetOwnerDocumentRequirements (MODIFIED)
- 130_setBranchDocumentRequirement
- 143_sp_deleteBranchDocumentRequirements
- **250_stallholder_document_management** (NEW - Contains 15+ procedures):
  - AddDocumentType
  - UpdateDocumentType
  - DeleteDocumentType
  - GetAllDocumentTypes
  - AddBranchDocumentRequirement
  - UpdateBranchDocumentRequirement
  - RemoveBranchDocumentRequirement
  - GetBranchDocumentRequirementsDetailed
  - GetAvailableDocumentTypesForBranch
  - CopyBranchDocumentRequirements
  - SubmitStallholderDocument
  - ReviewStallholderDocument
  - GetStallholderDocumentSubmissions
  - GetPendingDocumentReviews
  - GetStallholderDocumentStatus

### Payment Management
- 002_addOnsitePayment
- 050_getAllPayments
- 092_getOnsitePayments
- 094_getPaymentStats
- 117_sp_add_payment
- 118_sp_approvePayment
- 139_sp_declinePayment

### Compliance & Violations
- 005_checkComplianceRecordExists
- 020_createComplaint
- 021_createComplianceRecord
- 035_deleteComplaint
- 036_deleteComplianceRecord
- 048_getAllComplaints
- 241_updateComplaint
- 242_updateComplianceRecord

### Inspector Management
- 001_addInspector
- 042_getAllActiveInspectors
- 234_terminateInspector

### Business Manager/Employee Management
- 003_assignManagerToBusinessOwner
- 018_createBusinessEmployee
- 034_deleteBusinessEmployee
- 046_getAllBusinessEmployees
- 075_getBusinessEmployeeById
- 076_getBusinessEmployeeByUsername
- 077_getBusinessEmployeesByBranch
- 078_getBusinessManagerByUsername
- 239_updateBusinessEmployee
- 240_updateBusinessManager

### System Administration
- 029_createSystemAdministrator
- 040_deleteSystemAdministrator
- 055_getAllSystemAdministrators
- 248_updateSystemAdministrator

---

Generated: $(date)
Source: naga_stall.sql
