# Role System Restructure - Migration Guide

## Overview
This migration restructures the entire role system in the DigiStall application, renaming existing roles and introducing a new System Administrator role.

## Role Name Changes

| Old Name | New Name | Description |
|----------|----------|-------------|
| `admin` | `stall_business_owner` | Business owners who manage stall operations |
| `branch_manager` | `business_manager` | Managers assigned to specific branches |
| `employee` | `business_employee` | Employees working under business managers |
| N/A | `system_administrator` | **NEW** - Top-level administrators who create business owners |

## Role Hierarchy

```
System Administrator (NEW)
    └── Creates and manages
        └── Stall Business Owner (formerly Admin)
            └── Creates and manages
                └── Business Manager (formerly Branch Manager)
                    └── Creates and manages
                        └── Business Employee (formerly Employee)
```

## Migration Files

All migration files are located in `database/migrations/`:

1. **024_role_system_restructure.sql** - Main migration that:
   - Creates `system_administrator` table
   - Renames `admin` → `stall_business_owner`
   - Renames `branch_manager` → `business_manager`
   - Renames `employee` → `business_employee`
   - Updates all foreign keys and constraints
   - Migrates all existing data
   - Creates default system administrator account

2. **025_system_administrator_procedures.sql** - CRUD stored procedures for System Administrator

3. **026_stall_business_owner_procedures.sql** - Updated stored procedures for Business Owner

4. **027_update_all_stored_procedures.sql** - Updates all existing stored procedures to use new table names

## How to Apply Migrations

### Option 1: Apply All at Once

```bash
# Navigate to database directory
cd database/migrations

# Apply all migrations in order
mysql -u root -p naga_stall < 024_role_system_restructure.sql
mysql -u root -p naga_stall < 025_system_administrator_procedures.sql
mysql -u root -p naga_stall < 026_stall_business_owner_procedures.sql
mysql -u root -p naga_stall < 027_update_all_stored_procedures.sql
```

### Option 2: Use Migration Runner (Recommended)

Create a file `run_role_migrations.js` in your Backend directory:

```javascript
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'naga_stall',
    multipleStatements: true
  });

  const migrations = [
    '024_role_system_restructure.sql',
    '025_system_administrator_procedures.sql',
    '026_stall_business_owner_procedures.sql',
    '027_update_all_stored_procedures.sql'
  ];

  try {
    for (const migration of migrations) {
      console.log(`Running migration: ${migration}`);
      const sql = await fs.readFile(
        path.join(__dirname, '../database/migrations', migration),
        'utf8'
      );
      await connection.query(sql);
      console.log(`✅ ${migration} completed`);
    }
    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigrations();
```

Then run:
```bash
node run_role_migrations.js
```

## Default System Administrator Account

After migration, a default system administrator account is created:

- **Username:** `sysadmin`
- **Password:** `SysAdmin@2025`
- **Email:** `sysadmin@nagastall.com`

**⚠️ IMPORTANT:** Change this password immediately after first login!

## Database Schema Changes

### New Tables

