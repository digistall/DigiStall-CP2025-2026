// ===== PAYMENT REPOSITORY =====
// Data access layer for Payment entity using Prisma ORM

import prisma from '../database/prismaClient.js';

/**
 * Find all payments for a branch
 */
export async function findAllByBranch(branchId, options = {}) {
  return prisma.payment.findMany({
    where: {
      stall: {
        branch_id: branchId
      }
    },
    include: {
      stall: true,
      stallholder: true,
      collector: true
    },
    orderBy: { created_at: 'desc' },
    take: options.limit || 100,
    skip: options.offset || 0
  });
}

/**
 * Find payment by ID
 */
export async function findById(paymentId) {
  return prisma.payment.findUnique({
    where: { payment_id: paymentId },
    include: {
      stall: { include: { branch: true } },
      stallholder: true,
      collector: true
    }
  });
}

/**
 * Find payments by stallholder
 */
export async function findByStallholder(stallholderId, options = {}) {
  return prisma.payment.findMany({
    where: { stallholder_id: stallholderId },
    include: { stall: true, collector: true },
    orderBy: { payment_date: 'desc' },
    take: options.limit || 50,
    skip: options.offset || 0
  });
}

/**
 * Find payments by stall
 */
export async function findByStall(stallId, options = {}) {
  return prisma.payment.findMany({
    where: { stall_id: stallId },
    include: { stallholder: true, collector: true },
    orderBy: { payment_date: 'desc' },
    take: options.limit || 50,
    skip: options.offset || 0
  });
}

/**
 * Find payments by date range
 */
export async function findByDateRange(startDate, endDate, branchId = null) {
  const where = {
    payment_date: {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  };
  
  if (branchId) {
    where.stall = { branch_id: branchId };
  }
  
  return prisma.payment.findMany({
    where,
    include: {
      stall: { include: { branch: true } },
      stallholder: true,
      collector: true
    },
    orderBy: { payment_date: 'desc' }
  });
}

/**
 * Create a new payment
 */
export async function create(paymentData) {
  return prisma.payment.create({
    data: {
      stall_id: paymentData.stall_id,
      stallholder_id: paymentData.stallholder_id,
      amount: paymentData.amount,
      payment_date: paymentData.payment_date ? new Date(paymentData.payment_date) : new Date(),
      payment_type: paymentData.payment_type,
      payment_method: paymentData.payment_method,
      status: paymentData.status || 'pending',
      reference_no: paymentData.reference_no,
      collector_id: paymentData.collector_id,
      notes: paymentData.notes
    },
    include: {
      stall: true,
      stallholder: true,
      collector: true
    }
  });
}

/**
 * Update a payment
 */
export async function update(paymentId, updateData) {
  const cleanData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined)
  );
  
  if (cleanData.payment_date) {
    cleanData.payment_date = new Date(cleanData.payment_date);
  }
  
  return prisma.payment.update({
    where: { payment_id: paymentId },
    data: cleanData,
    include: {
      stall: true,
      stallholder: true,
      collector: true
    }
  });
}

/**
 * Delete a payment
 */
export async function remove(paymentId) {
  return prisma.payment.delete({
    where: { payment_id: paymentId }
  });
}

/**
 * Get payment statistics
 */
export async function getStats(branchId, startDate = null, endDate = null) {
  const where = {};
  
  if (branchId) {
    where.stall = { branch_id: branchId };
  }
  
  if (startDate && endDate) {
    where.payment_date = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    };
  }
  
  const [statusStats, totalAmount] = await Promise.all([
    prisma.payment.groupBy({
      by: ['status'],
      where,
      _count: { payment_id: true },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: { ...where, status: 'completed' },
      _sum: { amount: true }
    })
  ]);
  
  return {
    byStatus: statusStats.reduce((acc, s) => {
      acc[s.status] = {
        count: s._count.payment_id,
        total: s._sum.amount || 0
      };
      return acc;
    }, {}),
    totalCollected: totalAmount._sum.amount || 0
  };
}

/**
 * Get daily collection summary
 */
export async function getDailyCollection(date, branchId = null) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const where = {
    payment_date: { gte: startOfDay, lte: endOfDay },
    status: 'completed'
  };
  
  if (branchId) {
    where.stall = { branch_id: branchId };
  }
  
  return prisma.payment.aggregate({
    where,
    _sum: { amount: true },
    _count: { payment_id: true }
  });
}

export const PaymentRepository = {
  findAllByBranch,
  findById,
  findByStallholder,
  findByStall,
  findByDateRange,
  create,
  update,
  remove,
  getStats,
  getDailyCollection
};

export default PaymentRepository;
