import { createConnection } from '../../CONFIG/database.js';

/**
 * Get branch document requirements for a branch manager or business owner
 * Business owners see requirements for ALL their branches (no branch selection needed)
 * Branch managers see requirements for their assigned branch
 */
export const getBranchDocumentRequirements = async (req, res) => {
  let connection;
  try {
    console.log('🔍 User from token:', JSON.stringify(req.user, null, 2));
    
    const userRole = req.user.role;
    const userId = req.user.userId;
    
    connection = await createConnection();
    
    // Business owners manage document requirements for ALL their branches
    if (userRole === 'stall_business_owner') {
      console.log('👤 Business owner accessing document requirements');
      
      // Get all branches owned by this business owner
      const [branches] = await connection.execute(`
        SELECT DISTINCT b.branch_id, b.branch_name, b.area, b.location
        FROM business_owner_managers bom
        INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
        INNER JOIN branch b ON bm.branch_id = b.branch_id
        WHERE bom.business_owner_id = ? AND bom.status = 'Active' AND b.status = 'Active'
        ORDER BY b.branch_name
      `, [userId]);
      
      if (branches.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No branches found for this business owner'
        });
      }
      
      const branchIds = branches.map(b => b.branch_id);
      console.log(`📍 Owner manages ${branchIds.length} branches:`, branchIds);
      
      // Get document requirements for the first branch using stored procedure
      const firstBranchId = branchIds[0];
      const [rows] = await connection.execute('CALL getBranchDocumentRequirements(?)', [firstBranchId]);
      const requirements = rows[0]; // First result set from stored procedure

      console.log(`✅ Found ${requirements.length} requirements for business owner`);
      
      return res.json({
        success: true,
        data: requirements,
        branch_id: firstBranchId,
        managed_branches: branches,
        note: 'Document requirements apply to all your branches'
      });
    }
    
    // Branch managers have a direct branchId
    const branch_id = req.user.branchId || req.user.branch_id || req.params.branchId;
    
    if (!branch_id) {
      console.log('❌ No branch ID found in user object:', req.user);
      return res.status(403).json({
        success: false,
        message: 'Access denied: No branch associated with user',
        debug: { user: req.user }
      });
    }
    
    console.log('🎯 Branch ID detected:', branch_id);
    console.log('📋 Available user fields:', Object.keys(req.user || {}));

    if (!connection) {
      connection = await createConnection();
    }
    
    // Use stored procedure to get branch requirements
    const [rows] = await connection.execute('CALL getBranchDocumentRequirements(?)', [branch_id]);
    const requirements = rows[0]; // First result set from stored procedure

    console.log('✅ Found requirements:', requirements.length);
    
    res.json({
      success: true,
      data: requirements,
      branch_id
    });

  } catch (error) {
    console.error('❌ Get branch requirements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branch document requirements',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Create a new document requirement for a branch
 */
export const createBranchDocumentRequirement = async (req, res) => {
  let connection;
  try {
    const { document_type_id, is_required, instructions } = req.body;
    // Ensure is_required is always a valid integer (default to 1 if not provided or empty)
    const isRequiredValue = (is_required === '' || is_required === null || is_required === undefined) ? 1 : parseInt(is_required, 10) || 1;
    let branch_id = req.user.branchId || req.user.branch_id;
    const userId = req.user.userId || req.user.user_id || req.user.id || req.user.businessManagerId;
    const isBusinessOwner = req.user.role === 'stall_business_owner';

    connection = await createConnection();

    // Business owners: apply to all their branches with correct manager_id for each branch
    let branchManagerPairs = [];
    
    if (isBusinessOwner) {
      // Get branches with their manager IDs
      const [ownerBranches] = await connection.execute(`
        SELECT DISTINCT bm.branch_id, bm.business_manager_id
        FROM business_owner_managers bom
        INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
        INNER JOIN branch b ON bm.branch_id = b.branch_id
        WHERE bom.business_owner_id = ? AND bom.status = 'Active' AND b.status = 'Active'
        ORDER BY bm.branch_id
      `, [userId]);

      if (ownerBranches.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No branches found for business owner'
        });
      }

      branchManagerPairs = ownerBranches.map(b => ({
        branchId: b.branch_id,
        managerId: b.business_manager_id
      }));
    } else {
      // Regular manager: just their branch
      if (!branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No branch associated with user'
        });
      }
      branchManagerPairs = [{ branchId: branch_id, managerId: userId }];
    }

    if (!document_type_id) {
      return res.status(400).json({
        success: false,
        message: 'Document type ID is required'
      });
    }

    // Apply to all branches with correct manager for each
    let totalAffected = 0;
    let createdRequirements = [];
    
    // Verify document type exists
    const [docTypes] = await connection.execute(
      'SELECT document_type_id, type_name FROM document_types WHERE document_type_id = ? AND status = ?',
      [document_type_id, 'Active']
    );
    
    if (docTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive document type'
      });
    }
    
    for (const pair of branchManagerPairs) {
      // Check if requirement already exists for this branch and document type
      const [existing] = await connection.execute(
        'SELECT requirement_id FROM branch_document_requirements WHERE branch_id = ? AND document_type_id = ?',
        [pair.branchId, document_type_id]
      );
      
      let requirementId;
      if (existing.length > 0) {
        // Update existing requirement
        await connection.execute(
          'UPDATE branch_document_requirements SET is_required = ?, instructions = ?, updated_at = NOW() WHERE requirement_id = ?',
          [isRequiredValue, instructions || null, existing[0].requirement_id]
        );
        requirementId = existing[0].requirement_id;
      } else {
        // Insert new requirement
        const [insertResult] = await connection.execute(
          'INSERT INTO branch_document_requirements (branch_id, document_type_id, is_required, instructions, created_by_business_manager, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
          [pair.branchId, document_type_id, isRequiredValue, instructions || null, pair.managerId]
        );
        requirementId = insertResult.insertId;
      }
      
      totalAffected += 1;
      createdRequirements.push({
        branch_id: pair.branchId,
        manager_id: pair.managerId,
        requirement_id: requirementId
      });
    }

    res.json({
      success: true,
      message: `Document requirement created for ${branchManagerPairs.length} branch(es)`,
      data: {
        affected_rows: totalAffected,
        branches_updated: branchManagerPairs.length,
        requirements: createdRequirements,
        document_type_id,
        is_required,
        instructions,
        created_by_role: isBusinessOwner ? 'business_owner' : 'manager'
      }
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Document requirement already exists for this branch'
      });
    }
    
    console.error('❌ Create requirement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create document requirement',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Update a document requirement
 */
export const setBranchDocumentRequirement = async (req, res) => {
  let connection;
  try {
    const { documentTypeId } = req.params;
    const { is_required, instructions } = req.body;
    // Ensure is_required is always a valid integer (default to 1 if not provided or empty)
    const isRequiredValue = (is_required === '' || is_required === null || is_required === undefined) ? 1 : parseInt(is_required, 10) || 1;
    let branch_id = req.user.branchId || req.user.branch_id;
    const userId = req.user.userId || req.user.user_id || req.user.id || req.user.businessManagerId;
    const isBusinessOwner = req.user.role === 'stall_business_owner';

    connection = await createConnection();

    // Business owners: apply to all their branches with correct manager_id
    let branchManagerPairs = [];
    if (isBusinessOwner) {
      const [ownerBranches] = await connection.execute(`
        SELECT DISTINCT bm.branch_id, bm.business_manager_id
        FROM business_owner_managers bom
        INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
        INNER JOIN branch b ON bm.branch_id = b.branch_id
        WHERE bom.business_owner_id = ? AND bom.status = 'Active' AND b.status = 'Active'
        ORDER BY bm.branch_id
      `, [userId]);

      if (ownerBranches.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No branches found for business owner'
        });
      }

      branchManagerPairs = ownerBranches.map(b => ({
        branchId: b.branch_id,
        managerId: b.business_manager_id
      }));
    } else {
      // Regular manager: just their branch
      if (!branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No branch associated with user'
        });
      }
      branchManagerPairs = [{ branchId: branch_id, managerId: userId }];
    }

    // Apply to all branches
    let totalAffected = 0;
    for (const pair of branchManagerPairs) {
      const [rows] = await connection.execute(
        'CALL setBranchDocumentRequirement(?, ?, ?, ?, ?)',
        [pair.branchId, documentTypeId, isRequiredValue, instructions || null, pair.managerId]
      );
      const result = rows[0][0]; // First row of first result set
      totalAffected += result.affected_rows || 0;
    }

    if (totalAffected === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document requirement not found or access denied'
      });
    }

    res.json({
      success: true,
      message: `Document requirement updated for ${branchManagerPairs.length} branch(es)`,
      affected_rows: totalAffected,
      branches_updated: branchManagerPairs.length,
      updated_by_role: isBusinessOwner ? 'business_owner' : 'manager'
    });

  } catch (error) {
    console.error('❌ Update requirement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document requirement',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Delete a document requirement
 * For business owners: deletes the document type from ALL their branches
 * For managers: deletes from their assigned branch only
 */
export const removeBranchDocumentRequirement = async (req, res) => {
  let connection;
  try {
    const { documentTypeId } = req.params;  // This is either requirement_id or document_type_id
    let branch_id = req.user.branchId || req.user.branch_id;
    const userId = req.user.userId || req.user.user_id || req.user.id || req.user.businessManagerId;
    const isBusinessOwner = req.user.role === 'stall_business_owner';

    connection = await createConnection();

    // Business owners: apply to all their branches
    let branchIds = [];
    if (isBusinessOwner) {
      const [ownerBranches] = await connection.execute(`
        SELECT DISTINCT bm.branch_id
        FROM business_owner_managers bom
        INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
        INNER JOIN branch b ON bm.branch_id = b.branch_id
        WHERE bom.business_owner_id = ? AND bom.status = 'Active' AND b.status = 'Active'
        ORDER BY bm.branch_id
      `, [userId]);

      if (ownerBranches.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No branches found for business owner'
        });
      }

      branchIds = ownerBranches.map(b => b.branch_id);
    } else {
      // Regular manager: just their branch
      if (!branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No branch associated with user'
        });
      }
      branchIds = [branch_id];
    }

    // Get the document_type_id from the requirement if needed
    const [reqInfo] = await connection.execute(
      'SELECT document_type_id FROM branch_document_requirements WHERE requirement_id = ? LIMIT 1',
      [documentTypeId]
    );
    
    const docTypeId = reqInfo.length > 0 ? reqInfo[0].document_type_id : documentTypeId;

    // Apply to all branches
    let totalAffected = 0;
    for (const branchId of branchIds) {
      const [rows] = await connection.execute(
        'CALL removeBranchDocumentRequirement(?, ?)',
        [branchId, docTypeId]
      );
      const result = rows[0][0]; // First row of first result set
      totalAffected += result.affected_rows || 0;
    }

    if (totalAffected === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document requirement not found or access denied'
      });
    }

    res.json({
      success: true,
      message: `Document requirement deleted from ${branchIds.length} branch(es)`,
      affected_rows: totalAffected,
      branches_updated: branchIds.length
    });

  } catch (error) {
    console.error('❌ Delete requirement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document requirement',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Bulk update document requirements
 */
export const bulkUpdateDocumentRequirements = async (req, res) => {
  let connection;
  try {
    const { requirements } = req.body;
    const branch_id = req.user.branchId || req.user.branch_id;
    const created_by = req.user.userId || req.user.user_id || req.user.id;

    if (!branch_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No branch associated with user'
      });
    }

    if (!Array.isArray(requirements)) {
      return res.status(400).json({
        success: false,
        message: 'Requirements must be an array'
      });
    }

    connection = await createConnection();
    await connection.beginTransaction();

    try {
      // Clear existing requirements for this branch
      await connection.execute(
        'DELETE FROM branch_document_requirements WHERE branch_id = ?',
        [branch_id]
      );

      // Insert new requirements
      for (const req_item of requirements) {
        if (req_item.document_name) {
          await connection.execute(`
            INSERT INTO branch_document_requirements 
            (branch_id, document_name, description, is_required, created_by) 
            VALUES (?, ?, ?, ?, ?)
          `, [
            branch_id,
            req_item.document_name,
            req_item.description || null,
            req_item.is_required || 1,
            created_by
          ]);
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Document requirements updated successfully',
        count: requirements.length
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document requirements',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get all available document types
 */
export const getAllDocumentTypes = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    const [documentTypes] = await connection.execute(`
      SELECT 
        document_type_id,
        type_name,
        description,
        category,
        is_system_default,
        display_order,
        status,
        created_at
      FROM document_types
      WHERE status = 'Active'
      ORDER BY display_order ASC, type_name ASC
    `);

    res.json({
      success: true,
      data: documentTypes
    });

  } catch (error) {
    console.error('❌ Get document types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document types',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// ============================================================
// DOCUMENT SUBMISSION REVIEW FUNCTIONS (Branch Manager)
// ============================================================

export const getPendingDocumentSubmissions = async (req, res) => {
  let connection;
  try {
    const userRole = req.user.role;
    const userId = req.user.userId;
    
    connection = await createConnection();
    
    // Determine branch ID based on user role
    let branchIds = [];
    
    if (userRole === 'stall_business_owner') {
      // Business owners can see all their branches
      const [branches] = await connection.execute(`
        SELECT DISTINCT b.branch_id
        FROM business_owner_managers bom
        INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
        INNER JOIN branch b ON bm.branch_id = b.branch_id
        WHERE bom.business_owner_id = ? AND bom.status = 'Active' AND b.status = 'Active'
      `, [userId]);
      
      if (branches.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No branches found for this business owner'
        });
      }
      branchIds = branches.map(b => b.branch_id);
    } else {
      // Branch managers see their assigned branch
      const branch_id = req.user.branchId || req.user.branch_id;
      if (!branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No branch associated with user'
        });
      }
      branchIds = [branch_id];
    }
    
    // Fetch pending submissions for all accessible branches
    let allSubmissions = [];
    for (const branchId of branchIds) {
      const [rows] = await connection.execute('CALL sp_getPendingDocumentSubmissions(?)', [branchId]);
      if (rows[0] && rows[0].length > 0) {
        allSubmissions = allSubmissions.concat(rows[0]);
      }
    }
    
    // Sort by uploaded_at descending
    allSubmissions.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
    
    res.json({
      success: true,
      data: allSubmissions,
      count: allSubmissions.length,
      branches: branchIds
    });
    
  } catch (error) {
    console.error('❌ Get pending document submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending document submissions',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get all document submissions for branch with filtering and pagination
 */
export const getAllDocumentSubmissions = async (req, res) => {
  let connection;
  try {
    const userRole = req.user.role;
    const userId = req.user.userId;
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    connection = await createConnection();
    
    // Determine branch ID based on user role
    let branchIds = [];
    
    if (userRole === 'stall_business_owner') {
      const [branches] = await connection.execute(`
        SELECT DISTINCT b.branch_id
        FROM business_owner_managers bom
        INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
        INNER JOIN branch b ON bm.branch_id = b.branch_id
        WHERE bom.business_owner_id = ? AND bom.status = 'Active' AND b.status = 'Active'
      `, [userId]);
      
      if (branches.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No branches found for this business owner'
        });
      }
      branchIds = branches.map(b => b.branch_id);
    } else {
      const branch_id = req.user.branchId || req.user.branch_id;
      if (!branch_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: No branch associated with user'
        });
      }
      branchIds = [branch_id];
    }
    
    // Fetch submissions for all accessible branches
    let allSubmissions = [];
    for (const branchId of branchIds) {
      const [rows] = await connection.execute(
        'CALL sp_getAllDocumentSubmissionsForBranch(?, ?, ?, ?)', 
        [branchId, status, parseInt(limit), offset]
      );
      if (rows[0] && rows[0].length > 0) {
        allSubmissions = allSubmissions.concat(rows[0]);
      }
    }
    
    // Sort by uploaded_at descending
    allSubmissions.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
    
    res.json({
      success: true,
      data: allSubmissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allSubmissions.length
      },
      filter: status
    });
    
  } catch (error) {
    console.error('❌ Get all document submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document submissions',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get document submission counts for dashboard statistics
 */
export const getDocumentSubmissionCounts = async (req, res) => {
  let connection;
  try {
    const userRole = req.user.role;
    const userId = req.user.userId;
    
    connection = await createConnection();
    
    // Determine branch ID based on user role
    let branchIds = [];
    
    if (userRole === 'stall_business_owner') {
      const [branches] = await connection.execute(`
        SELECT DISTINCT b.branch_id
        FROM business_owner_managers bom
        INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
        INNER JOIN branch b ON bm.branch_id = b.branch_id
        WHERE bom.business_owner_id = ? AND bom.status = 'Active' AND b.status = 'Active'
      `, [userId]);
      
      branchIds = branches.map(b => b.branch_id);
    } else {
      const branch_id = req.user.branchId || req.user.branch_id;
      if (branch_id) branchIds = [branch_id];
    }
    
    if (branchIds.length === 0) {
      return res.json({
        success: true,
        data: { total: 0, pending_count: 0, approved_count: 0, rejected_count: 0 }
      });
    }
    
    // Aggregate counts across all branches
    let totals = { total: 0, pending_count: 0, approved_count: 0, rejected_count: 0 };
    
    for (const branchId of branchIds) {
      const [rows] = await connection.execute('CALL sp_getDocumentSubmissionCounts(?)', [branchId]);
      if (rows[0] && rows[0][0]) {
        totals.total += parseInt(rows[0][0].total) || 0;
        totals.pending_count += parseInt(rows[0][0].pending_count) || 0;
        totals.approved_count += parseInt(rows[0][0].approved_count) || 0;
        totals.rejected_count += parseInt(rows[0][0].rejected_count) || 0;
      }
    }
    
    res.json({
      success: true,
      data: totals
    });
    
  } catch (error) {
    console.error('❌ Get document submission counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document submission counts',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get a specific document submission by ID
 */
export const getDocumentSubmissionById = async (req, res) => {
  let connection;
  try {
    const { submissionId } = req.params;
    
    connection = await createConnection();
    
    const [rows] = await connection.execute('CALL sp_getDocumentSubmissionById(?)', [submissionId]);
    
    if (!rows[0] || rows[0].length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document submission not found'
      });
    }
    
    res.json({
      success: true,
      data: rows[0][0]
    });
    
  } catch (error) {
    console.error('❌ Get document submission by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document submission',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get document submission BLOB data (for viewing/downloading)
 */
export const getDocumentSubmissionBlob = async (req, res) => {
  let connection;
  try {
    const { submissionId } = req.params;
    
    connection = await createConnection();
    
    const [rows] = await connection.execute('CALL sp_getDocumentSubmissionBlobById(?)', [submissionId]);
    
    if (!rows[0] || rows[0].length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    const doc = rows[0][0];
    
    // If document_data exists (BLOB), return it as binary
    if (doc.document_data) {
      res.set({
        'Content-Type': doc.file_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${doc.file_name}"`,
        'Cache-Control': 'public, max-age=3600'
      });
      return res.send(doc.document_data);
    }
    
    // Otherwise return metadata with file_url for external retrieval
    res.json({
      success: true,
      data: {
        submission_id: doc.submission_id,
        file_url: doc.file_url,
        file_name: doc.file_name,
        file_type: doc.file_type,
        file_size: doc.file_size,
        document_name: doc.document_name
      }
    });
    
  } catch (error) {
    console.error('❌ Get document submission blob error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Review (approve/reject) a document submission
 */
export const reviewDocumentSubmission = async (req, res) => {
  let connection;
  try {
    const { submissionId } = req.params;
    const { status, rejection_reason } = req.body;
    const reviewedBy = req.user.userId || req.user.businessManagerId || req.user.id;
    
    // Validate status
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected"'
      });
    }
    
    // Rejection reason is required when rejecting
    if (status === 'rejected' && !rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when rejecting a document'
      });
    }
    
    connection = await createConnection();
    
    const [rows] = await connection.execute(
      'CALL sp_reviewDocumentSubmission(?, ?, ?, ?)',
      [submissionId, status, rejection_reason || null, reviewedBy]
    );
    
    const result = rows[0][0];
    
    if (result.success === 0) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
    
    res.json({
      success: true,
      message: result.message,
      data: {
        submission_id: result.submission_id,
        new_status: result.new_status,
        reviewed_by: reviewedBy
      }
    });
    
  } catch (error) {
    console.error('❌ Review document submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review document submission',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get all documents for a specific stallholder (from stallholder_documents table)
 */
export const getStallholderDocumentSubmissions = async (req, res) => {
  let connection;
  try {
    const { stallholderId } = req.params;
    
    connection = await createConnection();
    
    // Use direct query instead of stored procedure for compatibility
    // Calculate file_size from BLOB data length since table doesn't have file_size column
    const [rows] = await connection.execute(`
      SELECT 
        sd.document_id,
        sd.stallholder_id,
        sd.document_type,
        sd.document_name,
        sd.document_mime_type,
        sd.verification_status,
        sd.verified_by,
        sd.verified_at,
        sd.remarks,
        sd.created_at,
        LENGTH(sd.document_data) as file_size,
        sh.full_name as stallholder_name,
        sh.full_name as business_name
      FROM stallholder_documents sd
      LEFT JOIN stallholder sh ON sd.stallholder_id = sh.stallholder_id
      WHERE sd.stallholder_id = ?
      ORDER BY sd.created_at DESC
    `, [stallholderId]);
    
    // Map the results to match expected frontend format
    const documents = (rows || []).map(doc => ({
      ...doc,
      submission_id: doc.document_id,
      file_name: doc.document_name,
      uploaded_at: doc.created_at,
      status: doc.verification_status === 'Approved' ? 'approved' : 
              doc.verification_status === 'Rejected' ? 'rejected' : 'pending'
    }));
    
    res.json({
      success: true,
      data: documents,
      stallholder_id: stallholderId
    });
    
  } catch (error) {
    console.error('❌ Get stallholder documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stallholder documents',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Review/verify a stallholder document (approve or reject)
 * Uses stored procedure sp_reviewStallholderDocument
 */
export const reviewStallholderDocument = async (req, res) => {
  let connection;
  try {
    const { documentId } = req.params;
    const { status, rejection_reason } = req.body;
    const reviewedBy = req.user?.userId || req.user?.business_manager_id || req.user?.id || null;
    
    // Map frontend status to database ENUM values: 'Pending', 'Approved', 'Rejected'
    const statusMap = {
      'approved': 'Approved',
      'rejected': 'Rejected',
      'pending': 'Pending'
    };
    const dbStatus = statusMap[status.toLowerCase()] || status;
    
    connection = await createConnection();
    
    // Use stored procedure to review document
    const [rows] = await connection.execute(
      'CALL sp_reviewStallholderDocument(?, ?, ?, ?)',
      [documentId, dbStatus, rejection_reason || null, reviewedBy]
    );
    
    const result = rows[0]?.[0];
    
    if (result?.success) {
      res.json({
        success: true,
        message: result.message,
        document_id: documentId,
        new_status: status
      });
    } else {
      res.status(400).json({
        success: false,
        message: result?.message || 'Failed to review document'
      });
    }
    
  } catch (error) {
    console.error('❌ Review stallholder document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review document',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get document file for viewing/downloading (from stallholder_documents table)
 */
export const getStallholderDocumentFile = async (req, res) => {
  let connection;
  try {
    const { documentId } = req.params;
    
    connection = await createConnection();
    
    // Use direct query instead of stored procedure since table structure doesn't match
    const [rows] = await connection.execute(`
      SELECT 
        sd.document_id,
        sd.stallholder_id,
        sd.document_type,
        sd.document_name,
        sd.document_mime_type,
        sd.verification_status,
        sd.verified_by,
        sd.verified_at,
        sd.remarks,
        sd.created_at,
        sh.full_name as stallholder_name
      FROM stallholder_documents sd
      LEFT JOIN stallholder sh ON sd.stallholder_id = sh.stallholder_id
      WHERE sd.document_id = ?
    `, [documentId]);
    
    const doc = rows[0];
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Return document metadata
    res.json({
      success: true,
      data: {
        document_id: doc.document_id,
        stallholder_id: doc.stallholder_id,
        stallholder_name: doc.stallholder_name,
        document_type: doc.document_type,
        document_name: doc.document_name,
        file_name: doc.document_name,
        mime_type: doc.document_mime_type,
        verification_status: doc.verification_status,
        verified_by: doc.verified_by,
        verified_at: doc.verified_at,
        remarks: doc.remarks,
        created_at: doc.created_at
      }
    });
    
  } catch (error) {
    console.error('❌ Get stallholder document file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document file',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

/**
 * Get stallholder document blob by document_id
 * Serves the actual binary file content for preview/download
 */
export const getStallholderDocumentBlob = async (req, res) => {
  let connection;
  try {
    const { documentId } = req.params;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    console.log(`📄 Fetching document blob for document_id: ${documentId}`);
    
    connection = await createConnection();
    
    // Get the document with its blob data
    // stallholder_documents: document_type is VARCHAR
    // document_types: document_name is the type name
    const [rows] = await connection.execute(`
      SELECT 
        sd.document_id,
        sd.document_name,
        sd.document_data,
        sd.document_mime_type,
        sd.document_type
      FROM stallholder_documents sd
      WHERE sd.document_id = ?
    `, [documentId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const doc = rows[0];
    
    // Check if document has blob data
    if (!doc.document_data) {
      return res.status(404).json({
        success: false,
        message: 'Document file data not found'
      });
    }

    // Determine content type from mime_type or filename extension
    let contentType = doc.document_mime_type || 'application/octet-stream';
    if (!doc.document_mime_type && doc.document_name) {
      const ext = doc.document_name.toLowerCase().split('.').pop();
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'pdf': 'application/pdf'
      };
      contentType = mimeTypes[ext] || 'application/octet-stream';
    }

    console.log(`✅ Serving document: ${doc.document_name}, type: ${contentType}, size: ${doc.document_data.length} bytes`);
    
    // Set headers for binary response
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', doc.document_data.length);
    res.setHeader('Content-Disposition', `inline; filename="${doc.document_name || 'document'}"`);
    
    // Send the binary data
    res.send(doc.document_data);
    
  } catch (error) {
    console.error('❌ Get stallholder document blob error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document blob',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Legacy DocumentController object for backward compatibility
const DocumentController = {
  getAllDocumentTypes: async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Legacy endpoint - use direct branch management instead'
    });
  },
  createDocumentType: async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Legacy endpoint - use direct branch management instead'
    });
  },
  updateDocumentType: async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Legacy endpoint - use direct branch management instead'
    });
  },
  deleteDocumentType: async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Legacy endpoint - use direct branch management instead'
    });
  },
  getStallholderDocuments: async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Legacy endpoint - use direct branch management instead'
    });
  },
  getBranchDocumentRequirements,
  createBranchDocumentRequirement,
  setBranchDocumentRequirement,
  removeBranchDocumentRequirement,
  bulkUpdateDocumentRequirements,
  getAllDocumentTypes
};

export default DocumentController;

