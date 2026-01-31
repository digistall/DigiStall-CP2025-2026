import { createConnection } from "../../../../../CONFIG/database.js";

// Get all stalls (for landing page)
export const getAllStalls = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();

    const [stalls] = await connection.execute(`
      SELECT 
        s.stall_id as id,
        s.stall_number as stallNumber,
        s.stall_location as location,
        s.size as dimensions,
        s.rental_price,
        s.price_type,
        s.status,
        s.description,
        si.image_id as imageId,
        s.is_available as isAvailable,
        sec.section_name as section,
        f.floor_name as floor,
        b.branch_name as branch
      FROM stall s
      LEFT JOIN section sec ON s.section_id = sec.section_id
      LEFT JOIN floor f ON s.floor_id = f.floor_id
      LEFT JOIN branch b ON f.branch_id = b.branch_id
      LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
      WHERE s.status = 'Available' AND s.is_available = 1
      ORDER BY s.created_at DESC
    `);

    console.log(`🔍 Raw stalls from database:`, stalls.length);
    if (stalls.length > 0) {
      console.log(`🔍 First stall sample:`, stalls[0]);
    }

    // Format stalls to match the expected frontend response structure
    const formattedStalls = stalls.map((stall) => {
      // Safely format the price
      let formattedPrice = "Contact for pricing";
      if (
        stall.rental_price !== null &&
        stall.rental_price !== undefined &&
        !isNaN(stall.rental_price)
      ) {
        const price = parseFloat(stall.rental_price);
        if (price > 0) {
          formattedPrice = `₱${price.toLocaleString("en-PH", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}/month`;
        }
      }

      return {
        id: stall.id,
        stallNumber: stall.stallNumber,
        branch: stall.branch,
        price: formattedPrice,
        dimensions: stall.dimensions || "Contact for details",
        floor: stall.floor,
        section: stall.section,
        isAvailable: Boolean(stall.isAvailable),
        description: stall.description || "Perfect for business",
        imageUrl: stall.imageId ? `/api/stalls/images/blob/id/${stall.imageId}` : null,
      };
    });

    console.log(`🔍 Formatted stalls count:`, formattedStalls.length);
    if (formattedStalls.length > 0) {
      console.log(`🔍 First formatted stall:`, formattedStalls[0]);
    }

    res.json({
      success: true,
      message: "Available stalls retrieved successfully",
      data: formattedStalls,
    });
  } catch (error) {
    console.error("❌ Get stalls error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve stalls",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};

