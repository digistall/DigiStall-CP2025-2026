import { createConnection } from '../../../config/database.js'

// Add new stall (for branch managers and employees with stalls permission)
export const addStall = async (req, res) => {
  console.log("🔥 EMPLOYEE STALL CREATION - VERSION 2.4 FIXED");
  console.log("🔍 Request body received:", JSON.stringify(req.body, null, 2));
  
  let connection;
  try {
    // Determine user type and ID
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;
    
    console.log("🔍 ADD STALL DEBUG:");
    console.log("- User Type:", userType);
    console.log("- User ID:", userId);
    console.log("- Full User Object:", JSON.stringify(req.user, null, 2));

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    // Authorization check based on user type
    if (userType === "business_manager") {
      console.log("🔍 Authorizing business manager for stall creation");
    } else if (userType === "business_employee") {
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
          message: "Access denied. Employee does not have stalls permission for creating stalls.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: `Access denied. User type '${userType}' cannot create stalls.`,
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
    const baseRate_final = parseFloat(base_rate || baseRate || 0);
    const areaSqm_final = parseFloat(area_sqm || areaSqm || 0);
    
    // ===== RENTAL CALCULATION FORMULA =====
    // Based on MASTERLIST Excel:
    // RENTAL RATE (2010) = base_rate (input)
    // NEW RATE FOR 2013 = RENTAL RATE (2010) × 2 (monthly rent)
    // DISCOUNTED = NEW RATE FOR 2013 × 0.75 (25% off for early payment)
    // Rate per sq.m = Monthly Rent / Area (sq.m)
    let calculatedRentalPrice;
    let calculatedRatePerSqm = null;
    
    if (baseRate_final > 0) {
      // baseRate is RENTAL RATE (2010), multiply by 2 to get monthly rent
      calculatedRentalPrice = Math.round(baseRate_final * 2 * 100) / 100; // Round to 2 decimals
      const discountedRate = Math.round(calculatedRentalPrice * 0.75 * 100) / 100;
      console.log(`📊 RENTAL RATE 2010: ${baseRate_final}`);
      console.log(`📊 Monthly Rent (×2): ${calculatedRentalPrice}`);
      console.log(`📊 Discounted Rate (early payment): ${calculatedRentalPrice} × 0.75 = ${discountedRate}`);
      
      if (areaSqm_final > 0) {
        calculatedRatePerSqm = Math.round((calculatedRentalPrice / areaSqm_final) * 100) / 100;
        console.log(`📊 Rate per Sq.m: ${calculatedRentalPrice} / ${areaSqm_final} = ${calculatedRatePerSqm}`);
      }
    } else {
      // If no base_rate, use rental_price directly (backward compatibility)
      calculatedRentalPrice = parseFloat(rental_price || price || 0);
    }
    
    // For auction, starting price might be different from rental price
    const finalPrice = priceType_final === "Auction" && startingPrice 
      ? parseFloat(startingPrice) 
      : calculatedRentalPrice;
    
    // Validate deadline for raffle/auction
    let parsedDeadline = null;
    if ((priceType_final === "Raffle" || priceType_final === "Auction")) {
      if (!deadline_final) {
        return res.status(400).json({
          success: false,
          message: `Deadline is required for ${priceType_final} stalls.`
        });
      }
      
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

    console.log("Mapped values:", {
      stallNo_final,
      baseRate_final,
      calculatedRentalPrice,
      areaSqm_final,
      calculatedRatePerSqm,
      location_final,
      floor_id_final,
      section_id_final,
      priceType_final,
      deadline_final: deadline_final || 'Not applicable',
      finalPrice
    });

    // Validation
    let validationErrors = [];
    if (!stallNo_final) validationErrors.push("stallNumber/stallNo");
    if (!finalPrice || finalPrice <= 0) validationErrors.push("price/rental_price/base_rate/startingPrice");
    if (!location_final) validationErrors.push("location/stall_location");
    if (!size) validationErrors.push("size");
    if (!floor_id_final) validationErrors.push("floor_id/floor/floorId");
    if (!section_id_final) validationErrors.push("section_id/section/sectionId");
    
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

    // 🔧 FIXED: Get branch information based on user type - SIMPLIFIED FOR EMPLOYEES
    let branchInfo;
    let managerBranchId;
    let branchName;
    let actualManagerId = null; // Will be set based on user type

    if (userType === "business_manager") {
      // For business managers, get their branch directly
      const businessManagerId = req.user?.businessManagerId || userId;
      
      const [businessManagerInfo] = await connection.execute(
        `SELECT bm.branch_id, b.branch_name, b.area, bm.business_manager_id
         FROM business_manager bm
         INNER JOIN branch b ON bm.branch_id = b.branch_id
         WHERE bm.business_manager_id = ?`,
        [businessManagerId]
      );

      if (!businessManagerInfo || businessManagerInfo.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Business manager not found or not assigned to a branch",
        });
      }

      branchInfo = businessManagerInfo[0];
      managerBranchId = branchInfo.branch_id;
      branchName = branchInfo.branch_name;
      actualManagerId = branchInfo.business_manager_id;
      
    } else if (userType === "business_employee") {
      // 🔧 FIXED: For employees, get branch info differently
      console.log("🔍 Getting employee branch information...");
      
      // Try to get branch ID from token first
      let employeeBranchId = req.user?.branchId || req.user?.branch_id;
      
      // If not in token, get from employee table
      if (!employeeBranchId) {
        console.log("🔍 Branch ID not in token, querying employee table...");
        
        const [employeeRecord] = await connection.execute(
          `SELECT e.branch_id, e.employee_id, e.first_name, e.last_name
           FROM employee e 
           WHERE e.employee_id = ?`,
          [userId]
        );

        if (!employeeRecord || employeeRecord.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Employee record not found in database",
            debug: { userId, userType }
          });
        }

        employeeBranchId = employeeRecord[0].branch_id;
        console.log("🔍 Found employee branch ID from database:", employeeBranchId);
      }
      
      if (!employeeBranchId) {
        return res.status(400).json({
          success: false,
          message: "Employee branch ID not found. Please contact administrator.",
          debug: {
            userId: userId,
            userType: userType,
            tokenBranchId: req.user?.branchId || 'not found',
            tokenBranch_id: req.user?.branch_id || 'not found'
          }
        });
      }

      // Get branch information (business manager is optional for employees)
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
          message: `Branch (ID: ${employeeBranchId}) not found in system`,
        });
      }

      branchInfo = employeeBranchInfo[0];
      managerBranchId = branchInfo.branch_id;
      branchName = branchInfo.branch_name;
      // For employees creating stalls, we can use the business manager ID if available, or null
      actualManagerId = branchInfo.business_manager_id || null;
      
      console.log(`✅ Employee ${userId} authorized to create stalls in branch ${branchName} (ID: ${managerBranchId})`);
    }

    // Validate that the provided floor and section belong to this branch
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
    
    console.log(`Using floor_id ${targetFloorId} (${floorName}) and section_id ${targetSectionId} (${sectionName}) in branch ${branchName}`);

    // Check if stall number already exists in the same section
    const [existingStall] = await connection.execute(
      `SELECT s.stall_id, f.floor_name, sec.section_name
       FROM stall s
       INNER JOIN section sec ON s.section_id = sec.section_id
       INNER JOIN floor f ON sec.floor_id = f.floor_id
       WHERE s.stall_no = ? AND s.section_id = ?`,
      [stallNo_final, targetSectionId]
    );

    if (existingStall.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Stall number ${stallNo_final} already exists in ${existingStall[0].section_name} section on ${existingStall[0].floor_name}. Please choose a different stall number.`,
      });
    }

    // Map frontend fields to database columns
    const stallData = {
      stall_no: stallNo_final,
      stall_location: location_final,
      size: size,
      area_sqm: areaSqm_final > 0 ? areaSqm_final : null,
      floor_id: targetFloorId,
      section_id: targetSectionId,
      base_rate: baseRate_final > 0 ? baseRate_final : null,
      rental_price: finalPrice,
      rate_per_sqm: calculatedRatePerSqm,
      price_type: priceType_final,
      status: isAvailable !== false ? "Available" : "Maintenance",
      stamp: "APPROVED",
      description: description || null,
      stall_image: null, // Images now stored in BLOB storage (stall_images table), not in stall table
      is_available: isAvailable !== false ? 1 : 0,
      raffle_auction_deadline: (priceType_final === "Raffle" || priceType_final === "Auction") ? parsedDeadline : null,
      deadline_active: 0,
      raffle_auction_status: (priceType_final === "Raffle" || priceType_final === "Auction") ? "Not Started" : "Not Started",
      created_by_manager: actualManagerId // Can be null for employee-created stalls
    };

    console.log("Final stall data for insertion:", stallData);

    // Insert new stall (with base_rate, area_sqm, rate_per_sqm for rental calculation)
    const [result] = await connection.execute(
      `INSERT INTO stall (
        stall_no, stall_location, size, area_sqm, floor_id, section_id, 
        base_rate, rental_price, rate_per_sqm, price_type, status, stamp, 
        description, stall_image, is_available, raffle_auction_deadline, 
        deadline_active, raffle_auction_status, created_by_business_manager, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        stallData.stall_no,
        stallData.stall_location,
        stallData.size,
        stallData.area_sqm,
        stallData.floor_id,
        stallData.section_id,
        stallData.base_rate,
        stallData.rental_price,
        stallData.rate_per_sqm,
        stallData.price_type,
        stallData.status,
        stallData.stamp,
        stallData.description,
        stallData.stall_image,
        stallData.is_available,
        stallData.raffle_auction_deadline,
        stallData.deadline_active,
        stallData.raffle_auction_status,
        stallData.created_by_manager,
      ]
    );

    const stallId = result.insertId;
    console.log("✅ Stall created with ID:", stallId);

    // Handle BLOB image uploads if base64Images provided
    if (req.body.base64Images) {
      try {
        const base64Images = JSON.parse(req.body.base64Images)
        console.log(`📸 Processing ${base64Images.length} images for BLOB storage...`)
        
        for (let i = 0; i < base64Images.length; i++) {
          const imgData = base64Images[i]
          const base64Data = imgData.image_data.replace(/^data:image\/\w+;base64,/, '')
          const imageBuffer = Buffer.from(base64Data, 'base64')
          const mimeType = imgData.mime_type || 'image/jpeg'
          const fileName = imgData.file_name || `stall_${stallId}_${Date.now()}_${i}.jpg`
          const imageUrl = `/api/stalls/images/blob/${stallId}/${i + 1}`
          const isPrimary = i === 0 ? 1 : 0
          
          console.log(`  📸 Uploading image ${i + 1}: ${fileName} (${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB)`)
          
          await connection.execute(
            `INSERT INTO stall_images (stall_id, image_url, image_data, mime_type, file_name, display_order, is_primary, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [stallId, imageUrl, imageBuffer, mimeType, fileName, i + 1, isPrimary]
          )
        }
        
        console.log(`✅ ${base64Images.length} images uploaded to BLOB storage`)
      } catch (imgError) {
        console.error('⚠️ Error uploading images to BLOB:', imgError.message)
        // Don't fail the whole operation if images fail
      }
    }

    // Create raffle or auction record if needed
    let additionalInfo = {};
    
    if (priceType_final === "Raffle") {
      const [raffleResult] = await connection.execute(
        `INSERT INTO raffle (
          stall_id, raffle_status, created_by_manager, created_at
        ) VALUES (?, 'Waiting for Participants', ?, NOW())`,
        [stallId, actualManagerId]
      );
      
      additionalInfo.raffleId = raffleResult.insertId;
      console.log("✅ Raffle created with ID:", raffleResult.insertId);
      
    } else if (priceType_final === "Auction") {
      const [auctionResult] = await connection.execute(
        `INSERT INTO auction (
          stall_id, starting_price, auction_status, created_by_manager, created_at
        ) VALUES (?, ?, 'Waiting for Bidders', ?, NOW())`,
        [stallId, finalPrice, actualManagerId]
      );
      
      additionalInfo.auctionId = auctionResult.insertId;
      console.log("✅ Auction created with ID:", auctionResult.insertId);
    }

    let successMessage = `Stall ${stallNo_final} added successfully to ${floorName}, ${sectionName}`;
    if (userType === "employee") {
      successMessage += ` by employee ${userId}`;
    }
    
    if (priceType_final === "Raffle") {
      successMessage += `. Raffle will start when first applicant applies`;
    } else if (priceType_final === "Auction") {
      successMessage += `. Auction will start when first bid is placed`;
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
        created_by_user_type: userType,
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