import { createConnection } from '../../config/database.js';
import { decryptAES256GCM } from '../../services/mysqlDecryptionService.js';

/**
 * Get stallholders by inspector's branch
 * @route GET /api/mobile/inspector/stallholders
 * @access Protected (Inspector only)
 */
export const getStallholdersByInspectorBranch = async (req, res) => {
  let connection;
  
  try {
    const staffData = req.user; // From auth middleware
    
    // Debug logging
    console.log('🔍 DEBUG req.user:', JSON.stringify(staffData, null, 2));
    console.log('🔍 DEBUG staffData.branchId:', staffData?.branchId);
    console.log('🔍 DEBUG staffData.branch_id:', staffData?.branch_id);
    
    const branchId = staffData.branchId || staffData.branch_id;
    
    console.log('📋 Inspector fetching stallholders for branch:', branchId);
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Inspector branch not found'
      });
    }
    
    connection = await createConnection();
    
    // Call the decrypted stored procedure
    const [results] = await connection.execute(
      'CALL getStallholdersByBranchDecrypted(?)',
      [branchId]
    );
    
    const stallholders = results[0]; // First result set from stored procedure
    
    // Decrypt sensitive fields
    const decryptedStallholders = stallholders.map(sh => {
      try {
        return {
          ...sh,
          full_name: sh.full_name ? decryptAES256GCM(sh.full_name) : null,
          email: sh.email ? decryptAES256GCM(sh.email) : null,
          contact_number: sh.contact_number ? decryptAES256GCM(sh.contact_number) : null,
          address: sh.address ? decryptAES256GCM(sh.address) : null,
        };
      } catch (decryptError) {
        console.error('⚠️  Decryption error for stallholder', sh.stallholder_id, ':', decryptError.message);
        return {
          ...sh,
          full_name: 'Decryption Error',
          email: null,
          contact_number: null,
          address: null,
        };
      }
    });
    
    console.log(`✅ Found ${decryptedStallholders.length} stallholders for branch ${branchId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Stallholders retrieved successfully',
      data: decryptedStallholders,
      count: decryptedStallholders.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching stallholders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stallholders',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

/**
 * Report a stallholder violation
 * @route POST /api/mobile/inspector/report
 * @access Protected (Inspector only)
 */
export const reportStallholder = async (req, res) => {
  let connection;
  
  try {
    const staffData = req.user; // From auth middleware
    const inspectorId = staffData.staffId || staffData.staff_id || staffData.id;
    
    const {
      stallholder_id,
      violation_id,
      branch_id,
      stall_id,
      evidence,
      remarks,
      receipt_number
    } = req.body;
    
    console.log('📝 Inspector submitting violation report:', {
      inspectorId,
      stallholder_id,
      violation_id,
      branch_id,
      stall_id,
      receipt_number
    });
    
    // Validation
    if (!stallholder_id || !violation_id || !branch_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: stallholder_id, violation_id, and branch_id are required'
      });
    }
    
    if (!evidence || evidence.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Evidence description is required'
      });
    }
    
    if (!receipt_number) {
      return res.status(400).json({
        success: false,
        message: 'Receipt number is required'
      });
    }
    
    connection = await createConnection();
    
    // Call the stored procedure with receipt_number
    await connection.execute(
      'CALL reportStallholder(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        inspectorId,
        stallholder_id,
        violation_id,
        branch_id,
        stall_id || null,
        evidence,
        remarks || null,
        parseInt(receipt_number)
      ]
    );
    
    console.log('✅ Violation report submitted successfully');
    
    return res.status(201).json({
      success: true,
      message: 'Violation report submitted successfully',
      receipt_number: receipt_number
    });
    
  } catch (error) {
    console.error('❌ Error submitting violation report:', error);
    
    // Handle specific error messages from stored procedure
    if (error.message.includes('Invalid violation_id')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid violation type selected'
      });
    }
    if (error.message.includes('Invalid stallholder_id')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stallholder ID'
      });
    }
    if (error.message.includes('No penalty defined')) {
      return res.status(400).json({
        success: false,
        message: 'No penalty defined for this violation type. Please contact administrator.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to submit violation report',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

/**
 * Get violation types - Uses stored procedure
 * @route GET /api/mobile/inspector/violations
 * @access Protected (Inspector only)
 */
export const getViolationTypes = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    
    // Use stored procedure to get violation types
    const [violationRows] = await connection.execute('CALL sp_getViolationTypes()');
    const violations = violationRows[0];
    
    console.log(`✅ Found ${violations.length} violation types`);
    
    return res.status(200).json({
      success: true,
      message: 'Violation types retrieved successfully',
      data: violations,
      count: violations.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching violation types:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch violation types',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

/**
 * Report a stallholder violation with photo evidence
 * @route POST /api/mobile/inspector/report-with-photos
 * @access Protected (Inspector only)
 */
export const reportStallholderWithPhotos = async (req, res) => {
  let connection;
  
  try {
    const staffData = req.user;
    const inspectorId = staffData.staffId || staffData.staff_id || staffData.id;
    
    // Parse the form data (since it's multipart)
    const {
      stallholder_id,
      violation_id,
      branch_id,
      stall_id,
      evidence,
      remarks,
      receipt_number
    } = req.body;
    
    // Get uploaded files
    const uploadedFiles = req.files || [];
    
    console.log('📝 Inspector submitting violation report with photos:', {
      inspectorId,
      stallholder_id,
      violation_id,
      branch_id,
      stall_id,
      receipt_number,
      photosCount: uploadedFiles.length
    });
    
    // Validation
    if (!stallholder_id || !violation_id || !branch_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: stallholder_id, violation_id, and branch_id are required'
      });
    }
    
    if (!evidence || evidence.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Evidence description is required'
      });
    }
    
    if (!receipt_number) {
      return res.status(400).json({
        success: false,
        message: 'Receipt number is required'
      });
    }
    
    // Build photo paths array for storage
    const photoPaths = uploadedFiles.map(file => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return `${year}/${month}/${file.filename}`;
    });
    
    // Append photo paths to evidence description for reference
    let enhancedEvidence = evidence.trim();
    if (photoPaths.length > 0) {
      enhancedEvidence += `\n\n[Photo Evidence: ${photoPaths.length} photo(s) attached - ${photoPaths.join(', ')}]`;
    }
    
    connection = await createConnection();
    
    // Use the existing reportStallholder procedure
    await connection.execute(
      'CALL reportStallholder(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        inspectorId,
        parseInt(stallholder_id),
        parseInt(violation_id),
        parseInt(branch_id),
        stall_id ? parseInt(stall_id) : null,
        enhancedEvidence,
        remarks || null,
        parseInt(receipt_number)
      ]
    );
    
    console.log('✅ Violation report with photos submitted successfully');
    console.log('📷 Uploaded photos:', photoPaths);
    
    return res.status(201).json({
      success: true,
      message: 'Violation report with photo evidence submitted successfully',
      receipt_number: receipt_number,
      photos_uploaded: uploadedFiles.length,
      photo_paths: photoPaths
    });
    
  } catch (error) {
    console.error('❌ Error submitting violation report with photos:', error);
    
    // Handle specific error messages from stored procedure
    if (error.message && error.message.includes('Invalid violation_id')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid violation type selected'
      });
    }
    if (error.message && error.message.includes('Invalid stallholder_id')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stallholder ID'
      });
    }
    if (error.message && error.message.includes('No penalty defined')) {
      return res.status(400).json({
        success: false,
        message: 'No penalty defined for this violation type. Please contact administrator.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to submit violation report',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

/**
 * Get stallholder details by ID - Uses stored procedure
 * @route GET /api/mobile/inspector/stallholders/:id
 * @access Protected (Inspector only)
 */
export const getStallholderById = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;
    const staffData = req.user;
    const branchId = staffData.branchId || staffData.branch_id;
    
    console.log('🔍 Inspector fetching stallholder details:', id);
    
    connection = await createConnection();
    
    // Get stallholder with compliance status using stored procedure
    const [stallholderRows] = await connection.execute(
      'CALL sp_getStallholderDetailByIdWithBranch(?, ?)',
      [id, branchId]
    );
    const stallholders = stallholderRows[0];
    
    if (stallholders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stallholder not found or not in your branch'
      });
    }
    
    console.log('✅ Stallholder details fetched');
    
    return res.status(200).json({
      success: true,
      message: 'Stallholder details retrieved successfully',
      data: stallholders[0]
    });
    
  } catch (error) {
    console.error('❌ Error fetching stallholder details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stallholder details',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

