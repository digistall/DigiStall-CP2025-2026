import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { createConnection } from '../../config/database.js'

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

    // Step 1: Get applicant credentials and basic info - DIRECT SQL with COLLATE fix
    console.log('🔍 Looking up user:', username)
    
    let credentialRows = [];
    try {
      const [credentialResultRows] = await connection.execute(
        'CALL sp_getCredentialWithApplicant(?)',
        [username]
      );
      credentialRows = credentialResultRows[0] || [];
    } catch (spError) {
      console.warn('⚠️ Stored procedure failed, using direct SQL:', spError.message);
      // Fallback to direct SQL with COLLATE to fix collation mismatch
      // NOTE: The applicant table uses applicant_full_name (not separate first/middle/last name columns)
      const [directRows] = await connection.execute(`
        SELECT 
          c.registrationid,
          c.applicant_id,
          c.user_name,
          c.password_hash,
          c.is_active,
          a.applicant_full_name,
          a.applicant_contact_number,
          a.applicant_address,
          a.applicant_birthdate,
          a.applicant_civil_status,
          a.applicant_educational_attainment,
          a.applicant_email
        FROM credential c
        INNER JOIN applicant a ON c.applicant_id = a.applicant_id
        WHERE c.user_name COLLATE utf8mb4_general_ci = ? COLLATE utf8mb4_general_ci
          AND c.is_active = 1
        LIMIT 1
      `, [username]);
      credentialRows = directRows;
    }

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
    console.log('👤 Found user:', userCredentials.applicant_full_name)
    console.log('🔍 User credentials structure:', {
      registrationid: userCredentials.registrationid,
      applicant_id: userCredentials.applicant_id,
      user_name: userCredentials.user_name,
      has_password_hash: !!userCredentials.password_hash,
      password_hash_preview: userCredentials.password_hash?.substring(0, 15) + '...',
      applicant_full_name: userCredentials.applicant_full_name,
      is_active: userCredentials.is_active
    })

    // Verify password
    console.log('🔐 Verifying password...')
    console.log('🔍 Password hash format:', userCredentials.password_hash?.substring(0, 10) + '...')
    
    let isPasswordValid = false
    
    try {
      // First try bcrypt comparison (for properly hashed passwords)
      if (userCredentials.password_hash?.startsWith('$2b$') || userCredentials.password_hash?.startsWith('$2a$')) {
        isPasswordValid = await bcrypt.compare(password, userCredentials.password_hash)
        console.log('🔑 BCrypt comparison result:', isPasswordValid)
      } else {
        // Fallback for legacy plain text passwords (temporary fix)
        isPasswordValid = password === userCredentials.password_hash
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
      [userCredentials.applicant_id]
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
      [userCredentials.applicant_id]
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
      [userCredentials.applicant_id]
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
      [userCredentials.applicant_id]
    )
    // Stored procedure returns [[rows], metadata] structure
    // connection.execute returns [[[actual_data], procedure_metadata], query_metadata]
    // We need to extract: [0] = [[actual_data], proc_metadata], [0][0] = [actual_data], [0][0][0] = actual_data object
    const additionalInfoRows = otherInfoResultRaw[0] // This gives [[actual_data], proc_metadata]
    const additionalInfo = additionalInfoRows && additionalInfoRows.length > 0 && additionalInfoRows[0] && additionalInfoRows[0].length > 0 
      ? additionalInfoRows[0][0] 
      : {}
    console.log('📋 Additional info result:', JSON.stringify(additionalInfo, null, 2))

    // Step 7b: Get stallholder information if user is a stallholder using stored procedure
    const [stallholderRows] = await connection.execute(
      'CALL sp_getFullStallholderInfo(?)',
      [userCredentials.applicant_id]
    )
    
    const stallholderInfo = stallholderRows[0]?.length > 0 ? stallholderRows[0][0] : null
    console.log('🏪 Stallholder info:', stallholderInfo ? 'Found' : 'Not found')

    // Step 7c: Get application status using stored procedure
    const [applicationRows] = await connection.execute(
      'CALL sp_getLatestApplicationInfo(?)',
      [userCredentials.applicant_id]
    )
    
    const applicationInfo = applicationRows[0]?.length > 0 ? applicationRows[0][0] : null
    console.log('📄 Application info:', applicationInfo ? applicationInfo.status : 'No application')

    // Step 8: Update last login using stored procedure
    await connection.execute(
      'CALL updateCredentialLastLogin(?)',
      [userCredentials.applicant_id]
    )

    // Step 9: Prepare React.js-friendly response with complete user data
    const responseData = {
      // User profile for React state
      user: {
        applicant_id: userCredentials.applicant_id,
        registration_id: userCredentials.registrationid,
        username: userCredentials.user_name,
        full_name: userCredentials.applicant_full_name,
        contact_number: userCredentials.applicant_contact_number,
        address: userCredentials.applicant_address,
        birthdate: userCredentials.applicant_birthdate,
        civil_status: userCredentials.applicant_civil_status,
        educational_attainment: userCredentials.applicant_educational_attainment,
        email: additionalInfo.email_address || null,
        created_date: userCredentials.created_date,
        last_login: new Date().toISOString()
      },

      // Spouse information (separate object for frontend)
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

      // Other information (separate object for frontend)
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
        stall_no: applicationInfo.stall_no,
        rental_price: applicationInfo.rental_price,
        branch_name: applicationInfo.branch_name
      } : null,

      // Stallholder information (if user is a stallholder)
      stallholder: stallholderInfo ? {
        stallholder_id: stallholderInfo.stallholder_id,
        stallholder_name: stallholderInfo.stallholder_name,
        contact_number: stallholderInfo.stallholder_contact,
        email: stallholderInfo.stallholder_email,
        address: stallholderInfo.stallholder_address,
        business_name: stallholderInfo.business_name,
        business_type: stallholderInfo.business_type,
        branch_id: stallholderInfo.branch_id,
        branch_name: stallholderInfo.branch_name,
        stall_id: stallholderInfo.stall_id,
        stall_no: stallholderInfo.stall_no,
        stall_location: stallholderInfo.stall_location,
        size: stallholderInfo.size,
        contract_start_date: stallholderInfo.contract_start_date,
        contract_end_date: stallholderInfo.contract_end_date,
        contract_status: stallholderInfo.contract_status,
        monthly_rent: stallholderInfo.monthly_rent,
        payment_status: stallholderInfo.payment_status,
        compliance_status: stallholderInfo.compliance_status
      } : null,

      // Computed fields for easy access
      isStallholder: !!stallholderInfo,
      isApproved: applicationInfo?.status === 'Approved',
      applicationStatus: applicationInfo?.status || 'No Application',

      // Legacy profile structure (for backward compatibility)
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
        userId: userCredentials.applicant_id,
        applicantId: userCredentials.applicant_id,
        username: userCredentials.user_name,
        userType: 'stallholder',
        registrationId: userCredentials.registrationid,
        stallholderId: stallholderInfo?.stallholder_id || null,
        isStallholder: !!stallholderInfo
      },
      process.env.JWT_SECRET || 'digistall-mobile-secret-key-2024',
      { expiresIn: '7d' } // Token valid for 7 days
    );
    
    console.log('🔐 JWT token generated for user:', userCredentials.user_name);

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