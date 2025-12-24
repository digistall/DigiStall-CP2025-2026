import { createConnection } from '../../../../../config/database.js';

/**
 * Get landing page stallholders list
 * Returns paginated list of active stallholders with search and filter
 * Uses direct query to avoid collation issues with stored procedures on DigitalOcean
 * 
 * @route GET /api/stalls/public/stallholders
 * @access Public
 */
export const getLandingPageStallholders = async (req, res) => {
  let connection;
  try {
    const {
      search = '',
      branch = null,
      businessType = '',
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
    let query = `
      SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.business_name,
        sh.business_type,
        sh.contact_number,
        sh.email,
        s.stall_no,
        s.stall_location,
        b.branch_name,
        b.branch_id,
        sh.contract_status,
        sh.compliance_status
      FROM stallholder sh
      LEFT JOIN stall s ON sh.stall_id = s.stall_id
      LEFT JOIN branch b ON sh.branch_id = b.branch_id
      WHERE sh.contract_status = 'Active'
    `;
    
    const params = [];
    
    // Add search filter with COLLATE to handle collation differences
    if (searchPattern) {
      query += ` AND (
        sh.stallholder_name COLLATE utf8mb4_unicode_ci LIKE ? COLLATE utf8mb4_unicode_ci OR
        sh.business_name COLLATE utf8mb4_unicode_ci LIKE ? COLLATE utf8mb4_unicode_ci OR
        sh.business_type COLLATE utf8mb4_unicode_ci LIKE ? COLLATE utf8mb4_unicode_ci OR
        s.stall_no COLLATE utf8mb4_unicode_ci LIKE ? COLLATE utf8mb4_unicode_ci OR
        b.branch_name COLLATE utf8mb4_unicode_ci LIKE ? COLLATE utf8mb4_unicode_ci
      )`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    // Add branch filter
    if (branchFilter) {
      query += ` AND sh.branch_id = ?`;
      params.push(branchFilter);
    }
    
    // Add business type filter
    if (businessType && businessType !== '') {
      query += ` AND sh.business_type COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci`;
      params.push(businessType);
    }
    
    // Add ordering and pagination - embed LIMIT/OFFSET directly to avoid prepared statement issues
    query += ` ORDER BY sh.stallholder_name ASC LIMIT ${limitNum} OFFSET ${offset}`;
    
    console.log('📊 Executing stallholders query with params:', params);
    
    // Use query() instead of execute() to avoid prepared statement issues
    const [stallholders] = await connection.query(query, params);
    
    console.log(`📊 Landing page stallholders fetched: ${stallholders.length} records`);
    
    res.status(200).json({
      success: true,
      data: stallholders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: stallholders.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching landing page stallholders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stallholders list',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
