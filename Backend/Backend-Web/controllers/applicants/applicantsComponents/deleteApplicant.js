import { createConnection } from '../../../config/database.js'

// Delete applicant with proper cascading delete
export const deleteApplicant = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await createConnection();
    
    // Start transaction for data integrity
    await connection.beginTransaction();

    // Check if applicant exists
    const [existingApplicant] = await connection.execute(
      'SELECT applicant_id, first_name, last_name, email FROM applicant WHERE applicant_id = ?',
      [id]
    );

    if (existingApplicant.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    // Delete related records in proper order (foreign key constraints)
    
    // 1. Delete from application table first
    await connection.execute(
      'DELETE FROM application WHERE applicant_id = ?',
      [id]
    );

    // 2. Delete from other_information
    await connection.execute(
      'DELETE FROM other_information WHERE applicant_id = ?',
      [id]
    );

    // 3. Delete from business_information
    await connection.execute(
      'DELETE FROM business_information WHERE applicant_id = ?',
      [id]
    );

    // 4. Delete from spouse
    await connection.execute(
      'DELETE FROM spouse WHERE applicant_id = ?',
      [id]
    );

    // 5. Delete from credential
    await connection.execute(
      'DELETE FROM credential WHERE applicant_id = ?',
      [id]
    );

    // 6. Finally delete from applicant table
    await connection.execute('DELETE FROM applicant WHERE applicant_id = ?', [id]);

    // Commit the transaction
    await connection.commit();

    console.log('✅ Applicant deleted successfully');

    res.json({
      success: true,
      message: 'Applicant deleted successfully',
      data: {
        id: id,
        name: `${existingApplicant[0].first_name} ${existingApplicant[0].last_name}`,
        email: existingApplicant[0].email
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