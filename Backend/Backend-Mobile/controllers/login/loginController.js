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
    const [credentialRows] = await connection.execute(
      'CALL getApplicantLoginCredentials(?)',
      [username]
    )

    console.log('📋 Credential rows found:', credentialRows.length)

    if (credentialRows.length === 0) {
      console.log('❌ User not found or inactive')
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      })
    }

    const userCredentials = credentialRows[0]
    console.log('👤 Found user:', userCredentials.applicant_full_name)

    // Verify password
    console.log('🔐 Verifying password...')
    const isPasswordValid = await bcrypt.compare(password, userCredentials.password_hash)
    console.log('🔑 Password valid:', isPasswordValid)
    
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
    console.error('Mobile login error:', error)
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
    const [branchApplications] = await connection.execute(
      'CALL countApplicationsByBranch(?, ?)',
      [applicant_id, stall.branch_id]
    )

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