// =============================================
// VENDOR DOCUMENT BLOB CONTROLLER
// =============================================
// Purpose: Handle vendor documents stored as BLOB in database
// For cloud deployment (DigitalOcean) - no local file storage
// Features: Upload, Get, Delete documents (all as base64/BLOB)
// Max: 5MB per document, Images and PDFs allowed
//
// All database queries use stored procedures (no inline SQL).
// Stored procedures: sp_vendor_documents.sql
// =============================================

import { createConnection } from '../../../config/database.js'

// =============================================
// UPLOAD VENDOR DOCUMENT AS BLOB
// =============================================
export async function uploadVendorDocumentBlob(req, res) {
  let connection

  try {
    const {
      vendor_id,
      document_type_id,
      document_data,
      mime_type,
      file_name,
    } = req.body

    // Validate required fields
    if (!vendor_id || !document_type_id) {
      return res.status(400).json({
        success: false,
        message: 'vendor_id and document_type_id are required'
      })
    }

    let documentBuffer
    let actualMimeType
    let resolvedFileName

    if (req.file) {
      documentBuffer = req.file.buffer
      actualMimeType = mime_type || req.file.mimetype || 'image/jpeg'
      resolvedFileName = file_name || req.file.originalname || `doc_${Date.now()}`
    } else if (document_data) {
      const base64Data = document_data.replace(/^data:[^;]+;base64,/, '')
      documentBuffer = Buffer.from(base64Data, 'base64')
      actualMimeType = mime_type || 'image/jpeg'
      resolvedFileName = file_name || `doc_${Date.now()}`
    } else {
      return res.status(400).json({
        success: false,
        message: 'A file (multipart) or document_data (base64) is required'
      })
    }

    // Validate mime type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf']
    if (!allowedMimeTypes.includes(actualMimeType)) {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, PNG, GIF images and PDF files are allowed'
      })
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024
    if (documentBuffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Document size exceeds 5MB limit'
      })
    }

    connection = await createConnection()

    // Verify vendor exists
    const [vendorRows] = await connection.execute('CALL sp_checkVendorExists(?)', [vendor_id])
    if (vendorRows[0].length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    // Check if document already exists for this vendor/document type
    const [existingRows] = await connection.execute(
      'CALL sp_checkExistingVendorDocument(?, ?)',
      [vendor_id, document_type_id]
    )

    let documentId
    let isUpdate = false

    if (existingRows[0].length > 0) {
      // Update existing document
      documentId = existingRows[0][0].vendor_document_id
      isUpdate = true

      await connection.execute(
        'CALL sp_updateVendorDocument(?, ?, ?, ?)',
        [documentId, resolvedFileName, documentBuffer, actualMimeType]
      )
    } else {
      // Insert new document
      const [insertRows] = await connection.execute(
        'CALL sp_insertVendorDocument(?, ?, ?, ?, ?)',
        [vendor_id, document_type_id, resolvedFileName, documentBuffer, actualMimeType]
      )
      documentId = insertRows[0][0].document_id
    }

    console.log(`✅ Vendor document ${isUpdate ? 'updated' : 'uploaded'}: vendor_id=${vendor_id}, type=${document_type_id}`)

    res.status(200).json({
      success: true,
      message: isUpdate ? 'Document updated successfully' : 'Document uploaded successfully',
      data: {
        document_id: documentId,
        vendor_id: parseInt(vendor_id),
        document_type_id: parseInt(document_type_id),
        file_name: resolvedFileName,
        mime_type: actualMimeType,
        verification_status: 'Pending',
        is_update: isUpdate
      }
    })

  } catch (error) {
    console.error('❌ Error uploading vendor document blob:', error)
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
// GET VENDOR DOCUMENTS (metadata list)
// =============================================
export async function getVendorDocuments(req, res) {
  let connection

  try {
    const { vendor_id } = req.params
    const { include_data } = req.query

    if (!vendor_id) {
      return res.status(400).json({ success: false, message: 'vendor_id is required' })
    }

    connection = await createConnection()

    let documents
    if (include_data === 'true') {
      const [rows] = await connection.execute('CALL sp_getVendorDocumentsWithData(?)', [vendor_id])
      documents = rows[0]
    } else {
      const [rows] = await connection.execute('CALL sp_getVendorDocuments(?)', [vendor_id])
      documents = rows[0]
    }

    // Transform documents
    const transformedDocs = documents.map(doc => ({
      ...doc,
      blob_url: `/api/mobile/vendor/documents/blob/id/${doc.document_id}`,
      document_data_base64: include_data === 'true' && doc.document_data_base64
        ? `data:${doc.mime_type || 'image/jpeg'};base64,${doc.document_data_base64}`
        : undefined
    }))

    res.status(200).json({
      success: true,
      message: 'Vendor documents retrieved successfully',
      data: transformedDocs,
      total: transformedDocs.length
    })

  } catch (error) {
    console.error('❌ Error getting vendor documents:', error)
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
// GET VENDOR DOCUMENT BLOB BY ID (returns binary)
// =============================================
export async function getVendorDocumentBlobById(req, res) {
  let connection

  try {
    const { document_id } = req.params

    if (!document_id) {
      return res.status(400).json({ success: false, message: 'Document ID is required' })
    }

    connection = await createConnection()

    const [rows] = await connection.execute('CALL sp_getVendorDocumentBlobById(?)', [document_id])
    const documents = rows[0]

    if (!documents || documents.length === 0 || !documents[0].document_data) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or no blob data available'
      })
    }

    const doc = documents[0]
    const mimeType = doc.document_mime_type || 'application/octet-stream'

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${doc.document_name || 'document'}"`,
      'Cache-Control': 'public, max-age=3600'
    })
    res.send(doc.document_data)

  } catch (error) {
    console.error('❌ Error getting vendor document blob by ID:', error)
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
// GET VENDOR DOCUMENT BY ID AS BASE64 JSON
// (React Native compatible)
// =============================================
export async function getVendorDocumentBlobByIdBase64(req, res) {
  let connection

  try {
    const { document_id } = req.params

    if (!document_id) {
      return res.status(400).json({ success: false, message: 'Document ID is required' })
    }

    connection = await createConnection()

    const [rows] = await connection.execute('CALL sp_getVendorDocumentBlobById(?)', [document_id])
    const documents = rows[0]

    if (!documents || documents.length === 0 || !documents[0].document_data) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or no blob data available'
      })
    }

    const doc = documents[0]
    const mimeType = doc.document_mime_type || 'image/jpeg'
    const base64Data = doc.document_data.toString('base64')
    const dataUri = `data:${mimeType};base64,${base64Data}`

    res.status(200).json({
      success: true,
      data: dataUri,
      mimeType: mimeType,
      fileName: doc.document_name || 'document'
    })

  } catch (error) {
    console.error('❌ Error getting vendor document blob by ID as base64:', error)
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
// GET VENDOR DOCUMENT REQUIREMENTS
// Returns vendor-category document types merged with upload status
// =============================================
export async function getVendorDocumentRequirements(req, res) {
  let connection

  try {
    const { vendor_id } = req.params

    if (!vendor_id) {
      return res.status(400).json({ success: false, message: 'vendor_id is required' })
    }

    connection = await createConnection()

    // Verify vendor exists
    const [vendorCheck] = await connection.execute('CALL sp_checkVendorExists(?)', [vendor_id])
    if (vendorCheck[0].length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    // Get requirements + uploaded docs (2 result sets from SP)
    const [results] = await connection.execute('CALL sp_getVendorDocumentRequirements(?)', [vendor_id])
    const requirements = results[0]
    const uploadedRows = results[1]

    // Create upload map
    const uploadMap = {}
    uploadedRows.forEach(doc => {
      uploadMap[doc.document_type_id] = doc
    })

    // Merge requirements with upload status
    const documentsWithStatus = requirements.map(req => {
      const uploaded = uploadMap[req.document_type_id]
      return {
        document_type_id: req.document_type_id,
        document_name: req.document_name,
        description: req.description,
        is_required: req.is_required,
        display_order: req.display_order,
        status: uploaded?.verification_status?.toLowerCase() || 'not_uploaded',
        document_id: uploaded?.document_id || null,
        upload_date: uploaded?.submitted_at || null,
        file_name: uploaded?.file_name || null,
        rejection_reason: uploaded?.remarks || null,
        blob_url: uploaded?.document_id
          ? `/api/mobile/vendor/documents/blob/id/${uploaded.document_id}`
          : null
      }
    })

    res.status(200).json({
      success: true,
      message: 'Vendor document requirements fetched successfully',
      data: {
        vendor_id: parseInt(vendor_id),
        requirements: documentsWithStatus,
        total_required: requirements.filter(r => r.is_required).length,
        total_uploaded: uploadedRows.length
      }
    })

  } catch (error) {
    console.error('❌ Error fetching vendor document requirements:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document requirements',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// DELETE VENDOR DOCUMENT BLOB
// =============================================
export async function deleteVendorDocumentBlob(req, res) {
  let connection

  try {
    const { document_id } = req.params

    connection = await createConnection()

    const [rows] = await connection.execute('CALL sp_deleteVendorDocument(?)', [document_id])

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: { deleted_document_id: parseInt(document_id) }
    })

  } catch (error) {
    // SP raises SQLSTATE 45000 if not found
    if (error.sqlState === '45000') {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }
    console.error('❌ Error deleting vendor document blob:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

export default {
  uploadVendorDocumentBlob,
  getVendorDocuments,
  getVendorDocumentBlobById,
  getVendorDocumentBlobByIdBase64,
  getVendorDocumentRequirements,
  deleteVendorDocumentBlob
}
