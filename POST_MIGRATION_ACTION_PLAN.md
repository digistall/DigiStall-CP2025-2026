# Post-Migration Action Plan

## ✅ Database Migration Complete

The database has been successfully restructured with new role names and the System Administrator feature.

## 📋 Required Backend Changes

### 1. Create New Model Files

Create these new model files in `Backend/models/`:

#### `SystemAdministrator.js`
```javascript
class SystemAdministrator {
  static tableName = 'system_administrator';
  static idColumn = 'system_admin_id';
  
  // Add model methods here
}
```

#### `StallBusinessOwner.js` (replaces Admin.js)
```javascript
class StallBusinessOwner {
  static tableName = 'stall_business_owner';
  static idColumn = 'business_owner_id';
  
  // Migrate logic from Admin.js
}
```

#### `BusinessManager.js` (replaces BranchManager.js)
```javascript
class BusinessManager {
  static tableName = 'business_manager';
  static idColumn = 'business_manager_id';
  
  // Migrate logic from BranchManager.js
}
```

#### `BusinessEmployee.js` (replaces Employee.js)
```javascript
class BusinessEmployee {
  static tableName = 'business_employee';
  static idColumn = 'business_employee_id';
  
  // Migrate logic from Employee.js
}
```

### 2. Create New Controller Files

Create in `Backend/controllers/`:

- `systemAdministratorController.js`
- `stallBusinessOwnerController.js` (migrate from adminController.js)
- `businessManagerController.js` (migrate from branchManagerController.js)
- `businessEmployeeController.js` (migrate from employeeController.js)

### 3. Create New Route Files

Create in `Backend/routes/`:

- `systemAdministratorRoutes.js`
- `stallBusinessOwnerRoutes.js` (migrate from adminRoutes.js)
- `businessManagerRoutes.js` (migrate from branchManagerRoutes.js)
- `businessEmployeeRoutes.js` (migrate from employeeRoutes.js)

### 4. Update Service Files

Update `Backend/services/` to call new stored procedures:

**Old Procedure Calls → New Procedure Calls**

```javascript
// Admin → Stall Business Owner
'CALL createAdmin(...)' → 'CALL createStallBusinessOwner(...)'
'CALL getAdminById(?)' → 'CALL getStallBusinessOwnerById(?)'
'CALL getAdminByUsername(?)' → 'CALL getStallBusinessOwnerByUsername(?)'

// Branch Manager → Business Manager
'CALL getBranchManagerByUsername(?)' → 'CALL getBusinessManagerByUsername(?)'
'CALL updateBranchManager(...)' → 'CALL updateBusinessManager(...)'

// Employee → Business Employee
'CALL createEmployee(...)' → 'CALL createBusinessEmployee(...)'
'CALL getEmployeeById(?)' → 'CALL getBusinessEmployeeById(?)'
'CALL getAllEmployees(...)' → 'CALL getAllBusinessEmployees(...)'
'CALL loginEmployee(...)' → 'CALL loginBusinessEmployee(...)'

// New System Administrator
'CALL createSystemAdministrator(...)'
'CALL getSystemAdministratorByUsername(?)'
'CALL loginSystemAdministrator(?)'
```

### 5. Update Authentication Middleware

Update `Backend/middleware/auth.js`:

