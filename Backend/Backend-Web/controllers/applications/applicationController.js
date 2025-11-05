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

    // Check if stall exists and is available
    const [stallRows] = await connection.execute(
      'SELECT * FROM stall WHERE stall_id = ? AND is_available = 1 AND status = "Active"',
      [stall_id]
    );

    if (stallRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Stall is not available or does not exist",
      });
    }

    // Check if applicant exists
    const [applicantRows] = await connection.execute(
      "SELECT * FROM applicant WHERE applicant_id = ?",
      [applicant_id]
    );

    if (applicantRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Applicant does not exist",
      });
    }

    // Check if applicant already has a pending/approved application for this stall
    const [existingApplication] = await connection.execute(
      `SELECT * FROM application 
       WHERE applicant_id = ? AND stall_id = ? 
       AND application_status IN ('Pending', 'Under Review', 'Approved')`,
      [applicant_id, stall_id]
    );

    if (existingApplication.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Applicant already has an active application for this stall",
      });
    }

    // Create the application
    const [result] = await connection.execute(
      `INSERT INTO application (stall_id, applicant_id, application_date, application_status)
       VALUES (?, ?, ?, 'Pending')`,
      [
        stall_id,
        applicant_id,
        application_date || new Date().toISOString().split("T")[0],
      ]
    );

    // Get applicant and stall details for email
    const [applicantData] = await connection.execute(
      "SELECT applicant_full_name, email_address FROM applicant WHERE applicant_id = ?",
      [applicant_id]
    );

    const [stallData] = await connection.execute(
      "SELECT stall_number, location FROM stall WHERE stall_id = ?",
      [stall_id]
    );

    // Send confirmation email
    try {
      if (applicantData.length > 0 && stallData.length > 0) {
        await emailService.sendApplicationConfirmationEmail({
          applicant_email: applicantData[0].email_address,
          applicant_name: applicantData[0].applicant_full_name,
          stall_id: stallData[0].stall_number,
          stall_location: stallData[0].location,
          application_id: result.insertId,
          application_date: application_date || new Date().toISOString().split("T")[0]
        });
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the application creation if email fails
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: {
        application_id: result.insertId,
        stall_id,
        applicant_id,
        application_status: "Pending",
      },
    });
  } catch (error) {
    console.error("Error creating application:", error);
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

    const [applications] = await connection.execute(`
      SELECT 
        a.*,
        ap.first_name,
        ap.last_name,
        ap.email,
        ap.phone_number,
        s.stall_name,
        s.area,
        s.monthly_rental_fee,
        b.branch_name
      FROM application a
      LEFT JOIN applicant ap ON a.applicant_id = ap.applicant_id
      LEFT JOIN stall s ON a.stall_id = s.stall_id
      LEFT JOIN branch b ON s.branch_id = b.branch_id
      ORDER BY a.application_date DESC
    `);

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
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

    const [applications] = await connection.execute(
      `SELECT 
        a.*,
        ap.first_name,
        ap.last_name,
        ap.email,
        ap.phone_number,
        ap.address,
        ap.emergency_contact_name,
        ap.emergency_contact_number,
        s.stall_name,
        s.area,
        s.monthly_rental_fee,
        s.stall_size,
        s.location_description,
        s.utilities_included,
        b.branch_name,
        b.location as branch_location
      FROM application a
      LEFT JOIN applicant ap ON a.applicant_id = ap.applicant_id
      LEFT JOIN stall s ON a.stall_id = s.stall_id
      LEFT JOIN branch b ON s.branch_id = b.branch_id
      WHERE a.application_id = ?`,
      [id]
    );

    if (applications.length === 0) {
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
    console.error("Error fetching application:", error);
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
    await connection.beginTransaction();

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

    // Check if application exists and get full details
    const [existingApp] = await connection.execute(
      `SELECT a.*, ap.applicant_full_name, ap.email_address, s.stall_number, s.location
       FROM application a
       JOIN applicant ap ON a.applicant_id = ap.applicant_id
       JOIN stall s ON a.stall_id = s.stall_id
       WHERE a.application_id = ?`,
      [id]
    );

    if (existingApp.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const application = existingApp[0];

    // Update application status
    await connection.execute(
      `UPDATE application 
       SET application_status = ?, remarks = ?, status_updated_date = NOW()
       WHERE application_id = ?`,
      [application_status, remarks || null, id]
    );

    // If approved, make the stall unavailable
    if (application_status === "Approved") {
      await connection.execute(
        "UPDATE stall SET is_available = 0 WHERE stall_id = ?",
        [application.stall_id]
      );
    }

    // If rejected/cancelled, make sure stall is available (in case it was previously approved)
    if (application_status === "Rejected" || application_status === "Cancelled") {
      await connection.execute(
        "UPDATE stall SET is_available = 1 WHERE stall_id = ?",
        [application.stall_id]
      );
    }

    await connection.commit();

    // Send email notification
    try {
      await emailService.sendApplicationStatusEmail({
        applicant_email: application.email_address,
        applicant_name: application.applicant_full_name,
        application_status,
        stall_id: application.stall_number,
        stall_location: application.location,
        application_id: id,
        rejection_reason
      });
    } catch (emailError) {
      console.error("Error sending status email:", emailError);
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
    if (connection) {
      await connection.rollback();
    }
    console.error("Error updating application status:", error);
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

    // Check if application exists
    const [existingApp] = await connection.execute(
      "SELECT * FROM application WHERE application_id = ?",
      [id]
    );

    if (existingApp.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Delete the application
    await connection.execute(
      "DELETE FROM application WHERE application_id = ?",
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting application:", error);
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

    // Get statistics for all statuses
    const [statistics] = await connection.execute(`
      SELECT 
        application_status,
        COUNT(*) as count
      FROM application
      GROUP BY application_status
    `);

    // Get recent applications
    const [recentApplications] = await connection.execute(`
      SELECT 
        a.*,
        ap.first_name,
        ap.last_name,
        ap.email,
        s.stall_name,
        s.area,
        b.branch_name
      FROM application a
      LEFT JOIN applicant ap ON a.applicant_id = ap.applicant_id
      LEFT JOIN stall s ON a.stall_id = s.stall_id
      LEFT JOIN branch b ON s.branch_id = b.branch_id
      ORDER BY a.application_date DESC
      LIMIT 10
    `);

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

    const [applicants] = await connection.execute(`
      SELECT 
        applicant_id,
        first_name,
        last_name,
        email,
        phone_number,
        address,
        date_of_birth,
        gender,
        occupation,
        income_range,
        emergency_contact_name,
        emergency_contact_number,
        id_type,
        id_number,
        created_at
      FROM applicant
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: applicants,
    });
  } catch (error) {
    console.error("Error fetching applicants:", error);
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

    const [applicants] = await connection.execute(
      `SELECT 
        applicant_id,
        first_name,
        last_name,
        email,
        phone_number,
        address,
        date_of_birth,
        gender,
        occupation,
        income_range,
        emergency_contact_name,
        emergency_contact_number,
        id_type,
        id_number,
        created_at
      FROM applicant
      WHERE applicant_id = ?`,
      [applicant_id]
    );

    if (applicants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found",
      });
    }

    // Get applications for this applicant
    const [applications] = await connection.execute(
      `SELECT 
        a.*,
        s.stall_name,
        s.area,
        b.branch_name
      FROM application a
      LEFT JOIN stall s ON a.stall_id = s.stall_id
      LEFT JOIN branch b ON s.branch_id = b.branch_id
      WHERE a.applicant_id = ?
      ORDER BY a.application_date DESC`,
      [applicant_id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...applicants[0],
        applications: applications,
      },
    });
  } catch (error) {
    console.error("Error fetching applicant:", error);
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
