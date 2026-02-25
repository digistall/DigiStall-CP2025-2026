import { createConnection } from '../../../SHARED/config/database.js';
import { saveApplicantDocumentFromBase64, USE_BLOB_STORAGE, saveApplicantDocumentToBlob } from '../../../SHARED/config/multerApplicantDocuments.js';
import { encryptData, decryptData } from '../../../SHARED/services/encryptionService.js';

// Helper function to convert undefined/empty strings to null
const toNull = (value) => {
  if (value === undefined || value === null || value === '' || 
      (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  return value;
};

// Helper function to encrypt sensitive data if not null
const encryptIfNotNull = (value) => {
  if (value === undefined || value === null || value === '' || 
      (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  try {
    return encryptData(value);
  } catch (error) {
    console.error('âš ï¸ Encryption failed, storing as plain text:', error.message);
    return value;
  }
};

// Helper function to decrypt data safely
const decryptSafe = (value) => {
  if (value === undefined || value === null || value === '') {
    return value;
  }
  try {
    // Check if it looks like encrypted data (contains colons for iv:authTag:data format)
    if (typeof value === 'string' && value.includes(':')) {
      return decryptData(value);
    }
    return value; // Return as-is if not encrypted
  } catch (error) {
    console.error('âš ï¸ Decryption failed, returning as-is:', error.message);
    return value;
  }
};

export const applicantController = {
  // Create complete stall application (applicant + application in one atomic operation)
  async createStallApplication(req, res) {
    let connection;

    try {
      console.log("ðŸ” Creating database connection...");
      connection = await createConnection();
      console.log("âœ… Database connection established");

      console.log("ðŸ” DEBUG: Full request body received:");
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

        // Document base64 data (for saving to htdocs)
        signature_data,
        house_location_data,
        valid_id_data,
        branch_id,

        // Application Information
        stall_id,
        application_date,
      } = req.body;

      console.log("ðŸ” DEBUG: Destructured values BEFORE toNull:");
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

      console.log("ðŸ” Encrypting sensitive data before storage...");
      
      // Prepare all applicant parameters with toNull conversion AND encryption for sensitive PII fields
      const applicantParams = [
        // Personal Information (6 parameters) - ENCRYPT sensitive PII fields
        encryptIfNotNull(applicant_full_name),            // Encrypted: full name
        encryptIfNotNull(applicant_contact_number),       // Encrypted: phone
        encryptIfNotNull(applicant_address),              // Encrypted: address
        toNull(applicant_birthdate),                       // Not encrypted: date format
        toNull(applicant_civil_status),                    // Not encrypted: ENUM value
        toNull(applicant_educational_attainment),          // Not encrypted: category
        // Business Information (5 parameters) - Not sensitive
        toNull(nature_of_business),
        toNull(capitalization),
        toNull(source_of_capital),
        toNull(previous_business_experience),
        toNull(relative_stall_owner),
        // Spouse Information (5 parameters) - ENCRYPT sensitive PII fields
        encryptIfNotNull(spouse_full_name),               // Encrypted: full name
        toNull(spouse_birthdate),                          // Not encrypted: date format
        toNull(spouse_educational_attainment),             // Not encrypted: category
        encryptIfNotNull(spouse_contact_number),          // Encrypted: phone
        toNull(spouse_occupation),                         // Not encrypted: category
        // Other Information (4 parameters)
        toNull(signature_of_applicant),                    // Not encrypted: file path
        toNull(house_sketch_location),                     // Not encrypted: file path
        toNull(valid_id),                                  // Not encrypted: file path
        encryptIfNotNull(email_address),                  // Encrypted: email
      ];

      console.log("âœ… Sensitive data encrypted successfully");

      console.log("ðŸ” DEBUG: Parameters AFTER toNull (checking for undefined):");
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
          console.error(`âŒ Parameter ${index} (${paramNames[index]}) is UNDEFINED`);
        } else {
          console.log(`âœ… Parameter ${index} (${paramNames[index]}):`, param, `(${typeof param})`);
        }
      });

      // Verify no undefined parameters
      const hasUndefined = applicantParams.some((p) => p === undefined);
      if (hasUndefined) {
        console.error("âŒ CRITICAL: Undefined parameters detected in applicantParams");
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

      console.log("âœ… All applicant parameters validated - no undefined values");

      // Declare variables
      let applicantId, applicationId = null;

      // Step 1: Create applicant
      console.log("ðŸ“‹ Calling stored procedure createApplicantComplete...");
      console.log("ðŸ“‹ With parameters:", applicantParams);
      
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
      console.log("ðŸ“‹ Raw procedure result:", rows);
      const applicantResult = rows[0][0]; // First row set, first row
      applicantId = applicantResult.new_applicant_id;
      console.log("âœ… Applicant created with ID:", applicantId);

      // Step 2: Create application if stall_id provided
      if (stall_id) {
        console.log("ðŸª Creating application for stall_id:", stall_id);
        
        // Check if stall exists and is available
        const [stallCheck] = await connection.execute(
          `SELECT stall_id, is_available, status FROM stall WHERE stall_id = ?`,
          [stall_id]
        );

        console.log("ðŸª Stall check result:", stallCheck);

        if (stallCheck.length === 0) {
          throw new Error("Selected stall does not exist");
        }

        // Check availability - handle both numeric (1/0) and boolean values
        const stall = stallCheck[0];
        const isAvailable = stall.is_available === 1 || stall.is_available === true || stall.is_available === '1';
        const hasValidStatus = stall.status === 'Available' || stall.status === 'Active';
        
        console.log("ðŸª Stall availability check:", { 
          raw_is_available: stall.is_available, 
          isAvailable, 
          status: stall.status, 
          hasValidStatus 
        });

        if (!isAvailable || !hasValidStatus) {
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
        console.log("âœ… Application created with ID:", applicationId);
      } else {
        console.log("ðŸ‘¤ General application (no specific stall)");
      }

      // Step 3: Save document files if base64 data provided
      const savedDocuments = [];
      const effectiveBranchId = branch_id || '1'; // Default to branch 1 if not specified
      
      // Get business_owner_id from stall if available
      let businessOwnerId = 1; // Default
      if (stall_id) {
        const [stallOwner] = await connection.execute(
          `SELECT b.business_owner_id FROM stall s 
           JOIN section sec ON s.section_id = sec.section_id
           JOIN floor f ON sec.floor_id = f.floor_id
           JOIN branch b ON f.branch_id = b.branch_id
           WHERE s.stall_id = ?`,
          [stall_id]
        );
        if (stallOwner.length > 0) {
          businessOwnerId = stallOwner[0].business_owner_id;
        }
      }

      console.log(`ðŸ“„ Using BLOB storage: ${USE_BLOB_STORAGE}`);

      if (signature_data) {
        try {
          let saved;
          if (USE_BLOB_STORAGE) {
            // Save to database as BLOB
            saved = await saveApplicantDocumentToBlob(
              connection,
              applicantId,
              businessOwnerId,
              effectiveBranchId,
              'signature',
              signature_data,
              signature_of_applicant
            );
          } else {
            // Save to file system (legacy)
            saved = saveApplicantDocumentFromBase64(
              effectiveBranchId, 
              applicantId, 
              'signature', 
              signature_data, 
              signature_of_applicant
            );
          }
          savedDocuments.push({ type: 'signature', ...saved });
          console.log("âœ… Saved signature document:", saved.url);
        } catch (docError) {
          console.error("âš ï¸ Failed to save signature:", docError.message);
        }
      }

      if (house_location_data) {
        try {
          let saved;
          if (USE_BLOB_STORAGE) {
            saved = await saveApplicantDocumentToBlob(
              connection,
              applicantId,
              businessOwnerId,
              effectiveBranchId,
              'house_location',
              house_location_data,
              house_sketch_location
            );
          } else {
            saved = saveApplicantDocumentFromBase64(
              effectiveBranchId, 
              applicantId, 
              'house_location', 
              house_location_data, 
              house_sketch_location
            );
          }
          savedDocuments.push({ type: 'house_location', ...saved });
          console.log("âœ… Saved house location document:", saved.url);
        } catch (docError) {
          console.error("âš ï¸ Failed to save house location:", docError.message);
        }
      }

      if (valid_id_data) {
        try {
          let saved;
          if (USE_BLOB_STORAGE) {
            saved = await saveApplicantDocumentToBlob(
              connection,
              applicantId,
              businessOwnerId,
              effectiveBranchId,
              'valid_id',
              valid_id_data,
              valid_id
            );
          } else {
            saved = saveApplicantDocumentFromBase64(
              effectiveBranchId, 
              applicantId, 
              'valid_id', 
              valid_id_data, 
              valid_id
            );
          }
          savedDocuments.push({ type: 'valid_id', ...saved });
          console.log("âœ… Saved valid ID document:", saved.url);
        } catch (docError) {
          console.error("âš ï¸ Failed to save valid ID:", docError.message);
        }
      }

      console.log(`ðŸ“„ Saved ${savedDocuments.length} document(s) for applicant ${applicantId} (storage: ${USE_BLOB_STORAGE ? 'BLOB' : 'file'})`);

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
            documents: savedDocuments,
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
            documents: savedDocuments,
            application_status: "Pending",
          },
        });
      }
    } catch (error) {
      console.error("âŒ Error creating stall application:", error);
      console.error("âŒ Error stack:", error.stack);
      console.error("âŒ Error details:", {
        message: error.message,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        errno: error.errno,
        code: error.code,
      });

      // Handle specific database errors
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: "Database connection refused. Please check database server.",
          error: "Database unavailable"
        });
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        return res.status(503).json({
          success: false,
          message: "Database connection timeout. Please try again.",
          error: "Connection timeout"
        });
      }

      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(503).json({
          success: false,
          message: "Database authentication failed.",
          error: "Access denied"
        });
      }

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
        try {
          await connection.end();
          console.log("ðŸ”’ Database connection closed");
        } catch (closeError) {
          console.error("âš ï¸ Error closing connection:", closeError.message);
        }
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

      console.log("ðŸ” Encrypting sensitive data before storage...");

      // Encrypt sensitive PII fields before storage
      const params = [
        encryptIfNotNull(applicant_full_name),            // Encrypted: full name
        encryptIfNotNull(applicant_contact_number),       // Encrypted: phone
        encryptIfNotNull(applicant_address),              // Encrypted: address
        toNull(applicant_birthdate),                       // Not encrypted: date format
        toNull(applicant_civil_status),                    // Not encrypted: ENUM value
        toNull(applicant_educational_attainment),          // Not encrypted: category
        toNull(nature_of_business),
        toNull(capitalization),
        toNull(source_of_capital),
        toNull(previous_business_experience),
        toNull(relative_stall_owner),
        encryptIfNotNull(spouse_full_name),               // Encrypted: full name
        toNull(spouse_birthdate),                          // Not encrypted: date format
        toNull(spouse_educational_attainment),             // Not encrypted: category
        encryptIfNotNull(spouse_contact_number),          // Encrypted: phone
        toNull(spouse_occupation),                         // Not encrypted: category
        toNull(signature_of_applicant),
        toNull(house_sketch_location),
        toNull(valid_id),
        encryptIfNotNull(email_address),                  // Encrypted: email
      ];

      console.log("âœ… Sensitive data encrypted successfully");

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
      console.error("âŒ Error in createApplicant:", error);
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
      
      // Decrypt sensitive fields for each applicant
      const decryptedApplicants = (applicants || []).map(applicant => ({
        ...applicant,
        applicant_full_name: decryptSafe(applicant.applicant_full_name),
        applicant_contact_number: decryptSafe(applicant.applicant_contact_number),
        applicant_address: decryptSafe(applicant.applicant_address),
        email_address: decryptSafe(applicant.email_address),
        spouse_full_name: decryptSafe(applicant.spouse_full_name),
        spouse_contact_number: decryptSafe(applicant.spouse_contact_number),
      }));
      
      res.json({
        success: true,
        data: decryptedApplicants,
        count: decryptedApplicants.length,
      });
    } catch (error) {
      console.error("âŒ Error in getAllApplicants:", error);
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
      
      // Decrypt sensitive fields
      const decryptedFullName = decryptSafe(applicant.applicant_full_name);
      const decryptedContact = decryptSafe(applicant.applicant_contact_number);
      const decryptedAddress = decryptSafe(applicant.applicant_address);
      const decryptedEmail = decryptSafe(applicant.email_address);
      const decryptedSpouseName = decryptSafe(applicant.spouse_full_name);
      const decryptedSpouseContact = decryptSafe(applicant.spouse_contact_number);
      
      res.json({
        success: true,
        data: {
          applicant: {
            ...applicant,
            applicant_full_name: decryptedFullName,
            applicant_contact_number: decryptedContact,
            applicant_address: decryptedAddress,
          },
          business_information: applicant.nature_of_business ? {
            nature_of_business: applicant.nature_of_business,
            capitalization: applicant.capitalization,
            source_of_capital: applicant.source_of_capital,
            previous_business_experience: applicant.previous_business_experience,
            relative_stall_owner: applicant.relative_stall_owner,
          } : null,
          spouse: decryptedSpouseName ? {
            spouse_full_name: decryptedSpouseName,
            spouse_birthdate: applicant.spouse_birthdate,
            spouse_educational_attainment: applicant.spouse_educational_attainment,
            spouse_contact_number: decryptedSpouseContact,
            spouse_occupation: applicant.spouse_occupation,
          } : null,
          other_information: {
            email_address: decryptedEmail,
            signature_of_applicant: applicant.signature_of_applicant,
            house_sketch_location: applicant.house_sketch_location,
            valid_id: applicant.valid_id,
          },
        },
      });
    } catch (error) {
      console.error("âŒ Error in getApplicantById:", error);
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

      console.log("ðŸ” Encrypting sensitive data before update...");

      await connection.execute(
        `CALL updateApplicantComplete(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          encryptIfNotNull(applicant_full_name),            // Encrypted: full name
          encryptIfNotNull(applicant_contact_number),       // Encrypted: phone
          encryptIfNotNull(applicant_address),              // Encrypted: address
          toNull(applicant_birthdate),                       // Not encrypted: date format
          toNull(applicant_civil_status),                    // Not encrypted: ENUM value
          toNull(applicant_educational_attainment),          // Not encrypted: category
          toNull(nature_of_business),
          toNull(capitalization),
          toNull(source_of_capital),
          toNull(previous_business_experience),
          toNull(relative_stall_owner),
          encryptIfNotNull(spouse_full_name),               // Encrypted: full name
          toNull(spouse_birthdate),                          // Not encrypted: date format
          toNull(spouse_educational_attainment),             // Not encrypted: category
          encryptIfNotNull(spouse_contact_number),          // Encrypted: phone
          toNull(spouse_occupation),                         // Not encrypted: category
          toNull(signature_of_applicant),
          toNull(house_sketch_location),
          toNull(valid_id),
          encryptIfNotNull(email_address),                  // Encrypted: email
        ]
      );

      console.log("âœ… Applicant updated with encrypted data");

      res.json({
        success: true,
        message: "Applicant updated successfully",
      });
    } catch (error) {
      console.error("âŒ Error in updateApplicant:", error);
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
      console.error("âŒ Error in deleteApplicant:", error);
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