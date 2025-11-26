# Business Owner - Manager Connection System

## Overview
This system allows Business Owners to be connected with one or more Business Managers, establishing a hierarchical relationship where Managers can oversee and assist Business Owners in managing their operations.

## Feature Parity: Business Manager vs Business Owner

### Common Features (Both Roles)
1. **Dashboard** - Overview of operations
2. **Payment** - Payment management
3. **Applicants** - Manage stall applications
4. **Complaints** - Handle customer complaints
5. **Compliances** - Compliance monitoring
6. **More Menu Items**:
   - Employees - Employee management
   - Vendors - Vendor management
   - Stallholders - Stallholder management
   - Stalls (with Raffles/Auctions submenu)
   - Collectors - Payment collector management
   - Inspectors - Inspector management

### Business Owner Exclusive Features
- **Branch** - Manage multiple branches (main menu)
- **My Subscription** - View and manage subscription plan (in More menu)

### Business Manager Exclusive Features
- None - Managers have same operational features but don't manage subscriptions

## Database Schema

### New Table: `business_owner_managers`
```sql
CREATE TABLE `business_owner_managers` (
  `relationship_id` INT NOT NULL AUTO_INCREMENT,
  `business_owner_id` INT NOT NULL,
  `business_manager_id` INT NOT NULL,
  `is_primary` TINYINT(1) DEFAULT 0,
  `access_level` ENUM('Full', 'ViewOnly', 'Limited') DEFAULT 'Full',
  `assigned_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by_system_admin` INT NULL,
  `notes` TEXT NULL,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  PRIMARY KEY (`relationship_id`),
  UNIQUE KEY `unique_owner_manager` (`business_owner_id`, `business_manager_id`)
);
```

### Updated Table: `stall_business_owner`
```sql
ALTER TABLE `stall_business_owner`
ADD COLUMN `primary_manager_id` INT NULL COMMENT 'Primary Business Manager';
```

## Stored Procedures

### 1. createBusinessOwnerWithManagerConnection
Creates a Business Owner account with subscription and manager connections.

**Parameters:**
- `p_username` - Business Owner username
- `p_password_hash` - Hashed password
- `p_first_name` - First name
- `p_last_name` - Last name
- `p_email` - Email address
- `p_contact_number` - Contact number
- `p_plan_id` - Subscription plan ID (1=Basic, 2=Standard, 3=Premium)
- `p_primary_manager_id` - Primary manager's ID
- `p_additional_manager_ids` - JSON array of additional manager IDs `[2, 3, 4]`
- `p_created_by_system_admin` - System Administrator ID

**Returns:**
```json
{
  "business_owner_id": 5,
  "subscription_id": 10,
  "primary_manager_id": 1,
  "start_date": "2025-11-26",
  "end_date": "2025-12-26",
  "message": "Business Owner created successfully with manager connections"
}
```

**Example Usage:**
```sql
CALL createBusinessOwnerWithManagerConnection(
    'jdoe',
    '$2b$12$hashedpassword',
    'John',
    'Doe',
    'jdoe@example.com',
    '+639171234567',
    2, -- Standard plan
    1, -- Primary manager ID
    '[3, 16]', -- Additional managers
    1 -- Created by system admin ID 1
);
```

### 2. getBusinessOwnerManagers
Gets all managers assigned to a Business Owner.

**Parameters:**
- `p_business_owner_id` - Business Owner ID

**Returns:**
```sql
SELECT 
    relationship_id,
    business_manager_id,
    is_primary,
    access_level,
    manager_name,
    manager_email,
    branch_name,
    assigned_by_name
FROM ...
```

### 3. getManagerBusinessOwners
Gets all Business Owners managed by a specific Manager.

**Parameters:**
- `p_business_manager_id` - Business Manager ID

**Returns:**
```sql
SELECT 
    business_owner_id,
    owner_name,
    subscription_status,
    subscription_expiry_date,
    days_until_expiry,
    plan_name
FROM ...
```

### 4. assignManagerToBusinessOwner
Assigns an additional manager to an existing Business Owner.

**Parameters:**
- `p_business_owner_id` - Business Owner ID
- `p_business_manager_id` - Manager ID to assign
- `p_access_level` - 'Full', 'ViewOnly', or 'Limited'
- `p_assigned_by_system_admin` - System Admin ID
- `p_notes` - Optional notes

### 5. removeManagerFromBusinessOwner
Removes a manager from a Business Owner (soft delete).

**Parameters:**
- `p_relationship_id` - Relationship ID from `business_owner_managers`

**Note:** Cannot remove primary manager. Must assign new primary first.

## Frontend Implementation

### Menu Structure

#### Business Owner Main Menu (IDs 1-5)
1. Dashboard (`/app/dashboard`)
2. Payment (`/app/payment`)
3. Branch (`/app/branch`)
4. Applicants (`/app/applicants`)
5. Complaints (`/app/complaints`)

#### Business Owner "More" Menu (IDs 6-13)
6. Employees (`/app/employees`)
7. Vendors (`/app/vendors`)
8. Stallholders (`/app/stallholders`)
9. Stalls (`/app/stalls`) - with submenu:
   - 91. Raffles (`/app/stalls/raffles`)
   - 92. Auctions (`/app/stalls/auctions`)
10. Collectors (`/app/collectors`)
11. Inspectors (`/app/inspectors`)
12. Compliances (`/app/compliances`)
13. My Subscription (`/app/subscription`) - **Business Owner Only**

