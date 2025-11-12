import { createConnection } from '../../config/database.js';

/**
 * Stallholder Controller
 * Handles CRUD operations for stallholder management
 */
const StallholderController = {
  
  /**
   * Get all stallholders for a branch with detailed information
   */
  getAllStallholders: async (req, res) => {
    let connection;
    try {
      const { branchId } = req.query;
      const managerBranchId = req.user?.branchId;
      
      // If user is branch manager, filter by their branch
      const targetBranchId = managerBranchId || branchId || null;
      
      connection = await createConnection();
      const [rows] = await connection.execute(
        'CALL getAllStallholdersDetailed(?)',
        [targetBranchId]
      );
      
      res.json({
        success: true,
        data: rows[0],
        total: rows[0].length
      });
    } catch (error) {
      console.error('Error fetching stallholders:', error);
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
   * Import stallholders from Excel file
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

      const XLSX = await import('xlsx');
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const managerId = req.user.managerId || req.user.branchManagerId;
      const branchId = req.user.branchId;
      
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      connection = await createConnection();

      // Process each row
      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i];
          
          // Map Excel columns to database fields (adjust column names as needed)
          const stallholderData = {
            stallholderName: row['Name'] || row['Stallholder Name'] || row['name'],
            contactNumber: row['Contact'] || row['Contact Number'] || row['contact'],
            email: row['Email'] || row['email'],
            address: row['Address'] || row['address'],
            businessName: row['Business Name'] || row['Business'] || row['business_name'],
            businessType: row['Business Type'] || row['Type'] || row['business_type'],
            contractStartDate: row['Contract Start'] || row['Start Date'] || row['contract_start'],
            contractEndDate: row['Contract End'] || row['End Date'] || row['contract_end'],
            leaseAmount: parseFloat(row['Lease Amount'] || row['Lease'] || row['lease_amount'] || 0),
            monthlyRent: parseFloat(row['Monthly Rent'] || row['Rent'] || row['monthly_rent'] || 0),
            notes: row['Notes'] || row['notes'] || ''
          };

          // Validate required fields
          if (!stallholderData.stallholderName || !stallholderData.contractStartDate || 
              !stallholderData.contractEndDate || !stallholderData.leaseAmount) {
            errors.push(`Row ${i + 1}: Missing required fields`);
            errorCount++;
            continue;
          }

          // Create stallholder
          const [result] = await connection.execute(
            'CALL createStallholder(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              null, // applicantId
              stallholderData.stallholderName,
              stallholderData.contactNumber,
              stallholderData.email,
              stallholderData.address,
              stallholderData.businessName,
              stallholderData.businessType,
              branchId,
              null, // stallId
              stallholderData.contractStartDate,
              stallholderData.contractEndDate,
              stallholderData.leaseAmount,
              stallholderData.monthlyRent,
              stallholderData.notes,
              managerId
            ]
          );

          const response = result[0][0];
          if (response.success) {
            successCount++;
          } else {
            errors.push(`Row ${i + 1}: ${response.message}`);
            errorCount++;
          }
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
          errorCount++;
        }
      }

      // Clean up uploaded file
      const fs = await import('fs');
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: `Import completed. ${successCount} successful, ${errorCount} errors.`,
        data: {
          successCount,
          errorCount,
          errors: errors.slice(0, 10) // Limit errors shown
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
   */
  downloadExcelTemplate: async (req, res) => {
    try {
      // For now, return a simple error message indicating this feature is not implemented
      res.status(501).json({
        success: false,
        message: 'Excel template download feature not implemented yet'
      });
    } catch (error) {
      console.error('Error downloading Excel template:', error);
      res.status(500).json({
        success: false,
        message: 'Error downloading Excel template',
        error: error.message
      });
    }
  },

  /**
   * Preview Excel file data before import
   */
  previewExcelData: async (req, res) => {
    try {
      // For now, return a simple error message indicating this feature is not implemented
      res.status(501).json({
        success: false,
        message: 'Excel preview feature not implemented yet'
      });
    } catch (error) {
      console.error('Error previewing Excel data:', error);
      res.status(500).json({
        success: false,
        message: 'Error previewing Excel data',
        error: error.message
      });
    }
  },

  /**
   * Import validated Excel data
   */
  importExcelData: async (req, res) => {
    try {
      // For now, return a simple error message indicating this feature is not implemented
      res.status(501).json({
        success: false,
        message: 'Excel import feature not implemented yet'
      });
    } catch (error) {
      console.error('Error importing Excel data:', error);
      res.status(500).json({
        success: false,
        message: 'Error importing Excel data',
        error: error.message
      });
    }
  }
};

export default StallholderController;