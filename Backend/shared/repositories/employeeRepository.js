// ===== EMPLOYEE REPOSITORY =====
// Data access layer for Employee entity using Prisma ORM

import prisma from '../database/prismaClient.js';

/**
 * Find all employees for a branch
 */
export async function findAllByBranch(branchId, options = {}) {
  return prisma.employee.findMany({
    where: { branch_id: branchId },
    include: {
      branch: true
    },
    orderBy: { created_at: 'desc' }
  });
}

/**
 * Find employee by ID
 */
export async function findById(employeeId) {
  return prisma.employee.findUnique({
    where: { employee_id: employeeId },
    include: {
      branch: true,
      activityLogs: { take: 10, orderBy: { created_at: 'desc' } }
    }
  });
}

/**
 * Find employee by email
 */
export async function findByEmail(email) {
  return prisma.employee.findUnique({
    where: { email },
    include: { branch: true }
  });
}

/**
 * Find employees by role
 */
export async function findByRole(role, branchId = null) {
  const where = { role };
  if (branchId) where.branch_id = branchId;
  
  return prisma.employee.findMany({
    where,
    include: { branch: true },
    orderBy: { first_name: 'asc' }
  });
}

/**
 * Create a new employee
 */
export async function create(employeeData) {
  return prisma.employee.create({
    data: {
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
      email: employeeData.email,
      phone_number: employeeData.phone_number,
      position: employeeData.position,
      role: employeeData.role || 'staff',
      branch_id: employeeData.branch_id,
      password: employeeData.password,
      status: employeeData.status || 'active'
    },
    include: { branch: true }
  });
}

/**
 * Update an employee
 */
export async function update(employeeId, updateData) {
  const cleanData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined)
  );
  
  return prisma.employee.update({
    where: { employee_id: employeeId },
    data: cleanData,
    include: { branch: true }
  });
}

/**
 * Delete an employee
 */
export async function remove(employeeId) {
  return prisma.employee.delete({
    where: { employee_id: employeeId }
  });
}

/**
 * Update password
 */
export async function updatePassword(employeeId, hashedPassword) {
  return prisma.employee.update({
    where: { employee_id: employeeId },
    data: { password: hashedPassword }
  });
}

/**
 * Get inspectors (for compliance module)
 */
export async function getInspectors(branchId = null) {
  return findByRole('inspector', branchId);
}

/**
 * Get collectors (for payment module)
 */
export async function getCollectors(branchId = null) {
  return findByRole('collector', branchId);
}

/**
 * Log activity
 */
export async function logActivity(employeeId, action, description, entityType = null, entityId = null, ipAddress = null) {
  return prisma.activityLog.create({
    data: {
      employee_id: employeeId,
      action,
      description,
      entity_type: entityType,
      entity_id: entityId,
      ip_address: ipAddress
    }
  });
}

export const EmployeeRepository = {
  findAllByBranch,
  findById,
  findByEmail,
  findByRole,
  create,
  update,
  remove,
  updatePassword,
  getInspectors,
  getCollectors,
  logActivity
};

export default EmployeeRepository;
