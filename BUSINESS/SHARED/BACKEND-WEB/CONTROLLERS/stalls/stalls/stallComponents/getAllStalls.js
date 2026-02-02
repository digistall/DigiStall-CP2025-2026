import { createConnection } from '../../../config/database.js'
import { decryptData } from '../../../services/encryptionService.js'

// Get all stalls using stored procedure
export const getAllStalls = async (req, res) => {
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

    connection = await createConnection();

    // Direct query using actual stall table columns
    const [stalls] = await connection.execute(
      `SELECT 
        s.stall_id,
        s.stall_number,
        s.stall_name,
        s.stall_type,
        s.stall_size,
        s.stall_location,
        s.size,
        s.area_sqm,
        s.floor_id,
        s.section_id,
        s.monthly_rent,
        s.rental_price,
        s.base_rate,
        s.rate_per_sqm,
        s.status,
        s.stamp,
        s.description,
        s.price_type,
        s.is_available,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        s.branch_id,
        sh.stallholder_id as stallholder_id,
        s.floor_level,
        s.section,
        s.amenities,
        s.created_at,
        s.updated_at,
        b.branch_name,
        b.location as branch_location,
        f.floor_name,
        f.floor_number,
        sec.section_name,
        si.image_id as primary_image_id,
        sh.full_name as stallholder_name,
        sh.stallholder_id as linked_stallholder_id,
        sh.status as stallholder_status,
        CASE
          WHEN sh.stallholder_id IS NOT NULL THEN 'Occupied'
          WHEN s.status = 'MAINTENANCE' THEN 'Maintenance'
          WHEN s.is_available = 1 OR s.status = 'VACANT' THEN 'Available'
          ELSE 'Unavailable'
        END as availability_status
      FROM stall s
      LEFT JOIN branch b ON s.branch_id = b.branch_id
      LEFT JOIN floor f ON s.floor_id = f.floor_id
      LEFT JOIN section sec ON s.section_id = sec.section_id
      LEFT JOIN stallholder sh ON sh.stall_id = s.stall_id
      LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
      WHERE s.branch_id = ?
      ORDER BY s.created_at DESC`,
      [branchId]
    );

    // Backend-level decryption for stallholder names
    const decryptedStalls = stalls.map(stall => {
      // Add image URL if image exists
      if (stall.primary_image_id) {
        stall.stall_image = `/api/stalls/images/blob/id/${stall.primary_image_id}`;
      }
      
      // Decrypt stallholder name if encrypted
      if (stall.stallholder_name && typeof stall.stallholder_name === 'string' && stall.stallholder_name.includes(':')) {
        try {
          stall.stallholder_name = decryptData(stall.stallholder_name);
        } catch (error) {
          console.error(`Failed to decrypt stallholder name for stall ${stall.stall_id}:`, error.message);
        }
      }
      
      return stall;
    });

    console.log(`? Retrieved ${decryptedStalls.length} stalls for branch ${branchId}`);

    res.json({
      success: true,
      message: "Stalls retrieved successfully",
      data: decryptedStalls,
      count: decryptedStalls.length,
    });

  } catch (error) {
    console.error("? Get all stalls error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve stalls",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};

