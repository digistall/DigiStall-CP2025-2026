import { createConnection } from '../../../../../config/database.js';

/**
 * Get landing page stallholders list
 * Returns paginated list of active stallholders with search and filter
 * Uses stored procedure with dynamic SQL for collation handling on DigitalOcean
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
    const searchTerm = search || null;
    const branchFilter = branch ? parseInt(branch) : null;
    const businessTypeFilter = businessType || null;
    
    console.log('📊 Executing stallholders SP with params:', { searchTerm, branchFilter, businessTypeFilter, limitNum, offset });
    
    // Use stored procedure for landing page stallholders
    const [rows] = await connection.execute(
      'CALL sp_getLandingPageStallholdersList(?, ?, ?, ?, ?)',
      [searchTerm, branchFilter, businessTypeFilter, limitNum, offset]
    );
    const stallholders = rows[0];
    
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

