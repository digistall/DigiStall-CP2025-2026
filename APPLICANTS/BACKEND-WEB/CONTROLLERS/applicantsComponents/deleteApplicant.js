import { createConnection } from '../../../config/database.js'

// Delete applicant with proper cascading delete
export const deleteApplicant = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await createConnection();

    // Get applicant info before deletion
    const [[existingApplicant]] = await connection.execute(
      'CALL getApplicantById(?)',
      [id]
    );

    if (!existingApplicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    // Delete applicant using stored procedure (handles cascading deletes)
    await connection.execute('CALL deleteApplicant(?)', [id]);

    console.log('✅ Applicant deleted successfully');

    res.json({
      success: true,
      message: 'Applicant deleted successfully',
      data: {
        id: id,
        name: `${existingApplicant.first_name} ${existingApplicant.last_name}`,
        email: existingApplicant.email
      }
    });

  } catch (error) {
    console.error('❌ Delete applicant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete applicant',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};