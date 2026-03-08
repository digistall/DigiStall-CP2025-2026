import { createConnection } from '../../../config/database.js';
import ExcelJS from 'exceljs';
import { decryptApplicantData, decryptAES256GCM, isAES256GCMEncrypted } from '../../../services/mysqlDecryptionService.js';

export const getPendingRequests = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    
    const [requests] = await connection.execute(`
      SELECT 
        r.request_id, r.reason, r.move_out_date, r.status, r.created_at,
        sh.full_name as stallholder_name, sh.contact_number,
        s.stall_number, s.stall_name, s.section,
        sh.stallholder_id
      FROM stall_surrender_requests r
      JOIN stallholder sh ON r.stallholder_id = sh.stallholder_id
      JOIN stall s ON r.stall_id = s.stall_id
      WHERE r.status = 'Pending'
      ORDER BY r.created_at DESC
    `);

    const decryptedRequests = await Promise.all(requests.map(async request => {
      return await decryptApplicantData(request);
    }));

    res.status(200).json({
      success: true,
      data: decryptedRequests
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    if (connection) await connection.end();
  }
};

export const updateRequestStatus = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const managerId = req.user.userId;
    const { requestId } = req.params;
    const { status, remarks } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
       return res.status(400).json({ success: false, message: 'Invalid status update.' });
    }

    await connection.execute(
       'UPDATE stall_surrender_requests SET status = ?, remarks = ?, manager_id = ?, updated_at = NOW() WHERE request_id = ?',
       [status, remarks || null, managerId, requestId]
    );

    res.status(200).json({ success: true, message: `Request successfully ${status.toLowerCase()}` });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    if (connection) await connection.end();
  }
};

export const getStallHistory = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const { startDate, endDate, searchName } = req.query;

    let query = `
      SELECT h.*, s.stall_number, s.stall_name
      FROM stallholder_history_logs h
      JOIN stall s ON h.stall_id = s.stall_id
      WHERE 1=1
    `;
    const params = [];

    if (startDate && endDate) {
      query += ` AND h.lease_end_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    if (searchName) {
      query += ` AND h.user_fullname LIKE ?`;
      params.push(`%${searchName}%`);
    }

    query += ` ORDER BY h.lease_end_date DESC`;

    const [logs] = await connection.execute(query, params);

    const decryptedLogs = logs.map(log => {
      if (isAES256GCMEncrypted(log.user_fullname)) {
        return {
          ...log,
          user_fullname: decryptAES256GCM(log.user_fullname)
        };
      }
      return log;
    });

    res.status(200).json({
      success: true,
      data: decryptedLogs
    });
  } catch (error) {
    console.error('Error fetching stall tracker history:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    if (connection) await connection.end();
  }
};

export const getStallHistoryByStallId = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const { stallId } = req.params;

    const [logs] = await connection.execute(`
      SELECT * FROM stallholder_history_logs 
      WHERE stall_id = ?
      ORDER BY lease_end_date DESC
    `, [stallId]);

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    if (connection) await connection.end();
  }
};

export const importHistoryFromExcel = async (req, res) => {
  let connection;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    connection = await createConnection();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];

    // Read the rows and insert manually for legacy data
    let imported = 0;
    
    // Start Transaction
    await connection.beginTransaction();

    // Iterate over rows starting from 2 (assuming row 1 is headers)
    for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        
        const stallNumber = row.getCell(1).value;
        const userFullName = row.getCell(2).value;
        const leaseStartDate = row.getCell(3).value;
        const leaseEndDate = row.getCell(4).value;
        const surrenderReason = row.getCell(5).value || 'Legacy Data Migration';
        
        if (!stallNumber || !userFullName) continue;

        // Find stall ID from stall number
        const [stallRes] = await connection.execute('SELECT stall_id FROM stall WHERE stall_number = ?', [stallNumber]);
        if (stallRes.length === 0) continue; // Skip unknown stalls

        const stallId = stallRes[0].stall_id;

        await connection.execute(`
          INSERT INTO stallholder_history_logs 
          (stall_id, stallholder_id, user_fullname, lease_start_date, lease_end_date, surrender_reason, feedback_to_next_tenant, processed_by_employee_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [stallId, 0, userFullName, leaseStartDate, leaseEndDate, surrenderReason, 'Imported from legacy system', req.user.userId]);
        
        imported++;
    }

    await connection.commit();

    res.status(200).json({ success: true, message: `Successfully imported ${imported} legacy history records.` });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Import error:', error);
    res.status(500).json({ success: false, message: 'Failed to import Excel data', error: error.message });
  } finally {
    if (connection) await connection.end();
  }
};
