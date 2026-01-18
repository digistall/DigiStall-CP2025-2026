import { createConnection } from '../../config/database.js'

// Get all available stalls for mobile app (restricted to applicant's applied areas) - Uses stored procedures
export const getAllStalls = async (req, res) => {
  const connection = await createConnection()
  
  try {
    const { applicant_id } = req.query

    if (!applicant_id) {
      return res.status(400).json({
        success: false,
        message: 'Applicant ID is required'
      })
    }

    // First, get the areas where this applicant has applied using stored procedure
    const [appliedAreasRows] = await connection.execute('CALL sp_getAppliedAreasForApplicant(?)', [applicant_id])
    const appliedAreas = appliedAreasRows[0]

    if (appliedAreas.length === 0) {
      return res.json({
        success: true,
        message: 'No applications found. Please apply to a stall first to see available stalls in that area.',
        data: {
          all_stalls: [],
          stalls_by_type: { 'Fixed Price': [], 'Raffle': [], 'Auction': [] },
          stalls_by_area: {},
          total_count: 0,
          type_counts: { fixed: 0, raffle: 0, auction: 0 },
          applied_areas: [],
          restriction_message: 'Stalls are restricted to areas where you have applications'
        }
      })
    }

    // Build area list for stored procedure (quoted values for IN clause)
    const areaList = appliedAreas.map(area => `'${area.area}'`).join(',')

    // Get available stalls using stored procedure
    const [stallsRows] = await connection.execute('CALL sp_getAvailableStallsForApplicant(?, ?)', [applicant_id, areaList])
    const availableStalls = stallsRows[0]

    // Format stalls for mobile app - using correct column names from stored procedure
    const formattedStalls = availableStalls.map(stall => ({
      id: stall.stall_id,
      stallNumber: stall.stall_number,
      location: stall.stall_location,
      size: stall.stall_size || stall.size,
      price: stall.rental_price ? stall.rental_price.toLocaleString() : (stall.monthly_rent ? stall.monthly_rent.toLocaleString() : '0'),
      priceValue: stall.rental_price || stall.monthly_rent || 0,
      priceType: stall.price_type,
      status: stall.application_status,
      description: stall.description || 'No description available',
      image: stall.stall_image || 'https://oldspitalfieldsmarket.com/cms/2017/10/OSM_FP_Stall_sq-1440x1440.jpg',
      
      // Branch information
      branch: {
        id: stall.branch_id,
        name: stall.branch_name,
        area: stall.area,
        location: stall.location
      },
      
      // Floor and section info - use floor_level/section from stall table if floor_name/section_name are null
      floor: stall.floor_name || stall.floor_level || 'N/A',
      section: stall.section_name || stall.section || 'N/A',
      floorSection: `${stall.floor_name || stall.floor_level || 'N/A'} / ${stall.section_name || stall.section || 'N/A'}`,
      
      // Application status - now includes joined_raffle and joined_auction status
      canApply: stall.application_status === 'available',
      isApplied: stall.application_status === 'applied',
      hasJoinedRaffle: stall.application_status === 'joined_raffle',
      hasJoinedAuction: stall.application_status === 'joined_auction'
    }))

    // Group stalls by price type for easier mobile app consumption
    const stallsByType = {
      'Fixed Price': formattedStalls.filter(s => s.priceType === 'Fixed Price'),
      'Raffle': formattedStalls.filter(s => s.priceType === 'Raffle'),
      'Auction': formattedStalls.filter(s => s.priceType === 'Auction')
    }

    // Group stalls by area
    const stallsByArea = {}
    formattedStalls.forEach(stall => {
      if (!stallsByArea[stall.branch.area]) {
        stallsByArea[stall.branch.area] = []
      }
      stallsByArea[stall.branch.area].push(stall)
    })

    res.json({
      success: true,
      message: `Stalls retrieved successfully from your applied areas: ${appliedAreas.map(a => a.area).join(', ')}`,
      data: {
        all_stalls: formattedStalls,
        stalls_by_type: stallsByType,
        stalls_by_area: stallsByArea,
        total_count: formattedStalls.length,
        type_counts: {
          fixed: stallsByType['Fixed Price'].length,
          raffle: stallsByType['Raffle'].length,
          auction: stallsByType['Auction'].length
        },
        applied_areas: appliedAreas,
        restriction_info: {
          message: 'Stalls are restricted to areas where you have applications',
          areas_with_access: appliedAreas.map(area => area.area)
        }
      }
    })

  } catch (error) {
    console.error('Get all stalls error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stalls',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  } finally {
    await connection.end()
  }
}

// Get stalls by type (Fixed Price, Raffle, Auction) - restricted to applicant's applied areas - Uses stored procedures
export const getStallsByType = async (req, res) => {
  const connection = await createConnection()
  
  try {
    const { type } = req.params
    const { applicant_id } = req.query

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Stall type is required'
      })
    }

    if (!applicant_id) {
      return res.status(400).json({
        success: false,
        message: 'Applicant ID is required'
      })
    }

    const validTypes = ['Fixed Price', 'Raffle', 'Auction']
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stall type. Must be: Fixed Price, Raffle, or Auction'
      })
    }

    // First, get the areas where this applicant has applied using stored procedure
    const [appliedAreasRows] = await connection.execute('CALL sp_getAppliedAreasForApplicant(?)', [applicant_id])
    const appliedAreas = appliedAreasRows[0]

    if (appliedAreas.length === 0) {
      return res.json({
        success: true,
        message: 'No applications found. Please apply to a stall first to see available stalls in that area.',
        data: {
          stalls: [],
          type: type,
          total_count: 0,
          available_count: 0,
          applied_count: 0,
          restriction_message: 'Stalls are restricted to areas where you have applications'
        }
      })
    }

    // Get stalls by type using stored procedure (without area restriction for now)
    const [stallsRows] = await connection.execute('CALL sp_getStallsByTypeForApplicant(?, ?, ?)', [type, applicant_id, null])
    const stalls = stallsRows[0]

    // For each stall, fetch images from stall_images table (images stored as BLOB)
    const stallsWithImages = await Promise.all(stalls.map(async (stall) => {
      const [imageRows] = await connection.execute(
        'SELECT image_id, image_name, is_primary FROM stall_images WHERE stall_id = ? ORDER BY is_primary DESC, image_id ASC',
        [stall.stall_id]
      )
      
      // Map image IDs to API URLs for fetching BLOB data
      const imagesWithUrls = imageRows.map(img => ({
        ...img,
        image_url: `/api/mobile/stalls/image/${img.image_id}`
      }))
      
      return {
        ...stall,
        images: imagesWithUrls,
        primary_image: imagesWithUrls.length > 0 ? imagesWithUrls[0].image_url : null,
        primary_image_id: stall.primary_image_id || (imagesWithUrls.length > 0 ? imagesWithUrls[0].image_id : null)
      }
    }))

    // Format for mobile app
    const formattedStalls = stallsWithImages.map(stall => ({
      id: stall.stall_id,
      stallNumber: stall.stall_number,
      location: stall.stall_location,
      size: stall.stall_size || stall.size,
      price: stall.monthly_rent ? stall.monthly_rent.toLocaleString() : (stall.rental_price ? stall.rental_price.toLocaleString() : '0'),
      priceValue: stall.monthly_rent || stall.rental_price || 0,
      priceType: stall.price_type,
      status: stall.application_status,
      description: stall.description || 'No description available',
      image: stall.primary_image || 'https://oldspitalfieldsmarket.com/cms/2017/10/OSM_FP_Stall_sq-1440x1440.jpg',
      images: stall.images || [],
      
      // Branch information
      branch: {
        id: stall.branch_id,
        name: stall.branch_name,
        area: stall.area,
        location: stall.area
      },
      
      // Floor and section info - use floor_level/section from stall table if floor_name/section_name are null
      floor: stall.floor_name || stall.floor_level || 'N/A',
      section: stall.section_name || stall.section || 'N/A',
      floorSection: `${stall.floor_name || stall.floor_level || 'N/A'} / ${stall.section_name || stall.section || 'N/A'}`,
      
      // Application status - now includes joined_raffle and joined_auction status
      canApply: stall.application_status === 'available',
      isApplied: stall.application_status === 'applied',
      hasJoinedRaffle: stall.application_status === 'joined_raffle',
      hasJoinedAuction: stall.application_status === 'joined_auction',
      
      // Special fields for auction stalls
      ...(type === 'Auction' && {
        currentBid: stall.rental_price || 0,
        currentBidder: null,
        auctionDate: "To be announced",
        startTime: "To be announced"
      })
    }))

    res.json({
      success: true,
      message: `${type} stalls retrieved successfully from your applied areas: ${appliedAreas.map(a => a.area).join(', ')}`,
      data: {
        stalls: formattedStalls,
        type: type,
        total_count: formattedStalls.length,
        available_count: formattedStalls.filter(s => s.canApply).length,
        applied_count: formattedStalls.filter(s => s.isApplied).length,
        applied_areas: appliedAreas,
        restriction_info: {
          message: 'Stalls are restricted to areas where you have applications',
          areas_with_access: appliedAreas.map(area => area.area)
        }
      }
    })

  } catch (error) {
    console.error('Get stalls by type error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stalls by type',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  } finally {
    await connection.end()
  }
}

