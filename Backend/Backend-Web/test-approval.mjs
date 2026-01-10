// Test approval for applicant 11
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const getKey = () => crypto.scryptSync('digistall-secure-key-change-in-production', 'salt', 32);
const decrypt = (enc) => { 
  if (!enc || !enc.includes(':')) return enc; 
  try { 
    const [iv, tag, data] = enc.split(':'); 
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64')); 
    decipher.setAuthTag(Buffer.from(tag, 'base64')); 
    return decipher.update(data, 'base64', 'utf8') + decipher.final('utf8'); 
  } catch(e) { return enc; } 
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
    console.log('✅ Connected to database\n');
    
    // Check applicant 11
    const [app] = await connection.query(`
      SELECT a.*, oi.email_address, bi.nature_of_business 
      FROM applicant a 
      LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id 
      LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
      WHERE a.applicant_id = 11
    `);
    
    if (app.length === 0) {
      console.log('❌ Applicant 11 not found!');
      return;
    }
    
    console.log('📋 Applicant 11:');
    console.log('  Name:', decrypt(app[0].applicant_full_name));
    console.log('  Contact:', decrypt(app[0].applicant_contact_number));
    console.log('  Address:', decrypt(app[0].applicant_address));
    console.log('  Email:', decrypt(app[0].email_address));
    console.log('  Business:', app[0].nature_of_business);
    
    // Check pending application
    const [pending] = await connection.query(
      "SELECT * FROM application WHERE applicant_id = 11 AND application_status = 'Pending'"
    );
    console.log('\n📋 Pending applications:', pending.length);
    if (pending.length > 0) {
      console.log('  Application ID:', pending[0].application_id);
      console.log('  Stall ID:', pending[0].stall_id);
    } else {
      // Check all applications for this applicant
      const [allApps] = await connection.query(
        "SELECT application_id, stall_id, application_status FROM application WHERE applicant_id = 11"
      );
      console.log('  All applications for applicant 11:', allApps);
    }
    
    // Check if credential exists
    const [cred] = await connection.query('SELECT * FROM credential WHERE applicant_id = 11');
    console.log('\n📋 Existing credentials:', cred.length);
    if (cred.length > 0) {
      console.log('  Username:', cred[0].user_name);
      console.log('  ⚠️ Credential already exists - this might cause the error!');
    }
    
    // Check if stallholder exists
    const [sh] = await connection.query('SELECT * FROM stallholder WHERE applicant_id = 11');
    console.log('\n📋 Existing stallholder:', sh.length);
    if (sh.length > 0) {
      console.log('  Stallholder ID:', sh[0].stallholder_id);
      console.log('  Name:', sh[0].stallholder_name);
      console.log('  ⚠️ Stallholder already exists - applicant may already be approved!');
    }

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
