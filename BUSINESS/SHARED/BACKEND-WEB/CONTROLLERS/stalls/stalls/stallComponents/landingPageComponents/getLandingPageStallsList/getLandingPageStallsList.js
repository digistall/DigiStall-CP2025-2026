import { createConnection } from '../../../../../CONFIG/database.js';

/**
 * Get landing page stalls list
 * Returns paginated list of all stalls with search and filter
 * Uses stored procedure with dynamic SQL for collation handling on DigitalOcean
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
    const searchTerm = search || null;
    const branchFilter = branch ? parseInt(branch) : null;
    const statusFilter = status || null;
    const priceTypeFilter = priceType || null;
    
    console.log('📊 Executing stalls SP with params:', { searchTerm, branchFilter, statusFilter, priceTypeFilter, limitNum, offset });
    
    // Use stored procedure for landing page stalls
    const [rows] = await connection.execute(
      'CALL sp_getLandingPageStallsList(?, ?, ?, ?, ?, ?)',
      [searchTerm, branchFilter, statusFilter, priceTypeFilter, limitNum, offset]
    );
    const stalls = rows[0];
    
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

