const mysql = require('mysql2/promise');

async function updateProcedure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'naga_stall'
  });
  
  try {
    // First drop the existing procedure
    await connection.query('DROP PROCEDURE IF EXISTS getAllStallholdersDetailed');
    console.log('🗑️ Dropped existing procedure');
    
    // Now create the new procedure
    const createProcedure = `
CREATE PROCEDURE getAllStallholdersDetailed(
    IN p_branch_id INT
)
BEGIN
    IF p_branch_id IS NULL THEN
        SELECT
            sh.stallholder_id,
            sh.applicant_id,
            sh.stallholder_name,
            sh.contact_number,
            sh.email,
            sh.address,
            sh.business_name,
            sh.business_type,
            sh.branch_id,
            b.branch_name,
            sh.stall_id,
            s.stall_no,
            s.stall_location,
            sh.contract_start_date,
            sh.contract_end_date,
            sh.contract_status,
            sh.lease_amount,
            sh.monthly_rent,
            sh.payment_status,
            sh.last_payment_date,
            sh.compliance_status,
            sh.last_violation_date,
            sh.notes,
            sh.date_created,
            sh.updated_at,
            CONCAT(bm.first_name, ' ', bm.last_name) as created_by_name
        FROM stallholder sh
        INNER JOIN branch b ON sh.branch_id = b.branch_id
        INNER JOIN stall s ON sh.stall_id = s.stall_id
        LEFT JOIN branch_manager bm ON sh.created_by_manager = bm.branch_manager_id
        WHERE sh.stall_id IS NOT NULL
        ORDER BY sh.date_created DESC;
    ELSE
        SELECT
            sh.stallholder_id,
            sh.applicant_id,
            sh.stallholder_name,
            sh.contact_number,
            sh.email,
            sh.address,
            sh.business_name,
            sh.business_type,
            sh.branch_id,
            b.branch_name,
            sh.stall_id,
            s.stall_no,
            s.stall_location,
            sh.contract_start_date,
            sh.contract_end_date,
            sh.contract_status,
            sh.lease_amount,
            sh.monthly_rent,
            sh.payment_status,
            sh.last_payment_date,
            sh.compliance_status,
            sh.last_violation_date,
            sh.notes,
            sh.date_created,
            sh.updated_at,
            CONCAT(bm.first_name, ' ', bm.last_name) as created_by_name
        FROM stallholder sh
        INNER JOIN branch b ON sh.branch_id = b.branch_id
        INNER JOIN stall s ON sh.stall_id = s.stall_id
        LEFT JOIN branch_manager bm ON sh.created_by_manager = bm.branch_manager_id
        WHERE sh.branch_id = p_branch_id AND sh.stall_id IS NOT NULL
        ORDER BY sh.date_created DESC;
    END IF;
END`;
    
    await connection.query(createProcedure);
    console.log('✅ Successfully created updated procedure');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await connection.end();
  }
}

updateProcedure();