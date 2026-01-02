import { createConnection } from '../../config/database.js';
import { getBranchFilter } from '../../middleware/rolePermissions.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function createEmployee(req, res) {
    let connection;
    try {
        const { firstName, lastName, email, phoneNumber, permissions, branchId, createdByManager } = req.body;
        const userBranchId = req.user?.branchId;
        const userId = req.user?.userId || req.user?.businessManagerId;
        
        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: firstName, lastName, email'
            });
        }

        if (!userBranchId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Branch ID not found in user session' 
            });
        }

        connection = await createConnection();
        
        // Generate unique username and password
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const username = `EMP${randomDigits}`;
        const password = Math.random().toString(36).substring(2, 10);
        const hashedPassword = await bcrypt.hash(password, 12);

        const finalBranchId = branchId || userBranchId;
        const finalCreatedBy = createdByManager || userId;
        
        // Convert permissions array to JSON string
        const permissionsJson = permissions && Array.isArray(permissions) ? JSON.stringify(permissions) : null;

        // Call stored procedure (correct procedure name: createBusinessEmployee)
        const [[result]] = await connection.execute(
            'CALL createBusinessEmployee(?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, firstName, lastName, email, phoneNumber, finalBranchId, finalCreatedBy, permissionsJson]
        );

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: {
                employeeId: result.business_employee_id,
                credentials: {
                    username,
                    password
                },
                branchId: finalBranchId
            }
        });

    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ success: false, message: 'Failed to create employee', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
}

export async function getAllEmployees(req, res) {
    let connection;
    try {
        const userBranchId = req.user?.branchId;
        const userId = req.user?.userId;
        const userType = req.user?.userType;

        connection = await createConnection();
        
        // Get branch filter based on user role and business_owner_managers table
        const branchFilter = await getBranchFilter(req, connection);
        
        let employees;
        if (branchFilter === null) {
            // System administrator - see all employees using stored procedure
            const [result] = await connection.execute(`CALL sp_getAllEmployeesAll(?)`, ['Active']);
            employees = result[0] || [];
        } else if (branchFilter.length === 0) {
            // Business owner with no accessible branches
            employees = [];
        } else {
            // Business owner (multiple branches) or business manager using stored procedure
            const branchIdsString = branchFilter.join(',');
            const [result] = await connection.execute(`CALL sp_getAllEmployeesByBranches(?, ?)`, [branchIdsString, 'Active']);
            employees = result[0] || [];
        }
        
        // Parse permissions for each employee and alias business_employee_id as employee_id
        const employeesWithPermissions = employees.map(emp => ({
            ...emp,
            employee_id: emp.business_employee_id, // Alias for frontend compatibility
            permissions: emp.permissions ? JSON.parse(emp.permissions) : []
        }));
        
        res.json({ 
            success: true, 
            data: employeesWithPermissions,
            metadata: {
                branchFilter: branchFilter === null ? 'all' : branchFilter,
                count: employeesWithPermissions.length,
                requestedBy: {
                    userId,
                    userType,
                    username: req.user?.username
                }
            }
        });
    } catch (error) {
        console.error('❌ getAllEmployees - Error getting employees:', error);
        res.status(500).json({ success: false, message: 'Failed to get employees', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
}

export async function getEmployeeById(req, res) {
    let connection;
    try {
        const { id } = req.params;
        const userBranchId = req.user?.branchId;
        
        if (!userBranchId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Branch ID not found in user session' 
            });
        }
        
        connection = await createConnection();
        
        // Call stored procedure (correct name: getBusinessEmployeeById)
        const [[employee]] = await connection.execute(
            'CALL getBusinessEmployeeById(?)',
            [id]
        );
        
        if (employee.length === 0 || employee[0].branch_id !== userBranchId) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found or you do not have permission to access this employee' 
            });
        }
        
        // Parse permissions
        const employeeData = {
            ...employee[0],
            permissions: employee[0].permissions ? JSON.parse(employee[0].permissions) : []
        };
        
        res.json({ success: true, data: employeeData });
    } catch (error) {
        console.error('Error getting employee:', error);
        res.status(500).json({ success: false, message: 'Failed to get employee', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
}

export async function updateEmployee(req, res) {
    let connection;
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phoneNumber, status, permissions } = req.body;
        const userBranchId = req.user?.branchId;
        
        if (!userBranchId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Branch ID not found in user session' 
            });
        }
        
        connection = await createConnection();
        
        // Verify employee belongs to the same branch (correct name: getBusinessEmployeeById)
        const [[checkEmployee]] = await connection.execute(
            'CALL getBusinessEmployeeById(?)',
            [id]
        );
        
        if (checkEmployee.length === 0 || checkEmployee[0].branch_id !== userBranchId) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found or you do not have permission to update this employee' 
            });
        }
        
        // Convert permissions array to JSON string
        const permissionsJson = permissions && Array.isArray(permissions) ? JSON.stringify(permissions) : null;
        
        // Call stored procedure (correct name: updateBusinessEmployee)
        const [[result]] = await connection.execute(
            'CALL updateBusinessEmployee(?, ?, ?, ?, ?, ?, ?)',
            [id, firstName, lastName, email, phoneNumber, permissionsJson, status]
        );

        if (result.affected_rows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Failed to update employee' 
            });
        }
        
        res.json({ success: true, message: 'Employee updated successfully' });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ success: false, message: 'Failed to update employee', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
}

