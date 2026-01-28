/**
 * Create missing stored procedures
 * 
 * Usage: node DATABASE/create_stored_procedures.cjs
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'naga_stall',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

async function createStoredProcedures() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Drop and recreate sp_getLandingPageStallholdersList
    console.log('\n📝 Creating sp_getLandingPageStallholdersList...');
    
    await connection.query('DROP PROCEDURE IF EXISTS sp_getLandingPageStallholdersList');
    
    const createProcedure = `
      CREATE PROCEDURE sp_getLandingPageStallholdersList(
        IN p_search VARCHAR(255),
        IN p_branch_id INT,
        IN p_business_type VARCHAR(100),
        IN p_limit INT,
        IN p_offset INT
      )
      BEGIN
        SELECT 
          sh.stallholder_id,
          sh.full_name,
          sh.contact_number,
          sh.email,
          sh.status,
          sh.payment_status,
          sh.compliance_status,
          s.stall_id,
          s.stall_number,
          s.stall_name,
          s.stall_type,
          s.floor_level as floor,
          s.section,
          s.monthly_rent,
          b.branch_id,
          b.branch_name,
          b.area,
          b.location as city
        FROM stallholder sh
        LEFT JOIN stall s ON sh.stall_id = s.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.status = 'active'
          AND (p_search IS NULL OR p_search = '' OR 
               sh.full_name LIKE CONCAT('%', p_search, '%'))
          AND (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
          AND (p_business_type IS NULL OR p_business_type = '' OR s.stall_type = p_business_type)
        ORDER BY sh.stallholder_id DESC
        LIMIT p_limit OFFSET p_offset;
      END
    `;
    
    await connection.query(createProcedure);
    
    console.log('✅ sp_getLandingPageStallholdersList created');
    
    console.log('\n✅ Stored procedures created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createStoredProcedures();
