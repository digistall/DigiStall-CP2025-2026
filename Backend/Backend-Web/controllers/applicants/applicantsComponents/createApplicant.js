import { createConnection } from '../../../config/database.js'

// Create new applicant
export const createApplicant = async (req, res) => {
  let connection;
  try {
    const {
      first_name,
      last_name,
      email,
      contact_number,
      address,
      business_type,
      business_name,
      business_description,
      preferred_area,
      preferred_location,
      application_status = 'Pending'
    } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !contact_number) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and contact number are required'
      });
    }

    connection = await createConnection();

    // Check if email already exists
    const [[existingApplicant]] = await connection.execute(
      'CALL getApplicantByEmail(?)',
      [email]
    );

    if (existingApplicant) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Insert new applicant using stored procedure
    const [[createdApplicant]] = await connection.execute(
      'CALL createApplicant(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        first_name, last_name, email, contact_number, address,
        business_type, business_name, business_description,
        preferred_area, preferred_location, application_status
      ]
    );

    console.log('✅ Applicant created successfully:', email);

    res.status(201).json({
      success: true,
      message: 'Applicant created successfully',
      data: createdApplicant
    });

  } catch (error) {
    console.error('❌ Create applicant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create applicant',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};