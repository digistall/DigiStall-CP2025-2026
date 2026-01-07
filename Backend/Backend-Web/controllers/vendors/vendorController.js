import { createConnection } from "../../config/database.js";

/**
 * Vendor Controller
 * Handles creation and management of Vendor accounts
 */

/**
 * Create a new Vendor
 * POST /api/vendors
 */
export async function createVendor(req, res) {
  let connection;
  try {
    const {
      firstName,
      lastName,
      middleName,
      phone,
      email,
      birthdate,
      gender,
      address,
      businessName,
      businessType,
      businessDescription,
      vendorIdentifier,
      collectorId,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: firstName, lastName",
      });
    }

    connection = await createConnection();

    // Check if email already exists (if provided)
    if (email) {
      const [existingResult] = await connection.execute(
        "SELECT vendor_id FROM vendor WHERE email = ?",
        [email]
      );

      if (existingResult.length > 0) {
        return res.status(400).json({
          success: false,
          message: "A vendor with this email already exists",
        });
      }
    }

    console.log(`🏪 Creating vendor: ${firstName} ${lastName}`);

    // Create vendor using stored procedure
    const [insertResult] = await connection.execute(
      `CALL createVendor(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName,
        lastName,
        middleName || null,
        phone || null,
        email || null,
        birthdate || null,
        gender || null,
        address || null,
        businessName || null,
        businessType || null,
        businessDescription || null,
        vendorIdentifier || null,
        collectorId || null,
      ]
    );

    const vendorId = insertResult[0]?.[0]?.vendor_id;

    console.log("✅ Vendor created successfully");

    return res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: {
        vendorId,
        firstName,
        lastName,
        businessName,
        collectorId,
      },
    });
  } catch (error) {
    console.error("❌ Error creating vendor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create vendor",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Get all vendors
 * GET /api/vendors
 * Query params: branchId (optional), collectorId (optional)
 */
export async function getAllVendors(req, res) {
  let connection;
  try {
    const { branchId, collectorId } = req.query;

    connection = await createConnection();

    // Set session timezone to Philippine time
    await connection.execute(`SET time_zone = '+08:00'`);

    let vendors;

    if (collectorId) {
      // Get vendors by collector ID using stored procedure
      const [result] = await connection.execute(
        "CALL getVendorsByCollectorId(?)",
        [collectorId]
      );
      vendors = result[0] || [];
    } else {
      // Return all vendors using stored procedure
      const [result] = await connection.execute("CALL getAllVendors()");
      vendors = result[0] || [];
    }

    res.json({
      success: true,
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
}

/**
 * Get vendor by ID
 * GET /api/vendors/:id
 */
export async function getVendorById(req, res) {
  let connection;
  try {
    const { id } = req.params;

    connection = await createConnection();

    // Set session timezone to Philippine time
    await connection.execute(`SET time_zone = '+08:00'`);

    // Get vendor by ID using stored procedure
    const [result] = await connection.execute("CALL getVendorById(?)", [id]);

    const vendor = result[0]?.[0];

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error("❌ Error fetching vendor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Update vendor
 * PUT /api/vendors/:id
 */
export async function updateVendor(req, res) {
  let connection;
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      middleName,
      phone,
      email,
      birthdate,
      gender,
      address,
      businessName,
      businessType,
      businessDescription,
      vendorIdentifier,
      collectorId,
      status,
    } = req.body;

    connection = await createConnection();

    console.log(`🔄 Updating vendor: ${id}`);

    // Update vendor using stored procedure
    await connection.execute(
      `CALL updateVendor(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        firstName,
        lastName,
        middleName || null,
        phone || null,
        email || null,
        birthdate || null,
        gender || null,
        address || null,
        businessName || null,
        businessType || null,
        businessDescription || null,
        vendorIdentifier || null,
        collectorId || null,
        status || "Active",
      ]
    );

    console.log("✅ Vendor updated successfully");

    res.json({
      success: true,
      message: "Vendor updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating vendor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vendor",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Delete/Deactivate vendor
 * DELETE /api/vendors/:id
 */
export async function deleteVendor(req, res) {
  let connection;
  try {
    const { id } = req.params;

    connection = await createConnection();

    console.log(`🗑️ Deleting vendor: ${id}`);

    // Delete vendor using stored procedure
    await connection.execute("CALL deleteVendor(?)", [id]);

    console.log("✅ Vendor deleted successfully");

    res.json({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting vendor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vendor",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
}
