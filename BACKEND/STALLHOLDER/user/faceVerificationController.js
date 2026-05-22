import { createConnection } from '../../../config/database.js';
import { compressBuffer } from '../../../config/imageCompression.js';
import { validateFaceImage } from '../../../services/faceAnalysisService.js';

/**
 * Upload and verify a face image
 */
export async function uploadFaceVerification(req, res) {
  let connection;
  try {
    const { stallholder_id } = req.body;
    const file = req.file;

    if (!stallholder_id) {
      return res.status(400).json({ success: false, message: 'stallholder_id is required' });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const mimeType = file.mimetype || 'image/jpeg';
    let imageBuffer = file.buffer;

    // 1. AI Validation
    const validation = await validateFaceImage(imageBuffer);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    // 2. Use rotated buffer if face detection corrected orientation
    if (validation.rotatedBuffer) {
      console.log('🔄 Saving rotated upright face verification image');
      imageBuffer = validation.rotatedBuffer;
    }

    // 3. Encrypt and save to DB
    const encryptionKey = process.env.DATA_ENCRYPTION_KEY || 'DigiStall2025SecureKeyForEncryption123';
    connection = await createConnection();

    // Delete existing face verification records for this stallholder first
    console.log(`🧹 Deleting existing face verification records for stallholder ID: ${stallholder_id}`);
    await connection.execute(
      'DELETE FROM face_verification WHERE stallholder_id = ?',
      [stallholder_id]
    );

    const [result] = await connection.execute(
      'CALL sp_insertFaceVerification(?, ?, ?, ?)',
      [stallholder_id, imageBuffer, mimeType, encryptionKey]
    );

    res.status(200).json({
      success: true,
      message: 'Face verified and saved successfully',
      data: { face_id: result[0][0].face_id }
    });

  } catch (error) {
    console.error('Error uploading face verification:', error);
    res.status(500).json({ success: false, message: 'Error uploading face image', error: error.message });
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Check if user has a verified face
 */
export async function checkFaceVerification(req, res) {
  let connection;
  try {
    const { stallholder_id } = req.params;
    connection = await createConnection();

    // Using standard SELECT instead of SP for simple check to avoid decrypting
    const [rows] = await connection.execute(
      'SELECT face_id FROM face_verification WHERE stallholder_id = ? LIMIT 1',
      [stallholder_id]
    );

    const hasVerifiedFace = rows.length > 0;

    res.status(200).json({
      success: true,
      hasVerifiedFace
    });

  } catch (error) {
    console.error('Error checking face verification:', error);
    res.status(500).json({ success: false, message: 'Error checking face status' });
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Get decrypted face image as binary (for Mobile App & Web Admin `<img>` src)
 */
export async function getFaceImageBinary(req, res) {
  let connection;
  try {
    const { stallholder_id } = req.params;
    connection = await createConnection();

    const encryptionKey = process.env.DATA_ENCRYPTION_KEY || 'DigiStall2025SecureKeyForEncryption123';
    
    const [rows] = await connection.execute(
      'CALL sp_getFaceVerification(?, ?)',
      [stallholder_id, encryptionKey]
    );

    const records = rows[0];

    if (!records || records.length === 0 || !records[0].image_data) {
      return res.status(404).json({ success: false, message: 'No face image found' });
    }

    const image = records[0];

    res.set('Content-Type', image.mime_type || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(image.image_data);

  } catch (error) {
    console.error('Error retrieving face image:', error);
    res.status(500).json({ success: false, message: 'Error retrieving face image' });
  } finally {
    if (connection) await connection.end();
  }
}

export default {
  uploadFaceVerification,
  checkFaceVerification,
  getFaceImageBinary
};
