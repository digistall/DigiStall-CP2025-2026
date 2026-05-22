import { createConnection } from '../config/database.js';

async function run() {
  let connection;
  try {
    connection = await createConnection();

    console.log('Creating face_verification table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS face_verification (
        face_id INT AUTO_INCREMENT PRIMARY KEY,
        stallholder_id INT NOT NULL,
        encrypted_image_data LONGBLOB NOT NULL,
        mime_type VARCHAR(50) NOT NULL,
        verification_status VARCHAR(50) DEFAULT 'Verified',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (stallholder_id) REFERENCES stallholder(stallholder_id) ON DELETE CASCADE
      )
    `);
    console.log('face_verification table created.');

    console.log('Dropping and recreating sp_insertFaceVerification...');
    await connection.query('DROP PROCEDURE IF EXISTS sp_insertFaceVerification');
    await connection.query(`
      CREATE PROCEDURE sp_insertFaceVerification(
        IN p_stallholder_id INT,
        IN p_image_data LONGBLOB,
        IN p_mime_type VARCHAR(50),
        IN p_encryption_key VARCHAR(255)
      )
      BEGIN
        INSERT INTO face_verification (stallholder_id, encrypted_image_data, mime_type)
        VALUES (p_stallholder_id, AES_ENCRYPT(p_image_data, p_encryption_key), p_mime_type);
        SELECT LAST_INSERT_ID() AS face_id;
      END
    `);
    console.log('sp_insertFaceVerification created.');

    console.log('Dropping and recreating sp_getFaceVerification...');
    await connection.query('DROP PROCEDURE IF EXISTS sp_getFaceVerification');
    await connection.query(`
      CREATE PROCEDURE sp_getFaceVerification(
        IN p_stallholder_id INT,
        IN p_encryption_key VARCHAR(255)
      )
      BEGIN
        SELECT face_id, AES_DECRYPT(encrypted_image_data, p_encryption_key) AS image_data, mime_type, verification_status
        FROM face_verification
        WHERE stallholder_id = p_stallholder_id
        ORDER BY created_at DESC LIMIT 1;
      END
    `);
    console.log('sp_getFaceVerification created.');

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

run();
