import { createConnection } from '../../../../../config/database.js';

/**
 * Get landing page filter options
 * Returns available branches, business types, statuses, and price types
 * Uses stored procedure sp_getLandingPageFilterOptions
 * 
 * @route GET /api/stalls/public/filter-options
 * @access Public
 */
export const getLandingPageFilterOptions = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    // Call the stored procedure
    const [results] = await connection.execute('CALL sp_getLandingPageFilterOptions()');
    
    // Results contains multiple result sets:
    // [0] = branches, [1] = statuses, [2] = priceTypes
    const branches = results[0] || [];
    const statuses = results[1] || [];
    const priceTypes = results[2] || [];
    
    console.log('📊 Landing page filter options fetched');
    
    res.status(200).json({
      success: true,
      data: {
        branches: branches.map(b => ({ id: b.branch_id, name: b.branch_name })),
        statuses: statuses.map(s => s.status),
        priceTypes: priceTypes.map(pt => pt.price_type)
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter options',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
