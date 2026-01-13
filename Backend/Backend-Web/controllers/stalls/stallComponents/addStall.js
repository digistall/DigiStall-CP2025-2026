import { createConnection } from '../../../config/database.js'

// Add new stall using direct SQL (no stored procedure dependency)
export const addStall = async (req, res) => {
  let connection;
  try {
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;
    const branchId = req.user?.branchId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    // Map frontend field names to backend field names
    const {
      stallNumber,
      stallNo,
      price,
      rental_price,
      base_rate,
      baseRate,
      area_sqm,
      areaSqm,
      floor_id,
      floor,
      floorId,
      section_id,
      section,
      sectionId,
      size,
      location,
      stall_location,
      description,
      image,
      stall_image,
      isAvailable = true,
      status,
      priceType = "Fixed Price",
      price_type,
      deadline,
      applicationDeadline,
      startingPrice
    } = req.body;

    // Use the mapped values with multiple fallbacks
    const stallNo_final = stallNo || stallNumber;
    const location_final = stall_location || location;
    const image_final = stall_image || image;
    const priceType_final = price_type || priceType || "Fixed Price";
    const floor_id_final = floor_id || floor || floorId;
    const section_id_final = section_id || section || sectionId;
    const deadline_final = deadline || applicationDeadline;
    const parsedDeadline = deadline_final ? new Date(deadline_final) : null;
    
    // NEW: Rental calculation fields
    const baseRate_final = parseFloat(base_rate || baseRate || 0);
    const areaSqm_final = parseFloat(area_sqm || areaSqm || 0);
    
    // Calculate rental price and rate per sqm
    // Formula: Monthly Rent = RENTAL RATE (2010) × 2
    let calculatedRentalPrice;
    let calculatedRatePerSqm = null;
    
    if (baseRate_final > 0) {
      calculatedRentalPrice = Math.round(baseRate_final * 2 * 100) / 100;
      if (areaSqm_final > 0) {
        calculatedRatePerSqm = Math.round((calculatedRentalPrice / areaSqm_final) * 100) / 100;
      }
      console.log(`📊 RENTAL RATE 2010: ${baseRate_final} | Monthly Rent (×2): ${calculatedRentalPrice} | Rate/sqm: ${calculatedRatePerSqm}`);
    } else {
      calculatedRentalPrice = parseFloat(rental_price || price || 0);
    }
    
    const finalPrice = priceType_final === "Auction" && startingPrice 
      ? parseFloat(startingPrice) 
      : calculatedRentalPrice;

    connection = await createConnection();

    // Authorization check
    let businessManagerId = null;
    
    if (userType === "business_manager") {
      // Verify manager belongs to this branch
      const [managerCheck] = await connection.execute(
        `SELECT business_manager_id FROM business_manager WHERE business_manager_id = ? AND branch_id = ?`,
        [userId, branchId]
      );
      
      if (managerCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Manager does not belong to this branch'
        });
      }
      businessManagerId = userId;
      
    } else if (userType === "business_employee") {
      // Get manager for this branch
      const [managerInfo] = await connection.execute(
        `SELECT business_manager_id FROM business_manager WHERE branch_id = ? LIMIT 1`,
        [branchId]
      );
      
      if (managerInfo.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Branch does not have an assigned manager'
        });
      }
      businessManagerId = managerInfo[0].business_manager_id;
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied. User type '${userType}' cannot create stalls`
      });
    }

    // Validate floor and section belong to the branch
    const [floorSectionCheck] = await connection.execute(
      `SELECT f.floor_name, sec.section_name 
       FROM section sec
       INNER JOIN floor f ON sec.floor_id = f.floor_id
       WHERE sec.section_id = ? AND f.floor_id = ? AND f.branch_id = ?`,
      [section_id_final, floor_id_final, branchId]
    );

    if (floorSectionCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid floor or section for your branch`
      });
    }

    const { floor_name, section_name } = floorSectionCheck[0];

    // Check for duplicate stall number in section
    const [duplicateCheck] = await connection.execute(
      `SELECT stall_id FROM stall WHERE stall_no = ? AND section_id = ?`,
      [stallNo_final, section_id_final]
    );

    if (duplicateCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Stall number ${stallNo_final} already exists in ${section_name} section`
      });
    }

    // Insert the stall with rental calculation fields
    const [insertResult] = await connection.execute(
      `INSERT INTO stall (
        stall_no, 
        stall_location, 
        size, 
        area_sqm,
        floor_id, 
        section_id, 
        rental_price,
        base_rate,
        rate_per_sqm,
        price_type, 
        status, 
        stamp, 
        description, 
        is_available,
        raffle_auction_deadline,
        deadline_active,
        raffle_auction_status,
        created_by_business_manager,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        stallNo_final,
        location_final,
        size,
        areaSqm_final || null,
        floor_id_final,
        section_id_final,
        finalPrice,
        baseRate_final || null,
        calculatedRatePerSqm,
        priceType_final,
        isAvailable !== false ? "Active" : "Inactive",
        "APPROVED",
        description || null,
        isAvailable !== false ? 1 : 0,
        parsedDeadline,
        0,
        priceType_final === 'Raffle' || priceType_final === 'Auction' ? 'Not Started' : null,
        businessManagerId
      ]
    );

    const stallId = insertResult.insertId;

    // Fetch the complete stall data
    const [stallData] = await connection.execute(
      `SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
        s.area_sqm,
        s.base_rate,
        s.rate_per_sqm,
        s.floor_id,
        s.section_id,
        s.rental_price,
        s.price_type,
        s.status,
        s.description,
        s.is_available,
        s.raffle_auction_deadline,
        s.created_at,
        s.updated_at,
        f.floor_name,
        f.floor_number,
        sec.section_name,
        b.location as branch_location,
        b.area,
        bm.first_name as manager_first_name,
        bm.last_name as manager_last_name
      FROM stall s
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON s.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
      LEFT JOIN business_manager bm ON b.branch_id = bm.branch_id
      WHERE s.stall_id = ?`,
      [stallId]
    );

    res.status(201).json({
      success: true,
      message: `Stall ${stallNo_final} created successfully in ${section_name} section on ${floor_name}`,
      data: stallData[0] || { id: stallId }
    });

  } catch (error) {
    console.error("❌ Add stall error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add stall",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};