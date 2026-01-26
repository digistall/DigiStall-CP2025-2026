import { createConnection } from '../../../CONFIG/database.js';
import { encryptData, decryptData } from '../../../SERVICES/encryptionService.js';

// Helper function to check if data is already encrypted
const isEncrypted = (value) => {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

// Helper function to ensure data is encrypted (encrypt if plain text)
const ensureEncrypted = (value) => {
  if (value === undefined || value === null || value === '') return value;
  // If already encrypted, return as-is
  if (isEncrypted(value)) return value;
  // Otherwise encrypt it
  return encryptData(value);
};

// Helper function to decrypt data safely for display
const decryptSafe = (value) => {
  if (value === undefined || value === null || value === '') return value;
  try {
    if (isEncrypted(value)) {
      return decryptData(value);
    }
    return value;
  } catch (error) {
    return value;
  }
};

// Generate username with format: 25-XXXXX (year-5digits) - MATCHES FRONTEND
const generateUsername = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year

  // Generate 5 random digits
  const randomDigits = Math.floor(10000 + Math.random() * 90000).toString(); // Ensures 5 digits

  const username = `${year}-${randomDigits}`;
  console.log('🔑 Generated username:', username);
  return username;
};

// Generate password with format: 3 random letters + 3 random numbers - MATCHES FRONTEND
const generatePassword = () => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';

  let password = '';

  // Add 3 random letters
  for (let i = 0; i < 3; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Add 3 random numbers
  for (let i = 0; i < 3; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  console.log('🔑 Generated password:', password);
  return password;
};

// Update applicant status - FIXED CREDENTIALS VERSION
export const updateApplicantStatus = async (req, res) => {
  let connection;
  try {
    const { id } = req.params; // This is applicant_id
    const { status, decline_reason, declined_at, username, password } = req.body;

    console.log('📊 Updating applicant status:', { id, status, decline_reason, declined_at, username, password });
    console.log('🔍 DEBUG - Received ID type:', typeof id, 'Value:', id);

    // Validate status - matches database enum values
    const validStatuses = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    connection = await createConnection();

    // Debug: Check what applicant IDs exist
    const [existingApplicants] = await connection.execute(
      `SELECT applicant_id, applicant_full_name FROM applicant ORDER BY applicant_id LIMIT 20`
    );
    console.log('🔍 DEBUG - Existing applicants in DB:', existingApplicants.map(a => ({ id: a.applicant_id, name: a.applicant_full_name })));

    // First, get the applicant information and their application WITH stall info
    const [applicantData] = await connection.execute(
      `SELECT 
        a.applicant_id,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        oi.email_address,
        bi.nature_of_business,
        app.application_id,
        app.application_status,
        app.stall_id,
        s.rental_price,
        s.stall_no,
        sec.section_id,
        f.floor_id,
        b.branch_id
      FROM applicant a
      LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
      LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
      LEFT JOIN application app ON a.applicant_id = app.applicant_id
      LEFT JOIN stall s ON app.stall_id = s.stall_id
      LEFT JOIN section sec ON s.section_id = sec.section_id
      LEFT JOIN floor f ON sec.floor_id = f.floor_id
      LEFT JOIN branch b ON f.branch_id = b.branch_id
      WHERE a.applicant_id = ?
      ORDER BY app.application_date DESC
      LIMIT 1`,
      [id]
    );

    console.log('🔍 DEBUG - Query result for ID', id, ':', applicantData);

    if (applicantData.length === 0) {
      console.log('❌ DEBUG - Applicant not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    const applicantRaw = applicantData[0];
    
    // Create applicant object with both encrypted (for DB insert) and decrypted (for logging) values
    const applicant = {
      ...applicantRaw,
      // Decrypted values for logging/display
      decrypted_name: decryptSafe(applicantRaw.applicant_full_name),
      // Encrypted values for stallholder insert (ensure all PII is encrypted)
      encrypted_name: ensureEncrypted(applicantRaw.applicant_full_name),
      encrypted_contact: ensureEncrypted(applicantRaw.applicant_contact_number),
      encrypted_address: ensureEncrypted(applicantRaw.applicant_address),
      encrypted_email: ensureEncrypted(applicantRaw.email_address)
    };
    
    if (!applicant.application_id) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this applicant'
      });
    }

    // Start database transaction
    await connection.beginTransaction();

    try {
      // Update the application status (this is where status is actually stored)
      const updateQuery = `
        UPDATE application 
        SET 
          application_status = ?, 
          updated_at = NOW() 
        WHERE application_id = ?
      `;

      console.log('🔍 Executing query:', updateQuery.replace(/\s+/g, ' ').trim());
      console.log('🔍 With parameters:', [status, applicant.application_id]);

      const [result] = await connection.execute(updateQuery, [status, applicant.application_id]);

      console.log('📊 Update result:', result);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'No rows were updated. Application may not exist.'
        });
      }

      let credentialsCreated = false;
      let finalUsername = null;
      let finalPassword = null;

      // Check if this is final approval (Under Review -> Approved or Pending -> Approved)
      const shouldCreateCredentials = status === 'Approved';
      
      console.log(`🔍 Approval check: Current status: ${applicant.application_status}, New status: ${status}, Should create credentials: ${shouldCreateCredentials}`);

      // If this is final approval, create credentials for mobile app
      if (shouldCreateCredentials) {
        try {
          console.log('🔑 Creating credentials for final approval...');
          
          // Use credentials from frontend if provided, otherwise generate new ones
          if (username && password) {
            finalUsername = username;
            finalPassword = password;
            console.log('🔑 Using frontend-provided credentials:', finalUsername, '/', finalPassword);
          } else {
            // Generate credentials using same logic as frontend
            finalUsername = generateUsername();
            finalPassword = generatePassword();
            console.log('🔑 Generated new credentials:', finalUsername, '/', finalPassword);
          }

          // Check if credentials already exist for this applicant
          const [existingCredential] = await connection.execute(
            'SELECT registrationid FROM credential WHERE applicant_id = ?',
            [applicant.applicant_id]
          );

          if (existingCredential.length > 0) {
            console.log('⚠️ Credentials already exist for this applicant, updating...');
            
            // Hash the password
            const bcrypt = await import('bcrypt');
            const passwordHash = await bcrypt.hash(finalPassword, 10);
            
            // Update existing credentials
            await connection.execute(
              `UPDATE credential SET 
                user_name = ?, 
                password_hash = ?, 
                is_active = 1
              WHERE applicant_id = ?`,
              [finalUsername, passwordHash, applicant.applicant_id]
            );
            
            credentialsCreated = true;
            console.log('✅ Credentials updated successfully');
          } else {
            // Hash the password
            const bcrypt = await import('bcrypt');
            const passwordHash = await bcrypt.hash(finalPassword, 10);

            // Store new credentials in credential table for mobile app access
            await connection.execute(
              `INSERT INTO credential (
                applicant_id, user_name, password_hash, created_date, is_active
              ) VALUES (?, ?, ?, NOW(), 1)`,
              [applicant.applicant_id, finalUsername, passwordHash]
            );

            credentialsCreated = true;
            console.log('✅ New credentials created successfully for mobile app access');
          }
        } catch (credError) {
          console.error('❌ Error creating credentials:', credError);
          await connection.rollback();
          return res.status(500).json({
            success: false,
            message: 'Failed to create credentials',
            error: credError.message
          });
        }

        // ============================================
        // CREATE STALLHOLDER RECORD
        // ============================================
        try {
          console.log('🏪 Creating stallholder record...');

          // Check if stallholder already exists for this applicant
          const [existingStallholder] = await connection.execute(
            'SELECT stallholder_id FROM stallholder WHERE applicant_id = ?',
            [applicant.applicant_id]
          );

          // Calculate contract dates (1 year contract starting today)
          const contractStartDate = new Date();
          const contractEndDate = new Date();
          contractEndDate.setFullYear(contractEndDate.getFullYear() + 1);

          const formatDate = (date) => date.toISOString().split('T')[0];

          if (existingStallholder.length > 0) {
            console.log('⚠️ Stallholder already exists, updating with encrypted data...');
            
            // Update existing stallholder with new stall assignment (using ENCRYPTED values)
            await connection.execute(
              `UPDATE stallholder SET 
                stall_id = ?,
                branch_id = ?,
                stallholder_name = ?,
                contact_number = ?,
                email = ?,
                address = ?,
                business_type = ?,
                contract_start_date = ?,
                contract_end_date = ?,
                contract_status = 'Active',
                lease_amount = ?,
                monthly_rent = ?,
                payment_status = 'pending',
                updated_at = NOW()
              WHERE applicant_id = ?`,
              [
                applicant.stall_id,
                applicant.branch_id,
                applicant.encrypted_name,           // Use encrypted name
                applicant.encrypted_contact,        // Use encrypted contact
                applicant.encrypted_email,          // Use encrypted email
                applicant.encrypted_address,        // Use encrypted address
                applicant.nature_of_business || 'General',
                formatDate(contractStartDate),
                formatDate(contractEndDate),
                applicant.rental_price || 0,
                applicant.rental_price || 0,
                applicant.applicant_id
              ]
            );
            console.log('✅ Stallholder record updated with encrypted data');
          } else {
            console.log('🔐 Creating new stallholder record with encrypted data...');
            
            // Create new stallholder record (using ENCRYPTED values)
            await connection.execute(
              `INSERT INTO stallholder (
                applicant_id,
                stallholder_name,
                contact_number,
                email,
                address,
                business_type,
                branch_id,
                stall_id,
                contract_start_date,
                contract_end_date,
                contract_status,
                lease_amount,
                monthly_rent,
                payment_status,
                compliance_status,
                date_created
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, 'pending', 'Compliant', NOW())`,
              [
                applicant.applicant_id,
                applicant.encrypted_name,           // Use encrypted name
                applicant.encrypted_contact,        // Use encrypted contact
                applicant.encrypted_email,          // Use encrypted email
                applicant.encrypted_address,        // Use encrypted address
                applicant.nature_of_business || 'General',
                applicant.branch_id,
                applicant.stall_id,
                formatDate(contractStartDate),
                formatDate(contractEndDate),
                applicant.rental_price || 0,
                applicant.rental_price || 0
              ]
            );
            console.log('✅ New stallholder record created with encrypted data');
          }

          // Update stall status to Occupied
          await connection.execute(
            `UPDATE stall SET status = 'Occupied', is_available = 0 WHERE stall_id = ?`,
            [applicant.stall_id]
          );
          console.log('✅ Stall status updated to Occupied');

        } catch (stallholderError) {
          console.error('❌ Error creating stallholder:', stallholderError);
          await connection.rollback();
          return res.status(500).json({
            success: false,
            message: 'Failed to create stallholder record',
            error: stallholderError.message
          });
        }
      }

      // Commit the transaction
      await connection.commit();

      console.log(`✅ Application for ${applicant.decrypted_name} status updated to: ${status}`);

      const responseData = {
        applicant_id: id,
        application_id: applicant.application_id,
        full_name: applicant.decrypted_name,  // Use decrypted name for response
        email: decryptSafe(applicant.email_address),  // Decrypt email for response
        new_status: status,
        updated_at: new Date().toISOString()
      };

      // Add credentials info if they were created
      if (credentialsCreated) {
        responseData.credentials_created = true;
        responseData.mobile_username = finalUsername;
        responseData.mobile_password = finalPassword; // Return the actual password for email
        responseData.stallholder_created = true;
        responseData.stall_id = applicant.stall_id;
        responseData.stall_no = applicant.stall_no;
      }

      res.json({
        success: true,
        message: credentialsCreated 
          ? 'Applicant approved successfully! Stallholder record created and mobile app credentials stored.' 
          : 'Applicant status updated successfully',
        data: responseData
      });

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Update applicant status error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update applicant status',
      error: error.message,
      stack: error.stack,
      code: error.code,
      sqlState: error.sqlState
    });
  } finally {
    if (connection) await connection.end();
  }
};

