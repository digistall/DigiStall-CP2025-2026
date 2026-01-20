// ===== WEB BFF ADAPTER FOR STALLS =====
// Transforms stall data specifically for Web frontend needs
// Web requires: detailed views, admin controls, image management

import { StallService } from '../../services/stallService.js';

/**
 * Transform stall for web admin list view
 * Web needs: full details, action buttons, status badges
 */
export function transformForAdminList(stall) {
  return {
    id: stall.stall_id,
    stallNumber: stall.stall_number,
    stallName: stall.stall_name,
    type: stall.stall_type,
    size: stall.stall_size || stall.size,
    areaSqm: parseFloat(stall.area_sqm) || null,
    monthlyRent: parseFloat(stall.monthly_rent) || parseFloat(stall.rental_price) || 0,
    status: stall.status,
    isAvailable: stall.is_available,
    
    // Location info
    location: {
      branch: stall.branch?.branch_name,
      branchId: stall.branch_id,
      floor: stall.floor?.floor_name,
      floorNumber: stall.floor?.floor_number,
      section: stall.sectionRef?.section_name || stall.section
    },
    
    // Stallholder info (for occupied stalls)
    stallholder: stall.stallholder ? {
      id: stall.stallholder.stallholder_id,
      name: stall.stallholder_name || `${stall.stallholder.first_name} ${stall.stallholder.last_name}`,
      businessName: stall.stallholder.business_name,
      businessType: stall.stallholder.business_type
    } : null,
    
    // Image
    imageUrl: stall.primary_image_url || (stall.images?.[0] ? `/api/stalls/images/blob/id/${stall.images[0].image_id}` : null),
    hasImage: !!(stall.images && stall.images.length > 0),
    
    // Timestamps for admin
    createdAt: stall.created_at,
    updatedAt: stall.updated_at,
    
    // Actions available (for UI)
    actions: {
      canEdit: true,
      canDelete: !stall.stallholder_id,
      canAssign: stall.is_available && !stall.stallholder_id,
      canViewDetails: true
    }
  };
}

/**
 * Transform stall for web detail view
 * Includes all information + related data
 */
export function transformForDetailView(stall) {
  const base = transformForAdminList(stall);
  
  return {
    ...base,
    description: stall.description,
    priceType: stall.price_type,
    baseRate: parseFloat(stall.base_rate) || null,
    ratePerSqm: parseFloat(stall.rate_per_sqm) || null,
    
    // All images
    images: stall.images?.map(img => ({
      id: img.image_id,
      url: `/api/stalls/images/blob/id/${img.image_id}`,
      isPrimary: img.is_primary
    })) || [],
    
    // Recent payments (for admin view)
    recentPayments: stall.payments?.map(p => ({
      id: p.payment_id,
      amount: parseFloat(p.amount),
      date: p.payment_date,
      status: p.status,
      type: p.payment_type
    })) || [],
    
    // Recent compliances
    recentCompliances: stall.compliances?.map(c => ({
      id: c.compliance_id,
      type: c.compliance_type,
      status: c.status,
      date: c.inspection_date,
      inspector: c.inspector ? `${c.inspector.first_name} ${c.inspector.last_name}` : null
    })) || []
  };
}

/**
 * Transform for landing page (public view)
 * Limited information, optimized for marketing
 */
export function transformForLandingPage(stall) {
  return {
    id: stall.stall_id,
    name: stall.stall_name || `Stall ${stall.stall_number}`,
    type: stall.stall_type,
    size: stall.stall_size || stall.size,
    areaSqm: parseFloat(stall.area_sqm) || null,
    monthlyRent: parseFloat(stall.monthly_rent) || parseFloat(stall.rental_price) || 0,
    isAvailable: stall.is_available,
    
    location: {
      branch: stall.branch?.branch_name,
      area: stall.branch?.location,
      floor: stall.floor?.floor_name
    },
    
    imageUrl: stall.primary_image_url || '/images/stall-placeholder.jpg',
    description: stall.description?.substring(0, 200) || null
  };
}

/**
 * Web BFF: Get stalls for admin dashboard
 */
export async function getAdminStalls(branchId, options = {}) {
  const stalls = await StallService.getStallsForBranch(branchId, options);
  return stalls.map(transformForAdminList);
}

/**
 * Web BFF: Get stall details
 */
export async function getStallDetails(stallId) {
  const stall = await StallService.getStallDetails(stallId);
  if (!stall) return null;
  return transformForDetailView(stall);
}

/**
 * Web BFF: Get available stalls for landing page
 */
export async function getLandingPageStalls(filters = {}) {
  const stalls = await StallService.searchStalls({
    ...filters,
    isAvailable: true
  });
  return stalls.map(transformForLandingPage);
}

/**
 * Web BFF: Get stall statistics for dashboard
 */
export async function getDashboardStats(branchId) {
  const stats = await StallService.getStallStats(branchId);
  
  return {
    total: stats.total,
    available: stats.byStatus?.available || 0,
    occupied: stats.byStatus?.occupied || 0,
    maintenance: stats.byStatus?.maintenance || 0,
    occupancyRate: stats.total > 0 
      ? Math.round(((stats.byStatus?.occupied || 0) / stats.total) * 100) 
      : 0
  };
}

export const WebStallAdapter = {
  transformForAdminList,
  transformForDetailView,
  transformForLandingPage,
  getAdminStalls,
  getStallDetails,
  getLandingPageStalls,
  getDashboardStats
};

export default WebStallAdapter;
