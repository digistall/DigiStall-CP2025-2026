import { createConnection } from '../CONFIG/database.js';

/**
 * Activity Logger Middleware
 * Logs all significant user actions to staff_activity_log table
 * Tracks: page views, CRUD operations, payments, etc.
 */

// Helper function to get Philippine time in MySQL format
const getPhilippineTime = () => {
  const now = new Date();
  const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const year = phTime.getFullYear();
  const month = String(phTime.getMonth() + 1).padStart(2, '0');
  const day = String(phTime.getDate()).padStart(2, '0');
  const hours = String(phTime.getHours()).padStart(2, '0');
  const minutes = String(phTime.getMinutes()).padStart(2, '0');
  const seconds = String(phTime.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Map API routes to readable module names and action types
const routeMapping = {
  // Dashboard
  '/api/dashboard': { module: 'dashboard', action: 'VIEW', description: 'Viewed dashboard' },
  
  // Stalls Management
  '/api/stalls': { module: 'stalls', action: 'VIEW', description: 'Viewed stalls list' },
  '/api/stall-image': { module: 'stalls', action: 'VIEW', description: 'Viewed stall images' },
  
  // Payments
  '/api/payments': { module: 'payments', action: 'VIEW', description: 'Viewed payments' },
  '/api/onsite-payments': { module: 'payments', action: 'VIEW', description: 'Viewed onsite payments' },
  '/api/rental-bills': { module: 'payments', action: 'VIEW', description: 'Viewed rental bills' },
  
  // Applicants
  '/api/applicants': { module: 'applicants', action: 'VIEW', description: 'Viewed applicants' },
  '/api/applications': { module: 'applications', action: 'VIEW', description: 'Viewed applications' },
  
  // Stallholders
  '/api/stallholders': { module: 'stallholders', action: 'VIEW', description: 'Viewed stallholders' },
  
  // Reports
  '/api/reports': { module: 'reports', action: 'VIEW', description: 'Viewed reports' },
  
  // Compliance
  '/api/compliance': { module: 'compliance', action: 'VIEW', description: 'Viewed compliance records' },
  
  // Employees
  '/api/employees': { module: 'employees', action: 'VIEW', description: 'Viewed employees' },
  '/api/mobile-staff': { module: 'mobile_staff', action: 'VIEW', description: 'Viewed mobile staff' },
  
  // Branches
  '/api/branches': { module: 'branches', action: 'VIEW', description: 'Viewed branches' },
  
  // Activity Logs
  '/api/activity-logs': { module: 'activity_logs', action: 'VIEW', description: 'Viewed activity logs' },
  
  // Complaints
  '/api/complaints': { module: 'complaints', action: 'VIEW', description: 'Viewed complaints' },
  
  // Settings
  '/api/settings': { module: 'settings', action: 'VIEW', description: 'Viewed settings' }
};

// Determine action type based on HTTP method
const getActionFromMethod = (method) => {
  switch (method.toUpperCase()) {
    case 'POST': return 'CREATE';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return 'VIEW';
  }
};

// Generate description based on route and method
const generateDescription = (method, path, routeInfo) => {
  const action = getActionFromMethod(method);
  
  if (action === 'VIEW') {
    return routeInfo?.description || `Accessed ${path}`;
  }
  
  // Extract entity from path
  const pathParts = path.split('/').filter(Boolean);
  const entity = pathParts[1] || 'record';
  
  switch (action) {
    case 'CREATE': return `Created new ${entity.replace(/-/g, ' ')}`;
    case 'UPDATE': return `Updated ${entity.replace(/-/g, ' ')}`;
    case 'DELETE': return `Deleted ${entity.replace(/-/g, ' ')}`;
    default: return `Performed ${action.toLowerCase()} on ${entity}`;
  }
};

// Find matching route info
const findRouteInfo = (path) => {
  // Check exact match first
  if (routeMapping[path]) {
    return routeMapping[path];
  }
  
  // Check prefix match
  for (const [route, info] of Object.entries(routeMapping)) {
    if (path.startsWith(route)) {
      return info;
    }
  }
  
  // Default module extraction from path
  const pathParts = path.split('/').filter(Boolean);
  return {
    module: pathParts[1]?.replace(/-/g, '_') || 'unknown',
    action: 'VIEW',
    description: null
  };
};

// List of paths to exclude from logging
const excludedPaths = [
  '/api/auth/verify',
  '/api/auth/me',
  '/api/health',
  '/api/activity-logs', // Don't log viewing activity logs to prevent recursion
  '/uploads',
  '/favicon.ico'
];

// Should this request be logged?
const shouldLog = (req) => {
  const path = req.path || req.originalUrl;
  
  // Don't log excluded paths
  if (excludedPaths.some(excluded => path.startsWith(excluded))) {
    return false;
  }
  
  // Only log API routes
  if (!path.startsWith('/api')) {
    return false;
  }
  
  // Don't log OPTIONS requests
  if (req.method === 'OPTIONS') {
    return false;
  }
  
  // Only log if user is authenticated
  if (!req.user) {
    return false;
  }
  
  // Only log meaningful actions (not all GETs)
  // For GET requests, only log specific important views
  if (req.method === 'GET') {
    const importantGets = [
      '/api/dashboard',
      '/api/reports',
      '/api/stalls',
      '/api/payments',
      '/api/applicants',
      '/api/stallholders',
      '/api/compliance',
      '/api/employees',
      '/api/complaints'
    ];
    return importantGets.some(route => path.startsWith(route));
  }
  
  // Always log POST, PUT, PATCH, DELETE
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
};

/**
 * Activity Logger Middleware
 * Logs user activities after the response is sent
 */
export const activityLogger = async (req, res, next) => {
  // Store original end function
  const originalEnd = res.end;
  const startTime = Date.now();
  
  // Override end to log after response
  res.end = function(...args) {
    // Call original end
    originalEnd.apply(res, args);
    
    // Log activity asynchronously (don't block response)
    setImmediate(async () => {
      if (!shouldLog(req)) {
        return;
      }
      
      let connection;
      try {
        connection = await createConnection();
        
        const path = req.path || req.originalUrl;
        const routeInfo = findRouteInfo(path);
        const action = req.method === 'GET' ? 'VIEW' : getActionFromMethod(req.method);
        const description = generateDescription(req.method, path, routeInfo);
        
        // Get user info from token
        const user = req.user;
        const staffType = user.userType || user.staffType || 'unknown';
        const staffId = user.userId || user.staffId || user.id;
        const staffName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown';
        const branchId = user.branchId || null;
        
        // Determine status from response
        const status = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failed';
        
        // Add context to description for specific actions
        let finalDescription = description;
        if (req.body && action !== 'VIEW') {
          // Add relevant context without sensitive data
          if (req.body.stallId) finalDescription += ` (Stall ID: ${req.body.stallId})`;
          if (req.body.applicantId) finalDescription += ` (Applicant ID: ${req.body.applicantId})`;
          if (req.body.paymentId) finalDescription += ` (Payment ID: ${req.body.paymentId})`;
          if (req.body.amount) finalDescription += ` (Amount: ₱${req.body.amount})`;
        }
        
        const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'unknown';
        
        await connection.execute(`
          INSERT INTO staff_activity_log 
          (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
           module, ip_address, user_agent, request_method, request_path, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          staffType,
          staffId,
          staffName,
          branchId,
          action,
          finalDescription,
          routeInfo.module,
          ipAddress,
          req.get('User-Agent')?.substring(0, 255) || null,
          req.method,
          path.substring(0, 255),
          status
        ]);
        
        // Only log significant actions to console
        if (action !== 'VIEW') {
          console.log(`📝 Activity: ${staffType} ${staffName} - ${action} - ${routeInfo.module}`);
        }
        
      } catch (error) {
        // Don't let logging errors affect the application
        console.error('⚠️ Activity logging error:', error.message);
      } finally {
        if (connection) {
          try {
            await connection.end();
          } catch (e) {
            // Ignore connection close errors
          }
        }
      }
    });
  };
  
  next();
};

/**
 * Helper function to manually log specific activities
 * Use this for custom logging in controllers
 */
export const logActivity = async ({
  staffType,
  staffId,
  staffName,
  branchId = null,
  actionType,
  description,
  module,
  ipAddress = null,
  status = 'success'
}) => {
  let connection;
  try {
    connection = await createConnection();
    
    await connection.execute(`
      INSERT INTO staff_activity_log 
      (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
       module, ip_address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      staffType,
      staffId,
      staffName,
      branchId,
      actionType,
      description,
      module,
      ipAddress,
      status
    ]);
    
    return true;
  } catch (error) {
    console.error('⚠️ Manual activity logging error:', error.message);
    return false;
  } finally {
    if (connection) await connection.end();
  }
};

export default activityLogger;


