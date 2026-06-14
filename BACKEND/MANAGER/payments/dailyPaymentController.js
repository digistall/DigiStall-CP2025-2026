import { createConnection } from "../../../config/database.js";
import {
  decryptAES256GCM,
  isAES256GCMEncrypted,
} from "../../../services/mysqlDecryptionService.js";

/**
 * Safely decrypt a value if it is AES-256-GCM encrypted.
 * Returns the original value when decryption is not needed or fails.
 */
const safeDecrypt = (value) => {
  if (!value || typeof value !== "string") return value;
  try {
    if (isAES256GCMEncrypted(value)) {
      const decrypted = decryptAES256GCM(value);
      return decrypted !== value ? decrypted : value;
    }
    return value;
  } catch (error) {
    return value;
  }
};

/**
 * Build a display name from first_name and last_name, decrypting if needed.
 */
const buildDisplayName = (firstName, lastName) => {
  const decryptedFirst = safeDecrypt(firstName) || "";
  const decryptedLast = safeDecrypt(lastName) || "";
  const name = `${decryptedFirst} ${decryptedLast}`.trim();
  return name || "N/A";
};

const DailyPaymentController = {
  /**
   * Get all daily payments with optional filtering, pagination, and branch access
   * @route GET /api/payments/daily
   * @query {string} search - Search by collector/vendor name, reference no
   * @query {string} status - Filter by status (completed, pending, failed, cancelled)
   * @query {string} startDate - Filter from date (ISO format)
   * @query {string} endDate - Filter to date (ISO format)
   * @query {number} collectorId - Filter by collector
   * @query {number} vendorId - Filter by vendor
   * @query {number} page - Page number (1-based)
   * @query {number} limit - Items per page (default 50)
   */
  getAllDailyPayments: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const {
        search,
        status,
        startDate,
        endDate,
        collectorId,
        vendorId,
        page = 1,
        limit = 50,
      } = req.query;

      // Build dynamic query with filters
      let baseQuery = `
        SELECT
          dp.receipt_id,
          dp.collector_id,
          c.first_name AS collector_first_name,
          c.last_name AS collector_last_name,
          dp.vendor_id,
          v.first_name AS vendor_first_name,
          v.last_name AS vendor_last_name,
          dp.amount,
          dp.reference_no,
          dp.status,
          dp.time_date
        FROM daily_payments dp
        LEFT JOIN collector c ON dp.collector_id = c.collector_id
        LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
      `;

      let countQuery = `
        SELECT COUNT(*) AS total
        FROM daily_payments dp
        LEFT JOIN collector c ON dp.collector_id = c.collector_id
        LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
      `;

      const conditions = [];
      const params = [];

      // Status filter
      if (status) {
        conditions.push("dp.status = ?");
        params.push(status);
      }

      // Date range filter
      if (startDate) {
        conditions.push("dp.time_date >= ?");
        params.push(startDate);
      }
      if (endDate) {
        conditions.push("dp.time_date <= ?");
        // Add end of day to include the full end date
        params.push(`${endDate} 23:59:59`);
      }

      // Collector filter
      if (collectorId) {
        conditions.push("dp.collector_id = ?");
        params.push(parseInt(collectorId));
      }

      // Vendor filter
      if (vendorId) {
        conditions.push("dp.vendor_id = ?");
        params.push(parseInt(vendorId));
      }

      // Build WHERE clause
      if (conditions.length > 0) {
        const whereClause = " WHERE " + conditions.join(" AND ");
        baseQuery += whereClause;
        countQuery += whereClause;
      }

      // Get total count for pagination
      const [countResult] = await connection.query(countQuery, params);
      const totalRecords = countResult[0]?.total || 0;

      // Add sorting and pagination
      baseQuery += " ORDER BY dp.time_date DESC";

      const pageInt = Math.max(1, parseInt(page) || 1);
      const limitInt = Math.min(200, Math.max(1, parseInt(limit) || 50));
      const offset = (pageInt - 1) * limitInt;

      baseQuery += " LIMIT ? OFFSET ?";
      const queryParams = [...params, limitInt, offset];

      const [rawPayments] = await connection.query(baseQuery, queryParams);

      // Decrypt collector/vendor names and apply search filter client-side
      // (search is done post-decrypt since names may be encrypted)
      let payments = rawPayments.map((payment) => {
        try {
          return {
            ...payment,
            collector_name: buildDisplayName(
              payment.collector_first_name,
              payment.collector_last_name,
            ),
            vendor_name: buildDisplayName(
              payment.vendor_first_name,
              payment.vendor_last_name,
            ),
          };
        } catch (decryptError) {
          console.error(
            "⚠️ Decryption error for payment",
            payment.receipt_id,
            ":",
            decryptError.message,
          );
          return {
            ...payment,
            collector_name: "N/A",
            vendor_name: "N/A",
          };
        }
      });

      // Client-side search filter (post-decryption)
      if (search) {
        const query = search.toLowerCase();
        payments = payments.filter(
          (p) =>
            (p.collector_name || "").toLowerCase().includes(query) ||
            (p.vendor_name || "").toLowerCase().includes(query) ||
            (p.reference_no || "").toLowerCase().includes(query) ||
            p.receipt_id.toString().includes(query),
        );
      }

      res.status(200).json({
        success: true,
        message: "Daily payments retrieved successfully",
        data: payments,
        pagination: {
          page: pageInt,
          limit: limitInt,
          total: totalRecords,
          totalPages: Math.ceil(totalRecords / limitInt),
        },
      });
    } catch (error) {
      console.error("❌ Error fetching daily payments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch daily payments",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get daily payment statistics/summary
   * @route GET /api/payments/daily/stats
   */
  getDailyPaymentStats: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const { startDate, endDate } = req.query;

      let dateFilter = "";
      const params = [];

      if (startDate) {
        dateFilter += " AND dp.time_date >= ?";
        params.push(startDate);
      }
      if (endDate) {
        dateFilter += " AND dp.time_date <= ?";
        params.push(`${endDate} 23:59:59`);
      }

      // Get summary statistics
      const [stats] = await connection.query(
        `SELECT
          COUNT(*) AS total_transactions,
          COALESCE(SUM(dp.amount), 0) AS total_amount,
          COALESCE(AVG(dp.amount), 0) AS average_amount,
          SUM(CASE WHEN dp.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
          SUM(CASE WHEN dp.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
          SUM(CASE WHEN dp.status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
          SUM(CASE WHEN dp.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
          SUM(CASE WHEN dp.status = 'completed' THEN dp.amount ELSE 0 END) AS completed_amount,
          SUM(CASE WHEN dp.status = 'pending' THEN dp.amount ELSE 0 END) AS pending_amount
        FROM daily_payments dp
        WHERE 1=1 ${dateFilter}`,
        params,
      );

      // Get today's summary
      const today = new Date().toISOString().split("T")[0];
      const [todayStats] = await connection.query(
        `SELECT
          COUNT(*) AS today_transactions,
          COALESCE(SUM(amount), 0) AS today_amount
        FROM daily_payments
        WHERE DATE(time_date) = ?`,
        [today],
      );

      // Get top collectors (this week)
      const [topCollectors] = await connection.query(
        `SELECT
          dp.collector_id,
          c.first_name AS collector_first_name,
          c.last_name AS collector_last_name,
          COUNT(*) AS transaction_count,
          SUM(dp.amount) AS total_collected
        FROM daily_payments dp
        LEFT JOIN collector c ON dp.collector_id = c.collector_id
        WHERE dp.time_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          AND dp.status = 'completed'
        GROUP BY dp.collector_id, c.first_name, c.last_name
        ORDER BY total_collected DESC
        LIMIT 5`,
      );

      // Decrypt collector names
      const decryptedTopCollectors = topCollectors.map((c) => ({
        collector_id: c.collector_id,
        collector_name: buildDisplayName(
          c.collector_first_name,
          c.collector_last_name,
        ),
        transaction_count: c.transaction_count,
        total_collected: parseFloat(c.total_collected),
      }));

      res.status(200).json({
        success: true,
        message: "Daily payment statistics retrieved successfully",
        data: {
          summary: {
            totalTransactions: stats[0]?.total_transactions || 0,
            totalAmount: parseFloat(stats[0]?.total_amount || 0),
            averageAmount: parseFloat(stats[0]?.average_amount || 0),
            completedCount: stats[0]?.completed_count || 0,
            pendingCount: stats[0]?.pending_count || 0,
            failedCount: stats[0]?.failed_count || 0,
            cancelledCount: stats[0]?.cancelled_count || 0,
            completedAmount: parseFloat(stats[0]?.completed_amount || 0),
            pendingAmount: parseFloat(stats[0]?.pending_amount || 0),
          },
          today: {
            transactions: todayStats[0]?.today_transactions || 0,
            amount: parseFloat(todayStats[0]?.today_amount || 0),
          },
          topCollectors: decryptedTopCollectors,
        },
      });
    } catch (error) {
      console.error("❌ Error fetching daily payment stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment statistics",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get a single daily payment by receipt ID
   * @route GET /api/payments/daily/:receiptId
   */
  getDailyPaymentById: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const { receiptId } = req.params;

      // Validate receipt ID
      const parsedId = parseInt(receiptId);
      if (!receiptId || isNaN(parsedId) || parsedId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid receipt ID is required",
        });
      }

      const [result] = await connection.execute("CALL getDailyPaymentById(?)", [
        parsedId,
      ]);

      if (!result[0] || result[0].length === 0) {
        return res.status(404).json({
          success: false,
          message: "Daily payment not found",
        });
      }

      const raw = result[0][0];
      const payment = {
        ...raw,
        collector_name: buildDisplayName(
          raw.collector_first_name,
          raw.collector_last_name,
        ),
        vendor_name: buildDisplayName(
          raw.vendor_first_name,
          raw.vendor_last_name,
        ),
      };

      res.status(200).json({
        success: true,
        message: "Daily payment retrieved successfully",
        data: payment,
      });
    } catch (error) {
      console.error("❌ Error fetching daily payment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch daily payment",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Add a new daily payment
   * @route POST /api/payments/daily
   */
  addDailyPayment: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const {
        collectorId,
        vendorId,
        amount,
        referenceNo,
        status = "completed",
      } = req.body;

      // Validation
      if (!collectorId) {
        return res.status(400).json({
          success: false,
          message: "Collector ID is required",
        });
      }

      if (!vendorId) {
        return res.status(400).json({
          success: false,
          message: "Vendor ID is required",
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid amount is required",
        });
      }

      const [result] = await connection.execute(
        "CALL addDailyPayment(?, ?, ?, ?, ?)",
        [
          parseInt(collectorId),
          parseInt(vendorId),
          parseFloat(amount),
          referenceNo || null,
          status,
        ],
      );

      // Check if the procedure returned success
      const procedureResult = result[0];
      if (!procedureResult || procedureResult.length === 0) {
        throw new Error("No result from stored procedure");
      }

      const paymentData = procedureResult[0];

      if (!paymentData.success) {
        return res.status(400).json({
          success: false,
          message: paymentData.message || "Failed to add daily payment",
        });
      }

      // Decrypt names in the returned payment data
      const decryptedPayment = {
        ...paymentData,
        collector_name: buildDisplayName(
          paymentData.collector_first_name,
          paymentData.collector_last_name,
        ),
        vendor_name: buildDisplayName(
          paymentData.vendor_first_name,
          paymentData.vendor_last_name,
        ),
      };

      res.status(201).json({
        success: true,
        message: "Daily payment added successfully",
        data: decryptedPayment,
      });
    } catch (error) {
      console.error("❌ Error adding daily payment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to add daily payment",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Update an existing daily payment
   * @route PUT /api/payments/daily/:receiptId
   */
  updateDailyPayment: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const { receiptId } = req.params;
      const { collectorId, vendorId, amount, referenceNo, status } = req.body;

      if (!receiptId) {
        return res.status(400).json({
          success: false,
          message: "Receipt ID is required",
        });
      }

      const [result] = await connection.execute(
        "CALL updateDailyPayment(?, ?, ?, ?, ?, ?)",
        [
          parseInt(receiptId),
          collectorId ? parseInt(collectorId) : null,
          vendorId ? parseInt(vendorId) : null,
          amount ? parseFloat(amount) : null,
          referenceNo || null,
          status || null,
        ],
      );

      const procedureResult = result[0];
      if (!procedureResult || procedureResult.length === 0) {
        throw new Error("No result from stored procedure");
      }

      const paymentData = procedureResult[0];

      if (!paymentData.success) {
        return res.status(400).json({
          success: false,
          message: paymentData.message || "Failed to update daily payment",
        });
      }

      // Decrypt names in the returned payment data
      const decryptedPayment = {
        ...paymentData,
        collector_name: buildDisplayName(
          paymentData.collector_first_name,
          paymentData.collector_last_name,
        ),
        vendor_name: buildDisplayName(
          paymentData.vendor_first_name,
          paymentData.vendor_last_name,
        ),
      };

      res.status(200).json({
        success: true,
        message: "Daily payment updated successfully",
        data: decryptedPayment,
      });
    } catch (error) {
      console.error("❌ Error updating daily payment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update daily payment",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Delete a daily payment
   * @route DELETE /api/payments/daily/:receiptId
   */
  deleteDailyPayment: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const { receiptId } = req.params;

      if (!receiptId) {
        return res.status(400).json({
          success: false,
          message: "Receipt ID is required",
        });
      }

      const [result] = await connection.execute("CALL deleteDailyPayment(?)", [
        parseInt(receiptId),
      ]);

      const procedureResult = result[0];
      if (!procedureResult || procedureResult.length === 0) {
        throw new Error("No result from stored procedure");
      }

      const deleteResult = procedureResult[0];

      if (!deleteResult.success) {
        return res.status(400).json({
          success: false,
          message: deleteResult.message || "Failed to delete daily payment",
        });
      }

      res.status(200).json({
        success: true,
        message: "Daily payment deleted successfully",
        data: deleteResult,
      });
    } catch (error) {
      console.error("❌ Error deleting daily payment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete daily payment",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get all vendors for dropdown
   * @route GET /api/payments/daily/vendors
   */
  getAllVendors: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const [result] = await connection.execute(
        "CALL getAllVendorsForDailyPayments()",
      );

      const rawVendors = result[0] || [];

      // Decrypt vendor names if encrypted and build display names
      const vendors = rawVendors.map((vendor) => {
        try {
          return {
            vendor_id: vendor.vendor_id,
            vendor_name: buildDisplayName(vendor.first_name, vendor.last_name),
          };
        } catch (decryptError) {
          console.error(
            "⚠️ Decryption error for vendor",
            vendor.vendor_id,
            ":",
            decryptError.message,
          );
          return {
            vendor_id: vendor.vendor_id,
            vendor_name: "N/A",
          };
        }
      });

      res.status(200).json({
        success: true,
        message: "Vendors retrieved successfully",
        data: vendors,
      });
    } catch (error) {
      console.error("❌ Error fetching vendors:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vendors",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get all vendors with their latest payment info (for main table view)
   * @route GET /api/payments/daily/vendor-list
   */
  getVendorList: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      // Get all active vendors with their latest payment and total collected
      const [vendors] = await connection.query(`
        SELECT
          v.vendor_id,
          v.first_name,
          v.last_name,
          COUNT(dp.receipt_id) AS total_payments,
          COALESCE(SUM(dp.amount), 0) AS total_collected,
          MAX(dp.time_date) AS last_payment_date,
          (SELECT dp2.status FROM daily_payments dp2
           WHERE dp2.vendor_id = v.vendor_id
           ORDER BY dp2.time_date DESC LIMIT 1) AS last_payment_status
        FROM vendor v
        LEFT JOIN daily_payments dp ON v.vendor_id = dp.vendor_id
        WHERE v.status IS NULL OR LOWER(v.status) <> 'inactive'
        GROUP BY v.vendor_id, v.first_name, v.last_name
        ORDER BY last_payment_date DESC, v.vendor_id ASC
      `);

      const vendorList = vendors.map((v) => {
        try {
          return {
            vendor_id: v.vendor_id,
            vendor_name: buildDisplayName(v.first_name, v.last_name),
            total_payments: v.total_payments || 0,
            total_collected: parseFloat(v.total_collected || 0),
            last_payment_date: v.last_payment_date,
            last_payment_status: v.last_payment_status || null,
          };
        } catch (decryptError) {
          return {
            vendor_id: v.vendor_id,
            vendor_name: "N/A",
            total_payments: v.total_payments || 0,
            total_collected: parseFloat(v.total_collected || 0),
            last_payment_date: v.last_payment_date,
            last_payment_status: v.last_payment_status || null,
          };
        }
      });

      res.status(200).json({
        success: true,
        message: "Vendor list retrieved successfully",
        data: vendorList,
      });
    } catch (error) {
      console.error("❌ Error fetching vendor list:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vendor list",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get payment history for a specific vendor
   * @route GET /api/payments/daily/vendor/:vendorId
   */
  getVendorPaymentHistory: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const { vendorId } = req.params;

      const parsedId = parseInt(vendorId);
      if (!vendorId || isNaN(parsedId) || parsedId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid vendor ID is required",
        });
      }

      // Get vendor info
      const [vendorInfo] = await connection.execute(
        `SELECT vendor_id, first_name, last_name FROM vendor WHERE vendor_id = ?`,
        [parsedId],
      );

      if (!vendorInfo || vendorInfo.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      const vendor = {
        vendor_id: vendorInfo[0].vendor_id,
        vendor_name: buildDisplayName(vendorInfo[0].first_name, vendorInfo[0].last_name),
      };

      // Get all daily payments for this vendor
      const [payments] = await connection.execute(
        `SELECT
          dp.receipt_id,
          dp.collector_id,
          c.first_name AS collector_first_name,
          c.last_name AS collector_last_name,
          dp.amount,
          dp.reference_no,
          dp.status,
          dp.time_date
        FROM daily_payments dp
        LEFT JOIN collector c ON dp.collector_id = c.collector_id
        WHERE dp.vendor_id = ?
        ORDER BY dp.time_date DESC`,
        [parsedId],
      );

      // Decrypt and build response
      const decryptedPayments = payments.map((p) => ({
        receipt_id: p.receipt_id,
        collector_id: p.collector_id,
        collector_name: buildDisplayName(p.collector_first_name, p.collector_last_name),
        amount: parseFloat(p.amount),
        reference_no: p.reference_no,
        status: p.status,
        time_date: p.time_date,
      }));

      // Calculate summary
      const totalAmount = decryptedPayments.reduce((sum, p) => sum + p.amount, 0);
      const completedCount = decryptedPayments.filter((p) => p.status === "completed").length;

      res.status(200).json({
        success: true,
        message: "Vendor payment history retrieved successfully",
        data: {
          vendor,
          payments: decryptedPayments,
          summary: {
            totalPayments: decryptedPayments.length,
            totalAmount,
            completedCount,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error fetching vendor payment history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vendor payment history",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get all collectors for dropdown
   * @route GET /api/payments/daily/collectors
   */
  getAllCollectors: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const [result] = await connection.execute(
        "CALL getAllCollectorsForDailyPayments()",
      );

      const rawCollectors = result[0] || [];

      // Decrypt collector names (encrypted with AES-256-GCM) and build display names
      const collectors = rawCollectors.map((collector) => {
        try {
          return {
            collector_id: collector.collector_id,
            collector_name: buildDisplayName(
              collector.first_name,
              collector.last_name,
            ),
          };
        } catch (decryptError) {
          console.error(
            "⚠️ Decryption error for collector",
            collector.collector_id,
            ":",
            decryptError.message,
          );
          return {
            collector_id: collector.collector_id,
            collector_name: "N/A",
          };
        }
      });

      res.status(200).json({
        success: true,
        message: "Collectors retrieved successfully",
        data: collectors,
      });
    } catch (error) {
      console.error("❌ Error fetching collectors:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch collectors",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },
};

export default DailyPaymentController;
