// ===== COMPLIANCE CONTROLLER =====
// Handles all compliance/violation record management operations
// Includes CRUD operations, filtering, and statistics

import { createConnection } from '../../../config/database.js';

/**
 * Get all compliance records with optional filters
 * @route GET /api/compliances
 * @access Protected (requires authentication and compliance permission)
 */
export const getAllComplianceRecords = async (req, res) => {
  let connection;
  try {
    const { status, search, branch_id } = req.query;
    const userType = req.user?.userType;
    const userBranchId = req.user?.branchId;

    console.log('📋 Fetching compliance records with filters:', { status, search, branch_id, userType });

    connection = await createConnection();

    // Determine which branch to query based on user type
    let queryBranchId = null;
    if (userType === 'branch_manager' || userType === 'employee') {
      // Branch managers and employees can only see their branch
      queryBranchId = userBranchId || null;
    } else if (userType === 'admin') {
      // Admins can filter by specific branch or see all
      queryBranchId = branch_id ? parseInt(branch_id) : null;
    }

    // Prepare parameters - convert undefined to null for MySQL
    const statusParam = status || 'all';
    const searchParam = search || null;

    console.log('🔧 Query parameters:', { queryBranchId, statusParam, searchParam });

    // Use stored procedure for efficient querying
    const [records] = await connection.execute(
      'CALL getAllComplianceRecords(?, ?, ?)',
      [queryBranchId, statusParam, searchParam]
    );

    // The stored procedure returns results in first element
    const complianceRecords = records[0];

    console.log(`✅ Found ${complianceRecords.length} compliance records`);

    res.status(200).json({
      success: true,
      message: 'Compliance records retrieved successfully',
      data: complianceRecords,
      count: complianceRecords.length
    });

  } catch (error) {
    console.error('❌ Error fetching compliance records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance records',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get single compliance record by ID
 * @route GET /api/compliances/:id
 * @access Protected
 */
export const getComplianceRecordById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    console.log(`📄 Fetching compliance record ID: ${id}`);

    connection = await createConnection();

    const [records] = await connection.execute(
      'CALL getComplianceRecordById(?)',
      [id]
    );

    const record = records[0][0];

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Compliance record with ID ${id} not found`
      });
    }

    console.log('✅ Compliance record found');

    res.status(200).json({
      success: true,
      message: 'Compliance record retrieved successfully',
      data: record
    });

  } catch (error) {
    console.error('❌ Error fetching compliance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance record',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Create new compliance/violation record
 * @route POST /api/compliances
 * @access Protected (compliance permission required)
 */
export const createComplianceRecord = async (req, res) => {
  let connection;
  try {
    const {
      inspector_id,
      stallholder_id,
      violation_id,
      stall_id,
      compliance_type,
      severity = 'moderate',
      remarks,
      offense_no,
      penalty_id
    } = req.body;

    const userType = req.user?.userType;
    const userBranchId = req.user?.branchId;

    console.log('📝 Creating new compliance record:', req.body);

    // Validation
    if (!stallholder_id) {
      return res.status(400).json({
        success: false,
        message: 'Stallholder ID is required'
      });
    }

    if (!compliance_type && !violation_id) {
      return res.status(400).json({
        success: false,
        message: 'Either compliance_type or violation_id is required'
      });
    }

    connection = await createConnection();

    // Get branch_id from user or stallholder
    let branch_id = userBranchId;
    if (!branch_id) {
      // If admin, get branch from stallholder
      const [stallholderData] = await connection.execute(
        'SELECT branch_id FROM stallholder WHERE stallholder_id = ?',
        [stallholder_id]
      );
      branch_id = stallholderData[0]?.branch_id || null;
    }

    // Create compliance record using stored procedure
    const [result] = await connection.execute(
      'CALL createComplianceRecord(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        inspector_id || null,
        stallholder_id,
        violation_id || null,
        stall_id || null,
        branch_id,
        compliance_type || null,
        severity,
        remarks || null,
        offense_no || 1,
        penalty_id || null
      ]
    );

    const newRecordId = result[0][0]?.report_id;

    console.log(`✅ Compliance record created with ID: ${newRecordId}`);

    // Fetch the newly created record
    const [newRecord] = await connection.execute(
      'CALL getComplianceRecordById(?)',
      [newRecordId]
    );

    res.status(201).json({
      success: true,
      message: 'Compliance record created successfully',
      data: newRecord[0][0]
    });

  } catch (error) {
    console.error('❌ Error creating compliance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create compliance record',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Update compliance record (status, remarks, resolution)
 * @route PUT /api/compliances/:id
 * @access Protected
 */
export const updateComplianceRecord = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const userId = req.user?.userId || req.user?.branchManagerId || req.user?.employeeId;

    console.log(`📝 Updating compliance record ID: ${id}`, { status, remarks });

    // Validation
    if (!status && !remarks) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (status or remarks) is required for update'
      });
    }

    // Validate status if provided
    const validStatuses = ['pending', 'in-progress', 'complete', 'incomplete'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    connection = await createConnection();

    // Check if record exists
    const [existing] = await connection.execute(
      'SELECT report_id FROM violation_report WHERE report_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Compliance record with ID ${id} not found`
      });
    }

    // Update using stored procedure
    const [result] = await connection.execute(
      'CALL updateComplianceRecord(?, ?, ?, ?)',
      [id, status || null, remarks || null, userId]
    );

    console.log('✅ Compliance record updated successfully');

    // Fetch updated record
    const [updatedRecord] = await connection.execute(
      'CALL getComplianceRecordById(?)',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Compliance record updated successfully',
      data: updatedRecord[0][0]
    });

  } catch (error) {
    console.error('❌ Error updating compliance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update compliance record',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Delete compliance record
 * @route DELETE /api/compliances/:id
 * @access Protected (admin or branch manager only)
 */
export const deleteComplianceRecord = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userType = req.user?.userType;

    console.log(`🗑️ Deleting compliance record ID: ${id}`);

    // Only admins and branch managers can delete
    if (userType !== 'admin' && userType !== 'branch_manager') {
      return res.status(403).json({
        success: false,
        message: 'Only admins and branch managers can delete compliance records'
      });
    }

    connection = await createConnection();

    // Check if record exists
    const [existing] = await connection.execute(
      'SELECT report_id FROM violation_report WHERE report_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Compliance record with ID ${id} not found`
      });
    }

    // Delete using stored procedure
    await connection.execute('CALL deleteComplianceRecord(?)', [id]);

    console.log('✅ Compliance record deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Compliance record deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting compliance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete compliance record',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get compliance statistics
 * @route GET /api/compliances/statistics
 * @access Protected
 */
export const getComplianceStatistics = async (req, res) => {
  let connection;
  try {
    const userType = req.user?.userType;
    const userBranchId = req.user?.branchId;

    console.log('📊 Fetching compliance statistics');

    connection = await createConnection();

    // Determine branch filter
    const branchId = userType === 'admin' ? null : userBranchId;

    const [stats] = await connection.execute(
      'CALL getComplianceStatistics(?)',
      [branchId]
    );

    const statistics = stats[0][0];

    console.log('✅ Statistics retrieved:', statistics);

    res.status(200).json({
      success: true,
      message: 'Compliance statistics retrieved successfully',
      data: statistics
    });

  } catch (error) {
    console.error('❌ Error fetching compliance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance statistics',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get all inspectors
 * @route GET /api/compliances/inspectors
 * @access Protected
 */
export const getAllInspectors = async (req, res) => {
  let connection;
  try {
    console.log('👮 Fetching all active inspectors');

    connection = await createConnection();

    const [inspectors] = await connection.execute(
      `SELECT 
        inspector_id,
        CONCAT(first_name, ' ', last_name) as inspector_name,
        first_name,
        last_name,
        email,
        contact_no,
        status,
        date_hired
      FROM inspector
      WHERE status = 'active'
      ORDER BY first_name, last_name`
    );

    console.log(`✅ Found ${inspectors.length} active inspectors`);

    res.status(200).json({
      success: true,
      message: 'Inspectors retrieved successfully',
      data: inspectors
    });

  } catch (error) {
    console.error('❌ Error fetching inspectors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inspectors',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get all violations types
 * @route GET /api/compliances/violations
 * @access Protected
 */
export const getAllViolations = async (req, res) => {
  let connection;
  try {
    console.log('📜 Fetching all violation types');

    connection = await createConnection();

    const [violations] = await connection.execute(
      `SELECT 
        violation_id,
        ordinance_no,
        violation_type,
        details
      FROM violation
      ORDER BY violation_type`
    );

    console.log(`✅ Found ${violations.length} violation types`);

    res.status(200).json({
      success: true,
      message: 'Violation types retrieved successfully',
      data: violations
    });

  } catch (error) {
    console.error('❌ Error fetching violations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch violation types',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get penalties for a specific violation
 * @route GET /api/compliances/violations/:violationId/penalties
 * @access Protected
 */
export const getViolationPenalties = async (req, res) => {
  let connection;
  try {
    const { violationId } = req.params;

    console.log(`💰 Fetching penalties for violation ID: ${violationId}`);

    connection = await createConnection();

    const [penalties] = await connection.execute(
      `SELECT 
        penalty_id,
        violation_id,
        offense_no,
        penalty_amount,
        remarks
      FROM violation_penalty
      WHERE violation_id = ?
      ORDER BY offense_no`,
      [violationId]
    );

    console.log(`✅ Found ${penalties.length} penalties`);

    res.status(200).json({
      success: true,
      message: 'Penalties retrieved successfully',
      data: penalties
    });

  } catch (error) {
    console.error('❌ Error fetching penalties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch penalties',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

export default {
  getAllComplianceRecords,
  getComplianceRecordById,
  createComplianceRecord,
  updateComplianceRecord,
  deleteComplianceRecord,
  getComplianceStatistics,
  getAllInspectors,
  getAllViolations,
  getViolationPenalties
};
