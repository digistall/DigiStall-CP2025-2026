import { createConnection } from '../../config/database.js';

/**
 * Get branch document requirements for a branch manager
 * Auto-detects branch from JWT token
 */
export const getBranchDocumentRequirements = async (req, res) => {
  let connection;
  try {
    console.log('🔍 User from token:', JSON.stringify(req.user, null, 2));
    
    // Get branch_id from authenticated user (try multiple field names)
    const branch_id = req.user.branchId || req.user.branch_id || req.params.branchId;
    
    console.log('🎯 Branch ID detected:', branch_id);
    console.log('📋 Available user fields:', Object.keys(req.user || {}));
    
    if (!branch_id) {
      console.log('❌ No branch ID found in user object:', req.user);
      return res.status(403).json({
        success: false,
        message: 'Access denied: No branch associated with user',
        debug: { user: req.user }
      });
    }

    connection = await createConnection();
    
    const [requirements] = await connection.execute(`
      SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        dt.document_type_id,
        dt.document_name,
        dt.description,
        bdr.is_required,
        bdr.instructions,
        bdr.created_by_manager,
        bdr.created_at,
        bdr.updated_at,
        CONCAT(bm.first_name, ' ', bm.last_name) as created_by_name
      FROM branch_document_requirements bdr
      INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
      LEFT JOIN branch_manager bm ON bdr.created_by_manager = bm.branch_manager_id
      WHERE bdr.branch_id = ?
      ORDER BY dt.document_name ASC
    `, [branch_id]);

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
    const branch_id = req.user.branchId || req.user.branch_id;
    const created_by_manager = req.user.userId || req.user.user_id || req.user.id || req.user.branch_manager_id;

    if (!branch_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No branch associated with user'
      });
    }

    if (!document_type_id) {
      return res.status(400).json({
        success: false,
        message: 'Document type ID is required'
      });
    }

    connection = await createConnection();
    
    // Check if this document type already exists for this branch
    const [existing] = await connection.execute(`
      SELECT requirement_id FROM branch_document_requirements 
      WHERE branch_id = ? AND document_type_id = ?
    `, [branch_id, document_type_id]);

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Document requirement already exists for this branch'
      });
    }
    
    const [result] = await connection.execute(`
      INSERT INTO branch_document_requirements 
      (branch_id, document_type_id, is_required, instructions, created_by_manager) 
      VALUES (?, ?, ?, ?, ?)
    `, [branch_id, document_type_id, is_required, instructions, created_by_manager]);

    res.json({
      success: true,
      message: 'Document requirement created successfully',
      data: {
        requirement_id: result.insertId,
        branch_id,
        document_type_id,
        is_required,
        instructions,
        created_by_manager
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
    const branch_id = req.user.branchId || req.user.branch_id;

    if (!branch_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No branch associated with user'
      });
    }

    connection = await createConnection();
    
    const [result] = await connection.execute(`
      UPDATE branch_document_requirements 
      SET is_required = ?, instructions = ?, updated_at = NOW()
      WHERE document_type_id = ? AND branch_id = ?
    `, [is_required, instructions, documentTypeId, branch_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document requirement not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Document requirement updated successfully'
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
 */
export const removeBranchDocumentRequirement = async (req, res) => {
  let connection;
  try {
    const { documentTypeId } = req.params;
    const branch_id = req.user.branchId || req.user.branch_id;

    if (!branch_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No branch associated with user'
      });
    }

    connection = await createConnection();
    
    const [result] = await connection.execute(`
      DELETE FROM branch_document_requirements 
      WHERE document_type_id = ? AND branch_id = ?
    `, [documentTypeId, branch_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document requirement not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Document requirement deleted successfully'
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