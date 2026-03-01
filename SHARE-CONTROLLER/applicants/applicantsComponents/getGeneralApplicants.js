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
    // Include business_information, spouse, and other_information
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
        c.username,
        -- Business Information
        bi.nature_of_business,
        bi.capitalization,
        bi.source_of_capital,
        bi.previous_business_experience,
        bi.relative_stall_owner,
        -- Spouse Information
        sp.spouse_full_name,
        sp.spouse_birthdate,
        sp.spouse_educational_attainment,
        sp.spouse_contact_number,
        sp.spouse_occupation
      FROM applicant a
      LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
      LEFT JOIN credential c ON a.applicant_id = c.applicant_id
      LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
      LEFT JOIN spouse sp ON a.applicant_id = sp.applicant_id
      LEFT JOIN application app ON a.applicant_id = app.applicant_id
      WHERE app.stall_id IS NULL OR app.application_id IS NULL
      ORDER BY a.created_at DESC
    `;

    const [rows] = await connection.execute(query);

    console.log(`📊 Found ${rows.length} general applicants`);

    // Decrypt sensitive fields and structure the data
    const decryptedApplicants = rows.map(applicant => ({
      applicant_id: applicant.applicant_id,
      applicant_full_name: decryptSafe(applicant.applicant_full_name),
      applicant_contact_number: decryptSafe(applicant.applicant_contact_number),
      applicant_address: decryptSafe(applicant.applicant_address),
      applicant_birthdate: applicant.applicant_birthdate,
      applicant_civil_status: applicant.applicant_civil_status,
      applicant_educational_attainment: applicant.applicant_educational_attainment,
      status: applicant.status,
      created_at: applicant.created_at,
      updated_at: applicant.updated_at,
      email_address: decryptSafe(applicant.email_address),
      username: applicant.username,
      // Business Information (structured)
      business_information: applicant.nature_of_business ? {
        nature_of_business: applicant.nature_of_business,
        capitalization: applicant.capitalization,
        source_of_capital: applicant.source_of_capital,
        previous_business_experience: applicant.previous_business_experience,
        relative_stall_owner: applicant.relative_stall_owner
      } : null,
      // Spouse Information (structured)
      spouse: applicant.spouse_full_name ? {
        spouse_full_name: decryptSafe(applicant.spouse_full_name),
        spouse_birthdate: applicant.spouse_birthdate,
        spouse_educational_attainment: applicant.spouse_educational_attainment,
        spouse_contact_number: decryptSafe(applicant.spouse_contact_number),
        spouse_occupation: applicant.spouse_occupation
      } : null
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
