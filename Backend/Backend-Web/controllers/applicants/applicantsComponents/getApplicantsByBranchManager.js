import { createConnection } from '../../../config/database.js'
import { getBranchFilter } from '../../../middleware/rolePermissions.js'

// Helper function to get decryption key
const getDecryptionKey = async (connection) => {
  const [keyResult] = await connection.execute(
    "SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1"
  );
  return keyResult[0]?.encryption_key || null;
};

// Get applicants for stalls managed by a specific branch manager OR by employees in their assigned branch
export const getApplicantsByBranchManager = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    // Get decryption key for encrypted data
    const encryptionKey = await getDecryptionKey(connection);

    console.log("🔍 Request user info:", req.user);

    // Check if user is an employee, branch manager, or business owner
    const userType = req.user?.userType || req.user?.role;
    const userId = req.user?.userId;
    const userBranchId = req.user?.branchId;

    console.log("🎯 User details:", { userType, userId, userBranchId });

    const { application_status, price_type, search } = req.query;

    // Get branch filter based on user role (supports multi-branch for business owners)
    const branchFilter = await getBranchFilter(req, connection);
    
    if (branchFilter === null) {
      // System administrator - see all
      console.log('🔍 System admin viewing all applicants across all branches');
    } else if (branchFilter.length === 0) {
      // Business owner with no accessible branches
      console.log('⚠️ Business owner has no accessible branches');
      return res.json({
        success: true,
        message: 'No accessible branches',
        data: {
          branch_manager: null,
          applicants: [],
          statistics: {
            summary: [],
            status_breakdown: [],
            total_results: 0
          }
        }
      });
    }

    let managerData = null;
    let branchIds = branchFilter;

    // Get manager/owner information
    if (userType === 'business_employee') {
      // For employees, use their assigned branch directly
      if (!userBranchId) {
        return res.status(400).json({
          success: false,
          message: 'Employee not assigned to any branch'
        });
      }

      // Get branch information for employee
      const [branchInfo] = await connection.execute(
        `SELECT 
          b.branch_id,
          b.branch_name,
          b.area,
          b.location,
          'Employee' as manager_name,
          'N/A' as manager_email
        FROM branch b
        WHERE b.branch_id = ?`,
        [userBranchId]
      );

      if (branchInfo.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      managerData = branchInfo[0];

    } else if (userType === 'stall_business_owner') {
      // Business owners can view multiple branches
      console.log(`🔍 Business owner viewing applicants for branches: ${branchIds.join(', ')}`);
      
      // Get business owner information
      const [ownerInfo] = await connection.execute(
        `SELECT 
          sbo.business_owner_id,
          CONCAT(sbo.first_name, ' ', sbo.last_name) as owner_name,
          sbo.email as owner_email,
          'Business Owner' as manager_name,
          sbo.email as manager_email
        FROM stall_business_owner sbo
        WHERE sbo.business_owner_id = ?`,
        [userId]
      );

      managerData = ownerInfo[0] || { 
        manager_name: 'Business Owner', 
        manager_email: 'N/A' 
      };

    } else if (userType === 'business_manager') {
      // For branch managers, use the original logic
      const branch_manager_id = req.params.branch_manager_id || req.user?.branchManagerId || req.user?.userId;
      
      if (!branch_manager_id) {
        return res.status(400).json({
          success: false,
          message: 'Branch Manager ID not found in authentication token or URL parameters'
        });
      }

      // First, get the branches managed by this branch manager with decryption
      const [branchManagerInfo] = await connection.execute(
        `SELECT 
          bm.business_manager_id,
          CONCAT(
            CASE WHEN bm.is_encrypted = 1 AND ? IS NOT NULL THEN 
              CAST(AES_DECRYPT(bm.encrypted_first_name, ?) AS CHAR(100))
            ELSE bm.first_name END, 
            ' ', 
            CASE WHEN bm.is_encrypted = 1 AND ? IS NOT NULL THEN 
              CAST(AES_DECRYPT(bm.encrypted_last_name, ?) AS CHAR(100))
            ELSE bm.last_name END
          ) as manager_name,
          CASE WHEN bm.is_encrypted = 1 AND ? IS NOT NULL THEN 
            CAST(AES_DECRYPT(bm.encrypted_email, ?) AS CHAR(255))
          ELSE bm.email END as manager_email,
          b.branch_id,
          b.branch_name,
          b.area,
          b.location
        FROM business_manager bm
        INNER JOIN branch b ON bm.branch_id = b.branch_id
        WHERE bm.business_manager_id = ?`,
        [encryptionKey, encryptionKey, encryptionKey, encryptionKey, encryptionKey, encryptionKey, branch_manager_id]
      );

      if (branchManagerInfo.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Branch Manager not found or not assigned to any branch'
        });
      }

      managerData = branchManagerInfo[0];
    }

    // Build query with multi-branch support and decryption
    let query = `
      SELECT DISTINCT
        a.applicant_id,
        CASE WHEN a.is_encrypted = 1 AND ? IS NOT NULL THEN 
          CAST(AES_DECRYPT(a.encrypted_full_name, ?) AS CHAR(255))
        ELSE a.applicant_full_name END as applicant_full_name,
        CASE WHEN a.is_encrypted = 1 AND ? IS NOT NULL THEN 
          CAST(AES_DECRYPT(a.encrypted_contact, ?) AS CHAR(50))
        ELSE a.applicant_contact_number END as applicant_contact_number,
        CASE WHEN a.is_encrypted = 1 AND ? IS NOT NULL THEN 
          CAST(AES_DECRYPT(a.encrypted_address, ?) AS CHAR(500))
        ELSE a.applicant_address END as applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        a.created_at,
        a.updated_at,
        -- Business information from separate table
        bi.nature_of_business,
        bi.capitalization,
        bi.source_of_capital,
        bi.previous_business_experience,
        bi.relative_stall_owner,
        -- Other information from separate table
        oi.email_address,
        -- Spouse information from separate table
        sp.spouse_full_name,
        sp.spouse_birthdate,
        sp.spouse_educational_attainment,
        sp.spouse_contact_number,
        sp.spouse_occupation,
        -- Application details
        app.application_id,
        app.application_date,
        app.application_status as current_application_status,
        -- Stall details
        s.stall_id,
        s.stall_no,
        s.rental_price,
        s.price_type,
        s.stall_location,
        s.is_available,
        s.status as stall_status,
        s.raffle_auction_deadline,
        s.deadline_active,
        -- Branch location details
        sec.section_name,
        f.floor_name,
        b.branch_id,
        b.branch_name
      FROM applicant a
      INNER JOIN application app ON a.applicant_id = app.applicant_id
      INNER JOIN stall s ON app.stall_id = s.stall_id
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON sec.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
      LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
      LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
      LEFT JOIN spouse sp ON a.applicant_id = sp.applicant_id
    `;

    // Add encryption key params (6 params for 3 decryption calls - key appears twice each)
    let params = [encryptionKey, encryptionKey, encryptionKey, encryptionKey, encryptionKey, encryptionKey];

    // Apply branch filter
    if (branchFilter === null) {
      // System administrator - no branch filter
      query += " WHERE 1=1";
    } else {
      // Filter by accessible branches
      const placeholders = branchFilter.map(() => '?').join(',');
      query += ` WHERE b.branch_id IN (${placeholders})`;
      params = [...params, ...branchFilter];
    }

    if (application_status) {
      query += " AND LOWER(app.application_status) = LOWER(?)";
      params.push(application_status);
    }

    if (price_type) {
      query += " AND s.price_type = ?";
      params.push(price_type);
    }

    if (search) {
      query += ` AND (
        a.applicant_full_name LIKE ? OR 
        oi.email_address LIKE ? OR 
        bi.nature_of_business LIKE ? OR 
        s.stall_no LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY FIELD(app.application_status, 'pending', 'Pending', 'approved', 'Approved', 'rejected', 'Rejected'), app.application_date DESC";

    const [rows] = await connection.execute(query, params);

    // Group applications by applicant_id
    const applicantsMap = new Map();

    rows.forEach(row => {
      if (!applicantsMap.has(row.applicant_id)) {
        applicantsMap.set(row.applicant_id, {
          applicant_id: row.applicant_id,
          first_name: row.applicant_full_name ? row.applicant_full_name.split(' ')[0] : 'N/A',
          last_name: row.applicant_full_name ? row.applicant_full_name.split(' ').slice(1).join(' ') : 'N/A',
          full_name: row.applicant_full_name || 'N/A',
          email: row.email_address || 'N/A',
          contact_number: row.applicant_contact_number || 'N/A',
          address: row.applicant_address || 'N/A',
          business_type: row.nature_of_business || 'N/A',
          business_name: row.nature_of_business || 'N/A',
          business_description: row.nature_of_business || 'N/A',
          preferred_area: 'N/A',
          preferred_location: 'N/A',
          applicant_birthdate: row.applicant_birthdate,
          applicant_civil_status: row.applicant_civil_status,
          applicant_educational_attainment: row.applicant_educational_attainment,
          application_status: 'Pending',
          applied_date: row.application_date,
          created_at: row.created_at,
          updated_at: row.updated_at,
          // Add spouse information
          spouse: row.spouse_full_name ? {
            spouse_full_name: row.spouse_full_name,
            spouse_birthdate: row.spouse_birthdate,
            spouse_educational_attainment: row.spouse_educational_attainment,
            spouse_contact_number: row.spouse_contact_number,
            spouse_occupation: row.spouse_occupation
          } : null,
          // Add business information
          business_information: row.nature_of_business ? {
            nature_of_business: row.nature_of_business,
            capitalization: row.capitalization,
            source_of_capital: row.source_of_capital,
            previous_business_experience: row.previous_business_experience,
            relative_stall_owner: row.relative_stall_owner
          } : null,
          // Add other information
          other_information: row.email_address ? {
            email_address: row.email_address
          } : null,
          applications: []
        });
      }

      // Add application details to the applicant
      applicantsMap.get(row.applicant_id).applications.push({
        application_id: row.application_id,
        application_date: row.application_date,
        application_status: row.current_application_status,
        stall: {
          stall_id: row.stall_id,
          stall_no: row.stall_no,
          rental_price: row.rental_price,
          price_type: row.price_type,
          stall_location: row.stall_location,
          is_available: row.is_available,
          stall_status: row.stall_status,
          section_name: row.section_name,
          floor_name: row.floor_name,
          branch_name: row.branch_name,
          raffle_auction_deadline: row.raffle_auction_deadline,
          deadline_active: row.deadline_active
        }
      });
    });

    // Convert Map to Array
    const applicants = Array.from(applicantsMap.values());

    // Get summary statistics with multi-branch support
    let summaryQuery = `
      SELECT 
        COUNT(DISTINCT app.applicant_id) as total_unique_applicants,
        COUNT(app.application_id) as total_applications,
        COUNT(DISTINCT s.stall_id) as stalls_with_applications,
        s.price_type,
        COUNT(*) as applications_by_type
      FROM application app
      INNER JOIN stall s ON app.stall_id = s.stall_id
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON sec.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
    `;

    let summaryParams = [];
    if (branchFilter === null) {
      summaryQuery += " WHERE 1=1 GROUP BY s.price_type";
    } else {
      const placeholders = branchFilter.map(() => '?').join(',');
      summaryQuery += ` WHERE b.branch_id IN (${placeholders}) GROUP BY s.price_type`;
      summaryParams = [...branchFilter];
    }

    const [summaryStats] = await connection.execute(summaryQuery, summaryParams);

    let statusQuery = `
      SELECT 
        app.application_status,
        COUNT(*) as count
      FROM application app
      INNER JOIN stall s ON app.stall_id = s.stall_id
      INNER JOIN section sec ON s.section_id = sec.section_id
      INNER JOIN floor f ON sec.floor_id = f.floor_id
      INNER JOIN branch b ON f.branch_id = b.branch_id
    `;

    let statusParams = [];
    if (branchFilter === null) {
      statusQuery += " WHERE 1=1 GROUP BY app.application_status";
    } else {
      const placeholders = branchFilter.map(() => '?').join(',');
      statusQuery += ` WHERE b.branch_id IN (${placeholders}) GROUP BY app.application_status`;
      statusParams = [...branchFilter];
    }

    const [statusBreakdown] = await connection.execute(statusQuery, statusParams);

    res.json({
      success: true,
      message: 'Applicants retrieved successfully',
      data: {
        branch_manager: managerData,
        applicants: applicants,
        statistics: {
          summary: summaryStats,
          status_breakdown: statusBreakdown,
          total_results: applicants.length
        }
      },
      filters: {
        user_type: userType,
        accessible_branches: branchFilter === null ? 'all' : branchFilter.join(', '),
        application_status: application_status || 'all',
        price_type: price_type || 'all',
        search: search || ''
      }
    });

  } catch (error) {
    console.error('❌ Get branch manager applicants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve branch manager applicants',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};