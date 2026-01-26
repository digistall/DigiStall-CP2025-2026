// =============================================
// APPLICANT DOCUMENT BLOB CONTROLLER
// =============================================
// Purpose: Handle applicant documents stored as BLOB in database
// For cloud deployment (DigitalOcean) - no local file storage
// Features: Upload, Get, Delete, Update (all as base64/BLOB)
// Max: 5MB per document, Images and PDFs allowed
// =============================================

import { createConnection } from '../../config/database.js'

// =============================================
// UPLOAD APPLICANT DOCUMENT AS BLOB
// =============================================
export async function uploadApplicantDocumentBlob(req, res) {
  let connection
  
  try {
    const { 
      applicant_id, 
      business_owner_id, 
      branch_id,
      document_type_id,
      document_data, 
      mime_type, 
      file_name,
      expiry_date,
      notes
    } = req.body
    
    // Validate required fields
    if (!applicant_id || !business_owner_id || !document_type_id || !document_data) {
      return res.status(400).json({
        success: false,
        message: 'applicant_id, business_owner_id, document_type_id, and document_data (base64) are required'
      })
    }
    
    // Validate mime type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf']
    const actualMimeType = mime_type || 'image/jpeg'
    if (!allowedMimeTypes.includes(actualMimeType)) {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, PNG, GIF images and PDF files are allowed'
      })
    }
    
    // Convert base64 to buffer
    const base64Data = document_data.replace(/^data:[^;]+;base64,/, '')
    const documentBuffer = Buffer.from(base64Data, 'base64')
    
    // Check file size (5MB limit for documents)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (documentBuffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Document size exceeds 5MB limit'
      })
    }
    
    connection = await createConnection()
    
    // Verify applicant exists using stored procedure
    const [applicantRows] = await connection.execute(
      'CALL sp_checkApplicantExists(?)',
      [applicant_id]
    )
    const applicants = applicantRows[0]
    
    if (applicants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      })
    }
    
    // Generate filename for reference
    const timestamp = Date.now()
    const extension = actualMimeType === 'application/pdf' ? 'pdf' : actualMimeType.split('/')[1]
    const generatedFileName = file_name || `applicant_${applicant_id}_doc_${document_type_id}_${timestamp}.${extension}`
    const virtualFilePath = `/api/applicants/documents/blob/${applicant_id}/${document_type_id}`
    
    // Check if document already exists for this applicant/business owner/document type using stored procedure
    const [existingRows] = await connection.execute(
      'CALL sp_checkExistingApplicantDocument(?, ?, ?)',
      [applicant_id, business_owner_id, document_type_id]
    )
    const existingDocs = existingRows[0]
    
    let documentId
    let isUpdate = false
    
    if (existingDocs.length > 0) {
      // Update existing document using stored procedure
      documentId = existingDocs[0].document_id
      isUpdate = true
      
      await connection.execute(
        'CALL sp_updateApplicantDocumentBlob(?, ?, ?, ?, ?, ?, ?, ?)',
        [documentId, virtualFilePath, generatedFileName, documentBuffer.length, actualMimeType, documentBuffer, 
         expiry_date || null, notes || null]
      )
    } else {
      // Insert new document using stored procedure
      const [insertRows] = await connection.execute(
        'CALL sp_insertApplicantDocumentBlob(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [applicant_id, business_owner_id, branch_id || null, document_type_id,
         virtualFilePath, generatedFileName, documentBuffer.length, actualMimeType,
         documentBuffer, expiry_date || null, notes || null]
      )
      documentId = insertRows[0][0].document_id
    }
    
    res.status(200).json({
      success: true,
      message: isUpdate ? 'Document updated successfully' : 'Document uploaded successfully',
      data: {
        document_id: documentId,
        applicant_id: parseInt(applicant_id),
        business_owner_id: parseInt(business_owner_id),
        document_type_id: parseInt(document_type_id),
        file_path: virtualFilePath,
        file_name: generatedFileName,
        mime_type: actualMimeType,
        size_bytes: documentBuffer.length,
        storage_type: 'blob',
        verification_status: 'pending',
        is_update: isUpdate
      }
    })
    
  } catch (error) {
    console.error('❌ Error uploading applicant document blob:', error)
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// GET APPLICANT DOCUMENT BLOB (returns binary)
// =============================================
export async function getApplicantDocumentBlob(req, res) {
  let connection
  
  try {
    const { applicant_id, document_type_id } = req.params
    const { business_owner_id } = req.query
    
    connection = await createConnection()
    
    // Use stored procedure to get document
    const [rows] = await connection.execute(
      'CALL sp_getApplicantDocumentBlob(?, ?, ?)',
      [applicant_id, document_type_id, business_owner_id || null]
    )
    const documents = rows[0]
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      })
    }
    
    const doc = documents[0]
    
    // Return binary data with correct content type
    res.set({
      'Content-Type': doc.mime_type,
      'Content-Disposition': `inline; filename="${doc.original_filename}"`,
      'Cache-Control': 'public, max-age=3600'
    })
    res.send(doc.document_data)
    
  } catch (error) {
    console.error('❌ Error getting applicant document blob:', error)
    res.status(500).json({
      success: false,
      message: 'Error retrieving document',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// GET APPLICANT DOCUMENT BY ID (returns binary)
// =============================================
export async function getApplicantDocumentBlobById(req, res) {
  let connection
  
  try {
    const { document_id } = req.params
    
    connection = await createConnection()
    
    // Use stored procedure to get document by ID
    const [rows] = await connection.execute(
      'CALL sp_getApplicantDocumentBlobById(?)',
      [document_id]
    )
    const documents = rows[0]
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      })
    }
    
    const doc = documents[0]
    
    // Return binary data with correct content type
    res.set({
      'Content-Type': doc.mime_type,
      'Content-Disposition': `inline; filename="${doc.original_filename}"`,
      'Cache-Control': 'public, max-age=3600'
    })
    res.send(doc.document_data)
    
  } catch (error) {
    console.error('❌ Error getting applicant document blob by ID:', error)
    res.status(500).json({
      success: false,
      message: 'Error retrieving document',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// GET ALL APPLICANT DOCUMENTS (returns metadata/base64)
// =============================================
export async function getApplicantDocuments(req, res) {
  let connection
  
  try {
    const { applicant_id } = req.params
    const { business_owner_id, include_data } = req.query
    
    connection = await createConnection()
    
    // Get documents from applicant_documents table
    let documents = []
    if (include_data === 'true') {
      const [rows] = await connection.execute(
        'CALL sp_getAllApplicantDocumentsWithData(?, ?)',
        [applicant_id, business_owner_id || null]
      )
      documents = rows[0]
    } else {
      const [rows] = await connection.execute(
        'SELECT document_id, applicant_id, document_type, document_name, document_mime_type, file_path, verification_status, created_at FROM applicant_documents WHERE applicant_id = ?',
        [applicant_id]
      )
      documents = rows
    }
    
    // Also fetch documents from other_information table (signature, house sketch, valid ID)
    // BUT ONLY if they don't already exist in applicant_documents table
    const [otherInfo] = await connection.execute(
      'SELECT signature_of_applicant, house_sketch_location, valid_id FROM other_information WHERE applicant_id = ?',
      [applicant_id]
    )
    
    if (otherInfo.length > 0) {
      const info = otherInfo[0]
      
      // Check which document types already exist in applicant_documents
      const existingTypes = documents.map(d => d.document_type)
      
      // Add signature document ONLY if not already in applicant_documents
      if (info.signature_of_applicant && !existingTypes.includes('signature')) {
        documents.push({
          document_id: `other_signature_${applicant_id}`,
          applicant_id: parseInt(applicant_id),
          document_type: 'signature',
          document_name: 'Signature',
          file_path: info.signature_of_applicant,
          document_mime_type: 'image/webp',
          storage_type: 'filesystem',
          verification_status: 'pending',
          created_at: new Date()
        })
      }
      
      // Add house sketch document ONLY if not already in applicant_documents
      if (info.house_sketch_location && !existingTypes.includes('house_location')) {
        documents.push({
          document_id: `other_house_${applicant_id}`,
          applicant_id: parseInt(applicant_id),
          document_type: 'house_sketch',
          document_name: 'House Sketch Location',
          file_path: info.house_sketch_location,
          document_mime_type: 'image/png',
          storage_type: 'filesystem',
          verification_status: 'pending',
          created_at: new Date()
        })
      }
      
      // Add valid ID document ONLY if not already in applicant_documents
      if (info.valid_id && !existingTypes.includes('valid_id')) {
        documents.push({
          document_id: `other_validid_${applicant_id}`,
          applicant_id: parseInt(applicant_id),
          document_type: 'valid_id',
          document_name: 'Valid ID',
          file_path: info.valid_id,
          document_mime_type: 'image/png',
          storage_type: 'filesystem',
          verification_status: 'pending',
          created_at: new Date()
        })
      }
    }
    
    // Transform documents to include URLs
    const transformedDocs = documents.map(doc => ({
      ...doc,
      blob_url: doc.storage_type === 'blob' 
        ? `/api/applicants/documents/blob/id/${doc.document_id}`
        : null,
      file_url: doc.storage_type === 'filesystem' && doc.file_path
        ? `/uploads/${doc.file_path}`
        : null,
      document_data_base64: include_data === 'true' && doc.document_data_base64
        ? `data:${doc.document_mime_type};base64,${doc.document_data_base64}`
        : undefined
    }))
    
    res.status(200).json({
      success: true,
      message: 'Documents retrieved successfully',
      data: transformedDocs,
      total: transformedDocs.length
    })
    
  } catch (error) {
    console.error('❌ Error getting applicant documents:', error)
    res.status(500).json({
      success: false,
      message: 'Error retrieving documents',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// DELETE APPLICANT DOCUMENT BLOB
// =============================================
export async function deleteApplicantDocumentBlob(req, res) {
  let connection
  
  try {
    const { document_id } = req.params
    
    connection = await createConnection()
    
    // Delete using stored procedure (includes existence check)
    const [rows] = await connection.execute(
      'CALL sp_deleteApplicantDocumentBlob(?)',
      [document_id]
    )
    const result = rows[0][0]
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: {
        deleted_document_id: parseInt(document_id)
      }
    })
    
  } catch (error) {
    console.error('❌ Error deleting applicant document blob:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// UPDATE APPLICANT DOCUMENT VERIFICATION STATUS
// =============================================
export async function updateDocumentVerificationStatus(req, res) {
  let connection
  
  try {
    const { document_id } = req.params
    const { verification_status, rejection_reason, verified_by } = req.body
    
    if (!verification_status) {
      return res.status(400).json({
        success: false,
        message: 'verification_status is required'
      })
    }
    
    const validStatuses = ['pending', 'verified', 'rejected', 'expired']
    if (!validStatuses.includes(verification_status)) {
      return res.status(400).json({
        success: false,
        message: `verification_status must be one of: ${validStatuses.join(', ')}`
      })
    }
    
    connection = await createConnection()
    
    // Update verification status using stored procedure (includes existence check)
    const [rows] = await connection.execute(
      'CALL sp_updateApplicantDocumentVerification(?, ?, ?, ?)',
      [document_id, verification_status, rejection_reason || null, verified_by || null]
    )
    const result = rows[0][0]
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'Document verification status updated',
      data: {
        document_id: parseInt(document_id),
        verification_status,
        rejection_reason: rejection_reason || null,
        verified_by: verified_by || null
      }
    })
    
  } catch (error) {
    console.error('❌ Error updating document verification status:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating verification status',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// GET DOCUMENTS BY DOCUMENT TYPE (for displaying specific document)
// =============================================
export async function getApplicantDocumentByType(req, res) {
  let connection
  
  try {
    const { applicant_id, document_type } = req.params
    const { business_owner_id, branch_id } = req.query
    
    connection = await createConnection()
    
    // Map common document type names to IDs or use as-is if numeric
    const documentTypeMap = {
      'signature': 1,
      'house_location': 2,
      'valid_id': 3,
      'business_permit': 4,
      'barangay_clearance': 5,
      'fire_certificate': 6,
      'sanitary_permit': 7
    }
    
    let documentTypeId = documentTypeMap[document_type] || parseInt(document_type)
    
    if (isNaN(documentTypeId)) {
      // Try to find by document name using stored procedure
      const [typeRows] = await connection.execute(
        'CALL sp_getDocumentTypeByName(?)',
        [document_type]
      )
      const types = typeRows[0]
      if (types.length > 0) {
        documentTypeId = types[0].document_type_id
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid document type'
        })
      }
    }
    
    // Get document using stored procedure
    const [rows] = await connection.execute(
      'CALL sp_getApplicantDocumentByTypeExtended(?, ?, ?, ?)',
      [applicant_id, documentTypeId, business_owner_id || null, branch_id || null]
    )
    const documents = rows[0]
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      })
    }
    
    const doc = documents[0]
    
    if (doc.storage_type === 'blob' && doc.document_data) {
      // Return binary data
      res.set({
        'Content-Type': doc.mime_type,
        'Content-Disposition': `inline; filename="${doc.original_filename}"`,
        'Cache-Control': 'public, max-age=3600'
      })
      res.send(doc.document_data)
    } else {
      // Return file path for legacy file-based storage
      res.status(200).json({
        success: true,
        message: 'Document is file-based',
        data: {
          document_id: doc.document_id,
          storage_type: doc.storage_type,
          file_path: doc.file_path
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Error getting applicant document by type:', error)
    res.status(500).json({
      success: false,
      message: 'Error retrieving document',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

export default {
  uploadApplicantDocumentBlob,
  getApplicantDocumentBlob,
  getApplicantDocumentBlobById,
  getApplicantDocuments,
  deleteApplicantDocumentBlob,
  updateDocumentVerificationStatus,
  getApplicantDocumentByType
}
