import { createConnection } from '../../../config/database.js'

// Get all participants (approved applicants who are currently using stalls)
export const getAllParticipants = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();

    // Use stored procedure instead of raw SQL
    const [result] = await connection.execute('CALL sp_getAllParticipants()');
    const participants = result[0] || [];

    // Format the response data
    const formattedParticipants = participants.map(participant => {
      // Split full name into first and last name for frontend compatibility
      const nameParts = participant.applicant_full_name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        participantInfo: {
          id: participant.participant_id,
          firstName: firstName,
          lastName: lastName,
          fullName: participant.applicant_full_name,
          contactNumber: participant.contact_number,
          address: participant.address,
          birthdate: participant.applicant_birthdate,
          civilStatus: participant.applicant_civil_status,
          educationalAttainment: participant.applicant_educational_attainment,
          status: participant.application_status,
          appliedDate: participant.application_date
        },
        businessInfo: {
          type: 'N/A',
          name: 'N/A'
        },
        stallInfo: {
          stallId: participant.stall_id,
          stallNumber: participant.stall_no,
          status: participant.stall_status,
          rentalPrice: participant.rental_price
        },
        branchInfo: {
          branchName: participant.branch_name,
          area: participant.area,
          location: participant.branch_location,
          floor: participant.floor_name,
          section: participant.section_name
        },
        applicationInfo: {
          applicationId: participant.application_id,
          applicationDate: participant.application_date,
          currentStatus: participant.application_status
        },
        mobileAccess: {
          hasCredentials: false, // Default to false since we removed mobile_credentials table join
          username: null,
          credentialCreated: null
        }
      };
    });

    console.log(`✅ Found ${formattedParticipants.length} active participants`);

    res.json({
      success: true,
      message: 'Active participants retrieved successfully',
      data: formattedParticipants,
      count: formattedParticipants.length,
      summary: {
        totalParticipants: formattedParticipants.length,
        withMobileAccess: 0, // Default since we removed mobile_credentials
        withoutMobileAccess: formattedParticipants.length
      }
    });

  } catch (error) {
    console.error('❌ Get all participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve participants',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
};