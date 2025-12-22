import { createConnection } from '../../config/database.js';
import { getBranchFilter } from '../../middleware/rolePermissions.js';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcrypt';
import emailService from '../../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      
      let query;
      let params = [];
      
      if (branchFilter === null) {
        // System administrator - see all stallholders
        console.log('✅ System admin - fetching all stallholders');
        query = `
          SELECT sh.*, b.branch_name, st.stall_no
          FROM stallholder sh
          LEFT JOIN branch b ON sh.branch_id = b.branch_id
          LEFT JOIN stall st ON sh.stall_id = st.stall_id
          ORDER BY sh.date_created DESC
        `;
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
        query = `
          SELECT sh.*, b.branch_name, st.stall_no
          FROM stallholder sh
          LEFT JOIN branch b ON sh.branch_id = b.branch_id
          LEFT JOIN stall st ON sh.stall_id = st.stall_id
          WHERE sh.branch_id IN (${branchFilter.map(() => '?').join(',')})
          ORDER BY sh.date_created DESC
        `;
        params = branchFilter;
      }
      
      console.log('📝 Executing query with params:', params);
      const [rows] = await connection.execute(query, params);
      
      console.log(`✅ Found ${rows.length} stallholders`);
      res.json({
        success: true,
        data: rows,
        total: rows.length
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
      
      res.json({
        success: true,
        data: rows[0][0]
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
        'SELECT floor_id FROM floor WHERE branch_id = ? AND status = "Active" LIMIT 1',
        [branchId]
      );
      
      if (floors.length > 0) {
        defaultFloorId = floors[0].floor_id;
        const [sections] = await connection.execute(
          'SELECT section_id FROM section WHERE floor_id = ? AND status = "Active" LIMIT 1',
          [defaultFloorId]
        );
        if (sections.length > 0) {
          defaultSectionId = sections[0].section_id;
        } else {
          const [sectionResult] = await connection.execute(
            'INSERT INTO section (floor_id, section_name, status) VALUES (?, ?, "Active")',
            [defaultFloorId, 'General']
          );
          defaultSectionId = sectionResult.insertId;
        }
      } else {
        const [floorResult] = await connection.execute(
          'INSERT INTO floor (branch_id, floor_name, floor_number, status) VALUES (?, ?, 1, "Active")',
          [branchId, 'Ground Floor']
        );
        defaultFloorId = floorResult.insertId;
        const [sectionResult] = await connection.execute(
          'INSERT INTO section (floor_id, section_name, status) VALUES (?, ?, "Active")',
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
      
      // ========== MAIN DATA SHEET (MASTER LIST FORMAT) ==========
      const dataSheet = workbook.addWorksheet('MASTER LIST', {
        properties: { tabColor: { argb: '4472C4' } }
      });
      
      // Define columns matching company's MASTERLIST format with rental calculation
      dataSheet.columns = [
        // Stall Info
        { header: 'B/S NO.', key: 'stall_no', width: 12 },
        { header: 'REGISTERED NAME', key: 'stallholder_name', width: 30 },
        // Rental Calculation (matching company MASTERLIST format)
        { header: 'NEW AREA OCCUPIED', key: 'area_occupied', width: 18 },
        { header: 'RENTAL RATE (2010)', key: 'base_rate', width: 18 },  // Base rate for calculation
        { header: 'RATE PER SQ. METER', key: 'rate_per_sqm', width: 18 },
        { header: 'MONTHLY RENT', key: 'monthly_rent', width: 15 },  // = BASE RATE × 2
        { header: 'DISCOUNTED RATE (25% OFF)', key: 'discounted_rate', width: 22 },  // For early payment
        // Contact Info
        { header: 'CONTACT NUMBER', key: 'contact_number', width: 18 },
        { header: 'EMAIL', key: 'email', width: 30 },
        { header: 'ADDRESS', key: 'address', width: 40 },
        // Applicant Personal Info
        { header: 'BIRTHDATE', key: 'birthdate', width: 14 },
        { header: 'CIVIL STATUS', key: 'civil_status', width: 14 },
        { header: 'EDUCATIONAL ATTAINMENT', key: 'education', width: 25 },
        // Spouse Info
        { header: 'SPOUSE NAME', key: 'spouse_name', width: 30 },
        { header: 'SPOUSE BIRTHDATE', key: 'spouse_birthdate', width: 16 },
        { header: 'SPOUSE CONTACT', key: 'spouse_contact', width: 18 },
        { header: 'SPOUSE OCCUPATION', key: 'spouse_occupation', width: 20 },
        { header: 'SPOUSE EDUCATION', key: 'spouse_education', width: 22 },
        // Business Info
        { header: 'NATURE OF BUSINESS', key: 'nature_of_business', width: 40 },
        { header: 'CAPITALIZATION', key: 'capitalization', width: 18 },
        { header: 'SOURCE OF CAPITAL', key: 'source_of_capital', width: 25 },
        { header: 'PREVIOUS BUSINESS EXP.', key: 'prev_business_exp', width: 30 },
        { header: 'RELATIVE STALL OWNER', key: 'relative_stall_owner', width: 20 },
        // Contract Info
        { header: 'CONTRACT START', key: 'contract_start_date', width: 16 },
        { header: 'CONTRACT END', key: 'contract_end_date', width: 16 },
        { header: 'PAYMENT STATUS', key: 'payment_status', width: 16 },
        // Location Info
        { header: 'FLOOR', key: 'floor_name', width: 15 },
        { header: 'SECTION', key: 'section_name', width: 20 },
        { header: 'STALL LOCATION', key: 'stall_location', width: 25 },
        { header: 'STALL SIZE', key: 'stall_size', width: 12 }
      ];
      
      // Style header row
      const headerRow = dataSheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      headerRow.height = 35;
      
      // Add existing stallholders data with rental calculation (MASTERLIST formula)
      if (existingStallholders.length > 0) {
        existingStallholders.forEach((sh) => {
          // Get values from database
          let areaOccupied = sh.area_sqm || '';
          let monthlyRent = sh.monthly_rent || sh.rental_price || 0;
          
          // RENTAL CALCULATION FORMULA (based on MASTERLIST):
          // NEW RATE FOR 2013 = RENTAL RATE (2010) × 2
          // DISCOUNTED = NEW RATE FOR 2013 × 0.75 (25% off for early payment)
          // So: Base Rate = Monthly Rent / 2
          let baseRate = sh.base_rate || '';
          if (!baseRate && monthlyRent > 0) {
            baseRate = (monthlyRent / 2).toFixed(2);
          }
          
          // Rate per sq.m = Monthly Rent / Area
          let ratePerSqm = sh.rate_per_sqm || '';
          if (!ratePerSqm && monthlyRent && areaOccupied) {
            ratePerSqm = (monthlyRent / areaOccupied).toFixed(2);
          }
          
          // If area not set, try to calculate from monthly rent and rate
          if (!areaOccupied && monthlyRent && ratePerSqm) {
            areaOccupied = (monthlyRent / ratePerSqm).toFixed(2);
          }
          
          // DISCOUNTED RATE: For early payment (additional 25% off from monthly rent)
          // This is separate from the formula calculation
          const discountedRate = monthlyRent ? (monthlyRent * 0.75).toFixed(2) : '';
          
          dataSheet.addRow({
            stall_no: sh.stall_no || '',
            stallholder_name: sh.stallholder_name || '',
            area_occupied: areaOccupied,
            base_rate: baseRate,  // RENTAL RATE (2010)
            rate_per_sqm: ratePerSqm,
            monthly_rent: monthlyRent,
            discounted_rate: discountedRate,
            contact_number: sh.contact_number || '',
            email: sh.email || '',
            address: sh.address || '',
            // Applicant info
            birthdate: sh.applicant_birthdate ? new Date(sh.applicant_birthdate).toISOString().split('T')[0] : '',
            civil_status: sh.applicant_civil_status || '',
            education: sh.applicant_educational_attainment || '',
            // Spouse info
            spouse_name: sh.spouse_full_name || '',
            spouse_birthdate: sh.spouse_birthdate ? new Date(sh.spouse_birthdate).toISOString().split('T')[0] : '',
            spouse_contact: sh.spouse_contact_number || '',
            spouse_occupation: sh.spouse_occupation || '',
            spouse_education: sh.spouse_educational_attainment || '',
            // Business info
            nature_of_business: sh.nature_of_business || sh.business_type || '',
            capitalization: sh.capitalization || '',
            source_of_capital: sh.source_of_capital || '',
            prev_business_exp: sh.previous_business_experience || '',
            relative_stall_owner: sh.relative_stall_owner || '',
            // Contract info
            contract_start_date: sh.contract_start_date ? new Date(sh.contract_start_date).toISOString().split('T')[0] : '',
            contract_end_date: sh.contract_end_date ? new Date(sh.contract_end_date).toISOString().split('T')[0] : '',
            payment_status: sh.payment_status || '',
            // Location info
            floor_name: sh.floor_name || '',
            section_name: sh.section_name || '',
            stall_location: sh.stall_location || '',
            stall_size: sh.stall_size || ''
          });
        });
      }
      
      // Add data validation and formatting
      const lastRow = Math.max(existingStallholders.length + 1, 100);
      for (let i = 2; i <= lastRow; i++) {
        // Currency columns (C, D, E, F, S)
        ['C', 'D', 'E', 'F', 'S'].forEach(col => {
          dataSheet.getCell(`${col}${i}`).numFmt = '#,##0.00';
        });
      }
      
      // Freeze header row
      dataSheet.views = [{ state: 'frozen', ySplit: 1 }];
      
      // ========== INSTRUCTIONS SHEET ==========
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
        '💰 DISCOUNT CALCULATION (25% Early Payment Discount):',
        '   • MONTHLY RENT = AREA OCCUPIED × RATE PER SQ. METER',
        '   • DISCOUNTED RATE = MONTHLY RENT × 0.75 (25% discount)',
        '   • Example: ₱4,996.92 × 0.75 = ₱3,747.69',
        '',
        '═══════════════════════════════════════════════════════════════════════════',
        '',
        '📁 DATA INCLUDED:',
        '',
        '🏪 STALL INFORMATION:',
        '   • B/S NO. - Stall number (e.g., B1-S1)',
        '   • REGISTERED NAME - Full name of stallholder',
        '   • NEW AREA OCCUPIED - Area in square meters',
        '   • RATE PER SQ. METER - Rental rate per sqm',
        '   • MONTHLY RENT - Total monthly rental',
        '   • DISCOUNTED RATE - 25% early payment discount',
        '',
        '👤 PERSONAL INFORMATION:',
        '   • CONTACT NUMBER - Phone number',
        '   • EMAIL - Email address',
        '   • ADDRESS - Complete address',
        '   • BIRTHDATE - Date of birth',
        '   • CIVIL STATUS - Single/Married/Divorced/Widowed',
        '   • EDUCATIONAL ATTAINMENT - Highest education',
        '',
        '💑 SPOUSE INFORMATION (if married):',
        '   • SPOUSE NAME - Full name',
        '   • SPOUSE BIRTHDATE - Date of birth',
        '   • SPOUSE CONTACT - Contact number',
        '   • SPOUSE OCCUPATION - Job/Profession',
        '   • SPOUSE EDUCATION - Educational attainment',
        '',
        '💼 BUSINESS INFORMATION:',
        '   • NATURE OF BUSINESS - Type of business',
        '   • CAPITALIZATION - Initial capital amount',
        '   • SOURCE OF CAPITAL - Where capital came from',
        '   • PREVIOUS BUSINESS EXP. - Past business experience',
        '   • RELATIVE STALL OWNER - If related to existing stallholder',
        '',
        '📝 CONTRACT INFORMATION:',
        '   • CONTRACT START - Start date',
        '   • CONTRACT END - End date',
        '   • PAYMENT STATUS - current/paid/overdue/pending',
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
        } else if (text.startsWith('🏪') || text.startsWith('👤') || text.startsWith('💑') || text.startsWith('💼') || text.startsWith('📝') || text.startsWith('⚠️') || text.startsWith('📁')) {
          row.font = { bold: true, size: 12 };
        } else if (text.startsWith('═')) {
          row.font = { color: { argb: '808080' } };
        }
      });
      
      // ========== REFERENCE DATA SHEET ==========
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
      
      // Set response headers
      const filename = `MASTER_LIST_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        // NEW RATE FOR 2013 = This IS the monthly rent (direct from Excel)
        // DISCOUNTED = NEW RATE FOR 2013 × 0.75 (25% off for early payment)
        let calculatedMonthlyRent = 0;
        let calculatedRatePerSqm = 0;
        
        // Check if MASTERLIST format (has B/S NO. header)
        const isMasterlistFormat = headers['B/S NO.'] !== undefined;
        
        // Try to get NEW RATE FOR 2013 directly first
        const newRate2013 = parseFloat(getCellValue('NEW RATE FOR 2013') || 0);
        
        if (newRate2013 > 0) {
          // NEW RATE FOR 2013 IS the monthly rent
          calculatedMonthlyRent = Math.round(newRate2013 * 100) / 100;
          if (rawAreaOccupied > 0) {
            calculatedRatePerSqm = Math.round((calculatedMonthlyRent / rawAreaOccupied) * 100) / 100;
          }
          console.log(`📊 Monthly Rent (NEW RATE 2013): ${calculatedMonthlyRent}`);
        } else if (isMasterlistFormat && rawBaseRate > 0) {
          // Fallback: Calculate from RENTAL RATE (2010) × 2
          calculatedMonthlyRent = Math.round(rawBaseRate * 2 * 100) / 100;
          if (rawAreaOccupied > 0) {
            calculatedRatePerSqm = Math.round((calculatedMonthlyRent / rawAreaOccupied) * 100) / 100;
          }
          console.log(`📊 MASTERLIST Rental Calc: Base Rate ${rawBaseRate} × 2 = ${calculatedMonthlyRent}`);
        } else {
          // Standard format: Use provided monthly rent directly
          calculatedMonthlyRent = parseFloat(getCellValue('MONTHLY RENT') || getCellValue('NEW RATE FOR 2013') || getCellValue('DISCOUNTED') || 0);
          calculatedRatePerSqm = parseFloat(getCellValue('RATE PER SQ. METER') || getCellValue('RATE PER SQ METER') || 0);
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
        'SELECT floor_id, floor_name FROM floor WHERE branch_id = ? AND status = "Active" LIMIT 1',
        [branchId]
      );
      
      if (floors.length > 0) {
        defaultFloorId = floors[0].floor_id;
        
        // Get default section for this floor
        const [sections] = await connection.execute(
          'SELECT section_id FROM section WHERE floor_id = ? AND status = "Active" LIMIT 1',
          [defaultFloorId]
        );
        
        if (sections.length > 0) {
          defaultSectionId = sections[0].section_id;
        } else {
          // Create default section
          const [sectionResult] = await connection.execute(
            'INSERT INTO section (floor_id, section_name, status) VALUES (?, ?, "Active")',
            [defaultFloorId, 'General']
          );
          defaultSectionId = sectionResult.insertId;
        }
      } else {
        // Create default floor
        const [floorResult] = await connection.execute(
          'INSERT INTO floor (branch_id, floor_name, floor_number, status) VALUES (?, ?, 1, "Active")',
          [branchId, 'Ground Floor']
        );
        defaultFloorId = floorResult.insertId;
        
        // Create default section
        const [sectionResult] = await connection.execute(
          'INSERT INTO section (floor_id, section_name, status) VALUES (?, ?, "Active")',
          [defaultFloorId, 'General']
        );
        defaultSectionId = sectionResult.insertId;
      }

      // Build floor/section lookup
      const [floorsData] = await connection.execute(
        'SELECT f.floor_id, UPPER(f.floor_name) as floor_name FROM floor f WHERE f.branch_id = ? AND f.status = "Active"',
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
         WHERE f.branch_id = ? AND s.status = "Active"`,
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
  }
};

export default StallholderController;