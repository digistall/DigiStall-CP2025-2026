// =============================================
// MULTER CONFIGURATION FOR APPLICANT DOCUMENTS
// =============================================
// Purpose: Handle document uploads for applicants
// Types: Signature, House Location Sketch, Valid ID
// Storage: C:/xampp/htdocs/digistall_uploads/applicants/{branch_id}/{applicant_id}/
// =============================================

import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Base upload directory for applicants (configurable via environment variable for Docker)
const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR_APPLICANTS || 'C:/xampp/htdocs/digistall_uploads/applicants'

// Ensure base directory exists
if (!fs.existsSync(BASE_UPLOAD_DIR)) {
  fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true })
  console.log(`✅ Created base applicants directory: ${BASE_UPLOAD_DIR}`)
}

// Configure storage with dynamic folder creation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      // Extract branch_id and applicant_id from request body or params
      const branchId = req.body.branch_id || req.params.branch_id || '1'
      const applicantId = req.body.applicant_id || req.params.applicant_id
      
      if (!applicantId) {
        return cb(new Error('applicant_id is required'), null)
      }
      
      // Create folder path: /applicants/{branch_id}/{applicant_id}
      const uploadPath = path.join(BASE_UPLOAD_DIR, String(branchId), String(applicantId))
      
      // Create directories recursively if they don't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true })
        console.log(`✅ Created directory: ${uploadPath}`)
      }
      
      cb(null, uploadPath)
    } catch (error) {
      console.error('❌ Error creating directory:', error)
      cb(error, null)
    }
  },
  
  filename: function (req, file, cb) {
    try {
      // Get document type from field name or body
      const documentType = file.fieldname || req.body.document_type || 'document'
      
      // Get file extension
      const ext = path.extname(file.originalname).toLowerCase()
      
      // Generate filename based on document type
      // signature.png, house_location.png, valid_id.png
      let filename
      switch (documentType) {
        case 'signature':
        case 'applicantSignature':
          filename = `signature${ext}`
          break
        case 'house_location':
        case 'applicantLocation':
          filename = `house_location${ext}`
          break
        case 'valid_id':
        case 'applicantValidID':
          filename = `valid_id${ext}`
          break
        default:
          // For unknown types, use timestamp to avoid conflicts
          filename = `${documentType}_${Date.now()}${ext}`
      }
      
      cb(null, filename)
    } catch (error) {
      console.error('❌ Error generating filename:', error)
      cb(error, null)
    }
  }
})

// File filter - only allow images and PDFs
const fileFilter = function (req, file, cb) {
  // Allowed extensions
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = /image\/|application\/pdf/.test(file.mimetype)
  
  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb(new Error('Only image files (PNG, JPG, JPEG, GIF, WebP) and PDFs are allowed!'))
  }
}

// Multer configuration
const applicantUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter
})

// Export multer middleware for document uploads
// Accepts: signature, house_location, valid_id (all optional, max 1 each)
export const uploadApplicantDocs = applicantUpload.fields([
  { name: 'signature', maxCount: 1 },
  { name: 'applicantSignature', maxCount: 1 },
  { name: 'house_location', maxCount: 1 },
  { name: 'applicantLocation', maxCount: 1 },
  { name: 'valid_id', maxCount: 1 },
  { name: 'applicantValidID', maxCount: 1 }
])

// Generate full document URL
export function generateApplicantDocumentUrl(branchId, applicantId, filename) {
  return `http://localhost/digistall_uploads/applicants/${branchId}/${applicantId}/${filename}`
}

// Get applicant documents directory path
export function getApplicantDocumentDirectory(branchId, applicantId) {
  return path.join(BASE_UPLOAD_DIR, String(branchId), String(applicantId))
}

// Delete document file from filesystem
export function deleteApplicantDocumentFile(branchId, applicantId, filename) {
  try {
    const filePath = path.join(BASE_UPLOAD_DIR, String(branchId), String(applicantId), filename)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`✅ Deleted document file: ${filePath}`)
      return true
    } else {
      console.warn(`⚠️ File not found: ${filePath}`)
      return false
    }
  } catch (error) {
    console.error('❌ Error deleting document file:', error)
    throw error
  }
}

// List all documents for an applicant
export function listApplicantDocuments(branchId, applicantId) {
  try {
    const uploadPath = path.join(BASE_UPLOAD_DIR, String(branchId), String(applicantId))
    
    if (!fs.existsSync(uploadPath)) {
      return []
    }
    
    const files = fs.readdirSync(uploadPath)
    const documents = files.map(filename => {
      const filePath = path.join(uploadPath, filename)
      const stats = fs.statSync(filePath)
      
      return {
        filename: filename,
        url: generateApplicantDocumentUrl(branchId, applicantId, filename),
        size: stats.size,
        created_at: stats.birthtime,
        modified_at: stats.mtime
      }
    })
    
    return documents
  } catch (error) {
    console.error('❌ Error listing documents:', error)
    return []
  }
}

// Delete all documents for an applicant (cleanup)
export function deleteAllApplicantDocuments(branchId, applicantId) {
  try {
    const uploadPath = path.join(BASE_UPLOAD_DIR, String(branchId), String(applicantId))
    
    if (fs.existsSync(uploadPath)) {
      fs.rmSync(uploadPath, { recursive: true, force: true })
      console.log(`✅ Deleted all documents for applicant ${applicantId}`)
      return true
    }
    return false
  } catch (error) {
    console.error('❌ Error deleting applicant documents:', error)
    throw error
  }
}

