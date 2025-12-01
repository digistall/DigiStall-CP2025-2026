import { createConnection } from '../../../config/database.js'

// Add new stall (for branch managers and employees with stalls permission)
export const addStall = async (req, res) => {
  console.log("🔥 UPDATED ADDSTALL FUNCTION CALLED - VERSION 2.2 with EMPLOYEE SUPPORT");
  console.log("🔍 Request body received:", JSON.stringify(req.body, null, 2));
  let connection;
  try {
    // Determine user type and ID
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;
    
    console.log("🔍 ADD STALL DEBUG:");
    console.log("- User Type:", userType);
    console.log("- User Type (typeof):", typeof userType);
    console.log("- User Type comparison result:", userType === "business_manager");
    console.log("- User ID:", userId);
    console.log("- User Object:", req.user);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    // Authorization check based on user type
    console.log("🔍 BEFORE AUTHORIZATION CHECK - userType:", userType);
    if (userType === "business_manager") {
      console.log("✅ MATCHED: business_manager");
      console.log("✅ MATCHED: business_manager");
      // Business manager authorization
      console.log("🔍 Authorizing business manager for stall creation");
    } else if (userType === "business_employee") {
      console.log("✅ MATCHED: business_employee");
      console.log("✅ MATCHED: business_employee");
      // Employee authorization - check permissions
      const permissions = req.user?.permissions || [];
      const hasStallsPermission = Array.isArray(permissions)
        ? permissions.includes("stalls")
        : permissions.stalls || false;

      console.log("🔍 Employee permission check for stall creation:", {
        permissions,
        hasStallsPermission,
      });

      if (!hasStallsPermission) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Employee does not have stalls permission for creating stalls.",
        });
      }
    } else {
      console.log("❌ NO MATCH - Rejecting user type:", userType);
      return res.status(403).json({
        success: false,
        message: `Access denied. User type '${userType}' cannot create stalls.`,
      });
    }

    console.log("Adding stall for user ID:", userId, "type:", userType);
    console.log("Frontend data received:", req.body);
    console.log("Available fields:", Object.keys(req.body));

    // Map frontend field names to backend field names - be flexible with field names
    const {
      stallNumber,
      stallNo,
      price,
      rental_price,
      floor_id,
      floor,
      floorId,  // Added: Frontend sends 'floorId'
      section_id,
      section,
      sectionId,  // Added: Frontend sends 'sectionId'
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
      // UPDATED: Raffle/Auction deadline fields (replaced duration)
      deadline,  // New: deadline as datetime string
      applicationDeadline, // Alternative field name
      startingPrice // Only for auctions
    } = req.body;

    // Use the mapped values with multiple fallbacks
    const stallNo_final = stallNo || stallNumber;
    const price_final = rental_price || price;
    const location_final = stall_location || location;
    const image_final = stall_image || image;
    const priceType_final = price_type || priceType || "Fixed Price";
    const floor_id_final = floor_id || floor || floorId;  // Updated: Include floorId
    const section_id_final = section_id || section || sectionId;  // Updated: Include sectionId
    
    // UPDATED: Handle deadline for raffle/auction (replaced duration)
    const deadline_final = deadline || applicationDeadline;
    
    // Validate deadline for raffle/auction
    if ((priceType_final === "Raffle" || priceType_final === "Auction") && !deadline_final) {
      return res.status(400).json({
        success: false,
        message: `Deadline is required for ${priceType_final} stalls. Please provide a deadline date and time.`
      });
    }
    
    // Validate deadline format and ensure it's in the future
    let parsedDeadline = null;
    if (deadline_final) {
      parsedDeadline = new Date(deadline_final);
      if (isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid deadline format. Please provide a valid date and time.'
        });
      }
      
      if (parsedDeadline <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Deadline must be in the future.'
        });
      }
    }
    
    // Validate price type
    const validPriceTypes = ["Fixed Price", "Raffle", "Auction"];
    if (!validPriceTypes.includes(priceType_final)) {
      return res.status(400).json({
        success: false,
        message: `Invalid price type. Must be one of: ${validPriceTypes.join(', ')}`
      });
    }
    
    // For auction, starting price might be different from rental price
    const finalPrice = priceType_final === "Auction" && startingPrice 
      ? parseFloat(startingPrice) 
      : parseFloat(price_final);

    // ✅ MOVED: Now log the mapped values AFTER they're declared
    console.log("Mapped values:", {
      stallNo_final,
      price_final, 
      location_final,
      floor_id_final,
      section_id_final,
      priceType_final,
      deadline_final: deadline_final || 'Not applicable',
      finalPrice
    });

    // Updated validation - require deadline for raffle/auction
    let validationErrors = [];
    if (!stallNo_final) validationErrors.push("stallNumber/stallNo");
    if (!finalPrice || finalPrice <= 0) validationErrors.push("price/rental_price/startingPrice");
    if (!location_final) validationErrors.push("location/stall_location");
    if (!size) validationErrors.push("size");
    if (!floor_id_final) validationErrors.push("floor_id/floor/floorId");
    if (!section_id_final) validationErrors.push("section_id/section/sectionId");
    
    // For raffle/auction, deadline is required
    if ((priceType_final === "Raffle" || priceType_final === "Auction") && !deadline_final) {
      validationErrors.push("deadline/applicationDeadline (required for raffle/auction)");
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing or invalid required fields: ${validationErrors.join(', ')}`,
        received: {
          stallNumber: !!stallNumber,
          stallNo: !!stallNo,
          price: !!price,
          rental_price: !!rental_price,
          startingPrice: !!startingPrice,
          location: !!location,
          stall_location: !!stall_location,
          size: !!size,
          floor_id: !!floor_id_final,
          section_id: !!section_id_final,
          priceType: priceType_final,
          deadline: !!deadline_final,
          floorId: !!floorId,
          sectionId: !!sectionId,
        },
        availableFields: Object.keys(req.body),
      });
    }

    connection = await createConnection();

    // Get branch information based on user type
    let branchInfo;
    let managerBranchId;
    let branchName;
    let actualManagerId; // The ID to store in created_by_manager field

    if (userType === "business_manager") {
      // For business managers, get their branch directly
      const businessManagerId = req.user?.businessManagerId || userId;
      
      const [managerInfo] = await connection.execute(
        `SELECT bm.branch_id, b.branch_name, b.area, bm.business_manager_id
         FROM business_manager bm
         INNER JOIN branch b ON bm.branch_id = b.branch_id
         WHERE bm.business_manager_id = ?`,
        [businessManagerId]
      );

      if (!managerInfo || managerInfo.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Business manager not found or not assigned to a branch",
        });
      }

      branchInfo = managerInfo[0];
      managerBranchId = branchInfo.branch_id;
      branchName = branchInfo.branch_name;
      actualManagerId = branchInfo.business_manager_id;
      
    } else if (userType === "business_employee") {
      // For employees, get their branch and find the branch manager
      const employeeBranchId = req.user?.branchId;
      
      if (!employeeBranchId) {
        return res.status(400).json({
          success: false,
          message: "Employee branch ID not found in authentication token",
        });
      }

      const [employeeBranchInfo] = await connection.execute(
        `SELECT b.branch_id, b.branch_name, b.area, bm.business_manager_id
         FROM branch b
         LEFT JOIN business_manager bm ON b.branch_id = bm.branch_id
         WHERE b.branch_id = ?`,
        [employeeBranchId]
      );

      if (!employeeBranchInfo || employeeBranchInfo.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Employee's branch not found",
        });
      }

      branchInfo = employeeBranchInfo[0];
      managerBranchId = branchInfo.branch_id;
      branchName = branchInfo.branch_name;
      // For employees, we still need to record which manager's branch this stall belongs to
      actualManagerId = branchInfo.business_manager_id || null;
    }

    console.log(
      `User ${userId} (${userType}) is creating stall in branch ${managerBranchId} (${branchName})`
    );

    // Validate that the provided floor and section belong to this branch manager's branch
    const [floorSectionCheck] = await connection.execute(
      `SELECT s.section_id, s.section_name, f.floor_id, f.floor_name 
       FROM section s
       INNER JOIN floor f ON s.floor_id = f.floor_id
       WHERE f.branch_id = ? AND f.floor_id = ? AND s.section_id = ?`,
      [managerBranchId, floor_id_final, section_id_final]
    );

    if (!floorSectionCheck || floorSectionCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid floor (${floor_id_final}) or section (${section_id_final}) for branch ${branchName}. Please select a valid floor and section.`,
      });
    }

    const targetFloorId = floorSectionCheck[0].floor_id;
    const targetSectionId = floorSectionCheck[0].section_id;
    const floorName = floorSectionCheck[0].floor_name;
    const sectionName = floorSectionCheck[0].section_name;
    
    console.log(
      `Using floor_id ${targetFloorId} (${floorName}) and section_id ${targetSectionId} (${sectionName}) in branch ${branchName}`
    );

    // Check if stall number already exists in the same section on the same floor
    const [existingStall] = await connection.execute(
      `SELECT s.stall_id, f.floor_name, sec.section_name
       FROM stall s
       INNER JOIN section sec ON s.section_id = sec.section_id
       INNER JOIN floor f ON sec.floor_id = f.floor_id
       WHERE s.stall_no = ? AND s.section_id = ?`,
      [stallNo_final, targetSectionId]
    );

    if (existingStall.length > 0) {
      console.log("🚨 STALL DUPLICATE CHECK - SECTION-BASED LOGIC");
      console.log("Existing stall found:", existingStall);
      console.log("Checking stall_no:", stallNo_final, "in section_id:", targetSectionId);
      return res.status(400).json({
        success: false,
        message: `Stall number ${stallNo_final} already exists in ${existingStall[0].section_name} section on ${existingStall[0].floor_name}. Please choose a different stall number for this section.`,
      });
    }

    // Map frontend fields to database columns
    const stallData = {
      stall_no: stallNo_final,
      stall_location: location_final,
      size: size,
      floor_id: targetFloorId,
      section_id: targetSectionId,
      rental_price: finalPrice,
      price_type: priceType_final,
      status: isAvailable !== false ? "Active" : "Inactive",
      stamp: "APPROVED",
      description: description || null,
      stall_image: image_final || null,
      is_available: isAvailable !== false ? 1 : 0,
      // UPDATED: Raffle/Auction deadline fields (replaced duration)
      raffle_auction_deadline: (priceType_final === "Raffle" || priceType_final === "Auction") ? parsedDeadline : null,
      deadline_active: 0, // Initially false, will be activated when first applicant applies
      raffle_auction_status: (priceType_final === "Raffle" || priceType_final === "Auction") ? "Not Started" : "Not Started",
      created_by_business_manager: actualManagerId // Use the actual manager ID, which works for both business managers and employees
    };

    console.log("Mapped database data:", stallData);

    // Use stored procedure to insert stall
    const [spResult] = await connection.execute(
      `CALL sp_addStall(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @stall_id, @success, @message)`,
      [
        stallData.stall_no,
        stallData.stall_location,
        stallData.size,
        stallData.floor_id,
        stallData.section_id,
        stallData.rental_price,
        stallData.price_type,
        stallData.status,
        stallData.stamp,
        stallData.description,
        stallData.stall_image,
        stallData.is_available,
        stallData.raffle_auction_deadline,
        stallData.created_by_business_manager,
      ]
    );

    // Get the output parameters
    const [outParams] = await connection.execute(
      `SELECT @stall_id as stall_id, @success as success, @message as message`
    );

    const { stall_id: stallId, success, message } = outParams[0];

    if (!success) {
      return res.status(400).json({
        success: false,
        message: message || 'Failed to add stall'
      });
    }

    console.log("✅ Stall created with ID:", stallId);

    // Additional info for response
    let additionalInfo = {};
    
    if (priceType_final === "Raffle") {
      additionalInfo.priceTypeInfo = 'Raffle created';
    } else if (priceType_final === "Auction") {
      additionalInfo.priceTypeInfo = 'Auction created';
    }

    let successMessage = `Stall ${stallNo_final} added successfully to ${floorName}, ${sectionName}`;
    
    if (priceType_final === "Raffle") {
      successMessage += `. Raffle will start when first applicant applies (Deadline: ${deadline_final})`;
    } else if (priceType_final === "Auction") {
      successMessage += `. Auction will start when first bid is placed (Deadline: ${deadline_final}, Starting: ₱${finalPrice})`;
    }

    res.status(201).json({
      success: true,
      message: successMessage,
      data: {
        id: stallId,
        ...stallData,
        floor_name: floorName,
        section_name: sectionName,
        branch_name: branchName,
        ...additionalInfo
      },
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