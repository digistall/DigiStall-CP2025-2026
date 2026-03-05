/**
 * Document Routes (Web)
 * Routes for web frontend to access stallholder document submissions
 * 
 * Uses the actual `stallholder_documents` table.
 * When a person owns multiple stalls (multiple stallholder records with the same applicant_id),
 * documents are shared — we look up all stallholder_ids belonging to the same applicant.
 * 
 * @route /api/documents
 */

import express from 'express';
import { createConnection } from '../config/database.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware.authenticateToken);

/**
 * @route GET /api/documents/stallholder/:stallholderId/submissions
 * @desc Get all documents for a stallholder (shared across all stalls owned by the same person)
 * @access Protected
 */
router.get('/stallholder/:stallholderId/submissions', async (req, res) => {
  let connection;
  try {
    const { stallholderId } = req.params;

    if (!stallholderId) {
      return res.status(400).json({
        success: false,
        message: 'stallholderId is required'
      });
    }

    connection = await createConnection();

    // First, find the applicant_id for this stallholder so we can get docs across all their stalls
    const [stallholderRows] = await connection.execute(
      'SELECT applicant_id FROM stallholder WHERE stallholder_id = ?',
      [parseInt(stallholderId)]
    );

    if (stallholderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stallholder not found'
      });
    }

    const applicantId = stallholderRows[0].applicant_id;

    // Get all stallholder_ids belonging to the same applicant (same person, possibly multiple stalls)
    const [siblingRows] = await connection.execute(
      'SELECT stallholder_id FROM stallholder WHERE applicant_id = ?',
      [applicantId]
    );
    const siblingIds = siblingRows.map(r => r.stallholder_id);

    // Get all documents for ANY stallholder_id belonging to this person
    const placeholders = siblingIds.map(() => '?').join(',');
    const [documents] = await connection.execute(`
      SELECT 
        sd.document_id,
        sd.stallholder_id,
        sd.document_type_id,
        sd.document_type,
        sd.document_name,
        sd.document_name AS file_name,
        sd.document_mime_type,
        sd.document_mime_type AS file_type,
        LENGTH(sd.document_data) AS file_size,
        sd.verification_status AS status,
        sd.verified_by AS reviewed_by,
        sd.verified_at AS reviewed_at,
        sd.remarks,
        sd.created_at AS uploaded_at
      FROM stallholder_documents sd
      WHERE sd.stallholder_id IN (${placeholders})
      ORDER BY sd.created_at DESC
    `, siblingIds);

    // Normalize status to lowercase for consistent frontend comparison
    const normalizedDocs = documents.map(doc => ({
      ...doc,
      status: doc.status ? doc.status.toLowerCase() : 'pending'
    }));

    res.status(200).json({
      success: true,
      message: 'Document submissions retrieved successfully',
      data: normalizedDocs,
      total: normalizedDocs.length
    });

  } catch (error) {
    console.error('❌ Error fetching stallholder documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document submissions',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
});

/**
 * @route GET /api/documents/stallholder/:stallholderId/submissions/:submissionId/blob
 * @desc Get document BLOB data (for viewing/downloading)
 * @access Protected
 */
router.get('/stallholder/:stallholderId/submissions/:submissionId/blob', async (req, res) => {
  let connection;
  try {
    const { stallholderId, submissionId } = req.params;

    connection = await createConnection();

    // Find all sibling stallholder_ids for the same person
    const [stallholderRows] = await connection.execute(
      'SELECT applicant_id FROM stallholder WHERE stallholder_id = ?',
      [parseInt(stallholderId)]
    );

    if (stallholderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stallholder not found' });
    }

    const [siblingRows] = await connection.execute(
      'SELECT stallholder_id FROM stallholder WHERE applicant_id = ?',
      [stallholderRows[0].applicant_id]
    );
    const siblingIds = siblingRows.map(r => r.stallholder_id);
    const placeholders = siblingIds.map(() => '?').join(',');

    const [rows] = await connection.execute(`
      SELECT document_data, document_mime_type, document_name
      FROM stallholder_documents
      WHERE document_id = ? AND stallholder_id IN (${placeholders})
    `, [parseInt(submissionId), ...siblingIds]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const doc = rows[0];
    res.setHeader('Content-Type', doc.document_mime_type || 'application/octet-stream');
    if (doc.document_name) {
      res.setHeader('Content-Disposition', `inline; filename="${doc.document_name}"`);
    }
    res.send(doc.document_data);

  } catch (error) {
    console.error('❌ Error fetching document blob:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
});

/**
 * @route GET /api/documents/blob/:documentId
 * @desc Get document BLOB data by document_id (for image preview / download)
 * @access Protected
 */
router.get('/blob/:documentId', async (req, res) => {
  let connection;
  try {
    const { documentId } = req.params;

    connection = await createConnection();

    const [rows] = await connection.execute(`
      SELECT document_data, document_mime_type, document_name
      FROM stallholder_documents
      WHERE document_id = ?
    `, [parseInt(documentId)]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const doc = rows[0];
    res.setHeader('Content-Type', doc.document_mime_type || 'application/octet-stream');
    if (doc.document_name) {
      res.setHeader('Content-Disposition', `inline; filename="${doc.document_name}"`);
    }
    res.send(doc.document_data);

  } catch (error) {
    console.error('❌ Error fetching document blob by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
});

/**
 * @route PUT /api/documents/:documentId/review
 * @desc Approve or reject a stallholder document
 * @access Protected
 */
router.put('/:documentId/review', async (req, res) => {
  let connection;
  try {
    const { documentId } = req.params;
    const { status, rejection_reason, remarks } = req.body;
    const reviewedBy = req.user?.userId || req.user?.businessManagerId || req.user?.id || null;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected"'
      });
    }

    if (status === 'rejected' && !rejection_reason && !remarks) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when rejecting a document'
      });
    }

    // Capitalize status to match DB enum: 'Pending', 'Approved', 'Rejected'
    const dbStatus = status.charAt(0).toUpperCase() + status.slice(1);
    const reasonText = rejection_reason || remarks || null;

    connection = await createConnection();

    // Use direct UPDATE - the table column is 'remarks', not 'rejection_reason'
    await connection.execute(
      `UPDATE stallholder_documents 
       SET verification_status = ?, remarks = ?, verified_by = ?, verified_at = NOW() 
       WHERE document_id = ?`,
      [dbStatus, reasonText, reviewedBy, parseInt(documentId)]
    );

    res.json({
      success: true,
      message: `Document ${status} successfully`,
      data: {
        document_id: parseInt(documentId),
        new_status: status,
        reviewed_by: reviewedBy
      }
    });

  } catch (error) {
    console.error('\u274c Error reviewing document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review document',
      error: error.message
    });
  } finally {
    if (connection) await connection.end();
  }
});

export default router;