#### `system_administrator`
```sql
system_admin_id INT PRIMARY KEY AUTO_INCREMENT
username VARCHAR(50) UNIQUE
password_hash VARCHAR(255)
first_name VARCHAR(50)
last_name VARCHAR(50)
contact_number VARCHAR(20)
email VARCHAR(100) UNIQUE
status ENUM('Active', 'Inactive')
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Renamed Tables

#### `admin` → `stall_business_owner`
- `admin_id` → `business_owner_id`
- `admin_username` → `owner_username`
- `admin_password_hash` → `owner_password_hash`
- Added: `created_by_system_admin INT` (FK to system_administrator)

#### `branch_manager` → `business_manager`
- `branch_manager_id` → `business_manager_id`
- Added: `created_by_owner INT` (FK to stall_business_owner)

#### `employee` → `business_employee`
- `employee_id` → `business_employee_id`
- Foreign key references updated to `business_manager`

### Updated Foreign Keys

All tables referencing the old role tables have been updated:
- `branch.admin_id` → `branch.business_owner_id`
- `stall.created_by_manager` → `stall.created_by_business_manager`
- `stallholder.created_by_manager` → `stallholder.created_by_business_manager`
- `raffle.created_by_manager` → `raffle.created_by_business_manager`
- `auction.created_by_manager` → `auction.created_by_business_manager`
- And many more...

## New Stored Procedures

### System Administrator
- `createSystemAdministrator()`
- `getSystemAdministratorById()`
- `getSystemAdministratorByUsername()`
- `getAllSystemAdministrators()`
- `updateSystemAdministrator()`
- `deleteSystemAdministrator()`
- `loginSystemAdministrator()`
- `resetSystemAdministratorPassword()`

### Stall Business Owner (Updated)
- `createStallBusinessOwner()`
- `getStallBusinessOwnerById()`
- `getStallBusinessOwnerByUsername()`
- `getStallBusinessOwnerByUsernameLogin()`
- `getAllStallBusinessOwners()`
- `updateStallBusinessOwner()`
- `deleteStallBusinessOwner()`
- `resetStallBusinessOwnerPassword()`

### Business Manager (Updated)
- `getBusinessManagerByUsername()`
- `updateBusinessManager()`

### Business Employee (Updated)
- `createBusinessEmployee()`
- `getBusinessEmployeeById()`
- `getBusinessEmployeeByUsername()`
- `getAllBusinessEmployees()`
- `getBusinessEmployeesByBranch()`
- `updateBusinessEmployee()`
- `deleteBusinessEmployee()`
- `loginBusinessEmployee()`
- `logoutBusinessEmployee()`
- `resetBusinessEmployeePassword()`

## Dropped Procedures

The following old procedures are removed:
- `createAdmin()`
- `getAdminById()`
- `getAdminByUsername()`
- `getAdminByUsernameLogin()`
- `createEmployee()`
- `getEmployeeById()`
- `getEmployeeByUsername()`
- `getAllEmployees()`
- `getEmployeesByBranch()`
- `updateEmployee()`
- `deleteEmployee()`
- `loginEmployee()`
- `logoutEmployee()`
- `resetEmployeePassword()`
- `getBranchManagerByUsername()`
- `updateBranchManager()`

## Backend Code Changes Required

After applying database migrations, you'll need to update your backend code:

### 1. Update Model/Entity Names
```javascript
// Old
const Admin = require('./models/Admin');
const BranchManager = require('./models/BranchManager');
const Employee = require('./models/Employee');

// New
const SystemAdministrator = require('./models/SystemAdministrator');
const StallBusinessOwner = require('./models/StallBusinessOwner');
const BusinessManager = require('./models/BusinessManager');
const BusinessEmployee = require('./models/BusinessEmployee');
```

### 2. Update Route Files
Rename and update route files:
- `adminRoutes.js` → `stallBusinessOwnerRoutes.js`
- `branchManagerRoutes.js` → `businessManagerRoutes.js`
- `employeeRoutes.js` → `businessEmployeeRoutes.js`
- Create new: `systemAdministratorRoutes.js`

### 3. Update Controller Files
Similar to routes, rename controller files:
- `adminController.js` → `stallBusinessOwnerController.js`
- `branchManagerController.js` → `businessManagerController.js`
- `employeeController.js` → `businessEmployeeController.js`
- Create new: `systemAdministratorController.js`

### 4. Update Service Files
Update service layer to use new stored procedures:
```javascript
// Old
await db.query('CALL getAdminByUsername(?)', [username]);
await db.query('CALL createEmployee(...)', [...]);

// New
await db.query('CALL getStallBusinessOwnerByUsername(?)', [username]);
await db.query('CALL createBusinessEmployee(...)', [...]);
```

### 5. Update Authentication Middleware
Update role checking logic:
```javascript
// Old
const ROLES = {
  ADMIN: 'admin',
  BRANCH_MANAGER: 'branch_manager',
  EMPLOYEE: 'employee'
};

// New
const ROLES = {
  SYSTEM_ADMIN: 'system_administrator',
  BUSINESS_OWNER: 'stall_business_owner',
  BUSINESS_MANAGER: 'business_manager',
  BUSINESS_EMPLOYEE: 'business_employee'
};
```

### 6. Update Login Logic
Update login endpoint to check all role types:
```javascript
async function login(username, password) {
  // Check System Administrator
  let user = await db.query('CALL loginSystemAdministrator(?)', [username]);
  if (user.length > 0) return { ...user[0], role: 'system_administrator' };
  
  // Check Stall Business Owner
  user = await db.query('CALL getStallBusinessOwnerByUsernameLogin(?)', [username]);
  if (user.length > 0) return { ...user[0], role: 'stall_business_owner' };
  
  // Check Business Manager
  user = await db.query('CALL getBusinessManagerByUsername(?)', [username]);
  if (user.length > 0) return { ...user[0], role: 'business_manager' };
  
  // Check Business Employee
  user = await db.query('CALL getBusinessEmployeeByUsername(?)', [username]);
  if (user.length > 0) return { ...user[0], role: 'business_employee' };
  
  return null;
}
```

## Frontend Code Changes Required

### 1. Update Role Constants
```javascript
// store/auth.js or constants/roles.js

