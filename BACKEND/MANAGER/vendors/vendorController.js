import { createConnection } from "../../../config/database.js";

/**
 * Vendor Controller
 * Handles creation and management of Vendor accounts with correct parameter mapping
 */

/**
 * Format a date value to MySQL-compatible YYYY-MM-DD string.
 * Handles Date objects, ISO datetime strings, and plain date strings.
 * Uses local timezone (expected: Philippine Time UTC+8) to preserve the correct calendar date.
 */
function formatDateForDB(val) {
  if (!val || val === "") return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const date = new Date(s);
  if (isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Get assigned locations for dropdown
 * GET /api/vendors/locations
 */
export async function getAssignedLocations(req, res) {
  let connection;
  try {
    const search = req.query.search || null;

    connection = await createConnection();

    const [result] = await connection.execute("CALL getAssignedLocations(?)", [
      search,
    ]);

    const locations = result[0] || [];

    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error("❌ Error fetching assigned locations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned locations",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
}

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
      // Spouse info (full name)
      spouseFullName,
      spouseAge,
      spouseBirthdate,
      spouseEducation,
      spouseContact,
      spouseOccupation,
      // Child info (full name)
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
      assignedLocationId,
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

    console.log(`🏪 Creating vendor with relations: ${firstName} ${lastName}`);

    // Create vendor using stored procedure with all relations (27 params)
    const [insertResult] = await connection.execute(
      `CALL createVendorWithRelations(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        // Vendor personal info (11)
        firstName,
        lastName,
        middleName || null,
        suffix || null,
        contactNumber || null,
        email || null,
        formatDateForDB(birthdate),
        gender || null,
        address || null,
        vendorIdentifier || null,
        status || "Active",
        // Spouse info (6)
        spouseFullName || null,
        spouseAge || null,
        formatDateForDB(spouseBirthdate),
        spouseEducation || null,
        spouseContact || null,
        spouseOccupation || null,
        // Child info (3)
        childFullName || null,
        childAge || null,
        formatDateForDB(childBirthdate),
        // Business info (5)
        businessName || null,
        businessType || null,
        businessDescription || null,
        vendingTimeStart || null,
        vendingTimeEnd || null,
        // Location info (2)
        assignedLocationId || null,
        locationName || null,
      ],
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
 */
export async function getAllVendors(req, res) {
  let connection;
  try {
    connection = await createConnection();

    // Set session timezone to Philippine time
    await connection.execute(`SET time_zone = '+08:00'`);

    // Return all vendors with relations using stored procedure
    const [result] = await connection.execute(
      "CALL getAllVendorsWithRelations()",
    );
    const vendors = result[0] || [];

    // Format date fields to YYYY-MM-DD strings for frontend compatibility
    vendors.forEach((v) => {
      if (v.birthdate) v.birthdate = formatDateForDB(v.birthdate);
      if (v.spouse_birthdate)
        v.spouse_birthdate = formatDateForDB(v.spouse_birthdate);
      if (v.child_birthdate)
        v.child_birthdate = formatDateForDB(v.child_birthdate);
    });

    console.log(`✅ Fetched ${vendors.length} vendors`);

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
      [id],
    );

    const vendor = result[0]?.[0];

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Format date fields to YYYY-MM-DD strings for frontend compatibility
    if (vendor.birthdate) vendor.birthdate = formatDateForDB(vendor.birthdate);
    if (vendor.spouse_birthdate)
      vendor.spouse_birthdate = formatDateForDB(vendor.spouse_birthdate);
    if (vendor.child_birthdate)
      vendor.child_birthdate = formatDateForDB(vendor.child_birthdate);

    console.log(`✅ Fetched vendor: ${vendor.full_name}`);

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
      // Spouse info (full name)
      spouseFullName,
      spouseAge,
      spouseBirthdate,
      spouseEducation,
      spouseContact,
      spouseOccupation,
      // Child info (full name)
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
      assignedLocationId,
      locationName,
    } = req.body;

    connection = await createConnection();

    console.log(`🔄 Updating vendor with relations: ${id}`);

    console.log("📦 Update payload received:", {
      id,
      firstName,
      lastName,
      suffix,
      birthdate,
      spouseFullName,
      spouseAge,
      spouseBirthdate,
      childFullName,
      childAge,
      childBirthdate,
      businessName,
      vendingTimeStart,
      vendingTimeEnd,
      assignedLocationId,
    });

    // Update vendor with all relations using stored procedure (28 params)
    const [updateResult] = await connection.execute(
      `CALL updateVendorWithRelations(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        // Vendor personal info (11)
        firstName,
        lastName,
        middleName || null,
        suffix || null,
        contactNumber || null,
        email || null,
        formatDateForDB(birthdate),
        gender || null,
        address || null,
        vendorIdentifier || null,
        status || "Active",
        // Spouse info (6)
        spouseFullName || null,
        spouseAge || null,
        formatDateForDB(spouseBirthdate),
        spouseEducation || null,
        spouseContact || null,
        spouseOccupation || null,
        // Child info (3)
        childFullName || null,
        childAge || null,
        formatDateForDB(childBirthdate),
        // Business info (5)
        businessName || null,
        businessType || null,
        businessDescription || null,
        vendingTimeStart || null,
        vendingTimeEnd || null,
        // Location info (2)
        assignedLocationId || null,
        locationName || null,
      ],
    );

    console.log("✅ Vendor updated successfully", updateResult[0]?.[0]);

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

    // Delete vendor using stored procedure (soft delete by default)
    await connection.execute("CALL deleteVendorWithRelations(?, ?)", [
      id,
      false, // false = soft delete, true = hard delete
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
