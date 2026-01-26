import { createConnection } from "../../CONFIG/database.js";

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

      const payments = result[0] || [];
      console.log("📊 Daily payments found:", payments.length);

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

      console.log("📊 Daily payment found:", result[0][0]);

      res.status(200).json({
        success: true,
        message: "Daily payment retrieved successfully",
        data: result[0][0],
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
        ]
      );

      console.log(
        "📋 Raw stored procedure result:",
        JSON.stringify(result, null, 2)
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

      console.log(
        "✅ Daily payment added successfully:",
        paymentData.receipt_id
      );

      res.status(201).json({
        success: true,
        message: "Daily payment added successfully",
        data: paymentData,
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
        ]
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

      console.log("✅ Daily payment updated successfully");

      res.status(200).json({
        success: true,
        message: "Daily payment updated successfully",
        data: paymentData,
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

      const [result] = await connection.execute("CALL getAllVendors()");

      const vendors = result[0] || [];
      console.log("📊 Vendors found:", vendors.length);

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

      const [result] = await connection.execute("CALL getAllCollectors()");

      const collectors = result[0] || [];
      console.log("📊 Collectors found:", collectors.length);

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