export async function updateEmployeePermissions(req, res) {
    let connection;
    try {
        const { id } = req.params;
        const { permissions } = req.body;
        const userBranchId = req.user?.branchId;
        
        if (!userBranchId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Branch ID not found in user session' 
            });
        }
        
        if (!Array.isArray(permissions)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Permissions must be an array' 
            });
        }
        
        connection = await createConnection();
        
        // Verify employee belongs to the same branch (correct name: getBusinessEmployeeById)
        const [[checkEmployee]] = await connection.execute(
            'CALL getBusinessEmployeeById(?)',
            [id]
        );
        
        if (checkEmployee.length === 0 || checkEmployee[0].branch_id !== userBranchId) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found or you do not have permission to update this employee' 
            });
        }
        
        const permissionsJson = JSON.stringify(permissions);
        
        // Call stored procedure (correct name: updateBusinessEmployee with null for other fields)
        const [[result]] = await connection.execute(
            'CALL updateBusinessEmployee(?, NULL, NULL, NULL, NULL, ?, NULL)',
            [id, permissionsJson]
        );

        if (result.affected_rows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Failed to update employee permissions' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Employee permissions updated successfully',
            data: { permissions }
        });
    } catch (error) {
        console.error('Error updating employee permissions:', error);
        res.status(500).json({ success: false, message: 'Failed to update employee permissions', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
}

export async function deleteEmployee(req, res) {
    let connection;
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userBranchId = req.user?.branchId;
        
        if (!userBranchId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Branch ID not found in user session' 
            });
        }
        
        connection = await createConnection();
        
        // Verify employee belongs to the same branch
        const [[checkEmployee]] = await connection.execute(
            'CALL getBusinessEmployeeById(?)',
            [id]
        );
        
        if (checkEmployee.length === 0 || checkEmployee[0].branch_id !== userBranchId) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found or you do not have permission to delete this employee' 
            });
        }
        
        // Call stored procedure to delete/deactivate employee with reason
        const [[result]] = await connection.execute(
            'CALL sp_terminateEmployee(?, ?)',
            [id, reason || 'Terminated by manager']
        );

        if (result.affected_rows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Failed to deactivate employee' 
            });
        }
        
        res.json({ success: true, message: 'Employee terminated successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ success: false, message: 'Failed to delete employee', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
}

export async function loginEmployee(req, res) {
    let connection;
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password are required' 
            });
        }

        connection = await createConnection();
        
        // Call stored procedure to get employee by username (correct name: getBusinessEmployeeByUsername)
        const [[employees]] = await connection.execute(
            'CALL getBusinessEmployeeByUsername(?)',
            [username]
        );

        if (employees.length === 0 || employees[0].status !== 'Active') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials or inactive account' 
            });
        }

        const employee = employees[0];

        const isValid = await bcrypt.compare(password, employee.employee_password_hash);
        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Generate session token for the stored procedure
        const sessionToken = jwt.sign(
            { employeeId: employee.business_employee_id, timestamp: Date.now() },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );
        
        // Call stored procedure to create session and update last_login (correct name: loginBusinessEmployee)
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        await connection.execute(
            'CALL loginBusinessEmployee(?, ?, ?, ?)',
            [username, sessionToken, ipAddress, userAgent]
        );

        // Parse permissions
        const permissions = employee.permissions ? JSON.parse(employee.permissions) : [];

        const token = jwt.sign(
            {
                userId: employee.business_employee_id,
                employeeId: employee.business_employee_id,
                username: employee.employee_username,
                email: employee.email,
                role: 'business_employee',
                type: 'business_employee',
                userType: 'business_employee',
                branchId: employee.branch_id,
                branchName: employee.branch_name,
                fullName: `${employee.first_name} ${employee.last_name}`,
                permissions: permissions
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            success: true,
            message: 'Employee login successful',
            token,
            user: {
                id: employee.business_employee_id,
                employeeId: employee.business_employee_id,
                username: employee.employee_username,
                email: employee.email,
                firstName: employee.first_name,
                lastName: employee.last_name,
                fullName: `${employee.first_name} ${employee.last_name}`,
                phoneNumber: employee.phone_number,
                role: 'business_employee',
                type: 'business_employee',
                userType: 'business_employee',
                branch: {
                    id: employee.branch_id,
                    name: employee.branch_name
                },
                permissions: permissions
            }
        });

    } catch (error) {
        console.error('❌ Employee login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed',
            error: error.message
        });
    } finally {
        if (connection) await connection.end();
    }
}

