import { createConnection } from '../../../../SHARED/CONFIG/database.js'
import { encryptData } from '../../../../SHARED/SERVICES/encryptionService.js'
import { generateSecurePassword } from '../../../../SHARED/UTILS/passwordGenerator.js'
import emailService from '../../../../SHARED/SERVICES/emailService.js'

// Create branch manager with auto-generated credentials and email notification
export const createBranchManager = async (req, res) => {
  let connection;
  try {
    console.log('🔧 Creating branch manager - Request received')
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2))

    const {
      branch_id,
      branchId = branch_id,
      first_name,
      firstName = first_name,
      last_name,
      lastName = last_name,
      email,
      contact_number,
      contactNumber = contact_number,
      phone = contact_number,
      status = 'Active'
    } = req.body;

    // Use flexible field mapping
    const finalBranchId = branchId || branch_id
    const finalFirstName = firstName || first_name
    const finalLastName = lastName || last_name
    const finalContactNumber = contactNumber || contact_number || phone

    // Get current user info
    const currentUser = req.user
    const userRole = currentUser?.role || currentUser?.userType
    const userId = currentUser?.userId || currentUser?.id

    console.log('🔍 Mapped values:')
    console.log('- Branch ID:', finalBranchId)
    console.log('- Name:', finalFirstName, finalLastName)
    console.log('- Email:', email)
    console.log('- Contact:', finalContactNumber)
    console.log('- User Role:', userRole)
    console.log('- User ID:', userId)
    
    // Validation - only require name and email now
    if (!finalBranchId || !finalFirstName || !finalLastName || !email) {
      const missingFields = []
      if (!finalBranchId) missingFields.push('branch_id/branchId')
      if (!finalFirstName) missingFields.push('first_name/firstName')
      if (!finalLastName) missingFields.push('last_name/lastName')
      if (!email) missingFields.push('email')

      console.log('❌ Validation failed - Missing fields:', missingFields)
      
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields
      });
    }
    
    connection = await createConnection();
    
    // Check if branch exists and get current manager
    const [branchExists] = await connection.execute(
      'SELECT branch_id, branch_name, business_owner_id, business_manager_id FROM branch WHERE branch_id = ?',
      [finalBranchId]
    );
    
    if (branchExists.length === 0) {
      console.log('❌ Branch not found:', finalBranchId)
      return res.status(400).json({
        success: false,
        message: 'Branch not found'
      });
    }
    
    const branchName = branchExists[0].branch_name
    const currentManagerId = branchExists[0].business_manager_id
    console.log('✅ Branch found:', branchName)
    
    // If there's a current manager, deactivate them
    if (currentManagerId) {
      console.log('📝 Deactivating previous manager ID:', currentManagerId)
      await connection.execute(
        'UPDATE business_manager SET status = ? WHERE business_manager_id = ?',
        ['Inactive', currentManagerId]
      );
      console.log('✅ Previous manager deactivated')
    }
    
    // If user is business_owner, verify they own this branch
    if (userRole === 'stall_business_owner') {
      const branchOwnerId = branchExists[0].business_owner_id
      
      if (!branchOwnerId || branchOwnerId !== userId) {
        console.log('❌ Access denied: Branch not owned by this business owner')
        return res.status(403).json({
          success: false,
          message: 'You can only create managers for your own branches'
        });
      }
      
      console.log('✅ Branch ownership verified for business owner:', userId)
    }
    
    // Check if email already exists
    const [existingUser] = await connection.execute(
      'SELECT branch_manager_id FROM branch_manager WHERE email = ?',
      [email]
    );
    
    if (existingUser.length > 0) {
      console.log('❌ Email already exists:', email)
      return res.status(400).json({
        success: false,
        message: 'A manager with this email already exists'
      });
    }
    
    // Auto-generate credentials
    const generatedPassword = generateSecurePassword(12)
    
    // Email becomes the username
    const username = email
    
    // Encrypt password and names
    const encryptedPassword = encryptData(generatedPassword)
    const encryptedFirstName = encryptData(finalFirstName)
    const encryptedLastName = encryptData(finalLastName)
    const encryptedContact = finalContactNumber ? encryptData(finalContactNumber) : null
    
    console.log('🔐 Credentials generated and encrypted')
    console.log('📧 Email (username):', email)
    console.log('🔑 Generated password:', generatedPassword)
    
    // Get business_owner_id (either from current user or from branch)
    let businessOwnerId = null
    if (userRole === 'stall_business_owner') {
      businessOwnerId = userId
    } else {
      // Admin creating manager - get business_owner_id from branch
      businessOwnerId = branchExists[0].business_owner_id || null
    }
    
    console.log('👤 Business Owner ID:', businessOwnerId)
    
    // Create branch manager using stored procedure
    const [[result]] = await connection.execute(
      'CALL createBranchManager(?, ?, ?, ?, ?, ?)',
      [email, encryptedPassword, encryptedFirstName, encryptedLastName, encryptedContact, businessOwnerId]
    );
    
    const managerId = result[0].branch_manager_id
    console.log('✅ Branch manager created with ID:', managerId)
    
    // Assign manager to branch
    await connection.execute(
      'CALL assignManagerToBranch(?, ?)',
      [finalBranchId, managerId]
    );
    
    console.log('✅ Manager assigned to branch:', branchName)
    
    // Send welcome email with credentials (handled by frontend using EmailJS)
    // Backend still attempts to send for redundancy
    try {
      await emailService.sendManagerWelcomeEmail({
        email: email,
        firstName: finalFirstName,
        lastName: finalLastName,
        username: username,
        password: generatedPassword,
        branchName: branchName,
        managerId: managerId
      })
      
      console.log('✅ Welcome email sent to:', email)
    } catch (emailError) {
      console.error('⚠️ Failed to send email (non-critical):', emailError.message)
      // Don't fail the request if email fails - frontend will send via EmailJS
    }
    
    res.status(201).json({
      success: true,
      message: `Branch manager created successfully!`,
      data: {
        manager_id: managerId,
        branch_id: finalBranchId,
        branch_name: branchName,
        email: email,
        full_name: `${finalFirstName} ${finalLastName}`,
        credentials: {
          username: username,
          password: generatedPassword
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Create branch manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create branch manager',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};