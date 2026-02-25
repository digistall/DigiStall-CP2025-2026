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
    
    // Verify stallholder exists using stored procedure
    const [stallholderRows] = await connection.execute(
      'CALL sp_checkStallholderExists(?)',
      [stallholder_id]
    )
    const stallholders = stallholderRows[0]
    
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
    
    // Check if document already exists for this stallholder/document type using stored procedure
    const [existingRows] = await connection.execute(
      'CALL sp_checkExistingStallholderDocument(?, ?)',
      [stallholder_id, document_type_id]
    )
    const existingDocs = existingRows[0]
    
    let documentId
    let isUpdate = false
    
    if (existingDocs.length > 0) {
      // Update existing document using stored procedure
      documentId = existingDocs[0].document_id
      isUpdate = true
      
      await connection.execute(
        'CALL sp_updateStallholderDocumentBlob(?, ?, ?, ?, ?, ?, ?)',
        [documentId, virtualFilePath, generatedFileName, documentBuffer.length, documentBuffer, 
         expiry_date || null, notes || null]
      )
    } else {
      // Insert new document using stored procedure
      const [insertRows] = await connection.execute(
        'CALL sp_insertStallholderDocumentBlob(?, ?, ?, ?, ?, ?, ?, ?)',
        [stallholder_id, document_type_id,
         virtualFilePath, generatedFileName, documentBuffer.length,
         documentBuffer, expiry_date || null, notes || null]
      )
      documentId = insertRows[0][0].document_id
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
    
    // Check if submission already exists using stored procedure
    const [existingRows] = await connection.execute(
      'CALL sp_checkExistingDocumentSubmission(?, ?, ?)',
      [stallholder_id, requirement_id, owner_id]
    )
    const existingSubmissions = existingRows[0]
    
    let submissionId
    let isUpdate = false
    
    if (existingSubmissions.length > 0) {
      // Update existing submission using stored procedure
      submissionId = existingSubmissions[0].submission_id
      isUpdate = true
      
      await connection.execute(
        'CALL sp_updateDocumentSubmissionBlob(?, ?, ?, ?, ?, ?)',
        [submissionId, virtualFileUrl, generatedFileName, actualMimeType, documentBuffer.length, 
         documentBuffer]
      )
    } else {
      // Insert new submission using stored procedure
      const [insertRows] = await connection.execute(
        'CALL sp_insertDocumentSubmissionBlob(?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [stallholder_id, owner_id, requirement_id, application_id || null,
         virtualFileUrl, generatedFileName, actualMimeType, documentBuffer.length,
         documentBuffer]
      )
      submissionId = insertRows[0][0].submission_id
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
    
    // Use stored procedure to get document
    const [rows] = await connection.execute(
      'CALL sp_getStallholderDocumentBlob(?, ?)',
      [stallholder_id, document_type_id]
    )
    const documents = rows[0]
    
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
    
    if (!document_id) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      })
    }

    console.log(`📥 Fetching document blob for ID: ${document_id}`)
    
    connection = await createConnection()
    
    let documents = []
    
    // Try stored procedure first, fallback to raw query
    try {
      const [rows] = await connection.execute(
        'CALL sp_getStallholderDocumentBlobById(?)',
        [document_id]
      )
      documents = rows[0]
    } catch (spError) {
      console.log('⚠️ Stored procedure not found, using raw query:', spError.message)
      // Fallback to raw query if stored procedure doesn't exist
      const [rows] = await connection.execute(
        `SELECT document_data, document_name as original_filename, document_mime_type as mime_type
         FROM stallholder_documents 
         WHERE document_id = ? 
           AND document_data IS NOT NULL`,
        [document_id]
      )
      documents = rows
    }
    
    if (!documents || documents.length === 0) {
      console.log(`⚠️ Document not found for ID: ${document_id}`)
      return res.status(404).json({
        success: false,
        message: 'Document not found or no blob data available'
      })
    }
    
    const doc = documents[0]
    
    if (!doc.document_data) {
      console.log(`⚠️ Document ${document_id} has no blob data`)
      return res.status(404).json({
        success: false,
        message: 'Document blob data not found'
      })
    }
    
    // Detect mime type from filename extension
    const extension = doc.original_filename?.split('.').pop()?.toLowerCase()
    let mimeType = 'application/octet-stream'
    if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg'
    else if (extension === 'png') mimeType = 'image/png'
    else if (extension === 'gif') mimeType = 'image/gif'
    else if (extension === 'pdf') mimeType = 'application/pdf'
    
    console.log(`✅ Sending document blob: ${doc.original_filename} (${mimeType}, ${doc.document_data.length} bytes)`)
    
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${doc.original_filename || 'document'}"`,
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
    
    // Use stored procedure to get submission blob
    const [rows] = await connection.execute(
      'CALL sp_getStallholderDocumentSubmissionBlob(?)',
      [submission_id]
    )
    const submissions = rows[0]
    
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
    
    // Use stored procedure with include_data parameter
    const [rows] = await connection.execute(
      'CALL sp_getAllStallholderDocuments(?, ?)',
      [stallholder_id, include_data === 'true' ? 1 : 0]
    )
    const documents = rows[0]
    
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
    
    // Verify document exists using stored procedure
    const [checkRows] = await connection.execute(
      'CALL sp_checkDocumentExistsForDelete(?)',
      [document_id]
    )
    const documents = checkRows[0]
    
    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      })
    }
    
    // Delete using stored procedure
    await connection.execute(
      'CALL sp_deleteStallholderDocument(?)',
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
    
    // Update using stored procedure
    await connection.execute(
      'CALL sp_updateStallholderDocumentVerification(?, ?, ?, ?)',
      [document_id, verification_status, rejection_reason || null, verified_by || null]
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

// =============================================
// GET STALLHOLDER DOCUMENT BY ID AS BASE64 JSON
// (React Native compatible - returns JSON with base64 data)
// =============================================
export async function getStallholderDocumentBlobByIdBase64(req, res) {
  let connection
  
  try {
    const { document_id } = req.params
    
    if (!document_id) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      })
    }

    console.log(`📥 Fetching document blob as base64 for ID: ${document_id}`)
    
    connection = await createConnection()
    
    let documents = []
    
    // Try stored procedure first, fallback to raw query
    try {
      const [rows] = await connection.execute(
        'CALL sp_getStallholderDocumentBlobById(?)',
        [document_id]
      )
      documents = rows[0]
    } catch (spError) {
      console.log('⚠️ Stored procedure not found, using raw query:', spError.message)
      // Fallback to raw query if stored procedure doesn't exist
      const [rows] = await connection.execute(
        `SELECT document_data, document_name as original_filename, document_mime_type as mime_type
         FROM stallholder_documents 
         WHERE document_id = ? 
           AND document_data IS NOT NULL`,
        [document_id]
      )
      documents = rows
    }
    
    if (!documents || documents.length === 0) {
      console.log(`⚠️ Document not found for ID: ${document_id}`)
      return res.status(404).json({
        success: false,
        message: 'Document not found or no blob data available'
      })
    }
    
    const doc = documents[0]
    
    if (!doc.document_data) {
      console.log(`⚠️ Document ${document_id} has no blob data`)
      return res.status(404).json({
        success: false,
        message: 'Document blob data not found'
      })
    }
    
    // Detect mime type from filename extension
    const extension = doc.original_filename?.split('.').pop()?.toLowerCase()
    let mimeType = 'application/octet-stream'
    if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg'
    else if (extension === 'png') mimeType = 'image/png'
    else if (extension === 'gif') mimeType = 'image/gif'
    else if (extension === 'pdf') mimeType = 'application/pdf'
    
    // Convert buffer to base64 string
    const base64Data = doc.document_data.toString('base64')
    const dataUri = `data:${mimeType};base64,${base64Data}`
    
    console.log(`✅ Sending document as base64 JSON: ${doc.original_filename} (${mimeType}, ${base64Data.length} chars)`)
    
    res.status(200).json({
      success: true,
      data: dataUri,
      mimeType: mimeType,
      fileName: doc.original_filename || 'document'
    })
    
  } catch (error) {
    console.error('❌ Error getting stallholder document blob by ID as base64:', error)
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
  uploadStallholderDocumentBlob,
  uploadStallholderDocumentSubmissionBlob,
  getStallholderDocumentBlob,
  getStallholderDocumentBlobById,
  getStallholderDocumentBlobByIdBase64,
  getStallholderDocumentSubmissionBlob,
  getStallholderDocuments,
  deleteStallholderDocumentBlob,
  updateStallholderDocumentVerificationStatus
}