// Get stalls by area - restricted to applicant's applied areas - Uses stored procedures
export const getStallsByArea = async (req, res) => {
  const connection = await createConnection()
  
  try {
    const { area } = req.params
    const { applicant_id, type } = req.query

    if (!area) {
      return res.status(400).json({
        success: false,
        message: 'Area is required'
      })
    }

    if (!applicant_id) {
      return res.status(400).json({
        success: false,
        message: 'Applicant ID is required'
      })
    }

    // Check if the applicant has applied to this area using stored procedure
    const [accessRows] = await connection.execute('CALL sp_checkApplicantAreaAccess(?, ?)', [applicant_id, area])
    const accessCheck = accessRows[0]

    if (!accessCheck || accessCheck.length === 0 || accessCheck[0].has_access === 0) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You don't have applications in ${area}. You can only view stalls in areas where you have submitted applications.`,
        data: {
          requested_area: area,
          restriction_message: 'Stalls are restricted to areas where you have applications'
        }
      })
    }

    // Get stalls by area using stored procedure
    const [stallsRows] = await connection.execute('CALL sp_getStallsByAreaForApplicant(?, ?, ?)', [applicant_id, area, type || ''])
    const stalls = stallsRows[0]

    // Format for mobile app
    const formattedStalls = stalls.map(stall => ({
      id: stall.stall_id,
      stallNumber: stall.stall_no,
      location: stall.stall_location,
      size: stall.size,
      price: stall.rental_price ? stall.rental_price.toLocaleString() : '0',
      priceValue: stall.rental_price || 0,
      priceType: stall.price_type,
      status: stall.application_status,
      description: stall.description || 'No description available',
      image: stall.stall_image || 'https://oldspitalfieldsmarket.com/cms/2017/10/OSM_FP_Stall_sq-1440x1440.jpg',
      
      // Branch information
      branch: {
        id: stall.branch_id,
        name: stall.branch_name,
        area: stall.area,
        location: stall.location
      },
      
      // Floor and section info
      floor: stall.floor_name,
      section: stall.section_name,
      floorSection: `${stall.floor_name} / ${stall.section_name}`,
      
      // Application status
      canApply: stall.application_status === 'available',
      isApplied: stall.application_status === 'applied'
    }))

    // Group by type
    const stallsByType = {
      'Fixed Price': formattedStalls.filter(s => s.priceType === 'Fixed Price'),
      'Raffle': formattedStalls.filter(s => s.priceType === 'Raffle'),
      'Auction': formattedStalls.filter(s => s.priceType === 'Auction')
    }

    res.json({
      success: true,
      message: `Stalls in ${area} retrieved successfully`,
      data: {
        stalls: formattedStalls,
        stalls_by_type: stallsByType,
        area: area,
        total_count: formattedStalls.length,
        type_counts: {
          fixed: stallsByType['Fixed Price'].length,
          raffle: stallsByType['Raffle'].length,
          auction: stallsByType['Auction'].length
        }
      }
    })

  } catch (error) {
    console.error('Get stalls by area error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stalls by area',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  } finally {
    await connection.end()
  }
}

