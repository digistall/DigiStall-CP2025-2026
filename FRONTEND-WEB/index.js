// ===== FRONTEND-WEB.js =====
// Aggregator file that exports ALL frontend web Vue components from MVC role folders
// This single file consolidates all web frontend components for easy import
// Use with Vite aliases in vite.config.js

// ===== EXPORT PATHS TO ALL FRONTEND-WEB VIEWS FROM ROLE FOLDERS =====
// These are path references for use in Vue Router and dynamic imports

export const views = {
  // BUSINESS_OWNER Frontend Web Views
  businessOwner: {
    dashboard: '../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Dashboard/Dashboard.vue',
    login: '../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Login/LoginPage.vue',
    stalls: '../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Stalls/Stalls.vue',
    stallholders: '../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Stallholders/Stallholders.vue',
    complaints: '../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Complaints/Complaints.vue',
    compliance: '../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Compliances/Compliance.vue',
    payment: '../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Payment/Payment.vue',
    subscription: '../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Subscription/MySubscription.vue'
  },

  // BRANCH_MANAGER Frontend Web Views
  branchManager: {
    branch: '../BRANCH_MANAGER/FRONTEND-WEB/VIEWS/Branch/Branch.vue'
  },

  // EMPLOYEE Frontend Web Views
  employee: {
    employees: '../EMPLOYEE/WEB_EMPLOYEE/FRONTEND-WEB/VIEWS/Employees/Employees.vue'
  },

  // VENDOR Frontend Web Views
  vendor: {
    vendors: '../VENDOR/FRONTEND-WEB/VIEWS/Vendors/Vendors.vue'
  },

  // APPLICANTS Frontend Web Views
  applicants: {
    applicants: '../APPLICANTS/FRONTEND-WEB/VIEWS/Applicants/Applicants.vue'
  },

  // SYSTEM_ADMINISTRATOR Frontend Web Views
  systemAdmin: {
    dashboard: '../SYSTEM_ADMINISTRATOR/FRONTEND-WEB/VIEWS/Dashboard/SystemAdminDashboard.vue',
    businessOwners: '../SYSTEM_ADMINISTRATOR/FRONTEND-WEB/VIEWS/BusinessOwners/BusinessOwners.vue',
    payments: '../SYSTEM_ADMINISTRATOR/FRONTEND-WEB/VIEWS/Payments/Payments.vue',
    reports: '../SYSTEM_ADMINISTRATOR/FRONTEND-WEB/VIEWS/Reports/Reports.vue'
  },

  // PUBLIC-LANDINGPAGE Frontend Web Views
  public: {
    landingPage: '../PUBLIC-LANDINGPAGE/FRONTEND-WEB/VIEWS/LandingPage.vue'
  }
};

// ===== DYNAMIC IMPORT FUNCTIONS =====
// Use these for lazy loading in Vue Router

