import { createConnection } from "../../../config/database.js";

// Get all stalls (for landing page) - Uses stored procedure
export const getAllStalls = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();

    // Use stored procedure instead of direct SQL
    const [rows] = await connection.execute('CALL sp_getAllStallsForLanding()');
    const stalls = rows[0]; // First result set from stored procedure

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
        branchLocation: stall.branchLocation,
        price: formattedPrice,
        priceType: stall.price_type, 
        price_type: stall.price_type,
        dimensions: stall.dimensions || "Contact for details",
        floor: stall.floor,
        section: stall.section,
        isAvailable: Boolean(stall.isAvailable),
        description: stall.description || "Perfect for business",
        imageUrl: stall.imageUrl || "stall-image.jpg",
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
