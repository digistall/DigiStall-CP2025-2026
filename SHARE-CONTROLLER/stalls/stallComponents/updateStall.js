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
    
    // Map frontend status values to database ENUM values
    let status = updateData.status || "Active";
    if (status === "Active") {
      status = "Available";
    } else if (status === "Inactive") {
      status = "Maintenance";
    }
    
    const description = updateData.description || null;
    const stallImage = updateData.stall_image || updateData.image || null;
    
    // NEW: Rental calculation fields
    const baseRate = parseFloat(updateData.base_rate || updateData.baseRate || 0);
    const areaSqm = parseFloat(updateData.area_sqm || updateData.areaSqm || 0);
    
    // Calculate rental price and rate per sqm
    // Formula: Monthly Rent = RENTAL RATE (2010) � 2
    let rentalPrice;
    let ratePerSqm = null;
    
    if (baseRate > 0) {
      rentalPrice = Math.round(baseRate * 2 * 100) / 100;
      if (areaSqm > 0) {
        ratePerSqm = Math.round((rentalPrice / areaSqm) * 100) / 100;
      }
      console.log(`?? RENTAL RATE 2010: ${baseRate} | Monthly Rent (�2): ${rentalPrice} | Rate/sqm: ${ratePerSqm}`);
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

    console.log('?? Update stall params:', {
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
      `SELECT stall_id FROM stall WHERE stall_number = ? AND section_id = ? AND stall_id != ?`,
      [stallNo, sectionId, id]
    );

    if (duplicateCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Stall number ${stallNo} already exists in this section`
      });
    }

    // Build dynamic UPDATE query - only update floor_id/section_id if provided
    const updates = [];
    const values = [];
    
    updates.push('stall_number = ?');
    values.push(stallNo);
    
    updates.push('stall_location = ?');
    values.push(stallLocation);
    
    updates.push('size = ?');
    values.push(size);
    
    updates.push('area_sqm = ?');
    values.push(areaSqm || null);
    
    // Only update floor_id if provided
    if (floorId !== null && floorId !== undefined) {
      updates.push('floor_id = ?');
      values.push(floorId);
    }
    
    // Only update section_id if provided
    if (sectionId !== null && sectionId !== undefined) {
      updates.push('section_id = ?');
      values.push(sectionId);
    }
    
    updates.push('rental_price = ?');
    values.push(rentalPrice);
    
    updates.push('base_rate = ?');
    values.push(baseRate || null);
    
    updates.push('rate_per_sqm = ?');
    values.push(ratePerSqm);
    
    updates.push('price_type = ?');
    values.push(priceType);
    
    updates.push('status = ?');
    values.push(status);
    
    updates.push('description = ?');
    values.push(description);
    
    updates.push('is_available = ?');
    values.push(isAvailable);
    
    updates.push('raffle_auction_deadline = ?');
    values.push(parsedDeadline);
    
    updates.push('updated_at = NOW()');
    
    values.push(id);
    
    // Update the stall with rental calculation fields
    await connection.execute(
      `UPDATE stall SET ${updates.join(', ')} WHERE stall_id = ?`,
      values
    );

    // Fetch the updated stall data
    const [updatedStall] = await connection.execute(
      `SELECT 
        s.stall_id,
        s.stall_number,
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
        CONCAT(sh.first_name, ' ', sh.last_name) as stallholder_name
      FROM stall s
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON s.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
      LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.status = 'Active'
      WHERE s.stall_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Stall updated successfully',
      data: updatedStall[0]
    });

  } catch (error) {
    console.error("? Update stall error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stall",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};

