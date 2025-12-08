import { createConnection } from '../../../../../config/database.js';

/**
 * Get landing page stallholders list
 * Returns paginated list of active stallholders with search and filter
 * Uses stored procedure sp_getLandingPageStallholders
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
    
    // Call the stored procedure
    const [results] = await connection.execute(
      'CALL sp_getLandingPageStallholders(?, ?, ?, ?, ?)',
      [
        search || null,
        branch ? parseInt(branch) : null,
        businessType || null,
        parseInt(page),
        parseInt(limit)
      ]
    );
    
    const stallholders = results[0] || [];
    
    console.log(`📊 Landing page stallholders fetched: ${stallholders.length} records`);
    
    res.status(200).json({
      success: true,
      data: stallholders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
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
