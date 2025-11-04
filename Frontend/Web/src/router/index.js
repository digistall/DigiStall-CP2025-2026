import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import LoginPage from '../components/Admin/Login/LoginPage.vue'
import LandingPage from '../components/LandingPage/LandingPage.vue'
import Dashboard from '../components/Admin/Dashboard/Dashboard.vue'
import Payment from '../components/Admin/Payment/Payment.vue'
import Applicants from '../components/Admin/Applicants/Applicants.vue'
import Complaints from '../components/Admin/Complaints/Complaints.vue'
import Compliances from '../components/Admin/Compliances/Compliance.vue'
import Vendors from '../components/Admin/Vendors/Vendors.vue'
import Stallholders from '../components/Admin/Stallholders/Stallholders.vue'
import MainLayout from '../components/MainLayout/MainLayout.vue'
import Collectors from '../components/Admin/Collectors/Collectors.vue'
import Stalls from '../components/Admin/Stalls/Stalls.vue'
import BranchManagement from '../components/Admin/Branch/Branch.vue'
import Employees from '../components/Admin/Employees/Employees.vue'

// ===== ROUTE GUARDS WITH SIMPLE AUTH =====

/**
 * Check if user is authenticated (checks sessionStorage)
 */
const isAuthenticated = () => {
  const token = sessionStorage.getItem('authToken');
  const user = sessionStorage.getItem('currentUser');
  return !!(token && user);
}

/**
 * Check if user has required role(s)
 */
const hasRole = (...roles) => {
  const userData = sessionStorage.getItem('currentUser');
  if (!userData) return false;
  
  try {
    const user = JSON.parse(userData);
    return roles.some(role => role.toLowerCase() === user.userType?.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Check if user has required permission(s)
 */
const hasPermission = (...permissions) => {
  const userData = sessionStorage.getItem('currentUser');
  if (!userData) return false;
  
  try {
    const user = JSON.parse(userData);
    
    // Admins and managers have all permissions
    if (user.userType === 'admin' || user.userType === 'branch_manager') {
      return true;
    }
    
    // Check employee permissions
    if (user.userType === 'employee' && user.permissions) {
      // Handle both array format ['dashboard', 'applicants'] and object format { dashboard: true }
      if (Array.isArray(user.permissions)) {
        // Array format: check if permission exists in array
        return permissions.some(permission => user.permissions.includes(permission));
      } else {
        // Object format: check if permission value is true
        return permissions.some(permission => {
          const permValue = user.permissions[permission];
          return permValue === true || permValue === 1;
        });
      }
    }
    
    return false;
  } catch {
    return false;
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

    if (hasRole(...roles)) {
      console.log(`✅ Role check passed for: ${roles.join(', ')}`)
      next()
    } else {
      console.log(`❌ Role check failed. Required: ${roles.join(', ')}`)
      next('/app/dashboard')
    }
  }
}

/**
 * Route guard: Require specific permission(s)
 */
const requirePermission = (...permissions) => {
  return (to, from, next) => {
    if (!isAuthenticated()) {
      console.log('❌ Not authenticated - redirecting to login')
      next('/login')
      return
    }

    if (hasPermission(...permissions)) {
      console.log(`✅ Permission check passed for: ${permissions.join(', ')}`)
      next()
    } else {
      console.log(`❌ Permission check failed. Required: ${permissions.join(', ')}`)
      next('/app/dashboard')
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
      console.log(`❌ Access denied. Required roles: ${roles.join(', ')} OR permissions: ${permissions.join(', ')}`)
      next('/app/dashboard')
    }
  }
}

// Legacy helper function (for backward compatibility)
const requiresPermission = (permission) => {
  return requirePermission(permission)
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landingPage', component: LandingPage },
    { path: '/login', name: 'login', component: LoginPage },

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
            requiresRole: ['admin']
          },
          beforeEnter: requireRole('admin'),
        },
        {
          path: 'employees',
          name: 'Employees',
          component: Employees,
          meta: {
            title: 'Employee Management',
            requiresAuth: true,
            requiresRole: ['admin', 'branch_manager']
          },
          beforeEnter: requireRole('admin', 'branch_manager'),
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
          path: 'collectors',
          name: 'Collectors',
          component: Collectors,
          meta: { title: 'Collectors' },
          beforeEnter: requiresPermission('collectors'),
        },
        {
          path: 'stalls',
          name: 'Stalls',
          component: Stalls,
          meta: { title: 'Stalls' },
          beforeEnter: requiresPermission('stalls'),
        },
        {
          path: 'stalls/raffles',
          name: 'Raffles',
          component: () => import('../components/Admin/Stalls/RaffleComponents/RafflesPage.vue'),
          meta: { title: 'Active Raffles' },
          beforeEnter: requiresPermission('stalls'),
        },
        {
          path: 'stalls/auctions',
          name: 'Auctions',
          component: () =>
            import('../components/Admin/Stalls/AuctionComponents/AuctionsPage/AuctionsPage.vue'),
          meta: { title: 'Active Auctions' },
          beforeEnter: requiresPermission('stalls'),
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
  const publicRoutes = ['/', '/login', 'landingPage', 'login']
  const isPublicRoute = publicRoutes.includes(to.path) || publicRoutes.includes(to.name)

  // Initialize auth store on first navigation
  const authStore = useAuthStore()
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }

  // If trying to access login while authenticated, redirect to dashboard
  if (to.path === '/login' && isAuthenticated()) {
    console.log('✅ Already authenticated, redirecting to dashboard')
    next('/app/dashboard')
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

  // Check role-based access
  if (to.meta?.requiresRole && to.meta.requiresRole.length > 0) {
    const roles = Array.isArray(to.meta.requiresRole) ? to.meta.requiresRole : [to.meta.requiresRole]
    if (!hasRole(...roles)) {
      console.log(`❌ Role check failed. Required: ${roles.join(', ')}`)
      next('/app/dashboard')
      return
    }
  }

  // Check permission-based access
  if (to.meta?.requiresPermission && to.meta.requiresPermission.length > 0) {
    const permissions = Array.isArray(to.meta.requiresPermission) ? to.meta.requiresPermission : [to.meta.requiresPermission]
    if (!hasPermission(...permissions)) {
      console.log(`❌ Permission check failed. Required: ${permissions.join(', ')}`)
      next('/app/dashboard')
      return
    }
  }

  // Check legacy requiresAdmin and requiresBranchManager
  if (to.meta?.requiresAdmin && !hasRole('admin')) {
    console.log('❌ Admin access required')
    next('/app/dashboard')
    return
  }

  if (to.meta?.requiresBranchManager && !hasRole('admin', 'branch_manager')) {
    console.log('❌ Branch manager or admin access required')
    next('/app/dashboard')
    return
  }

  // All checks passed, allow navigation
  console.log('✅ All checks passed, proceeding to route')
  next()
})

export default router