export const lazyViews = {
  // Business Owner
  businessOwner: {
    Dashboard: () => import('../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Dashboard/Dashboard.vue'),
    Login: () => import('../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Login/LoginPage.vue'),
    Stalls: () => import('../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Stalls/Stalls.vue'),
    Stallholders: () => import('../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Stallholders/Stallholders.vue'),
    Complaints: () => import('../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Complaints/Complaints.vue'),
    Compliance: () => import('../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Compliances/Compliance.vue'),
    Payment: () => import('../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Payment/Payment.vue'),
    Subscription: () => import('../BUSINESS_OWNER/FRONTEND-WEB/VIEWS/Subscription/MySubscription.vue')
  },

  // Branch Manager
  branchManager: {
    Branch: () => import('../BRANCH_MANAGER/FRONTEND-WEB/VIEWS/Branch/Branch.vue')
  },

  // Employee
  employee: {
    Employees: () => import('../EMPLOYEE/WEB_EMPLOYEE/FRONTEND-WEB/VIEWS/Employees/Employees.vue')
  },

  // Vendor
  vendor: {
    Vendors: () => import('../VENDOR/FRONTEND-WEB/VIEWS/Vendors/Vendors.vue')
  },

  // Applicants
  applicants: {
    Applicants: () => import('../APPLICANTS/FRONTEND-WEB/VIEWS/Applicants/Applicants.vue')
  },

  // System Administrator
  systemAdmin: {
    Dashboard: () => import('../SYSTEM_ADMINISTRATOR/FRONTEND-WEB/VIEWS/Dashboard/SystemAdminDashboard.vue'),
    BusinessOwners: () => import('../SYSTEM_ADMINISTRATOR/FRONTEND-WEB/VIEWS/BusinessOwners/BusinessOwners.vue'),
    Payments: () => import('../SYSTEM_ADMINISTRATOR/FRONTEND-WEB/VIEWS/Payments/Payments.vue'),
    Reports: () => import('../SYSTEM_ADMINISTRATOR/FRONTEND-WEB/VIEWS/Reports/Reports.vue')
  },

  // Public Landing Page
  public: {
    LandingPage: () => import('../PUBLIC-LANDINGPAGE/FRONTEND-WEB/VIEWS/LandingPage.vue')
  }
};

// ===== VITE ALIAS CONFIGURATION =====
// Copy this to your vite.config.js for path aliases

export const viteAliases = {
  // Role-based views
  '@BUSINESS_OWNER': '../BUSINESS_OWNER/FRONTEND-WEB',
  '@BRANCH_MANAGER': '../BRANCH_MANAGER/FRONTEND-WEB',
  '@EMPLOYEE': '../EMPLOYEE/WEB_EMPLOYEE/FRONTEND-WEB',
  '@VENDOR': '../VENDOR/FRONTEND-WEB',
  '@APPLICANTS': '../APPLICANTS/FRONTEND-WEB',
  '@SYSTEM_ADMINISTRATOR': '../SYSTEM_ADMINISTRATOR/FRONTEND-WEB',
  '@PUBLIC_LANDINGPAGE': '../PUBLIC-LANDINGPAGE/FRONTEND-WEB',
  
  // Shared resources
  '@shared': '../SHARED/FRONTEND-WEB',
  '@components': '../SHARED/FRONTEND-WEB/COMPONENTS',
  '@assets': '../SHARED/FRONTEND-WEB/ASSETS',
  '@services': '../SHARED/FRONTEND-WEB/SERVICES',
  '@stores': '../SHARED/FRONTEND-WEB/STORES',
  '@utils': '../SHARED/FRONTEND-WEB/UTILS',
  '@config': '../SHARED/FRONTEND-WEB/CONFIG',
  '@plugins': '../SHARED/FRONTEND-WEB/PLUGINS',
  '@auth': '../SHARED/FRONTEND-WEB/AUTH'
};

// ===== SHARED COMPONENTS =====
export const sharedComponents = {
  // Common UI Components
  ErrorPopup: '../SHARED/FRONTEND-WEB/COMPONENTS/ErrorPopup',
  LoadingOverlay: '../SHARED/FRONTEND-WEB/COMPONENTS/LoadingOverlay',
  LoadingScreen: '../SHARED/FRONTEND-WEB/COMPONENTS/LoadingScreen',
  LogoutConfirmationDialog: '../SHARED/FRONTEND-WEB/COMPONENTS/LogoutConfirmationDialog',
  LogoutLoadingScreen: '../SHARED/FRONTEND-WEB/COMPONENTS/LogoutLoadingScreen',
  ToastNotification: '../SHARED/FRONTEND-WEB/COMPONENTS/ToastNotification',
  UniversalPopup: '../SHARED/FRONTEND-WEB/COMPONENTS/UniversalPopup',
  
  // Layout Components
  AppHeader: '../SHARED/FRONTEND-WEB/COMPONENTS/AppHeader',
  AppSidebar: '../SHARED/FRONTEND-WEB/COMPONENTS/AppSidebar',
  MainLayout: '../SHARED/FRONTEND-WEB/COMPONENTS/MainLayout',
  
  // Auth Components
  Login: '../SHARED/FRONTEND-WEB/AUTH',
  Register: '../SHARED/FRONTEND-WEB/AUTH'
};

