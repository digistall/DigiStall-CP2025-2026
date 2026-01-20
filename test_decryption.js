// Test decryption with the ACTUAL key from .env
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// The ACTUAL encryption key from your .env file
const getEncryptionKey = () => {
  const key = 'DigiStall2025SecureKeyForEncryption123';
  return crypto.scryptSync(key, 'digistall-salt', 32);
};

const decryptData = (encryptedData) => {
  if (!encryptedData || typeof encryptedData !== 'string') {
    return encryptedData;
  }
  
  if (!encryptedData.includes(':')) {
    return encryptedData;
  }

  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      return encryptedData;
    }

    const [ivBase64, authTagBase64, encrypted] = parts;
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    return encryptedData;
  }
};

// Test with sample encrypted data from your database
// Replace these with actual values from your database
const testCases = [
  // From your screenshots - stallholder_name example
  'XW5Dqauy+CYzRo7yed2C6g==:QNQmLWYUJJ2sRKoN0hXaWQ==:KD9hKkI6pHxHd044QNzELhYO6xqD3L3rAHU=',
  // Another example from business_manager
  'QUFkQRYfl4z5uP0GWvHAvQ==:0qEahMxx8xw...',
];

console.log('Testing decryption with original key...\n');

testCases.forEach((encrypted, index) => {
  console.log(`Test ${index + 1}:`);
  console.log(`  Encrypted: ${encrypted.substring(0, 50)}...`);
  const decrypted = decryptData(encrypted);
  console.log(`  Decrypted: ${decrypted}`);
  console.log(`  Success: ${decrypted !== encrypted ? '✅ YES' : '❌ NO'}\n`);
});
