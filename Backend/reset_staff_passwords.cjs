const mysql = require('mysql2/promise');
const crypto = require('crypto');

// AES-256-GCM encryption matching the web backend - USE SCRYPT DERIVATION!
const ENCRYPTION_KEY = 'DigiStall2025SecureKeyForEncryption123';

function getKey() {
  // Use scryptSync with same salt as Web backend
  return crypto.scryptSync(ENCRYPTION_KEY, 'digistall-salt-v2', 32);
}

function encryptData(plainText) {
  if (!plainText) return plainText;
  const key = getKey();
  const iv = crypto.randomBytes(16);  // 16 bytes for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

function decryptData(encryptedData) {
  if (!encryptedData || !encryptedData.includes(':')) return encryptedData;
  const parts = encryptedData.split(':');
  if (parts.length !== 3) return encryptedData;
  
  try {
    const [ivBase64, authTagBase64, encrypted] = parts;
    const key = getKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    return null;
  }
}

// Generate a new password
function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function main() {
  const connection = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Generate new passwords
    const newInspectorPassword = generatePassword();
    const newCollectorPassword = generatePassword();
    
    console.log('\n=== RESETTING STAFF PASSWORDS ===\n');
    
    // Get inspector
    const [inspectors] = await connection.query('SELECT inspector_id, email, first_name, last_name FROM inspector WHERE status = ?', ['active']);
    
    for (const inspector of inspectors) {
      const encryptedPassword = encryptData(newInspectorPassword);
      const encryptedFirstName = encryptData('John');  // Reset to readable names
      const encryptedLastName = encryptData('Inspector');
      
      await connection.execute(
        'UPDATE inspector SET password = ?, first_name = ?, last_name = ? WHERE inspector_id = ?',
        [encryptedPassword, encryptedFirstName, encryptedLastName, inspector.inspector_id]
      );
      
      console.log(`✅ Inspector Reset:`);
      console.log(`   Email: ${inspector.email}`);
      console.log(`   NEW Password: ${newInspectorPassword}`);
      console.log('');
    }
    
    // Get collectors
    const [collectors] = await connection.query('SELECT collector_id, email, first_name, last_name FROM collector WHERE status = ?', ['active']);
    
    for (const collector of collectors) {
      const encryptedPassword = encryptData(newCollectorPassword);
      const encryptedFirstName = encryptData('Jane');  // Reset to readable names
      const encryptedLastName = encryptData('Collector');
      
      await connection.execute(
        'UPDATE collector SET password = ?, first_name = ?, last_name = ? WHERE collector_id = ?',
        [encryptedPassword, encryptedFirstName, encryptedLastName, collector.collector_id]
      );
      
      console.log(`✅ Collector Reset:`);
      console.log(`   Email: ${collector.email}`);
      console.log(`   NEW Password: ${newCollectorPassword}`);
      console.log('');
    }
    
    // Verify decryption works
    console.log('\n=== VERIFYING DECRYPTION ===\n');
    
    const [testInspector] = await connection.query('SELECT password, first_name, last_name FROM inspector LIMIT 1');
    if (testInspector.length > 0) {
      const decryptedPw = decryptData(testInspector[0].password);
      const decryptedFn = decryptData(testInspector[0].first_name);
      const decryptedLn = decryptData(testInspector[0].last_name);
      console.log('Inspector decryption test:');
      console.log(`  Password decrypted: ${decryptedPw ? '✅ ' + decryptedPw : '❌ FAILED'}`);
      console.log(`  First name decrypted: ${decryptedFn ? '✅ ' + decryptedFn : '❌ FAILED'}`);
      console.log(`  Last name decrypted: ${decryptedLn ? '✅ ' + decryptedLn : '❌ FAILED'}`);
    }
    
    const [testCollector] = await connection.query('SELECT password, first_name, last_name FROM collector LIMIT 1');
    if (testCollector.length > 0) {
      const decryptedPw = decryptData(testCollector[0].password);
      const decryptedFn = decryptData(testCollector[0].first_name);
      const decryptedLn = decryptData(testCollector[0].last_name);
      console.log('\nCollector decryption test:');
      console.log(`  Password decrypted: ${decryptedPw ? '✅ ' + decryptedPw : '❌ FAILED'}`);
      console.log(`  First name decrypted: ${decryptedFn ? '✅ ' + decryptedFn : '❌ FAILED'}`);
      console.log(`  Last name decrypted: ${decryptedLn ? '✅ ' + decryptedLn : '❌ FAILED'}`);
    }
    
    console.log('\n=== SAVE THESE CREDENTIALS ===');
    console.log('Inspector: Use email shown above with password:', newInspectorPassword);
    console.log('Collector: Use email shown above with password:', newCollectorPassword);
    
  } catch (err) {
    console.error('Error:', err.message);
  }

  await connection.end();
}

main();