// Get stall details by ID
export const getStallById = async (req, res) => {
  const connection = await createConnection()
  
  try {
    const { id } = req.params
    const { applicant_id } = req.query

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Stall ID is required'
      })
    }

    // Get stall details using stored procedure
    const [stallDataRows] = await connection.execute('CALL sp_getStallDetailForApplicant(?, ?)', [id, applicant_id || null])
    const stallData = stallDataRows[0]

    if (stallData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      })
    }

    const stall = stallData[0]

    // Check application limits if applicant_id provided using stored procedure
    let applicationLimits = null
    if (applicant_id) {
      const [branchAppRows] = await connection.execute('CALL sp_countBranchApplications(?, ?)', [applicant_id, stall.branch_id])
      const branchApplications = branchAppRows[0]

      applicationLimits = {
        current_applications_in_branch: branchApplications[0].count,
        max_applications_per_branch: 2,
        can_apply_more: branchApplications[0].count < 2
      }
    }

    // Format for mobile app
    const formattedStall = {
      id: stall.stall_id,
      stallNumber: stall.stall_no,
      location: stall.stall_location,
      size: stall.size,
      price: stall.rental_price ? stall.rental_price.toLocaleString() : '0',
      priceValue: stall.rental_price || 0,
      priceType: stall.price_type,
      status: stall.application_status,
      description: stall.description || 'No description available',
      image: stall.stall_image || 'https://oldspitalfieldsmarket.com/cms/2017/10/OSM_FP_Stall_sq-1440x1440.jpg',
      
      // Branch information
      branch: {
        id: stall.branch_id,
        name: stall.branch_name,
        area: stall.area,
        location: stall.location,
        address: stall.branch_address
      },
      
      // Floor and section info
      floor: stall.floor_name,
      section: stall.section_name,
      floorSection: `${stall.floor_name} / ${stall.section_name}`,
      
      // Application status
      canApply: stall.application_status === 'available' && 
                (applicationLimits ? applicationLimits.can_apply_more : true),
      isApplied: stall.application_status === 'applied',
      
      // Application details if applied
      ...(stall.application_status === 'applied' && {
        application: {
          id: stall.application_id,
          date: stall.application_date,
          status: stall.app_status
        }
      }),
      
      // Application limits info
      ...(applicationLimits && { application_limits: applicationLimits }),
      
      // Timestamps
      created_at: stall.created_at,
      updated_at: stall.updated_at,
      
      // Special fields for auction stalls
      ...(stall.price_type === 'Auction' && {
        currentBid: stall.rental_price || 0,
        currentBidder: null,
        auctionDate: "To be announced",
        startTime: "To be announced"
      })
    }

    res.json({
      success: true,
      message: 'Stall details retrieved successfully',
      data: formattedStall
    })

  } catch (error) {
    console.error('Get stall by ID error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stall details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  } finally {
    await connection.end()
  }
}

