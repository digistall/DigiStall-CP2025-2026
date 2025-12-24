import { createConnection } from '../../../config/database.js'
import path from 'path'
import fs from 'fs'

// Base upload directory (configurable via environment variable for Docker)
const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR_STALLS || 'C:/xampp/htdocs/digistall_uploads/stalls'

/**
 * Add new stall with multi-image upload support
 * Uses direct SQL instead of stored procedure for flexibility
 */
export const addStallWithImages = async (req, res) => {
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

    // Extract stall data from request body
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
      isAvailable = true,
      status,
      priceType = "Fixed Price",
      price_type,
      deadline,
      applicationDeadline,
      startingPrice
    } = req.body;

    // Map frontend fields to backend
    const stallNo_final = stallNo || stallNumber;
    const location_final = stall_location || location;
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

    console.log('🔍 Creating stall with params:', {
      stallNo_final,
      location_final,
      size,
      areaSqm_final,
      floor_id_final,
      section_id_final,
      finalPrice,
      baseRate_final,
      calculatedRatePerSqm,
      priceType_final,
      status: isAvailable !== false ? "Active" : "Inactive",
      userId,
      userType,
      branchId
    });

    // 1. Create stall record using direct SQL
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

    console.log('📊 Stall created with ID:', stallId);

    // 2. Handle image uploads if files exist OR if base64 images are provided
    const uploadedImages = [];
    
    // Check for base64 images in request body (BLOB storage for cloud deployment)
    const base64Images = req.body.base64Images ? JSON.parse(req.body.base64Images) : null;
    
    if (base64Images && Array.isArray(base64Images) && base64Images.length > 0) {
      // BLOB Storage: Store images as binary data in database
      console.log(`📸 Processing ${base64Images.length} base64 images for BLOB storage...`);
      
      for (let i = 0; i < base64Images.length && i < 10; i++) {
        const imgData = base64Images[i];
        const base64String = imgData.image_data.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64String, 'base64');
        const mimeType = imgData.mime_type || 'image/jpeg';
        const fileName = imgData.file_name || `stall_${stallId}_${i + 1}.${mimeType === 'image/png' ? 'png' : 'jpg'}`;
        const displayOrder = i + 1;
        const imageUrl = `/api/stalls/images/blob/${stallId}/${displayOrder}`;
        
        // Insert into stall_images with BLOB data
        await connection.execute(
          `INSERT INTO stall_images (stall_id, image_url, image_data, mime_type, file_name, display_order, is_primary, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [stallId, imageUrl, imageBuffer, mimeType, fileName, displayOrder, i === 0 ? 1 : 0]
        );
        
        uploadedImages.push({
          url: imageUrl,
          file_name: fileName,
          display_order: displayOrder,
          is_primary: i === 0
        });
        console.log(`✅ Added BLOB image ${i + 1}: ${fileName} (primary: ${i === 0})`);
      }
    } else if (req.files && req.files.length > 0) {
      // Legacy file-based storage (for local development)
      // Create upload directory
      const uploadPath = path.join(BASE_UPLOAD_DIR, String(branchId), String(stallNo_final));
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      // Save each uploaded file and insert into stall_images
      for (let i = 0; i < req.files.length && i < 10; i++) {
        const file = req.files[i];
        const fileExt = path.extname(file.originalname);
        const fileName = `${i + 1}${fileExt}`;
        const filePath = path.join(uploadPath, fileName);
        
        // Move file from temp location to final destination
        fs.renameSync(file.path, filePath);
        
        // Generate URL
        const imageUrl = `/digistall_uploads/stalls/${branchId}/${stallNo_final}/${fileName}`;
        
        // Insert into stall_images table
        await connection.execute(
          `INSERT INTO stall_images (stall_id, image_url, display_order, is_primary, created_at) VALUES (?, ?, ?, ?, NOW())`,
          [stallId, imageUrl, i + 1, i === 0 ? 1 : 0]
        );
        
        uploadedImages.push({ url: imageUrl, is_primary: i === 0 });
        console.log(`✅ Added file image ${i + 1}: ${imageUrl} (primary: ${i === 0})`);
      }
    }

    // 3. Fetch complete stall data with primary image
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
        si.image_url as stall_image,
        s.is_available,
        s.raffle_auction_deadline,
        s.created_at,
        s.updated_at,
        f.floor_name,
        f.floor_number,
        sec.section_name,
        b.branch_id,
        b.location as branch_location,
        b.area,
        bm.first_name as manager_first_name,
        bm.last_name as manager_last_name
      FROM stall s
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON s.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
      LEFT JOIN business_manager bm ON b.branch_id = bm.branch_id
      LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
      WHERE s.stall_id = ?`,
      [stallId]
    );

    res.status(201).json({
      success: true,
      message: `Stall ${stallNo_final} created successfully in ${section_name} section on ${floor_name}${uploadedImages.length > 0 ? ` with ${uploadedImages.length} image(s)` : ''}`,
      data: {
        ...stallData[0],
        uploaded_images: uploadedImages
      }
    });

  } catch (error) {
    console.error("❌ Add stall with images error:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      success: false,
      message: "Failed to add stall",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};
