import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { subscribeToDashboard, getActiveConnectionsCount } from '../controllers/subscriptions/dashboardSubscription.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticateToken);

/**
 * SSE subscription endpoint for dashboard real-time updates
 * GET /api/dashboard-subscription
 */
router.get('/', subscribeToDashboard);

/**
 * Get count of active SSE connections (for debugging/monitoring)
 * GET /api/dashboard-subscription/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    activeConnections: getActiveConnectionsCount()
  });
});

export default router;
