import { createConnection } from '../../../../config/database.js'

// Get all applicants - using decrypted procedure, with hasCredentials flag
export const getAllApplicants = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();

    const [applicants] = await connection.execute('CALL getAllApplicantsDecrypted()');

    // Get all applicant IDs that have credentials (for hasCredentials flag)
    const [credentialRows] = await connection.execute(
      'SELECT DISTINCT applicant_id FROM credential WHERE applicant_id IS NOT NULL'
    );
    const applicantIdsWithCredentials = new Set(credentialRows.map(r => r.applicant_id));

    // Add hasCredentials flag to each applicant
    const applicantsWithFlag = (applicants[0] || applicants).map(applicant => ({
      ...applicant,
      has_credentials: applicantIdsWithCredentials.has(applicant.applicant_id)
    }));

    res.json({
      success: true,
      message: 'Applicants retrieved successfully',
      data: applicantsWithFlag,
      count: applicantsWithFlag.length
    });

  } catch (error) {
    console.error('❌ Get all applicants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve applicants',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

