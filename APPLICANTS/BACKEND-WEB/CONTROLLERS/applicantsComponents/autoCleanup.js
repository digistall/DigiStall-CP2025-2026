import { createConnection } from '../../../config/database.js';

// Auto-cleanup rejected applicants older than 30 days
export const autoCleanupApplicants = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    // Start transaction for data integrity
    await connection.beginTransaction();

    // Find rejected applicants older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [expiredApplicants] = await connection.execute(
      `SELECT a.applicant_id, a.first_name, a.last_name, a.email, 
              app.application_status, app.declined_at, app.created_at
       FROM applicant a
       LEFT JOIN application app ON a.applicant_id = app.applicant_id
       WHERE app.application_status = 'Rejected' 
         AND app.declined_at IS NOT NULL 
         AND app.declined_at < ?`,
      [thirtyDaysAgo]
    );

    if (expiredApplicants.length === 0) {
      await connection.commit();
      return res.json({
        success: true,
        message: 'No expired applicants found for cleanup',
        data: { deletedCount: 0 }
      });
    }

    let deletedCount = 0;
    const errors = [];

    // Delete each expired applicant with proper cascading
    for (const applicant of expiredApplicants) {
      try {
        // Delete related records in proper order (foreign key constraints)
        
        // 1. Delete from application table first
        await connection.execute(
          'DELETE FROM application WHERE applicant_id = ?',
          [applicant.applicant_id]
        );

        // 2. Delete from other_information
        await connection.execute(
          'DELETE FROM other_information WHERE applicant_id = ?',
          [applicant.applicant_id]
        );

        // 3. Delete from business_information
        await connection.execute(
          'DELETE FROM business_information WHERE applicant_id = ?',
          [applicant.applicant_id]
        );

        // 4. Delete from spouse
        await connection.execute(
          'DELETE FROM spouse WHERE applicant_id = ?',
          [applicant.applicant_id]
        );

        // 5. Delete from credential
        await connection.execute(
          'DELETE FROM credential WHERE applicant_id = ?',
          [applicant.applicant_id]
        );

        // 6. Finally delete from applicant table
        await connection.execute(
          'DELETE FROM applicant WHERE applicant_id = ?',
          [applicant.applicant_id]
        );

        deletedCount++;

      } catch (deleteError) {
        console.error(`❌ Error deleting applicant ${applicant.applicant_id}:`, deleteError);
        errors.push({
          applicant_id: applicant.applicant_id,
          name: `${applicant.first_name} ${applicant.last_name}`,
          error: deleteError.message
        });
      }
    }

    // Commit the transaction
    await connection.commit();

    console.log(`✅ Auto-cleanup completed: ${deletedCount} expired applicants removed`);

    res.json({
      success: true,
      message: `Auto-cleanup completed: ${deletedCount} expired applicants removed`,
      data: {
        deletedCount,
        totalFound: expiredApplicants.length,
        errors: errors.length > 0 ? errors : null
      }
    });

  } catch (error) {
    // Rollback transaction on error
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('❌ Rollback error:', rollbackError);
      }
    }
    
    console.error('❌ Auto-cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform auto-cleanup',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};

// Manual cleanup trigger (for admin use)
export const triggerCleanup = async (req, res) => {
  // Delegate to the auto-cleanup function
  return autoCleanupApplicants(req, res);
};