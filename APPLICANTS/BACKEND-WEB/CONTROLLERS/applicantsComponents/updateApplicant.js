import { createConnection } from '../../../config/database.js'

// Update applicant
export const updateApplicant = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const updateData = req.body;

    connection = await createConnection();

    // Check if applicant exists
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

    // Extract update fields with defaults from existing data
    const first_name = updateData.first_name ?? existingApplicant.first_name;
    const last_name = updateData.last_name ?? existingApplicant.last_name;
    const email = updateData.email ?? existingApplicant.email;
    const contact_number = updateData.contact_number ?? existingApplicant.contact_number;
    const address = updateData.address ?? existingApplicant.address;
    const business_type = updateData.business_type ?? existingApplicant.business_type;
    const business_name = updateData.business_name ?? existingApplicant.business_name;
    const business_description = updateData.business_description ?? existingApplicant.business_description;
    const preferred_area = updateData.preferred_area ?? existingApplicant.preferred_area;
    const preferred_location = updateData.preferred_location ?? existingApplicant.preferred_location;
    const application_status = updateData.application_status ?? existingApplicant.application_status;

    // Update applicant using stored procedure
    const [[updatedApplicant]] = await connection.execute(
      'CALL updateApplicant(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, first_name, last_name, email, contact_number, address, 
       business_type, business_name, business_description, 
       preferred_area, preferred_location, application_status]
    );

    console.log('✅ Applicant updated successfully:', id);

    res.json({
      success: true,
      message: 'Applicant updated successfully',
      data: updatedApplicant
    });

  } catch (error) {
    console.error('❌ Update applicant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update applicant',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};