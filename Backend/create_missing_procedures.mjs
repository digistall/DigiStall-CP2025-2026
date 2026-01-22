// ===== CREATE MISSING STORED PROCEDURES =====
// This script creates the missing decrypted stored procedures for complaints and compliance
// Run this to fix the "PROCEDURE does not exist" errors

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from Backend directory
dotenv.config({ path: join(__dirname, '.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'naga_stall',
  multipleStatements: true
};

async function createMissingProcedures() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database');

    // Drop existing procedures if they exist
    console.log('\n🗑️  Dropping existing procedures if they exist...');
    await connection.execute('DROP PROCEDURE IF EXISTS getAllComplaintsDecrypted');
    await connection.execute('DROP PROCEDURE IF EXISTS getAllComplianceRecordsDecrypted');
    console.log('✅ Old procedures dropped');

    // Create getAllComplaintsDecrypted procedure
    console.log('\n📝 Creating getAllComplaintsDecrypted procedure...');
    const createComplaintsProc = `
      CREATE PROCEDURE getAllComplaintsDecrypted(
        IN p_branch_id INT,
        IN p_status VARCHAR(20),
        IN p_search VARCHAR(255)
      )
      BEGIN
        DECLARE sql_query TEXT;
        
        -- Build dynamic query
        SET sql_query = 'SELECT 
          c.complaint_id,
          c.stallholder_id,
          c.stall_id,
          c.branch_id,
          c.complaint_date,
          c.complaint_type,
          c.description,
          c.status,
          c.resolved_date,
          c.created_at,
          c.updated_at,
          s.stall_number,
          s.business_name,
          sh.first_name as stallholder_first_name,
          sh.last_name as stallholder_last_name,
          sh.contact_number as stallholder_contact
        FROM complaints c
        LEFT JOIN stalls s ON c.stall_id = s.stall_id
        LEFT JOIN stallholders sh ON c.stallholder_id = sh.stallholder_id
        WHERE 1=1';
        
        -- Add branch filter if provided
        IF p_branch_id IS NOT NULL THEN
          SET sql_query = CONCAT(sql_query, ' AND c.branch_id = ', p_branch_id);
        END IF;
        
        -- Add status filter if provided
        IF p_status IS NOT NULL AND p_status != 'all' THEN
          SET sql_query = CONCAT(sql_query, ' AND c.status = ''', p_status, '''');
        END IF;
        
        -- Add search filter if provided
        IF p_search IS NOT NULL AND p_search != '' THEN
          SET sql_query = CONCAT(sql_query, 
            ' AND (c.description LIKE ''%', p_search, '%'' ',
            'OR s.business_name LIKE ''%', p_search, '%'' ',
            'OR sh.first_name LIKE ''%', p_search, '%'' ',
            'OR sh.last_name LIKE ''%', p_search, '%'')');
        END IF;
        
        -- Add ordering
        SET sql_query = CONCAT(sql_query, ' ORDER BY c.complaint_date DESC');
        
        -- Execute the query
        SET @sql = sql_query;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      END
    `;
    
    await connection.execute(createComplaintsProc);
    console.log('✅ getAllComplaintsDecrypted procedure created');

    // Create getAllComplianceRecordsDecrypted procedure
    console.log('\n📝 Creating getAllComplianceRecordsDecrypted procedure...');
    const createComplianceProc = `
      CREATE PROCEDURE getAllComplianceRecordsDecrypted(
        IN p_branch_id INT,
        IN p_status VARCHAR(20),
        IN p_search VARCHAR(255)
      )
      BEGIN
        DECLARE sql_query TEXT;
        
        -- Build dynamic query
        SET sql_query = 'SELECT 
          cr.record_id,
          cr.stall_id,
          cr.branch_id,
          cr.inspector_id,
          cr.violation_type,
          cr.description,
          cr.severity,
          cr.status,
          cr.evidence,
          cr.inspection_date,
          cr.resolved_date,
          cr.created_at,
          cr.updated_at,
          s.stall_number,
          s.business_name,
          CONCAT(i.first_name, '' '', i.last_name) as inspector_name
        FROM compliance_records cr
        LEFT JOIN stalls s ON cr.stall_id = s.stall_id
        LEFT JOIN inspectors i ON cr.inspector_id = i.inspector_id
        WHERE 1=1';
        
        -- Add branch filter if provided
        IF p_branch_id IS NOT NULL THEN
          SET sql_query = CONCAT(sql_query, ' AND cr.branch_id = ', p_branch_id);
        END IF;
        
        -- Add status filter if provided
        IF p_status IS NOT NULL AND p_status != 'all' THEN
          SET sql_query = CONCAT(sql_query, ' AND cr.status = ''', p_status, '''');
        END IF;
        
        -- Add search filter if provided
        IF p_search IS NOT NULL AND p_search != '' THEN
          SET sql_query = CONCAT(sql_query, 
            ' AND (cr.description LIKE ''%', p_search, '%'' ',
            'OR cr.violation_type LIKE ''%', p_search, '%'' ',
            'OR s.business_name LIKE ''%', p_search, '%'' ',
            'OR i.first_name LIKE ''%', p_search, '%'' ',
            'OR i.last_name LIKE ''%', p_search, '%'')');
        END IF;
        
        -- Add ordering
        SET sql_query = CONCAT(sql_query, ' ORDER BY cr.inspection_date DESC');
        
        -- Execute the query
        SET @sql = sql_query;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      END
    `;
    
    await connection.execute(createComplianceProc);
    console.log('✅ getAllComplianceRecordsDecrypted procedure created');

    // Verify procedures were created
    console.log('\n🔍 Verifying procedures...');
    const [procedures] = await connection.execute(`
      SELECT ROUTINE_NAME 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = ? 
      AND ROUTINE_TYPE = 'PROCEDURE'
      AND ROUTINE_NAME IN ('getAllComplaintsDecrypted', 'getAllComplianceRecordsDecrypted')
    `, [DB_CONFIG.database]);

    console.log('✅ Found procedures:', procedures.map(p => p.ROUTINE_NAME).join(', '));

    console.log('\n✅ All procedures created successfully!');
    console.log('🎉 You can now restart your backend server');

  } catch (error) {
    console.error('❌ Error creating procedures:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
console.log('🚀 Starting procedure creation...\n');
createMissingProcedures()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