```javascript
const ROLES = {
  SYSTEM_ADMIN: 'system_administrator',
  BUSINESS_OWNER: 'stall_business_owner',
  BUSINESS_MANAGER: 'business_manager',
  BUSINESS_EMPLOYEE: 'business_employee'
};

// Update login detection
async function detectUserRole(username) {
  // Check System Administrator
  let user = await callProcedure('loginSystemAdministrator', [username]);
  if (user) return { ...user, role: ROLES.SYSTEM_ADMIN };
  
  // Check Stall Business Owner
  user = await callProcedure('getStallBusinessOwnerByUsernameLogin', [username]);
  if (user) return { ...user, role: ROLES.BUSINESS_OWNER };
  
  // Check Business Manager
  user = await callProcedure('getBusinessManagerByUsername', [username]);
  if (user) return { ...user, role: ROLES.BUSINESS_MANAGER };
  
  // Check Business Employee
  user = await callProcedure('getBusinessEmployeeByUsername', [username]);
  if (user) return { ...user, role: ROLES.BUSINESS_EMPLOYEE };
  
  return null;
}

// Update role checking middleware
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

### 6. Update Main Server File

Update `Backend/server.js`:

```javascript
// Old
const adminRoutes = require('./routes/adminRoutes');
const branchManagerRoutes = require('./routes/branchManagerRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

app.use('/api/admin', adminRoutes);
app.use('/api/manager', branchManagerRoutes);
app.use('/api/employee', employeeRoutes);

// New
const systemAdminRoutes = require('./routes/systemAdministratorRoutes');
const businessOwnerRoutes = require('./routes/stallBusinessOwnerRoutes');
const businessManagerRoutes = require('./routes/businessManagerRoutes');
const businessEmployeeRoutes = require('./routes/businessEmployeeRoutes');

app.use('/api/system-admin', systemAdminRoutes);
app.use('/api/business-owner', businessOwnerRoutes);
app.use('/api/business-manager', businessManagerRoutes);
app.use('/api/business-employee', businessEmployeeRoutes);
```

## 📋 Required Frontend Changes

### 1. Update Role Constants

Update `Frontend/Web/src/stores/auth.js` or `constants/roles.js`:

```javascript
export const ROLES = {
  SYSTEM_ADMIN: 'system_administrator',
  BUSINESS_OWNER: 'stall_business_owner',
  BUSINESS_MANAGER: 'business_manager',
  BUSINESS_EMPLOYEE: 'business_employee'
};
```

### 2. Update Router

Update `Frontend/Web/src/router/index.js`:

```javascript
// Add new System Admin routes
{
  path: '/system-admin',
  component: SystemAdminLayout,
  meta: { requiresAuth: true, role: 'system_administrator' },
  children: [
    {
      path: 'dashboard',
      component: SystemAdminDashboard
    },
    {
      path: 'business-owners',
      component: ManageBusinessOwners
    }
  ]
},

// Update existing routes with new role names
{
  path: '/business-owner',
  meta: { role: 'stall_business_owner' },
  // ...
},
{
  path: '/manager',
  meta: { role: 'business_manager' },
  // ...
},
{
  path: '/employee',
  meta: { role: 'business_employee' },
  // ...
}
```

### 3. Create New Vue Components

Create in `Frontend/Web/src/views/`:

**System Administrator Views:**
- `SystemAdmin/Dashboard.vue`
- `SystemAdmin/ManageBusinessOwners.vue`
- `SystemAdmin/CreateBusinessOwner.vue`
- `SystemAdmin/Settings.vue`

### 4. Update Navigation Components

Update `Frontend/Web/src/components/Navigation.vue`:

```javascript
const navigationItems = computed(() => {
  const role = authStore.user?.role;
  
  switch(role) {
    case 'system_administrator':
      return [
        { label: 'Dashboard', path: '/system-admin/dashboard', icon: 'dashboard' },
        { label: 'Business Owners', path: '/system-admin/business-owners', icon: 'people' },
        { label: 'Settings', path: '/system-admin/settings', icon: 'settings' }
      ];
    
    case 'stall_business_owner':
      return [
        { label: 'Dashboard', path: '/business-owner/dashboard', icon: 'dashboard' },
        { label: 'Branches', path: '/business-owner/branches', icon: 'store' },
        { label: 'Managers', path: '/business-owner/managers', icon: 'people' }
      ];
    
    case 'business_manager':
      return [
        { label: 'Dashboard', path: '/manager/dashboard', icon: 'dashboard' },
        { label: 'Employees', path: '/manager/employees', icon: 'people' },
        { label: 'Stallholders', path: '/manager/stallholders', icon: 'storefront' }
      ];
    
    case 'business_employee':
      return [
        { label: 'Dashboard', path: '/employee/dashboard', icon: 'dashboard' },
        { label: 'Payments', path: '/employee/payments', icon: 'payment' }
      ];
    
    default:
      return [];
  }
});
```

### 5. Update Auth Store

Update `Frontend/Web/src/stores/auth.js`:

```javascript
async login(username, password) {
  const response = await axios.post('/api/auth/login', {
    username,
    password
  });
  
  const { user, token } = response.data;
  
  this.user = user;
  this.token = token;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Redirect based on role
  switch(user.role) {
    case 'system_administrator':
      router.push('/system-admin/dashboard');
      break;
    case 'stall_business_owner':
      router.push('/business-owner/dashboard');
      break;
    case 'business_manager':
      router.push('/manager/dashboard');
      break;
    case 'business_employee':
      router.push('/employee/dashboard');
      break;
    default:
      router.push('/');
  }
}
```

### 6. Update API Service

Update `Frontend/Web/src/services/api.js`:

```javascript
// Old endpoints
export const adminAPI = {
  getBranches: () => axios.get('/api/admin/branches'),
  createBranch: (data) => axios.post('/api/admin/branches', data)
};

// New endpoints
export const systemAdminAPI = {
  getBusinessOwners: () => axios.get('/api/system-admin/business-owners'),
  createBusinessOwner: (data) => axios.post('/api/system-admin/business-owners', data)
};

export const businessOwnerAPI = {
  getBranches: () => axios.get('/api/business-owner/branches'),
  createBranch: (data) => axios.post('/api/business-owner/branches', data)
};

export const businessManagerAPI = {
  getEmployees: () => axios.get('/api/business-manager/employees'),
  createEmployee: (data) => axios.post('/api/business-manager/employees', data)
};

export const businessEmployeeAPI = {
  getPayments: () => axios.get('/api/business-employee/payments')
};
```

## 🧪 Testing Checklist

### Database Tests
- [ ] System Administrator can be created
- [ ] System Administrator can login
- [ ] Stall Business Owner can be created by System Admin
- [ ] Business Manager procedures work
- [ ] Business Employee procedures work
- [ ] All foreign keys work correctly
- [ ] Old data migrated successfully

### Backend Tests
- [ ] System Admin endpoints work
- [ ] Business Owner endpoints work
- [ ] Business Manager endpoints work
- [ ] Business Employee endpoints work
- [ ] Authentication works for all roles
- [ ] Authorization middleware works
- [ ] Role hierarchy enforced

### Frontend Tests
- [ ] System Admin can login and access dashboard
- [ ] System Admin can create Business Owners
- [ ] Business Owner can login and access dashboard
- [ ] Business Manager can login and access dashboard
- [ ] Business Employee can login and access dashboard
- [ ] Navigation shows correct items per role
- [ ] Role-based features show/hide correctly

## 🔒 Security Checklist

- [ ] Change default system admin password
- [ ] Test permission boundaries
- [ ] Verify users can only access their allowed resources
- [ ] Test cross-role access prevention
- [ ] Verify token validation for all roles

## 📝 Documentation Updates

- [ ] Update API documentation with new endpoints
- [ ] Update user guide with new role names
- [ ] Create System Administrator manual
- [ ] Update developer documentation

## 🎯 Deployment Steps

1. **Backup Production Database**
   ```bash
   mysqldump -u root -p naga_stall > backup_before_role_migration.sql
   ```

2. **Apply Database Migrations**
   ```bash
   node Backend/run_role_migrations.js
   ```

3. **Deploy Backend Updates**
   - Deploy new controllers, routes, services
   - Update environment variables if needed
   - Restart backend server

4. **Deploy Frontend Updates**
   - Build frontend with new changes
   - Deploy to web server
   - Clear browser cache

5. **Verify Deployment**
   - Test all role logins
   - Verify functionality for each role
   - Monitor error logs

## 📞 Support

If you encounter issues:
1. Check migration logs
2. Verify database schema
3. Test stored procedures manually
4. Review error logs
5. Contact development team

---

**Status:** Ready for implementation  
**Priority:** High  
**Estimated Time:** 8-12 hours
