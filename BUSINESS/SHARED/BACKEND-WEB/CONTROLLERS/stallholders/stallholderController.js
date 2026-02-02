import { createConnection } from '../../config/database.js';
import { getBranchFilter } from '../../middleware/rolePermissions.js';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcrypt';
import emailService from '../../services/emailService.js';
import { decryptData, decryptStallholders, encryptData } from '../../services/encryptionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to encrypt if value is not null
const encryptIfNotNull = (value) => {
    if (value === undefined || value === null || value === '' || 
        (typeof value === 'string' && value.trim() === '')) {
        return null;
    }
    try {
        return encryptData(value);
    } catch (error) {
        console.error('⚠️ Encryption failed:', error.message);
        return value;
    }
};

/**
 * Stallholder Controller
 * Handles CRUD operations for stallholder management
 */
const StallholderController = {
  
  /**
   * Get all stallholders for a branch with detailed information
   * Supports multi-branch filtering for business owners
   */
  getAllStallholders: async (req, res) => {
    let connection;
    try {
      const { branchId } = req.query;
      const userType = req.user?.userType;
      
      console.log('📋 Fetching stallholders:', { userType, queryBranchId: branchId });
      
      connection = await createConnection();
      
      // Get branch filter based on user role
      const branchFilter = await getBranchFilter(req, connection);
      
      console.log('🔍 Stallholder branchFilter:', branchFilter);
      
      let rows;
      
      if (branchFilter === null) {
        // System administrator - see all stallholders using direct query
        console.log('✅ System admin - fetching all stallholders');
        const [result] = await connection.execute(`
          SELECT 
            s.stallholder_id,
            s.full_name,
            s.full_name as stallholder_name,
            bi.nature_of_business as business_name,
            s.email,
            s.contact_number,
            s.address,
            s.stall_id,
            s.branch_id,
            s.payment_status,
            s.status,
            s.status as contract_status,
            s.move_in_date,
            s.move_in_date as contract_start_date,
            DATE_ADD(s.move_in_date, INTERVAL 1 YEAR) as contract_end_date,
            st.rental_price as monthly_rent,
            st.rental_price as lease_amount,
            (SELECT MAX(p.payment_date) FROM payments p WHERE p.stallholder_id = s.stallholder_id AND p.payment_status = 'completed') as last_payment_date,
            CASE 
              WHEN EXISTS (SELECT 1 FROM violation_report vr WHERE vr.stallholder_id = s.stallholder_id AND vr.status = 'Open') 
              THEN 'Non-Compliant' 
              ELSE 'Compliant' 
            END as compliance_status,
            (SELECT MAX(vr.report_date) FROM violation_report vr WHERE vr.stallholder_id = s.stallholder_id) as last_violation_date,
            s.created_at,
            s.updated_at,
            st.stall_number as stall_no,
            st.stall_number,
            st.stall_location,
            b.branch_name
          FROM stallholder s
          LEFT JOIN stall st ON s.stall_id = st.stall_id
          LEFT JOIN branch b ON s.branch_id = b.branch_id
          LEFT JOIN business_information bi ON s.mobile_user_id = bi.applicant_id
          ORDER BY s.stallholder_id
        `);
        rows = result || [];
      } else if (branchFilter.length === 0) {
        // No branches accessible
        console.log('⚠️ No branches accessible');
        return res.json({
          success: true,
          data: [],
          total: 0
        });
      } else {
        // Filter by accessible branches
        console.log(`🔍 Fetching stallholders for branches: ${branchFilter.join(', ')}`);
        const placeholders = branchFilter.map(() => '?').join(',');
        // Use correct column name: stall_number (stall_no doesn't exist)
        const [result] = await connection.execute(
          `SELECT s.*, 
                  s.full_name as stallholder_name,
                  bi.nature_of_business as business_name,
                  s.status as contract_status,
                  s.move_in_date as contract_start_date,
                  DATE_ADD(s.move_in_date, INTERVAL 1 YEAR) as contract_end_date,
                  st.rental_price as monthly_rent,
                  st.rental_price as lease_amount,
                  (SELECT MAX(p.payment_date) FROM payments p WHERE p.stallholder_id = s.stallholder_id AND p.payment_status = 'completed') as last_payment_date,
                  CASE 
                    WHEN EXISTS (SELECT 1 FROM violation_report vr WHERE vr.stallholder_id = s.stallholder_id AND vr.status = 'Open') 
                    THEN 'Non-Compliant' 
                    ELSE 'Compliant' 
                  END as compliance_status,
                  (SELECT MAX(vr.report_date) FROM violation_report vr WHERE vr.stallholder_id = s.stallholder_id) as last_violation_date,
                  st.stall_number as stall_no, 
                  st.stall_number,
                  st.stall_location, 
                  b.branch_name 
           FROM stallholder s 
           LEFT JOIN stall st ON s.stall_id = st.stall_id 
           LEFT JOIN branch b ON s.branch_id = b.branch_id 
           LEFT JOIN business_information bi ON s.mobile_user_id = bi.applicant_id
           WHERE s.branch_id IN (${placeholders})`,
          branchFilter
        );
        rows = result || [];
      }
      
      // Decrypt all sensitive fields using the decryptStallholders helper
      const decryptedRows = decryptStallholders(rows);
      
      console.log(`✅ Found ${decryptedRows.length} stallholders`);
      res.json({
        success: true,
        data: decryptedRows,
        total: decryptedRows.length,
      });
    } catch (error) {
      console.error('❌ Error fetching stallholders:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching stallholders',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get stallholder by ID with complete details
   */
  getStallholderById: async (req, res) => {
    let connection;
    try {
      const { id } = req.params;
      
      connection = await createConnection();
      const [rows] = await connection.execute(
        'CALL getStallholderById(?)',
        [id]
      );
      
      if (rows[0].length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Stallholder not found'
        });
      }
      
      // Backend-level decryption for stallholder details
      const rawStallholder = rows[0][0];
      
      // Decrypt all sensitive fields
      const stallholder = decryptStallholders([rawStallholder])[0];
      
      // Decrypt legacy field names too
      if (rawStallholder.stallholder_name && typeof rawStallholder.stallholder_name === 'string' && rawStallholder.stallholder_name.includes(':')) {
        try {
          stallholder.stallholder_name = decryptData(rawStallholder.stallholder_name);
        } catch (error) {
          console.error(`Failed to decrypt stallholder_name for ID ${id}:`, error.message);
        }
      }
      
      // Decrypt contact number
      if (stallholder.stallholder_contact && typeof stallholder.stallholder_contact === 'string' && stallholder.stallholder_contact.includes(':')) {
        try {
          stallholder.stallholder_contact = decryptData(stallholder.stallholder_contact);
        } catch (error) {
          console.error(`Failed to decrypt stallholder_contact for ID ${id}:`, error.message);
        }
      }
      
      // Decrypt contact_number (alternative field name)
      if (stallholder.contact_number && typeof stallholder.contact_number === 'string' && stallholder.contact_number.includes(':')) {
        try {
          stallholder.contact_number = decryptData(stallholder.contact_number);
        } catch (error) {
          console.error(`Failed to decrypt contact_number for ID ${id}:`, error.message);
        }
      }
      
      // Decrypt email
      if (stallholder.email && typeof stallholder.email === 'string' && stallholder.email.includes(':')) {
        try {
          stallholder.email = decryptData(stallholder.email);
        } catch (error) {
          console.error(`Failed to decrypt email for ID ${id}:`, error.message);
        }
      }
      
      // Decrypt address
      if (stallholder.stallholder_address && typeof stallholder.stallholder_address === 'string' && stallholder.stallholder_address.includes(':')) {
        try {
          stallholder.stallholder_address = decryptData(stallholder.stallholder_address);
        } catch (error) {
          console.error(`Failed to decrypt stallholder_address for ID ${id}:`, error.message);
        }
      }
      
      // Decrypt address (alternative field name)
      if (stallholder.address && typeof stallholder.address === 'string' && stallholder.address.includes(':')) {
        try {
          stallholder.address = decryptData(stallholder.address);
        } catch (error) {
          console.error(`Failed to decrypt address for ID ${id}:`, error.message);
        }
      }
      
      res.json({
        success: true,
        data: stallholder
      });
    } catch (error) {
      console.error('Error fetching stallholder:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching stallholder',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Create new stallholder
   */
  createStallholder: async (req, res) => {
    let connection;
    try {
      const {
        applicantId,
        stallholderName,
        contactNumber,
        email,
        address,
        businessName,
        businessType,
        branchId,
        stallId,
        contractStartDate,
        contractEndDate,
        leaseAmount,
        monthlyRent,
        notes
      } = req.body;
      
      const managerId = req.user.managerId || req.user.branchManagerId;
      const targetBranchId = req.user.branchId || branchId;
      
      // Validate required fields
      if (!stallholderName || !targetBranchId || !contractStartDate || !contractEndDate || !leaseAmount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: stallholderName, branchId, contractStartDate, contractEndDate, leaseAmount'
        });
      }
      
      connection = await createConnection();
      const [result] = await connection.execute(
        'CALL createStallholder(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          applicantId,
          stallholderName,
          contactNumber,
          email,
          address,
          businessName,
          businessType,
          targetBranchId,
          stallId,
          contractStartDate,
          contractEndDate,
          leaseAmount,
          monthlyRent,
          notes,
          managerId
        ]
      );
      
      const response = result[0][0];
      
      if (response.success) {
        res.status(201).json({
          success: true,
          message: response.message,
          data: { stallholderId: response.stallholder_id }
        });
      } else {
        res.status(400).json({
          success: false,
          message: response.message,
          error: response.error_code
        });
      }
    } catch (error) {
      console.error('Error creating stallholder:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating stallholder',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Update existing stallholder
   */
  updateStallholder: async (req, res) => {
    let connection;
    try {
      const { id } = req.params;
      const {
        stallholderName,
        contactNumber,
        email,
        address,
        businessName,
        businessType,
        stallId,
        contractStartDate,
        contractEndDate,
        contractStatus,
        leaseAmount,
        monthlyRent,
        paymentStatus,
        notes
      } = req.body;
      
      connection = await createConnection();
      const [result] = await connection.execute(
        'CALL updateStallholder(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          stallholderName,
          contactNumber,
          email,
          address,
          businessName,
          businessType,
          stallId,
          contractStartDate,
          contractEndDate,
          contractStatus,
          leaseAmount,
          monthlyRent,
          paymentStatus,
          notes
        ]
      );
      
      const response = result[0][0];
      
      if (response.success) {
        res.json({
          success: true,
          message: response.message,
          affectedRows: response.affected_rows
        });
      } else {
        res.status(400).json({
          success: false,
          message: response.message,
          error: response.error_code
        });
      }
    } catch (error) {
      console.error('Error updating stallholder:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating stallholder',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Delete/Terminate stallholder contract
   */
  deleteStallholder: async (req, res) => {
    let connection;
    try {
      const { id } = req.params;
      
      connection = await createConnection();
      const [result] = await connection.execute(
        'CALL deleteStallholder(?)',
        [id]
      );
      
      const response = result[0][0];
      
      if (response.success) {
        res.json({
          success: true,
          message: response.message,
          affectedRows: response.affected_rows
        });
      } else {
        res.status(400).json({
          success: false,
          message: response.message,
          error: response.error_code
        });
      }
    } catch (error) {
      console.error('Error deleting stallholder:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting stallholder',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Import stallholders from Excel file (Direct import without preview)
   * Handles the new template format with stall and rental information
   */
  importFromExcel: async (req, res) => {
    let connection;
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded'
        });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        return res.status(400).json({
          success: false,
          message: 'Excel file has no worksheets'
        });
      }

      const managerId = req.user.managerId || req.user.branchManagerId;
      const branchId = req.user.branchId;
      
      let successCount = 0;
      let errorCount = 0;
      let stallsCreated = 0;
      const errors = [];

      connection = await createConnection();

      // Get or create default floor and section
      let defaultFloorId, defaultSectionId;
      
      const [floors] = await connection.execute(
        `SELECT floor_id FROM floor WHERE branch_id = ? AND status = 'Active' LIMIT 1`,
        [branchId]
      );
      
      if (floors.length > 0) {
        defaultFloorId = floors[0].floor_id;
        const [sections] = await connection.execute(
          `SELECT section_id FROM section WHERE floor_id = ? AND status = 'Active' LIMIT 1`,
          [defaultFloorId]
        );
        if (sections.length > 0) {
          defaultSectionId = sections[0].section_id;
        } else {
          const [sectionResult] = await connection.execute(
            `INSERT INTO section (floor_id, section_name, status) VALUES (?, ?, 'Active')`,
            [defaultFloorId, 'General']
          );
          defaultSectionId = sectionResult.insertId;
        }
      } else {
        const [floorResult] = await connection.execute(
          `INSERT INTO floor (branch_id, floor_name, floor_number, status) VALUES (?, ?, 1, 'Active')`,
          [branchId, 'Ground Floor']
        );
        defaultFloorId = floorResult.insertId;
        const [sectionResult] = await connection.execute(
          `INSERT INTO section (floor_id, section_name, status) VALUES (?, ?, 'Active')`,
          [defaultFloorId, 'General']
        );
        defaultSectionId = sectionResult.insertId;
      }

      // Get headers
      const headerRow = worksheet.getRow(1);
      const headers = {};
      headerRow.eachCell((cell, colNumber) => {
        const headerValue = cell.value?.toString().trim().toUpperCase() || '';
        headers[headerValue] = colNumber;
      });

      // Build floor/section lookup
      const [floorsData] = await connection.execute(
        'SELECT floor_id, UPPER(floor_name) as floor_name FROM floor WHERE branch_id = ?',
        [branchId]
      );
      const floorLookup = {};
      floorsData.forEach(f => { floorLookup[f.floor_name] = f.floor_id; });

      const [sectionsData] = await connection.execute(
        `SELECT s.section_id, s.floor_id, UPPER(s.section_name) as section_name 
         FROM section s JOIN floor f ON s.floor_id = f.floor_id WHERE f.branch_id = ?`,
        [branchId]
      );
      const sectionLookup = {};
      sectionsData.forEach(s => { 
        sectionLookup[`${s.floor_id}_${s.section_name}`] = s.section_id; 
      });

      await connection.beginTransaction();

      try {
        // Process each row
        worksheet.eachRow(async (row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header

          const getCellValue = (headerName) => {
            const colNum = headers[headerName];
            if (!colNum) return null;
            return row.getCell(colNum).value;
          };

          try {
            // Extract data - support both new template and company's existing format
            const stallNo = getCellValue('STALL NO.') || getCellValue('STALL NO') || getCellValue('B/S NO.') || '';
            const stallholderName = getCellValue('STALLHOLDER NAME') || getCellValue('REGISTERED NAME') || '';
            const contactNumber = getCellValue('CONTACT NUMBER') || getCellValue('CONTACT') || '';
            const email = getCellValue('EMAIL') || '';
            const address = getCellValue('ADDRESS') || '';
            const businessName = getCellValue('BUSINESS NAME') || '';
            const businessType = getCellValue('BUSINESS TYPE') || getCellValue('NATURE OF BUSSINESS 2025') || getCellValue('NATURE OF BUSINESS 2025') || '';
            const areaOccupied = parseFloat(getCellValue('AREA OCCUPIED (SQM)') || getCellValue('NEW AREA OCCUPIED') || 0);
            const ratePerSqm = parseFloat(getCellValue('RATE PER SQ. METER') || getCellValue('RATE PER SQ METER') || 0);
            let monthlyRent = parseFloat(getCellValue('MONTHLY RENT') || getCellValue('DISCOUNTED') || getCellValue('NEW RATE FOR 2013') || 0);
            const discountedRate = parseFloat(getCellValue('DISCOUNTED RATE') || getCellValue('DISCOUNTED') || 0);
            let leaseAmount = parseFloat(getCellValue('LEASE AMOUNT') || 0);
            let contractStart = getCellValue('CONTRACT START (YYYY-MM-DD)') || getCellValue('CONTRACT START');
            let contractEnd = getCellValue('CONTRACT END (YYYY-MM-DD)') || getCellValue('CONTRACT END');
            const floorName = getCellValue('FLOOR') || 'GROUND FLOOR';
            const sectionName = getCellValue('SECTION') || '';
            const stallLocation = getCellValue('STALL LOCATION') || '';
            const stallSize = getCellValue('STALL SIZE') || getCellValue('SIZE') || '';
            const notes = getCellValue('NOTES') || '';

            // Skip empty rows
            if (!stallNo || !stallholderName || stallholderName.toString().includes('Sample')) {
              return;
            }

            // Calculate monthly rent if not provided
            if (!monthlyRent && areaOccupied && ratePerSqm) {
              monthlyRent = areaOccupied * ratePerSqm;
            }

            // Validate
            if (!monthlyRent || monthlyRent <= 0) {
              errors.push(`Row ${rowNumber}: Missing monthly rent`);
              errorCount++;
              return;
            }

            // Set defaults
            if (!leaseAmount) leaseAmount = monthlyRent;
            if (!contractStart) {
              contractStart = new Date().toISOString().split('T')[0];
            } else if (contractStart instanceof Date) {
              contractStart = contractStart.toISOString().split('T')[0];
            }
            if (!contractEnd) {
              const endDate = new Date(contractStart);
              endDate.setFullYear(endDate.getFullYear() + 1);
              contractEnd = endDate.toISOString().split('T')[0];
            } else if (contractEnd instanceof Date) {
              contractEnd = contractEnd.toISOString().split('T')[0];
            }

            // Find or create stall
            let stallId = null;
            const [existingStall] = await connection.execute(
              `SELECT s.stall_id FROM stall s 
               JOIN section sec ON s.section_id = sec.section_id
               JOIN floor f ON sec.floor_id = f.floor_id
               WHERE f.branch_id = ? AND UPPER(s.stall_no) = UPPER(?)`,
              [branchId, stallNo.toString().trim()]
            );

            if (existingStall.length > 0) {
              stallId = existingStall[0].stall_id;
              await connection.execute(
                `UPDATE stall SET rental_price = ?, is_available = 0, status = 'Occupied', updated_at = NOW() WHERE stall_id = ?`,
                [monthlyRent, stallId]
              );
            } else {
              // Create stall
              let floorId = defaultFloorId;
              let sectionId = defaultSectionId;

              if (floorName) {
                const floorKey = floorName.toString().toUpperCase();
                if (floorLookup[floorKey]) {
                  floorId = floorLookup[floorKey];
                }
              }
              if (sectionName) {
                const sectionKey = `${floorId}_${sectionName.toString().toUpperCase()}`;
                if (sectionLookup[sectionKey]) {
                  sectionId = sectionLookup[sectionKey];
                }
              }

              const [newStall] = await connection.execute(
                `INSERT INTO stall (section_id, floor_id, stall_no, stall_location, size, rental_price, 
                 price_type, status, is_available, created_by_business_manager) 
                 VALUES (?, ?, ?, ?, ?, ?, 'Fixed Price', 'Occupied', 0, ?)`,
                [sectionId, floorId, stallNo.toString().trim(), stallLocation || '', stallSize || '', monthlyRent, managerId]
              );
              stallId = newStall.insertId;
              stallsCreated++;
            }

            // Create stallholder
            await connection.execute(
              `INSERT INTO stallholder (
                 applicant_id, stallholder_name, contact_number, email, address,
                 business_name, business_type, branch_id, stall_id,
                 contract_start_date, contract_end_date, contract_status,
                 lease_amount, monthly_rent, payment_status, notes,
                 created_by_business_manager
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, 'pending', ?, ?)`,
              [
                null, stallholderName.toString().trim(), contactNumber?.toString() || null, 
                email?.toString() || null, address?.toString() || null,
                businessName?.toString() || null, businessType?.toString() || null,
                branchId, stallId, contractStart, contractEnd, leaseAmount, monthlyRent,
                notes ? notes.toString() : `Area: ${areaOccupied}sqm, Rate: ${ratePerSqm}/sqm, Discounted: ${discountedRate}`,
                managerId
              ]
            );

            successCount++;
          } catch (rowError) {
            errors.push(`Row ${rowNumber}: ${rowError.message}`);
            errorCount++;
          }
        });

        await connection.commit();
      } catch (txError) {
        await connection.rollback();
        throw txError;
      }

      // Clean up uploaded file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn('Could not delete temp file:', e.message);
      }

      res.json({
        success: true,
        message: `Import completed. ${successCount} successful, ${errorCount} errors, ${stallsCreated} new stalls created.`,
        data: {
          successCount,
          errorCount,
          stallsCreated,
          errors: errors.slice(0, 10)
        }
      });
    } catch (error) {
      console.error('Error importing Excel file:', error);
      res.status(500).json({
        success: false,
        message: 'Error importing Excel file',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get available stalls for stallholder assignment
   */
  getAvailableStalls: async (req, res) => {
    let connection;
    try {
      const branchId = req.user.branchId || req.query.branchId;
      
      connection = await createConnection();
      const [rows] = await connection.execute(
        `SELECT s.stall_id, s.stall_no, s.stall_location, s.size, s.rental_price,
                sec.section_name, f.floor_name, b.branch_name
         FROM stall s
         JOIN section sec ON s.section_id = sec.section_id
         JOIN floor f ON s.floor_id = f.floor_id  
         JOIN branch b ON f.branch_id = b.branch_id
         WHERE s.is_available = 1 AND s.status = 'Active'
         ${branchId ? 'AND b.branch_id = ?' : ''}
         ORDER BY b.branch_name, f.floor_name, sec.section_name, s.stall_no`,
        branchId ? [branchId] : []
      );
      
      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error fetching available stalls:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching available stalls',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Download Excel template for stallholder import
   * Exports existing stallholders data with full information:
   * - Stallholder info (from stallholder table)
   * - Applicant info (birthdate, civil status, education)
   * - Spouse info (name, birthdate, contact, occupation)
   * - Business info (nature, capitalization, source of capital)
   * - Discount calculation: 25% off for early payment (DISCOUNTED = MONTHLY_RENT × 0.75)
   * 
   * Sheet structure:
   * 1. Instructions - How to use the template
   * 2. Reference Data - Available branches, floors, sections
   * 3. [Section Name] sheets - One sheet per section with floor info (e.g., "Flowers", "Dry Goods")
   */
  downloadExcelTemplate: async (req, res) => {
    let connection;
    try {
      connection = await createConnection();
      
      // Get user's accessible branches
      const branchFilter = await getBranchFilter(req, connection);
      
      let branchQuery = `
        SELECT b.branch_id, b.branch_name, b.area, b.location
        FROM branch b WHERE b.status = 'Active'
      `;
      let params = [];
      
      if (branchFilter && branchFilter.length > 0) {
        branchQuery += ` AND b.branch_id IN (${branchFilter.map(() => '?').join(',')})`;
        params = branchFilter;
      }
      
      const [branches] = await connection.execute(branchQuery, params);
      
      // Get existing stallholders with FULL information (stall, applicant, spouse, business)
      let stallholderQuery = `
        SELECT 
          st.stall_no,
          sh.stallholder_name,
          sh.contact_number,
          sh.email,
          sh.address,
          sh.business_name,
          sh.business_type,
          st.size as stall_size,
          st.area_sqm,
          st.base_rate,
          st.rental_price,
          st.rate_per_sqm,
          sh.monthly_rent,
          sh.lease_amount,
          sh.contract_start_date,
          sh.contract_end_date,
          sh.payment_status,
          sh.contract_status,
          f.floor_name,
          sec.section_name,
          st.stall_location,
          sh.notes,
          b.branch_name,
          -- Applicant Information
          a.applicant_birthdate,
          a.applicant_civil_status,
          a.applicant_educational_attainment,
          -- Spouse Information
          sp.spouse_full_name,
          sp.spouse_birthdate,
          sp.spouse_contact_number,
          sp.spouse_occupation,
          sp.spouse_educational_attainment,
          -- Business Information
          bi.nature_of_business,
          bi.capitalization,
          bi.source_of_capital,
          bi.previous_business_experience,
          bi.relative_stall_owner
        FROM stallholder sh
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN section sec ON st.section_id = sec.section_id
        LEFT JOIN floor f ON st.floor_id = f.floor_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        LEFT JOIN applicant a ON sh.applicant_id = a.applicant_id
        LEFT JOIN spouse sp ON sh.applicant_id = sp.applicant_id
        LEFT JOIN business_information bi ON sh.applicant_id = bi.applicant_id
        WHERE sh.contract_status = 'Active'
      `;
      
      if (branchFilter && branchFilter.length > 0) {
        stallholderQuery += ` AND sh.branch_id IN (${branchFilter.map(() => '?').join(',')})`;
      }
      stallholderQuery += ` ORDER BY b.branch_name, st.stall_no`;
      
      const [existingStallholders] = await connection.execute(
        stallholderQuery, 
        branchFilter && branchFilter.length > 0 ? branchFilter : []
      );
      
      // Get floors and sections for reference
      const [floorsAndSections] = await connection.execute(`
        SELECT f.floor_id, f.floor_name, f.branch_id, s.section_id, s.section_name
        FROM floor f
        LEFT JOIN section s ON f.floor_id = s.floor_id
        WHERE f.status = 'Active'
        ORDER BY f.branch_id, f.floor_number, s.section_name
      `);
      
      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'DigiStall System';
      workbook.created = new Date();
      
      // ========== 1. INSTRUCTIONS SHEET (First tab) ==========
      const instructionSheet = workbook.addWorksheet('Instructions', {
        properties: { tabColor: { argb: '70AD47' } }
      });
      
      instructionSheet.columns = [
        { header: '', key: 'content', width: 100 }
      ];
      
      const instructions = [
        '📋 STALLHOLDER MASTER LIST - DATA EXPORT',
        '',
        `📊 TOTAL EXPORTED: ${existingStallholders.length} stallholders`,
        `📅 EXPORT DATE: ${new Date().toLocaleDateString()}`,
        '',
        '═══════════════════════════════════════════════════════════════════════════',
        '',
        '📂 SHEET STRUCTURE:',
        '   • Instructions - This guide',
        '   • Reference Data - Available branches, floors, sections',
        '   • [Section Name] sheets - One sheet per section (e.g., "Flowers", "Dry Goods")',
        '     - Each section sheet shows stallholders grouped by FLOOR',
        '     - B1-S1 = Building 1, Section 1 (Floor info shown in header)',
        '',
        '═══════════════════════════════════════════════════════════════════════════',
        '',
        '💰 RENTAL CALCULATION FORMULA (Based on MASTERLIST):',
        '   • MONTHLY RENT = RENTAL RATE (2010) × 2',
        '   • RATE PER SQ. METER = MONTHLY RENT ÷ NEW AREA OCCUPIED',
        '   • DISCOUNTED RATE = MONTHLY RENT × 0.75 (25% early payment discount)',
        '   • Example: RENTAL RATE (2010) = ₱2,498.46 → MONTHLY RENT = ₱4,996.92 → DISCOUNTED = ₱3,747.69',
        '',
        '═══════════════════════════════════════════════════════════════════════════',
        '',
        '📁 DATA COLUMNS:',
        '',
        '🏪 STALL INFORMATION:',
        '   • B/S NO. - Stall number (e.g., B1-S1 = Building 1, Section 1)',
        '   • REGISTERED NAME - Full name of stallholder',
        '   • NEW AREA OCCUPIED - Area in square meters',
        '   • RENTAL RATE (2010) - Base rate for calculation',
        '   • RATE PER SQ. METER - Calculated: MONTHLY RENT ÷ AREA',
        '   • MONTHLY RENT - Calculated: RENTAL RATE (2010) × 2',
        '   • DISCOUNTED RATE - 25% early payment discount (×0.75)',
        '',
        '👤 PERSONAL & CONTACT:',
        '   • CONTACT NUMBER, EMAIL, ADDRESS, BIRTHDATE, CIVIL STATUS, EDUCATION',
        '',
        '💑 SPOUSE INFORMATION (if married):',
        '   • SPOUSE NAME, BIRTHDATE, CONTACT, OCCUPATION, EDUCATION',
        '',
        '💼 BUSINESS INFORMATION:',
        '   • NATURE OF BUSINESS, CAPITALIZATION, SOURCE OF CAPITAL, PREV. EXPERIENCE',
        '',
        '📝 CONTRACT INFORMATION:',
        '   • CONTRACT START, CONTRACT END, PAYMENT STATUS',
        '',
        '═══════════════════════════════════════════════════════════════════════════',
        '',
        '⚠️ FOR IMPORTING NEW DATA:',
        '   • Required: B/S NO., REGISTERED NAME, MONTHLY RENT, CONTRACT START/END',
        '   • Dates must be in YYYY-MM-DD format',
        '   • All amounts should be in PHP (no currency symbols)',
        ''
      ];
      
      instructions.forEach((text, index) => {
        const row = instructionSheet.addRow({ content: text });
        if (index === 0) {
          row.font = { bold: true, size: 16, color: { argb: '4472C4' } };
        } else if (text.startsWith('📊') || text.startsWith('📅')) {
          row.font = { bold: true, size: 12, color: { argb: '70AD47' } };
        } else if (text.startsWith('💰')) {
          row.font = { bold: true, size: 12, color: { argb: 'FF0000' } };
        } else if (text.startsWith('📂') || text.startsWith('🏪') || text.startsWith('👤') || text.startsWith('💑') || text.startsWith('💼') || text.startsWith('📝') || text.startsWith('⚠️') || text.startsWith('📁')) {
          row.font = { bold: true, size: 12 };
        } else if (text.startsWith('═')) {
          row.font = { color: { argb: '808080' } };
        }
      });
      
      // ========== 2. REFERENCE DATA SHEET (Second tab) ==========
      const refSheet = workbook.addWorksheet('Reference Data', {
        properties: { tabColor: { argb: 'FFC000' } }
      });
      
      refSheet.columns = [
        { header: 'Branch Name', key: 'branch_name', width: 30 },
        { header: 'Area', key: 'area', width: 20 },
        { header: 'Location', key: 'location', width: 25 },
        { header: 'Available Floors', key: 'floors', width: 30 },
        { header: 'Available Sections', key: 'sections', width: 40 }
      ];
      
      // Style reference header
      const refHeaderRow = refSheet.getRow(1);
      refHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      refHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC000' }
      };
      
      // Group floors and sections by branch
      branches.forEach(branch => {
        const branchFloors = floorsAndSections.filter(f => f.branch_id === branch.branch_id);
        const uniqueFloors = [...new Set(branchFloors.map(f => f.floor_name))].join(', ');
        const uniqueSections = [...new Set(branchFloors.map(f => f.section_name).filter(Boolean))].join(', ');
        
        refSheet.addRow({
          branch_name: branch.branch_name,
          area: branch.area,
          location: branch.location,
          floors: uniqueFloors || 'No floors defined',
          sections: uniqueSections || 'No sections defined'
        });
      });
      
      // ========== 3. SECTION SHEETS (One per section, grouped by floor) ==========
      // Get ALL sections from database (not just those with stallholders)
      const allSections = [...new Set(floorsAndSections.map(f => f.section_name).filter(Boolean))];
      
      // Group stallholders by section
      const stallholdersBySection = {};
      
      // Initialize all sections (even empty ones)
      allSections.forEach(sectionName => {
        stallholdersBySection[sectionName] = [];
      });
      
      // Add stallholders to their sections
      existingStallholders.forEach(sh => {
        const sectionName = sh.section_name || 'Unassigned';
        if (!stallholdersBySection[sectionName]) {
          stallholdersBySection[sectionName] = [];
        }
        stallholdersBySection[sectionName].push(sh);
      });
      
      // Also add 'Unassigned' if there are stallholders without section
      if (!stallholdersBySection['Unassigned']) {
        const unassigned = existingStallholders.filter(sh => !sh.section_name);
        if (unassigned.length > 0) {
          stallholdersBySection['Unassigned'] = unassigned;
        }
      }
      
      // Create a sheet for each section
      const tabColors = ['4472C4', 'ED7D31', '70AD47', 'FFC000', '5B9BD5', 'A5A5A5', '7030A0', 'C00000'];
      let colorIndex = 0;
      
      Object.keys(stallholdersBySection).sort().forEach(sectionName => {
        const sectionStallholders = stallholdersBySection[sectionName];
        
        // Clean section name for sheet (Excel sheet names have restrictions)
        const sheetName = sectionName.substring(0, 31).replace(/[*?:/\\[\]]/g, '-');
        
        const sectionSheet = workbook.addWorksheet(sheetName, {
          properties: { tabColor: { argb: tabColors[colorIndex % tabColors.length] } }
        });
        colorIndex++;
        
        // Group by floor within section
        const stallholdersByFloor = {};
        sectionStallholders.forEach(sh => {
          const floorName = sh.floor_name || '1st Floor';
          if (!stallholdersByFloor[floorName]) {
            stallholdersByFloor[floorName] = [];
          }
          stallholdersByFloor[floorName].push(sh);
        });
        
        // If section is empty, get floors from floorsAndSections data
        if (Object.keys(stallholdersByFloor).length === 0) {
          // Find floors that have this section
          const floorsWithSection = floorsAndSections.filter(f => f.section_name === sectionName);
          floorsWithSection.forEach(f => {
            if (f.floor_name && !stallholdersByFloor[f.floor_name]) {
              stallholdersByFloor[f.floor_name] = [];
            }
          });
          // If still no floors, add a default
          if (Object.keys(stallholdersByFloor).length === 0) {
            stallholdersByFloor['Unassigned Floor'] = [];
          }
        }
        
        // Define columns
        sectionSheet.columns = [
          { header: 'B/S NO.', key: 'stall_no', width: 12 },
          { header: 'REGISTERED NAME', key: 'stallholder_name', width: 30 },
          { header: 'NEW AREA OCCUPIED', key: 'area_occupied', width: 18 },
          { header: 'RENTAL RATE (2010)', key: 'base_rate', width: 18 },
          { header: 'RATE PER SQ. METER', key: 'rate_per_sqm', width: 18 },
          { header: 'MONTHLY RENT', key: 'monthly_rent', width: 15 },
          { header: 'DISCOUNTED RATE', key: 'discounted_rate', width: 18 },
          { header: 'CONTACT NUMBER', key: 'contact_number', width: 18 },
          { header: 'EMAIL', key: 'email', width: 30 },
          { header: 'ADDRESS', key: 'address', width: 40 },
          { header: 'BIRTHDATE', key: 'birthdate', width: 14 },
          { header: 'CIVIL STATUS', key: 'civil_status', width: 14 },
          { header: 'EDUCATION', key: 'education', width: 25 },
          { header: 'SPOUSE NAME', key: 'spouse_name', width: 30 },
          { header: 'SPOUSE CONTACT', key: 'spouse_contact', width: 18 },
          { header: 'NATURE OF BUSINESS', key: 'nature_of_business', width: 30 },
          { header: 'CAPITALIZATION', key: 'capitalization', width: 18 },
          { header: 'CONTRACT START', key: 'contract_start_date', width: 16 },
          { header: 'CONTRACT END', key: 'contract_end_date', width: 16 },
          { header: 'PAYMENT STATUS', key: 'payment_status', width: 16 }
        ];
        
        let currentRow = 1;
        
        // Add section title
        sectionSheet.mergeCells(`A${currentRow}:T${currentRow}`);
        const titleCell = sectionSheet.getCell(`A${currentRow}`);
        titleCell.value = `📍 SECTION: ${sectionName}`;
        titleCell.font = { bold: true, size: 16, color: { argb: '4472C4' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D9E2F3' }
        };
        sectionSheet.getRow(currentRow).height = 30;
        currentRow++;
        
        // Add floor groups
        Object.keys(stallholdersByFloor).sort().forEach(floorName => {
          const floorStallholders = stallholdersByFloor[floorName];
          
          // Floor header row
          sectionSheet.mergeCells(`A${currentRow}:T${currentRow}`);
          const floorCell = sectionSheet.getCell(`A${currentRow}`);
          floorCell.value = `🏢 ${floorName} (${floorStallholders.length} stallholders)`;
          floorCell.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
          floorCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: tabColors[colorIndex % tabColors.length] }
          };
          floorCell.alignment = { horizontal: 'left', vertical: 'middle' };
          sectionSheet.getRow(currentRow).height = 25;
          currentRow++;
          
          // Column headers for this floor group
          const headerRowNum = currentRow;
          const colHeaders = ['B/S NO.', 'REGISTERED NAME', 'NEW AREA OCCUPIED', 'RENTAL RATE (2010)', 
            'RATE PER SQ. METER', 'MONTHLY RENT', 'DISCOUNTED RATE', 'CONTACT NUMBER', 'EMAIL', 
            'ADDRESS', 'BIRTHDATE', 'CIVIL STATUS', 'EDUCATION', 'SPOUSE NAME', 'SPOUSE CONTACT',
            'NATURE OF BUSINESS', 'CAPITALIZATION', 'CONTRACT START', 'CONTRACT END', 'PAYMENT STATUS'];
          
          colHeaders.forEach((header, idx) => {
            const cell = sectionSheet.getCell(currentRow, idx + 1);
            cell.value = header;
            cell.font = { bold: true, size: 9, color: { argb: 'FFFFFF' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '4472C4' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          });
          sectionSheet.getRow(currentRow).height = 30;
          currentRow++;
          
          // Add stallholder data OR empty message
          if (floorStallholders.length === 0) {
            // No stallholders in this floor
            sectionSheet.mergeCells(`A${currentRow}:T${currentRow}`);
            const emptyCell = sectionSheet.getCell(`A${currentRow}`);
            emptyCell.value = '📋 No stallholders assigned to this floor yet';
            emptyCell.font = { italic: true, size: 10, color: { argb: '808080' } };
            emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
            sectionSheet.getRow(currentRow).height = 25;
            currentRow++;
          } else {
            // Add stallholder data
            floorStallholders.forEach(sh => {
            let areaOccupied = sh.area_sqm || '';
            let monthlyRent = sh.monthly_rent || sh.rental_price || 0;
            let baseRate = sh.base_rate || '';
            if (!baseRate && monthlyRent > 0) {
              baseRate = (monthlyRent / 2).toFixed(2);
            }
            let ratePerSqm = sh.rate_per_sqm || '';
            if (!ratePerSqm && monthlyRent && areaOccupied) {
              ratePerSqm = (monthlyRent / areaOccupied).toFixed(2);
            }
            const discountedRate = monthlyRent ? (monthlyRent * 0.75).toFixed(2) : '';
            
            const rowData = [
              sh.stall_no || '',
              sh.stallholder_name || '',
              areaOccupied,
              baseRate,
              ratePerSqm,
              monthlyRent,
              discountedRate,
              sh.contact_number || '',
              sh.email || '',
              sh.address || '',
              sh.applicant_birthdate ? new Date(sh.applicant_birthdate).toISOString().split('T')[0] : '',
              sh.applicant_civil_status || '',
              sh.applicant_educational_attainment || '',
              sh.spouse_full_name || '',
              sh.spouse_contact_number || '',
              sh.nature_of_business || sh.business_type || '',
              sh.capitalization || '',
              sh.contract_start_date ? new Date(sh.contract_start_date).toISOString().split('T')[0] : '',
              sh.contract_end_date ? new Date(sh.contract_end_date).toISOString().split('T')[0] : '',
              sh.payment_status || ''
            ];
            
            rowData.forEach((value, idx) => {
              const cell = sectionSheet.getCell(currentRow, idx + 1);
              cell.value = value;
              cell.alignment = { vertical: 'middle' };
              // Number format for currency columns
              if ([2, 3, 4, 5, 6, 16].includes(idx)) {
                cell.numFmt = '#,##0.00';
              }
            });
            currentRow++;
          });
          } // End of else block (stallholders exist)
          
          // Add empty row between floor groups
          currentRow++;
        });
        
        // Freeze first two rows
        sectionSheet.views = [{ state: 'frozen', ySplit: 2 }];
      });
      
      // Set response headers
      const filename = `STALLHOLDER_MASTERLIST_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
      
    } catch (error) {
      console.error('Error downloading Excel template:', error);
      res.status(500).json({
        success: false,
        message: 'Error downloading Excel template',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Preview Excel file data before import
   * Validates data and returns preview with validation status
   */
  previewExcelData: async (req, res) => {
    let connection;
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No Excel file uploaded'
        });
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);
      
      // Get the first sheet (data sheet)
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        return res.status(400).json({
          success: false,
          message: 'Excel file has no worksheets'
        });
      }

      connection = await createConnection();
      const branchId = req.user.branchId;
      
      // Get existing stalls for validation
      const [existingStalls] = await connection.execute(
        `SELECT stall_no FROM stall s 
         JOIN section sec ON s.section_id = sec.section_id
         JOIN floor f ON sec.floor_id = f.floor_id
         WHERE f.branch_id = ?`,
        [branchId]
      );
      const existingStallNos = new Set(existingStalls.map(s => s.stall_no?.toUpperCase()));
      
      // Get existing stallholders
      const [existingStallholders] = await connection.execute(
        `SELECT stallholder_name, email FROM stallholder WHERE branch_id = ?`,
        [branchId]
      );
      const existingEmails = new Set(existingStallholders.map(s => s.email?.toLowerCase()).filter(Boolean));

      const previewData = [];
      const errors = [];
      
      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      const headers = {};
      headerRow.eachCell((cell, colNumber) => {
        const headerValue = cell.value?.toString().trim().toUpperCase() || '';
        headers[headerValue] = colNumber;
      });

      // Process each data row (skip header)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        const getCellValue = (headerName) => {
          const colNum = headers[headerName];
          if (!colNum) return null;
          const cell = row.getCell(colNum);
          return cell.value;
        };

        // Extract data from row - Support both MASTERLIST format and standard format
        // MASTERLIST format: B/S NO., REGISTERED NAME, NEW AREA OCCUPIED, RENTAL RATE (2010)...
        const rawBaseRate = parseFloat(getCellValue('RENTAL RATE (2010)') || getCellValue('BASE RATE') || getCellValue('RENTAL RATE') || 0);
        const rawAreaOccupied = parseFloat(getCellValue('NEW AREA OCCUPIED') || getCellValue('AREA OCCUPIED (SQM)') || getCellValue('AREA OCCUPIED') || 0);
        
        // ===== RENTAL CALCULATION FORMULA =====
        // Based on MASTERLIST:
        // MONTHLY RENT = RENTAL RATE (2010) × 2
        // RATE PER SQ. METER = MONTHLY RENT ÷ NEW AREA OCCUPIED
        // DISCOUNTED = MONTHLY RENT × 0.75 (25% off for early payment)
        let calculatedMonthlyRent = 0;
        let calculatedRatePerSqm = 0;
        
        // Check if MASTERLIST format (has B/S NO. header)
        const isMasterlistFormat = headers['B/S NO.'] !== undefined;
        
        // Priority 1: Calculate from RENTAL RATE (2010) × 2 (preferred method)
        if (rawBaseRate > 0) {
          calculatedMonthlyRent = Math.round(rawBaseRate * 2 * 100) / 100;
          if (rawAreaOccupied > 0) {
            calculatedRatePerSqm = Math.round((calculatedMonthlyRent / rawAreaOccupied) * 100) / 100;
          }
          console.log(`📊 MASTERLIST Rental Calc: Base Rate ${rawBaseRate} × 2 = ${calculatedMonthlyRent}`);
        } else {
          // Priority 2: Try to get MONTHLY RENT directly
          calculatedMonthlyRent = parseFloat(getCellValue('MONTHLY RENT') || getCellValue('NEW RATE FOR 2013') || 0);
          calculatedRatePerSqm = parseFloat(getCellValue('RATE PER SQ. METER') || getCellValue('RATE PER SQ METER') || 0);
          
          // If we have monthly rent but no rate per sqm, calculate it
          if (calculatedMonthlyRent > 0 && rawAreaOccupied > 0 && !calculatedRatePerSqm) {
            calculatedRatePerSqm = Math.round((calculatedMonthlyRent / rawAreaOccupied) * 100) / 100;
          }
        }

        const rowData = {
          row_number: rowNumber,
          stall_no: getCellValue('B/S NO.') || getCellValue('STALL NO.') || getCellValue('STALL NO') || '',
          stallholder_name: getCellValue('REGISTERED NAME') || getCellValue('STALLHOLDER NAME') || '',
          contact_number: getCellValue('CONTACT NUMBER') || getCellValue('CONTACT') || '',
          email: getCellValue('EMAIL') || '',
          address: getCellValue('ADDRESS') || '',
          business_name: getCellValue('BUSINESS NAME') || '',
          business_type: getCellValue('NATURE OF BUSSINESS 2025') || getCellValue('NATURE OF BUSSINESS') || getCellValue('NATURE OF BUSINESS 2025') || getCellValue('BUSINESS TYPE') || '',
          area_occupied: rawAreaOccupied,
          base_rate: rawBaseRate,
          rate_per_sqm: calculatedRatePerSqm,
          monthly_rent: calculatedMonthlyRent,
          discounted_rate: parseFloat(getCellValue('DISCOUNTED RATE') || getCellValue('DISCOUNTED') || calculatedMonthlyRent),
          lease_amount: parseFloat(getCellValue('LEASE AMOUNT') || getCellValue('LEASE') || calculatedMonthlyRent),
          contract_start_date: getCellValue('CONTRACT START (YYYY-MM-DD)') || getCellValue('CONTRACT START') || null,
          contract_end_date: getCellValue('CONTRACT END (YYYY-MM-DD)') || getCellValue('CONTRACT END') || null,
          floor_name: getCellValue('FLOOR') || 'GROUND FLOOR',
          section_name: getCellValue('SECTION') || '',
          stall_location: getCellValue('STALL LOCATION') || '',
          stall_size: getCellValue('STALL SIZE') || getCellValue('SIZE') || '',
          notes: getCellValue('NOTES') || '',
          _rowErrors: [],
          _isValid: true
        };

        // Skip empty rows (check if stallholder_name is empty)
        if (!rowData.stallholder_name || rowData.stallholder_name.toString().trim() === '') {
          // Check if it's the sample row
          if (rowData.stall_no && rowData.stall_no.toString().includes('Sample')) {
            return; // Skip sample row
          }
          if (!rowData.stall_no) {
            return; // Skip completely empty rows
          }
        }

        // Validate required fields
        if (!rowData.stall_no || rowData.stall_no.toString().trim() === '') {
          rowData._rowErrors.push('STALL NO. is required');
          rowData._isValid = false;
        }
        
        if (!rowData.stallholder_name || rowData.stallholder_name.toString().trim() === '') {
          rowData._rowErrors.push('STALLHOLDER NAME is required');
          rowData._isValid = false;
        }

        // Calculate monthly rent if not provided
        if (!rowData.monthly_rent && rowData.area_occupied && rowData.rate_per_sqm) {
          rowData.monthly_rent = rowData.area_occupied * rowData.rate_per_sqm;
        }

        if (!rowData.monthly_rent || rowData.monthly_rent <= 0) {
          rowData._rowErrors.push('MONTHLY RENT is required (or AREA OCCUPIED + RATE PER SQ. METER)');
          rowData._isValid = false;
        }

        // Set default dates if not provided
        if (!rowData.contract_start_date) {
          rowData.contract_start_date = new Date().toISOString().split('T')[0];
        }
        if (!rowData.contract_end_date) {
          // Default to 1 year from start
          const startDate = new Date(rowData.contract_start_date);
          startDate.setFullYear(startDate.getFullYear() + 1);
          rowData.contract_end_date = startDate.toISOString().split('T')[0];
        }

        // Format dates
        if (rowData.contract_start_date instanceof Date) {
          rowData.contract_start_date = rowData.contract_start_date.toISOString().split('T')[0];
        }
        if (rowData.contract_end_date instanceof Date) {
          rowData.contract_end_date = rowData.contract_end_date.toISOString().split('T')[0];
        }

        // Check for duplicate emails
        if (rowData.email && existingEmails.has(rowData.email.toLowerCase())) {
          rowData._rowErrors.push(`Email ${rowData.email} already exists`);
          rowData._isValid = false;
        }

        // Set lease amount if not provided
        if (!rowData.lease_amount) {
          rowData.lease_amount = rowData.monthly_rent;
        }

        // Convert values to proper types
        rowData.stall_no = rowData.stall_no?.toString().trim() || '';
        rowData.stallholder_name = rowData.stallholder_name?.toString().trim() || '';
        rowData.contact_number = rowData.contact_number?.toString().trim() || '';
        rowData.email = rowData.email?.toString().trim() || '';
        rowData.address = rowData.address?.toString().trim() || '';
        rowData.business_name = rowData.business_name?.toString().trim() || '';
        rowData.business_type = rowData.business_type?.toString().trim() || '';

        // Add stall existence info
        rowData._stallExists = existingStallNos.has(rowData.stall_no.toUpperCase());

        previewData.push(rowData);

        if (rowData._rowErrors.length > 0) {
          errors.push({
            row: rowNumber,
            errors: rowData._rowErrors
          });
        }
      });

      // Clean up uploaded file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn('Could not delete temp file:', e.message);
      }

      const validCount = previewData.filter(r => r._isValid).length;
      const invalidCount = previewData.length - validCount;

      res.json({
        success: true,
        data: previewData,
        summary: {
          total: previewData.length,
          valid: validCount,
          invalid: invalidCount,
          newStalls: previewData.filter(r => !r._stallExists && r._isValid).length,
          existingStalls: previewData.filter(r => r._stallExists && r._isValid).length
        },
        errors: errors
      });

    } catch (error) {
      console.error('Error previewing Excel data:', error);
      res.status(500).json({
        success: false,
        message: 'Error previewing Excel data',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Import validated Excel data
   * Creates/links stalls, creates stallholders, auto-creates accounts and sends email
   */
  importExcelData: async (req, res) => {
    let connection;
    try {
      const { data } = req.body;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No data provided for import'
        });
      }

      connection = await createConnection();
      const branchId = req.user.branchId;
      const managerId = req.user.managerId || req.user.branchManagerId;
      
      // Get branch name for email
      const [branchRows] = await connection.execute(
        'SELECT branch_name FROM branch WHERE branch_id = ?',
        [branchId]
      );
      const branchName = branchRows[0]?.branch_name || 'Naga Stall';
      
      // Get or create default floor and section
      let defaultFloorId, defaultSectionId;
      
      // Try to get existing floor
      const [floors] = await connection.execute(
        `SELECT floor_id, floor_name FROM floor WHERE branch_id = ? AND status = 'Active' LIMIT 1`,
        [branchId]
      );
      
      if (floors.length > 0) {
        defaultFloorId = floors[0].floor_id;
        
        // Get default section for this floor
        const [sections] = await connection.execute(
          `SELECT section_id FROM section WHERE floor_id = ? AND status = 'Active' LIMIT 1`,
          [defaultFloorId]
        );
        
        if (sections.length > 0) {
          defaultSectionId = sections[0].section_id;
        } else {
          // Create default section
          const [sectionResult] = await connection.execute(
            `INSERT INTO section (floor_id, section_name, status) VALUES (?, ?, 'Active')`,
            [defaultFloorId, 'General']
          );
          defaultSectionId = sectionResult.insertId;
        }
      } else {
        // Create default floor
        const [floorResult] = await connection.execute(
          `INSERT INTO floor (branch_id, floor_name, floor_number, status) VALUES (?, ?, 1, 'Active')`,
          [branchId, 'Ground Floor']
        );
        defaultFloorId = floorResult.insertId;
        
        // Create default section
        const [sectionResult] = await connection.execute(
          `INSERT INTO section (floor_id, section_name, status) VALUES (?, ?, 'Active')`,
          [defaultFloorId, 'General']
        );
        defaultSectionId = sectionResult.insertId;
      }

      // Build floor/section lookup
      const [floorsData] = await connection.execute(
        `SELECT f.floor_id, UPPER(f.floor_name) as floor_name FROM floor f WHERE f.branch_id = ? AND f.status = 'Active'`,
        [branchId]
      );
      const floorLookup = {};
      floorsData.forEach(f => {
        floorLookup[f.floor_name] = f.floor_id;
      });

      const [sectionsData] = await connection.execute(
        `SELECT s.section_id, s.floor_id, UPPER(s.section_name) as section_name 
         FROM section s 
         JOIN floor f ON s.floor_id = f.floor_id 
         WHERE f.branch_id = ? AND s.status = 'Active'`,
        [branchId]
      );
      const sectionLookup = {};
      sectionsData.forEach(s => {
        const key = `${s.floor_id}_${s.section_name}`;
        sectionLookup[key] = s.section_id;
      });

      let imported = 0;
      let skipped = 0;
      let stallsCreated = 0;
      let accountsCreated = 0;
      let emailsSent = 0;
      const importErrors = [];
      const accountsInfo = [];

      await connection.beginTransaction();

      try {
        // Helper function to generate password
        const generatePassword = () => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
          let password = '';
          for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return password + '@' + Math.floor(Math.random() * 100);
        };

        // Helper function to generate username from stall_no and year
        const generateUsername = (stallNo) => {
          const year = new Date().getFullYear().toString().slice(-2);
          const cleanStallNo = stallNo.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          return `${year}-${cleanStallNo}`;
        };

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          
          // Skip invalid rows
          if (!row._isValid) {
            skipped++;
            continue;
          }

          try {
            let stallId = null;
            let applicantId = null;
            
            // Check if stall exists
            const [existingStall] = await connection.execute(
              `SELECT s.stall_id FROM stall s 
               JOIN section sec ON s.section_id = sec.section_id
               JOIN floor f ON sec.floor_id = f.floor_id
               WHERE f.branch_id = ? AND UPPER(s.stall_no) = UPPER(?)`,
              [branchId, row.stall_no]
            );

            if (existingStall.length > 0) {
              stallId = existingStall[0].stall_id;
              
              // Update stall with new rental information (including base_rate and area_sqm)
              await connection.execute(
                `UPDATE stall SET 
                   base_rate = COALESCE(?, base_rate),
                   rental_price = ?,
                   rate_per_sqm = COALESCE(?, rate_per_sqm),
                   area_sqm = COALESCE(?, area_sqm),
                   size = COALESCE(?, size),
                   stall_location = COALESCE(?, stall_location),
                   is_available = 0,
                   status = 'Occupied',
                   updated_at = NOW()
                 WHERE stall_id = ?`,
                [row.base_rate || null, row.monthly_rent, row.rate_per_sqm || null, 
                 row.area_occupied || null, row.stall_size, row.stall_location, stallId]
              );
            } else {
              // Determine floor and section
              let floorId = defaultFloorId;
              let sectionId = defaultSectionId;

              if (row.floor_name) {
                const floorKey = row.floor_name.toString().toUpperCase();
                if (floorLookup[floorKey]) {
                  floorId = floorLookup[floorKey];
                } else {
                  // Create new floor
                  const [newFloor] = await connection.execute(
                    'INSERT INTO floor (branch_id, floor_name, floor_number, status) VALUES (?, ?, 0, "Active")',
                    [branchId, row.floor_name]
                  );
                  floorId = newFloor.insertId;
                  floorLookup[floorKey] = floorId;
                }
              }

              if (row.section_name) {
                const sectionKey = `${floorId}_${row.section_name.toString().toUpperCase()}`;
                if (sectionLookup[sectionKey]) {
                  sectionId = sectionLookup[sectionKey];
                } else {
                  // Create new section
                  const [newSection] = await connection.execute(
                    'INSERT INTO section (floor_id, section_name, status) VALUES (?, ?, "Active")',
                    [floorId, row.section_name]
                  );
                  sectionId = newSection.insertId;
                  sectionLookup[sectionKey] = sectionId;
                }
              }

              // Create new stall with rental calculation fields
              const [newStall] = await connection.execute(
                `INSERT INTO stall (
                   section_id, floor_id, stall_no, stall_location, size, area_sqm,
                   base_rate, rental_price, rate_per_sqm, price_type, status, is_available,
                   created_by_business_manager, created_at
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Fixed Price', 'Occupied', 0, ?, NOW())`,
                [sectionId, floorId, row.stall_no, row.stall_location || '', row.stall_size || '', 
                 row.area_occupied || null, row.base_rate || null, row.monthly_rent, 
                 row.rate_per_sqm || null, managerId]
              );
              stallId = newStall.insertId;
              stallsCreated++;
            }

            // AUTO-CREATE ACCOUNT IF EMAIL EXISTS
            let accountCreated = false;
            let generatedPassword = null;
            let generatedUsername = null;
            
            if (row.email && row.email.trim() !== '') {
              const email = row.email.trim().toLowerCase();
              
              // Check if credential already exists for this email
              const [existingCred] = await connection.execute(
                `SELECT c.registrationid FROM credential c 
                 JOIN applicant a ON c.applicant_id = a.applicant_id 
                 WHERE LOWER(a.applicant_email) = ?`,
                [email]
              );
              
              if (existingCred.length === 0) {
                // Check if applicant exists by email
                const [existingApplicant] = await connection.execute(
                  `SELECT applicant_id FROM applicant WHERE LOWER(applicant_email) = ?`,
                  [email]
                );
                
                if (existingApplicant.length > 0) {
                  applicantId = existingApplicant[0].applicant_id;
                } else {
                  // Create new applicant record for this stallholder
                  const [newApplicant] = await connection.execute(
                    `INSERT INTO applicant (
                       applicant_full_name, applicant_contact_number, applicant_address,
                       applicant_email, applicant_username, created_at, updated_at
                     ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                    [
                      row.stallholder_name,
                      row.contact_number || null,
                      row.address || null,
                      email,
                      generateUsername(row.stall_no)
                    ]
                  );
                  applicantId = newApplicant.insertId;
                }
                
                // Generate unique username and password
                generatedUsername = generateUsername(row.stall_no);
                generatedPassword = generatePassword();
                
                // Check if username exists
                const [usernameCheck] = await connection.execute(
                  'SELECT registrationid FROM credential WHERE user_name = ?',
                  [generatedUsername]
                );
                
                if (usernameCheck.length > 0) {
                  // Add random suffix if username exists
                  generatedUsername = `${generatedUsername}-${Math.floor(Math.random() * 1000)}`;
                }
                
                // Hash password and create credential
                const passwordHash = await bcrypt.hash(generatedPassword, 10);
                
                await connection.execute(
                  `INSERT INTO credential (
                     applicant_id, user_name, password_hash, created_date, is_active
                   ) VALUES (?, ?, ?, NOW(), 1)`,
                  [applicantId, generatedUsername, passwordHash]
                );
                
                accountCreated = true;
                accountsCreated++;
                
                // Store account info for email sending
                accountsInfo.push({
                  email: email,
                  stallholderName: row.stallholder_name,
                  username: generatedUsername,
                  password: generatedPassword,
                  stallNo: row.stall_no,
                  branchName: branchName,
                  businessName: row.business_name
                });
                
                console.log(`✅ Account created for ${row.stallholder_name} (${email})`);
              }
            }

            // Create stallholder record
            const [stallholderResult] = await connection.execute(
              `INSERT INTO stallholder (
                 applicant_id, stallholder_name, contact_number, email, address,
                 business_name, business_type, branch_id, stall_id,
                 contract_start_date, contract_end_date, contract_status,
                 lease_amount, monthly_rent, payment_status, notes,
                 created_by_business_manager, date_created, updated_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, 'pending', ?, ?, NOW(), NOW())`,
              [
                applicantId, // Link to applicant if created
                row.stallholder_name,
                row.contact_number || null,
                row.email || null,
                row.address || null,
                row.business_name || null,
                row.business_type || null,
                branchId,
                stallId,
                row.contract_start_date,
                row.contract_end_date,
                row.lease_amount || row.monthly_rent,
                row.monthly_rent,
                row.notes || `Imported from Excel. Area: ${row.area_occupied || 'N/A'} sqm, Rate/sqm: ${row.rate_per_sqm || 'N/A'}, Discounted: ${row.discounted_rate || 'N/A'}`,
                managerId
              ]
            );

            imported++;
          } catch (rowError) {
            importErrors.push({
              row: row.row_number || i + 1,
              stall_no: row.stall_no,
              error: rowError.message
            });
            skipped++;
          }
        }

        await connection.commit();

        // Send welcome emails to newly created accounts (after commit to ensure data is saved)
        for (const account of accountsInfo) {
          try {
            await emailService.sendStallholderWelcomeEmail(account);
            emailsSent++;
            console.log(`📧 Welcome email sent to ${account.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send email to ${account.email}:`, emailError.message);
          }
        }

        res.json({
          success: true,
          message: `Successfully imported ${imported} stallholders`,
          data: {
            imported,
            skipped,
            stallsCreated,
            accountsCreated,
            emailsSent,
            total: data.length,
            errors: importErrors.slice(0, 10)
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Error importing Excel data:', error);
      res.status(500).json({
        success: false,
        message: 'Error importing Excel data',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  },

  /**
   * Get violation history for a specific stallholder
   * @route GET /api/stallholders/:id/violations
   */
  getViolationHistory: async (req, res) => {
    let connection;
    try {
      const { id } = req.params;

      console.log(`📋 Fetching violation history for stallholder ID: ${id}`);

      connection = await createConnection();

      // Use direct query instead of stored procedure for compatibility
      const [records] = await connection.execute(`
        SELECT 
          vr.report_id AS violation_id,
          vr.stallholder_id,
          vr.violation_id AS violation_type_id,
          v.violation_type AS violation_name,
          v.description AS violation_description,
          v.default_penalty AS severity,
          vr.report_date,
          vr.offense_count,
          vr.penalty_amount,
          vr.payment_status,
          vr.paid_date,
          vr.remarks,
          vr.status,
          vr.created_at
        FROM violation_report vr
        LEFT JOIN violation v ON vr.violation_id = v.violation_id
        WHERE vr.stallholder_id = ?
        ORDER BY vr.report_date DESC
      `, [id]);

      const violations = records || [];

      console.log(`✅ Found ${violations.length} violations for stallholder ${id}`);

      res.json({
        success: true,
        data: violations,
        count: violations.length
      });

    } catch (error) {
      console.error('❌ Error fetching violation history:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching violation history',
        error: error.message
      });
    } finally {
      if (connection) await connection.end();
    }
  }
};

export default StallholderController;

