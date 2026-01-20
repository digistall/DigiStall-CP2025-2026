// ===== MOBILE BFF ADAPTER FOR STALLS =====
// Transforms stall data specifically for Mobile app needs
// Mobile requires: compact data, offline-friendly, minimal payload

import { StallService } from '../../services/stallService.js';

/**
 * Transform stall for mobile list view
 * Mobile needs: compact, minimal data transfer
 */
export function transformForMobileList(stall) {
  return {
    id: stall.stall_id,
    number: stall.stall_number,
    name: stall.stall_name || `Stall ${stall.stall_number}`,
    type: stall.stall_type,
    rent: parseFloat(stall.monthly_rent) || parseFloat(stall.rental_price) || 0,
    status: stall.status,
    available: stall.is_available,
    
    // Simplified location
    branch: stall.branch?.branch_name,
    floor: stall.floor?.floor_name,
    
    // Stallholder (minimal)
    tenant: stall.stallholder_name || null,
    
    // Thumbnail only (smaller payload)
    thumbnail: stall.primary_image_url || null
  };
}

/**
 * Transform stall for mobile detail view
 * More info but still optimized for mobile
 */
export function transformForMobileDetail(stall) {
  return {
    id: stall.stall_id,
    number: stall.stall_number,
    name: stall.stall_name,
    type: stall.stall_type,
    size: stall.stall_size || stall.size,
    areaSqm: parseFloat(stall.area_sqm) || null,
    rent: parseFloat(stall.monthly_rent) || parseFloat(stall.rental_price) || 0,
    status: stall.status,
    available: stall.is_available,
    description: stall.description,
    
    // Location
    location: {
      branch: stall.branch?.branch_name,
      branchId: stall.branch_id,
      floor: stall.floor?.floor_name,
      section: stall.sectionRef?.section_name
    },
    
    // Stallholder (if any)
    tenant: stall.stallholder ? {
      id: stall.stallholder.stallholder_id,
      name: stall.stallholder_name,
      business: stall.stallholder.business_name,
      phone: stall.stallholder.phone_number
    } : null,
    
    // Images (IDs for lazy loading)
    images: stall.images?.map(img => ({
      id: img.image_id,
      primary: img.is_primary
    })) || [],
    
    primaryImage: stall.primary_image_url
  };
}

/**
 * Transform for inspector view (compliance checks)
 * Includes compliance-relevant info
 */
export function transformForInspector(stall) {
  return {
    id: stall.stall_id,
    number: stall.stall_number,
    name: stall.stall_name,
    type: stall.stall_type,
    
    // Location for finding stall
    branch: stall.branch?.branch_name,
    floor: stall.floor?.floor_name,
    section: stall.sectionRef?.section_name,
    
    // Tenant contact (for inspection)
    tenant: stall.stallholder ? {
      name: stall.stallholder_name,
      phone: stall.stallholder.phone_number,
      business: stall.stallholder.business_name
    } : null,
    
    // Last compliance status
    lastCompliance: stall.compliances?.[0] ? {
      type: stall.compliances[0].compliance_type,
      status: stall.compliances[0].status,
      date: stall.compliances[0].inspection_date
    } : null,
    
    thumbnail: stall.primary_image_url
  };
}

/**
 * Transform for collector view (payment collection)
 * Includes payment-relevant info
 */
export function transformForCollector(stall) {
  return {
    id: stall.stall_id,
    number: stall.stall_number,
    name: stall.stall_name,
    rent: parseFloat(stall.monthly_rent) || parseFloat(stall.rental_price) || 0,
    
    // Location for finding stall
    branch: stall.branch?.branch_name,
    floor: stall.floor?.floor_name,
    
    // Tenant for payment
    tenant: stall.stallholder ? {
      id: stall.stallholder.stallholder_id,
      name: stall.stallholder_name,
      phone: stall.stallholder.phone_number
    } : null,
    
    // Last payment (for due checking)
    lastPayment: stall.payments?.[0] ? {
      amount: parseFloat(stall.payments[0].amount),
      date: stall.payments[0].payment_date,
      status: stall.payments[0].status
    } : null
  };
}

/**
 * Mobile BFF: Get stalls for mobile list
 */
export async function getMobileStalls(branchId, options = {}) {
  const stalls = await StallService.getStallsForBranch(branchId, {
    ...options,
    includeImages: true
  });
  return stalls.map(transformForMobileList);
}

/**
 * Mobile BFF: Get stall details
 */
export async function getStallDetails(stallId) {
  const stall = await StallService.getStallDetails(stallId);
  if (!stall) return null;
  return transformForMobileDetail(stall);
}

/**
 * Mobile BFF: Get stalls for inspector
 */
export async function getInspectorStalls(branchId) {
  const stalls = await StallService.getStallsForBranch(branchId);
  return stalls.map(transformForInspector);
}

/**
 * Mobile BFF: Get stalls for collector
 */
export async function getCollectorStalls(branchId) {
  const stalls = await StallService.getStallsForBranch(branchId);
  // Only return occupied stalls for collectors
  return stalls
    .filter(s => s.stallholder_id)
    .map(transformForCollector);
}

/**
 * Mobile BFF: Get stall count (for badge)
 */
export async function getStallCount(branchId, status = null) {
  const stats = await StallService.getStallStats(branchId);
  
  if (status) {
    return stats.byStatus?.[status] || 0;
  }
  return stats.total;
}

export const MobileStallAdapter = {
  transformForMobileList,
  transformForMobileDetail,
  transformForInspector,
  transformForCollector,
  getMobileStalls,
  getStallDetails,
  getInspectorStalls,
  getCollectorStalls,
  getStallCount
};

export default MobileStallAdapter;
