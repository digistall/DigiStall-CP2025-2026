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
    
    // Verify applicant exists
    const [applicants] = await connection.query(
      'SELECT applicant_id FROM applicant WHERE applicant_id = ?',
      [applicant_id]
    )
    
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
    
    // Check if document already exists for this applicant/business owner/document type
    const [existingDocs] = await connection.query(
      `SELECT document_id FROM applicant_documents 
       WHERE applicant_id = ? AND business_owner_id = ? AND document_type_id = ?`,
      [applicant_id, business_owner_id, document_type_id]
    )
    
    let documentId
    let isUpdate = false
    
    if (existingDocs.length > 0) {
      // Update existing document
      documentId = existingDocs[0].document_id
      isUpdate = true
      
      await connection.query(
        `UPDATE applicant_documents 
         SET file_path = ?,
             original_filename = ?,
             file_size = ?,
             mime_type = ?,
             document_data = ?,
             storage_type = 'blob',
             upload_date = NOW(),
             verification_status = 'pending',
             verified_by = NULL,
             verified_at = NULL,
             rejection_reason = NULL,
             expiry_date = ?,
             notes = ?,
             updated_at = NOW()
         WHERE document_id = ?`,
        [virtualFilePath, generatedFileName, documentBuffer.length, actualMimeType, documentBuffer, 
         expiry_date || null, notes || null, documentId]
      )
    } else {
      // Insert new document
      const [result] = await connection.query(
        `INSERT INTO applicant_documents (
           applicant_id, business_owner_id, branch_id, document_type_id,
           file_path, original_filename, file_size, mime_type,
           document_data, storage_type, expiry_date, notes, verification_status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'blob', ?, ?, 'pending')`,
        [applicant_id, business_owner_id, branch_id || null, document_type_id,
         virtualFilePath, generatedFileName, documentBuffer.length, actualMimeType,
         documentBuffer, expiry_date || null, notes || null]
      )
      documentId = result.insertId
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
    
    let query = `
      SELECT document_data, mime_type, original_filename 
      FROM applicant_documents 
      WHERE applicant_id = ? AND document_type_id = ? AND storage_type = 'blob' AND document_data IS NOT NULL`
    let params = [applicant_id, document_type_id]
    
    if (business_owner_id) {
      query += ' AND business_owner_id = ?'
      params.push(business_owner_id)
    }
    
    query += ' ORDER BY upload_date DESC LIMIT 1'
    
    const [documents] = await connection.query(query, params)
    
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
    
    const [documents] = await connection.query(
      `SELECT document_data, mime_type, original_filename 
       FROM applicant_documents 
       WHERE document_id = ? AND storage_type = 'blob' AND document_data IS NOT NULL`,
      [document_id]
    )
    
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
    
    // Build query
    let selectColumns = `
      ad.document_id, ad.applicant_id, ad.business_owner_id, ad.branch_id,
      ad.document_type_id, dt.document_name, dt.description as document_description,
      ad.file_path, ad.original_filename, ad.file_size, ad.mime_type,
      ad.upload_date, ad.verification_status, ad.verified_at, ad.verified_by,
      ad.rejection_reason, ad.expiry_date, ad.notes, ad.storage_type`
    
    // Optionally include base64 data
    if (include_data === 'true') {
      selectColumns += `, TO_BASE64(ad.document_data) as document_data_base64`
    }
    
    let query = `
      SELECT ${selectColumns}
      FROM applicant_documents ad
      LEFT JOIN document_types dt ON ad.document_type_id = dt.document_type_id
      WHERE ad.applicant_id = ?`
    let params = [applicant_id]
    
    if (business_owner_id) {
      query += ' AND ad.business_owner_id = ?'
      params.push(business_owner_id)
    }
    
    query += ' ORDER BY dt.document_name ASC, ad.upload_date DESC'
    
    const [documents] = await connection.query(query, params)
    
    // Transform documents to include virtual URL for BLOB API
    const transformedDocs = documents.map(doc => ({
      ...doc,
      blob_url: doc.storage_type === 'blob' 
        ? `/api/applicants/documents/blob/id/${doc.document_id}`
        : null,
      document_data_base64: include_data === 'true' && doc.document_data_base64
        ? `data:${doc.mime_type};base64,${doc.document_data_base64}`
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
    
    // Verify document exists
    const [documents] = await connection.query(
      'SELECT document_id, applicant_id FROM applicant_documents WHERE document_id = ?',
      [document_id]
    )
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      })
    }
    
    // Delete the document
    await connection.query(
      'DELETE FROM applicant_documents WHERE document_id = ?',
      [document_id]
    )
    
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
    
    // Verify document exists
    const [documents] = await connection.query(
      'SELECT document_id FROM applicant_documents WHERE document_id = ?',
      [document_id]
    )
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      })
    }
    
    // Update verification status
    await connection.query(
      `UPDATE applicant_documents 
       SET verification_status = ?,
           rejection_reason = ?,
           verified_by = ?,
           verified_at = NOW(),
           updated_at = NOW()
       WHERE document_id = ?`,
      [verification_status, rejection_reason || null, verified_by || null, document_id]
    )
    
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
      // Try to find by document name
      const [types] = await connection.query(
        `SELECT document_type_id FROM document_types WHERE LOWER(document_name) LIKE ?`,
        [`%${document_type.toLowerCase()}%`]
      )
      if (types.length > 0) {
        documentTypeId = types[0].document_type_id
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid document type'
        })
      }
    }
    
    let query = `
      SELECT ad.document_id, ad.document_data, ad.mime_type, ad.original_filename,
             ad.verification_status, ad.storage_type
      FROM applicant_documents ad
      WHERE ad.applicant_id = ? AND ad.document_type_id = ?`
    let params = [applicant_id, documentTypeId]
    
    if (business_owner_id) {
      query += ' AND ad.business_owner_id = ?'
      params.push(business_owner_id)
    }
    
    if (branch_id) {
      query += ' AND ad.branch_id = ?'
      params.push(branch_id)
    }
    
    query += ' ORDER BY ad.upload_date DESC LIMIT 1'
    
    const [documents] = await connection.query(query, params)
    
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
