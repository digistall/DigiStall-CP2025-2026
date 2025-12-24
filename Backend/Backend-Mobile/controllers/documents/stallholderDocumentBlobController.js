// =============================================
// STALLHOLDER DOCUMENT BLOB CONTROLLER
// =============================================
// Purpose: Handle stallholder documents stored as BLOB in database
// For cloud deployment (DigitalOcean) - no local file storage
// Features: Upload, Get, Delete, Update (all as base64/BLOB)
// Works for both stallholder_documents and stallholder_document_submissions tables
// Max: 10MB per document, Images and PDFs allowed
// =============================================

import { createConnection } from '../../config/database.js'

// =============================================
// UPLOAD STALLHOLDER DOCUMENT AS BLOB
// =============================================
export async function uploadStallholderDocumentBlob(req, res) {
  let connection
  
  try {
    const { 
      stallholder_id, 
      document_type_id,
      document_data, 
      mime_type, 
      file_name,
      expiry_date,
      notes
    } = req.body
    
    // Validate required fields
    if (!stallholder_id || !document_type_id || !document_data) {
      return res.status(400).json({
        success: false,
        message: 'stallholder_id, document_type_id, and document_data (base64) are required'
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
    
    // Check file size (10MB limit for documents)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (documentBuffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Document size exceeds 10MB limit'
      })
    }
    
    connection = await createConnection()
    
    // Verify stallholder exists
    const [stallholders] = await connection.query(
      'SELECT stallholder_id FROM stallholder WHERE stallholder_id = ?',
      [stallholder_id]
    )
    
    if (stallholders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stallholder not found'
      })
    }
    
    // Generate filename for reference
    const timestamp = Date.now()
    const extension = actualMimeType === 'application/pdf' ? 'pdf' : actualMimeType.split('/')[1]
    const generatedFileName = file_name || `stallholder_${stallholder_id}_doc_${document_type_id}_${timestamp}.${extension}`
    const virtualFilePath = `/api/mobile/stallholder/documents/blob/${stallholder_id}/${document_type_id}`
    
    // Check if document already exists for this stallholder/document type
    const [existingDocs] = await connection.query(
      `SELECT document_id FROM stallholder_documents 
       WHERE stallholder_id = ? AND document_type_id = ?`,
      [stallholder_id, document_type_id]
    )
    
    let documentId
    let isUpdate = false
    
    if (existingDocs.length > 0) {
      // Update existing document
      documentId = existingDocs[0].document_id
      isUpdate = true
      
      await connection.query(
        `UPDATE stallholder_documents 
         SET file_path = ?,
             original_filename = ?,
             file_size = ?,
             document_data = ?,
             storage_type = 'blob',
             upload_date = NOW(),
             verification_status = 'pending',
             verified_by = NULL,
             verified_at = NULL,
             rejection_reason = NULL,
             expiry_date = ?,
             notes = ?
         WHERE document_id = ?`,
        [virtualFilePath, generatedFileName, documentBuffer.length, documentBuffer, 
         expiry_date || null, notes || null, documentId]
      )
    } else {
      // Insert new document
      const [result] = await connection.query(
        `INSERT INTO stallholder_documents (
           stallholder_id, document_type_id,
           file_path, original_filename, file_size,
           document_data, storage_type, expiry_date, notes, verification_status
         ) VALUES (?, ?, ?, ?, ?, ?, 'blob', ?, ?, 'pending')`,
        [stallholder_id, document_type_id,
         virtualFilePath, generatedFileName, documentBuffer.length,
         documentBuffer, expiry_date || null, notes || null]
      )
      documentId = result.insertId
    }
    
    res.status(200).json({
      success: true,
      message: isUpdate ? 'Document updated successfully' : 'Document uploaded successfully',
      data: {
        document_id: documentId,
        stallholder_id: parseInt(stallholder_id),
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
    console.error('❌ Error uploading stallholder document blob:', error)
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
// UPLOAD STALLHOLDER DOCUMENT SUBMISSION AS BLOB
// (for document_submissions table)
// =============================================
export async function uploadStallholderDocumentSubmissionBlob(req, res) {
  let connection
  
  try {
    const { 
      stallholder_id, 
      owner_id,
      requirement_id,
      application_id,
      document_data, 
      mime_type, 
      file_name
    } = req.body
    
    // Validate required fields
    if (!stallholder_id || !owner_id || !requirement_id || !document_data) {
      return res.status(400).json({
        success: false,
        message: 'stallholder_id, owner_id, requirement_id, and document_data (base64) are required'
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
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (documentBuffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Document size exceeds 10MB limit'
      })
    }
    
    connection = await createConnection()
    
    // Generate filename for reference
    const timestamp = Date.now()
    const extension = actualMimeType === 'application/pdf' ? 'pdf' : actualMimeType.split('/')[1]
    const generatedFileName = file_name || `submission_${stallholder_id}_req_${requirement_id}_${timestamp}.${extension}`
    const virtualFileUrl = `/api/mobile/stallholder/documents/submission/blob/${stallholder_id}/${requirement_id}`
    
    // Check if submission already exists
    const [existingSubmissions] = await connection.query(
      `SELECT submission_id FROM stallholder_document_submissions 
       WHERE stallholder_id = ? AND requirement_id = ? AND owner_id = ?`,
      [stallholder_id, requirement_id, owner_id]
    )
    
    let submissionId
    let isUpdate = false
    
    if (existingSubmissions.length > 0) {
      // Update existing submission
      submissionId = existingSubmissions[0].submission_id
      isUpdate = true
      
      await connection.query(
        `UPDATE stallholder_document_submissions 
         SET file_url = ?,
             file_name = ?,
             file_type = ?,
             file_size = ?,
             document_data = ?,
             storage_type = 'blob',
             status = 'pending',
             rejection_reason = NULL,
             uploaded_at = NOW(),
             updated_at = NOW(),
             reviewed_by = NULL,
             reviewed_at = NULL
         WHERE submission_id = ?`,
        [virtualFileUrl, generatedFileName, actualMimeType, documentBuffer.length, 
         documentBuffer, submissionId]
      )
    } else {
      // Insert new submission
      const [result] = await connection.query(
        `INSERT INTO stallholder_document_submissions (
           stallholder_id, owner_id, requirement_id, application_id,
           file_url, file_name, file_type, file_size,
           document_data, storage_type, status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'blob', 'pending')`,
        [stallholder_id, owner_id, requirement_id, application_id || null,
         virtualFileUrl, generatedFileName, actualMimeType, documentBuffer.length,
         documentBuffer]
      )
      submissionId = result.insertId
    }
    
    res.status(200).json({
      success: true,
      message: isUpdate ? 'Document submission updated successfully' : 'Document submission uploaded successfully',
      data: {
        submission_id: submissionId,
        stallholder_id: parseInt(stallholder_id),
        owner_id: parseInt(owner_id),
        requirement_id: parseInt(requirement_id),
        file_url: virtualFileUrl,
        file_name: generatedFileName,
        file_type: actualMimeType,
        size_bytes: documentBuffer.length,
        storage_type: 'blob',
        status: 'pending',
        is_update: isUpdate
      }
    })
    
  } catch (error) {
    console.error('❌ Error uploading stallholder document submission blob:', error)
    res.status(500).json({
      success: false,
      message: 'Error uploading document submission',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// GET STALLHOLDER DOCUMENT BLOB (returns binary)
// =============================================
export async function getStallholderDocumentBlob(req, res) {
  let connection
  
  try {
    const { stallholder_id, document_type_id } = req.params
    
    connection = await createConnection()
    
    const [documents] = await connection.query(
      `SELECT document_data, storage_type, original_filename,
              (SELECT document_name FROM document_types WHERE document_type_id = sd.document_type_id) as document_name
       FROM stallholder_documents sd
       WHERE stallholder_id = ? AND document_type_id = ? AND storage_type = 'blob' AND document_data IS NOT NULL
       ORDER BY upload_date DESC LIMIT 1`,
      [stallholder_id, document_type_id]
    )
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or not stored as BLOB'
      })
    }
    
    const doc = documents[0]
    
    // Detect mime type from filename or use default
    const extension = doc.original_filename?.split('.').pop()?.toLowerCase()
    let mimeType = 'application/octet-stream'
    if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg'
    else if (extension === 'png') mimeType = 'image/png'
    else if (extension === 'gif') mimeType = 'image/gif'
    else if (extension === 'pdf') mimeType = 'application/pdf'
    
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${doc.original_filename}"`,
      'Cache-Control': 'public, max-age=3600'
    })
    res.send(doc.document_data)
    
  } catch (error) {
    console.error('❌ Error getting stallholder document blob:', error)
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
// GET STALLHOLDER DOCUMENT BY ID (returns binary)
// =============================================
export async function getStallholderDocumentBlobById(req, res) {
  let connection
  
  try {
    const { document_id } = req.params
    
    connection = await createConnection()
    
    const [documents] = await connection.query(
      `SELECT document_data, original_filename
       FROM stallholder_documents
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
    
    // Detect mime type
    const extension = doc.original_filename?.split('.').pop()?.toLowerCase()
    let mimeType = 'application/octet-stream'
    if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg'
    else if (extension === 'png') mimeType = 'image/png'
    else if (extension === 'gif') mimeType = 'image/gif'
    else if (extension === 'pdf') mimeType = 'application/pdf'
    
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${doc.original_filename}"`,
      'Cache-Control': 'public, max-age=3600'
    })
    res.send(doc.document_data)
    
  } catch (error) {
    console.error('❌ Error getting stallholder document blob by ID:', error)
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
// GET STALLHOLDER DOCUMENT SUBMISSION BLOB (returns binary)
// =============================================
export async function getStallholderDocumentSubmissionBlob(req, res) {
  let connection
  
  try {
    const { submission_id } = req.params
    
    connection = await createConnection()
    
    const [submissions] = await connection.query(
      `SELECT document_data, file_name, file_type
       FROM stallholder_document_submissions
       WHERE submission_id = ? AND storage_type = 'blob' AND document_data IS NOT NULL`,
      [submission_id]
    )
    
    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document submission not found'
      })
    }
    
    const doc = submissions[0]
    
    res.set({
      'Content-Type': doc.file_type || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${doc.file_name}"`,
      'Cache-Control': 'public, max-age=3600'
    })
    res.send(doc.document_data)
    
  } catch (error) {
    console.error('❌ Error getting stallholder document submission blob:', error)
    res.status(500).json({
      success: false,
      message: 'Error retrieving document submission',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// GET ALL STALLHOLDER DOCUMENTS (returns metadata/base64)
// =============================================
export async function getStallholderDocuments(req, res) {
  let connection
  
  try {
    const { stallholder_id } = req.params
    const { include_data } = req.query
    
    connection = await createConnection()
    
    let selectColumns = `
      sd.document_id, sd.stallholder_id, sd.document_type_id,
      dt.document_name, dt.description as document_description,
      sd.file_path, sd.original_filename, sd.file_size,
      sd.upload_date, sd.verification_status, sd.verified_at, sd.verified_by,
      sd.rejection_reason, sd.expiry_date, sd.notes, sd.storage_type`
    
    if (include_data === 'true') {
      selectColumns += `, TO_BASE64(sd.document_data) as document_data_base64`
    }
    
    const [documents] = await connection.query(
      `SELECT ${selectColumns}
       FROM stallholder_documents sd
       LEFT JOIN document_types dt ON sd.document_type_id = dt.document_type_id
       WHERE sd.stallholder_id = ?
       ORDER BY dt.document_name ASC, sd.upload_date DESC`,
      [stallholder_id]
    )
    
    // Transform documents
    const transformedDocs = documents.map(doc => ({
      ...doc,
      blob_url: doc.storage_type === 'blob' 
        ? `/api/mobile/stallholder/documents/blob/id/${doc.document_id}`
        : null,
      document_data_base64: include_data === 'true' && doc.document_data_base64
        ? `data:image/jpeg;base64,${doc.document_data_base64}`
        : undefined
    }))
    
    res.status(200).json({
      success: true,
      message: 'Documents retrieved successfully',
      data: transformedDocs,
      total: transformedDocs.length
    })
    
  } catch (error) {
    console.error('❌ Error getting stallholder documents:', error)
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
// DELETE STALLHOLDER DOCUMENT BLOB
// =============================================
export async function deleteStallholderDocumentBlob(req, res) {
  let connection
  
  try {
    const { document_id } = req.params
    
    connection = await createConnection()
    
    // Verify document exists
    const [documents] = await connection.query(
      'SELECT document_id FROM stallholder_documents WHERE document_id = ?',
      [document_id]
    )
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      })
    }
    
    await connection.query(
      'DELETE FROM stallholder_documents WHERE document_id = ?',
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
    console.error('❌ Error deleting stallholder document blob:', error)
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
// UPDATE STALLHOLDER DOCUMENT VERIFICATION STATUS
// =============================================
export async function updateStallholderDocumentVerificationStatus(req, res) {
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
    
    connection = await createConnection()
    
    await connection.query(
      `UPDATE stallholder_documents 
       SET verification_status = ?,
           rejection_reason = ?,
           verified_by = ?,
           verified_at = NOW()
       WHERE document_id = ?`,
      [verification_status, rejection_reason || null, verified_by || null, document_id]
    )
    
    res.status(200).json({
      success: true,
      message: 'Verification status updated',
      data: {
        document_id: parseInt(document_id),
        verification_status,
        rejection_reason: rejection_reason || null
      }
    })
    
  } catch (error) {
    console.error('❌ Error updating stallholder document verification status:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating verification status',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

export default {
  uploadStallholderDocumentBlob,
  uploadStallholderDocumentSubmissionBlob,
  getStallholderDocumentBlob,
  getStallholderDocumentBlobById,
  getStallholderDocumentSubmissionBlob,
  getStallholderDocuments,
  deleteStallholderDocumentBlob,
  updateStallholderDocumentVerificationStatus
}
