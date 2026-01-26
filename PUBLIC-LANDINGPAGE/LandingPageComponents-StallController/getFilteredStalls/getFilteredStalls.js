import { createConnection } from "../../../config/database.js";

// Get filtered stalls (supports both area and branch parameters) - Uses stored procedure
export const getFilteredStalls = async (req, res) => {
  let connection;
  try {
    const {
      area,
      branch,
      location,
      section,
      search,
      minPrice,
      maxPrice,
      priceRange,
      availability,
      sortBy = "default",
      limit = 50,
    } = req.query;

    connection = await createConnection();

    // Process price range parameter
    let actualMinPrice = minPrice ? parseFloat(minPrice) : null;
    let actualMaxPrice = maxPrice ? parseFloat(maxPrice) : null;
    
    if (priceRange && typeof priceRange === "string") {
      const [min, max] = priceRange.split("-").map((p) => parseFloat(p.trim()));
      if (!isNaN(min)) actualMinPrice = min;
      if (!isNaN(max)) actualMaxPrice = max;
    }

    // Map sortBy to stored procedure format
    let sortParam = "default";
    if (sortBy === "price-low") sortParam = "price_asc";
    else if (sortBy === "price-high") sortParam = "price_desc";
    else if (sortBy === "newest") sortParam = "newest";
    else if (sortBy === "oldest") sortParam = "oldest";

    // Use stored procedure instead of dynamic SQL building
    const [rows] = await connection.execute(
      'CALL sp_getFilteredStalls(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        branch || null,
        area || null,
        location || null,
        section || null,
        actualMinPrice,
        actualMaxPrice,
        search || null,
        sortParam,
        parseInt(limit)
      ]
    );
    const stalls = rows[0]; // First result set from stored procedure
    const stalls = rows[0]; // First result set from stored procedure

    // Format stalls to match the expected frontend response structure
    const formattedStalls = stalls.map((stall) => {
      // Safely format the price
      let formattedPrice = "Contact for pricing";
      if (stall.rental_price !== null && stall.rental_price !== undefined && !isNaN(stall.rental_price)) {
        const price = parseFloat(stall.rental_price);
        if (price > 0) {
          formattedPrice = `₱${price.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}/month`;
        }
      }

      return {
        id: stall.id,
        stallNumber: stall.stallNumber,
        branch: stall.branch,
        branchId: stall.branchId,
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

    const filterParam = branch || area;
    console.log(
      `✅ Found ${formattedStalls.length} filtered stalls ${
        filterParam ? `in ${branch ? "branch" : "area"} '${filterParam}'` : ""
      }`
    );

    res.json({
      success: true,
      message: "Filtered stalls retrieved successfully",
      data: formattedStalls,
      filters: {
        area,
        branch,
        location,
        section,
        search,
        minPrice,
        maxPrice,
        priceRange,
        availability,
        sortBy,
        limit,
      },
      count: formattedStalls.length,
    });
  } catch (error) {
    console.error("❌ Get filtered stalls error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve filtered stalls",
      error: error.message,
    });
  } finally {
    if (connection) await connection.end();
  }
};
