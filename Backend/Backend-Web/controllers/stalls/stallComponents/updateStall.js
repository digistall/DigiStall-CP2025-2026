import { createConnection } from '../../../config/database.js'

// Update stall using direct SQL (no stored procedure dependency)
export const updateStall = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;
    const branchId = req.user?.branchId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    connection = await createConnection();

    // Prepare parameters with proper null handling
    const stallNo = updateData.stall_no || updateData.stallNo || null;
    const stallLocation = updateData.stall_location || updateData.location || null;
    const size = updateData.size || null;
    const floorId = updateData.floor_id || updateData.floorId || null;
    const sectionId = updateData.section_id || updateData.sectionId || null;
    const priceType = updateData.price_type || updateData.priceType || "Fixed Price";
    const status = updateData.status || "Active";
    const description = updateData.description || null;
    const stallImage = updateData.stall_image || updateData.image || null;
    
    // NEW: Rental calculation fields
    const baseRate = parseFloat(updateData.base_rate || updateData.baseRate || 0);
    const areaSqm = parseFloat(updateData.area_sqm || updateData.areaSqm || 0);
    
    // Calculate rental price and rate per sqm
    // Formula: Monthly Rent = RENTAL RATE (2010) × 2
    let rentalPrice;
    let ratePerSqm = null;
    
    if (baseRate > 0) {
      rentalPrice = Math.round(baseRate * 2 * 100) / 100;
      if (areaSqm > 0) {
        ratePerSqm = Math.round((rentalPrice / areaSqm) * 100) / 100;
      }
      console.log(`📊 RENTAL RATE 2010: ${baseRate} | Monthly Rent (×2): ${rentalPrice} | Rate/sqm: ${ratePerSqm}`);
    } else {
      rentalPrice = parseFloat(updateData.rental_price || updateData.price || 0) || null;
    }
    
    // Handle is_available with multiple possible field names and proper boolean conversion
    let isAvailable = 1; // Default to available
    if (updateData.is_available !== undefined) {
      isAvailable = updateData.is_available ? 1 : 0;
    } else if (updateData.isAvailable !== undefined) {
      isAvailable = updateData.isAvailable ? 1 : 0;
    }
    const deadline = updateData.raffle_auction_deadline || updateData.deadline;
    const parsedDeadline = deadline ? new Date(deadline) : null;

    console.log('📝 Update stall params:', {
      id, stallNo, stallLocation, size, floorId, sectionId, 
      rentalPrice, baseRate, areaSqm, ratePerSqm, priceType, status, description, isAvailable
    });

    // Get the branch the stall belongs to
    const [stallBranch] = await connection.execute(
      `SELECT f.branch_id 
       FROM stall s
       INNER JOIN section sec ON s.section_id = sec.section_id
       INNER JOIN floor f ON sec.floor_id = f.floor_id
       WHERE s.stall_id = ?`,
      [id]
    );

    if (stallBranch.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      });
    }

    const existingBranchId = stallBranch[0].branch_id;

    // Authorization check
    if (userType === 'business_manager') {
      const [managerCheck] = await connection.execute(
        `SELECT business_manager_id FROM business_manager WHERE business_manager_id = ? AND branch_id = ?`,
        [userId, branchId]
      );
      
      if (managerCheck.length === 0 || branchId !== existingBranchId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not manage this branch or stall'
        });
      }
    } else if (userType === 'business_employee') {
      if (branchId !== existingBranchId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Stall does not belong to your branch'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied. User type '${userType}' cannot update stalls`
      });
    }

    // Check for duplicate stall number
    const [duplicateCheck] = await connection.execute(
      `SELECT stall_id FROM stall WHERE stall_no = ? AND section_id = ? AND stall_id != ?`,
      [stallNo, sectionId, id]
    );

    if (duplicateCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Stall number ${stallNo} already exists in this section`
      });
    }

    // Update the stall with rental calculation fields
    await connection.execute(
      `UPDATE stall SET
        stall_no = ?,
        stall_location = ?,
        size = ?,
        area_sqm = ?,
        floor_id = ?,
        section_id = ?,
        rental_price = ?,
        base_rate = ?,
        rate_per_sqm = ?,
        price_type = ?,
        status = ?,
        description = ?,
        is_available = ?,
        raffle_auction_deadline = ?,
        updated_at = NOW()
      WHERE stall_id = ?`,
      [
        stallNo,
        stallLocation,
        size,
        areaSqm || null,
        floorId,
        sectionId,
        rentalPrice,
        baseRate || null,
        ratePerSqm,
        priceType,
        status,
        description,
        isAvailable,
        parsedDeadline,
        id
      ]
    );

    // Fetch the updated stall data
    const [updatedStall] = await connection.execute(
      `SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
        s.area_sqm,
        s.base_rate,
        s.rate_per_sqm,
        s.floor_id,
        f.floor_name,
        s.section_id,
        sec.section_name,
        s.rental_price,
        s.price_type,
        s.status,
        s.stamp,
        s.description,
        si.image_url as stall_image,
        s.is_available,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        s.created_by_business_manager,
        s.created_at,
        s.updated_at,
        b.branch_id,
        b.branch_name,
        b.area,
        CASE 
          WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
          WHEN s.is_available = 1 THEN 'Available'
          ELSE 'Unavailable'
        END as availability_status,
        sh.stallholder_id,
        sh.stallholder_name
      FROM stall s
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON s.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
      LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
      LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
      WHERE s.stall_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Stall updated successfully',
      data: updatedStall[0]
    });

  } catch (error) {
    console.error("❌ Update stall error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stall",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};
