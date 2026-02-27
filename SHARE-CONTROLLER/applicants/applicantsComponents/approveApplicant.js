import { createConnection } from '../../../config/database.js';
import { decryptData, encryptData } from '../../../services/encryptionService.js';

// Helper function to decrypt data safely (handles both encrypted and plain text)
const decryptSafe = (value) => {
  if (value === undefined || value === null || value === '') return value;
  try {
    if (typeof value === 'string' && value.includes(':') && value.split(':').length === 3) {
      return decryptData(value);
    }
    return value;
  } catch (error) {
    return value;
  }
};

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

// Approve applicant and store credentials for mobile app access
// Also creates stallholder record and assigns stall ownership
export const approveApplicant = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    // Password is auto-generated, username will be the email from other_information
    const { password } = req.body;

    console.log(`🎯 Attempting to approve applicant ID: ${id}`);
    console.log(`📝 Received password:`, password ? '***' : 'undefined');

    // Validate required fields (username will be derived from email)
    if (!password) {
      console.log('❌ Missing password for approval');
      return res.status(400).json({
        success: false,
        message: 'Password is required for approval'
      });
    }

    connection = await createConnection();
    await connection.beginTransaction();

    console.log(`🔍 Checking if applicant ID ${id} exists...`);

    // Check if applicant exists with full details for stallholder creation
    const [applicantRows] = await connection.execute(
      `SELECT 
        a.applicant_id,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        oi.email_address,
        bi.nature_of_business as business_name,
        bi.nature_of_business as business_type
      FROM applicant a
      LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
      LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
      WHERE a.applicant_id = ?`,
      [id]
    );

    console.log(`📊 Query result: Found ${applicantRows.length} applicant(s) for ID ${id}`);

    if (applicantRows.length === 0) {
      console.log(`❌ Applicant ID ${id} not found in database`);
      
      const [allApplicants] = await connection.execute(
        'SELECT applicant_id, applicant_full_name FROM applicant ORDER BY applicant_id'
      );
      console.log(`📋 Available applicants:`, allApplicants.map(a => `ID: ${a.applicant_id}, Name: ${a.applicant_full_name}`));
      
      return res.status(404).json({
        success: false,
        message: 'Applicant not found',
        available_applicants: allApplicants.map(a => ({ id: a.applicant_id, name: a.applicant_full_name }))
      });
    }

    // Decrypt applicant data before using
    const applicantRaw = applicantRows[0];
    
    // Keep both encrypted and decrypted versions
    // Decrypted for display/logging, encrypted for database insert
    const applicant = {
      applicant_id: applicantRaw.applicant_id,
      // Decrypted values for logging
      applicant_full_name: decryptSafe(applicantRaw.applicant_full_name),
      applicant_contact_number: decryptSafe(applicantRaw.applicant_contact_number),
      applicant_address: decryptSafe(applicantRaw.applicant_address),
      email_address: decryptSafe(applicantRaw.email_address),
      business_name: applicantRaw.business_name,
      business_type: applicantRaw.business_type,
      // Encrypted values for stallholder insert (ensure they're encrypted)
      encrypted_name: ensureEncrypted(applicantRaw.applicant_full_name),
      encrypted_contact: ensureEncrypted(applicantRaw.applicant_contact_number),
      encrypted_address: ensureEncrypted(applicantRaw.applicant_address),
      encrypted_email: ensureEncrypted(applicantRaw.email_address)
    };
    
    console.log(`📋 Decrypted applicant:`, { name: applicant.applicant_full_name, email: applicant.email_address });

    // Use email as username
    const username = applicant.email_address;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Applicant email not found. Cannot create credentials.'
      });
    }

    // Check if username (email) already exists in credential table
    const [existingCredential] = await connection.execute(
      'SELECT credential_id FROM credential WHERE username = ?',
      [username]
    );

    if (existingCredential.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists. Please generate a new username.'
      });
    }

    // Get the pending application with stall details
    const [applicationRows] = await connection.execute(
      `SELECT 
        app.application_id,
        app.stall_id,
        st.rental_price,
        st.price_type,
        sec.section_id,
        f.floor_id,
        f.branch_id
      FROM application app
      JOIN stall st ON app.stall_id = st.stall_id
      JOIN section sec ON st.section_id = sec.section_id
      JOIN floor f ON sec.floor_id = f.floor_id
      WHERE app.applicant_id = ? AND app.application_status IN ('Pending', 'Under Review')
      ORDER BY app.application_date DESC
      LIMIT 1`,
      [id]
    );

    if (applicationRows.length === 0) {
      // Debug: check what status the application actually has
      const [debugRows] = await connection.execute(
        `SELECT application_id, application_status, stall_id FROM application WHERE applicant_id = ?`,
        [id]
      );
      console.log(`❌ No pending application found for applicant ID ${id}`);
      console.log(`🔍 DEBUG - All applications for this applicant:`, debugRows);
      
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'No pending application found for this applicant',
        debug_applications: debugRows
      });
    }

    const application = applicationRows[0];
    console.log(`📋 Found pending application:`, application);

    // Hash the password using bcrypt
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Encrypt the password for storage in applicant table (using same format as other encrypted data)
    const encryptedPassword = encryptData(password);

    // 1. Store credentials in credential table for mobile app access
    await connection.execute(
      `INSERT INTO credential (
        applicant_id, username, password_hash, created_at
      ) VALUES (?, ?, ?, NOW())`,
      [applicant.applicant_id, username, passwordHash]
    );
    
    // 1.5. Update applicant status to approved
    await connection.execute(
      `UPDATE applicant 
       SET status = 'approved', updated_at = NOW()
       WHERE applicant_id = ?`,
      [applicant.applicant_id]
    );
    console.log(`✅ Applicant ${applicant.applicant_id} status updated to approved`);

    // 2. Update application status to approved
    await connection.execute(
      `UPDATE application 
       SET application_status = 'Approved', updated_at = NOW()
       WHERE application_id = ?`,
      [application.application_id]
    );
    console.log(`✅ Application ${application.application_id} status updated to Approved`);

    // 3. Create stallholder record with ENCRYPTED data
    console.log(`🔐 Inserting stallholder with encrypted data...`);

    // Check if stallholder already exists
    const [existingStallholder] = await connection.execute(
      'SELECT stallholder_id FROM stallholder WHERE applicant_id = ?',
      [applicant.applicant_id]
    );

    let stallholderId;

    if (existingStallholder.length > 0) {
      stallholderId = existingStallholder[0].stallholder_id;
      console.log('⚠️ Stallholder already exists, updating...');
      await connection.execute(
        `UPDATE stallholder SET 
          full_name = ?,
          email = ?,
          contact_number = ?,
          address = ?,
          stall_id = ?,
          branch_id = ?,
          payment_status = 'unpaid',
          status = 'active',
          move_in_date = CURDATE(),
          updated_at = NOW()
        WHERE applicant_id = ?`,
        [
          applicant.encrypted_name,
          applicant.encrypted_email,
          applicant.encrypted_contact,
          applicant.encrypted_address,
          application.stall_id,
          application.branch_id,
          applicant.applicant_id
        ]
      );
      console.log('✅ Stallholder record updated');
    } else {
      const [stallholderResult] = await connection.execute(
        `INSERT INTO stallholder (
          applicant_id,
          full_name,
          email,
          contact_number,
          address,
          stall_id,
          branch_id,
          payment_status,
          status,
          compliance_status,
          move_in_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid', 'active', 'Compliant', CURDATE())`,
        [
          applicant.applicant_id,
          applicant.encrypted_name,
          applicant.encrypted_email,
          applicant.encrypted_contact,
          applicant.encrypted_address,
          application.stall_id,
          application.branch_id
        ]
      );
      stallholderId = stallholderResult.insertId;
      console.log(`✅ Stallholder record created with ID: ${stallholderId}`);
    }

    // 4. Update the stall to mark as occupied
    await connection.execute(
      `UPDATE stall 
       SET is_available = 0, status = 'Occupied', updated_at = NOW()
       WHERE stall_id = ?`,
      [application.stall_id]
    );
    console.log(`✅ Stall ${application.stall_id} marked as occupied`);

    // 5. Reject any other pending applications for the same stall
    await connection.execute(
      `UPDATE application 
       SET application_status = 'Rejected', updated_at = NOW()
       WHERE stall_id = ? AND application_id != ? AND application_status IN ('Pending', 'Under Review')`,
      [application.stall_id, application.application_id]
    );
    console.log(`✅ Other pending applications for stall ${application.stall_id} rejected`);

    await connection.commit();

    console.log(`✅ Applicant ${applicant.applicant_full_name} approved successfully`);

    res.json({
      success: true,
      message: 'Applicant approved successfully. Stallholder record created and stall assigned.',
      data: {
        applicant_id: applicant.applicant_id,
        stallholder_id: stallholderId,
        full_name: applicant.applicant_full_name,
        email: applicant.email_address,
        username: username,
        stall_id: application.stall_id,
        branch_id: application.branch_id,
        move_in_date: new Date().toISOString().split('T')[0],
        approved_at: new Date().toISOString()
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error approving applicant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve applicant',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

