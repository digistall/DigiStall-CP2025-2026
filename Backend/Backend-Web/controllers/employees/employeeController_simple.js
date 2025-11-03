import { createConnection } from '../../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function createEmployee(req, res) {
    let connection;
    try {
        const { firstName, lastName, email, phoneNumber, permissions } = req.body;
        const userBranchId = req.user?.branchId;
        const createdByManagerId = req.user?.userId || req.user?.branchManagerId;
        
        console.log('📋 Creating employee with data:', { 
            firstName, 
            lastName, 
            email, 
            phoneNumber, 
            permissions: permissions || [],
            userBranchId,
            createdByManagerId 
        });
        
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
        
        // Check if email already exists
        const [existingEmployee] = await connection.execute(
            'SELECT employee_id FROM employee WHERE email = ? AND status = "Active"',
            [email]
        );
        
        if (existingEmployee.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'An employee with this email address already exists'
            });
        }
        
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const username = `EMP${randomDigits}`;
        const password = Math.random().toString(36).substring(2, 10);
        const hashedPassword = await bcrypt.hash(password, 12);

        // Convert permissions array to JSON string
        const permissionsJson = permissions && Array.isArray(permissions) 
            ? JSON.stringify(permissions) 
            : null;

        console.log('💾 Saving employee with permissions JSON:', permissionsJson);

        // Insert employee with all fields including created_by_manager and permissions
        const [result] = await connection.execute(
            `INSERT INTO employee (
                first_name, 
                last_name, 
                email, 
                phone_number, 
                employee_username, 
                employee_password_hash, 
                branch_id, 
                created_by_manager,
                permissions,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
            [
                firstName, 
                lastName, 
                email, 
                phoneNumber, 
                username, 
                hashedPassword, 
                userBranchId,
                createdByManagerId,
                permissionsJson
            ]
        );

        console.log(`👥 Created new employee ID: ${result.insertId} in branch: ${userBranchId} by manager: ${createdByManagerId}`);
        
        // Note: Email will be sent by frontend using EmailJS (same method as applicants)
        console.log(`📧 Email will be sent by frontend via EmailJS to ${email}`);

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: {
                employeeId: result.insertId,
                credentials: {
                    username,
                    password
                },
                branchId: userBranchId
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
        // Get the current user's branch ID from the authenticated token
        const userBranchId = req.user?.branchId;
        
        if (!userBranchId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Branch ID not found in user session' 
            });
        }

        connection = await createConnection();
        
        // Filter employees by the current user's branch ID
        const [employees] = await connection.execute(
            'SELECT * FROM employee WHERE status = "Active" AND branch_id = ?', 
            [userBranchId]
        );
        
        console.log(`🏢 Fetching employees for branch ID: ${userBranchId}, Found: ${employees.length} employees`);
        
        // Parse permissions JSON string to array for each employee
        const employeesWithParsedPermissions = employees.map(emp => ({
            ...emp,
            permissions: emp.permissions ? JSON.parse(emp.permissions) : []
        }));
        
        res.json({ success: true, data: employeesWithParsedPermissions });
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
        
        // Security check: Only allow access to employees from the same branch
        const [employee] = await connection.execute(
            'SELECT * FROM employee WHERE employee_id = ? AND branch_id = ?', 
            [id, userBranchId]
        );
        
        if (employee.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found or you do not have permission to access this employee' 
            });
        }
        
        console.log(`🔍 Fetching employee ID: ${id} from branch: ${userBranchId}`);
        
        // Parse permissions JSON string to array
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
        const { firstName, lastName, email, phoneNumber, status } = req.body;
        const userBranchId = req.user?.branchId;
        
        if (!userBranchId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Branch ID not found in user session' 
            });
        }
        
        connection = await createConnection();
        
        // Security check: Only allow updating employees from the same branch
        const [result] = await connection.execute(
            'UPDATE employee SET first_name = ?, last_name = ?, email = ?, phone_number = ?, status = ? WHERE employee_id = ? AND branch_id = ?',
            [firstName, lastName, email, phoneNumber, status, id, userBranchId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found or you do not have permission to update this employee' 
            });
        }

        console.log(`✏️ Updated employee ID: ${id} in branch: ${userBranchId}`);
        
        res.json({ success: true, message: 'Employee updated successfully' });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ success: false, message: 'Failed to update employee' });
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
        
        // Security check: Only allow deleting employees from the same branch
        const [result] = await connection.execute(
            'UPDATE employee SET status = "Inactive" WHERE employee_id = ? AND branch_id = ?', 
            [id, userBranchId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found or you do not have permission to delete this employee' 
            });
        }

        console.log(`🗑️ Deactivated employee ID: ${id} in branch: ${userBranchId}`);
        
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
        
        console.log('🔐 Employee login attempt:', { username });
        
        if (!username || !password) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password are required' 
            });
        }

        connection = await createConnection();
        
        // Query employee table with JOIN to branch table for branch details
        console.log('🔍 Searching for employee with username:', username);
        const [employees] = await connection.execute(`
            SELECT 
                e.employee_id, 
                e.employee_username, 
                e.employee_password_hash, 
                e.first_name, 
                e.last_name, 
                e.email, 
                e.phone_number,
                e.branch_id,
                e.status,
                e.permissions,
                b.branch_name,
                b.area,
                b.location
            FROM employee e
            LEFT JOIN branch b ON e.branch_id = b.branch_id
            WHERE e.employee_username = ? AND e.status = ?`,
            [username, 'Active']
        );

        if (employees.length === 0) {
            console.log('❌ No employee found with username:', username);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials or inactive account' 
            });
        }

        const employee = employees[0];
        console.log('📍 Employee found:', {
            id: employee.employee_id,
            name: `${employee.first_name} ${employee.last_name}`,
            branch: employee.branch_name
        });

        // Verify password
        console.log('🔒 Verifying password...');
        const isValid = await bcrypt.compare(password, employee.employee_password_hash);
        if (!isValid) {
            console.log('❌ Invalid password for employee:', username);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Generate JWT token
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
                permissions: employee.permissions ? JSON.parse(employee.permissions) : {}
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        console.log('✅ Employee login successful for:', username);

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
                permissions: employee.permissions ? JSON.parse(employee.permissions) : {}
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
        connection = await createConnection();
        
        const newPassword = Math.random().toString(36).substring(2, 10);
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        const [result] = await connection.execute(
            'UPDATE employee SET employee_password_hash = ?, password_reset_required = TRUE WHERE employee_id = ?',
            [hashedPassword, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
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
        
        // Security check: Users can only access employees from their own branch
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
        const [employees] = await connection.execute('SELECT * FROM employee WHERE branch_id = ? AND status = "Active"', [branchId]);
        
        console.log(`🏢 Fetching employees for specific branch ID: ${branchId}, Found: ${employees.length} employees`);
        
        res.json({ success: true, data: employees });
    } catch (error) {
        console.error('Error getting employees by branch:', error);
        res.status(500).json({ success: false, message: 'Failed to get employees' });
    } finally {
        if (connection) await connection.end();
    }
}