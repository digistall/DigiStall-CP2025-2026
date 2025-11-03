import { createConnection } from '../../config/database.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// ===== MOBILE LOGIN =====
export const mobileLogin = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const { username, password } = req.body;
    
    console.log('🔐 Mobile login attempt for:', username);
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Query mobile users from credential table
    const [users] = await connection.execute(
      `SELECT 
        c.registrationid,
        c.applicant_id, 
        c.user_name, 
        c.password_hash,
        c.is_active,
        a.applicant_full_name,
        a.applicant_email,
        a.applicant_contact_number
      FROM credential c
      LEFT JOIN applicant a ON c.applicant_id = a.applicant_id
      WHERE c.user_name = ? AND c.is_active = 1`,
      [username]
    );
    
    if (users.length === 0) {
      console.log('❌ User not found:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const user = users[0];
    
    // Verify password using credential table password_hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', username);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log('✅ Password verified for:', username);
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.applicant_id,
        username: user.user_name,
        email: user.applicant_email,
        userType: 'mobile_user',
        registrationId: user.registrationid
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful for:', username);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.applicant_id,
        username: user.user_name,
        email: user.applicant_email,
        fullName: user.applicant_full_name,
        contactNumber: user.applicant_contact_number,
        registrationId: user.registrationid,
        userType: 'mobile_user'
      }
    });
    
  } catch (error) {
    console.error('Mobile login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// ===== MOBILE REGISTER =====
export const mobileRegister = async (req, res) => {
  let connection;
  
  try {
    connection = await createConnection();
    const { username, email, password, fullName, contactNumber, address } = req.body;
    
    console.log('📝 Mobile registration attempt for:', username);
    
    // Validate input
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, and full name are required'
      });
    }
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT * FROM applicant WHERE applicant_username = ? OR applicant_email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      console.log('❌ User already exists:', username);
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new mobile user
    const [result] = await connection.execute(
      `INSERT INTO applicant (
        applicant_full_name, 
        applicant_contact_number, 
        applicant_address,
        applicant_username, 
        applicant_email, 
        applicant_password_hash,
        email_verified,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())`,
      [fullName, contactNumber || null, address || null, username, email, hashedPassword]
    );
    
    console.log('✅ Registration successful for:', username);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: result.insertId,
        username,
        email,
        fullName
      }
    });
    
  } catch (error) {
    console.error('Mobile registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// ===== MOBILE VERIFY TOKEN =====
export const mobileVerifyToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: decoded
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// ===== MOBILE LOGOUT =====
export const mobileLogout = async (req, res) => {
  // Since we're using stateless JWT, logout is handled client-side
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.'
  });
};