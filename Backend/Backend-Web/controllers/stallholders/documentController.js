import { createConnection } from '../../config/database.js';

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
    const { document_type_id, is_required = 1, instructions } = req.body;
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
    for (const pair of branchManagerPairs) {
      const [rows] = await connection.execute(
        'CALL setBranchDocumentRequirement(?, ?, ?, ?, ?)',
        [pair.branchId, document_type_id, is_required, instructions, pair.managerId]
      );
      const result = rows[0][0]; // First row of first result set
      totalAffected += result.affected_rows || 0;
      createdRequirements.push({
        branch_id: pair.branchId,
        manager_id: pair.managerId,
        requirement_id: result.requirement_id
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
        [pair.branchId, documentTypeId, is_required, instructions, pair.managerId]
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
        document_name,
        description,
        is_system_default,
        created_at,
        updated_at
      FROM document_types
      ORDER BY document_name ASC
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