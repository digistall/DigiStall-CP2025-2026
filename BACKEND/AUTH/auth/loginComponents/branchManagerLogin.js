import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import process from 'process'
import { createConnection } from '../../../../config/database.js'

const { compare } = bcrypt
const { sign } = jwt

// Business Manager Login controller
export const branchManagerLogin = async (req, res) => {
  let connection;

  try {
    const { username, password } = req.body;

    console.log('- Username:', username);
    console.log('- Password length:', password ? password.length : 'undefined');

    // Validation - only username and password required
    if (!username || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    connection = await createConnection();

    // Query business_manager table using stored procedure

    const [[businessManager]] = await connection.execute(
      'CALL getBusinessManagerByUsername(?)',
      [username]
    );


    if (!businessManager) {
      console.log('❌ No business manager found with username:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or inactive account',
      });
    }


    // Verify password
    let isPasswordValid = false;

    if (businessManager.manager_password_hash.startsWith('$2b$') || businessManager.manager_password_hash.startsWith('$2a$')) {
      // Hashed password
      isPasswordValid = await compare(password, businessManager.manager_password_hash);
    } else {
      // Plain text password (temporary for testing)
      isPasswordValid = password === businessManager.manager_password_hash;
    }


    if (!isPasswordValid) {
      console.log('❌ Invalid password for business manager:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token with business manager info
    const token = sign(
      {
        userId: businessManager.business_manager_id,
        businessManagerId: businessManager.business_manager_id,
        username: businessManager.manager_username,
        email: businessManager.email,
        role: 'business_manager',
        type: 'business_manager',
        userType: 'business_manager',  // Add this field for consistency
        branchId: businessManager.branch_id,
        branchName: businessManager.branch_name,
        area: businessManager.area,
        location: businessManager.location,
        fullName: `${businessManager.first_name} ${businessManager.last_name}`
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('✅ Business Manager login successful for:', username);


    res.json({
      success: true,
      message: 'Business Manager login successful',
      token,
      user: {
        id: businessManager.business_manager_id,
        businessManagerId: businessManager.business_manager_id,
        username: businessManager.manager_username,
        email: businessManager.email,
        firstName: businessManager.first_name,
        lastName: businessManager.last_name,
        fullName: `${businessManager.first_name} ${businessManager.last_name}`,
        role: 'business_manager',
        type: 'business_manager',
        userType: 'business_manager',  // Add this field for frontend consistency
        branch: {
          id: businessManager.branch_id,
          name: businessManager.branch_name,
          area: businessManager.area,
          location: businessManager.location
        }
      }
    });

  } catch (error) {
    console.error('❌ Branch Manager login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

