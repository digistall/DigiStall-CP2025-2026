/**
 * DataTransformService - Handles data transformation for the SubNavigation component
 * Contains methods for transforming stall data, formatting prices, and managing default images
 */

// Import local stall images
import stallBackgroundImg from '@/assets/stallbackground.png'
import foodStandImg from '@/assets/food-stand.png'
import marketImg from '@/assets/market.png'

class DataTransformService {
  /**
   * Build full image URL for images
   * Supports both BLOB API endpoints and legacy file-based paths
   * @param {string} imagePath - Relative path or BLOB API path
   * @returns {string} Full URL to the image
   */
  buildImageUrl(imagePath) {
    if (!imagePath) return null
    
    // If it's already a full URL, return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    
    // Check if it's a BLOB API URL path (e.g., /api/stalls/images/blob/21/1)
    if (imagePath.includes('/api/stalls/images/blob/')) {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      // Remove trailing /api from base URL if present, then append the full path
      const baseUrl = apiBaseUrl.replace(/\/api$/, '')
      return `${baseUrl}${imagePath}`
    }
    
    // Legacy: Build URL for file-based images
    const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost'
    return `${imageBaseUrl}${imagePath}`
  }

  /**
   * Transform backend stall data to frontend format
   * @param {Object} stall - Raw stall data from backend
   * @returns {Object} Transformed stall data for frontend consumption
   */
  transformStallData(stall) {
    // If the stall data is already in frontend format (from new backend), use it as-is
    // Otherwise, transform from old backend format
    const isAlreadyFormatted = stall.stallNumber && stall.branch

    if (isAlreadyFormatted) {
      // Data is already properly formatted by backend
      // Build full URL for BLOB images if needed
      const rawImage = stall.imageUrl || stall.stall_image
      let imageUrl = null;
      if (rawImage && rawImage !== 'null' && rawImage !== '') {
        imageUrl = this.buildImageUrl(rawImage);
        console.log(`🖼️ Transformed image for ${stall.stallNumber}: ${rawImage} → ${imageUrl}`);
      } else {
        console.log(`⚠️ No image URL for ${stall.stallNumber}, rawImage:`, rawImage);
      }
      return {
        ...stall,
        imageUrl: imageUrl,
        image: imageUrl, // Add compatibility for both property names
        price_type: stall.price_type, // Ensure price_type is explicitly included
        managerName: stall.managerName || 'Unknown',
      }
    }

    // Transform from old backend format
    // Build full URL for htdocs images if needed
    const rawImage = stall.stall_image || stall.imageUrl
    const imageUrl = rawImage ? this.buildImageUrl(rawImage) : this.getDefaultImage(stall.section)
    return {
      id: stall.stall_id || stall.id,
      stallNumber: stall.stall_no || stall.stallNumber,
      price: stall.price || this.formatPrice(stall.rental_price, stall.price_type),
      floor: stall.floor,
      section: stall.section,
      dimensions: stall.size || stall.dimensions || '3x3 meters',
      location: stall.stall_location || stall.location,
      branch: stall.branch_name || stall.branch,
      branchLocation: stall.branch_location || stall.branchLocation,
      description: stall.description,
      imageUrl: imageUrl,
      image: imageUrl, // Add compatibility for both property names
      isAvailable: stall.status === 'Active' || stall.isAvailable,
      price_type: stall.price_type,
      status: stall.status,
      createdAt: stall.created_at,
      managerName: stall.manager_first_name
        ? `${stall.manager_first_name} ${stall.manager_last_name}`
        : 'Unknown',
    }
  }

  /**
   * Format price display based on type
   * @param {number} price - The price amount
   * @param {string} price_type - The type of pricing (Fixed Price, Raffle, Auction)
   * @returns {string} Formatted price string
   */
  formatPrice(price, price_type) {
    if (!price || isNaN(price) || price <= 0) {
      return 'Contact for pricing'
    }

    const formattedPrice = `₱${parseFloat(price).toLocaleString('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`

    switch (price_type) {
      case 'Raffle':
        return `${formattedPrice} / Raffle`
      case 'Auction':
        return `${formattedPrice} Min. / Auction`
      case 'Fixed Price':
      default:
        return `${formattedPrice}/month`
    }
  }

  /**
   * Get default image based on section
   * @param {string} section - The stall section
   * @returns {string} Default image URL for the section
   */
  getDefaultImage(section) {
    const defaultImages = {
      'Grocery Section': marketImg,
      'Meat Section': foodStandImg,
      'Fresh Produce': stallBackgroundImg,
      'Clothing Section': marketImg,
      'Electronics Section': stallBackgroundImg,
      'Food Court': foodStandImg,
    }

    return defaultImages[section] || stallBackgroundImg
  }

  /**
   * Transform an array of stall data
   * @param {Array} stallsArray - Array of raw stall data from backend
   * @returns {Array} Array of transformed stall data
   */
  transformStallsArray(stallsArray) {
    return stallsArray.map((stall) => this.transformStallData(stall))
  }
}

export default new DataTransformService()
