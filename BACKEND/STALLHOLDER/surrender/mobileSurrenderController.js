import { createConnection } from '../../../config/database.js';
import { decryptApplicantData } from '../../../services/mysqlDecryptionService.js';
import { calculateStallholderPaymentStatus } from '../../config/paymentStatusHelper.js';

export const checkEligibility = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const userId = req.user.userId;
    const stallId = req.params.stallId;

    // Get the specific stallholder associated with this mobile user and this stall
    const [stallholders] = await connection.execute(
      'SELECT stallholder_id, stall_id FROM stallholder WHERE (applicant_id = ? OR mobile_user_id = ?) AND stall_id = ? LIMIT 1',
      [userId, userId, stallId]
    );

    if (!stallholders || stallholders.length === 0) {
      return res.status(404).json({ success: false, message: 'Stallholder record not found.' });
    }

    const stallholderId = stallholders[0].stallholder_id;

    if (!stallId) {
       return res.status(400).json({ success: false, message: 'You do not own an active stall.' });
    }

    // Check Payments (outstanding balances) using REAL-TIME calculation from payments table
    const [shInfo] = await connection.execute(
      "SELECT sh.move_in_date, s.rental_price as monthly_rent FROM stallholder sh JOIN stall s ON sh.stall_id = s.stall_id WHERE sh.stallholder_id = ?",
      [stallholderId]
    );
    let isUnpaid = true; // default to unpaid (safe fallback)
    if (shInfo.length > 0 && shInfo[0].move_in_date && shInfo[0].monthly_rent) {
      const computedStatus = await calculateStallholderPaymentStatus(
        connection, stallholderId, shInfo[0].move_in_date, parseFloat(shInfo[0].monthly_rent)
      );
      isUnpaid = (computedStatus !== 'paid' && computedStatus !== 'partial');
      // Self-heal the stale column while we're here
      try {
        await connection.execute(
          "UPDATE stallholder SET payment_status = ? WHERE stallholder_id = ?",
          [computedStatus, parseInt(stallholderId)]
        );
      } catch (healErr) {
        console.error(`⚠️ Failed to self-heal payment_status for stallholder ${stallholderId}:`, healErr.message);
      }
    } else {
      console.warn(`⚠️ Missing move_in_date or monthly_rent for stallholder ${stallholderId}, defaulting to unpaid`);
    }

    // Check Violations (active violations)
    const [[{ active_violations }]] = await connection.execute(
      "SELECT COUNT(*) as active_violations FROM violation_report WHERE stallholder_id = ? AND status = 'Open'",
      [stallholderId]
    );

    const eligible = (!isUnpaid && active_violations === 0);

    return res.status(200).json({
      success: true,
      data: {
        eligible,
        unpaidCount: isUnpaid ? 1 : 0,
        activeViolations: active_violations,
        stallId: stallId,
        stallholderId: stallholderId
      }
    });
  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify eligibility', error: error.message });
  } finally {
    if (connection) await connection.end();
  }
};

export const submitSurrenderRequest = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const userId = req.user.userId;
    const { stall_id, reason, moveOutDate } = req.body;

    if(!stall_id || !reason || !moveOutDate) {
      return res.status(400).json({ success: false, message: 'Stall ID, reason, and move-out date are required.' });
    }

    // Get the stallholder
    const [stallholders] = await connection.execute(
      'SELECT stallholder_id, stall_id FROM stallholder WHERE (applicant_id = ? OR mobile_user_id = ?) AND stall_id = ? LIMIT 1',
      [userId, userId, stall_id]
    );

    if (!stallholders || stallholders.length === 0) {
      return res.status(404).json({ success: false, message: 'Stallholder record not found.' });
    }

    const stallholderId = stallholders[0].stallholder_id;
    const stallId = stallholders[0].stall_id;

    if (!stallId) {
       return res.status(400).json({ success: false, message: 'You do not own an active stall.' });
    }

    // Check if a request already exists
    const [existing] = await connection.execute(
       "SELECT * FROM stall_surrender_requests WHERE stallholder_id = ? AND (status='Pending' OR status='Approved')",
       [stallholderId]
    );

    if (existing.length > 0) {
       return res.status(400).json({ success: false, message: `You already have an active surrender request (${existing[0].status}).` });
    }

    await connection.execute(
      "INSERT INTO stall_surrender_requests (stallholder_id, stall_id, reason, move_out_date, status) VALUES (?, ?, ?, ?, 'Pending')",
      [stallholderId, stallId, reason, moveOutDate]
    );

    return res.status(200).json({
      success: true,
      message: 'Surrender request submitted successfully for manager approval.'
    });
  } catch (error) {
    console.error('Submit surrender error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit surrender request', error: error.message });
  } finally {
    if (connection) await connection.end();
  }
};

export const getSurrenderStatus = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const userId = req.user.userId;
    const stallId = req.params.stallId;

    // Get the stallholder
    const [stallholders] = await connection.execute(
      'SELECT stallholder_id FROM stallholder WHERE (applicant_id = ? OR mobile_user_id = ?) AND stall_id = ? LIMIT 1',
      [userId, userId, stallId]
    );

    if (!stallholders || stallholders.length === 0) {
      return res.status(404).json({ success: false, message: 'Stallholder record not found.' });
    }

    const stallholderId = stallholders[0].stallholder_id;

    const [requests] = await connection.execute(
       'SELECT * FROM stall_surrender_requests WHERE stallholder_id = ? ORDER BY created_at DESC LIMIT 1',
       [stallholderId]
    );

    return res.status(200).json({
      success: true,
      data: requests.length > 0 ? requests[0] : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch surrender status' });
  } finally {
    if (connection) await connection.end();
  }
};

export const submitExitSurvey = async (req, res) => {
  let connection;
  try {
    connection = await createConnection();
    const userId = req.user.userId;
    const { requestId, stall_id, feedback } = req.body;

    if (!requestId || !stall_id || !feedback) {
       return res.status(400).json({ success: false, message: 'Request ID, Stall ID, and feedback are required.' });
    }

    // Get the stallholder
    const [stallholders] = await connection.execute(
      'SELECT stallholder_id, stall_id FROM stallholder WHERE (applicant_id = ? OR mobile_user_id = ?) AND stall_id = ? LIMIT 1',
      [userId, userId, stall_id]
    );

    if (!stallholders || stallholders.length === 0) {
      return res.status(404).json({ success: false, message: 'Stallholder record not found.' });
    }

    const stallholderId = stallholders[0].stallholder_id;
    const stallId = stallholders[0].stall_id;

    // Verify request is Approved
    const [requests] = await connection.execute(
       "SELECT * FROM stall_surrender_requests WHERE request_id = ? AND stallholder_id = ? AND status = 'Approved'",
       [requestId, stallholderId]
    );

    if (requests.length === 0) {
       return res.status(400).json({ success: false, message: 'Surrender request not found or not yet approved.' });
    }

    const employeeId = requests[0].manager_id || 1; // fallback if manager not set 

    // Execute ATOMIC Stored Procedure
    await connection.execute(
      'CALL sp_ProcessStallSurrender(?, ?, ?, ?, ?)',
      [requestId, stallId, stallholderId, employeeId, feedback]
    );

    return res.status(200).json({
      success: true,
      message: 'Exit survey submitted! Stall has been surrendered.'
    });
  } catch (error) {
    console.error('Exit survey error:', error);
    res.status(500).json({ success: false, message: 'Failed to process stall surrender.', error: error.message });
  } finally {
    if (connection) await connection.end();
  }
};