// Get available areas for stalls - only areas where applicant has applications - Uses stored procedures
export const getAvailableAreas = async (req, res) => {
  const connection = await createConnection()
  
  try {
    const { applicant_id } = req.query

    if (!applicant_id) {
      return res.status(400).json({
        success: false,
        message: 'Applicant ID is required'
      })
    }

    // Get only areas where this applicant has applications using stored procedure
    const [areasRows] = await connection.execute('CALL sp_getAvailableAreasForApplicant(?)', [applicant_id])
    const areas = areasRows[0]

    if (areas.length === 0) {
      return res.json({
        success: true,
        message: 'No areas available. Please apply to a stall first to access areas.',
        data: {
          areas: [],
          total_areas: 0,
          restriction_message: 'Areas are restricted to where you have applications'
        }
      })
    }

    res.json({
      success: true,
      message: 'Available areas retrieved successfully (restricted to your applied areas)',
      data: {
        areas: areas.map(area => ({
          area: area.area,
          location: area.location,
          stall_count: area.stall_count,
          available_stall_count: area.available_stall_count
        })),
        total_areas: areas.length,
        restriction_info: {
          message: 'Areas are restricted to where you have applications',
          note: 'To access more areas, submit applications to stalls in those areas'
        }
      }
    })

  } catch (error) {
    console.error('Get available areas error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available areas',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  } finally {
    await connection.end()
  }
}

// Search stalls with filters - restricted to applicant's applied areas - Uses stored procedures
export const searchStalls = async (req, res) => {
  const connection = await createConnection()
  
  try {
    const { 
      applicant_id, 
      type, 
      area, 
      min_price, 
      max_price, 
      size, 
      search_term 
    } = req.query

    if (!applicant_id) {
      return res.status(400).json({
        success: false,
        message: 'Applicant ID is required'
      })
    }

    // First, get the areas where this applicant has applied using stored procedure
    const [appliedAreasRows] = await connection.execute('CALL sp_getAppliedAreasForApplicant(?)', [applicant_id])
    const appliedAreas = appliedAreasRows[0]

    if (appliedAreas.length === 0) {
      return res.json({
        success: true,
        message: 'No applications found. Please apply to a stall first to search stalls in that area.',
        data: {
          stalls: [],
          total_count: 0,
          filters_applied: { type, area, min_price, max_price, size, search_term },
          restriction_message: 'Search is restricted to areas where you have applications'
        }
      })
    }

    // If area filter is specified, check if it's in applied areas
    if (area) {
      const hasAccessToArea = appliedAreas.some(appliedArea => appliedArea.area === area)
      if (!hasAccessToArea) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You don't have applications in ${area}. You can only search stalls in areas where you have submitted applications.`,
          data: {
            requested_area: area,
            available_areas: appliedAreas.map(a => a.area),
            restriction_message: 'Search is restricted to areas where you have applications'
          }
        })
      }
    }

    // Build area list for stored procedure
    const areaList = appliedAreas.map(areaItem => `'${areaItem.area}'`).join(',')

    // Search stalls using stored procedure
    const [stallsRows] = await connection.execute(
      'CALL sp_searchStallsForApplicant(?, ?, ?, ?, ?, ?, ?, ?)', 
      [
        applicant_id, 
        areaList, 
        type || null, 
        area || null, 
        min_price ? parseFloat(min_price) : null, 
        max_price ? parseFloat(max_price) : null, 
        size || null, 
        search_term || null
      ]
    )
    const stalls = stallsRows[0]

    // Format for mobile app
    const formattedStalls = stalls.map(stall => ({
      id: stall.stall_id,
      stallNumber: stall.stall_no,
      location: stall.stall_location,
      size: stall.size,
      price: stall.rental_price ? stall.rental_price.toLocaleString() : '0',
      priceValue: stall.rental_price || 0,
      priceType: stall.price_type,
      status: stall.application_status,
      description: stall.description || 'No description available',
      image: stall.stall_image || 'https://oldspitalfieldsmarket.com/cms/2017/10/OSM_FP_Stall_sq-1440x1440.jpg',
      
      // Branch information
      branch: {
        id: stall.branch_id,
        name: stall.branch_name,
        area: stall.area,
        location: stall.location
      },
      
      // Floor and section info
      floor: stall.floor_name,
      section: stall.section_name,
      floorSection: `${stall.floor_name} / ${stall.section_name}`,
      
      // Application status
      canApply: stall.application_status === 'available',
      isApplied: stall.application_status === 'applied'
    }))

    res.json({
      success: true,
      message: `Search results retrieved successfully from your applied areas: ${appliedAreas.map(a => a.area).join(', ')}`,
      data: {
        stalls: formattedStalls,
        total_count: formattedStalls.length,
        filters_applied: {
          type,
          area,
          min_price,
          max_price,
          size,
          search_term
        },
        applied_areas: appliedAreas,
        restriction_info: {
          message: 'Search is restricted to areas where you have applications',
          areas_with_access: appliedAreas.map(areaItem => areaItem.area)
        }
      }
    })

  } catch (error) {
    console.error('Search stalls error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to search stalls',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  } finally {
    await connection.end()
  }
}

