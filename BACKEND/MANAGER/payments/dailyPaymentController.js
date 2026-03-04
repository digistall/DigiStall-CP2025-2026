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
    console.error("⚠️ Decryption failed for value:", error.message);
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
   * Get all daily payments
   * @route GET /api/payments/daily
   */
  getAllDailyPayments: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      console.log("🔍 Fetching all daily payments");

      const [result] = await connection.execute("CALL getAllDailyPayments()");

      const rawPayments = result[0] || [];
      console.log("📊 Daily payments found:", rawPayments.length);

      // Decrypt collector names (encrypted with AES-256-GCM) and build display names
      const payments = rawPayments.map((payment) => {
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

      res.status(200).json({
        success: true,
        message: "Daily payments retrieved successfully",
        data: payments,
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

      console.log("🔍 Fetching daily payment with receipt ID:", parsedId);

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

      console.log("📊 Daily payment found:", payment);

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

      console.log("➕ Adding daily payment:", {
        collectorId,
        vendorId,
        amount,
        referenceNo,
        status,
      });

      console.log("🔍 Parsed values:", {
        collectorId: parseInt(collectorId),
        vendorId: parseInt(vendorId),
        amount: parseFloat(amount),
        referenceNo: referenceNo || null,
        status,
      });

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

      console.log(
        "📋 Raw stored procedure result:",
        JSON.stringify(result, null, 2),
      );

      // Check if the procedure returned success
      const procedureResult = result[0];
      if (!procedureResult || procedureResult.length === 0) {
        throw new Error("No result from stored procedure");
      }

      const paymentData = procedureResult[0];

      console.log("📦 Stored procedure result:", paymentData);

      if (!paymentData.success) {
        console.log("⚠️ Payment creation failed:", paymentData.message);
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

      console.log(
        "✅ Daily payment added successfully:",
        decryptedPayment.receipt_id,
      );

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

      console.log("✏️ Updating daily payment:", receiptId);

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

      console.log("✅ Daily payment updated successfully");

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

      console.log("🗑️ Deleting daily payment:", receiptId);

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

      console.log("✅ Daily payment deleted successfully");

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

      console.log("🔍 Fetching all vendors");

      const [result] = await connection.execute(
        "CALL getAllVendorsForDailyPayments()",
      );

      const rawVendors = result[0] || [];
      console.log("📊 Vendors found:", rawVendors.length);

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
   * Get all collectors for dropdown
   * @route GET /api/payments/daily/collectors
   */
  getAllCollectors: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();

      console.log("🔍 Fetching all collectors");

      const [result] = await connection.execute(
        "CALL getAllCollectorsForDailyPayments()",
      );

      const rawCollectors = result[0] || [];
      console.log("📊 Collectors found:", rawCollectors.length);

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
