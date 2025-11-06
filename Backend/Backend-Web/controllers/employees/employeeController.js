import { createConnection } from '../../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function createEmployee(req, res) {
    let connection;
    try {
        const { firstName, lastName, email, phoneNumber, permissions, branchId, createdByManager } = req.body;
        const userBranchId = req.user?.branchId;
        const userId = req.user?.userId || req.user?.branchManagerId;
        
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

        // Call stored procedure
        const [[result]] = await connection.execute(
            'CALL createEmployee(?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, firstName, lastName, email, phoneNumber, finalBranchId, finalCreatedBy, permissionsJson]
        );

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: {
                employeeId: result.employee_id,
                credentials: {
                    username,
                    password
                },
                branchId: finalBranchId
            }
        });

    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ success: false, message: 'Failed to create employee' });
    } finally {
        if (connection) await connection.end();
    }
}

export async function getAllEmployees(req, res) {
    let connection;
    try {
        const userBranchId = req.user?.branchId;
        
        if (!userBranchId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Branch ID not found in user session' 
            });
        }

        connection = await createConnection();
        
        // Call stored procedure to get all employees
        const [[employees]] = await connection.execute(
            'CALL getAllEmployees(?, ?, NULL, NULL)',
            ['Active', userBranchId]
        );
        
        // Parse permissions for each employee
        const employeesWithPermissions = employees.map(emp => ({
            ...emp,
            permissions: emp.permissions ? JSON.parse(emp.permissions) : []
        }));
        
        res.json({ success: true, data: employeesWithPermissions });
    } catch (error) {
        console.error('Error getting employees:', error);
        res.status(500).json({ success: false, message: 'Failed to get employees' });
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
        
        // Call stored procedure
        const [[employee]] = await connection.execute(
            'CALL getEmployeeById(?)',
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
        res.status(500).json({ success: false, message: 'Failed to get employee' });
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
        
        // Verify employee belongs to the same branch
        const [[checkEmployee]] = await connection.execute(
            'CALL getEmployeeById(?)',
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
        
        // Call stored procedure
        const [[result]] = await connection.execute(
            'CALL updateEmployee(?, ?, ?, ?, ?, ?, ?)',
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
        res.status(500).json({ success: false, message: 'Failed to update employee' });
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
        
        // Verify employee belongs to the same branch
        const [[checkEmployee]] = await connection.execute(
            'CALL getEmployeeById(?)',
            [id]
        );
        
        if (checkEmployee.length === 0 || checkEmployee[0].branch_id !== userBranchId) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found or you do not have permission to update this employee' 
            });
        }
        
        const permissionsJson = JSON.stringify(permissions);
        
        // Call stored procedure (passing null for fields we don't want to update)
        const [[result]] = await connection.execute(
            'CALL updateEmployee(?, NULL, NULL, NULL, NULL, ?, NULL)',
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
        res.status(500).json({ success: false, message: 'Failed to update employee permissions' });
    } finally {
        if (connection) await connection.end();
    }
}

export async function deleteEmployee(req, res) {
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
        
        // Verify employee belongs to the same branch
        const [[checkEmployee]] = await connection.execute(
            'CALL getEmployeeById(?)',
            [id]
        );
        
        if (checkEmployee.length === 0 || checkEmployee[0].branch_id !== userBranchId) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found or you do not have permission to delete this employee' 
            });
        }
        
        // Call stored procedure
        const [[result]] = await connection.execute(
            'CALL deleteEmployee(?)',
            [id]
        );

        if (result.affected_rows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Failed to deactivate employee' 
            });
        }
        
        res.json({ success: true, message: 'Employee deactivated successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ success: false, message: 'Failed to delete employee' });
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
        
        // Call stored procedure to get employee by username
        const [[employees]] = await connection.execute(
            'CALL getEmployeeByUsername(?)',
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
            { employeeId: employee.employee_id, timestamp: Date.now() },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );
        
        // Call stored procedure to create session and update last_login
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        await connection.execute(
            'CALL loginEmployee(?, ?, ?, ?)',
            [username, sessionToken, ipAddress, userAgent]
        );

        // Parse permissions
        const permissions = employee.permissions ? JSON.parse(employee.permissions) : [];

        const token = jwt.sign(
            {
                userId: employee.employee_id,
                employeeId: employee.employee_id,
                username: employee.employee_username,
                email: employee.email,
                role: 'employee',
                type: 'employee',
                userType: 'employee',
                branchId: employee.branch_id,
                branchName: employee.branch_name,
                area: employee.area,
                location: employee.location,
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
                id: employee.employee_id,
                employeeId: employee.employee_id,
                username: employee.employee_username,
                email: employee.email,
                firstName: employee.first_name,
                lastName: employee.last_name,
                fullName: `${employee.first_name} ${employee.last_name}`,
                phoneNumber: employee.phone_number,
                role: 'employee',
                type: 'employee',
                userType: 'employee',
                branch: {
                    id: employee.branch_id,
                    name: employee.branch_name,
                    area: employee.area,
                    location: employee.location
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

export async function logoutEmployee(req, res) {
    res.json({ success: true, message: 'Logout successful' });
}

export async function resetEmployeePassword(req, res) {
    let connection;
    try {
        const { id } = req.params;
        const userBranchId = req.user?.branchId;
        const userId = req.user?.userId || req.user?.branchManagerId;
        
        if (!userBranchId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Branch ID not found in user session' 
            });
        }
        
        connection = await createConnection();
        
        // Verify employee belongs to the same branch
        const [[checkEmployee]] = await connection.execute(
            'CALL getEmployeeById(?)',
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
        
        // Call stored procedure
        const [[result]] = await connection.execute(
            'CALL resetEmployeePassword(?, ?, ?)',
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
        res.status(500).json({ success: false, message: 'Failed to reset password' });
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
        
        // Call stored procedure
        const [[employees]] = await connection.execute(
            'CALL getEmployeesByBranch(?, ?)',
            [branchId, 'Active']
        );
        
        // Parse permissions for each employee
        const employeesWithPermissions = employees.map(emp => ({
            ...emp,
            permissions: emp.permissions ? JSON.parse(emp.permissions) : []
        }));
        
        res.json({ success: true, data: employeesWithPermissions });
    } catch (error) {
        console.error('Error getting employees by branch:', error);
        res.status(500).json({ success: false, message: 'Failed to get employees' });
    } finally {
        if (connection) await connection.end();
    }
}