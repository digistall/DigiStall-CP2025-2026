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

    // Get stallholder info and their stalls using stored procedure
    const [stallsRows] = await connection.execute(
      'CALL sp_getStallholderStallsForDocuments(?)',
      [applicantId]
    );
    const stallholderStalls = stallsRows[0];

    console.log('📊 Query result - stallholderStalls:', stallholderStalls.length, 'found');
    console.log('📊 Stalls data:', JSON.stringify(stallholderStalls, null, 2));

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
    
    // Get document requirements for each branch using stored procedure
    const branchDocRequirements = {};
    for (const branchId of branchIds) {
      const [reqRows] = await connection.execute(
        'CALL sp_getBranchDocRequirementsFull(?)',
        [branchId]
      );
      branchDocRequirements[branchId] = reqRows[0];
    }

    // Get stallholder's uploaded documents using stored procedure
    const stallholderIds = stallholderStalls.map(s => s.stallholder_id);
    const [uploadedRows] = await connection.execute(
      'CALL sp_getStallholderUploadedDocuments(?)',
      [stallholderIds.join(',')]
    );
    const uploadedDocs = uploadedRows[0];

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
            // Upload status and document details
            status: uploadedDoc ? uploadedDoc.verification_status : 'not_uploaded',
            document_id: uploadedDoc?.document_id || null,
            upload_date: uploadedDoc?.upload_date || null,
            file_path: uploadedDoc?.file_path || null,
            original_filename: uploadedDoc?.original_filename || null,
            file_name: uploadedDoc?.original_filename || null,
            mime_type: uploadedDoc?.mime_type || null,
            file_size: uploadedDoc?.file_size || null,
            expiry_date: uploadedDoc?.expiry_date || null,
            days_until_expiry: uploadedDoc?.days_until_expiry || null,
            rejection_reason: uploadedDoc?.rejection_reason || null,
            verified_at: uploadedDoc?.verified_at || null,
            // Add blob_url for image preview
            blob_url: uploadedDoc?.document_id 
              ? `http://68.183.154.125:5001/api/mobile/stallholder/documents/blob/id/${uploadedDoc.document_id}`
              : null
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

    // Get document requirements for the branch using stored procedure
    const [reqRows] = await connection.execute(
      'CALL sp_getBranchDocRequirementsFull(?)',
      [branchId]
    );
    const requirements = reqRows[0];

    // If stallholder_id is provided, get their upload status for each document
    let documentsWithStatus = requirements;
    
    if (stallholderId) {
      const [uploadedRows] = await connection.execute(
        'CALL sp_getStallholderUploadedDocuments(?)',
        [stallholderId]
      );
      const uploadedDocs = uploadedRows[0];

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

    // Upload/update document using stored procedure
    const [uploadRows] = await connection.execute(
      'CALL sp_uploadStallholderDocument(?, ?, ?, ?, ?)',
      [stallholder_id, document_type_id, file.path, file.originalname, file.size]
    );
    const uploadResult = uploadRows[0][0];

    if (uploadResult.action === 'updated') {
      res.status(200).json({
        success: true,
        message: 'Document updated successfully',
        data: {
          document_id: uploadResult.document_id,
          status: 'pending'
        }
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          document_id: uploadResult.document_id,
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
