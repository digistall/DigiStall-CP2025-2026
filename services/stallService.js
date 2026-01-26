// ===== STALL SERVICE - BUSINESS LOGIC LAYER =====
// Contains all business logic for stall operations
// Shared between Web and Mobile BFF adapters

import { StallRepository } from '../repositories/stallRepository.js';
import { decryptData } from '../utils/encryption.js';

/**
 * Get all stalls for a user's branch with decryption
 */
export async function getStallsForBranch(branchId, options = {}) {
  const stalls = await StallRepository.findAllByBranch(branchId, options);
  
  // Decrypt sensitive data
  return stalls.map(stall => decryptStallData(stall));
}

/**
 * Get stall details by ID
 */
export async function getStallDetails(stallId) {
  const stall = await StallRepository.findById(stallId);
  if (!stall) return null;
  
  return decryptStallData(stall);
}

/**
 * Get available stalls for a branch
 */
export async function getAvailableStalls(branchId) {
  const stalls = await StallRepository.findAvailable(branchId);
  return stalls.map(stall => decryptStallData(stall));
}

/**
 * Search stalls with filters
 */
export async function searchStalls(filters) {
  const stalls = await StallRepository.findWithFilters(filters);
  return stalls.map(stall => decryptStallData(stall));
}

/**
 * Create a new stall
 */
export async function createStall(stallData, userId) {
  // Validate required fields
  if (!stallData.branch_id) {
    throw new Error('Branch ID is required');
  }
  
  // Create stall
  const stall = await StallRepository.create(stallData);
  
  console.log(`✅ Stall created by user ${userId}: ${stall.stall_id}`);
  return stall;
}

/**
 * Update a stall
 */
export async function updateStall(stallId, updateData, userId) {
  const existingStall = await StallRepository.findById(stallId);
  if (!existingStall) {
    throw new Error('Stall not found');
  }
  
  const updatedStall = await StallRepository.update(stallId, updateData);
  
  console.log(`✅ Stall updated by user ${userId}: ${stallId}`);
  return decryptStallData(updatedStall);
}

/**
 * Delete a stall
 */
export async function deleteStall(stallId, userId) {
  const existingStall = await StallRepository.findById(stallId);
  if (!existingStall) {
    throw new Error('Stall not found');
  }
  
  // Check if stall is occupied
  if (existingStall.stallholder_id) {
    throw new Error('Cannot delete occupied stall. Remove stallholder first.');
  }
  
  await StallRepository.remove(stallId);
  console.log(`✅ Stall deleted by user ${userId}: ${stallId}`);
  
  return { success: true, message: 'Stall deleted successfully' };
}

/**
 * Assign stallholder to stall
 */
export async function assignStallholder(stallId, stallholderId, userId) {
  const stall = await StallRepository.findById(stallId);
  if (!stall) {
    throw new Error('Stall not found');
  }
  
  if (!stall.is_available) {
    throw new Error('Stall is not available');
  }
  
  const updatedStall = await StallRepository.assignStallholder(stallId, stallholderId);
  
  console.log(`✅ Stallholder ${stallholderId} assigned to stall ${stallId} by user ${userId}`);
  return decryptStallData(updatedStall);
}

/**
 * Get stall statistics
 */
export async function getStallStats(branchId) {
  return StallRepository.getStatsByBranch(branchId);
}

/**
 * Helper: Decrypt stall data including nested stallholder
 */
function decryptStallData(stall) {
  if (!stall) return stall;
  
  const result = { ...stall };
  
  // Add image URL if image exists
  if (result.images && result.images.length > 0) {
    result.primary_image_url = `/api/stalls/images/blob/id/${result.images[0].image_id}`;
  }
  
  // Decrypt stallholder name if encrypted
  if (result.stallholder) {
    if (result.stallholder.first_name && result.stallholder.first_name.includes(':')) {
      try {
        result.stallholder.first_name = decryptData(result.stallholder.first_name);
      } catch (e) { /* Keep original if decryption fails */ }
    }
    if (result.stallholder.last_name && result.stallholder.last_name.includes(':')) {
      try {
        result.stallholder.last_name = decryptData(result.stallholder.last_name);
      } catch (e) { /* Keep original if decryption fails */ }
    }
    
    // Combine name for convenience
    result.stallholder_name = `${result.stallholder.first_name} ${result.stallholder.last_name}`;
  }
  
  return result;
}

export const StallService = {
  getStallsForBranch,
  getStallDetails,
  getAvailableStalls,
  searchStalls,
  createStall,
  updateStall,
  deleteStall,
  assignStallholder,
  getStallStats
};

export default StallService;
