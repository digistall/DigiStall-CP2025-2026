# DigiStall Database Table Rename & Role-Based Permission Fix Guide

**Generated:** November 27, 2025  
**Database Version:** naga_stall (4).sql

## 🎯 Executive Summary

This guide provides complete fixes for:
1. **Employee API 500 Error** - ✅ COMPLETED
2. **Table/Role Name Updates Throughout Codebase**
3. **Stall Business Owner View-Only Permissions**
4. **Subscription Feature UI & Backend**
5. **Hardcoded branch_id Removal**
6. **Frontend Role Check Updates**

---

## ✅ 1. Employee API Fix (COMPLETED)

### Problem
- Controller was calling `getAllEmployees` but procedure is `getAllBusinessEmployees`
- Similar mismatches for all employee-related procedures

### Solution Applied
Updated `Backend/Backend-Web/controllers/employees/employeeController.js`:

**Procedure Name Mappings:**
```javascript
// OLD → NEW
getAllEmployees → getAllBusinessEmployees
createEmployee → createBusinessEmployee
getEmployeeById → getBusinessEmployeeById
updateEmployee → updateBusinessEmployee
deleteEmployee → deleteBusinessEmployee
getEmployeeByUsername → getBusinessEmployeeByUsername
loginEmployee → loginBusinessEmployee
logoutEmployee → logoutBusinessEmployee
resetEmployeePassword → resetBusinessEmployeePassword
getEmployeesByBranch → getBusinessEmployeesByBranch
```

**Field Name Updates:**
```javascript
// OLD → NEW
employee_id → business_employee_id
branchManagerId → businessManagerId
```

---

## 🔧 2. Table & Role Name Updates Needed

### Database Table Changes

| Old Name | New Name | Usage |
|----------|----------|-------|
| `branch_manager` | `business_manager` | Manager accounts |
| `admin` (role) | `stall_business_owner` | Owner accounts |
| N/A | `system_administrator` | System admin accounts |
| `employee` | `business_employee` | Employee accounts |

### Files Requiring Updates

#### A. Controllers (`Backend/Backend-Web/controllers/`)

**complianceController.js:**
```javascript
// Lines to fix:
Line 25: if (userType === 'branch_manager' || userType === 'employee')
Line 28: } else if (userType === 'admin')
Line 29: // Admins can filter by specific branch or see all
Line 162: // If admin, get branch from stallholder using stored procedure
Line 307: if (userType !== 'admin' && userType !== 'branch_manager')
Line 310: message: 'Only admins and branch managers can delete compliance records'
Line 367: const branchId = userType === 'admin' ? null : userBranchId;

// REPLACE WITH:
Line 25: if (userType === 'business_manager' || userType === 'business_employee')
Line 28: } else if (userType === 'stall_business_owner' || userType === 'system_administrator')
Line 162: // If owner/admin, get branch from stallholder
Line 307: if (userType !== 'system_administrator' && userType !== 'stall_business_owner' && userType !== 'business_manager')
Line 310: message: 'Only system administrators, business owners, and managers can delete compliance records'
Line 367: const branchId = (userType === 'stall_business_owner' || userType === 'system_administrator') ? null : userBranchId;
```

**stalls/addStall.js:**
```javascript
// Lines 27, 183:
if (userType === "branch_manager" || userType === "branch-manager")
// REPLACE WITH:
if (userType === "business_manager")

// Lines 188-191, 252-254:
SELECT bm.branch_id, b.branch_name, b.area, bm.branch_manager_id
FROM branch_manager bm
WHERE bm.branch_manager_id = ?
// REPLACE WITH:
SELECT bm.branch_id, b.branch_name, b.area, bm.business_manager_id
FROM business_manager bm
WHERE bm.business_manager_id = ?

// Lines 205, 270:
actualManagerId = branchInfo.branch_manager_id;
// REPLACE WITH:
actualManagerId = branchInfo.business_manager_id;
```

