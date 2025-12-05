const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'naga_stall'
  });
  
  const [rows] = await conn.execute(`
    SELECT 
      sh.stallholder_id, 
      sh.branch_id, 
      sh.stall_id, 
      sh.contract_status, 
      s.stall_no, 
      b.branch_name 
    FROM stallholder sh 
    INNER JOIN stall s ON sh.stall_id = s.stall_id 
    INNER JOIN branch b ON sh.branch_id = b.branch_id 
    WHERE sh.applicant_id = 500 AND sh.contract_status = 'Active'
  `);
  
  console.log('Results:', JSON.stringify(rows, null, 2));
  await conn.end();
}

test();
