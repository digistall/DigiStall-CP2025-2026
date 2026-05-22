import { createConnection } from '../../../config/database.js';
import { validateFaceImage } from '../../../services/faceAnalysisService.js';

const ENCRYPTION_KEY = process.env.FACE_ENCRYPTION_KEY || 'NagaStallSecureFaceEncryption2026';

export const checkFaceVerification = async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ success: false, message: 'Stallholder ID is required' });
  }

  let connection;
  try {
    connection = await createConnection();
    
    const [rows] = await connection.execute(
      'SELECT face_id FROM face_verification WHERE stallholder_id = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    res.json({
      success: true,
      hasVerifiedFace: rows.length > 0
    });
  } catch (error) {
    console.error('Error checking face verification:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  } finally {
    if (connection) await connection.end();
  }
};

export const uploadFaceVerification = async (req, res) => {
  const stallholder_id = req.body.stallholder_id;
  const file = req.file;

  if (!stallholder_id || !file) {
    return res.status(400).json({ success: false, message: 'Stallholder ID and image file are required' });
  }

  let connection;
  try {
    // 1. Analyze face first using AI validation service
    const aiValidation = await validateFaceImage(file.buffer);
    
    if (!aiValidation.isValid) {
      return res.json({
        success: false,
        message: aiValidation.message || 'Face validation failed. Please try again.'
      });
    }

    let imageBuffer = file.buffer;
    if (aiValidation.rotatedBuffer) {
      console.log('🔄 Saving rotated upright face verification image');
      imageBuffer = aiValidation.rotatedBuffer;
    }

    // 2. Call the stored procedure to encrypt and insert
    connection = await createConnection();
    
    // Set wait_timeout just in case
    await connection.query('SET SESSION wait_timeout = 28800');
    
    const [result] = await connection.query(
      'CALL sp_insertFaceVerification(?, ?, ?, ?)',
      [stallholder_id, imageBuffer, file.mimetype, ENCRYPTION_KEY]
    );

    res.json({
      success: true,
      message: 'Face verified and saved successfully',
      face_id: result[0] && result[0][0] ? result[0][0].face_id : null
    });
  } catch (error) {
    console.error('Error uploading face verification:', error);
    res.status(500).json({ success: false, message: 'Server error during upload' });
  } finally {
    if (connection) await connection.end();
  }
};
