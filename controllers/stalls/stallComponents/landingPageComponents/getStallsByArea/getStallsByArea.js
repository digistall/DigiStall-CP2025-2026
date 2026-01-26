import { createConnection } from "../../../../../config/database.js";

// Get stalls by area or branch (supports both for backward compatibility)
export const getStallsByArea = async (req, res) => {
  let connection;
  try {
    const { area, branch } = req.query;

    // Support both branch (new) and area (legacy) parameters
    const filterParam = branch || area;
    const filterType = branch ? "branch" : "area";
    const filterColumn = branch ? "branch_name" : "area";

    if (!filterParam) {
      return res.status(400).json({
        success: false,
        message: "Area or branch parameter is required",
      });
    }

    connection = await createConnection();

    const [stalls] = await connection.execute(
      `
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
      WHERE b.${filterColumn} = ? AND s.status = 'Available' AND s.is_available = 1
      ORDER BY s.created_at DESC
    `,
      [filterParam]
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
        price: formattedPrice,
        price_type: stall.price_type,
        dimensions: stall.dimensions || "Contact for details",
        floor: stall.floor,
        section: stall.section,
        isAvailable: Boolean(stall.isAvailable),
        description: stall.description || "Perfect for business",
        imageUrl: stall.imageId ? `/api/stalls/images/blob/id/${stall.imageId}` : null,
      };
    });

    // Sort stalls: Fixed Price first, then Auction and Raffle
    console.log(`📊 Sorting ${formattedStalls.length} stalls by price type...`);

    formattedStalls.sort((a, b) => {
      const getPriority = (priceType) => {
        if (!priceType || priceType === "Fixed Price") return 1;
        if (priceType === "Auction") return 2;
        if (priceType === "Raffle") return 3;
        return 4;
      };

      return getPriority(a.price_type) - getPriority(b.price_type);
    });

    // Log the distribution of stall types
    const priceTypeCount = formattedStalls.reduce((acc, stall) => {
      const type = stall.price_type || "Fixed Price";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    console.log(`📋 Stall distribution:`, priceTypeCount);
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
