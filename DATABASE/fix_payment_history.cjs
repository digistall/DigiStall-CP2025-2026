/**
 * Fix for Payment Transaction History - Remove LIMIT 1 from sp_getStallholderIdByApplicant
 * This allows users with multiple stalls to see payment history for ALL their stalls
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Check if using cloud database
const isCloudDB = process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('ondigitalocean.com');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'naga_stall',
  multipleStatements: true, // Needed for DROP/CREATE
  ...(isCloudDB && {
    ssl: { rejectUnauthorized: false }
  })
};

async function fixStoredProcedure() {
  let connection;
  
  try {
    console.log('🔧 Connecting to database...');
    console.log('   Host:', dbConfig.host);
    console.log('   Database:', dbConfig.database);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!\n');
    
    // Drop and recreate the stored procedure WITHOUT LIMIT 1
    const sql = `
      DROP PROCEDURE IF EXISTS sp_getStallholderIdByApplicant;
      
      CREATE PROCEDURE sp_getStallholderIdByApplicant(
          IN p_applicant_id INT
      )
      BEGIN
          SELECT stallholder_id
          FROM stallholder
          WHERE applicant_id = p_applicant_id;
      END;
    `;
    
    console.log('📝 Updating sp_getStallholderIdByApplicant...');
    console.log('   FIX: Removing LIMIT 1 to support multiple stalls\n');
    
    await connection.query(sql);
    
    console.log('✅ Stored procedure updated successfully!');
    console.log('\n📋 Verification - testing with a sample query...');
    
    // Verify the procedure exists
    const [procs] = await connection.query(
      "SHOW PROCEDURE STATUS WHERE Name = 'sp_getStallholderIdByApplicant'"
    );
    
    if (procs.length > 0) {
      console.log('✅ Procedure exists:', procs[0].Name);
      console.log('\n🎉 Fix applied successfully!');
      console.log('   Users with multiple stalls can now see payment history for ALL their stalls.');
    } else {
      console.log('❌ Procedure not found after creation - please check for errors');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔐 Database connection closed.');
    }
  }
}

fixStoredProcedure();
