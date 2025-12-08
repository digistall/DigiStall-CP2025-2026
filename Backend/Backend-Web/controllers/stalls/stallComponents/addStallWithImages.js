import { createConnection } from '../../../config/database.js'
import path from 'path'
import fs from 'fs'

// Base upload directory (configurable via environment variable for Docker)
const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR_STALLS || 'C:/xampp/htdocs/digistall_uploads/stalls'

/**
 * Add new stall with multi-image upload support
 * This replaces the old single-image approach
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
    const price_final = rental_price || price;
    const location_final = stall_location || location;
    const priceType_final = price_type || priceType || "Fixed Price";
    const floor_id_final = floor_id || floor || floorId;
    const section_id_final = section_id || section || sectionId;
    const deadline_final = deadline || applicationDeadline;
    const finalPrice = priceType_final === "Auction" && startingPrice 
      ? parseFloat(startingPrice) 
      : parseFloat(price_final);
    const parsedDeadline = deadline_final ? new Date(deadline_final) : null;

    connection = await createConnection();

    console.log('🔍 Calling sp_addStall_complete with params:', {
      stallNo_final,
      location_final,
      size,
      floor_id_final,
      section_id_final,
      finalPrice,
      priceType_final,
      status: isAvailable !== false ? "Active" : "Inactive",
      userId,
      userType,
      branchId
    });

    // 1. Create stall record first (without image)
    const [result] = await connection.execute(
      `CALL sp_addStall_complete(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, @stall_id, @success, @message)`,
      [
        stallNo_final,
        location_final,
        size,
        floor_id_final,
        section_id_final,
        finalPrice,
        priceType_final,
        isAvailable !== false ? "Active" : "Inactive",
        "APPROVED",
        description || null,
        // NULL for image - we'll add via stall_images table
        isAvailable !== false ? 1 : 0,
        parsedDeadline,
        userId,
        userType,
        branchId
      ]
    );

    // Get the created stall ID
    const [outParams] = await connection.execute(
      `SELECT @stall_id as stall_id, @success as success, @message as message`
    );

    const { stall_id: stallId, success, message } = outParams[0];

    console.log('📊 Stored procedure result:', { stallId, success, message });

    if (!success) {
      console.error('❌ Stored procedure failed:', message);
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    // 2. Handle image uploads if files exist
    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      // Get branch_id for folder structure
      const [branchInfo] = await connection.execute(
        `SELECT b.branch_id 
         FROM stall s
         INNER JOIN section sec ON s.section_id = sec.section_id
         INNER JOIN floor f ON sec.floor_id = f.floor_id
         INNER JOIN branch b ON f.branch_id = b.branch_id
         WHERE s.stall_id = ?`,
        [stallId]
      );

      if (branchInfo.length === 0) {
        throw new Error('Could not determine branch for stall');
      }

      const stallBranchId = branchInfo[0].branch_id;
      
      // Create upload directory
      const uploadPath = path.join(BASE_UPLOAD_DIR, String(stallBranchId), String(stallNo_final));
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
        const imageUrl = `/digistall_uploads/stalls/${stallBranchId}/${stallNo_final}/${fileName}`;
        
        // Insert into stall_images table
        // First image (i=0) is set as primary, others are non-primary
        // The stored procedure sp_addStallImage handles this automatically:
        // - First image for a stall is always set as primary
        // - Subsequent images are non-primary unless explicitly requested
        await connection.execute(
          `CALL sp_addStallImage(?, ?, ?)`,
          [stallId, imageUrl, i === 0 ? 1 : 0] // First image is primary
        );
        
        uploadedImages.push(imageUrl);
        console.log(`✅ Added image ${i + 1}: ${imageUrl} (primary: ${i === 0})`);
      }
    }

    // 3. Fetch complete stall data with primary image
    const [stallData] = await connection.execute(
      `SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
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
      message: `Stall created successfully${uploadedImages.length > 0 ? ` with ${uploadedImages.length} image(s)` : ''}`,
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
