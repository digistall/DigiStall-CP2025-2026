import { createConnection } from "../../../config/database.js";
import {
  decryptAES256GCM,
  isAES256GCMEncrypted,
} from "../../../services/mysqlDecryptionService.js";

/**
 * Vendor Payment Controller
 * Provides payment history visibility for vendors on the mobile app.
 */

const safeDecrypt = (value) => {
  if (!value || typeof value !== "string") return value;
  try {
    if (isAES256GCMEncrypted(value)) {
      const decrypted = decryptAES256GCM(value);
      return decrypted !== value ? decrypted : value;
    }
    return value;
  } catch {
    return value;
  }
};

const buildDisplayName = (firstName, lastName) => {
  const decryptedFirst = safeDecrypt(firstName) || "";
  const decryptedLast = safeDecrypt(lastName) || "";
  const name = `${decryptedFirst} ${decryptedLast}`.trim();
  return name || "N/A";
};

const VendorPaymentController = {
  /**
   * Get payment history for the authenticated vendor
   * @route GET /api/mobile/vendor/payments/:vendorId
   * @access Authenticated vendor
   * @query { page, limit }
   */
  getMyPayments: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const { vendorId } = req.params;

      if (!vendorId || isNaN(parseInt(vendorId)) || parseInt(vendorId) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid vendor ID is required",
        });
      }

      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      // Get total count for this vendor
      const [countResult] = await connection.execute(
        "SELECT COUNT(*) AS total FROM daily_payments WHERE vendor_id = ?",
        [String(parseInt(vendorId))]
      );
      const total = countResult[0]?.total || 0;

      // Get paginated payments
      const [payments] = await connection.query(
        `SELECT
          dp.receipt_id,
          dp.collector_id,
          dp.vendor_id,
          c.first_name AS collector_first_name,
          c.last_name AS collector_last_name,
          dp.amount,
          dp.reference_no,
          dp.status,
          dp.time_date
        FROM daily_payments dp
        LEFT JOIN collector c ON dp.collector_id = c.collector_id
        WHERE dp.vendor_id = ?
        ORDER BY dp.time_date DESC
        LIMIT ? OFFSET ?`,
        [parseInt(vendorId), limit, offset]
      );

      const decryptedPayments = payments.map((p) => ({
        receipt_id: p.receipt_id,
        collector_name: buildDisplayName(p.collector_first_name, p.collector_last_name),
        amount: parseFloat(p.amount),
        reference_no: p.reference_no,
        status: p.status,
        time_date: p.time_date,
      }));

      res.status(200).json({
        success: true,
        message: "Payment history retrieved successfully",
        data: decryptedPayments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("❌ Error fetching vendor payment history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment history",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get payment summary/stats for the authenticated vendor
   * @route GET /api/mobile/vendor/payments/summary/:vendorId
   * @access Authenticated vendor
   */
  getPaymentSummary: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const { vendorId } = req.params;

      if (!vendorId || isNaN(parseInt(vendorId)) || parseInt(vendorId) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid vendor ID is required",
        });
      }

      const vid = parseInt(vendorId);

      // Total payments all time
      const [totalResult] = await connection.execute(
        `SELECT 
          COUNT(*) AS total_payments,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS total_amount,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
          COUNT(CASE WHEN status = 'missing' THEN 1 END) AS missing_count
        FROM daily_payments WHERE vendor_id = ?`,
        [String(vid)]
      );

      // This month's payments
      const [monthResult] = await connection.execute(
        `SELECT 
          COUNT(*) AS month_payments,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS month_amount,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) AS month_completed,
          COUNT(CASE WHEN status = 'missing' THEN 1 END) AS month_missing
        FROM daily_payments 
        WHERE vendor_id = ? 
          AND MONTH(time_date) = MONTH(CURRENT_DATE()) 
          AND YEAR(time_date) = YEAR(CURRENT_DATE())`,
        [String(vid)]
      );

      // Today's payment status
      const [todayResult] = await connection.execute(
        `SELECT 
          receipt_id, amount, status, time_date
        FROM daily_payments 
        WHERE vendor_id = ? 
          AND DATE(time_date) = CURDATE()
        ORDER BY time_date DESC
        LIMIT 1`,
        [String(vid)]
      );

      const allTime = totalResult[0] || {};
      const thisMonth = monthResult[0] || {};
      const today = todayResult[0] || null;

      res.status(200).json({
        success: true,
        message: "Payment summary retrieved",
        data: {
          allTime: {
            totalPayments: allTime.total_payments || 0,
            totalAmount: parseFloat(allTime.total_amount) || 0,
            completedCount: allTime.completed_count || 0,
            missingCount: allTime.missing_count || 0,
          },
          thisMonth: {
            totalPayments: thisMonth.month_payments || 0,
            totalAmount: parseFloat(thisMonth.month_amount) || 0,
            completedCount: thisMonth.month_completed || 0,
            missingCount: thisMonth.month_missing || 0,
          },
          today: today
            ? {
                hasPaid: today.status === "completed",
                status: today.status,
                amount: parseFloat(today.amount),
                time: today.time_date,
              }
            : {
                hasPaid: false,
                status: "unpaid",
                amount: 0,
                time: null,
              },
        },
      });
    } catch (error) {
      console.error("❌ Error fetching vendor payment summary:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment summary",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },
};

export default VendorPaymentController;
