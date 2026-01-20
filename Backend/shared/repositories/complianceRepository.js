// ===== COMPLIANCE REPOSITORY =====
// Data access layer for Compliance entity using Prisma ORM

import prisma from '../database/prismaClient.js';

/**
 * Find all compliances for a branch
 */
export async function findAllByBranch(branchId, options = {}) {
  return prisma.compliance.findMany({
    where: {
      stall: {
        branch_id: branchId
      }
    },
    include: {
      stall: { include: { stallholder: true } },
      inspector: true
    },
    orderBy: { created_at: 'desc' },
    take: options.limit || 100,
    skip: options.offset || 0
  });
}

/**
 * Find compliance by ID
 */
export async function findById(complianceId) {
  return prisma.compliance.findUnique({
    where: { compliance_id: complianceId },
    include: {
      stall: { 
        include: { 
          branch: true,
          stallholder: true 
        } 
      },
      inspector: true
    }
  });
}

/**
 * Find compliances by stall
 */
export async function findByStall(stallId, options = {}) {
  return prisma.compliance.findMany({
    where: { stall_id: stallId },
    include: { inspector: true },
    orderBy: { inspection_date: 'desc' },
    take: options.limit || 50,
    skip: options.offset || 0
  });
}

/**
 * Find compliances by inspector
 */
export async function findByInspector(inspectorId, options = {}) {
  return prisma.compliance.findMany({
    where: { inspector_id: inspectorId },
    include: {
      stall: { include: { stallholder: true, branch: true } }
    },
    orderBy: { inspection_date: 'desc' },
    take: options.limit || 50,
    skip: options.offset || 0
  });
}

/**
 * Find pending compliances
 */
export async function findPending(branchId = null) {
  const where = { status: 'pending' };
  if (branchId) {
    where.stall = { branch_id: branchId };
  }
  
  return prisma.compliance.findMany({
    where,
    include: {
      stall: { include: { stallholder: true, branch: true } },
      inspector: true
    },
    orderBy: { created_at: 'asc' }
  });
}

/**
 * Create a new compliance record
 */
export async function create(complianceData) {
  return prisma.compliance.create({
    data: {
      stall_id: complianceData.stall_id,
      inspector_id: complianceData.inspector_id,
      compliance_type: complianceData.compliance_type,
      status: complianceData.status || 'pending',
      inspection_date: complianceData.inspection_date ? new Date(complianceData.inspection_date) : null,
      remarks: complianceData.remarks,
      evidence: complianceData.evidence,
      evidence_type: complianceData.evidence_type
    },
    include: {
      stall: { include: { stallholder: true } },
      inspector: true
    }
  });
}

/**
 * Update a compliance record
 */
export async function update(complianceId, updateData) {
  const cleanData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined)
  );
  
  if (cleanData.inspection_date) {
    cleanData.inspection_date = new Date(cleanData.inspection_date);
  }
  
  return prisma.compliance.update({
    where: { compliance_id: complianceId },
    data: cleanData,
    include: {
      stall: { include: { stallholder: true } },
      inspector: true
    }
  });
}

/**
 * Delete a compliance record
 */
export async function remove(complianceId) {
  return prisma.compliance.delete({
    where: { compliance_id: complianceId }
  });
}

/**
 * Get compliance statistics
 */
export async function getStats(branchId = null) {
  const where = branchId ? { stall: { branch_id: branchId } } : {};
  
  const stats = await prisma.compliance.groupBy({
    by: ['status'],
    where,
    _count: { compliance_id: true }
  });
  
  return stats.reduce((acc, s) => {
    acc[s.status] = s._count.compliance_id;
    return acc;
  }, {});
}

/**
 * Get compliance by type statistics
 */
export async function getStatsByType(branchId = null) {
  const where = branchId ? { stall: { branch_id: branchId } } : {};
  
  return prisma.compliance.groupBy({
    by: ['compliance_type', 'status'],
    where,
    _count: { compliance_id: true }
  });
}

export const ComplianceRepository = {
  findAllByBranch,
  findById,
  findByStall,
  findByInspector,
  findPending,
  create,
  update,
  remove,
  getStats,
  getStatsByType
};

export default ComplianceRepository;
