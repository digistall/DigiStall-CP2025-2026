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
    const isRealTime = req.body.validate_only === 'true' || req.body.validate_only === true;
    const validation = await validateFaceImage(imageBuffer, isRealTime);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    // Early return if only validating
    if (isRealTime) {
      console.log('🧪 validate_only mode active. Returning early with validation success!');
      return res.status(200).json({
        success: true,
        message: 'Face validation successful (validate_only mode)'
      });
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
    
    // 1. Try to get image for the exact stallholder_id requested
    const [rows] = await connection.execute(
      'CALL sp_getFaceVerification(?, ?)',
      [stallholder_id, encryptionKey]
    );

    let records = rows[0];

    // 2. If no image found, check if this user has another stall with an image
    if (!records || records.length === 0 || !records[0].image_data) {
      // Find the mobile_user_id or applicant_id for this stallholder
      const [shRows] = await connection.execute(
        'SELECT mobile_user_id, applicant_id FROM stallholder WHERE stallholder_id = ? LIMIT 1',
        [stallholder_id]
      );

      if (shRows && shRows.length > 0) {
        const { mobile_user_id, applicant_id } = shRows[0];
        
        if (mobile_user_id || applicant_id) {
          // Find any other stallholder_id for this same user that HAS a face verification record
          let query = `
            SELECT fv.stallholder_id 
            FROM face_verification fv
            JOIN stallholder sh ON fv.stallholder_id = sh.stallholder_id
            WHERE sh.stallholder_id != ? AND 
          `;
          let params = [stallholder_id];
          
          if (mobile_user_id && applicant_id) {
            query += '(sh.mobile_user_id = ? OR sh.applicant_id = ?)';
            params.push(mobile_user_id, applicant_id);
          } else if (mobile_user_id) {
            query += 'sh.mobile_user_id = ?';
            params.push(mobile_user_id);
          } else {
            query += 'sh.applicant_id = ?';
            params.push(applicant_id);
          }
          query += ' LIMIT 1';

          const [otherFaceRows] = await connection.execute(query, params);
          
          if (otherFaceRows && otherFaceRows.length > 0) {
            const otherStallholderId = otherFaceRows[0].stallholder_id;
            
            // Get the image using the OTHER stallholder_id
            const [fallbackRows] = await connection.execute(
              'CALL sp_getFaceVerification(?, ?)',
              [otherStallholderId, encryptionKey]
            );
            
            records = fallbackRows[0];
          }
        }
      }
    }

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
