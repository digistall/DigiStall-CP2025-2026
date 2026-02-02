import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { createConnection } from '../../config/database.js'
import { decryptApplicantData, decryptStallholderData, decryptSpouseData, getEncryptionKeyFromDB, decryptAES256GCM, decryptObjectFields } from '../../services/mysqlDecryptionService.js'

// Mobile login for React.js app - fetch stalls by applicant's applied area
export const mobileLogin = async (req, res) => {
  const connection = await createConnection()
  
  try {
    const { username, password } = req.body
    console.log('📱 Mobile Login Request:', { username, passwordLength: password?.length })

    if (!username || !password) {
      console.log('❌ Missing credentials')
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      })
    }

    // Step 1: Get applicant credentials and basic info using stored procedure
    console.log('🔍 Looking up user:', username)
    
    const [credentialResultRows] = await connection.execute(
      'CALL sp_getCredentialWithApplicant(?)',
      [username]
    );
    const credentialRows = credentialResultRows[0] || [];

    console.log('📋 Credential rows found:', credentialRows.length)
    console.log('🔍 Raw credential data:', JSON.stringify(credentialRows, null, 2))

    if (credentialRows.length === 0) {
      console.log('❌ User not found or inactive')
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      })
    }

    const userCredentials = credentialRows[0]
    
    // Decrypt user credentials if encrypted (applicant_full_name from applicant table)
    const decryptedCredentials = decryptObjectFields(userCredentials, ['applicant_full_name', 'applicant_contact_number', 'applicant_address'])
    
    const applicantFullName = decryptedCredentials.applicant_full_name || 'User'
    
    console.log('👤 Found user:', applicantFullName)
    console.log('🔍 User credentials structure:', {
      applicant_id: decryptedCredentials.applicant_id,
      username: decryptedCredentials.username,
      has_password_hash: !!decryptedCredentials.password_hash,
      password_hash_preview: decryptedCredentials.password_hash?.substring(0, 15) + '...',
      applicant_full_name: applicantFullName
    })

    // Verify password
    console.log('🔐 Verifying password...')
    console.log('🔍 Password hash format:', decryptedCredentials.password_hash?.substring(0, 10) + '...')
    
    let isPasswordValid = false
    
    try {
      // First try bcrypt comparison (for properly hashed passwords)
      if (decryptedCredentials.password_hash?.startsWith('$2b$') || decryptedCredentials.password_hash?.startsWith('$2a$')) {
        isPasswordValid = await bcrypt.compare(password, decryptedCredentials.password_hash)
        console.log('🔑 BCrypt comparison result:', isPasswordValid)
      } else {
        // Fallback for legacy plain text passwords (temporary fix)
        isPasswordValid = password === decryptedCredentials.password_hash
        console.log('⚠️ Using plain text password comparison for user:', username)
        console.log('🔑 Plain text comparison result:', isPasswordValid)
      }
    } catch (error) {
      console.error('❌ Password verification error:', error)
      isPasswordValid = false
    }
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password')
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      })
    }

    console.log('✅ Login successful, fetching user data...')

    // Step 2: Get areas where this applicant has applied (to fetch relevant stalls)
    const [appliedAreas] = await connection.execute(
      'CALL getAppliedAreasByApplicant(?)',
      [decryptedCredentials.applicant_id]
    )

    // If no applications yet, get all available areas
    let targetAreas = []
    if (appliedAreas.length === 0) {
      const [allAreas] = await connection.execute('CALL getAllActiveBranches()')
      targetAreas = allAreas
    } else {
      targetAreas = appliedAreas
    }

    // Step 3: Get applicant's current applications with detailed info
    const [myApplications] = await connection.execute(
      'CALL getApplicantApplicationsDetailed(?)',
      [decryptedCredentials.applicant_id]
    )

    // Step 4: Count applications per branch (for 2-application limit)
    const branchApplicationCounts = {}
    myApplications.forEach(app => {
      const branchId = app.branch_id
      branchApplicationCounts[branchId] = (branchApplicationCounts[branchId] || 0) + 1
    })

    // Step 5: Get available stalls in the areas where applicant applied (or all areas if no applications)
    const [availableStalls] = await connection.execute(
      'CALL getAvailableStallsByApplicant(?)',
      [decryptedCredentials.applicant_id]
    )
    
    // Filter by target areas if specific areas are applied
    const areaValues = targetAreas.map(area => area.area)
    const filteredStalls = areaValues.length > 0 
      ? availableStalls.filter(stall => areaValues.includes(stall.area))
      : availableStalls

    // Step 6: Add additional metadata for React components
    const stallsWithMetadata = filteredStalls.map(stall => ({
      ...stall,
      can_apply: stall.application_status === 'available' && 
                 (branchApplicationCounts[stall.branch_id] || 0) < 2,
      applications_in_branch: branchApplicationCounts[stall.branch_id] || 0,
      max_applications_reached: (branchApplicationCounts[stall.branch_id] || 0) >= 2
    }))

    // Step 7: Get additional applicant information (spouse, business, other info)
    const otherInfoResultRaw = await connection.execute(
      'CALL getApplicantAdditionalInfo(?)',
      [decryptedCredentials.applicant_id]
    )
    // Stored procedure returns [[rows], metadata] structure
    // connection.execute returns [[[actual_data], procedure_metadata], query_metadata]
    // We need to extract: [0] = [[actual_data], proc_metadata], [0][0] = [actual_data], [0][0][0] = actual_data object
    const additionalInfoRows = otherInfoResultRaw[0] // This gives [[actual_data], proc_metadata]
    let additionalInfo = additionalInfoRows && additionalInfoRows.length > 0 && additionalInfoRows[0] && additionalInfoRows[0].length > 0 
      ? additionalInfoRows[0][0] 
      : {}
    
    // Decrypt additional info fields (spouse, email, etc.)
    additionalInfo = decryptObjectFields(additionalInfo, ['email_address', 'spouse_full_name', 'spouse_contact_number'])
    console.log('📋 Additional info result:', JSON.stringify(additionalInfo, null, 2))

    // Step 7b: Get stallholder information if user is a stallholder using stored procedure
    const [stallholderRows] = await connection.execute(
      'CALL sp_getFullStallholderInfo(?)',
      [decryptedCredentials.applicant_id]
    )
    
    let stallholderInfo = stallholderRows[0]?.length > 0 ? stallholderRows[0][0] : null
    // Decrypt stallholder data if present (full_name is now a single column)
    if (stallholderInfo) {
      stallholderInfo = decryptObjectFields(stallholderInfo, ['stallholder_name', 'contact_number', 'email', 'address'])
      console.log('🔓 Decrypted stallholder_name:', stallholderInfo.stallholder_name)
    }
    console.log('🏪 Stallholder info:', stallholderInfo ? 'Found' : 'Not found')

    // Step 7c: Get application status using stored procedure
    const [applicationRows] = await connection.execute(
      'CALL sp_getLatestApplicationInfo(?)',
      [decryptedCredentials.applicant_id]
    )
    
    const applicationInfo = applicationRows[0]?.length > 0 ? applicationRows[0][0] : null
    console.log('📄 Application info:', applicationInfo ? applicationInfo.status : 'No application')

    // Step 8: Update last login using stored procedure
    await connection.execute(
      'CALL updateCredentialLastLogin(?)',
      [decryptedCredentials.applicant_id]
    )

    // Step 9: Prepare React.js-friendly response with complete user data (using decrypted data)
    // Helper function to decrypt any remaining encrypted values
    const safeDecrypt = (value) => decryptAES256GCM(value) || value;
    
    // Build full name from stallholder info or applicant info
    const fullName = stallholderInfo?.stallholder_name || decryptedCredentials.applicant_full_name || 'User'
    
    const responseData = {
      // User profile for React state
      user: {
        applicant_id: decryptedCredentials.applicant_id,
        username: decryptedCredentials.username, // This is the email
        full_name: fullName,
        stallholder_name: stallholderInfo?.stallholder_name || fullName,
        contact_number: stallholderInfo?.contact_number || decryptedCredentials.applicant_contact_number,
        address: stallholderInfo?.address || decryptedCredentials.applicant_address,
        birthdate: decryptedCredentials.applicant_birthdate,
        civil_status: decryptedCredentials.applicant_civil_status,
        educational_attainment: decryptedCredentials.applicant_educational_attainment,
        email: stallholderInfo?.email || additionalInfo.email_address || decryptedCredentials.username,
        stall_number: stallholderInfo?.stall_number || null,
        created_date: decryptedCredentials.created_date,
        last_login: new Date().toISOString()
      },

      // Spouse information (separate object for frontend) - already decrypted above
      spouse: additionalInfo.spouse_full_name ? {
        spouse_id: null, // Not available in current query
        full_name: additionalInfo.spouse_full_name,
        birthdate: additionalInfo.spouse_birthdate,
        educational_attainment: additionalInfo.spouse_educational_attainment,
        contact_number: additionalInfo.spouse_contact_number,
        occupation: additionalInfo.spouse_occupation
      } : null,

      // Business information (separate object for frontend)
      business: additionalInfo.nature_of_business ? {
        business_id: null,
        nature_of_business: additionalInfo.nature_of_business,
        capitalization: additionalInfo.capitalization,
        source_of_capital: additionalInfo.source_of_capital,
        previous_business_experience: additionalInfo.previous_business_experience,
        relative_stall_owner: additionalInfo.relative_stall_owner
      } : null,

      // Other information (separate object for frontend) - already decrypted above
      other_info: additionalInfo.email_address ? {
        other_info_id: null,
        email_address: additionalInfo.email_address,
        signature_of_applicant: additionalInfo.signature_of_applicant,
        house_sketch_location: additionalInfo.house_sketch_location,
        valid_id: additionalInfo.valid_id
      } : null,

      // Application information
      application: applicationInfo ? {
        application_id: applicationInfo.application_id,
        stall_id: applicationInfo.stall_id,
        status: applicationInfo.status,
        stall_number: applicationInfo.stall_number,
        rental_price: applicationInfo.rental_price,
        branch_name: applicationInfo.branch_name
      } : null,

      // Stallholder information (if user is a stallholder)
      stallholder: stallholderInfo ? {
        stallholder_id: stallholderInfo.stallholder_id,
        stallholder_name: stallholderInfo.stallholder_name, // Already decrypted above
        contact_number: stallholderInfo.contact_number,
        email: stallholderInfo.email,
        address: stallholderInfo.address,
        branch_id: stallholderInfo.branch_id,
        branch_name: stallholderInfo.branch_name,
        stall_id: stallholderInfo.stall_id,
        stall_number: stallholderInfo.stall_number,
        stall_location: stallholderInfo.stall_location,
        size: stallholderInfo.size,
        contract_start_date: stallholderInfo.contract_start_date,
        contract_status: stallholderInfo.contract_status,
        monthly_rent: stallholderInfo.monthly_rent,
        payment_status: stallholderInfo.payment_status
      } : null,

      // Computed fields for easy access
      isStallholder: !!stallholderInfo,
      isApproved: applicationInfo?.status === 'Approved',
      applicationStatus: applicationInfo?.status || 'No Application',

      // Legacy profile structure (for backward compatibility) - already decrypted above
      profile: {
        other_info: {
          email_address: additionalInfo.email_address,
          signature: additionalInfo.signature_of_applicant,
          house_sketch: additionalInfo.house_sketch_location,
          valid_id: additionalInfo.valid_id
        },
        business_info: {
          nature_of_business: additionalInfo.nature_of_business,
          capitalization: additionalInfo.capitalization,
          source_of_capital: additionalInfo.source_of_capital,
          previous_experience: additionalInfo.previous_business_experience,
          relative_stall_owner: additionalInfo.relative_stall_owner
        },
        spouse_info: additionalInfo.spouse_full_name ? {
          full_name: additionalInfo.spouse_full_name,
          birthdate: additionalInfo.spouse_birthdate,
          educational_attainment: additionalInfo.spouse_educational_attainment,
          contact_number: additionalInfo.spouse_contact_number,
          occupation: additionalInfo.spouse_occupation
        } : null
      },

      // Applications data for React components
      applications: {
        my_applications: myApplications,
        applications_count_by_branch: branchApplicationCounts,
        total_applications: myApplications.length
      },

      // Stalls data structured for React components
      stalls: {
        available_stalls: stallsWithMetadata,
        areas_applied: targetAreas,
        total_stalls: stallsWithMetadata.length,
        applicable_stalls: stallsWithMetadata.filter(stall => stall.can_apply).length
      },

      // UI state helpers for React
      ui_state: {
        can_apply_more: Object.values(branchApplicationCounts).some(count => count < 2),
        application_limits: {
          max_per_branch: 2,
          current_counts: branchApplicationCounts
        }
      }
    }

    // Generate JWT token for authentication
    const token = jwt.sign(
      {
        userId: decryptedCredentials.applicant_id,
        applicantId: decryptedCredentials.applicant_id,
        username: decryptedCredentials.username, // email
        fullName: fullName,
        userType: 'stallholder',
        stallholderId: stallholderInfo?.stallholder_id || null,
        isStallholder: !!stallholderInfo
      },
      process.env.JWT_SECRET || 'digistall-mobile-secret-key-2024',
      { expiresIn: '7d' } // Token valid for 7 days
    );
    
    console.log('🔐 JWT token generated for user:', fullName);

    res.json({
      success: true,
      message: 'Mobile login successful',
      token: token,  // ← TOKEN NOW INCLUDED!
      data: responseData
    })

  } catch (error) {
    console.error('🚨 DETAILED Mobile login error:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
      username: req.body.username
    })
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message // Always show error message for debugging
    })
  } finally {
    await connection.end()
  }
}