**stalls/stallComponents/deleteStall.js:**
```javascript
// Lines 24, 58:
if (userType === "branch_manager" || userType === "branch-manager")
// REPLACE WITH:
if (userType === "business_manager")

// Lines 66-67:
INNER JOIN branch_manager bm ON b.branch_id = bm.branch_id
WHERE s.stall_id = ? AND bm.branch_manager_id = ?
// REPLACE WITH:
INNER JOIN business_manager bm ON b.branch_id = bm.branch_id
WHERE s.stall_id = ? AND bm.business_manager_id = ?
```

**stallholders/documentController.js:**
```javascript
// Line 44 (appears twice):
LEFT JOIN branch_manager bm ON bdr.created_by_manager = bm.branch_manager_id
// REPLACE WITH:
LEFT JOIN business_manager bm ON bdr.created_by_business_manager = bm.business_manager_id

// Line 77:
const created_by_manager = req.user.userId || req.user.user_id || req.user.id || req.user.branch_manager_id;
// REPLACE WITH:
const created_by_manager = req.user.userId || req.user.user_id || req.user.id || req.user.business_manager_id;
```

**stallsLanding queries:**
```javascript
// Update all queries in LandingPageComponents-StallController/*/
// FROM:
LEFT JOIN branch_manager bm ON b.branch_id = bm.branch_id
// TO:
LEFT JOIN business_manager bm ON b.branch_id = bm.branch_id
```

#### B. Routes (`Backend/Backend-Web/routes/`)

**enhancedAuthRoutes.js:**
```javascript
// Lines 17, 19:
adminLogin, createAdminUser
// CONTEXT ONLY - These are for business_owner login

// Lines 34, 45:
router.post('/create-business-owner', createAdminUser);
router.post('/business-owner/login', adminLogin);
// Keep as is - these route to business owner functions
```

**complianceRoutes.js:**
```javascript
// Line 33:
@query branch_id (optional) - Filter by branch (admin only)
// UPDATE TO:
@query branch_id (optional) - Filter by branch (system admin/owner only)

// Line 76:
@access Protected - Admin and Branch Manager only
// UPDATE TO:
@access Protected - System Admin, Business Owner, and Business Manager only
```

**stallholderRoutes.js:**
```javascript
// Lines 198, 205, 212:
* @access Admin
// UPDATE TO:
* @access Business Manager
```

**stallRoutes.js:**
```javascript
// Line 4:
// Core stall management (Admin)
// UPDATE TO:
// Core stall management (Business Manager)
```

---

## 🔐 3. Stall Business Owner View-Only Permissions

### Problem
- Business owners should ONLY VIEW data across all their branches
- They should NOT be able to add, edit, or delete anything
- Need to filter data using `business_owner_managers` table

### Solution

#### A. Create Middleware (`Backend/Backend-Web/middleware/rolePermissions.js`)

```javascript
export const viewOnlyForOwners = (req, res, next) => {
    const userType = req.user?.userType;
    const method = req.method;
    
    // Business owners can only perform GET requests
    if (userType === 'stall_business_owner' && method !== 'GET') {
        return res.status(403).json({
            success: false,
            message: 'Business owners have view-only access. Cannot perform create, update, or delete operations.'
        });
    }
    
    next();
};

export const getOwnerBranches = async (req, connection) => {
    const userId = req.user?.userId;
    const userType = req.user?.userType;
    
    if (userType !== 'stall_business_owner') {
        return null;
    }
    
    // Get all branches for this owner
    const [branches] = await connection.execute(
        `SELECT DISTINCT bm.branch_id
         FROM business_owner_managers bom
         INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
         WHERE bom.business_owner_id = ? AND bom.status = 'Active'`,
        [userId]
    );
    
    return branches.map(b => b.branch_id);
};
```

#### B. Update Controllers to Use Owner Filtering

