import { createConnection } from '../../../../../config/database.js';
import { decryptData } from '../../../../../services/encryptionService.js';

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
    
    // Decrypt and transform data to match frontend expectations
    // Frontend expects: stallholder_name, business_name, business_type, stall_no, branch_name
    const decryptedStallholders = stallholders.map(sh => {
      const decryptedName = decryptData(sh.full_name);
      console.log(`📊 Decrypting name: ${sh.full_name?.substring(0, 30)}... => ${decryptedName}`);
      
      return {
        stallholder_id: sh.stallholder_id,
        stallholder_name: decryptedName || 'N/A',
        business_name: sh.stall_name || 'N/A',
        business_type: sh.stall_type || 'N/A',
        stall_no: sh.stall_number || 'N/A',
        branch_name: sh.branch_name || 'N/A',
        branch_id: sh.branch_id,
        compliance_status: sh.compliance_status || 'N/A',
        payment_status: sh.payment_status,
        status: sh.status,
        floor: sh.floor,
        section: sh.section,
        monthly_rent: sh.monthly_rent
      };
    });
    
    res.status(200).json({
      success: true,
      data: decryptedStallholders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: decryptedStallholders.length
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