// Get all images for a specific stall
export const getStallImages = async (req, res) => {
  const connection = await createConnection()
  
  try {
    const { stall_id } = req.params

    if (!stall_id) {
      return res.status(400).json({
        success: false,
        message: 'Stall ID is required'
      })
    }

    // Get all images for this stall using stored procedure
    const [imagesRows] = await connection.execute('CALL sp_getStallImagesPublic(?)', [stall_id])
    const images = imagesRows[0]

    // Get stall info using stored procedure
    const [stallInfoRows] = await connection.execute('CALL sp_checkStallExists(?)', [stall_id])
    const stallInfo = stallInfoRows[0]

    if (stallInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      })
    }

    const stall = stallInfo[0]
    
    // Use API endpoint for BLOB images (works with cloud database)
    const baseImageUrl = `${req.protocol}://${req.get('host')}/api/stalls/images/blob/id`

    // Format images with full URLs pointing to BLOB endpoint
    const formattedImages = images.map(img => ({
      id: img.id,
      stall_id: img.stall_id,
      image_url: `${baseImageUrl}/${img.id}`,  // Use BLOB serving endpoint
      original_url: img.image_url,
      is_primary: img.is_primary === 1,
      display_order: img.display_order,
      mime_type: img.mime_type,
      file_name: img.file_name
    }))

    // If no images in database, return empty with API endpoint info
    if (formattedImages.length === 0) {
      return res.json({
        success: true,
        message: 'No images found for this stall.',
        data: {
          images: [],
          stall_id: stall.stall_id,
          stall_no: stall.stall_no,
          branch_id: stall.branch_id,
          upload_endpoint: '/api/stalls/images/blob/upload',
          note: 'Images are stored in cloud database. Use the upload endpoint to add images.'
        }
      })
    }

    res.json({
      success: true,
      message: `Retrieved ${formattedImages.length} images for stall ${stall.stall_no}`,
      data: {
        images: formattedImages,
        stall_id: stall.stall_id,
        stall_no: stall.stall_no,
        total_count: formattedImages.length,
        primary_image: formattedImages.find(img => img.is_primary) || formattedImages[0] || null
      }
    })

  } catch (error) {
    console.error('Get stall images error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stall images',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  } finally {
    await connection.end()
  }
}