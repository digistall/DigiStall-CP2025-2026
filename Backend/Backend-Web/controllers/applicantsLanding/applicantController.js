import { createConnection } from "../../config/database.js";

// Helper function to convert undefined/empty strings to null
const toNull = (value) => {
  if (value === undefined || value === null || value === '' || 
      (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  return value;
};

export const applicantController = {
  // Create complete stall application (applicant + application in one atomic operation)
  async createStallApplication(req, res) {
    let connection;

    try {
      connection = await createConnection();

      console.log("🔍 DEBUG: Full request body received:");
      console.log(JSON.stringify(req.body, null, 2));

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

      console.log("🔍 DEBUG: Destructured values BEFORE toNull:");
      console.log({
        applicant_full_name: { value: applicant_full_name, type: typeof applicant_full_name },
        applicant_contact_number: { value: applicant_contact_number, type: typeof applicant_contact_number },
        applicant_address: { value: applicant_address, type: typeof applicant_address },
        applicant_birthdate: { value: applicant_birthdate, type: typeof applicant_birthdate },
        applicant_civil_status: { value: applicant_civil_status, type: typeof applicant_civil_status },
        applicant_educational_attainment: { value: applicant_educational_attainment, type: typeof applicant_educational_attainment },
        nature_of_business: { value: nature_of_business, type: typeof nature_of_business },
        capitalization: { value: capitalization, type: typeof capitalization },
        source_of_capital: { value: source_of_capital, type: typeof source_of_capital },
        previous_business_experience: { value: previous_business_experience, type: typeof previous_business_experience },
        relative_stall_owner: { value: relative_stall_owner, type: typeof relative_stall_owner },
        spouse_full_name: { value: spouse_full_name, type: typeof spouse_full_name },
        spouse_birthdate: { value: spouse_birthdate, type: typeof spouse_birthdate },
        spouse_educational_attainment: { value: spouse_educational_attainment, type: typeof spouse_educational_attainment },
        spouse_contact_number: { value: spouse_contact_number, type: typeof spouse_contact_number },
        spouse_occupation: { value: spouse_occupation, type: typeof spouse_occupation },
        signature_of_applicant: { value: signature_of_applicant, type: typeof signature_of_applicant },
        house_sketch_location: { value: house_sketch_location, type: typeof house_sketch_location },
        valid_id: { value: valid_id, type: typeof valid_id },
        email_address: { value: email_address, type: typeof email_address },
        stall_id: { value: stall_id, type: typeof stall_id },
        application_date: { value: application_date, type: typeof application_date },
      });

      // Validate required fields
      if (!applicant_full_name || !applicant_contact_number || !email_address) {
        return res.status(400).json({
          success: false,
          message: "Applicant name, contact number, and email address are required",
        });
      }

      // Prepare all applicant parameters with toNull conversion
      const applicantParams = [
        // Personal Information (6 parameters)
        toNull(applicant_full_name),
        toNull(applicant_contact_number),
        toNull(applicant_address),
        toNull(applicant_birthdate),
        toNull(applicant_civil_status),
        toNull(applicant_educational_attainment),
        // Business Information (5 parameters)
        toNull(nature_of_business),
        toNull(capitalization),
        toNull(source_of_capital),
        toNull(previous_business_experience),
        toNull(relative_stall_owner),
        // Spouse Information (5 parameters)
        toNull(spouse_full_name),
        toNull(spouse_birthdate),
        toNull(spouse_educational_attainment),
        toNull(spouse_contact_number),
        toNull(spouse_occupation),
        // Other Information (4 parameters)
        toNull(signature_of_applicant),
        toNull(house_sketch_location),
        toNull(valid_id),
        toNull(email_address),
      ];

      console.log("🔍 DEBUG: Parameters AFTER toNull (checking for undefined):");
      applicantParams.forEach((param, index) => {
        const paramNames = [
          'applicant_full_name', 'applicant_contact_number', 'applicant_address',
          'applicant_birthdate', 'applicant_civil_status', 'applicant_educational_attainment',
          'nature_of_business', 'capitalization', 'source_of_capital',
          'previous_business_experience', 'relative_stall_owner',
          'spouse_full_name', 'spouse_birthdate', 'spouse_educational_attainment',
          'spouse_contact_number', 'spouse_occupation',
          'signature_of_applicant', 'house_sketch_location', 'valid_id', 'email_address'
        ];
        
        if (param === undefined) {
          console.error(`❌ Parameter ${index} (${paramNames[index]}) is UNDEFINED`);
        } else {
          console.log(`✅ Parameter ${index} (${paramNames[index]}):`, param, `(${typeof param})`);
        }
      });

      // Verify no undefined parameters
      const hasUndefined = applicantParams.some((p) => p === undefined);
      if (hasUndefined) {
        console.error("❌ CRITICAL: Undefined parameters detected in applicantParams");
        return res.status(400).json({
          success: false,
          message: "Invalid parameters: undefined values detected",
          details: applicantParams.map((p, i) => ({
            index: i,
            isUndefined: p === undefined,
            value: p
          }))
        });
      }

      console.log("✅ All applicant parameters validated - no undefined values");

      // Declare variables
      let applicantId, applicationId = null;

      // Step 1: Create applicant
      console.log("📋 Calling stored procedure createApplicantComplete...");
      console.log("📋 With parameters:", applicantParams);
      
      const [rows] = await connection.execute(
        `CALL createApplicantComplete(
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )`,
        applicantParams
      );

      // The stored procedure returns a SELECT statement, so we get the result from the first row set
      console.log("📋 Raw procedure result:", rows);
      const applicantResult = rows[0][0]; // First row set, first row
      applicantId = applicantResult.new_applicant_id;
      console.log("✅ Applicant created with ID:", applicantId);

      // Step 2: Create application if stall_id provided
      if (stall_id) {
        console.log("🏪 Creating application for stall_id:", stall_id);
        
        // Check if stall exists and is available
        const [stallCheck] = await connection.execute(
          `SELECT stall_id, is_available, status FROM stall WHERE stall_id = ?`,
          [stall_id]
        );

        if (stallCheck.length === 0) {
          throw new Error("Selected stall does not exist");
        }

        if (!stallCheck[0].is_available || stallCheck[0].status !== 'Active') {
          throw new Error("Selected stall is not available");
        }

        // Insert application record
        const [applicationResult] = await connection.execute(
          `INSERT INTO application (stall_id, applicant_id, application_date, application_status)
           VALUES (?, ?, ?, 'Pending')`,
          [
            stall_id,
            applicantId,
            application_date || new Date().toISOString().split("T")[0],
          ]
        );

        applicationId = applicationResult.insertId;
        console.log("✅ Application created with ID:", applicationId);
      } else {
        console.log("👤 General application (no specific stall)");
      }

      // Generate response
      if (stall_id) {
        res.status(201).json({
          success: true,
          message: "Stall application submitted successfully",
          data: {
            applicant_id: applicantId,
            application_id: applicationId,
            applicant_full_name,
            applicant_contact_number,
            stall_id: stall_id,
            application_status: "Pending",
          },
        });
      } else {
        res.status(201).json({
          success: true,
          message: "General application submitted successfully. A stall will be assigned upon approval.",
          data: {
            applicant_id: applicantId,
            application_id: null,
            applicant_full_name,
            applicant_contact_number,
            stall_id: null,
            application_status: "Pending",
          },
        });
      }
    } catch (error) {
      console.error("❌ Error creating stall application:", error);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Error details:", {
        message: error.message,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        errno: error.errno,
        code: error.code,
      });

      if (error.sqlState === "45000") {
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

  // Other methods remain the same...
  async createApplicant(req, res) {
    let connection;
    try {
      connection = await createConnection();
      const {
        applicant_full_name, applicant_contact_number, applicant_address,
        applicant_birthdate, applicant_civil_status, applicant_educational_attainment,
        nature_of_business, capitalization, source_of_capital,
        previous_business_experience, relative_stall_owner,
        spouse_full_name, spouse_birthdate, spouse_educational_attainment,
        spouse_contact_number, spouse_occupation,
        signature_of_applicant, house_sketch_location, valid_id, email_address,
      } = req.body;

      if (!applicant_full_name || !applicant_contact_number || !email_address) {
        return res.status(400).json({
          success: false,
          message: "Applicant name, contact number, and email address are required",
        });
      }

      const params = [
        toNull(applicant_full_name), toNull(applicant_contact_number), toNull(applicant_address),
        toNull(applicant_birthdate), toNull(applicant_civil_status), toNull(applicant_educational_attainment),
        toNull(nature_of_business), toNull(capitalization), toNull(source_of_capital),
        toNull(previous_business_experience), toNull(relative_stall_owner),
        toNull(spouse_full_name), toNull(spouse_birthdate), toNull(spouse_educational_attainment),
        toNull(spouse_contact_number), toNull(spouse_occupation),
        toNull(signature_of_applicant), toNull(house_sketch_location), toNull(valid_id), toNull(email_address),
      ];

      const [[result]] = await connection.execute(
        `CALL createApplicantComplete(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
      );

      res.status(201).json({
        success: true,
        message: "Applicant created successfully",
        data: {
          applicant_id: result.new_applicant_id,
          applicant_full_name,
          applicant_contact_number,
        },
      });
    } catch (error) {
      console.error("❌ Error in createApplicant:", error);
      if (error.sqlState === "45000") {
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
      if (connection) await connection.end();
    }
  },

  async getAllApplicants(req, res) {
    let connection;
    try {
      connection = await createConnection();
      const [[applicants]] = await connection.execute("CALL getApplicantComplete(NULL)");
      res.json({
        success: true,
        data: applicants || [],
        count: applicants ? applicants.length : 0,
      });
    } catch (error) {
      console.error("❌ Error in getAllApplicants:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch applicants",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  async getApplicantById(req, res) {
    let connection;
    try {
      const { id } = req.params;
      connection = await createConnection();
      const [[applicants]] = await connection.execute("CALL getApplicantComplete(?)", [id]);

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
            relative_stall_owner: applicant.relative_stall_owner,
          } : null,
          spouse: applicant.spouse_full_name ? {
            spouse_full_name: applicant.spouse_full_name,
            spouse_birthdate: applicant.spouse_birthdate,
            spouse_educational_attainment: applicant.spouse_educational_attainment,
            spouse_contact_number: applicant.spouse_contact_number,
            spouse_occupation: applicant.spouse_occupation,
          } : null,
          other_information: {
            email_address: applicant.email_address,
            signature_of_applicant: applicant.signature_of_applicant,
            house_sketch_location: applicant.house_sketch_location,
            valid_id: applicant.valid_id,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error in getApplicantById:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch applicant",
        error: error.message,
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  async updateApplicant(req, res) {
    let connection;
    try {
      const { id } = req.params;
      connection = await createConnection();
      const {
        applicant_full_name, applicant_contact_number, applicant_address,
        applicant_birthdate, applicant_civil_status, applicant_educational_attainment,
        nature_of_business, capitalization, source_of_capital,
        previous_business_experience, relative_stall_owner,
        spouse_full_name, spouse_birthdate, spouse_educational_attainment,
        spouse_contact_number, spouse_occupation,
        signature_of_applicant, house_sketch_location, valid_id, email_address,
      } = req.body;

      await connection.execute(
        `CALL updateApplicantComplete(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          toNull(applicant_full_name), toNull(applicant_contact_number), toNull(applicant_address),
          toNull(applicant_birthdate), toNull(applicant_civil_status), toNull(applicant_educational_attainment),
          toNull(nature_of_business), toNull(capitalization), toNull(source_of_capital),
          toNull(previous_business_experience), toNull(relative_stall_owner),
          toNull(spouse_full_name), toNull(spouse_birthdate), toNull(spouse_educational_attainment),
          toNull(spouse_contact_number), toNull(spouse_occupation),
          toNull(signature_of_applicant), toNull(house_sketch_location), toNull(valid_id), toNull(email_address),
        ]
      );

      res.json({
        success: true,
        message: "Applicant updated successfully",
      });
    } catch (error) {
      console.error("❌ Error in updateApplicant:", error);
      if (error.sqlState === "45000") {
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
      if (connection) await connection.end();
    }
  },

  async deleteApplicant(req, res) {
    let connection;
    try {
      const { id } = req.params;
      connection = await createConnection();
      await connection.execute("CALL deleteApplicant(?)", [id]);
      res.json({
        success: true,
        message: "Applicant deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error in deleteApplicant:", error);
      if (error.sqlState === "45000") {
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
      if (connection) await connection.end();
    }
  },
};