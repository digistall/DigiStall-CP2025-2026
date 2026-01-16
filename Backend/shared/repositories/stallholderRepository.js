// ===== STALLHOLDER REPOSITORY =====
// Data access layer for Stallholder entity using Prisma ORM

import prisma from '../database/prismaClient.js';

/**
 * Find all stallholders for a branch
 */
export async function findAllByBranch(branchId, options = {}) {
  const { includeStalls = true } = options;
  
  return prisma.stallholder.findMany({
    where: { branch_id: branchId },
    include: {
      branch: true,
      stalls: includeStalls,
      payments: { take: 5, orderBy: { created_at: 'desc' } }
    },
    orderBy: { created_at: 'desc' }
  });
}

/**
 * Find stallholder by ID
 */
export async function findById(stallholderId) {
  return prisma.stallholder.findUnique({
    where: { stallholder_id: stallholderId },
    include: {
      branch: true,
      stalls: {
        include: {
          images: { where: { is_primary: true }, take: 1 }
        }
      },
      payments: { take: 10, orderBy: { created_at: 'desc' } },
      applications: true
    }
  });
}

/**
 * Find stallholder by email
 */
export async function findByEmail(email) {
  return prisma.stallholder.findFirst({
    where: { email },
    include: {
      branch: true,
      stalls: true
    }
  });
}

/**
 * Create a new stallholder
 */
export async function create(stallholderData) {
  return prisma.stallholder.create({
    data: {
      first_name: stallholderData.first_name,
      last_name: stallholderData.last_name,
      email: stallholderData.email,
      phone_number: stallholderData.phone_number,
      address: stallholderData.address,
      business_name: stallholderData.business_name,
      business_type: stallholderData.business_type,
      branch_id: stallholderData.branch_id,
      status: stallholderData.status || 'active',
      password: stallholderData.password
    },
    include: { branch: true }
  });
}

/**
 * Update a stallholder
 */
export async function update(stallholderId, updateData) {
  const cleanData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined)
  );
  
  return prisma.stallholder.update({
    where: { stallholder_id: stallholderId },
    data: cleanData,
    include: { branch: true, stalls: true }
  });
}

/**
 * Delete a stallholder
 */
export async function remove(stallholderId) {
  return prisma.stallholder.delete({
    where: { stallholder_id: stallholderId }
  });
}

/**
 * Search stallholders
 */
export async function search(query, branchId = null) {
  const where = {
    OR: [
      { first_name: { contains: query } },
      { last_name: { contains: query } },
      { email: { contains: query } },
      { business_name: { contains: query } }
    ]
  };
  
  if (branchId) where.branch_id = branchId;
  
  return prisma.stallholder.findMany({
    where,
    include: { branch: true, stalls: true },
    take: 50
  });
}

/**
 * Get stallholder payment history
 */
export async function getPaymentHistory(stallholderId, options = {}) {
  return prisma.payment.findMany({
    where: { stallholder_id: stallholderId },
    orderBy: { payment_date: 'desc' },
    take: options.limit || 50,
    skip: options.offset || 0
  });
}

/**
 * Get statistics for stallholders
 */
export async function getStats(branchId) {
  const stats = await prisma.stallholder.groupBy({
    by: ['status'],
    where: branchId ? { branch_id: branchId } : undefined,
    _count: { stallholder_id: true }
  });
  
  return stats.reduce((acc, s) => {
    acc[s.status] = s._count.stallholder_id;
    return acc;
  }, {});
}

export const StallholderRepository = {
  findAllByBranch,
  findById,
  findByEmail,
  create,
  update,
  remove,
  search,
  getPaymentHistory,
  getStats
};

export default StallholderRepository;
