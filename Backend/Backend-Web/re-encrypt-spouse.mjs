// Re-encrypt spouse table
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const getEncryptionKey = () => {
  const key = process.env.DATA_ENCRYPTION_KEY;
  if (!key) {
    return crypto.scryptSync('digistall-secure-key-change-in-production', 'salt', 32);
  }
  return crypto.scryptSync(key, 'digistall-salt', 32);
};

const encryptData = (plainText) => {
  if (!plainText || plainText === '') return plainText;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'base64') + cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
};

async function main() {
  const isCloudDB = process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('ondigitalocean.com');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 60000,
    ...(isCloudDB && { ssl: { rejectUnauthorized: false } })
  });

  try {
    console.log('✅ Connected');
    
    const [keyRows] = await connection.execute(
      "SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1"
    );
    const dbEncKey = keyRows[0]?.encryption_key;

    console.log('\n--- RE-ENCRYPTING SPOUSE TABLE ---');
    const [spouses] = await connection.execute(`
      SELECT spouse_id, 
        CAST(AES_DECRYPT(encrypted_full_name, ?) AS CHAR(255)) as decrypted_name,
        CAST(AES_DECRYPT(encrypted_contact, ?) AS CHAR(50)) as decrypted_contact
      FROM spouse WHERE encrypted_full_name IS NOT NULL
    `, [dbEncKey, dbEncKey]);

    console.log(`Found ${spouses.length} spouses with encrypted data`);

    for (const sp of spouses) {
      if (sp.decrypted_name) {
        const encName = encryptData(sp.decrypted_name);
        const encContact = sp.decrypted_contact ? encryptData(sp.decrypted_contact) : null;
        await connection.execute(
          'UPDATE spouse SET spouse_full_name = ?, spouse_contact_number = ? WHERE spouse_id = ?',
          [encName, encContact, sp.spouse_id]
        );
        console.log(`  ✅ Spouse #${sp.spouse_id}: ${sp.decrypted_name}`);
      }
    }

    // Final verification
    console.log('\n========================================');
    console.log('FINAL VERIFICATION - All Data');
    console.log('========================================');

    const [applicants] = await connection.execute(
      'SELECT applicant_id, applicant_full_name, applicant_contact_number, applicant_address FROM applicant ORDER BY applicant_id'
    );
    console.log('\n📋 APPLICANTS:');
    applicants.forEach(a => {
      console.log(`  #${String(a.applicant_id).padStart(4, '0')}: ${a.applicant_full_name?.substring(0, 40) || 'NULL'}...`);
    });

    console.log('\n✅ ALL DATA RE-ENCRYPTED SUCCESSFULLY!');

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