**Example: stallholderController.js**
```javascript
import { getOwnerBranches } from '../../middleware/rolePermissions.js';

export async function getAllStallholders(req, res) {
    let connection;
    try {
        const userType = req.user?.userType;
        const userBranchId = req.user?.branchId;
        
        connection = await createConnection();
        
        let branchFilter;
        
        if (userType === 'stall_business_owner') {
            // Get all branches owned by this business owner
            const ownerBranches = await getOwnerBranches(req, connection);
            
            if (!ownerBranches || ownerBranches.length === 0) {
                return res.json({ success: true, data: [] });
            }
            
            branchFilter = ownerBranches;
        } else if (userType === 'business_manager' || userType === 'business_employee') {
            branchFilter = [userBranchId];
        } else if (userType === 'system_administrator') {
            branchFilter = null; // See all
        }
        
        let query = `
            SELECT sh.*, b.branch_name, st.stall_no
            FROM stallholder sh
            LEFT JOIN branch b ON sh.branch_id = b.branch_id
            LEFT JOIN stall st ON sh.stall_id = st.stall_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (branchFilter) {
            query += ` AND sh.branch_id IN (${branchFilter.map(() => '?').join(',')})`;
            params.push(...branchFilter);
        }
        
        const [stallholders] = await connection.execute(query, params);
        
        res.json({ success: true, data: stallholders });
    } catch (error) {
        console.error('Error getting stallholders:', error);
        res.status(500).json({ success: false, message: 'Failed to get stallholders' });
    } finally {
        if (connection) await connection.end();
    }
}
```

#### C. Apply Middleware to Routes

```javascript
import { viewOnlyForOwners } from '../middleware/rolePermissions.js';

// Apply to all routes that business owners can access
router.use(viewOnlyForOwners);

// Now all POST, PUT, DELETE will be blocked for business owners
```

---

## 💳 4. Subscription Feature UI & Backend

### Backend Implementation

#### A. Routes (`Backend/Backend-Web/routes/subscriptionRoutes.js`)

Already exists, verify these endpoints work:
```javascript
// GET endpoints (business owners can use):
GET /api/subscriptions/plans - Get all subscription plans
GET /api/subscriptions/:businessOwnerId - Get owner's subscription
GET /api/subscriptions/:businessOwnerId/history - Payment history

// POST endpoint (system admin only):
POST /api/subscriptions/payment - Record payment (admin only)
```

#### B. Controller Updates (`Backend/Backend-Web/controllers/subscriptions/subscriptionController.js`)

Add public plan viewing endpoint:
```javascript
export const getPublicPlans = async (req, res) => {
    let connection;
    try {
        connection = await createConnection();
        
        const [plans] = await connection.execute(
            'CALL getAllSubscriptionPlans()'
        );
        
        res.json({
            success: true,
            data: plans[0] || []
        });
    } catch (error) {
        console.error('Error getting subscription plans:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get subscription plans'
        });
    } finally {
        if (connection) await connection.end();
    }
};

