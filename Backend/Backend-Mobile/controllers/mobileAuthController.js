import { createConnection } from '../config/database.js'
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
    
    // Query mobile users from credential table using stored procedure
    console.log('🔍 Calling stored procedure getMobileUserByUsername with:', username);
    const [users] = await connection.execute(
      'CALL getMobileUserByUsername(?)',
      [username]
    );
    
    console.log('📋 Stored procedure returned:', users.length, 'users');
    if (users.length > 0) {
      console.log('👤 User data structure:', {
        registrationid: users[0].registrationid,
        applicant_id: users[0].applicant_id,
        user_name: users[0].user_name,
        has_password_hash: !!users[0].password_hash,
        password_hash_format: users[0].password_hash?.substring(0, 10) + '...',
        has_applicant_email: !!users[0].applicant_email,
        applicant_email: users[0].applicant_email,
        applicant_full_name: users[0].applicant_full_name
      });
    }
    
    if (users.length === 0) {
      console.log('❌ User not found:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const user = users[0];
    
    // Verify password using credential table password_hash
    let isValidPassword = false;
    
    try {
      // First try bcrypt comparison (for properly hashed passwords)
      if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
        isValidPassword = await bcrypt.compare(password, user.password_hash);
      } else {
        // Fallback for legacy plain text passwords (temporary fix)
        isValidPassword = password === user.password_hash;
        console.log('⚠️ Using plain text password comparison for user:', username);
      }
    } catch (error) {
      console.error('❌ Password verification error:', error);
      isValidPassword = false;
    }
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', username);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    console.log('✅ Password verified for:', username);

    // ===== FETCH COMPLETE USER DATA =====
    const applicantId = user.applicant_id;

    // Get spouse information
    const [spouseData] = await connection.execute(
      `SELECT * FROM spouse WHERE applicant_id = ?`,
      [applicantId]
    );
    console.log('👫 Spouse data:', spouseData.length > 0 ? 'Found' : 'Not found');

    // Get business information
    const [businessData] = await connection.execute(
      `SELECT * FROM business_information WHERE applicant_id = ?`,
      [applicantId]
    );
    console.log('💼 Business data:', businessData.length > 0 ? 'Found' : 'Not found');

    // Get other information
    const [otherData] = await connection.execute(
      `SELECT * FROM other_information WHERE applicant_id = ?`,
      [applicantId]
    );
    console.log('📋 Other info data:', otherData.length > 0 ? 'Found' : 'Not found');

    // Get application status
    const [applicationData] = await connection.execute(
      `SELECT 
        app.application_id,
        app.stall_id,
        app.application_status,
        app.application_date,
        s.stall_no,
        s.rental_price,
        s.stall_location,
        s.size,
        sec.section_id,
        f.floor_id,
        b.branch_id,
        b.branch_name
      FROM application app
      LEFT JOIN stall s ON app.stall_id = s.stall_id
      LEFT JOIN section sec ON s.section_id = sec.section_id
      LEFT JOIN floor f ON sec.floor_id = f.floor_id
      LEFT JOIN branch b ON f.branch_id = b.branch_id
      WHERE app.applicant_id = ?
      ORDER BY app.application_date DESC
      LIMIT 1`,
      [applicantId]
    );
    console.log('📝 Application data:', applicationData.length > 0 ? applicationData[0].application_status : 'Not found');

    // Get stallholder information (if approved)
    const [stallholderData] = await connection.execute(
      `SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.business_name,
        sh.business_type,
        sh.branch_id,
        sh.stall_id,
        sh.contract_start_date,
        sh.contract_end_date,
        sh.contract_status,
        sh.lease_amount,
        sh.monthly_rent,
        sh.payment_status,
        sh.compliance_status,
        s.stall_no,
        s.stall_location,
        s.size,
        b.branch_name
      FROM stallholder sh
      LEFT JOIN stall s ON sh.stall_id = s.stall_id
      LEFT JOIN branch b ON sh.branch_id = b.branch_id
      WHERE sh.applicant_id = ?`,
      [applicantId]
    );
    console.log('🏪 Stallholder data:', stallholderData.length > 0 ? 'Found (ID: ' + stallholderData[0].stallholder_id + ')' : 'Not found');

    // Get applicant full details
    const [applicantData] = await connection.execute(
      `SELECT * FROM applicant WHERE applicant_id = ?`,
      [applicantId]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.applicant_id,
        username: user.user_name,
        email: user.applicant_email,
        userType: 'mobile_user',
        registrationId: user.registrationid,
        stallholderId: stallholderData.length > 0 ? stallholderData[0].stallholder_id : null
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful for:', username);
    
    // Build comprehensive response
    const responseData = {
      user: {
        id: user.applicant_id,
        applicant_id: user.applicant_id,
        username: user.user_name,
        email: user.applicant_email || (otherData.length > 0 ? otherData[0].email_address : null),
        full_name: user.applicant_full_name,
        fullName: user.applicant_full_name,
        contactNumber: user.applicant_contact_number,
        address: applicantData.length > 0 ? applicantData[0].applicant_address : null,
        birthdate: applicantData.length > 0 ? applicantData[0].applicant_birthdate : null,
        civil_status: applicantData.length > 0 ? applicantData[0].applicant_civil_status : null,
        educational_attainment: applicantData.length > 0 ? applicantData[0].applicant_educational_attainment : null,
        registrationId: user.registrationid,
        userType: 'mobile_user'
      },
      spouse: spouseData.length > 0 ? {
        spouse_id: spouseData[0].spouse_id,
        full_name: spouseData[0].spouse_full_name,
        birthdate: spouseData[0].spouse_birthdate,
        educational_attainment: spouseData[0].spouse_educational_attainment,
        contact_number: spouseData[0].spouse_contact_number,
        occupation: spouseData[0].spouse_occupation
      } : null,
      business: businessData.length > 0 ? {
        business_id: businessData[0].business_id,
        nature_of_business: businessData[0].nature_of_business,
        capitalization: businessData[0].capitalization,
        source_of_capital: businessData[0].source_of_capital,
        previous_business_experience: businessData[0].previous_business_experience,
        relative_stall_owner: businessData[0].relative_stall_owner
      } : null,
      other_info: otherData.length > 0 ? {
        other_info_id: otherData[0].other_info_id,
        email_address: otherData[0].email_address,
        signature_of_applicant: otherData[0].signature_of_applicant,
        house_sketch_location: otherData[0].house_sketch_location,
        valid_id: otherData[0].valid_id
      } : null,
      application: applicationData.length > 0 ? {
        application_id: applicationData[0].application_id,
        stall_id: applicationData[0].stall_id,
        status: applicationData[0].application_status,
        application_date: applicationData[0].application_date,
        stall_no: applicationData[0].stall_no,
        rental_price: applicationData[0].rental_price,
        stall_location: applicationData[0].stall_location,
        size: applicationData[0].size,
        branch_id: applicationData[0].branch_id,
        branch_name: applicationData[0].branch_name
      } : null,
      stallholder: stallholderData.length > 0 ? {
        stallholder_id: stallholderData[0].stallholder_id,
        stallholder_name: stallholderData[0].stallholder_name,
        contact_number: stallholderData[0].contact_number,
        email: stallholderData[0].email,
        address: stallholderData[0].address,
        business_name: stallholderData[0].business_name,
        business_type: stallholderData[0].business_type,
        branch_id: stallholderData[0].branch_id,
        branch_name: stallholderData[0].branch_name,
        stall_id: stallholderData[0].stall_id,
        stall_no: stallholderData[0].stall_no,
        stall_location: stallholderData[0].stall_location,
        size: stallholderData[0].size,
        contract_start_date: stallholderData[0].contract_start_date,
        contract_end_date: stallholderData[0].contract_end_date,
        contract_status: stallholderData[0].contract_status,
        lease_amount: stallholderData[0].lease_amount,
        monthly_rent: stallholderData[0].monthly_rent,
        payment_status: stallholderData[0].payment_status,
        compliance_status: stallholderData[0].compliance_status
      } : null,
      // Computed fields for easy access
      isStallholder: stallholderData.length > 0,
      isApproved: applicationData.length > 0 && applicationData[0].application_status === 'Approved',
      applicationStatus: applicationData.length > 0 ? applicationData[0].application_status : 'No Application'
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: responseData
    });
    
  } catch (error) {
    console.error('🚨 DETAILED Mobile login error:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
      username: req.body.username
    });
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
      details: error.code || 'Unknown error'
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
    
    // Check if user already exists using stored procedure
    const [existingUsers] = await connection.execute(
      'CALL checkExistingMobileUser(?, ?)',
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
    
    // Insert new mobile user using stored procedure
    const [[result]] = await connection.execute(
      'CALL registerMobileUser(?, ?, ?, ?, ?, ?)',
      [fullName, contactNumber || null, address || null, username, email, hashedPassword]
    );
    
    console.log('✅ Registration successful for:', username);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: result.applicant_id,
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