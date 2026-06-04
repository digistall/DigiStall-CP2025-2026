import { logStaffActivity } from '../../OWNER/activityLog/staffActivityLogController.js';

/**
 * Log a mobile app screen view (for screens without dedicated backend API calls)
 * e.g., Notifications, Reports
 *
 * @route POST /api/mobile/stallholder/app-access-log
 * @body  { screen: 'notifications' | 'reports' | 'dashboard' | string }
 * @access Protected (Stallholder only)
 */
export const logAppAccessScreen = async (req, res) => {
  try {
    const userData = req.user;
    const { screen } = req.body;

    if (!screen) {
      return res.status(400).json({
        success: false,
        message: '`screen` is required in the request body'
      });
    }

    // Resolve stallholder identity from JWT
    const stallholderId =
      userData.stallholderId ||
      userData.stallholder_id ||
      userData.applicantId ||
      userData.applicant_id ||
      userData.userId ||
      userData.id;

    const screenLabels = {
      dashboard: 'Dashboard',
      notifications: 'Notifications',
      reports: 'Reports',
      payment: 'Payments',
      payments: 'Payments'
    };

    const screenLabel = screenLabels[screen.toLowerCase()] || screen;
    const ipAddress =
      req.headers?.['x-forwarded-for'] || req.ip || req.connection?.remoteAddress;

    await logStaffActivity({
      staffType: 'stallholder',
      staffId: stallholderId,
      staffName:
        userData.fullName ||
        userData.full_name ||
        userData.username ||
        'Stallholder',
      branchId: null,
      actionType: 'VIEW',
      actionDescription: `Viewed ${screenLabel} screen`,
      module: screenLabel,
      ipAddress,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestPath: req.originalUrl,
      status: 'success'
    });

    return res.status(200).json({
      success: true,
      message: `${screenLabel} screen access logged`
    });
  } catch (error) {
    console.error('❌ Error logging app access screen:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log screen access',
      error: error.message
    });
  }
};

export default { logAppAccessScreen };