export const getBusinessOwnerSubscription = async (req, res) => {
    let connection;
    try {
        const businessOwnerId = req.user?.userId;
        
        connection = await createConnection();
        
        const [subscription] = await connection.execute(
            'CALL getBusinessOwnerSubscription(?)',
            [businessOwnerId]
        );
        
        res.json({
            success: true,
            data: subscription[0]?.[0] || null
        });
    } catch (error) {
        console.error('Error getting subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get subscription'
        });
    } finally {
        if (connection) await connection.end();
    }
};
```

### Frontend Implementation

#### A. Create Subscription Component (`Frontend/Web/src/views/owner/Subscriptions.vue`)

```vue
<template>
  <div class="subscriptions-container">
    <CCard>
      <CCardHeader>
        <h4>Subscription Management</h4>
      </CCardHeader>
      <CCardBody>
        <!-- Current Subscription Status -->
        <div v-if="currentSubscription" class="mb-4">
          <h5>Current Subscription</h5>
          <div class="subscription-card">
            <CRow>
              <CCol md="6">
                <p><strong>Plan:</strong> {{ currentSubscription.plan_name }}</p>
                <p><strong>Status:</strong>
                  <CBadge :color="getStatusColor(currentSubscription.subscription_status)">
                    {{ currentSubscription.subscription_status }}
                  </CBadge>
                </p>
              </CCol>
              <CCol md="6">
                <p><strong>Monthly Fee:</strong> ₱{{ formatCurrency(currentSubscription.monthly_fee) }}</p>
                <p><strong>Expiry Date:</strong> {{ formatDate(currentSubscription.end_date) }}</p>
                <p><strong>Days Remaining:</strong> {{ currentSubscription.days_remaining }}</p>
              </CCol>
            </CRow>
          </div>
        </div>

        <!-- Available Plans -->
        <div class="mb-4">
          <h5>Available Plans</h5>
          <CRow>
            <CCol md="4" v-for="plan in plans" :key="plan.plan_id">
              <CCard class="plan-card">
                <CCardHeader>
                  <h6>{{ plan.plan_name }}</h6>
                </CCardHeader>
                <CCardBody>
                  <p class="plan-price">₱{{ formatCurrency(plan.monthly_fee) }}/month</p>
                  <p>{{ plan.plan_description }}</p>
                  <ul class="plan-features">
                    <li>Max Branches: {{ plan.max_branches === 999 ? 'Unlimited' : plan.max_branches }}</li>
                    <li>Max Employees: {{ plan.max_employees === 999 ? 'Unlimited' : plan.max_employees }}</li>
                  </ul>
                  <CButton 
                    color="primary" 
                    block 
                    @click="selectPlan(plan)"
                    :disabled="currentSubscription?.plan_id === plan.plan_id"
                  >
                    {{ currentSubscription?.plan_id === plan.plan_id ? 'Current Plan' : 'Select Plan' }}
                  </CButton>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </div>

        <!-- Payment History -->
        <div>
          <h5>Payment History</h5>
          <CTable striped hover>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell>Amount</CTableHeaderCell>
                <CTableHeaderCell>Method</CTableHeaderCell>
                <CTableHeaderCell>Receipt</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-for="payment in paymentHistory" :key="payment.payment_id">
                <CTableDataCell>{{ formatDate(payment.payment_date) }}</CTableDataCell>
                <CTableDataCell>₱{{ formatCurrency(payment.amount) }}</CTableDataCell>
                <CTableDataCell>{{ payment.payment_method }}</CTableDataCell>
                <CTableDataCell>{{ payment.receipt_number }}</CTableDataCell>
                <CTableDataCell>
                  <CBadge :color="getStatusColor(payment.payment_status)">
                    {{ payment.payment_status }}
                  </CBadge>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
        </div>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Subscriptions',
  data() {
    return {
      plans: [],
      currentSubscription: null,
      paymentHistory: [],
      loading: false
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const token = localStorage.getItem('authToken');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch all data in parallel
        const [plansRes, subscriptionRes, historyRes] = await Promise.all([
          axios.get(`${process.env.VUE_APP_API_URL}/api/subscriptions/plans`, { headers }),
          axios.get(`${process.env.VUE_APP_API_URL}/api/subscriptions/current`, { headers }),
          axios.get(`${process.env.VUE_APP_API_URL}/api/subscriptions/history`, { headers })
        ]);

        this.plans = plansRes.data.data || [];
        this.currentSubscription = subscriptionRes.data.data;
        this.paymentHistory = historyRes.data.data || [];
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        this.$toast.error('Failed to load subscription data');
      } finally {
        this.loading = false;
      }
    },
    selectPlan(plan) {
      this.$toast.info('Please contact administrator to change your subscription plan');
    },
    formatCurrency(value) {
      return parseFloat(value || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },
    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-PH');
    },
    getStatusColor(status) {
      const colors = {
        'Active': 'success',
        'Pending': 'warning',
        'Expired': 'danger',
        'Suspended': 'danger',
        'Completed': 'success'
      };
      return colors[status] || 'secondary';
    }
  }
};
</script>

