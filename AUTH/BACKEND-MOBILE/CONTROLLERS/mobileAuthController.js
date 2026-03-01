import { createConnection } from '../config/database.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { decryptApplicantData, decryptStallholderData, decryptSpouseData } from '../services/mysqlDecryptionService.js'

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
    
    // ===== Get mobile user from credential table using stored procedure =====
    console.log('🔍 Querying mobile user with username:', username);
    let users = [];
    
    const [spResult] = await connection.execute('CALL sp_getMobileUserByUsername(?)', [username]);
    users = spResult[0] || [];
    
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

    // ===== FETCH COMPLETE USER DATA USING STORED PROCEDURES =====
    const applicantId = user.applicant_id;

    // Decrypt user/applicant data if encrypted
    let decryptedUser = await decryptApplicantData(user);
    console.log('🔓 User decrypted:', decryptedUser.applicant_full_name);

    // Get spouse information
    const [spouseResult] = await connection.execute('CALL sp_getSpouseByApplicantId(?)', [applicantId]);
    let spouseData = spouseResult[0] || [];
    // Decrypt spouse data if found
    if (spouseData.length > 0) {
      spouseData[0] = await decryptSpouseData(spouseData[0]);
    }
    console.log('👫 Spouse data:', spouseData.length > 0 ? 'Found' : 'Not found');

    // Get business information
    const [businessResult] = await connection.execute('CALL sp_getBusinessInfoByApplicantId(?)', [applicantId]);
    const businessData = businessResult[0] || [];
    console.log('💼 Business data:', businessData.length > 0 ? 'Found' : 'Not found');

    // Get other information
    const [otherResult] = await connection.execute('CALL sp_getOtherInfoByApplicantId(?)', [applicantId]);
    const otherData = otherResult[0] || [];
    console.log('📋 Other info data:', otherData.length > 0 ? 'Found' : 'Not found');

    // Get application status
    const [applicationResult] = await connection.execute('CALL sp_getLatestApplicationByApplicantId(?)', [applicantId]);
    const applicationData = applicationResult[0] || [];
    console.log('📝 Application data:', applicationData.length > 0 ? applicationData[0]?.application_status : 'Not found');

    // Get stallholder information (if approved) - Using direct query instead of stored procedure
    // because sp_getStallholderByApplicantId depends on fn_getEncryptionKey which may not exist
    // Check both applicant_id and mobile_user_id since stallholders can be linked by either
    const [stallholderResult] = await connection.execute(`
      SELECT 
        sh.*,
        s.stall_number,
        s.stall_location,
        s.size,
        s.monthly_rent as stall_monthly_rent,
        b.branch_name
      FROM stallholder sh
      LEFT JOIN stall s ON sh.stall_id = s.stall_id
      LEFT JOIN branch b ON sh.branch_id = b.branch_id
      WHERE sh.applicant_id = ? OR sh.mobile_user_id = ?
    `, [applicantId, applicantId]);
    let stallholderData = stallholderResult || [];
    // Decrypt stallholder data if found
    if (stallholderData.length > 0) {
      stallholderData[0] = await decryptStallholderData(stallholderData[0]);
    }
    console.log('🏪 Stallholder data:', stallholderData.length > 0 ? 'Found (ID: ' + stallholderData[0]?.stallholder_id + ')' : 'Not found');

    // Get applicant full details
    const [applicantResult] = await connection.execute('CALL sp_getApplicantById(?)', [applicantId]);
    let applicantData = applicantResult[0] || [];
    // Decrypt applicant data if found
    if (applicantData.length > 0) {
      applicantData[0] = await decryptApplicantData(applicantData[0]);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: decryptedUser.applicant_id,
        username: decryptedUser.user_name,
        email: decryptedUser.applicant_email,
        userType: 'mobile_user',
        registrationId: decryptedUser.registrationid,
        stallholderId: stallholderData.length > 0 ? stallholderData[0].stallholder_id : null
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful for:', username);
    
    // Build comprehensive response with decrypted data
    const responseData = {
      user: {
        id: decryptedUser.applicant_id,
        applicant_id: decryptedUser.applicant_id,
        username: decryptedUser.user_name,
        email: decryptedUser.applicant_email || (otherData.length > 0 ? otherData[0].email_address : null),
        full_name: decryptedUser.applicant_full_name,
        fullName: decryptedUser.applicant_full_name,
        contactNumber: decryptedUser.applicant_contact_number,
        address: applicantData.length > 0 ? applicantData[0].applicant_address : null,
        birthdate: applicantData.length > 0 ? applicantData[0].applicant_birthdate : null,
        civil_status: applicantData.length > 0 ? applicantData[0].applicant_civil_status : null,
        educational_attainment: applicantData.length > 0 ? applicantData[0].applicant_educational_attainment : null,
        registrationId: decryptedUser.registrationid,
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
        stall_number: applicationData[0].stall_number || applicationData[0].stall_no,
        stall_no: applicationData[0].stall_no || applicationData[0].stall_number, // Keep for backwards compatibility
        rental_price: applicationData[0].rental_price,
        stall_location: applicationData[0].stall_location,
        size: applicationData[0].size,
        branch_id: applicationData[0].branch_id,
        branch_name: applicationData[0].branch_name
      } : null,
      stallholder: stallholderData.length > 0 ? {
        stallholder_id: stallholderData[0].stallholder_id,
        stallholder_name: stallholderData[0].full_name || stallholderData[0].stallholder_name,
        contact_number: stallholderData[0].contact_number,
        email: stallholderData[0].email,
        address: stallholderData[0].address,
        business_name: stallholderData[0].business_name,
        business_type: stallholderData[0].business_type,
        branch_id: stallholderData[0].branch_id,
        branch_name: stallholderData[0].branch_name,
        stall_id: stallholderData[0].stall_id,
        stall_number: stallholderData[0].stall_number || stallholderData[0].stall_no,
        stall_no: stallholderData[0].stall_no || stallholderData[0].stall_number, // Keep for backwards compatibility
        stall_location: stallholderData[0].stall_location,
        size: stallholderData[0].size,
        // Contract dates - move_in_date is the contract start date
        move_in_date: stallholderData[0].move_in_date,
        contract_start_date: stallholderData[0].move_in_date, // Use move_in_date as contract start
        contract_end_date: stallholderData[0].move_in_date 
          ? new Date(new Date(stallholderData[0].move_in_date).setFullYear(new Date(stallholderData[0].move_in_date).getFullYear() + 1)).toISOString()
          : null, // Calculate end date as 1 year from move_in_date
        contract_status: stallholderData[0].status === 'active' ? 'Active' : stallholderData[0].status,
        lease_amount: stallholderData[0].lease_amount || 0,
        monthly_rent: stallholderData[0].stall_monthly_rent || stallholderData[0].monthly_rent || 0,
        payment_status: stallholderData[0].payment_status,
        compliance_status: stallholderData[0].compliance_status || 'Pending'
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
  let connection;
  
  try {
    connection = await createConnection();
    
    // Debug: Log the entire request to see what we're receiving
    console.log('📱 Mobile logout request received');
    console.log('📱 req.user:', JSON.stringify(req.user, null, 2));
    console.log('📱 req.body:', JSON.stringify(req.body, null, 2));
    console.log('📱 Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Get user info from JWT token (set by auth middleware) or from body
    const applicantId = req.user?.userId || req.user?.applicantId || req.body?.applicantId || req.body?.userId;
    
    console.log('📱 Extracted applicant ID:', applicantId);
    
    if (applicantId) {
      // Get Philippine time
      const now = new Date();
      const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
      const year = phTime.getFullYear();
      const month = String(phTime.getMonth() + 1).padStart(2, '0');
      const day = String(phTime.getDate()).padStart(2, '0');
      const hours = String(phTime.getHours()).padStart(2, '0');
      const minutes = String(phTime.getMinutes()).padStart(2, '0');
      const seconds = String(phTime.getSeconds()).padStart(2, '0');
      const philippineTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      
      console.log('📱 Updating credential table with time:', philippineTime);
      
      // Update last_logout in credential table using stored procedure
      const [result] = await connection.execute(
        'CALL sp_updateCredentialLastLogout(?, ?)',
        [applicantId, philippineTime]
      );
      const affectedRows = result[0]?.[0]?.affected_rows || 0;
      
      console.log(`✅ Updated last_logout for applicant ${applicantId} at ${philippineTime}, affected rows: ${affectedRows}`);
      
      if (affectedRows === 0) {
        console.warn(`⚠️ No rows updated - applicant_id ${applicantId} may not exist in credential table`);
      }
    } else {
      console.warn('⚠️ No applicant ID found in request - cannot update last_logout');
    }
    
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove the token from client storage.'
    });
    
  } catch (error) {
    console.error('❌ Mobile logout error:', error);
    console.error('❌ Error stack:', error.stack);
    // Still return success even if database update fails (client-side logout should work)
    res.status(200).json({
      success: true,
      message: 'Logout successful. Please remove the token from client storage.'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};