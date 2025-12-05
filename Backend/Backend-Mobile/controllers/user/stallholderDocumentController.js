// ===== MOBILE STALLHOLDER DOCUMENT CONTROLLER =====
// Handles document requirements and uploads for stallholders in mobile app

import { createConnection } from '../../config/database.js';

/**
 * Get all stalls owned by the stallholder with document requirements grouped by branch/business owner
 * This endpoint returns stalls with their respective document requirements set by each business owner
 */
export const getStallholderStallsWithDocuments = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const applicantId = req.params.applicantId || req.user?.userId;
    
    if (!applicantId) {
      return res.status(400).json({
        success: false,
        message: 'Applicant ID is required'
      });
    }

    console.log('📄 Fetching stallholder stalls with documents for applicant:', applicantId);

    // Get stallholder info and their stalls from the stallholder table
    const [stallholderStalls] = await connection.execute(`
      SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.business_name as stallholder_business_name,
        sh.business_type as stallholder_business_type,
        sh.branch_id,
        sh.stall_id,
        sh.contract_status,
        sh.compliance_status,
        s.stall_name,
        s.stall_number,
        s.size,
        s.price,
        s.price_type,
        b.branch_name,
        b.area as branch_area,
        b.location as branch_location,
        bo.business_owner_id,
        COALESCE(u.first_name, '') as owner_first_name,
        COALESCE(u.last_name, '') as owner_last_name,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as business_owner_name
      FROM stallholder sh
      INNER JOIN stall s ON sh.stall_id = s.stall_id
      INNER JOIN branch b ON sh.branch_id = b.branch_id
      LEFT JOIN business_manager bm ON b.branch_id = bm.branch_id AND bm.status = 'Active'
      LEFT JOIN business_owner_managers bom ON bm.business_manager_id = bom.business_manager_id AND bom.status = 'Active'
      LEFT JOIN business_owner bo ON bom.business_owner_id = bo.business_owner_id
      LEFT JOIN user u ON bo.user_id = u.user_id
      WHERE sh.applicant_id = ? AND sh.contract_status = 'Active'
      ORDER BY b.branch_name, s.stall_name
    `, [applicantId]);

    if (stallholderStalls.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active stalls found for this stallholder',
        data: {
          stalls: [],
          grouped_by_branch: []
        }
      });
    }

    // Get unique branch IDs from the stallholder's stalls
    const branchIds = [...new Set(stallholderStalls.map(s => s.branch_id))];
    
    // Get document requirements for each branch
    const branchDocRequirements = {};
    for (const branchId of branchIds) {
      const [requirements] = await connection.execute(`
        SELECT 
          bdr.requirement_id,
          bdr.branch_id,
          bdr.document_type_id,
          bdr.is_required,
          bdr.instructions,
          dt.document_name,
          dt.description as document_description
        FROM branch_document_requirements bdr
        INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
        WHERE bdr.branch_id = ?
        ORDER BY bdr.is_required DESC, dt.document_name ASC
      `, [branchId]);
      
      branchDocRequirements[branchId] = requirements;
    }

    // Get stallholder's uploaded documents
    const stallholderIds = stallholderStalls.map(s => s.stallholder_id);
    const [uploadedDocs] = await connection.execute(`
      SELECT 
        sd.document_id,
        sd.stallholder_id,
        sd.document_type_id,
        sd.file_path,
        sd.original_filename,
        sd.upload_date,
        sd.verification_status,
        sd.verified_at,
        sd.expiry_date,
        sd.rejection_reason,
        DATEDIFF(sd.expiry_date, CURDATE()) as days_until_expiry
      FROM stallholder_documents sd
      WHERE sd.stallholder_id IN (${stallholderIds.map(() => '?').join(',')})
      ORDER BY sd.upload_date DESC
    `, stallholderIds);

    // Create a map of uploaded documents by stallholder_id and document_type_id
    const uploadedDocsMap = {};
    uploadedDocs.forEach(doc => {
      const key = `${doc.stallholder_id}_${doc.document_type_id}`;
      if (!uploadedDocsMap[key] || new Date(doc.upload_date) > new Date(uploadedDocsMap[key].upload_date)) {
        uploadedDocsMap[key] = doc;
      }
    });

    // Group stalls by branch with their document requirements
    const groupedByBranch = [];
    const branchMap = new Map();

    stallholderStalls.forEach(stall => {
      if (!branchMap.has(stall.branch_id)) {
        branchMap.set(stall.branch_id, {
          branch_id: stall.branch_id,
          branch_name: stall.branch_name,
          branch_area: stall.branch_area,
          branch_location: stall.branch_location,
          business_owner_id: stall.business_owner_id,
          business_owner_name: stall.business_owner_name?.trim() || 'Business Owner',
          stalls: [],
          document_requirements: []
        });
      }
      
      const branch = branchMap.get(stall.branch_id);
      
      // Add stall to branch
      branch.stalls.push({
        stallholder_id: stall.stallholder_id,
        stall_id: stall.stall_id,
        stall_name: stall.stall_name,
        stall_number: stall.stall_number,
        size: stall.size,
        price: stall.price,
        price_type: stall.price_type,
        business_name: stall.stallholder_business_name,
        business_type: stall.stallholder_business_type,
        contract_status: stall.contract_status,
        compliance_status: stall.compliance_status
      });

      // Add document requirements with upload status
      if (branchDocRequirements[stall.branch_id] && branch.document_requirements.length === 0) {
        branch.document_requirements = branchDocRequirements[stall.branch_id].map(req => {
          const uploadKey = `${stall.stallholder_id}_${req.document_type_id}`;
          const uploadedDoc = uploadedDocsMap[uploadKey];
          
          return {
            requirement_id: req.requirement_id,
            document_type_id: req.document_type_id,
            document_name: req.document_name,
            description: req.document_description,
            is_required: req.is_required,
            instructions: req.instructions,
            // Upload status
            status: uploadedDoc ? uploadedDoc.verification_status : 'not_uploaded',
            upload_date: uploadedDoc?.upload_date || null,
            file_path: uploadedDoc?.file_path || null,
            original_filename: uploadedDoc?.original_filename || null,
            expiry_date: uploadedDoc?.expiry_date || null,
            days_until_expiry: uploadedDoc?.days_until_expiry || null,
            rejection_reason: uploadedDoc?.rejection_reason || null,
            verified_at: uploadedDoc?.verified_at || null
          };
        });
      }
    });

    // Convert map to array
    branchMap.forEach(branch => {
      groupedByBranch.push(branch);
    });

    console.log(`✅ Found ${stallholderStalls.length} stalls across ${groupedByBranch.length} branches`);

    res.status(200).json({
      success: true,
      message: 'Stallholder stalls with documents fetched successfully',
      data: {
        total_stalls: stallholderStalls.length,
        total_branches: groupedByBranch.length,
        stalls: stallholderStalls,
        grouped_by_branch: groupedByBranch
      }
    });

  } catch (error) {
    console.error('❌ Error fetching stallholder stalls with documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stallholder stalls with documents',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

/**
 * Get document requirements for a specific branch
 */
export const getBranchDocumentRequirements = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const { branchId } = req.params;
    const stallholderId = req.query.stallholder_id;
    
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    console.log('📄 Fetching document requirements for branch:', branchId);

    // Get document requirements for the branch
    const [requirements] = await connection.execute(`
      SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        bdr.document_type_id,
        bdr.is_required,
        bdr.instructions,
        dt.document_name,
        dt.description as document_description,
        b.branch_name
      FROM branch_document_requirements bdr
      INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
      INNER JOIN branch b ON bdr.branch_id = b.branch_id
      WHERE bdr.branch_id = ?
      ORDER BY bdr.is_required DESC, dt.document_name ASC
    `, [branchId]);

    // If stallholder_id is provided, get their upload status for each document
    let documentsWithStatus = requirements;
    
    if (stallholderId) {
      const [uploadedDocs] = await connection.execute(`
        SELECT 
          sd.document_type_id,
          sd.file_path,
          sd.original_filename,
          sd.upload_date,
          sd.verification_status,
          sd.expiry_date,
          sd.rejection_reason,
          DATEDIFF(sd.expiry_date, CURDATE()) as days_until_expiry
        FROM stallholder_documents sd
        WHERE sd.stallholder_id = ?
        ORDER BY sd.upload_date DESC
      `, [stallholderId]);

      // Create upload map
      const uploadMap = {};
      uploadedDocs.forEach(doc => {
        if (!uploadMap[doc.document_type_id]) {
          uploadMap[doc.document_type_id] = doc;
        }
      });

      // Merge requirements with upload status
      documentsWithStatus = requirements.map(req => ({
        ...req,
        status: uploadMap[req.document_type_id]?.verification_status || 'not_uploaded',
        upload_date: uploadMap[req.document_type_id]?.upload_date || null,
        file_path: uploadMap[req.document_type_id]?.file_path || null,
        original_filename: uploadMap[req.document_type_id]?.original_filename || null,
        expiry_date: uploadMap[req.document_type_id]?.expiry_date || null,
        days_until_expiry: uploadMap[req.document_type_id]?.days_until_expiry || null,
        rejection_reason: uploadMap[req.document_type_id]?.rejection_reason || null
      }));
    }

    res.status(200).json({
      success: true,
      message: 'Document requirements fetched successfully',
      data: documentsWithStatus
    });

  } catch (error) {
    console.error('❌ Error fetching branch document requirements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document requirements',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

/**
 * Upload a document for stallholder
 */
export const uploadStallholderDocument = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const { stallholder_id, document_type_id } = req.body;
    
    if (!stallholder_id || !document_type_id) {
      return res.status(400).json({
        success: false,
        message: 'Stallholder ID and Document Type ID are required'
      });
    }

    // File handling would be done here - for now we'll handle the basic flow
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('📤 Uploading document for stallholder:', stallholder_id, 'type:', document_type_id);

    // Check if document already exists, update if so
    const [existing] = await connection.execute(`
      SELECT document_id FROM stallholder_documents 
      WHERE stallholder_id = ? AND document_type_id = ?
    `, [stallholder_id, document_type_id]);

    if (existing.length > 0) {
      // Update existing document
      await connection.execute(`
        UPDATE stallholder_documents 
        SET file_path = ?, original_filename = ?, file_size = ?,
            upload_date = NOW(), verification_status = 'pending',
            verified_by = NULL, verified_at = NULL, rejection_reason = NULL
        WHERE stallholder_id = ? AND document_type_id = ?
      `, [file.path, file.originalname, file.size, stallholder_id, document_type_id]);

      res.status(200).json({
        success: true,
        message: 'Document updated successfully',
        data: {
          document_id: existing[0].document_id,
          status: 'pending'
        }
      });
    } else {
      // Insert new document
      const [result] = await connection.execute(`
        INSERT INTO stallholder_documents 
        (stallholder_id, document_type_id, file_path, original_filename, file_size, verification_status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `, [stallholder_id, document_type_id, file.path, file.originalname, file.size]);

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          document_id: result.insertId,
          status: 'pending'
        }
      });
    }

  } catch (error) {
    console.error('❌ Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

export default {
  getStallholderStallsWithDocuments,
  getBranchDocumentRequirements,
  uploadStallholderDocument
};
