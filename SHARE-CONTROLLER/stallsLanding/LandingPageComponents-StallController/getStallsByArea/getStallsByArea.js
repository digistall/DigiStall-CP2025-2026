import { createConnection } from "../../../config/database.js";

// Get stalls by area or branch (supports both for backward compatibility) - Uses stored procedure
export const getStallsByArea = async (req, res) => {
  let connection;
  try {
    const { area, branch } = req.query;

    // Support both branch (new) and area (legacy) parameters
    const filterParam = branch || area;
    const filterType = branch ? "branch" : "area";
    const filterByBranch = branch ? true : false;

    if (!filterParam) {
      return res.status(400).json({
        success: false,
        message: "Area or branch parameter is required",
      });
    }

    connection = await createConnection();

    // Use stored procedure instead of direct SQL
    const [rows] = await connection.execute('CALL sp_getStallsByAreaOrBranch(?, ?)', [filterParam, filterByBranch]);
    const stalls = rows[0]; // First result set from stored procedure

    // Debug logging to see what we get from database
    console.log(
      `🔍 Debug: Raw stalls from DB for ${filterParam}:`,
      stalls.slice(0, 3).map((s) => ({
        stallNumber: s.stallNumber,
        price_type: s.price_type,
        raw_price_type: typeof s.price_type,
        all_fields: Object.keys(s),
      }))
    );

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
          formattedPrice = `₱${price.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}/month`;
        }
      }

      return {
        id: stall.id,
        stallNumber: stall.stallNumber,
        branch: stall.branch,
        branchId: stall.branchId,
        branchLocation: stall.branchLocation,
        price: formattedPrice,
        price_type: stall.price_type,
        dimensions: stall.dimensions || "Contact for details",
        floor: stall.floor,
        section: stall.section,
        isAvailable: Boolean(stall.isAvailable),
        description: stall.description || "Perfect for business",
        imageUrl: stall.imageUrl || "stall-image.jpg",
      };
    });

    // Debug logging to see formatted output
    console.log(
      `🔍 Debug: Formatted stalls for ${filterParam}:`,
      formattedStalls.slice(0, 3).map((s) => ({
        stallNumber: s.stallNumber,
        price_type: s.price_type,
        has_price_type: s.hasOwnProperty("price_type"),
        all_keys: Object.keys(s),
      }))
    );

    console.log(
      `✅ Found ${formattedStalls.length} stalls in ${filterType} '${filterParam}'`
    );

    res.json({
      success: true,
      message: `Stalls in ${filterParam} retrieved successfully`,
      data: formattedStalls,
      [filterType]: filterParam, // Include the filter parameter in response
    });
  } catch (error) {
    console.error("❌ Get stalls by area/branch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve stalls",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};

