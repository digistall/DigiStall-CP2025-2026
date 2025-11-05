import { createConnection } from "../../config/database.js";

export const applicantController = {
  // Create a new applicant with all related information
  async createApplicant(req, res) {
    let connection;

    try {
      connection = await createConnection();

      const {
        // Personal Information
        applicant_full_name,
        applicant_contact_number,
        applicant_address,
        applicant_birthdate,
        applicant_civil_status,
        applicant_educational_attainment,

        // Business Information
        nature_of_business,
        capitalization,
        source_of_capital,
        previous_business_experience,
        relative_stall_owner,

        // Spouse Information (optional)
        spouse_full_name,
        spouse_birthdate,
        spouse_educational_attainment,
        spouse_contact_number,
        spouse_occupation,

        // Other Information
        signature_of_applicant,
        house_sketch_location,
        valid_id,
        email_address,
      } = req.body;

      // Validate required fields
      if (!applicant_full_name || !applicant_contact_number || !email_address) {
        return res.status(400).json({
          success: false,
          message:
            "Applicant name, contact number, and email address are required",
        });
      }

      // Call createApplicantComplete stored procedure
      const [[result]] = await connection.execute(
        `CALL createApplicantComplete(
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )`,
        [
          // Personal Information
          applicant_full_name,
          applicant_contact_number,
          applicant_address,
          applicant_birthdate,
          applicant_civil_status,
          applicant_educational_attainment,
          // Business Information
          nature_of_business || null,
          capitalization || null,
          source_of_capital || null,
          previous_business_experience || null,
          relative_stall_owner || 'No',
          // Spouse Information
          spouse_full_name || null,
          spouse_birthdate || null,
          spouse_educational_attainment || null,
          spouse_contact_number || null,
          spouse_occupation || null,
          // Other Information
          signature_of_applicant || null,
          house_sketch_location || null,
          valid_id || null,
          email_address
        ]
      );

      const applicantId = result.new_applicant_id;

      res.status(201).json({
        success: true,
        message: "Applicant created successfully",
        data: {
          applicant_id: applicantId,
          applicant_full_name,
          applicant_contact_number,
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
        message: "Failed to create applicant",
        error: error.message,
      });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  },

  // Get all applicants
  async getAllApplicants(req, res) {
    let connection;

    try {
      connection = await createConnection();

      const [[applicants]] = await connection.execute('CALL getApplicantComplete(NULL)');

      res.json({
        success: true,
        data: applicants || [],
        count: applicants ? applicants.length : 0,
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
  },

  // Get applicant by ID with all related information
  async getApplicantById(req, res) {
    let connection;

    try {
      const { id } = req.params;
      connection = await createConnection();

      const [[applicants]] = await connection.execute('CALL getApplicantComplete(?)', [id]);

      if (!applicants || applicants.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Applicant not found",
        });
      }

      const applicant = applicants[0];

      res.json({
        success: true,
        data: {
          applicant,
          business_information: applicant.nature_of_business ? {
            nature_of_business: applicant.nature_of_business,
            capitalization: applicant.capitalization,
            source_of_capital: applicant.source_of_capital,
            previous_business_experience: applicant.previous_business_experience,
            relative_stall_owner: applicant.relative_stall_owner
          } : null,
          spouse: applicant.spouse_full_name ? {
            spouse_full_name: applicant.spouse_full_name,
            spouse_birthdate: applicant.spouse_birthdate,
            spouse_educational_attainment: applicant.spouse_educational_attainment,
            spouse_contact_number: applicant.spouse_contact_number,
            spouse_occupation: applicant.spouse_occupation
          } : null,
          other_information: {
            email_address: applicant.email_address,
            signature_of_applicant: applicant.signature_of_applicant,
            house_sketch_location: applicant.house_sketch_location,
            valid_id: applicant.valid_id
          }
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
  },

  // Update applicant information
  async updateApplicant(req, res) {
    let connection;

    try {
      const { id } = req.params;
      connection = await createConnection();

      const {
        applicant_full_name,
        applicant_contact_number,
        applicant_address,
        applicant_birthdate,
        applicant_civil_status,
        applicant_educational_attainment,
        // Business Information
        nature_of_business,
        capitalization,
        source_of_capital,
        previous_business_experience,
        relative_stall_owner,
        // Spouse Information
        spouse_full_name,
        spouse_birthdate,
        spouse_educational_attainment,
        spouse_contact_number,
        spouse_occupation,
        // Other Information
        signature_of_applicant,
        house_sketch_location,
        valid_id,
        email_address,
      } = req.body;

      await connection.execute(
        `CALL updateApplicantComplete(
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )`,
        [
          id,
          applicant_full_name,
          applicant_contact_number,
          applicant_address,
          applicant_birthdate,
          applicant_civil_status,
          applicant_educational_attainment,
          nature_of_business || null,
          capitalization || null,
          source_of_capital || null,
          previous_business_experience || null,
          relative_stall_owner || null,
          spouse_full_name || null,
          spouse_birthdate || null,
          spouse_educational_attainment || null,
          spouse_contact_number || null,
          spouse_occupation || null,
          signature_of_applicant || null,
          house_sketch_location || null,
          valid_id || null,
          email_address || null
        ]
      );

      res.json({
        success: true,
        message: "Applicant updated successfully",
      });
    } catch (error) {
      if (error.sqlState === '45000') {
        return res.status(404).json({
          success: false,
          message: error.sqlMessage || "Applicant not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update applicant",
        error: error.message,
      });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  },

  // Create complete stall application (applicant + application in one atomic operation)
  async createStallApplication(req, res) {
    let connection;

    try {
      connection = await createConnection();

      const {
        // Personal Information
        applicant_full_name,
        applicant_contact_number,
        applicant_address,
        applicant_birthdate,
        applicant_civil_status,
        applicant_educational_attainment,

        // Business Information
        nature_of_business,
        capitalization,
        source_of_capital,
        previous_business_experience,
        relative_stall_owner,

        // Spouse Information (optional)
        spouse_full_name,
        spouse_birthdate,
        spouse_educational_attainment,
        spouse_contact_number,
        spouse_occupation,

        // Other Information
        signature_of_applicant,
        house_sketch_location,
        valid_id,
        email_address,

        // Application Information
        stall_id,
        application_date,
      } = req.body;

      // Validate required fields
      if (!applicant_full_name || !applicant_contact_number || !email_address) {
        return res.status(400).json({
          success: false,
          message:
            "Applicant name, contact number, and email address are required",
        });
      }

      // Step 1: Create applicant using stored procedure
      const [[applicantResult]] = await connection.execute(
        `CALL createApplicantComplete(
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )`,
        [
          // Personal Information
          applicant_full_name,
          applicant_contact_number,
          applicant_address,
          applicant_birthdate,
          applicant_civil_status,
          applicant_educational_attainment,
          // Business Information
          nature_of_business || null,
          capitalization || null,
          source_of_capital || null,
          previous_business_experience || null,
          relative_stall_owner || 'No',
          // Spouse Information
          spouse_full_name || null,
          spouse_birthdate || null,
          spouse_educational_attainment || null,
          spouse_contact_number || null,
          spouse_occupation || null,
          // Other Information
          signature_of_applicant || null,
          house_sketch_location || null,
          valid_id || null,
          email_address
        ]
      );

      const applicantId = applicantResult.new_applicant_id;

      // Step 2: Create application if stall_id provided
      let applicationId = null;
      if (stall_id) {
        const [[appResult]] = await connection.execute(
          'CALL createApplication(?, ?, ?)',
          [stall_id, applicantId, application_date || new Date().toISOString().split('T')[0]]
        );
        applicationId = appResult.new_application_id;
      }

      res.status(201).json({
        success: true,
        message: stall_id
          ? "Stall application submitted successfully"
          : "General application submitted successfully. A stall will be assigned upon approval.",
        data: {
          applicant_id: applicantId,
          application_id: applicationId,
          applicant_full_name,
          applicant_contact_number,
          stall_id: stall_id || null,
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
        message: "Failed to submit stall application",
        error: error.message,
      });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  },

  // Delete applicant (this will cascade delete related records)
  async deleteApplicant(req, res) {
    let connection;

    try {
      const { id } = req.params;
      connection = await createConnection();

      await connection.execute('CALL deleteApplicant(?)', [id]);

      res.json({
        success: true,
        message: "Applicant deleted successfully",
      });
    } catch (error) {
      if (error.sqlState === '45000') {
        return res.status(404).json({
          success: false,
          message: error.sqlMessage || "Applicant not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to delete applicant",
        error: error.message,
      });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  },
};