// Helper function to get Philippine time in MySQL format
const getPhilippineTimeForLogout = () => {
  const now = new Date();
  const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const year = phTime.getFullYear();
  const month = String(phTime.getMonth() + 1).padStart(2, '0');
  const day = String(phTime.getDate()).padStart(2, '0');
  const hours = String(phTime.getHours()).padStart(2, '0');
  const minutes = String(phTime.getMinutes()).padStart(2, '0');
  const seconds = String(phTime.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export async function logoutEmployee(req, res) {
    let connection;
    try {
        // Get employee ID from the request (either from token or body)
        const employeeId = req.user?.userId || req.user?.employeeId || req.body?.employeeId;
        const sessionToken = req.headers.authorization?.split(' ')[1];
        
        connection = await createConnection();
        const philippineTime = getPhilippineTimeForLogout();
        
        if (employeeId) {
            // Call stored procedure to update last_logout timestamp and deactivate sessions
            await connection.execute(
                'CALL sp_logoutEmployee(?, ?)',
                [employeeId, philippineTime]
            );
            console.log(`✅ Logged out employee ${employeeId} at ${philippineTime}`);
        }
        
        res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
        console.error('Error logging out employee:', error);
        res.json({ success: true, message: 'Logout successful' });
    } finally {
        if (connection) await connection.end();
    }
}

export async function resetEmployeePassword(req, res) {
    let connection;
    try {
        const { id } = req.params;
        const userBranchId = req.user?.branchId;
        const userId = req.user?.userId || req.user?.businessManagerId;
        
        if (!userBranchId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Branch ID not found in user session' 
            });
        }
        
        connection = await createConnection();
        
        // Verify employee belongs to the same branch (correct name: getBusinessEmployeeById)
        const [[checkEmployee]] = await connection.execute(
            'CALL getBusinessEmployeeById(?)',
            [id]
        );
        
        if (checkEmployee.length === 0 || checkEmployee[0].branch_id !== userBranchId) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found or you do not have permission to reset password' 
            });
        }
        
        // Generate new password
        const newPassword = Math.random().toString(36).substring(2, 10);
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Call stored procedure (correct name: resetBusinessEmployeePassword)
        const [[result]] = await connection.execute(
            'CALL resetBusinessEmployeePassword(?, ?, ?)',
            [id, hashedPassword, userId]
        );

        if (result.affected_rows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Failed to reset password' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Password reset successfully',
            data: { temporaryPassword: newPassword }
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
}