<style scoped>
.subscriptions-container {
  padding: 20px;
}

.subscription-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.plan-card {
  height: 100%;
  margin-bottom: 20px;
}

.plan-price {
  font-size: 24px;
  font-weight: bold;
  color: #321fdb;
  margin: 15px 0;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 15px 0;
}

.plan-features li {
  padding: 5px 0;
  border-bottom: 1px solid #e0e0e0;
}
</style>
```

#### B. Add to Router (`Frontend/Web/src/router/index.js`)

```javascript
{
  path: '/subscriptions',
  name: 'Subscriptions',
  component: () => import('@/views/owner/Subscriptions.vue'),
  meta: {
    requiresAuth: true,
    roles: ['stall_business_owner'] // Only owners can see this
  }
}
```

#### C. Add to Sidebar (`Frontend/Web/src/components/AppSidebar.vue`)

```javascript
// In menuItems array, add for owners:
{
  name: 'Subscriptions',
  icon: 'cil-credit-card',
  to: '/subscriptions',
  roles: ['stall_business_owner']
}
```

---

## 🔍 5. Remove Hardcoded branch_id References

### Search Strategy
```bash
# In PowerShell:
Get-ChildItem -Path "Backend\Backend-Web" -Recurse -Filter "*.js" | Select-String "branch_id\s*=\s*1" -List

# Or grep in Git Bash:
grep -r "branch_id = 1" Backend/Backend-Web/
grep -r "branch_id=1" Backend/Backend-Web/
grep -r 'branch_id: 1' Backend/Backend-Web/
```

### Common Patterns to Replace

```javascript
// BAD:
const branchId = 1;
WHERE branch_id = 1
branch_id: 1

// GOOD:
const branchId = req.user?.branchId;
WHERE branch_id = ?  // with parameter
branch_id: req.user?.branchId
```

### Example Fixes

**Before:**
```javascript
const [stallholders] = await connection.execute(
    'SELECT * FROM stallholder WHERE branch_id = 1'
);
```

**After:**
```javascript
const branchId = req.user?.branchId;
const [stallholders] = await connection.execute(
    'SELECT * FROM stallholder WHERE branch_id = ?',
    [branchId]
);
```

---

## 🎨 6. Frontend Role Check Updates

### A. Update Constants (`Frontend/Web/src/utils/constants.js`)

```javascript
export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_administrator',
  BUSINESS_OWNER: 'stall_business_owner',
  BUSINESS_MANAGER: 'business_manager',
  BUSINESS_EMPLOYEE: 'business_employee',
  APPLICANT: 'applicant'
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.SYSTEM_ADMIN]: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true,
    viewAllBranches: true
  },
  [USER_ROLES.BUSINESS_OWNER]: {
    canCreate: false,  // View only!
    canEdit: false,
    canDelete: false,
    canView: true,
    viewAllBranches: true // All branches they own
  },
  [USER_ROLES.BUSINESS_MANAGER]: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true,
    viewAllBranches: false // Only their branch
  },
  [USER_ROLES.BUSINESS_EMPLOYEE]: {
    canCreate: false, // Based on permissions
    canEdit: false,
    canDelete: false,
    canView: true,
    viewAllBranches: false
  }
};
```

### B. Update Auth Service (`Frontend/Web/src/services/authService.js`)

```javascript
export const hasPermission = (action) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || user.userType;
  
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  
  // Check role-level permission
  switch(action) {
    case 'create':
      return permissions.canCreate;
    case 'edit':
      return permissions.canEdit;
    case 'delete':
      return permissions.canDelete;
    case 'view':
      return permissions.canView;
    default:
      return false;
  }
};

