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
   * Transform backend stall data to frontend format
   * @param {Object} stall - Raw stall data from backend
   * @returns {Object} Transformed stall data for frontend consumption
   */
  transformStallData(stall) {
    // If the stall data is already in frontend format (from new backend), use it as-is
    // Otherwise, transform from old backend format
    const isAlreadyFormatted = stall.stallNumber && stall.branch && stall.branchLocation

    if (isAlreadyFormatted) {
      // Data is already properly formatted by backend
      const imageUrl = stall.imageUrl || this.getDefaultImage(stall.section)
      return {
        ...stall,
        imageUrl: imageUrl,
        image: imageUrl, // Add compatibility for both property names
        price_type: stall.price_type, // Ensure price_type is explicitly included
        managerName: stall.managerName || 'Unknown',
      }
    }

    // Transform from old backend format
    const imageUrl = stall.stall_image || stall.imageUrl || this.getDefaultImage(stall.section)
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
