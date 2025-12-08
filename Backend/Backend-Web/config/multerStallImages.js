// =============================================
// MULTER CONFIGURATION FOR STALL IMAGES
// =============================================
// Purpose: Handle multiple image uploads for stalls
// Max: 10 images per stall
// Max Size: 10MB each
// Allowed: PNG, JPG, JPEG
// Storage: C:/xampp/htdocs/digistall_uploads/stalls/{branch_id}/{stall_number}/
// =============================================

import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Base upload directory (configurable via environment variable for Docker)
const BASE_UPLOAD_DIR = process.env.UPLOAD_DIR_STALLS || 'C:/xampp/htdocs/digistall_uploads/stalls'

// Configure storage with dynamic folder creation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      // Extract branch_id and stall_number from request body or params
      const branchId = req.body.branch_id || req.params.branch_id
      const stallNumber = req.body.stall_number || req.params.stall_number
      
      if (!branchId || !stallNumber) {
        return cb(new Error('branch_id and stall_number are required'), null)
      }
      
      // Create folder path: /stalls/{branch_id}/{stall_number}
      const uploadPath = path.join(BASE_UPLOAD_DIR, String(branchId), String(stallNumber))
      
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
      const branchId = req.body.branch_id || req.params.branch_id
      const stallNumber = req.body.stall_number || req.params.stall_number
      const uploadPath = path.join(BASE_UPLOAD_DIR, String(branchId), String(stallNumber))
      
      // Count existing files in the directory
      const existingFiles = fs.existsSync(uploadPath) ? fs.readdirSync(uploadPath) : []
      const imageFiles = existingFiles.filter(f => /\.(jpg|jpeg|png)$/i.test(f))
      
      // Get the next number (1.jpg, 2.jpg, etc.)
      let nextNumber = 1
      
      // Find the next available number
      while (imageFiles.some(f => f.startsWith(`${nextNumber}.`))) {
        nextNumber++
      }
      
      // Limit to 10 images
      if (nextNumber > 10) {
        return cb(new Error('Maximum of 10 images per stall reached'), null)
      }
      
      // Get file extension
      const ext = path.extname(file.originalname).toLowerCase()
      
      // Generate filename: 1.jpg, 2.jpg, etc.
      const filename = `${nextNumber}${ext}`
      
      cb(null, filename)
    } catch (error) {
      console.error('❌ Error generating filename:', error)
      cb(error, null)
    }
  }
})

// File filter - only allow images
const fileFilter = function (req, file, cb) {
  // Allowed extensions
  const allowedTypes = /jpeg|jpg|png/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)
  
  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb(new Error('Only PNG, JPG, and JPEG image files are allowed!'))
  }
}

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Maximum 10 files per request
  },
  fileFilter: fileFilter
})

// Generate full image URL
export function generateImageUrl(branchId, stallNumber, filename) {
  return `http://localhost/digistall_uploads/stalls/${branchId}/${stallNumber}/${filename}`
}

// Get stall image directory path
export function getStallImageDirectory(branchId, stallNumber) {
  return path.join(BASE_UPLOAD_DIR, String(branchId), String(stallNumber))
}

// Delete image file from filesystem
export function deleteImageFile(branchId, stallNumber, filename) {
  try {
    const filePath = path.join(BASE_UPLOAD_DIR, String(branchId), String(stallNumber), filename)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`✅ Deleted image file: ${filePath}`)
      return true
    } else {
      console.warn(`⚠️ File not found: ${filePath}`)
      return false
    }
  } catch (error) {
    console.error('❌ Error deleting image file:', error)
    throw error
  }
}

// Count existing images for a stall
export function countStallImages(branchId, stallNumber) {
  try {
    const uploadPath = path.join(BASE_UPLOAD_DIR, String(branchId), String(stallNumber))
    
    if (!fs.existsSync(uploadPath)) {
      return 0
    }
    
    const files = fs.readdirSync(uploadPath)
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    
    return imageFiles.length
  } catch (error) {
    console.error('❌ Error counting images:', error)
    return 0
  }
}

// Middleware to check image limit before upload
export function checkImageLimit(req, res, next) {
  try {
    const branchId = req.body.branch_id || req.params.branch_id
    const stallNumber = req.body.stall_number || req.params.stall_number
    
    if (!branchId || !stallNumber) {
      return res.status(400).json({
        success: false,
        message: 'branch_id and stall_number are required'
      })
    }
    
    const currentCount = countStallImages(branchId, stallNumber)
    const filesCount = req.files ? req.files.length : (req.file ? 1 : 0)
    
    if (currentCount + filesCount > 10) {
      return res.status(400).json({
        success: false,
        message: `Cannot upload ${filesCount} images. Current: ${currentCount}/10. Maximum of 10 images per stall.`
      })
    }
    
    next()
  } catch (error) {
    console.error('❌ Error checking image limit:', error)
    res.status(500).json({
      success: false,
      message: 'Error checking image limit',
      error: error.message
    })
  }
}

export default upload