export async function getEmployeesByBranch(req, res) {
    let connection;
    try {
        const { branchId } = req.params;
        const userBranchId = req.user?.branchId;
        
        if (!userBranchId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Branch ID not found in user session' 
            });
        }
        
        if (parseInt(branchId) !== parseInt(userBranchId)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. You can only view employees from your own branch.' 
            });
        }
        
        connection = await createConnection();
        
        // Call stored procedure (correct name: getBusinessEmployeesByBranch)
        const [[employees]] = await connection.execute(
            'CALL getBusinessEmployeesByBranch(?, ?)',
            [branchId, 'Active']
        );
        
        // Parse permissions for each employee
        const employeesWithPermissions = (employees || []).map(emp => ({
            ...emp,
            permissions: emp.permissions ? JSON.parse(emp.permissions) : []
        }));
        
        res.json({ success: true, data: employeesWithPermissions });
    } catch (error) {
        console.error('Error getting employees by branch:', error);
        res.status(500).json({ success: false, message: 'Failed to get employees', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
}
/**
 * Get active employee sessions for online status tracking
 * GET /api/employees/sessions/active
 * Uses DIRECT SQL ONLY - no stored procedures
 */
export async function getActiveSessions(req, res) {
    let connection;
    try {
        connection = await createConnection();
        
        // Set session timezone to Philippine time for correct timestamp conversion
        await connection.execute(`SET time_zone = '+08:00'`);
        
        let employeeSessions = [];
        let staffSessions = [];
        
        // Get employee sessions (web employees)
        try {
            const [empRows] = await connection.execute(`
                SELECT 
                    es.session_id,
                    es.business_employee_id,
                    es.is_active,
                    es.login_time,
                    es.last_activity,
                    es.logout_time,
                    be.first_name,
                    be.last_name,
                    be.branch_id,
                    be.email,
                    b.branch_name
                FROM employee_session es
                INNER JOIN business_employee be ON es.business_employee_id = be.business_employee_id
                LEFT JOIN branch b ON be.branch_id = b.branch_id
                WHERE es.is_active = 1 
                   OR es.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
            `);
            employeeSessions = empRows.map(row => ({
                ...row,
                user_id: row.business_employee_id,
                user_type: 'employee'
            }));
        } catch (empError) {
            console.warn('⚠️ Could not fetch employee sessions:', empError.message);
        }
        
        // Get staff sessions (inspector/collector from mobile)
        try {
            const [staffRows] = await connection.execute(`
                SELECT 
                    ss.session_id,
                    ss.staff_id as user_id,
                    ss.staff_type as user_type,
                    ss.is_active,
                    ss.login_time,
                    ss.last_activity,
                    ss.logout_time
                FROM staff_session ss
                WHERE ss.is_active = 1 
                   OR ss.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
            `);
            staffSessions = staffRows;
            console.log(`📊 Found ${staffSessions.length} staff sessions, active: ${staffSessions.filter(s => s.is_active).length}`);
            if (staffSessions.length > 0) {
                console.log('📊 Staff session sample:', JSON.stringify(staffSessions[0]));
            }
        } catch (staffError) {
            console.warn('⚠️ Could not fetch staff sessions:', staffError.message);
        }
        
        const allSessions = [...employeeSessions, ...staffSessions];
        
        res.json({ 
            success: true, 
            data: allSessions 
        });
    } catch (error) {
        console.error('Error getting active sessions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get active sessions', 
            error: error.message 
        });
    } finally {
        if (connection) await connection.end();
    }
}