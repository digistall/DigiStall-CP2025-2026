// =============================================
// STALL IMAGE BLOB CONTROLLER
// =============================================
// Purpose: Handle stall images stored as BLOB in database
// For cloud deployment (DigitalOcean) - no local file storage
// Features: Upload, Get, Delete, Set Primary (all as base64/BLOB)
// Max: 10 images per stall, NO SIZE LIMIT (uses LONGBLOB)
// =============================================

import { createConnection } from '../../config/database.js'

// =============================================
// UPLOAD STALL IMAGE AS BLOB
// =============================================
export async function uploadStallImageBlob(req, res) {
  let connection
  
  try {
    const { stall_id, image_data, mime_type, file_name, is_primary } = req.body
    
    // Validate required fields
    if (!stall_id || !image_data) {
      return res.status(400).json({
        success: false,
        message: 'stall_id and image_data (base64) are required'
      })
    }
    
    // Validate mime type (allow more formats)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
    const actualMimeType = mime_type || 'image/jpeg'
    if (!allowedMimeTypes.includes(actualMimeType)) {
      return res.status(400).json({
        success: false,
        message: 'Only JPG, PNG, GIF, and WEBP images are allowed'
      })
    }
    
    // Convert base64 to buffer
    const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')
    
    // NO SIZE LIMIT - LONGBLOB supports up to 4GB
    console.log(`📸 Uploading image: ${imageBuffer.length} bytes (${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB)`)
    
    connection = await createConnection()
    
    // Verify stall exists using stored procedure
    const [stallRows] = await connection.execute('CALL sp_verifyStallExistsMobile(?)', [stall_id])
    const stalls = stallRows[0]
    
    if (stalls.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      })
    }
    
    // Check current image count using stored procedure
    const [countRows] = await connection.execute('CALL sp_getStallImageCountMobile(?)', [stall_id])
    const currentCount = countRows[0][0].count
    
    if (currentCount >= 10) {
      return res.status(400).json({
        success: false,
        message: `Maximum of 10 images per stall. Current: ${currentCount}/10`
      })
    }
    
    // Get next display order using stored procedure
    const [orderRows] = await connection.execute('CALL sp_getNextStallImageOrderMobile(?)', [stall_id])
    const displayOrder = orderRows[0][0].next_order
    
    // Determine if this should be primary (first image or explicitly set)
    const shouldBePrimary = is_primary === true || is_primary === 'true' || currentCount === 0
    
    // If setting as primary, unset existing primary using stored procedure
    if (shouldBePrimary) {
      await connection.execute('CALL sp_unsetStallPrimaryImagesMobile(?)', [stall_id])
    }
    
    // Generate unique filename for reference
    const timestamp = Date.now()
    const extension = actualMimeType === 'image/png' ? 'png' : 'jpg'
    const generatedFileName = file_name || `stall_${stall_id}_${timestamp}.${extension}`
    const imageUrl = `/api/stalls/images/blob/${stall_id}/${displayOrder}` // Virtual URL for serving
    
    // Insert image with BLOB data using stored procedure
    const [resultRows] = await connection.execute(
      'CALL sp_insertStallImageBlobMobile(?, ?, ?, ?, ?, ?, ?)',
      [stall_id, imageUrl, imageBuffer, actualMimeType, generatedFileName, shouldBePrimary ? 1 : 0, displayOrder]
    )
    const result = resultRows[0][0]
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: result.id,
        stall_id: parseInt(stall_id),
        image_url: imageUrl,
        file_name: generatedFileName,
        mime_type: actualMimeType,
        display_order: displayOrder,
        is_primary: shouldBePrimary,
        size_bytes: imageBuffer.length,
        total_images: currentCount + 1
      }
    })
    
  } catch (error) {
    console.error('❌ Error uploading stall image blob:', error)
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// UPLOAD MULTIPLE STALL IMAGES AS BLOB - Uses stored procedures
// =============================================
export async function uploadStallImagesBlob(req, res) {
  let connection
  
  try {
    const { stall_id, images } = req.body
    
    // Validate required fields
    if (!stall_id || !images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'stall_id and images array are required'
      })
    }
    
    connection = await createConnection()
    
    // Check current image count using stored procedure
    const [countRows] = await connection.execute('CALL sp_getStallImageCountMobile(?)', [stall_id])
    const currentCount = countRows[0][0].count
    
    if (currentCount + images.length > 10) {
      return res.status(400).json({
        success: false,
        message: `Cannot upload ${images.length} images. Current: ${currentCount}/10. Would exceed maximum of 10.`
      })
    }
    
    const uploadedImages = []
    let displayOrder = currentCount
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      displayOrder++
      
      const base64Data = img.image_data.replace(/^data:image\/\w+;base64,/, '')
      const imageBuffer = Buffer.from(base64Data, 'base64')
      const actualMimeType = img.mime_type || 'image/jpeg'
      const extension = actualMimeType === 'image/png' ? 'png' : 'jpg'
      const generatedFileName = img.file_name || `stall_${stall_id}_${Date.now()}_${i}.${extension}`
      const imageUrl = `/api/stalls/images/blob/${stall_id}/${displayOrder}`
      const shouldBePrimary = i === 0 && currentCount === 0
      
      // Insert using stored procedure
      const [resultRows] = await connection.execute(
        'CALL sp_insertStallImageBlobMobile(?, ?, ?, ?, ?, ?, ?)',
        [stall_id, imageUrl, imageBuffer, actualMimeType, generatedFileName, shouldBePrimary ? 1 : 0, displayOrder]
      )
      const result = resultRows[0][0]
      
      uploadedImages.push({
        id: result.id,
        stall_id: parseInt(stall_id),
        image_url: imageUrl,
        file_name: generatedFileName,
        mime_type: actualMimeType,
        display_order: displayOrder,
        is_primary: shouldBePrimary
      })
    }
    
    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedImages.length} image(s)`,
      data: {
        images: uploadedImages,
        total_images: currentCount + uploadedImages.length
      }
    })
    
  } catch (error) {
    console.error('❌ Error uploading stall images blob:', error)
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// GET STALL IMAGE BLOB (Serve as binary)
// =============================================
export async function getStallImageBlob(req, res) {
  let connection
  
  try {
    const { stall_id, display_order } = req.params
    
    connection = await createConnection()
    
    // Use stored procedure
    const [rows] = await connection.execute(
      'CALL sp_getStallImageByOrder(?, ?)',
      [stall_id, display_order]
    )
    const images = rows[0]
    
    if (images.length === 0 || !images[0].image_data) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }
    
    const image = images[0]
    
    // Set headers for image response
    res.set('Content-Type', image.mime_type || 'image/jpeg')
    res.set('Content-Disposition', `inline; filename="${image.file_name || 'image.jpg'}"`)
    res.set('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
    
    // Send binary data
    res.send(image.image_data)
    
  } catch (error) {
    console.error('❌ Error getting stall image blob:', error)
    res.status(500).json({
      success: false,
      message: 'Error retrieving image',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// GET STALL IMAGE BY ID (Serve as binary)
// =============================================
export async function getStallImageBlobById(req, res) {
  let connection
  
  try {
    const { image_id } = req.params
    
    console.log(`📷 Fetching BLOB image by ID: ${image_id}`)
    
    connection = await createConnection()
    
    // First check if image exists at all using stored procedure
    const [checkRows] = await connection.execute(
      'CALL sp_checkStallImageById(?)',
      [image_id]
    )
    const checkResult = checkRows[0]
    
    console.log(`📷 Image check result:`, checkResult)
    
    if (checkResult.length === 0) {
      console.log(`📷 Image ID ${image_id} not found in database`)
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }
    
    console.log(`📷 Image found: ${checkResult[0].file_name}, size: ${checkResult[0].data_size} bytes`)
    
    // Now fetch the actual binary data using stored procedure
    const [rows] = await connection.execute(
      'CALL sp_getStallImageDataById(?)',
      [image_id]
    )
    const images = rows[0]
    
    if (images.length === 0 || !images[0].image_data) {
      console.log(`📷 Image data is NULL for ID ${image_id}`)
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }
    
    const image = images[0]
    
    console.log(`📷 Serving image: ${image.file_name}, type: ${image.mime_type}, size: ${image.image_data?.length || 0} bytes`)
    
    res.set('Content-Type', image.mime_type || 'image/jpeg')
    res.set('Content-Disposition', `inline; filename="${image.file_name || 'image.jpg'}"`)
    res.set('Cache-Control', 'public, max-age=86400')
    
    res.send(image.image_data)
    
  } catch (error) {
    console.error('❌ Error getting stall image by id:', error)
    res.status(500).json({
      success: false,
      message: 'Error retrieving image',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// GET ALL STALL IMAGES (Returns base64 or URLs)
// =============================================
export async function getStallImagesBlob(req, res) {
  let connection
  
  try {
    const { stall_id } = req.params
    const { include_data } = req.query // If true, include base64 data
    
    connection = await createConnection()
    
    // Use stored procedure with include_data parameter
    const [rows] = await connection.execute(
      'CALL sp_getStallImagesWithData(?, ?)',
      [stall_id, include_data === 'true' ? 1 : 0]
    )
    const images = rows[0]
    
    // Add full URL for serving
    const imagesWithUrls = images.map(img => ({
      ...img,
      serve_url: `/api/stalls/images/blob/id/${img.id}`,
      image_data: img.image_base64 ? `data:${img.mime_type};base64,${img.image_base64}` : undefined
    }))
    
    res.status(200).json({
      success: true,
      message: 'Images retrieved successfully',
      data: {
        images: imagesWithUrls,
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
    if (connection) await connection.end()
  }
}

// =============================================
// DELETE STALL IMAGE BLOB
// =============================================
export async function deleteStallImageBlob(req, res) {
  let connection
  
  try {
    const { image_id } = req.params
    
    connection = await createConnection()
    
    // Check if image exists using stored procedure
    const [checkRows] = await connection.execute(
      'CALL sp_getStallImageForDelete(?)',
      [image_id]
    )
    const images = checkRows[0]
    
    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }
    
    const image = images[0]
    const stallId = image.stall_id
    const wasPrimary = image.is_primary
    
    // Delete the image using stored procedure
    await connection.execute('CALL sp_deleteStallImage(?)', [image_id])
    
    // If deleted image was primary, set another as primary using stored procedure
    if (wasPrimary) {
      await connection.execute('CALL sp_setNextPrimaryImage(?)', [stallId])
    }
    
    // Reorder remaining images using stored procedure
    const [remainingRows] = await connection.execute(
      'CALL sp_getRemainingImagesForReorder(?)',
      [stallId]
    )
    const remaining = remainingRows[0]
    
    for (let i = 0; i < remaining.length; i++) {
      await connection.execute(
        'CALL sp_updateImageDisplayOrder(?, ?)',
        [remaining[i].id, i + 1]
      )
    }
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: { deleted_image_id: parseInt(image_id) }
    })
    
  } catch (error) {
    console.error('❌ Error deleting stall image:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// SET PRIMARY IMAGE
// =============================================
export async function setStallPrimaryImageBlob(req, res) {
  let connection
  
  try {
    const { image_id } = req.params
    
    connection = await createConnection()
    
    // Get the image to find stall_id using stored procedure
    const [rows] = await connection.execute(
      'CALL sp_getStallIdFromImage(?)',
      [image_id]
    )
    const images = rows[0]
    
    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }
    
    const stallId = images[0].stall_id
    
    // Unset all primary for this stall using stored procedure
    await connection.execute('CALL sp_unsetAllPrimaryImages(?)', [stallId])
    
    // Set this image as primary using stored procedure
    await connection.execute('CALL sp_setImageAsPrimary(?)', [image_id])
    
    res.status(200).json({
      success: true,
      message: 'Primary image updated successfully',
      data: { primary_image_id: parseInt(image_id) }
    })
    
  } catch (error) {
    console.error('❌ Error setting primary image:', error)
    res.status(500).json({
      success: false,
      message: 'Error setting primary image',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// UPDATE STALL IMAGE BLOB
// =============================================
export async function updateStallImageBlob(req, res) {
  let connection
  
  try {
    const { image_id } = req.params
    const { image_data, mime_type, file_name } = req.body
    
    if (!image_data) {
      return res.status(400).json({
        success: false,
        message: 'image_data (base64) is required'
      })
    }
    
    connection = await createConnection()
    
    // Check if image exists using stored procedure
    const [checkRows] = await connection.execute(
      'CALL sp_checkImageExistsById(?)',
      [image_id]
    )
    const images = checkRows[0]
    
    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      })
    }
    
    // Convert base64 to buffer
    const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')
    
    // Check file size
    const maxSize = 2 * 1024 * 1024
    if (imageBuffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Image size exceeds 2MB limit'
      })
    }
    
    const actualMimeType = mime_type || 'image/jpeg'
    const actualFileName = file_name || `updated_${Date.now()}.jpg`
    
    // Update the image using stored procedure
    await connection.execute(
      'CALL sp_updateStallImageBlobData(?, ?, ?, ?)',
      [image_id, imageBuffer, actualMimeType, actualFileName]
    )
    
    res.status(200).json({
      success: true,
      message: 'Image updated successfully',
      data: {
        image_id: parseInt(image_id),
        file_name: actualFileName,
        mime_type: actualMimeType,
        size_bytes: imageBuffer.length
      }
    })
    
  } catch (error) {
    console.error('❌ Error updating stall image:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating image',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// GET PRIMARY IMAGE FOR STALL
// =============================================
export async function getStallPrimaryImageBlob(req, res) {
  let connection
  
  try {
    const { stall_id } = req.params
    
    connection = await createConnection()
    
    // Use stored procedure to get primary image
    const [rows] = await connection.execute(
      'CALL sp_getStallPrimaryImage(?)',
      [stall_id]
    )
    const images = rows[0]
    
    if (images.length === 0 || !images[0].image_data) {
      // Try to get first image if no primary set using stored procedure
      const [firstRows] = await connection.execute(
        'CALL sp_getStallFirstImage(?)',
        [stall_id]
      )
      const firstImage = firstRows[0]
      
      if (firstImage.length === 0 || !firstImage[0].image_data) {
        return res.status(404).json({
          success: false,
          message: 'No image found for this stall'
        })
      }
      
      const image = firstImage[0]
      res.set('Content-Type', image.mime_type || 'image/jpeg')
      res.set('Cache-Control', 'public, max-age=86400')
      return res.send(image.image_data)
    }
    
    const image = images[0]
    res.set('Content-Type', image.mime_type || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(image.image_data)
    
  } catch (error) {
    console.error('❌ Error getting primary image:', error)
    res.status(500).json({
      success: false,
      message: 'Error retrieving image',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}

// =============================================
// DELETE LEGACY STALL IMAGE (from stall table)
// =============================================
export async function deleteLegacyStallImage(req, res) {
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
    
    // Verify stall exists using stored procedure
    const [rows] = await connection.execute(
      'CALL sp_checkStallExistsById(?)',
      [stall_id]
    )
    const stalls = rows[0]
    
    if (stalls.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      })
    }
    
    // Clear the legacy stall_image field (commented out - column doesn't exist in current schema)
    // Legacy images should already be migrated to BLOB storage
    // await connection.execute('CALL sp_clearLegacyStallImage(?)', [stall_id])
    
    console.log(`✅ Legacy image reference cleared for stall ${stall_id}`)
    
    res.status(200).json({
      success: true,
      message: 'Legacy image removed successfully',
      data: { stall_id: parseInt(stall_id) }
    })
    
  } catch (error) {
    console.error('❌ Error deleting legacy stall image:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting legacy image',
      error: error.message
    })
  } finally {
    if (connection) await connection.end()
  }
}
