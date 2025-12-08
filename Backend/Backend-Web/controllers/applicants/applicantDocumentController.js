// =============================================
// APPLICANT DOCUMENT CONTROLLER
// =============================================
// Purpose: Handle applicant document uploads and retrieval
// Features: Upload, List, Delete documents (signature, house location, valid ID)
// Storage: C:/xampp/htdocs/digistall_uploads/applicants/{branch_id}/{applicant_id}/
// =============================================

import { createConnection } from '../../config/database.js'
import {
  generateApplicantDocumentUrl,
  listApplicantDocuments,
  deleteApplicantDocumentFile,
  deleteAllApplicantDocuments
} from '../../config/multerApplicantDocuments.js'
import path from 'path'
import fs from 'fs'

// =============================================
// UPLOAD APPLICANT DOCUMENTS
// =============================================
export async function uploadApplicantDocuments(req, res) {
  try {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      })
    }
    
    const { applicant_id, branch_id } = req.body
    
    // Validate required fields
    if (!applicant_id) {
      return res.status(400).json({
        success: false,
        message: 'applicant_id is required'
      })
    }
    
    const branchId = branch_id || '1'
    
    // Generate URLs for uploaded files
    const uploadedDocuments = req.files.map(file => ({
      fieldname: file.fieldname,
      filename: file.filename,
      url: generateApplicantDocumentUrl(branchId, applicant_id, file.filename),
      size: file.size,
      mimetype: file.mimetype
    }))
    
    console.log(`✅ Uploaded ${uploadedDocuments.length} documents for applicant ${applicant_id}`)
    
    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedDocuments.length} document(s)`,
      data: {
        applicant_id: applicant_id,
        branch_id: branchId,
        documents: uploadedDocuments
      }
    })
    
  } catch (error) {
    console.error('❌ Error uploading applicant documents:', error)
    
    res.status(500).json({
      success: false,
      message: 'Error uploading documents',
      error: error.message
    })
  }
}

// =============================================
// GET APPLICANT DOCUMENTS
// =============================================
export async function getApplicantDocuments(req, res) {
  try {
    const { applicant_id } = req.params
    const { branch_id } = req.query
    
    if (!applicant_id) {
      return res.status(400).json({
        success: false,
        message: 'applicant_id is required'
      })
    }
    
    const branchId = branch_id || '1'
    
    // List documents from filesystem
    const documents = listApplicantDocuments(branchId, applicant_id)
    
    // Organize by document type
    const organizedDocs = {
      signature: null,
      house_location: null,
      valid_id: null,
      other: []
    }
    
    documents.forEach(doc => {
      if (doc.filename.startsWith('signature')) {
        organizedDocs.signature = doc
      } else if (doc.filename.startsWith('house_location')) {
        organizedDocs.house_location = doc
      } else if (doc.filename.startsWith('valid_id')) {
        organizedDocs.valid_id = doc
      } else {
        organizedDocs.other.push(doc)
      }
    })
    
    res.status(200).json({
      success: true,
      message: 'Documents retrieved successfully',
      data: {
        applicant_id: applicant_id,
        branch_id: branchId,
        documents: organizedDocs,
        total: documents.length
      }
    })
    
  } catch (error) {
    console.error('❌ Error getting applicant documents:', error)
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving documents',
      error: error.message
    })
  }
}

// =============================================
// DELETE APPLICANT DOCUMENT
// =============================================
export async function deleteApplicantDocument(req, res) {
  try {
    const { applicant_id, filename } = req.params
    const { branch_id } = req.body
    
    if (!applicant_id || !filename) {
      return res.status(400).json({
        success: false,
        message: 'applicant_id and filename are required'
      })
    }
    
    // Validate filename format (prevent path traversal)
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '')
    if (safeFilename !== filename || filename.includes('..')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename format'
      })
    }
    
    const branchId = branch_id || '1'
    
    // Delete the file
    const deleted = deleteApplicantDocumentFile(branchId, applicant_id, filename)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Document "${filename}" not found`
      })
    }
    
    res.status(200).json({
      success: true,
      message: `Document "${filename}" deleted successfully`,
      data: {
        deleted_filename: filename,
        applicant_id: applicant_id
      }
    })
    
  } catch (error) {
    console.error('❌ Error deleting applicant document:', error)
    
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    })
  }
}

// =============================================
// DELETE ALL APPLICANT DOCUMENTS (for cleanup)
// =============================================
export async function deleteAllDocuments(req, res) {
  try {
    const { applicant_id } = req.params
    const { branch_id } = req.body
    
    if (!applicant_id) {
      return res.status(400).json({
        success: false,
        message: 'applicant_id is required'
      })
    }
    
    const branchId = branch_id || '1'
    
    // Delete all documents
    const deleted = deleteAllApplicantDocuments(branchId, applicant_id)
    
    res.status(200).json({
      success: true,
      message: deleted ? 'All documents deleted successfully' : 'No documents found to delete',
      data: {
        applicant_id: applicant_id
      }
    })
    
  } catch (error) {
    console.error('❌ Error deleting all applicant documents:', error)
    
    res.status(500).json({
      success: false,
      message: 'Error deleting documents',
      error: error.message
    })
  }
}

// =============================================
// UPLOAD DOCUMENTS DURING APPLICATION SUBMISSION
// =============================================
// This is called after applicant is created to save files
export async function saveApplicantDocumentsFromBase64(applicantId, branchId, documents) {
  const BASE_UPLOAD_DIR = 'C:/xampp/htdocs/digistall_uploads/applicants'
  
  try {
    const uploadPath = path.join(BASE_UPLOAD_DIR, String(branchId), String(applicantId))
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
      console.log(`✅ Created directory: ${uploadPath}`)
    }
    
    const savedFiles = []
    
    // Save each document
    for (const doc of documents) {
      if (!doc.data || !doc.filename) continue
      
      try {
        // Handle base64 data
        let fileData = doc.data
        if (fileData.includes(',')) {
          fileData = fileData.split(',')[1] // Remove data:image/...;base64, prefix
        }
        
        const buffer = Buffer.from(fileData, 'base64')
        const filePath = path.join(uploadPath, doc.filename)
        
        fs.writeFileSync(filePath, buffer)
        
        savedFiles.push({
          filename: doc.filename,
          url: generateApplicantDocumentUrl(branchId, applicantId, doc.filename),
          type: doc.type
        })
        
        console.log(`✅ Saved document: ${doc.filename}`)
      } catch (err) {
        console.error(`❌ Failed to save ${doc.filename}:`, err)
      }
    }
    
    return savedFiles
  } catch (error) {
    console.error('❌ Error saving applicant documents:', error)
    throw error
  }
}
