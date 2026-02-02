// ===== COMPLAINT CONTROLLER =====
// Handles all complaint management operations
// Includes CRUD operations, filtering, and statistics

import { createConnection } from '../../config/database.js';
import { getBranchFilter } from '../../middleware/rolePermissions.js';
import { decryptData } from '../../services/encryptionService.js';

// Helper function to decrypt data safely (handles both encrypted and plain text)
const decryptSafe = (value) => {
  if (value === undefined || value === null || value === '') return value;
  try {
    if (typeof value === 'string' && value.includes(':') && value.split(':').length === 3) {
      return decryptData(value);
    }
    return value;
  } catch (error) {
    return value;
  }
};

/**
 * Get all complaints with optional filters
 * @route GET /api/complaints
 * @access Protected (requires authentication)
 */
export const getAllComplaints = async (req, res) => {
  let connection;
  try {
    const { status, search } = req.query;
    const userType = req.user?.userType;

    console.log('📋 Fetching complaints with filters:', { status, search, userType });

    connection = await createConnection();

    // Get branch filter based on user role and business_owner_managers table
    const branchFilter = await getBranchFilter(req, connection);

    // Prepare status and search parameters
    const statusParam = status || 'all';
    const searchParam = search || null;

    let complaints;

    if (branchFilter === null) {
      // System administrator - see all complaints
      console.log('🔍 getAllComplaints - System admin viewing all branches');
      const [records] = await connection.execute(
        'CALL getAllComplaintsDecrypted(?, ?, ?)',
        [null, statusParam, searchParam]
      );
      complaints = records[0];
    } else if (branchFilter.length === 0) {
      // Business owner with no accessible branches
      console.log('⚠️ getAllComplaints - Business owner has no accessible branches');
      complaints = [];
    } else if (branchFilter.length === 1) {
      // Single branch (business manager or owner with one branch)
      console.log(`🔍 getAllComplaints - Fetching for branch: ${branchFilter[0]}`);
      const [records] = await connection.execute(
        'CALL getAllComplaintsDecrypted(?, ?, ?)',
        [branchFilter[0], statusParam, searchParam]
      );
      complaints = records[0];
    } else {
      // Multiple branches (business owner with multiple branches)
      console.log(`🔍 getAllComplaints - Fetching for branches: ${branchFilter.join(', ')}`);
      // Query each branch and combine results
      const allRecords = [];
      for (const branchId of branchFilter) {
        const [records] = await connection.execute(
          'CALL getAllComplaintsDecrypted(?, ?, ?)',
          [branchId, statusParam, searchParam]
        );
        allRecords.push(...records[0]);
      }
      complaints = allRecords;
    }

    console.log(`✅ Found ${complaints.length} complaints`);

    // Decrypt sensitive fields in complaints
    const decryptedComplaints = complaints.map(complaint => ({
      ...complaint,
      sender_name: decryptSafe(complaint.sender_name),
      sender_contact: decryptSafe(complaint.sender_contact),
      sender_email: decryptSafe(complaint.sender_email),
      stallholder_name: decryptSafe(complaint.stallholder_name),
      subject: decryptSafe(complaint.subject),
      description: decryptSafe(complaint.description),
      resolution_notes: decryptSafe(complaint.resolution_notes)
    }));

    res.status(200).json({
      success: true,
      message: 'Complaints retrieved successfully',
      data: decryptedComplaints,
      count: decryptedComplaints.length
    });

  } catch (error) {
    console.error('❌ Error fetching complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get single complaint by ID
 * @route GET /api/complaints/:id
 * @access Protected
 */
export const getComplaintById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    console.log(`📄 Fetching complaint ID: ${id}`);

    connection = await createConnection();

    const [records] = await connection.execute(
      'CALL getComplaintById(?)',
      [id]
    );

    const complaint = records[0][0];

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `Complaint with ID ${id} not found`
      });
    }

    console.log('✅ Complaint found');

    res.status(200).json({
      success: true,
      message: 'Complaint retrieved successfully',
      data: complaint
    });

  } catch (error) {
    console.error('❌ Error fetching complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Create new complaint
 * @route POST /api/complaints
 * @access Protected
 */
export const createComplaint = async (req, res) => {
  let connection;
  try {
    const {
      complaint_type,
      sender_name,
      sender_contact,
      sender_email,
      stallholder_id,
      stall_id,
      branch_id,
      subject,
      description,
      evidence,
      priority = 'medium'
    } = req.body;

    const userType = req.user?.userType;
    const userBranchId = req.user?.branchId;

    console.log('📝 Creating new complaint:', req.body);

    // Validation
    if (!complaint_type || !sender_name || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Complaint type, sender name, subject, and description are required'
      });
    }

    if (!branch_id && !userBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    connection = await createConnection();

    // Use user's branch if not provided
    const finalBranchId = branch_id || userBranchId;

    // Create complaint using stored procedure
    const [result] = await connection.execute(
      'CALL createComplaint(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        complaint_type,
        sender_name,
        sender_contact || null,
        sender_email || null,
        stallholder_id || null,
        stall_id || null,
        finalBranchId,
        subject,
        description,
        evidence || null,
        priority
      ]
    );

    const newComplaintId = result[0][0]?.complaint_id;

    console.log(`✅ Complaint created with ID: ${newComplaintId}`);

    // Fetch the newly created complaint
    const [newComplaint] = await connection.execute(
      'CALL getComplaintById(?)',
      [newComplaintId]
    );

    res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      data: newComplaint[0][0]
    });

  } catch (error) {
    console.error('❌ Error creating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create complaint',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Update complaint (type, subject, description, priority, status)
 * @route PUT /api/complaints/:id
 * @access Protected
 */
export const updateComplaint = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { complaint_type, subject, description, priority, status } = req.body;

    console.log(`📝 Updating complaint ID: ${id}`, req.body);

    // Validation
    if (!complaint_type && !subject && !description && !priority && !status) {
      return res.status(400).json({
        success: false,
        message: 'At least one field is required for update'
      });
    }

    // Validate status if provided
    const validStatuses = ['pending', 'in-progress', 'resolved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
      });
    }

    connection = await createConnection();

    // Check if complaint exists
    const [existing] = await connection.execute(
      'CALL getComplaintById(?)',
      [id]
    );

    if (!existing[0][0]) {
      return res.status(404).json({
        success: false,
        message: `Complaint with ID ${id} not found`
      });
    }

    // Update using stored procedure
    await connection.execute(
      'CALL updateComplaint(?, ?, ?, ?, ?, ?)',
      [
        id,
        complaint_type || null,
        subject || null,
        description || null,
        priority || null,
        status || null
      ]
    );

    console.log('✅ Complaint updated successfully');

    // Fetch updated complaint
    const [updatedComplaint] = await connection.execute(
      'CALL getComplaintById(?)',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      data: updatedComplaint[0][0]
    });

  } catch (error) {
    console.error('❌ Error updating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Resolve complaint
 * @route PUT /api/complaints/:id/resolve
 * @access Protected
 */
export const resolveComplaint = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { resolution_notes, status = 'resolved' } = req.body;

    console.log(`✅ Resolving complaint ID: ${id}`);

    // Validation
    if (!resolution_notes) {
      return res.status(400).json({
        success: false,
        message: 'Resolution notes are required'
      });
    }

    const validStatuses = ['resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    connection = await createConnection();

    // Check if complaint exists
    const [existing] = await connection.execute(
      'CALL getComplaintById(?)',
      [id]
    );

    if (!existing[0][0]) {
      return res.status(404).json({
        success: false,
        message: `Complaint with ID ${id} not found`
      });
    }

    // Resolve using stored procedure
    await connection.execute(
      'CALL resolveComplaint(?, ?, ?)',
      [id, resolution_notes, status]
    );

    console.log('✅ Complaint resolved successfully');

    // Fetch updated complaint
    const [resolvedComplaint] = await connection.execute(
      'CALL getComplaintById(?)',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Complaint resolved successfully',
      data: resolvedComplaint[0][0]
    });

  } catch (error) {
    console.error('❌ Error resolving complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve complaint',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Delete complaint
 * @route DELETE /api/complaints/:id
 * @access Protected (admin or branch manager only)
 */
export const deleteComplaint = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userType = req.user?.userType;

    console.log(`🗑️ Deleting complaint ID: ${id}`);

    // Only system admins, business owners, and business managers can delete
    if (userType !== 'system_administrator' && userType !== 'stall_business_owner' && userType !== 'business_manager') {
      return res.status(403).json({
        success: false,
        message: 'Only system administrators, business owners, and business managers can delete complaints'
      });
    }

    connection = await createConnection();

    // Check if complaint exists
    const [existing] = await connection.execute(
      'CALL getComplaintById(?)',
      [id]
    );

    if (!existing[0][0]) {
      return res.status(404).json({
        success: false,
        message: `Complaint with ID ${id} not found`
      });
    }

    // Delete using stored procedure
    await connection.execute('CALL deleteComplaint(?)', [id]);

    console.log('✅ Complaint deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete complaint',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

export default {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  resolveComplaint,
  deleteComplaint
};

