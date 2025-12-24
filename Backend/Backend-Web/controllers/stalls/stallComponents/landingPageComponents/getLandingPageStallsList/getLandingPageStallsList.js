import { createConnection } from '../../../../../config/database.js';

/**
 * Get landing page stalls list
 * Returns paginated list of all stalls with search and filter
 * Uses direct query to avoid collation issues with stored procedures on DigitalOcean
 * 
 * @route GET /api/stalls/public/list
 * @access Public
 */
export const getLandingPageStallsList = async (req, res) => {
  let connection;
  try {
    const {
      search = '',
      branch = null,
      status = '',
      priceType = '',
      page = 1,
      limit = 20
    } = req.query;

    connection = await createConnection();
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    const searchPattern = search ? `%${search}%` : null;
    const branchFilter = branch ? parseInt(branch) : null;
    
    // Build query dynamically to avoid collation issues
    // Use query() instead of execute() because mysql2 prepared statements have issues with LIMIT/OFFSET
    let query = `
      SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
        s.rental_price,
        s.price_type,
        s.status,
        s.is_available,
        s.description,
        si.image_url as stall_image,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.branch_id,
        CASE WHEN sh.stallholder_id IS NOT NULL THEN 'Occupied' ELSE 'Available' END as occupancy_status
      FROM stall s
      LEFT JOIN section sec ON s.section_id = sec.section_id
      LEFT JOIN floor f ON s.floor_id = f.floor_id
      LEFT JOIN branch b ON f.branch_id = b.branch_id
      LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
      LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add search filter with COLLATE to handle collation differences
    if (searchPattern) {
      query += ` AND (
        s.stall_no COLLATE utf8mb4_unicode_ci LIKE ? COLLATE utf8mb4_unicode_ci OR
        s.stall_location COLLATE utf8mb4_unicode_ci LIKE ? COLLATE utf8mb4_unicode_ci OR
        sec.section_name COLLATE utf8mb4_unicode_ci LIKE ? COLLATE utf8mb4_unicode_ci OR
        f.floor_name COLLATE utf8mb4_unicode_ci LIKE ? COLLATE utf8mb4_unicode_ci OR
        b.branch_name COLLATE utf8mb4_unicode_ci LIKE ? COLLATE utf8mb4_unicode_ci
      )`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    // Add branch filter
    if (branchFilter) {
      query += ` AND b.branch_id = ?`;
      params.push(branchFilter);
    }
    
    // Add status filter
    if (status && status !== '') {
      if (status === 'Occupied') {
        query += ` AND sh.stallholder_id IS NOT NULL`;
      } else if (status === 'Available') {
        query += ` AND sh.stallholder_id IS NULL`;
      } else {
        query += ` AND s.status COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci`;
        params.push(status);
      }
    }
    
    // Add price type filter
    if (priceType && priceType !== '') {
      query += ` AND s.price_type COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci`;
      params.push(priceType);
    }
    
    // Add ordering and pagination - embed LIMIT/OFFSET directly to avoid prepared statement issues
    query += ` ORDER BY b.branch_name, f.floor_name, s.stall_no ASC LIMIT ${limitNum} OFFSET ${offset}`;
    
    console.log('📊 Executing stalls query with params:', params);
    
    // Use query() instead of execute() to avoid prepared statement issues with LIMIT/OFFSET
    const [stalls] = await connection.query(query, params);
    
    console.log(`📊 Landing page stalls fetched: ${stalls.length} records`);
    
    res.status(200).json({
      success: true,
      data: stalls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: stalls.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching landing page stalls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stalls list',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
