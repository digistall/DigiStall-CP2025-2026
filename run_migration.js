// Run this inside the Docker container with: node /app/run_migration.js
const mysql = require('mysql2/promise');

async function fix() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? {} : false,
    multipleStatements: true
  });
  console.log('✅ Connected to DB');
  
  // 1. Create getViolationHistoryByStallholder
  console.log('📝 Creating getViolationHistoryByStallholder...');
  await conn.query('DROP PROCEDURE IF EXISTS getViolationHistoryByStallholder');
  await conn.query(`
    CREATE PROCEDURE getViolationHistoryByStallholder(IN p_stallholder_id INT) 
    BEGIN 
      SELECT 
        vr.report_id AS violation_id, 
        vr.date_reported, 
        COALESCE(vr.compliance_type, v.violation_type) AS violation_type, 
        v.ordinance_no, 
        v.details AS violation_details, 
        vr.offense_no, 
        vr.severity, 
        vr.status, 
        vr.evidence, 
        vr.remarks, 
        vr.receipt_number, 
        vp.penalty_amount, 
        vp.remarks AS penalty_remarks, 
        CONCAT(i.first_name, ' ', i.last_name) AS inspector_name, 
        b.branch_name, 
        s.stall_no, 
        vr.resolved_date, 
        vr.resolved_by 
      FROM violation_report vr 
      LEFT JOIN violation v ON vr.violation_id = v.violation_id 
      LEFT JOIN violation_penalty vp ON vr.penalty_id = vp.penalty_id 
      LEFT JOIN inspector i ON vr.inspector_id = i.inspector_id 
      LEFT JOIN branch b ON vr.branch_id = b.branch_id 
      LEFT JOIN stall s ON vr.stall_id = s.stall_id 
      WHERE vr.stallholder_id = p_stallholder_id 
      ORDER BY vr.date_reported DESC; 
    END
  `);
  console.log('✅ Created getViolationHistoryByStallholder');
  
  // 2. Create sp_getDocumentsByStallholderId
  console.log('📝 Creating sp_getDocumentsByStallholderId...');
  await conn.query('DROP PROCEDURE IF EXISTS sp_getDocumentsByStallholderId');
  await conn.query(`
    CREATE PROCEDURE sp_getDocumentsByStallholderId(IN p_stallholder_id INT) 
    BEGIN 
      SELECT 
        sd.document_id, 
        sd.stallholder_id, 
        sh.stallholder_name, 
        sh.business_name, 
        sh.email as stallholder_email, 
        sh.contact_number as stallholder_phone, 
        st.stall_no, 
        st.stall_location, 
        sd.document_type_id, 
        dt.document_name, 
        dt.description as document_description, 
        sd.file_path, 
        sd.original_filename, 
        sd.file_size, 
        sd.upload_date, 
        sd.verification_status as status, 
        sd.verified_by as reviewed_by, 
        sd.verified_at as reviewed_at, 
        sd.rejection_reason, 
        sd.expiry_date, 
        sd.notes, 
        CONCAT(bm.first_name, ' ', bm.last_name) as reviewed_by_name 
      FROM stallholder_documents sd 
      INNER JOIN stallholder sh ON sd.stallholder_id = sh.stallholder_id 
      LEFT JOIN stall st ON sh.stall_id = st.stall_id 
      INNER JOIN document_types dt ON sd.document_type_id = dt.document_type_id 
      LEFT JOIN business_manager bm ON sd.verified_by = bm.business_manager_id 
      WHERE sd.stallholder_id = p_stallholder_id 
      ORDER BY sd.upload_date DESC; 
    END
  `);
  console.log('✅ Created sp_getDocumentsByStallholderId');
  
  await conn.end();
  console.log('🎉 All migrations complete!');
}

fix().catch(e => { 
  console.error('❌ Error:', e.message); 
  process.exit(1); 
});
