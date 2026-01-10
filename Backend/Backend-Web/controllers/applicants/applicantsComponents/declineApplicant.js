import { createConnection } from '../../../config/database.js';
import encryptionService from '../../../services/encryptionService.js';

// Decline applicant and delete all related data
// Uses stored procedure: sp_deleteApplicantCascade
export const declineApplicant = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Validate decline reason
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A detailed decline reason (at least 10 characters) is required'
      });
    }

    connection = await createConnection();
    await connection.beginTransaction();

    // Check if applicant exists using stored procedure
    const [applicantRows] = await connection.execute(
      'CALL sp_getApplicantById(?)',
      [id]
    );

    const applicantData = applicantRows[0];
    if (!applicantData || applicantData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    // Decrypt applicant data for logging
    const applicant = encryptionService.decryptObjectFields(applicantData[0], 'applicant');

    // Log the decline action before deletion
    console.log(`🗑️ Declining and deleting applicant: ${applicant.applicant_full_name} (ID: ${id})`);
    console.log(`📝 Decline reason: ${reason}`);

    // Delete all related data using stored procedure cascade delete
    const [deleteResult] = await connection.execute(
      'CALL sp_deleteApplicantCascade(?)',
      [id]
    );

    await connection.commit();

    console.log(`✅ Applicant ${applicant.applicant_full_name} declined and all data deleted successfully`);

    res.json({
      success: true,
      message: 'Applicant declined and all data deleted successfully',
      data: {
        applicant_id: id,
        full_name: applicant.applicant_full_name,
        email: applicant.email_address,
        decline_reason: reason,
        declined_at: new Date().toISOString(),
        deleted: true
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error declining applicant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline applicant',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};