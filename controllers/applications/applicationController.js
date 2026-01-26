// ===== APPLICATION CONTROLLER =====
// Handles stall application management operations

import { createConnection } from "../../config/database.js";
import emailService from "../../services/emailService.js";

// Create a new stall application
export const createApplication = async (req, res) => {
  let connection;

  try {
    connection = await createConnection();

    const { stall_id, applicant_id, application_date } = req.body;

    // Validate required fields
    if (!stall_id || !applicant_id) {
      return res.status(400).json({
        success: false,
        message: "Stall ID and Applicant ID are required",
      });
    }

    const [[result]] = await connection.execute(
      'CALL createApplication(?, ?, ?)',
      [stall_id, applicant_id, application_date || new Date().toISOString().split("T")[0]]
    );

    const applicationId = result.new_application_id;

    // Get applicant and stall details for email
    const [[applicantData]] = await connection.execute(
      'CALL getApplicantComplete(?)',
      [applicant_id]
    );

    const [[stallData]] = await connection.execute(
      'CALL getStallsFiltered(?, NULL, NULL, NULL, NULL)',
      [stall_id]
    );

    // Send confirmation email
    try {
      if (applicantData && applicantData.length > 0 && stallData && stallData.length > 0) {
        const applicant = applicantData[0];
        const stall = stallData[0];
        
        await emailService.sendApplicationConfirmationEmail({
          applicant_email: applicant.email_address,
          applicant_name: applicant.applicant_full_name,
          stall_id: stall.stall_code,
          stall_location: stall.location_description,
          application_id: applicationId,
          application_date: application_date || new Date().toISOString().split("T")[0]
        });
      }
    } catch (emailError) {
      // Don't fail the application creation if email fails
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: {
        application_id: applicationId,
        stall_id,
        applicant_id,
        application_status: "Pending",
      },
    });
  } catch (error) {
    if (error.sqlState === '45000') {
      return res.status(400).json({
        success: false,
        message: error.sqlMessage || error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create application",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Get all applications with applicant and stall details
export const getAllApplications = async (req, res) => {
  let connection;

  try {
    connection = await createConnection();

    const [[applications]] = await connection.execute(
      'CALL getApplicationsByApplicant(NULL)'
    );

    res.status(200).json({
      success: true,
      data: applications || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Get application by ID with full details
export const getApplicationById = async (req, res) => {
  let connection;

  try {
    connection = await createConnection();
    const { id } = req.params;

    const [[applications]] = await connection.execute(
      'CALL getApplicationsByApplicant(?)',
      [id]
    );

    if (!applications || applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).json({
      success: true,
      data: applications[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  let connection;

  try {
    connection = await createConnection();

    const { id } = req.params;
    const { application_status, remarks, rejection_reason } = req.body;

    // Validate status
    const validStatuses = ["Pending", "Under Review", "Approved", "Rejected", "Cancelled"];
    if (!validStatuses.includes(application_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application status",
      });
    }

    // Get application details before update
    const [[applications]] = await connection.execute(
      'CALL getApplicationsByApplicant(?)',
      [id]
    );

    if (!applications || applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const application = applications[0];

    // Update application status using stored procedure
    await connection.execute(
      'CALL updateApplicationStatus(?, ?)',
      [id, application_status]
    );

    // Send email notification
    try {
      await emailService.sendApplicationStatusEmail({
        applicant_email: application.email_address,
        applicant_name: application.applicant_full_name,
        application_status,
        stall_id: application.stall_code,
        stall_location: application.location_description,
        application_id: id,
        rejection_reason
      });
    } catch (emailError) {
      // Don't fail the status update if email fails
    }

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: {
        application_id: id,
        application_status,
        email_sent: true
      }
    });
  } catch (error) {
    if (error.sqlState === '45000') {
      return res.status(404).json({
        success: false,
        message: error.sqlMessage || error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update application status",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Delete application
export const deleteApplication = async (req, res) => {
  let connection;

  try {
    connection = await createConnection();
    const { id } = req.params;

    await connection.execute('CALL deleteApplication(?)', [id]);

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    if (error.sqlState === '45000') {
      return res.status(404).json({
        success: false,
        message: error.sqlMessage || "Application not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete application",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Get applications by status (statistics)
export const getApplicationsByStatus = async (req, res) => {
  let connection;

  try {
    connection = await createConnection();

    // Get all applications (statistics will be calculated from result)
    const [applications] = await connection.execute('CALL getAllApplications()');
    
    // Calculate statistics
    const statistics = {};
    applications[0].forEach(app => {
      const status = app.application_status || 'Pending';
      statistics[status] = (statistics[status] || 0) + 1;
    });
    
    // Get recent applications (first 10)
    const recentApplications = applications[0].slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        statistics,
        recentApplications
      },
    });
  } catch (error) {
    console.error("Error fetching application statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application statistics",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Get all applicants
export const getAllApplicants = async (req, res) => {
  let connection;

  try {
    connection = await createConnection();

    const [[applicants]] = await connection.execute('CALL getApplicantComplete(NULL)');

    res.status(200).json({
      success: true,
      data: applicants || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch applicants",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Get applicant by ID with applications
export const getApplicantById = async (req, res) => {
  let connection;

  try {
    connection = await createConnection();
    const { applicant_id } = req.params;

    const [[applicants]] = await connection.execute(
      'CALL getApplicantComplete(?)',
      [applicant_id]
    );

    if (!applicants || applicants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found",
      });
    }

    // Get applications for this applicant
    const [[applications]] = await connection.execute(
      'CALL getApplicationsByApplicant(?)',
      [applicant_id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...applicants[0],
        applications: applications || [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch applicant",
      error: error.message,
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