// Save document from base64 data (used during application submission)
export function saveApplicantDocumentFromBase64(branchId, applicantId, documentType, base64Data, originalFilename) {
  try {
    const uploadPath = path.join(BASE_UPLOAD_DIR, String(branchId), String(applicantId))
    
    // Create directories if they don't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
      console.log(`✅ Created directory: ${uploadPath}`)
    }
    
    // Get file extension from original filename or base64 header
    let ext = '.png' // default
    if (originalFilename) {
      ext = path.extname(originalFilename).toLowerCase()
    } else if (base64Data.includes('data:image/')) {
      const match = base64Data.match(/data:image\/([a-z]+);/)
      if (match) {
        ext = `.${match[1]}`
      }
    }
    
    // Generate filename based on document type
    let filename
    switch (documentType) {
      case 'signature':
      case 'applicantSignature':
        filename = `signature${ext}`
        break
      case 'house_location':
      case 'applicantLocation':
        filename = `house_location${ext}`
        break
      case 'valid_id':
      case 'applicantValidID':
        filename = `valid_id${ext}`
        break
      default:
        filename = `${documentType}_${Date.now()}${ext}`
    }
    
    // Remove base64 prefix if present
    let fileData = base64Data
    if (fileData.includes(',')) {
      fileData = fileData.split(',')[1]
    }
    
    // Decode and save file
    const buffer = Buffer.from(fileData, 'base64')
    const filePath = path.join(uploadPath, filename)
    
    fs.writeFileSync(filePath, buffer)
    console.log(`✅ Saved document: ${filePath}`)
    
    return {
      filename: filename,
      url: generateApplicantDocumentUrl(branchId, applicantId, filename),
      path: filePath
    }
  } catch (error) {
    console.error('❌ Error saving document from base64:', error)
    throw error
  }
}

// =============================================
// BLOB STORAGE FUNCTIONS (Cloud Database)
// =============================================
// Use environment variable to toggle between file and BLOB storage
// Set USE_BLOB_STORAGE=true for cloud deployment
export const USE_BLOB_STORAGE = process.env.USE_BLOB_STORAGE === 'true' || true // Default to BLOB for cloud

// Save document to database as BLOB
export async function saveApplicantDocumentToBlob(connection, applicantId, businessOwnerId, branchId, documentType, base64Data, originalFilename) {
  try {
    // Get file extension and mime type
    let ext = '.png'
    let mimeType = 'image/png'
    
    if (originalFilename) {
      ext = path.extname(originalFilename).toLowerCase()
    }
    
    if (base64Data.includes('data:')) {
      const match = base64Data.match(/data:([^;]+);/)
      if (match) {
        mimeType = match[1]
        const extMatch = mimeType.split('/')[1]
        if (extMatch) ext = `.${extMatch}`
      }
    }
    
    // Map document type to document_type_id
    const documentTypeMap = {
      'signature': 1,
      'applicantSignature': 1,
      'house_location': 2,
      'applicantLocation': 2,
      'valid_id': 3,
      'applicantValidID': 3
    }
    
    const documentTypeId = documentTypeMap[documentType] || 1
    
    // Generate filename
    const timestamp = Date.now()
    let filename
    switch (documentType) {
      case 'signature':
      case 'applicantSignature':
        filename = `signature_${applicantId}_${timestamp}${ext}`
        break
      case 'house_location':
      case 'applicantLocation':
        filename = `house_location_${applicantId}_${timestamp}${ext}`
        break
      case 'valid_id':
      case 'applicantValidID':
        filename = `valid_id_${applicantId}_${timestamp}${ext}`
        break
      default:
        filename = `${documentType}_${applicantId}_${timestamp}${ext}`
    }
    
    // Remove base64 prefix if present and convert to buffer
    let fileData = base64Data
    if (fileData.includes(',')) {
      fileData = fileData.split(',')[1]
    }
    const documentBuffer = Buffer.from(fileData, 'base64')
    
    // Virtual file path for API endpoint
    const virtualFilePath = `/api/applicants/documents/blob/${applicantId}/${documentTypeId}`
    
    // Check if document already exists
    const [existingDocs] = await connection.query(
      `SELECT document_id FROM applicant_documents 
       WHERE applicant_id = ? AND business_owner_id = ? AND document_type_id = ?`,
      [applicantId, businessOwnerId, documentTypeId]
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
             updated_at = NOW()
         WHERE document_id = ?`,
        [virtualFilePath, filename, documentBuffer.length, mimeType, documentBuffer, documentId]
      )
    } else {
      // Insert new document
      const [result] = await connection.query(
        `INSERT INTO applicant_documents (
           applicant_id, business_owner_id, branch_id, document_type_id,
           file_path, original_filename, file_size, mime_type,
           document_data, storage_type, verification_status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'blob', 'pending')`,
        [applicantId, businessOwnerId, branchId || null, documentTypeId,
         virtualFilePath, filename, documentBuffer.length, mimeType, documentBuffer]
      )
      documentId = result.insertId
    }
    
    console.log(`✅ Saved document to BLOB: ${filename} (${isUpdate ? 'updated' : 'new'})`)
    
    return {
      document_id: documentId,
      filename: filename,
      url: virtualFilePath,
      size: documentBuffer.length,
      mime_type: mimeType,
      storage_type: 'blob',
      is_update: isUpdate
    }
  } catch (error) {
    console.error('❌ Error saving document to BLOB:', error)
    throw error
  }
}

export default applicantUpload
