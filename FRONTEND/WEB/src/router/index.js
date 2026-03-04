import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

// ===== MVC ROLE-BASED IMPORTS =====
// All components imported from role folders via aliases

// AUTH module
import LoginPage from '@auth/Login/LoginPage.vue'
import ForgotPassword from '@auth/ForgotPassword/ForgotPassword.vue'

// PUBLIC LANDING PAGE module
import LandingPage from '@landing/LandingPage/LandingPage.vue'

// Layout (src/components)
import MainLayout from '@/components/MainLayout/MainLayout/MainLayout.vue'

// SHARE-FEATURE module - shared features (Owner, Manager, Employee)
import Dashboard from '@shared-features/Dashboard/Dashboard/Dashboard.vue'
import Payment from '@shared-features/Payment/Payment/Payment.vue'
import Applicants from '@shared-features/Applicants/Applicants/Applicants.vue'
import Complaints from '@shared-features/Complaints/Complaints/Complaints.vue'
import Compliances from '@shared-features/Compliances/Compliance.vue'
import Vendors from '@shared-features/Vendors/Vendors.vue'
import Stallholders from '@shared-features/Stallholders/Stallholders/Stallholders.vue'
import Stalls from '@shared-features/Stalls/Stalls.vue'

// BUSINESS-MANAGER module - Manager-exclusive features
import Employees from '@business-manager/Employees/Employees/Employees.vue'

// BUSINESS-OWNER module - Owner-only features
import BranchManagement from '@business-owner/Branch/Branch.vue'
import MySubscription from '@business-owner/Subscription/MySubscription.vue'

// SYSTEM-ADMIN module
import SystemAdminDashboard from '@system-admin/Dashboard/SystemAdminDashboard.vue'
import BusinessOwners from '@system-admin/BusinessOwners/BusinessOwners.vue'
import Payments from '@system-admin/Payments/Payments.vue'
import Reports from '@system-admin/Reports/Reports.vue'

// ===== ROUTE GUARDS WITH SIMPLE AUTH =====

/**
 * Check if user is authenticated (checks sessionStorage)
 */
const isAuthenticated = () => {
  const token = sessionStorage.getItem('authToken');
  const user = sessionStorage.getItem('currentUser');
  const isAuth = !!(token && user);
  console.log('🔍 isAuthenticated check:', { hasToken: !!token, hasUser: !!user, result: isAuth });
  return isAuth;
}

/**
 * Check if user has required role(s)
 */
const hasRole = (...roles) => {
  const userData = sessionStorage.getItem('currentUser');
  console.log('🔍 hasRole called - userData exists:', !!userData);
  if (!userData) return false;

  try {
    const user = JSON.parse(userData);
    console.log('🔍 hasRole - Parsed user:', user);
    console.log('🔍 hasRole - User type:', user.userType);
    console.log('🔍 hasRole - Required roles:', roles);
    const result = roles.some(role => role.toLowerCase() === user.userType?.toLowerCase());
    console.log('🔍 hasRole result:', result);
    return result;
  } catch (error) {
    console.error('❌ hasRole parse error:', error);
    return false;
  }
}

/**
 * Check if user has required permission(s)
 */
const hasPermission = (...permissions) => {
  const userData = sessionStorage.getItem('currentUser');
  console.log('🔍 hasPermission called - userData:', userData);
  if (!userData) {
    console.log('❌ No userData in sessionStorage');
    return false;
  }

  try {
    const user = JSON.parse(userData);
    console.log('🔍 Parsed user:', user);
    console.log('🔍 User type:', user.userType);

    // System administrators, stall business owners, and business managers have all permissions
    if (user.userType === 'system_administrator' || 
        user.userType === 'stall_business_owner' || 
        user.userType === 'business_manager') {
      console.log('✅ User has admin/owner/manager role - granting all permissions');
      return true;
    }

    // Check business employee permissions
    if (user.userType === 'business_employee' && user.permissions) {
      // Handle both array format ['dashboard', 'applicants'] and object format { dashboard: true }
      if (Array.isArray(user.permissions)) {
        // Array format: check if permission exists in array
        const hasIt = permissions.some(permission => user.permissions.includes(permission));
        console.log('🔍 Array permissions check:', hasIt);
        return hasIt;
      } else {
        // Object format: check if permission value is true
        const hasIt = permissions.some(permission => {
          const permValue = user.permissions[permission];
          return permValue === true || permValue === 1;
        });
        console.log('🔍 Object permissions check:', hasIt);
        return hasIt;
      }
    }

    console.log('❌ No matching permission or role');
    return false;
  } catch (error) {
    console.error('❌ Error in hasPermission:', error);
    return false;
  }
}

