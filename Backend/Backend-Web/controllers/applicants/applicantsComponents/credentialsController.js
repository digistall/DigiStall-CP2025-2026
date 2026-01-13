import { createConnection } from '../../../config/database.js';
import encryptionService from '../../../services/encryptionService.js';

// Store credentials for mobile app access
// Uses stored procedures: sp_getApplicantById, sp_checkUsernameExists, sp_createCredential
export const storeCredentials = async (req, res) => {
  let connection;
  try {
    const {
      applicant_id,
      username,
      password,
      email,
      full_name,
      contact_number
    } = req.body;

    // Validate required fields
    if (!applicant_id || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Applicant ID, username, and password are required'
      });
    }

    connection = await createConnection();

    // Check if applicant exists using stored procedure
    const [applicantRows] = await connection.execute(
      'CALL sp_getApplicantById(?)',
      [applicant_id]
    );

    const applicantData = applicantRows[0];
    if (!applicantData || applicantData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    // Check if username already exists using stored procedure
    const [existingCredential] = await connection.execute(
      'CALL sp_checkUsernameExists(?)',
      [username]
    );

    if (existingCredential[0] && existingCredential[0].length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists in mobile app credentials'
      });
    }

    // Hash the password
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    // Store credentials using stored procedure
    const [result] = await connection.execute(
      'CALL sp_createCredential(?, ?, ?)',
      [applicant_id, username, passwordHash]
    );

    const credentialId = result[0]?.[0]?.credential_id;

    console.log(`✅ Credentials stored for mobile app access: ${username}`);

    res.status(201).json({
      success: true,
      message: 'Credentials stored for mobile app access',
      data: {
        registration_id: credentialId,
        applicant_id: applicant_id,
        username: username,
        created_at: new Date().toISOString(),
        is_active: true
      }
    });

  } catch (error) {
    console.error('❌ Error storing credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store credentials',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Get all credentials (for admin purposes)
// Uses stored procedure: sp_getAllCredentials
export const getAllCredentials = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();

    // Get all credentials using stored procedure
    const [results] = await connection.execute('CALL sp_getAllCredentials()');
    
    const credentials = results[0] || [];
    
    // Decrypt sensitive fields
    const decryptedCredentials = credentials.map(cred => 
      encryptionService.decryptObjectFields(cred, 'applicant')
    );

    res.json({
      success: true,
      data: decryptedCredentials,
      count: decryptedCredentials.length
    });

  } catch (error) {
    console.error('❌ Error fetching credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credentials',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};