// ===== SHARED RESOURCES PATHS =====
export const sharedResources = {
  assets: '../SHARED/FRONTEND-WEB/ASSETS',
  services: '../SHARED/FRONTEND-WEB/SERVICES',
  stores: '../SHARED/FRONTEND-WEB/STORES',
  utils: '../SHARED/FRONTEND-WEB/UTILS',
  config: '../SHARED/FRONTEND-WEB/CONFIG',
  plugins: '../SHARED/FRONTEND-WEB/PLUGINS'
};

// ===== ROUTE CONFIGURATION HELPER =====
// Generate routes for Vue Router

export function generateRoutes() {
  return [
    // Public Routes
    {
      path: '/',
      name: 'LandingPage',
      component: lazyViews.public.LandingPage
    },
    
    // Business Owner Routes
    {
      path: '/login',
      name: 'Login',
      component: lazyViews.businessOwner.Login
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: lazyViews.businessOwner.Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/stalls',
      name: 'Stalls',
      component: lazyViews.businessOwner.Stalls,
      meta: { requiresAuth: true }
    },
    {
      path: '/stallholders',
      name: 'Stallholders',
      component: lazyViews.businessOwner.Stallholders,
      meta: { requiresAuth: true }
    },
    {
      path: '/complaints',
      name: 'Complaints',
      component: lazyViews.businessOwner.Complaints,
      meta: { requiresAuth: true }
    },
    {
      path: '/compliance',
      name: 'Compliance',
      component: lazyViews.businessOwner.Compliance,
      meta: { requiresAuth: true }
    },
    {
      path: '/payment',
      name: 'Payment',
      component: lazyViews.businessOwner.Payment,
      meta: { requiresAuth: true }
    },
    {
      path: '/subscription',
      name: 'Subscription',
      component: lazyViews.businessOwner.Subscription,
      meta: { requiresAuth: true }
    },
    
    // Branch Manager Routes
    {
      path: '/branch',
      name: 'Branch',
      component: lazyViews.branchManager.Branch,
      meta: { requiresAuth: true }
    },
    
    // Employee Routes
    {
      path: '/employees',
      name: 'Employees',
      component: lazyViews.employee.Employees,
      meta: { requiresAuth: true }
    },
    
    // Vendor Routes
    {
      path: '/vendors',
      name: 'Vendors',
      component: lazyViews.vendor.Vendors,
      meta: { requiresAuth: true }
    },
    
    // Applicants Routes
    {
      path: '/applicants',
      name: 'Applicants',
      component: lazyViews.applicants.Applicants,
      meta: { requiresAuth: true }
    },
    
    // System Admin Routes
    {
      path: '/admin/dashboard',
      name: 'AdminDashboard',
      component: lazyViews.systemAdmin.Dashboard,
      meta: { requiresAuth: true, role: 'system_admin' }
    },
    {
      path: '/admin/business-owners',
      name: 'BusinessOwners',
      component: lazyViews.systemAdmin.BusinessOwners,
      meta: { requiresAuth: true, role: 'system_admin' }
    },
    {
      path: '/admin/payments',
      name: 'AdminPayments',
      component: lazyViews.systemAdmin.Payments,
      meta: { requiresAuth: true, role: 'system_admin' }
    },
    {
      path: '/admin/reports',
      name: 'Reports',
      component: lazyViews.systemAdmin.Reports,
      meta: { requiresAuth: true, role: 'system_admin' }
    }
  ];
}

export default { views, lazyViews, viteAliases, sharedComponents, sharedResources, generateRoutes };
