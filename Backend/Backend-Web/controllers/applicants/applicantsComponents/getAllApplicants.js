import { createConnection } from '../../../config/database.js'

// Get all applicants
export const getAllApplicants = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();

    const [applicants] = await connection.execute('CALL getAllApplicants()');

    res.json({
      success: true,
      message: 'Applicants retrieved successfully',
      data: applicants,
      count: applicants.length
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