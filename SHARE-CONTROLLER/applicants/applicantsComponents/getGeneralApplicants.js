import { createConnection } from '../../../config/database.js'
import { decryptData } from '../../../services/encryptionService.js'

// Helper function to decrypt data safely
const decryptSafe = (value) => {
  if (value === undefined || value === null || value === '') {
    return value;
  }
  try {
    if (typeof value === 'string' && value.includes(':') && value.split(':').length === 3) {
      return decryptData(value);
    }
    return value;
  } catch (error) {
    console.log('⚠️ Decryption skipped:', value.substring(0, 20) + '...');
    return value;
  }
};

/**
 * Get general applicants - those who signed up without applying for a specific stall
 * These are applicants in the applicant table who don't have any application records with stall_id
 */
export const getGeneralApplicants = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();

    console.log('🎯 Fetching general applicants (no stall applications)...');

    // Get applicants who don't have any applications with stall_id
    // OR have applications but without stall_id (general applications)
    const query = `
      SELECT DISTINCT
        a.applicant_id,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        a.status,
        a.created_at,
        a.updated_at,
        oi.email_address,
        c.username
      FROM applicant a
      LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
      LEFT JOIN credential c ON a.applicant_id = c.applicant_id
      LEFT JOIN application app ON a.applicant_id = app.applicant_id
      WHERE app.stall_id IS NULL OR app.application_id IS NULL
      ORDER BY a.created_at DESC
    `;

    const [rows] = await connection.execute(query);

    console.log(`📊 Found ${rows.length} general applicants`);

    // Decrypt sensitive fields
    const decryptedApplicants = rows.map(applicant => ({
      ...applicant,
      applicant_full_name: decryptSafe(applicant.applicant_full_name),
      applicant_contact_number: decryptSafe(applicant.applicant_contact_number),
      applicant_address: decryptSafe(applicant.applicant_address),
      email_address: decryptSafe(applicant.email_address),
    }));

    res.json({
      success: true,
      message: 'General applicants retrieved successfully',
      data: decryptedApplicants,
      count: decryptedApplicants.length
    });

  } catch (error) {
    console.error('❌ Get general applicants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve general applicants',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};
