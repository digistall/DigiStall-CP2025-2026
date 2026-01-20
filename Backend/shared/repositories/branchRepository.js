// ===== BRANCH REPOSITORY =====
// Data access layer for Branch entity using Prisma ORM

import prisma from '../database/prismaClient.js';

/**
 * Find all branches
 */
export async function findAll() {
  return prisma.branch.findMany({
    include: {
      _count: {
        select: {
          stalls: true,
          employees: true,
          stallholders: true
        }
      }
    },
    orderBy: { branch_name: 'asc' }
  });
}

/**
 * Find branch by ID
 */
export async function findById(branchId, options = {}) {
  const { includeDetails = true } = options;
  
  return prisma.branch.findUnique({
    where: { branch_id: branchId },
    include: includeDetails ? {
      floors: true,
      sections: true,
      _count: {
        select: {
          stalls: true,
          employees: true,
          stallholders: true
        }
      }
    } : undefined
  });
}

/**
 * Create a new branch
 */
export async function create(branchData) {
  return prisma.branch.create({
    data: {
      branch_name: branchData.branch_name,
      location: branchData.location,
      address: branchData.address,
      contact_number: branchData.contact_number,
      email: branchData.email,
      description: branchData.description,
      status: branchData.status || 'active'
    }
  });
}

/**
 * Update a branch
 */
export async function update(branchId, updateData) {
  const cleanData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined)
  );
  
  return prisma.branch.update({
    where: { branch_id: branchId },
    data: cleanData
  });
}

/**
 * Delete a branch
 */
export async function remove(branchId) {
  return prisma.branch.delete({
    where: { branch_id: branchId }
  });
}

/**
 * Get branch statistics
 */
export async function getStats(branchId) {
  const [stallStats, employeeCount, stallholderCount] = await Promise.all([
    prisma.stall.groupBy({
      by: ['status'],
      where: { branch_id: branchId },
      _count: { stall_id: true }
    }),
    prisma.employee.count({ where: { branch_id: branchId } }),
    prisma.stallholder.count({ where: { branch_id: branchId } })
  ]);
  
  return {
    stalls: stallStats.reduce((acc, s) => {
      acc[s.status] = s._count.stall_id;
      acc.total = (acc.total || 0) + s._count.stall_id;
      return acc;
    }, {}),
    employees: employeeCount,
    stallholders: stallholderCount
  };
}

/**
 * Get floors for a branch
 */
export async function getFloors(branchId) {
  return prisma.floor.findMany({
    where: { branch_id: branchId },
    orderBy: { floor_number: 'asc' }
  });
}

/**
 * Get sections for a branch
 */
export async function getSections(branchId, floorId = null) {
  const where = { branch_id: branchId };
  if (floorId) where.floor_id = floorId;
  
  return prisma.section.findMany({
    where,
    orderBy: { section_name: 'asc' }
  });
}

export const BranchRepository = {
  findAll,
  findById,
  create,
  update,
  remove,
  getStats,
  getFloors,
  getSections
};

export default BranchRepository;
