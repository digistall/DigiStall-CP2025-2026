// =============================================
// STALL IMAGE CONTROLLER
// =============================================
// Purpose: Handle multiple stall image operations
// Features: Upload, List, Delete, Set Primary
// Max: 10 images per stall, 2MB each, PNG/JPG only
// =============================================

import { createConnection } from '../../config/database.js'
import { generateImageUrl, deleteImageFile, countStallImages } from '../../config/multerStallImages.js'
import path from 'path'

// =============================================
// UPLOAD STALL IMAGES
// =============================================
export async function uploadStallImages(req, res) {
  let connection
  
  try {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      })
    }
    
    const { stall_id, branch_id, stall_number, is_primary } = req.body
    
    // Validate required fields
    if (!stall_id || !branch_id || !stall_number) {
      return res.status(400).json({
        success: false,
        message: 'stall_id, branch_id, and stall_number are required'
      })
    }
    
    connection = await createConnection()
    
    // Verify stall exists
    const [stalls] = await connection.execute(
      'SELECT stall_id, branch_id, stall_number FROM stalls WHERE stall_id = ?',
      [stall_id]
    )
    
    if (stalls.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      })
    }
    
    // Check current image count
    const [currentImages] = await connection.execute(
      'SELECT COUNT(*) as count FROM stall_images WHERE stall_id = ?',
      [stall_id]
    )
    
    const currentCount = currentImages[0].count
    const newCount = currentCount + req.files.length
    
    if (newCount > 10) {
      return res.status(400).json({
        success: false,
        message: `Cannot upload ${req.files.length} images. Current: ${currentCount}/10. Maximum of 10 images per stall.`
      })
    }
    
    // Insert images into database
    const uploadedImages = []
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i]
      const imageUrl = generateImageUrl(branch_id, stall_number, file.filename)
      const isPrimary = (i === 0 && is_primary === 'true') ? 1 : 0
      
      // Insert into database using stored procedure
      const [result] = await connection.execute(
        'CALL sp_addStallImage(?, ?, ?)',
        [stall_id, imageUrl, isPrimary]
      )
      
      uploadedImages.push({
        id: result[0][0].id,
        stall_id: stall_id,
        image_url: imageUrl,
        filename: file.filename,
        display_order: result[0][0].display_order,
        is_primary: result[0][0].is_primary,
        created_at: result[0][0].created_at
      })
    }
    
    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} image(s)`,
      data: {
        images: uploadedImages,
        total_images: newCount
      }
    })
    
  } catch (error) {
    console.error('❌ Error uploading stall images:', error)
    
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// =============================================
// GET STALL IMAGES
// =============================================
export async function getStallImages(req, res) {
  let connection
  
  try {
    const { stall_id } = req.params
    
    if (!stall_id) {
      return res.status(400).json({
        success: false,
        message: 'stall_id is required'
      })
    }
    
    connection = await createConnection()
    
    // Get images using stored procedure
    const [result] = await connection.execute('CALL sp_getStallImages(?)', [stall_id])
    const images = result[0]
    
    res.status(200).json({
      success: true,
      message: 'Images retrieved successfully',
      data: {
        images: images,
        total: images.length
      }
    })
    
  } catch (error) {
    console.error('❌ Error getting stall images:', error)
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving images',
      error: error.message
    })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// =============================================
// DELETE STALL IMAGE
// =============================================
export async function deleteStallImage(req, res) {
  let connection
  
  try {
    const { image_id } = req.params
    
    if (!image_id) {
      return res.status(400).json({
        success: false,
        message: 'image_id is required'
      })
    }
    
    connection = await createConnection()
    
    // Get image details before deletion
    const [images] = await connection.execute(
      `SELECT si.*, s.branch_id, s.stall_number 
       FROM stall_images si
       JOIN stalls s ON si.stall_id = s.stall_id
       WHERE si.id = ?`,
      [image_id]
    )
    
    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }
    
    const image = images[0]
    
    // Delete from database using stored procedure
    await connection.execute('CALL sp_deleteStallImage(?)', [image_id])
    
    // Delete file from filesystem
    const filename = path.basename(image.image_url)
    deleteImageFile(image.branch_id, image.stall_number, filename)
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        deleted_image_id: image_id
      }
    })
    
  } catch (error) {
    console.error('❌ Error deleting stall image:', error)
    
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// =============================================
// SET PRIMARY IMAGE
// =============================================
export async function setStallPrimaryImage(req, res) {
  let connection
  
  try {
    const { image_id } = req.params
    
    if (!image_id) {
      return res.status(400).json({
        success: false,
        message: 'image_id is required'
      })
    }
    
    connection = await createConnection()
    
    // Set primary image using stored procedure
    await connection.execute('CALL sp_setStallPrimaryImage(?)', [image_id])
    
    res.status(200).json({
      success: true,
      message: 'Primary image updated successfully',
      data: {
        primary_image_id: image_id
      }
    })
    
  } catch (error) {
    console.error('❌ Error setting primary image:', error)
    
    res.status(500).json({
      success: false,
      message: 'Error setting primary image',
      error: error.message
    })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// =============================================
// GET STALL IMAGE COUNT
// =============================================
export async function getStallImageCount(req, res) {
  let connection
  
  try {
    const { stall_id } = req.params
    
    if (!stall_id) {
      return res.status(400).json({
        success: false,
        message: 'stall_id is required'
      })
    }
    
    connection = await createConnection()
    
    // Get image count
    const [result] = await connection.execute(
      'SELECT COUNT(*) as count FROM stall_images WHERE stall_id = ?',
      [stall_id]
    )
    
    const count = result[0].count
    const remaining = 10 - count
    
    res.status(200).json({
      success: true,
      message: 'Image count retrieved successfully',
      data: {
        current: count,
        remaining: remaining,
        max: 10
      }
    })
    
  } catch (error) {
    console.error('❌ Error getting image count:', error)
    
    res.status(500).json({
      success: false,
      message: 'Error getting image count',
      error: error.message
    })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// =============================================
// DELETE STALL IMAGE BY FILENAME
// =============================================
// This endpoint deletes an image file directly from htdocs
// by specifying the stall_id and filename (e.g., "1.png")
// =============================================
export async function deleteStallImageByFilename(req, res) {
  let connection
  
  try {
    const { stall_id, filename } = req.params
    const { stall_no, branch_id } = req.body
    
    // Validate required fields
    if (!stall_id || !filename) {
      return res.status(400).json({
        success: false,
        message: 'stall_id and filename are required'
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
    
    connection = await createConnection()
    
    // Get stall info if not provided
    let stallNumber = stall_no
    let branchId = branch_id
    
    if (!stallNumber || !branchId) {
      const [stalls] = await connection.execute(
        'SELECT stall_number, branch_id FROM stalls WHERE stall_id = ?',
        [stall_id]
      )
      
      if (stalls.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Stall not found'
        })
      }
      
      stallNumber = stalls[0].stall_number
      branchId = stalls[0].branch_id
    }
    
    console.log(`🗑️ Deleting image: ${filename} for stall ${stallNumber} (branch ${branchId})`)
    
    // Delete the file from htdocs
    const deleted = deleteImageFile(branchId, stallNumber, filename)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Image file "${filename}" not found`
      })
    }
    
    // Also try to delete from database if it exists there
    const imageUrl = `%${filename}`
    await connection.execute(
      'DELETE FROM stall_images WHERE stall_id = ? AND image_url LIKE ?',
      [stall_id, imageUrl]
    ).catch(err => {
      console.log('Note: Image was not in database (htdocs only):', err.message)
    })
    
    res.status(200).json({
      success: true,
      message: `Image "${filename}" deleted successfully`,
      data: {
        deleted_filename: filename,
        stall_id: stall_id,
        stall_number: stallNumber
      }
    })
    
  } catch (error) {
    console.error('❌ Error deleting stall image by filename:', error)
    
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}