// Submit application for mobile app (React.js)
export const submitApplication = async (req, res) => {
  const connection = await createConnection()
  
  try {
    const { applicant_id, stall_id } = req.body

    if (!applicant_id || !stall_id) {
      return res.status(400).json({
        success: false,
        message: 'Applicant ID and Stall ID are required'
      })
    }

    // Check if stall is available
    const [stallCheck] = await connection.execute(
      'CALL getStallWithBranchInfo(?)',
      [stall_id]
    )

    if (stallCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stall not found'
      })
    }

    const stall = stallCheck[0]

    if (!stall.is_available || stall.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Stall is not available for application'
      })
    }

    // Check if applicant already applied for this stall
    const [existingApplication] = await connection.execute(
      'CALL checkExistingApplication(?, ?)',
      [applicant_id, stall_id]
    )

    if (existingApplication.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this stall'
      })
    }

    // Check 2-application limit per branch using stored procedure
    const [branchAppRows] = await connection.execute(
      'CALL sp_countBranchApplicationsForApplicant(?, ?)',
      [applicant_id, stall.branch_id]
    )
    const branchApplications = branchAppRows[0]

    if (branchApplications[0].count >= 2) {
      return res.status(400).json({
        success: false,
        message: `You have reached the maximum of 2 applications per branch (${stall.branch_name})`
      })
    }

    // Submit the application using stored procedure
    const [[insertResult]] = await connection.execute(
      'CALL createApplication(?, ?, NOW(), ?)',
      [applicant_id, stall_id, 'Pending']
    )

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application_id: insertResult.application_id,
        stall_id: stall_id,
        applicant_id: applicant_id,
        status: 'Pending',
        submitted_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Submit application error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit application. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  } finally {
    await connection.end()
  }
}