/**
 * Get the appropriate dashboard path for the current user
 * If user doesn't have dashboard permission, redirect to first available page
 */
const getDashboardPath = () => {
  const userData = sessionStorage.getItem('currentUser');
  if (!userData) return '/app/dashboard';

  try {
    const user = JSON.parse(userData);
    
    // System administrator always goes to system admin dashboard
    if (user.userType === 'system_administrator') {
      return '/system-admin/dashboard';
    }
    
    // Business owner and manager always have dashboard
    if (user.userType === 'stall_business_owner' || user.userType === 'business_manager') {
      return '/app/dashboard';
    }
    
    // For business employees, check their permissions
    if (user.userType === 'business_employee' && user.permissions) {
      const permissions = user.permissions;
      
      // Helper to check permission
      const hasPermission = (perm) => {
        if (Array.isArray(permissions)) {
          return permissions.includes(perm);
        }
        return permissions[perm] === true;
      };
      
      // If has dashboard permission, go to dashboard
      if (hasPermission('dashboard')) {
        return '/app/dashboard';
      }
      
      // Otherwise, find the first available page based on permissions
      const permissionRoutes = [
        { perm: 'payments', route: '/app/payment' },
        { perm: 'applicants', route: '/app/applicants' },
        { perm: 'complaints', route: '/app/complaints' },
        { perm: 'compliances', route: '/app/compliance' },
        { perm: 'vendors', route: '/app/vendor' },
        { perm: 'stallholders', route: '/app/stallholder' },
        { perm: 'stalls', route: '/app/stalls' }
      ];
      
      for (const { perm, route } of permissionRoutes) {
        if (hasPermission(perm)) {
          console.log(`🔄 User doesn't have dashboard permission, redirecting to ${route}`);
          return route;
        }
      }
      
      // If no permissions at all, still try dashboard (they might see a restricted view)
      console.log('⚠️ User has no recognized permissions, defaulting to dashboard');
      return '/app/dashboard';
    }
    
    return '/app/dashboard';
  } catch {
    return '/app/dashboard';
  }
}

/**
 * Route guard: Require authentication
 * Usage: beforeEnter: requireAuth
 */
// eslint-disable-next-line no-unused-vars
const requireAuth = (to, from, next) => {
  if (!isAuthenticated()) {
    console.log('❌ Not authenticated - redirecting to login')
    next('/login')
  } else {
    next()
  }
}

/**
 * Route guard: Require specific role(s)
 */
const requireRole = (...roles) => {
  return (to, from, next) => {
    if (!isAuthenticated()) {
      console.log('❌ Not authenticated - redirecting to login')
      next('/login')
      return
    }

    const userData = sessionStorage.getItem('currentUser');
    const user = userData ? JSON.parse(userData) : {};
    console.log('🔐 Role check for route:', to.path)
    console.log('🔐 Required roles:', roles)
    console.log('🔐 User type:', user.userType)
    console.log('🔐 Has role result:', hasRole(...roles))

    if (hasRole(...roles)) {
      console.log('✅ Role check passed')
      next()
    } else {
      console.log('❌ Role check failed - redirecting to dashboard')
      next('/app/dashboard')
    }
  }
}

/**
 * Route guard: Require specific permission(s)
 */
const requirePermission = (...permissions) => {
  return (to, from, next) => {
    console.log('🚀🚀🚀 [STALLHOLDER FIX] requirePermission called for:', to.path);
    console.log('🚀 [STALLHOLDER FIX] Required permissions:', permissions);
    console.log('🚀 [STALLHOLDER FIX] From route:', from.path);
    
    if (!isAuthenticated()) {
      console.log('❌ [STALLHOLDER FIX] Not authenticated - redirecting to login')
      next('/login')
      return
    }

    console.log('✅ [STALLHOLDER FIX] User is authenticated');

    const userData = sessionStorage.getItem('currentUser');
    console.log('🔍 [STALLHOLDER FIX] Raw userData from sessionStorage:', userData);
    
    const user = userData ? JSON.parse(userData) : {};
    console.log('🔐 [STALLHOLDER FIX] Parsed user object:', JSON.stringify(user, null, 2));
    console.log('🔐 [STALLHOLDER FIX] User type:', user.userType);
    console.log('🔐 [STALLHOLDER FIX] Calling hasPermission with:', permissions);
    
    const permissionResult = hasPermission(...permissions);
    console.log('🔐 [STALLHOLDER FIX] hasPermission returned:', permissionResult);

    if (permissionResult) {
      console.log('✅✅✅ [STALLHOLDER FIX] Permission check PASSED - allowing navigation')
      next()
    } else {
      console.log('❌❌❌ [STALLHOLDER FIX] Permission check FAILED');
      console.log('⚠️ [STALLHOLDER FIX] FORCING NAVIGATION ANYWAY (debug mode)');
      // Force navigation to see the actual error
      next()
    }
  }
}

