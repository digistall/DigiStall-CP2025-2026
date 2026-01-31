// ===== COMPLIANCE CONTROLLER =====
// Handles all compliance/violation record management operations
// Includes CRUD operations, filtering, and statistics

import { createConnection } from '../../CONFIG/database.js';
import { getBranchFilter } from '../../MIDDLEWARE/rolePermissions.js';
import { decryptObjectFields } from '../../SERVICES/encryptionService.js';

/**
 * Convert evidence BLOB Buffer to base64 string for frontend consumption
 * @param {Object} record - Compliance record with potential evidence Buffer
 * @returns {Object} Record with evidence converted to base64 string
 */
const convertEvidenceToBase64 = (record) => {
  if (record && record.evidence) {
    if (Buffer.isBuffer(record.evidence)) {
      record.evidence = record.evidence.toString('base64');
    } else if (record.evidence.type === 'Buffer' && Array.isArray(record.evidence.data)) {
      // Handle case where Buffer was already serialized to JSON
      record.evidence = Buffer.from(record.evidence.data).toString('base64');
    }
  }
  return record;
};

/**
 * Get all compliance records with optional filters
 * @route GET /api/compliances
 * @access Protected (requires authentication and compliance permission)
 */
export const getAllComplianceRecords = async (req, res) => {
  let connection;
  try {
    const { status, search } = req.query;
    const userType = req.user?.userType;

    console.log('📋 Fetching compliance records with filters:', { status, search, userType });

    connection = await createConnection();

    // Get branch filter based on user role and business_owner_managers table
    const branchFilter = await getBranchFilter(req, connection);

    // Prepare status and search parameters
    const statusParam = status || 'all';
    const searchParam = search || null;

    let complianceRecords;

    if (branchFilter === null) {
      // System administrator - see all compliance records
      console.log('🔍 getAllComplianceRecords - System admin viewing all branches');
      const [records] = await connection.execute(
        'CALL getAllComplianceRecordsDecrypted(?, ?, ?)',
        [null, statusParam, searchParam]
      );
      complianceRecords = records[0];
    } else if (branchFilter.length === 0) {
      // Business owner with no accessible branches
      console.log('⚠️ getAllComplianceRecords - Business owner has no accessible branches');
      complianceRecords = [];
    } else if (branchFilter.length === 1) {
      // Single branch (business manager or owner with one branch)
      console.log(`🔍 getAllComplianceRecords - Fetching for branch: ${branchFilter[0]}`);
      const [records] = await connection.execute(
        'CALL getAllComplianceRecordsDecrypted(?, ?, ?)',
        [branchFilter[0], statusParam, searchParam]
      );
      complianceRecords = records[0];
    } else {
      // Multiple branches (business owner with multiple branches)
      console.log(`🔍 getAllComplianceRecords - Fetching for branches: ${branchFilter.join(', ')}`);
      // Query each branch and combine results
      const allRecords = [];
      for (const branchId of branchFilter) {
        const [records] = await connection.execute(
          'CALL getAllComplianceRecordsDecrypted(?, ?, ?)',
          [branchId, statusParam, searchParam]
        );
        allRecords.push(...records[0]);
      }
      complianceRecords = allRecords;
    }

    console.log(`✅ Found ${complianceRecords.length} compliance records`);

    // Convert evidence BLOB to base64 and decrypt sensitive data for each record
    const processedRecords = complianceRecords.map(record => {
      // Convert evidence BLOB to base64
      const recordWithEvidence = convertEvidenceToBase64(record);
      
      // Decrypt stallholder and inspector sensitive fields (including all aliases)
      const decrypted = decryptObjectFields(recordWithEvidence, [
        // Stallholder fields and aliases
        'stallholder_name',
        'stallholder',
        'stallholder_email', 
        'stallholder_contact',
        'full_name',
        'email',
        'contact_number',
        // Inspector fields
        'inspector_first_name',
        'inspector_last_name'
      ]);
      
      // Concatenate inspector name after decryption
      if (decrypted.inspector_first_name || decrypted.inspector_last_name) {
        decrypted.inspector_name = `${decrypted.inspector_first_name || ''} ${decrypted.inspector_last_name || ''}`.trim();
        decrypted.inspector = decrypted.inspector_name; // Add alias
      }
      
      return decrypted;
    });

    res.status(200).json({
      success: true,
      message: 'Compliance records retrieved successfully',
      data: processedRecords,
      count: processedRecords.length
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
      'CALL getComplianceRecordByIdDecrypted(?)',
      [id]
    );

    const record = records[0][0];

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Compliance record with ID ${id} not found`
      });
    }

    // Convert evidence BLOB to base64
    const recordWithEvidence = convertEvidenceToBase64(record);
    
    // Decrypt stallholder and inspector sensitive fields (including all aliases)
    const decrypted = decryptObjectFields(recordWithEvidence, [
      // Stallholder fields and aliases
      'stallholder_name',
      'stallholder',
      'stallholder_email', 
      'stallholder_contact',
      'full_name',
      'email',
      'contact_number',
      // Inspector fields
      'inspector_first_name',
      'inspector_last_name'
    ]);
    
    // Concatenate inspector name after decryption
    if (decrypted.inspector_first_name || decrypted.inspector_last_name) {
      decrypted.inspector_name = `${decrypted.inspector_first_name || ''} ${decrypted.inspector_last_name || ''}`.trim();
      decrypted.inspector = decrypted.inspector_name; // Add alias
    }
    
    const processedRecord = decrypted;

    console.log('✅ Compliance record found');

    res.status(200).json({
      success: true,
      message: 'Compliance record retrieved successfully',
      data: processedRecord
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
      // If owner/admin, get branch from stallholder using stored procedure
      const [stallholderData] = await connection.execute(
        'CALL getStallholderBranchId(?)',
        [stallholder_id]
      );
      branch_id = stallholderData[0][0]?.branch_id || null;
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

    // Check if record exists using stored procedure
    const [existing] = await connection.execute(
      'CALL checkComplianceRecordExists(?)',
      [id]
    );

    if (existing[0][0]?.record_exists === 0) {
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

    // Only system admins, business owners, and business managers can delete
    if (userType !== 'system_administrator' && userType !== 'stall_business_owner' && userType !== 'business_manager') {
      return res.status(403).json({
        success: false,
        message: 'Only system administrators, business owners, and business managers can delete compliance records'
      });
    }

    connection = await createConnection();

    // Check if record exists using stored procedure
    const [existing] = await connection.execute(
      'CALL checkComplianceRecordExists(?)',
      [id]
    );

    if (existing[0][0]?.record_exists === 0) {
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
    const branchId = (userType === 'system_administrator' || userType === 'stall_business_owner') ? null : userBranchId;

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

    // Use stored procedure instead of raw SQL
    const [result] = await connection.execute('CALL getAllActiveInspectors()');
    const inspectors = result[0];

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

    // Use stored procedure instead of raw SQL
    const [result] = await connection.execute('CALL getAllViolationTypes()');
    const violations = result[0];

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

    // Use stored procedure instead of raw SQL
    const [result] = await connection.execute(
      'CALL getViolationPenaltiesByViolationId(?)',
      [violationId]
    );
    const penalties = result[0];

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

/**
 * Get evidence photos for a compliance record
 * The evidence is stored as BLOB in the violation_report table
 * @route GET /api/compliances/:id/evidence-photos
 * @access Protected
 */
export const getComplianceEvidencePhotos = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    console.log(`📷 Fetching evidence BLOB for compliance ID: ${id}`);
    
    connection = await createConnection();
    
    // Get the evidence BLOB from violation_report
    const [records] = await connection.execute(
      'SELECT report_id, evidence FROM violation_report WHERE report_id = ?',
      [id]
    );
    
    if (!records || records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compliance record not found'
      });
    }
    
    const evidence = records[0].evidence;
    
    // Check if evidence exists and is a Buffer/BLOB
    if (!evidence) {
      return res.status(200).json({
        success: true,
        message: 'No evidence found',
        data: {
          compliance_id: id,
          has_evidence: false,
          evidence_base64: null
        }
      });
    }
    
    // Convert BLOB to base64
    let evidenceBase64 = null;
    if (Buffer.isBuffer(evidence)) {
      evidenceBase64 = evidence.toString('base64');
    } else if (typeof evidence === 'string') {
      // If it's already a string, it might be base64 or text
      evidenceBase64 = evidence;
    }
    
    console.log(`✅ Evidence BLOB found, size: ${evidence.length} bytes`);
    
    res.status(200).json({
      success: true,
      message: 'Evidence retrieved successfully',
      data: {
        compliance_id: id,
        has_evidence: true,
        evidence_base64: evidenceBase64,
        evidence_size: evidence.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching evidence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evidence',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get compliance evidence image as binary (like stalls approach)
 * This serves the BLOB directly as an image - can be used as <img src="/api/compliances/:id/evidence/image">
 * @route GET /api/compliances/:id/evidence/image
 * @access Protected
 */
export const getComplianceEvidenceImage = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    console.log(`📷 Serving evidence image for compliance ID: ${id}`);
    
    connection = await createConnection();
    
    // Get the evidence BLOB from violation_report
    const [records] = await connection.execute(
      'SELECT report_id, evidence FROM violation_report WHERE report_id = ?',
      [id]
    );
    
    if (!records || records.length === 0 || !records[0].evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidence not found'
      });
    }
    
    const evidence = records[0].evidence;
    
    // Determine MIME type from the BLOB data
    let mimeType = 'image/jpeg'; // Default
    if (Buffer.isBuffer(evidence)) {
      // Check magic bytes for image type
      if (evidence[0] === 0xFF && evidence[1] === 0xD8) {
        mimeType = 'image/jpeg';
      } else if (evidence[0] === 0x89 && evidence[1] === 0x50) {
        mimeType = 'image/png';
      } else if (evidence[0] === 0x47 && evidence[1] === 0x49) {
        mimeType = 'image/gif';
      } else if (evidence[0] === 0x52 && evidence[1] === 0x49) {
        mimeType = 'image/webp';
      }
    }
    
    // Set headers for image response (like stallImageBlobController does)
    res.set('Content-Type', mimeType);
    res.set('Content-Disposition', `inline; filename="evidence-${id}.jpg"`);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Send binary data
    res.send(evidence);
    
  } catch (error) {
    console.error('❌ Error serving evidence image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve evidence image',
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
  getViolationPenalties,
  getComplianceEvidencePhotos,
  getComplianceEvidenceImage
};