#### Business Manager Main Menu (IDs 1-5)
1. Dashboard (`/app/dashboard`)
2. Payment (`/app/payment`)
3. Applicants (`/app/applicants`)
4. Complaints (`/app/complaints`)
5. Compliances (`/app/compliances`)

#### Business Manager "More" Menu (IDs 6-12)
6. Employees (`/app/employees`)
7. Vendors (`/app/vendors`)
8. Stallholders (`/app/stallholders`)
9. Stalls (`/app/stalls`) - with submenu
10. Collectors (`/app/collectors`)
11. Inspectors (`/app/inspectors`)
12. (No Subscription - only Business Owner has this)

### Files Modified

1. **Frontend/Web/src/components/MainLayout/MainLayout.js**
   - Updated `businessOwnerMenuItems` to match manager features (IDs 1-5)
   - Added routes 11-13 to `allMenuRoutes`
   
2. **Frontend/Web/src/components/Admin/AppSidebar/AppSidebar.js**
   - Added `roles` property to all `moreItems` defining which user types can access each feature
   - Updated `isBranchManager()` to include `business_manager` and `stall_business_owner`
   - Refactored `filteredMoreItems()` to use role-based filtering
   - Item 13 (My Subscription) restricted to `stall_business_owner` only

3. **Frontend/Web/src/components/Admin/AppSidebar/AppSidebar.vue**
   - Changed "More" button visibility from `!isAdmin` to `!isEmployee` (allows both managers and owners)
   - Updated more-items container visibility condition

## Usage Workflow

### Creating a Business Owner Account

**Step 1: System Administrator creates Business Owner**
```sql
-- Create Business Owner with primary manager and subscription
CALL createBusinessOwnerWithManagerConnection(
    'newowner',
    '$2b$12$hashHere...',
    'Jane',
    'Smith',
    'jsmith@business.com',
    '+639171234567',
    2, -- Standard plan (₱10,000/month)
    1, -- Primary manager: NCPM_Manager
    '[3]', -- Additional manager: Satellite_Manager
    1 -- Created by sysadmin
);
```

**Step 2: Business Owner Login**
- Username: `newowner`
- Password: (as set during creation)
- Dashboard shows subscription status
- "More" menu includes "My Subscription"

**Step 3: Business Owner Views Subscription**
- Navigate to More → My Subscription
- See plan details, expiry date, payment history
- View assigned managers

**Step 4: Manager Views Their Business Owners**
```sql
-- Manager checks which owners they manage
CALL getManagerBusinessOwners(1);
```

**Step 5: Assign Additional Manager**
```sql
-- System Admin assigns another manager
CALL assignManagerToBusinessOwner(
    5, -- Business Owner ID
    16, -- New Manager ID (Test_Manager)
    'Full',
    1, -- System Admin ID
    'Assigned for branch expansion support'
);
```

## Access Control

### Who Can Create Business Owners?
- **System Administrator only** - via `createBusinessOwnerWithManagerConnection`

### Who Can Assign Managers?
- **System Administrator only** - via `assignManagerToBusinessOwner`

### Who Can See Business Owner Subscriptions?
- **System Administrator** - Full access to all subscription data
- **Business Owner** - Can view their own subscription via "My Subscription"
- **Business Manager** - Can view subscription status of owners they manage

### Who Has "More" Menu?
- **Business Manager** ✅ (IDs 6-12)
- **Business Owner** ✅ (IDs 6-13, includes My Subscription)
- **System Administrator** ❌ (Different menu structure)
- **Business Employee** ❌ (Permission-based menu only)

## Database Migration

**To apply the migration:**
```powershell
# From project root
mysql -u root -p naga_stall < database/migrations/029_business_owner_manager_connection.sql
```

**Verify migration:**
```sql
-- Check if table exists
SHOW TABLES LIKE 'business_owner_managers';

-- Check if column added
DESCRIBE stall_business_owner;

-- Check procedures
SHOW PROCEDURE STATUS WHERE Name LIKE '%BusinessOwner%';

-- Check migration record
SELECT * FROM migrations WHERE migration_name = '029_business_owner_manager_connection';
```

## Testing

### Test Scenario 1: Create Owner with Multiple Managers
```sql
-- Create owner with 2 managers
CALL createBusinessOwnerWithManagerConnection(
    'testowner1', '$2b$12$test', 'Test', 'Owner', 
    'test@test.com', '09123456789', 1, 1, '[3, 16]', 1
);

-- Verify relationships
SELECT * FROM business_owner_managers WHERE business_owner_id = LAST_INSERT_ID();
```

### Test Scenario 2: Manager Views Their Owners
```sql
-- NCPM_Manager (ID 1) checks their owners
CALL getManagerBusinessOwners(1);
```

### Test Scenario 3: Owner Views Their Managers
```sql
-- Owner ID 5 checks who manages them
CALL getBusinessOwnerManagers(5);
```

## Notes

1. **Primary Manager** - Every Business Owner must have exactly one primary manager
2. **Manager Cannot Be Removed** - Primary manager cannot be removed without assigning a new primary
3. **Many-to-Many** - One owner can have multiple managers; one manager can handle multiple owners
4. **Access Levels** - Future feature for granular permissions (Full, ViewOnly, Limited)
5. **Subscription Required** - All Business Owners must have a subscription plan assigned

## Future Enhancements

- [ ] Manager dashboard showing all their Business Owners
- [ ] Manager notification when Business Owner subscription expires
- [ ] Access level enforcement (currently all have Full access)
- [ ] Manager performance metrics
- [ ] Business Owner can request manager reassignment
- [ ] Manager can transfer ownership/responsibility