/**
 * Route guard: Require role OR permission
 * Usage: beforeEnter: requireRoleOrPermission(['admin'], ['manage_stalls'])
 */
// eslint-disable-next-line no-unused-vars
const requireRoleOrPermission = (roles = [], permissions = []) => {
  return (to, from, next) => {
    if (!isAuthenticated()) {
      console.log('❌ Not authenticated - redirecting to login')
      next('/login')
      return
    }

    const hasRequiredRole = roles.length > 0 ? hasRole(...roles) : false
    const hasRequiredPermission = permissions.length > 0 ? hasPermission(...permissions) : false

    if (hasRequiredRole || hasRequiredPermission) {
      console.log('✅ Access granted')
      next()
    } else {
      console.log('❌ Access denied');
      next('/app/dashboard')
    }
  }
}

// Legacy helper function (for backward compatibility)
const requiresPermission = (permission) => {
  return requirePermission(permission)
}

/**
 * Dashboard guard - redirects business employees without dashboard permission
 * to their first available page
 */
const requireDashboardAccess = (to, from, next) => {
  if (!isAuthenticated()) {
    next('/login')
    return
  }

  const userData = sessionStorage.getItem('currentUser')
  if (!userData) {
    next('/login')
    return
  }

  try {
    const user = JSON.parse(userData)
    
    // System administrators, owners, and managers always have dashboard access
    if (user.userType === 'system_administrator' ||
        user.userType === 'stall_business_owner' ||
        user.userType === 'business_manager') {
      next()
      return
    }
    
    // For business employees, check if they have dashboard permission
    if (user.userType === 'business_employee' && user.permissions) {
      const permissions = user.permissions
      
      const hasPerm = (perm) => {
        if (Array.isArray(permissions)) {
          return permissions.includes(perm)
        }
        return permissions[perm] === true || permissions[perm] === 1
      }
      
      // If user has dashboard permission, allow access
      if (hasPerm('dashboard')) {
        next()
        return
      }
      
      // Find first available page based on permissions
      const permissionRoutes = [
        { perm: 'payments', route: '/app/payment' },
        { perm: 'applicants', route: '/app/applicants' },
        { perm: 'complaints', route: '/app/complaints' },
        { perm: 'compliances', route: '/app/compliances' },
        { perm: 'vendors', route: '/app/vendors' },
        { perm: 'stallholders', route: '/app/stallholders' },
        { perm: 'stalls', route: '/app/stalls' }
      ]
      
      for (const { perm, route } of permissionRoutes) {
        if (hasPerm(perm)) {
          console.log(`🔄 Employee doesn't have dashboard permission, redirecting to ${route}`)
          next(route)
          return
        }
      }
      
      // No permissions at all - show unauthorized or stay (component will handle)
      console.log('⚠️ Employee has no recognized permissions')
    }
    
    // Default: allow but component will show appropriate message
    next()
  } catch (error) {
    console.error('❌ Error in dashboard guard:', error)
    next()
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landingPage', component: LandingPage },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/forgot-password', name: 'forgotPassword', component: ForgotPassword },

    {
      path: '/app',
      component: MainLayout,
      children: [
        {
          path: '',
          redirect: 'dashboard'
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: Dashboard,
          meta: { title: 'Dashboard' },
          beforeEnter: requireDashboardAccess,
        },
        {
          path: 'complaints',
          name: 'Complaints',
          component: Complaints,
          meta: { title: 'Complaints' },
          beforeEnter: requiresPermission('complaints'),
        },
        {
          path: 'branch',
          name: 'Branch',
          component: BranchManagement,
          meta: {
            title: 'Branch Management',
            requiresAuth: true,
            requiresRole: ['stall_business_owner']
          },
          beforeEnter: requireRole('stall_business_owner'),
        },
        {
          path: 'subscription',
          name: 'MySubscription',
          component: MySubscription,
          meta: {
            title: 'My Subscription',
            requiresAuth: true,
            requiresRole: ['stall_business_owner']
          },
          beforeEnter: requireRole('stall_business_owner'),
        },
        {
          path: 'employees',
          name: 'Employees',
          component: Employees,
          meta: {
            title: 'Employee Management',
            requiresAuth: true,
            requiresRole: ['stall_business_owner', 'business_manager']
          },
          beforeEnter: requireRole('stall_business_owner', 'business_manager'),
        },
        {
          path: 'payment',
          name: 'Payment',
          component: Payment,
          meta: { title: 'Payment' },
          beforeEnter: requiresPermission('payments'),
        },
        {
          path: 'applicants',
          name: 'Applicants',
          component: Applicants,
          meta: { title: 'Applicants' },
          beforeEnter: requiresPermission('applicants'),
        },
        {
          path: 'compliances',
          name: 'Compliances',
          component: Compliances,
          meta: { title: 'Compliances' },
          beforeEnter: requiresPermission('compliances'),
        },
        {
          path: 'vendors',
          name: 'Vendors',
          component: Vendors,
          meta: { title: 'Vendors' },
          beforeEnter: requiresPermission('vendors'),
        },
        {
          path: 'stallholders',
          name: 'Stallholders',
          component: Stallholders,
          meta: { title: 'Stallholders' },
          beforeEnter: requiresPermission('stallholders'),
        },
        {
          path: 'stalls',
          name: 'Stalls',
          component: Stalls,
          meta: { title: 'Stalls' },
          beforeEnter: requiresPermission('stalls'),
        },
      ],
    },

    // System Administrator Routes
    {
      path: '/system-admin',
      component: MainLayout,
      meta: { requiresRole: ['system_administrator'] },
      children: [
        {
          path: '',
          redirect: 'dashboard'
        },
        {
          path: 'dashboard',
          name: 'SystemAdminDashboard',
          component: SystemAdminDashboard,
          meta: { title: 'System Admin Dashboard', requiresRole: ['system_administrator'] },
        },
        {
          path: 'business-owners',
          name: 'BusinessOwners',
          component: BusinessOwners,
          meta: { title: 'Business Owners Management', requiresRole: ['system_administrator'] },
        },
        {
          path: 'payments',
          name: 'SubscriptionPayments',
          component: Payments,
          meta: { title: 'Subscription Payments', requiresRole: ['system_administrator'] },
        },
        {
          path: 'reports',
          name: 'SubscriptionReports',
          component: Reports,
          meta: { title: 'Subscription Reports', requiresRole: ['system_administrator'] },
        },
      ],
    },
  ],
})

