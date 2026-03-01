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
      suffix,
      contactNumber,
      email,
      birthdate,
      gender,
      address,
      vendorIdentifier,
      status,
      // Spouse info
      spouseFullName,
      spouseAge,
      spouseBirthdate,
      spouseEducation,
      spouseContact,
      spouseOccupation,
      // Child info
      childFullName,
      childAge,
      childBirthdate,
      // Business info
      businessName,
      businessType,
      businessDescription,
      vendingTimeStart,
      vendingTimeEnd,
      // Location info
      locationName,
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

    console.log(`🏪 Creating vendor with relations: ${firstName} ${lastName}`);

    // Create vendor using stored procedure with all relations
    const [insertResult] = await connection.execute(
      `CALL createVendorWithRelations(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        // Vendor personal info
        firstName,
        lastName,
        middleName || null,
        suffix || null,
        contactNumber || null,
        email || null,
        birthdate || null,
        gender || null,
        address || null,
        vendorIdentifier || null,
        status || "Active",
        // Spouse info
        spouseFullName || null,
        spouseAge || null,
        spouseBirthdate || null,
        spouseEducation || null,
        spouseContact || null,
        spouseOccupation || null,
        // Child info
        childFullName || null,
        childAge || null,
        childBirthdate || null,
        // Business info
        businessName || null,
        businessType || null,
        businessDescription || null,
        vendingTimeStart || null,
        vendingTimeEnd || null,
        // Location info
        locationName || null,
      ]
    );

    const vendorId = insertResult[0]?.[0]?.vendor_id;

    console.log("✅ Vendor created successfully with all relations");

    return res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: {
        vendorId,
        firstName,
        lastName,
        businessName,
        locationName,
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

    // Return all vendors with relations using stored procedure
    const [result] = await connection.execute(
      "CALL getAllVendorsWithRelations()"
    );
    vendors = result[0] || [];

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

    // Get vendor by ID with all relations using stored procedure
    const [result] = await connection.execute(
      "CALL getVendorWithRelations(?)",
      [id]
    );

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
      suffix,
      contactNumber,
      email,
      birthdate,
      gender,
      address,
      vendorIdentifier,
      status,
      // Spouse info
      spouseFullName,
      spouseAge,
      spouseBirthdate,
      spouseEducation,
      spouseContact,
      spouseOccupation,
      // Child info
      childFullName,
      childAge,
      childBirthdate,
      // Business info
      businessName,
      businessType,
      businessDescription,
      vendingTimeStart,
      vendingTimeEnd,
      // Location info
      locationName,
    } = req.body;

    connection = await createConnection();

    console.log(`🔄 Updating vendor with relations: ${id}`);

    // Update vendor with all relations using stored procedure
    await connection.execute(
      `CALL updateVendorWithRelations(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        // Vendor personal info
        firstName,
        lastName,
        middleName || null,
        suffix || null,
        contactNumber || null,
        email || null,
        birthdate || null,
        gender || null,
        address || null,
        vendorIdentifier || null,
        status || "Active",
        // Spouse info
        spouseFullName || null,
        spouseAge || null,
        spouseBirthdate || null,
        spouseEducation || null,
        spouseContact || null,
        spouseOccupation || null,
        // Child info
        childFullName || null,
        childAge || null,
        childBirthdate || null,
        // Business info
        businessName || null,
        businessType || null,
        businessDescription || null,
        vendingTimeStart || null,
        vendingTimeEnd || null,
        // Location info
        locationName || null,
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

    console.log(`🗑️ Deleting vendor with relations: ${id}`);

    // Delete vendor using stored procedure (soft delete, keep relations)
    await connection.execute("CALL deleteVendorWithRelations(?, ?)", [
      id,
      false,
    ]);

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