export const canViewAllBranches = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || user.userType;
  return ROLE_PERMISSIONS[role]?.viewAllBranches || false;
};
```

### C. Update Components to Hide Edit/Delete for Owners

**Example: Stallholders.vue**
```vue
<template>
  <div>
    <!-- ... table rows ... -->
    <CTableDataCell>
      <!-- Show buttons only if user has permission -->
      <CButton 
        v-if="canEdit"
        color="primary" 
        size="sm" 
        @click="editStallholder(item)"
      >
        Edit
      </CButton>
      <CButton 
        v-if="canDelete"
        color="danger" 
        size="sm" 
        @click="deleteStallholder(item.id)"
      >
        Delete
      </CButton>
      <CButton 
        v-if="!canEdit && !canDelete"
        color="info" 
        size="sm" 
        @click="viewStallholder(item)"
      >
        View
      </CButton>
    </CTableDataCell>
  </div>
</template>

<script>
import { hasPermission } from '@/services/authService';

export default {
  computed: {
    canEdit() {
      return hasPermission('edit');
    },
    canDelete() {
      return hasPermission('delete');
    }
  }
};
</script>
```

### D. Hide "Add New" Buttons for Owners

```vue
<!-- In any list view -->
<CButton 
  v-if="hasPermission('create')"
  color="primary"
  @click="showAddModal"
>
  <CIcon icon="cil-plus" /> Add New
</CButton>
```

---

## 📋 7. Testing Checklist

### Test Each Role:

#### System Administrator (`system_administrator`)
- [ ] Can view all branches
- [ ] Can create/edit/delete business owners
- [ ] Can manage subscriptions
- [ ] Can view dashboard stats

#### Stall Business Owner (`stall_business_owner`)
- [ ] Can ONLY view data (no create/edit/delete)
- [ ] Can see all branches they own (via business_owner_managers)
- [ ] Can view subscriptions
- [ ] Cannot see "Add New" or "Edit/Delete" buttons
- [ ] API blocks POST/PUT/DELETE requests

#### Business Manager (`business_manager`)
- [ ] Can view only their assigned branch
- [ ] Can create/edit/delete stallholders
- [ ] Can manage employees
- [ ] Can manage stalls
- [ ] Cannot see other branches

#### Business Employee (`business_employee`)
- [ ] Can view only their assigned branch
- [ ] Permissions based on assigned permissions array
- [ ] Cannot perform actions outside their permissions

---

## 🚀 Quick Implementation Steps

1. **✅ DONE: Fix Employee API**
   - Updated all procedure calls in employeeController.js

2. **Next: Update Table References**
   ```bash
   # Run these find/replace operations:
   git grep -l "branch_manager" Backend/Backend-Web/controllers/ | xargs sed -i 's/branch_manager/business_manager/g'
   git grep -l "branch_manager_id" Backend/Backend-Web/controllers/ | xargs sed -i 's/branch_manager_id/business_manager_id/g'
   ```

3. **Implement View-Only for Owners**
   - Create rolePermissions.js middleware
   - Apply to all protected routes
   - Update controllers to filter by owner's branches

4. **Build Subscription UI**
   - Create Subscriptions.vue component
   - Add router entry
   - Add sidebar menu item

5. **Remove Hardcoded branch_id**
   - Search and replace in all controllers
   - Test each endpoint

6. **Update Frontend**
   - Update constants.js
   - Add hasPermission checks
   - Hide buttons conditionally

7. **Test Everything**
   - Login as each role
   - Verify data visibility
   - Verify action restrictions

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify stored procedure names match database
4. Ensure JWT token includes correct role information

**Common Errors:**
- `PROCEDURE does not exist` → Check procedure name matches database
- `branch_id not found` → Check req.user.branchId is set in JWT
- `Access denied` → Check role permissions middleware

---

**Generated for:** DigiStall Capstone Project 2025-2026  
**Last Updated:** November 27, 2025
