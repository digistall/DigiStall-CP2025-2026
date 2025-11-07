import bcrypt from 'bcrypt'
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

    // Step 1: Get applicant credentials and basic info
    console.log('🔍 Looking up user:', username)
    
    // TEMPORARY FIX: Use direct SQL query instead of stored procedure
    console.log('🛠️ Using direct SQL query as workaround...')
    const [credentialRows] = await connection.execute(`
      SELECT 
        c.registrationid,
        c.applicant_id,
        c.user_name,
        c.password_hash,
        c.created_date,
        c.last_login,
        c.is_active,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        COALESCE(a.applicant_email, oi.email_address) as applicant_email
      FROM credential c
      INNER JOIN applicant a ON c.applicant_id = a.applicant_id
      LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
      WHERE c.user_name = ? 
        AND c.is_active = 1
      LIMIT 1
    `, [username])

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
      applicant_email: userCredentials.applicant_email,
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

    // Step 7: Get additional applicant information
    const [otherInfo] = await connection.execute(
      'CALL getApplicantAdditionalInfo(?)',
      [userCredentials.applicant_id]
    )

    const additionalInfo = otherInfo.length > 0 ? otherInfo[0] : {}

    // Step 8: Update last login using stored procedure
    await connection.execute(
      'CALL updateCredentialLastLogin(?)',
      [userCredentials.applicant_id]
    )

    // Step 9: Prepare React.js-friendly response
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
        email: additionalInfo.email_address || null, // Get email from other_information table
        created_date: userCredentials.created_date,
        last_login: new Date().toISOString()
      },

      // Additional profile information
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

    res.json({
      success: true,
      message: 'Mobile login successful',
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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

    // Check 2-application limit per branch
    // TEMPORARY FIX: Use direct SQL query instead of stored procedure
    const [branchApplications] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM application app
      JOIN stall s ON app.stall_id = s.stall_id
      JOIN section sec ON s.section_id = sec.section_id
      JOIN floor f ON sec.floor_id = f.floor_id
      JOIN branch b ON f.branch_id = b.branch_id
      WHERE app.applicant_id = ? AND b.branch_id = ?
    `, [applicant_id, stall.branch_id])

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