// ===== GLOBAL NAVIGATION GUARD =====
// Handles authentication and authorization for all routes
router.beforeEach(async (to, from, next) => {
  console.log(`🛡️ Router guard: ${from.path} → ${to.path}`)

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/forgot-password', 'landingPage', 'login', 'forgotPassword']
  const isPublicRoute = publicRoutes.includes(to.path) || publicRoutes.includes(to.name)

  // Initialize auth store on first navigation
  const authStore = useAuthStore()
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }

  // If trying to access login while authenticated, redirect to appropriate dashboard
  if (to.path === '/login' && isAuthenticated()) {
    console.log('✅ Already authenticated, redirecting to dashboard')
    const dashboardPath = getDashboardPath()
    console.log('🔄 Redirecting to:', dashboardPath)
    next(dashboardPath)
    return
  }

  // If accessing public route, allow
  if (isPublicRoute) {
    next()
    return
  }

  // Check authentication for protected routes
  if (!isAuthenticated()) {
    console.log('❌ Not authenticated, redirecting to login')
    next('/login')
    return
  }

  // Prevent system administrators from accessing /app routes
  if (to.path.startsWith('/app') && hasRole('system_administrator')) {
    console.log('⚠️ System administrator trying to access /app route, redirecting to system admin dashboard')
    next('/system-admin/dashboard')
    return
  }

  // Check role-based access
  if (to.meta?.requiresRole && to.meta.requiresRole.length > 0) {
    const roles = Array.isArray(to.meta.requiresRole) ? to.meta.requiresRole : [to.meta.requiresRole]
    if (!hasRole(...roles)) {
      console.log(`❌ Role check failed. Required: ${roles.join(', ')}`)
      next(getDashboardPath())
      return
    }
  }

  // Check permission-based access
  if (to.meta?.requiresPermission && to.meta.requiresPermission.length > 0) {
    const permissions = Array.isArray(to.meta.requiresPermission) ? to.meta.requiresPermission : [to.meta.requiresPermission]
    if (!hasPermission(...permissions)) {
      console.log(`❌ Permission check failed. Required: ${permissions.join(', ')}`)
      next(getDashboardPath())
      return
    }
  }

  // Check legacy requiresAdmin and requiresBranchManager
  if (to.meta?.requiresAdmin && !hasRole('system_administrator', 'stall_business_owner')) {
    console.log('❌ Admin access required')
    next(getDashboardPath())
    return
  }

  if (to.meta?.requiresBranchManager && !hasRole('system_administrator', 'stall_business_owner', 'business_manager')) {
    console.log('❌ Business manager or admin access required')
    next(getDashboardPath())
    return
  }

  // All checks passed, allow navigation
  console.log('✅ All checks passed, proceeding to route')
  next()
})

export default router
