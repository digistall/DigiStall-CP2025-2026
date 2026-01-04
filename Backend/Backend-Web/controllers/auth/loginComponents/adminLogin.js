import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import process from 'process'
import { createConnection } from '../../../config/database.js'

const { compare } = bcrypt
const { sign } = jwt

// Stall Business Owner Login controller
export const adminLogin = async (req, res) => {
  let connection;

  try {
    const { username, password } = req.body;

    console.log('🔐 Stall Business Owner login attempt for username:', username);

    // Validation
    if (!username || !password) {
      console.log('❌ Missing username or password');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    connection = await createConnection();

    // Query stall_business_owner table using stored procedure
    const [[businessOwner]] = await connection.execute(
      'CALL getStallBusinessOwnerByUsernameLogin(?)',
      [username]
    );  

    console.log('🔍 Found business owners:', businessOwner ? 1 : 0);

    if (!businessOwner) {
      console.log('❌ No business owner found with username:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const isPasswordValid = await compare(password, businessOwner.business_owner_password_hash);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for business owner:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = sign(
      {
        userId: businessOwner.business_owner_id,
        username: businessOwner.business_owner_username,
        email: businessOwner.email,
        role: 'stall_business_owner',
        type: 'stall_business_owner',
        userType: 'stall_business_owner'  // Add this field for consistency
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('✅ Stall Business Owner login successful for:', username);
    console.log('🎯 Token payload:', { 
      userId: businessOwner.business_owner_id, 
      role: 'stall_business_owner', 
      type: 'stall_business_owner',
      userType: 'stall_business_owner' 
    });

    res.json({
      success: true,
      message: 'Stall Business Owner login successful',
      token,
      user: {
        id: businessOwner.business_owner_id,
        username: businessOwner.business_owner_username,
        email: businessOwner.email,
        role: 'stall_business_owner',
        type: 'stall_business_owner',
        userType: 'stall_business_owner'  // Add this field for frontend consistency
      }
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};