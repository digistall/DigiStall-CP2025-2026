import { createConnection } from "../../config/database.js";
import {
  decryptAES256GCM,
  isAES256GCMEncrypted,
} from "../../services/mysqlDecryptionService.js";

/**
 * Collector Payment Controller
 * Handles QR-based vendor lookup and daily payment creation for mobile collectors.
 * All database access uses stored procedures.
 */

/**
 * Safely decrypt a value if it is AES-256-GCM encrypted.
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

/**
 * Build a display name from first_name and last_name, decrypting if needed.
 */
const buildDisplayName = (firstName, lastName) => {
  const decryptedFirst = safeDecrypt(firstName) || "";
  const decryptedLast = safeDecrypt(lastName) || "";
  const name = `${decryptedFirst} ${decryptedLast}`.trim();
  return name || "N/A";
};

const CollectorPaymentController = {
  /**
   * Lookup a vendor by their vendor_identifier (QR code value)
   * @route GET /api/collector/vendors/qr/:vendorIdentifier
   * @access Authenticated collector
   */
  getVendorByIdentifier: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const { vendorIdentifier } = req.params;

      // Server-side validation — never trust QR contents directly
      if (!vendorIdentifier || vendorIdentifier.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Vendor identifier is required",
        });
      }

      // Sanitize: only allow alphanumeric, dashes, underscores
      const sanitized = vendorIdentifier.trim();
      if (!/^[A-Za-z0-9\-_]+$/.test(sanitized)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vendor identifier format",
        });
      }

      const [result] = await connection.execute(
        "CALL sp_GetVendorByIdentifier(?)",
        [sanitized]
      );

      const procedureResult = result[0];
      if (!procedureResult || procedureResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      const vendorData = procedureResult[0];

      if (!vendorData.success) {
        return res.status(404).json({
          success: false,
          message: vendorData.message || "Vendor not found",
        });
      }

      // Check vendor status
      if (vendorData.status && vendorData.status.toLowerCase() === "inactive") {
        return res.status(400).json({
          success: false,
          message: "This vendor is inactive and cannot receive payments",
        });
      }

      // Build response with decrypted names
      const vendor = {
        vendor_id: vendorData.vendor_id,
        vendor_identifier: vendorData.vendor_identifier,
        vendor_name: buildDisplayName(vendorData.first_name, vendorData.last_name),
        first_name: safeDecrypt(vendorData.first_name),
        last_name: safeDecrypt(vendorData.last_name),
        middle_name: safeDecrypt(vendorData.middle_name),
        contact_number: safeDecrypt(vendorData.contact_number),
        email: safeDecrypt(vendorData.email),
        status: vendorData.status,
        assigned_location: {
          location_id: vendorData.assigned_location_id,
          location_name: vendorData.location_name || "Unassigned",
          address: vendorData.location_address || null,
        },
      };

      res.status(200).json({
        success: true,
        message: "Vendor found",
        data: vendor,
      });
    } catch (error) {
      console.error("❌ Error looking up vendor by identifier:", error);
      res.status(500).json({
        success: false,
        message: "Failed to look up vendor",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Create a daily payment (collector mobile QR flow)
   * @route POST /api/collector/daily-payments
   * @access Authenticated collector
   * @body { vendorId, amount }
   */
  createDailyPayment: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const { vendorId, amount, status } = req.body;

      // Get collector ID from authenticated token
      // Staff login stores staffId in token payload
      const collectorId =
        req.user?.staffId || req.user?.userId || req.user?.collectorId;

      if (!collectorId) {
        return res.status(401).json({
          success: false,
          message: "Collector authentication required",
        });
      }

      // Validate vendor ID
      if (!vendorId || isNaN(parseInt(vendorId)) || parseInt(vendorId) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid vendor ID is required",
        });
      }

      // Determine payment status
      const paymentStatus = status === "missing" ? "missing" : "completed";

      // Validate amount based on status
      const parsedAmount = parseFloat(amount) || 0;
      if (paymentStatus !== "missing" && parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be greater than zero",
        });
      }

      if (parsedAmount > 99999999.99) {
        return res.status(400).json({
          success: false,
          message: "Amount exceeds maximum allowed value",
        });
      }

      // Call stored procedure — generates reference number automatically
      const [result] = await connection.execute(
        "CALL sp_CreateDailyPayment(?, ?, ?, ?)",
        [parseInt(collectorId), parseInt(vendorId), parsedAmount, paymentStatus]
      );

      const procedureResult = result[0];
      if (!procedureResult || procedureResult.length === 0) {
        throw new Error("No result from stored procedure");
      }

      const paymentData = procedureResult[0];

      if (!paymentData.success) {
        return res.status(400).json({
          success: false,
          message: paymentData.message || "Failed to record payment",
        });
      }

      // Build receipt response with decrypted names
      const receipt = {
        receipt_id: paymentData.receipt_id,
        reference_no: paymentData.reference_no,
        collector_id: paymentData.collector_id,
        collector_name: buildDisplayName(
          paymentData.collector_first_name,
          paymentData.collector_last_name
        ),
        vendor_id: paymentData.vendor_id,
        vendor_name: buildDisplayName(
          paymentData.vendor_first_name,
          paymentData.vendor_last_name
        ),
        vendor_identifier: paymentData.vendor_identifier,
        amount: parseFloat(paymentData.amount),
        status: paymentData.status,
        time_date: paymentData.time_date,
        location_name: paymentData.location_name || "N/A",
      };

      res.status(201).json({
        success: true,
        message: "Payment recorded successfully",
        data: receipt,
      });
    } catch (error) {
      console.error("❌ Error creating daily payment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to record payment",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get collector's recent payments (for payment history list)
   * @route GET /api/collector/daily-payments
   * @access Authenticated collector
   * @query { page, limit }
   */
  getMyPayments: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      const collectorId =
        req.user?.staffId || req.user?.userId || req.user?.collectorId;

      if (!collectorId) {
        return res.status(401).json({
          success: false,
          message: "Collector authentication required",
        });
      }

      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      // Get total count
      const [countResult] = await connection.execute(
        "SELECT COUNT(*) AS total FROM daily_payments WHERE collector_id = ?",
        [String(parseInt(collectorId))]
      );
      const total = countResult[0]?.total || 0;

      // Get paginated payments (use query instead of execute to avoid mysql2 LIMIT bug)
      const [payments] = await connection.query(
        `SELECT
          dp.receipt_id,
          dp.collector_id,
          dp.vendor_id,
          v.first_name AS vendor_first_name,
          v.last_name AS vendor_last_name,
          v.vendor_identifier,
          dp.amount,
          dp.reference_no,
          dp.status,
          dp.time_date
        FROM daily_payments dp
        LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
        WHERE dp.collector_id = ?
        ORDER BY dp.time_date DESC
        LIMIT ? OFFSET ?`,
        [parseInt(collectorId), limit, offset]
      );

      const decryptedPayments = payments.map((p) => ({
        receipt_id: p.receipt_id,
        vendor_id: p.vendor_id,
        vendor_name: buildDisplayName(p.vendor_first_name, p.vendor_last_name),
        vendor_identifier: p.vendor_identifier,
        amount: parseFloat(p.amount),
        reference_no: p.reference_no,
        status: p.status,
        time_date: p.time_date,
      }));

      res.status(200).json({
        success: true,
        message: "Payments retrieved successfully",
        data: decryptedPayments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("❌ Error fetching collector payments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payments",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },
};

export default CollectorPaymentController;
