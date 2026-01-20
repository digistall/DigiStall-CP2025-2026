// ===== AUTHENTICATION SERVICE =====
// Shared authentication business logic

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { EmployeeRepository } from '../repositories/employeeRepository.js';
import { StallholderRepository } from '../repositories/stallholderRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Authenticate employee
 */
export async function authenticateEmployee(email, password) {
  const employee = await EmployeeRepository.findByEmail(email);
  
  if (!employee) {
    throw new Error('Invalid credentials');
  }
  
  if (employee.status !== 'active') {
    throw new Error('Account is not active');
  }
  
  const isValidPassword = await bcrypt.compare(password, employee.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }
  
  // Generate tokens
  const tokens = generateTokens({
    userId: employee.employee_id,
    email: employee.email,
    role: employee.role,
    branchId: employee.branch_id,
    userType: 'employee'
  });
  
  // Log activity
  await EmployeeRepository.logActivity(
    employee.employee_id,
    'LOGIN',
    `Employee ${employee.email} logged in`
  );
  
  return {
    user: sanitizeEmployee(employee),
    ...tokens
  };
}

/**
 * Authenticate stallholder
 */
export async function authenticateStallholder(email, password) {
  const stallholder = await StallholderRepository.findByEmail(email);
  
  if (!stallholder) {
    throw new Error('Invalid credentials');
  }
  
  if (stallholder.status !== 'active') {
    throw new Error('Account is not active');
  }
  
  const isValidPassword = await bcrypt.compare(password, stallholder.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }
  
  // Generate tokens
  const tokens = generateTokens({
    userId: stallholder.stallholder_id,
    email: stallholder.email,
    role: 'stallholder',
    branchId: stallholder.branch_id,
    userType: 'stallholder'
  });
  
  return {
    user: sanitizeStallholder(stallholder),
    ...tokens
  };
}

/**
 * Generate access and refresh tokens
 */
export function generateTokens(payload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  
  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Verify user still exists and is active
    let user;
    if (decoded.userType === 'employee') {
      user = await EmployeeRepository.findById(decoded.userId);
    } else {
      user = await StallholderRepository.findById(decoded.userId);
    }
    
    if (!user || user.status !== 'active') {
      throw new Error('User not found or inactive');
    }
    
    // Generate new tokens
    return generateTokens({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      branchId: decoded.branchId,
      userType: decoded.userType
    });
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

/**
 * Verify access token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Hash password
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Change password
 */
export async function changePassword(userId, userType, currentPassword, newPassword) {
  let user;
  if (userType === 'employee') {
    user = await EmployeeRepository.findById(userId);
  } else {
    user = await StallholderRepository.findById(userId);
  }
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }
  
  const hashedPassword = await hashPassword(newPassword);
  
  if (userType === 'employee') {
    await EmployeeRepository.updatePassword(userId, hashedPassword);
    await EmployeeRepository.logActivity(userId, 'PASSWORD_CHANGE', 'Password changed');
  } else {
    await StallholderRepository.update(userId, { password: hashedPassword });
  }
  
  return { success: true, message: 'Password changed successfully' };
}

/**
 * Helper: Remove sensitive data from employee
 */
function sanitizeEmployee(employee) {
  const { password, ...safe } = employee;
  return safe;
}

/**
 * Helper: Remove sensitive data from stallholder
 */
function sanitizeStallholder(stallholder) {
  const { password, ...safe } = stallholder;
  return safe;
}

export const AuthService = {
  authenticateEmployee,
  authenticateStallholder,
  generateTokens,
  refreshAccessToken,
  verifyToken,
  hashPassword,
  changePassword
};

export default AuthService;
