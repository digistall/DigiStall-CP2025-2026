import { createConnection } from '../../../config/database.js'

// Get applicant by ID
export const getApplicantById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await createConnection();

    const [[applicant]] = await connection.execute(
      'CALL getApplicantById(?)',
      [id]
    );

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    res.json({
      success: true,
      message: 'Applicant retrieved successfully',
      data: applicant
    });

  } catch (error) {
    console.error('❌ Get applicant by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve applicant',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};