import { createConnection } from '../../../../../config/database.js';

/**
 * Get landing page stalls list
 * Returns paginated list of all stalls with search and filter
 * Uses stored procedure sp_getLandingPageStalls
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
    
    // Call the stored procedure
    const [results] = await connection.execute(
      'CALL sp_getLandingPageStalls(?, ?, ?, ?, ?, ?)',
      [
        search || null,
        branch ? parseInt(branch) : null,
        status || null,
        priceType || null,
        parseInt(page),
        parseInt(limit)
      ]
    );
    
    const stalls = results[0] || [];
    
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