// Old
export const ROLES = {
  ADMIN: 'admin',
  BRANCH_MANAGER: 'branch_manager',
  EMPLOYEE: 'employee'
};

// New
export const ROLES = {
  SYSTEM_ADMIN: 'system_administrator',
  BUSINESS_OWNER: 'stall_business_owner',
  BUSINESS_MANAGER: 'business_manager',
  BUSINESS_EMPLOYEE: 'business_employee'
};
```

### 2. Update Role-Based Routing
```javascript
// router/index.js

// Old
if (userRole === 'admin') {
  router.push('/admin/dashboard');
} else if (userRole === 'branch_manager') {
  router.push('/manager/dashboard');
}

// New
if (userRole === 'system_administrator') {
  router.push('/system-admin/dashboard');
} else if (userRole === 'stall_business_owner') {
  router.push('/business-owner/dashboard');
} else if (userRole === 'business_manager') {
  router.push('/manager/dashboard');
}
```

### 3. Update Permission Checks
```javascript
// Old
const canAccessBranches = user.role === 'admin';
const canManageEmployees = user.role === 'branch_manager';

// New
const canAccessBranches = ['system_administrator', 'stall_business_owner'].includes(user.role);
const canManageEmployees = user.role === 'business_manager';
```

### 4. Create System Administrator Page
Create new components for System Administrator:
- `SystemAdminDashboard.vue`
- `ManageBusinessOwners.vue`
- `CreateBusinessOwner.vue`

### 5. Update API Endpoints
```javascript
// Old
const response = await axios.get('/api/admin/branches');
const response = await axios.post('/api/employee/create', data);

// New
const response = await axios.get('/api/business-owner/branches');
const response = await axios.post('/api/business-employee/create', data);
```

### 6. Update Navigation/Sidebar
Update navigation items based on new roles:
```javascript
const navigationItems = {
  system_administrator: [
    { label: 'Manage Business Owners', path: '/system-admin/owners' },
    { label: 'System Settings', path: '/system-admin/settings' }
  ],
  stall_business_owner: [
    { label: 'Branches', path: '/business-owner/branches' },
    { label: 'Managers', path: '/business-owner/managers' }
  ],
  business_manager: [
    { label: 'Dashboard', path: '/manager/dashboard' },
    { label: 'Employees', path: '/manager/employees' }
  ],
  business_employee: [
    { label: 'Dashboard', path: '/employee/dashboard' }
  ]
};
```

## Testing Checklist

After applying migrations, test the following:

### Database Level
- [ ] All tables renamed successfully
- [ ] All foreign keys updated correctly
- [ ] Data migrated without loss
- [ ] All stored procedures working
- [ ] Default system admin can login

### Backend Level
- [ ] System Administrator CRUD operations work
- [ ] Stall Business Owner CRUD operations work
- [ ] Business Manager CRUD operations work
- [ ] Business Employee CRUD operations work
- [ ] Login detects all role types correctly
- [ ] Session management works for all roles
- [ ] Permission checks work correctly

### Frontend Level
- [ ] System Admin can login and see their dashboard
- [ ] Business Owner can login and see their dashboard
- [ ] Business Manager can login and see their dashboard
- [ ] Business Employee can login and see their dashboard
- [ ] Navigation reflects correct roles
- [ ] Role-based features show/hide correctly
- [ ] Create/edit forms work for all entities

## Rollback Plan

If you need to rollback, the old tables are NOT deleted. They are:
- `admin` table (data copied to `stall_business_owner`)
- `branch_manager` table (data copied to `business_manager`)
- `employee` table (data copied to `business_employee`)

To rollback:
1. Stop your application
2. Restore from backup
3. OR manually drop new tables and rename old ones back

⚠️ **Always backup your database before running migrations!**

## Support

If you encounter issues:
1. Check migration logs for errors
2. Verify all migrations ran successfully
3. Check the `migrations` table for executed migrations
4. Review foreign key constraints
5. Ensure no data was lost during migration

## Next Steps

1. ✅ Apply database migrations
2. ✅ Update backend code
3. ✅ Update frontend code
4. ✅ Test all functionality
5. ✅ Update API documentation
6. ✅ Train users on new role names
7. ✅ Change default system admin password

---

**Migration Date:** 2025-11-26  
**Version:** 1.0.0  
**Status:** Ready for deployment
