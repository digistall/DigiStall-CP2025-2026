// ===== STALL REPOSITORY =====
// Data access layer for Stall entity using Prisma ORM
// All database operations for stalls go through this repository

import prisma from '../database/prismaClient.js';

/**
 * Get all stalls for a branch with related data
 */
export async function findAllByBranch(branchId, options = {}) {
  const { includeImages = true, includeStallholder = true } = options;
  
  return prisma.stall.findMany({
    where: { branch_id: branchId },
    include: {
      branch: true,
      floor: true,
      sectionRef: true,
      stallholder: includeStallholder,
      images: includeImages ? {
        where: { is_primary: true },
        take: 1
      } : false
    },
    orderBy: { created_at: 'desc' }
  });
}

/**
 * Get a single stall by ID
 */
export async function findById(stallId, options = {}) {
  const { includeAll = true } = options;
  
  return prisma.stall.findUnique({
    where: { stall_id: stallId },
    include: includeAll ? {
      branch: true,
      floor: true,
      sectionRef: true,
      stallholder: true,
      images: true,
      payments: { take: 10, orderBy: { created_at: 'desc' } },
      compliances: { take: 5, orderBy: { created_at: 'desc' } }
    } : undefined
  });
}

/**
 * Get available stalls for a branch
 */
export async function findAvailable(branchId) {
  return prisma.stall.findMany({
    where: {
      branch_id: branchId,
      is_available: true,
      status: 'available'
    },
    include: {
      branch: true,
      floor: true,
      sectionRef: true,
      images: {
        where: { is_primary: true },
        take: 1
      }
    },
    orderBy: { stall_number: 'asc' }
  });
}

/**
 * Get stalls with filters
 */
export async function findWithFilters(filters) {
  const where = {};
  
  if (filters.branchId) where.branch_id = filters.branchId;
  if (filters.floorId) where.floor_id = filters.floorId;
  if (filters.sectionId) where.section_id = filters.sectionId;
  if (filters.status) where.status = filters.status;
  if (filters.isAvailable !== undefined) where.is_available = filters.isAvailable;
  if (filters.stallType) where.stall_type = filters.stallType;
  
  // Price range filter
  if (filters.minPrice || filters.maxPrice) {
    where.monthly_rent = {};
    if (filters.minPrice) where.monthly_rent.gte = filters.minPrice;
    if (filters.maxPrice) where.monthly_rent.lte = filters.maxPrice;
  }
  
  // Size range filter
  if (filters.minSize || filters.maxSize) {
    where.area_sqm = {};
    if (filters.minSize) where.area_sqm.gte = filters.minSize;
    if (filters.maxSize) where.area_sqm.lte = filters.maxSize;
  }
  
  return prisma.stall.findMany({
    where,
    include: {
      branch: true,
      floor: true,
      sectionRef: true,
      images: {
        where: { is_primary: true },
        take: 1
      }
    },
    orderBy: filters.orderBy || { created_at: 'desc' },
    skip: filters.offset || 0,
    take: filters.limit || 50
  });
}

/**
 * Create a new stall
 */
export async function create(stallData) {
  return prisma.stall.create({
    data: {
      stall_number: stallData.stall_number,
      stall_name: stallData.stall_name,
      stall_type: stallData.stall_type,
      stall_size: stallData.stall_size,
      stall_location: stallData.stall_location,
      size: stallData.size,
      area_sqm: stallData.area_sqm,
      floor_id: stallData.floor_id,
      section_id: stallData.section_id,
      monthly_rent: stallData.monthly_rent,
      rental_price: stallData.rental_price,
      status: stallData.status || 'available',
      branch_id: stallData.branch_id,
      stallholder_id: stallData.stallholder_id,
      floor_level: stallData.floor_level,
      section: stallData.section,
      description: stallData.description,
      price_type: stallData.price_type,
      is_available: stallData.is_available ?? true,
      base_rate: stallData.base_rate,
      rate_per_sqm: stallData.rate_per_sqm
    },
    include: {
      branch: true,
      floor: true,
      sectionRef: true
    }
  });
}

/**
 * Update a stall
 */
export async function update(stallId, updateData) {
  // Remove undefined fields
  const cleanData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined)
  );
  
  return prisma.stall.update({
    where: { stall_id: stallId },
    data: cleanData,
    include: {
      branch: true,
      floor: true,
      sectionRef: true,
      stallholder: true
    }
  });
}

/**
 * Delete a stall
 */
export async function remove(stallId) {
  // First delete related images (cascade should handle this, but being explicit)
  await prisma.stallImage.deleteMany({
    where: { stall_id: stallId }
  });
  
  return prisma.stall.delete({
    where: { stall_id: stallId }
  });
}

/**
 * Assign stallholder to stall
 */
export async function assignStallholder(stallId, stallholderId) {
  return prisma.stall.update({
    where: { stall_id: stallId },
    data: {
      stallholder_id: stallholderId,
      status: 'occupied',
      is_available: false
    }
  });
}

/**
 * Get stall statistics for a branch
 */
export async function getStatsByBranch(branchId) {
  const stats = await prisma.stall.groupBy({
    by: ['status'],
    where: { branch_id: branchId },
    _count: { stall_id: true }
  });
  
  const total = await prisma.stall.count({
    where: { branch_id: branchId }
  });
  
  return {
    total,
    byStatus: stats.reduce((acc, s) => {
      acc[s.status] = s._count.stall_id;
      return acc;
    }, {})
  };
}

/**
 * Count stalls with filters
 */
export async function count(filters = {}) {
  const where = {};
  if (filters.branchId) where.branch_id = filters.branchId;
  if (filters.status) where.status = filters.status;
  if (filters.isAvailable !== undefined) where.is_available = filters.isAvailable;
  
  return prisma.stall.count({ where });
}

// Export all functions as a repository object
export const StallRepository = {
  findAllByBranch,
  findById,
  findAvailable,
  findWithFilters,
  create,
  update,
  remove,
  assignStallholder,
  getStatsByBranch,
  count
};

export default StallRepository;
