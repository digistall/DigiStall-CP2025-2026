const mysql = require('mysql2/promise');

async function checkStallholderStalls() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'naga_stall'
  });
  
  try {
    // Check stallholders with and without stalls
    const [stallholders] = await connection.execute(`
      SELECT 
        s.stallholder_id,
        s.stallholder_name,
        s.business_name,
        s.email,
        s.contact_number,
        s.stall_id,
        s.branch_id as stallholder_branch_id,
        st.stall_no,
        st.status as stall_status,
        b.branch_name
      FROM stallholder s
      LEFT JOIN stall st ON s.stall_id = st.stall_id
      LEFT JOIN branch b ON s.branch_id = b.branch_id
      ORDER BY s.stallholder_id
    `);
    
    console.log('📊 Stallholder Analysis:');
    console.log('Total stallholders:', stallholders.length);
    
    const withStalls = stallholders.filter(sh => sh.stall_id);
    const withoutStalls = stallholders.filter(sh => !sh.stall_id);
    
    console.log('\n✅ With assigned stalls:', withStalls.length);
    withStalls.forEach(sh => {
      console.log(`  - ${sh.stallholder_name} (${sh.business_name}) -> Stall #${sh.stall_no} at ${sh.branch_name} (Status: ${sh.stall_status})`);
    });
    
    console.log('\n❌ Without assigned stalls:', withoutStalls.length);
    withoutStalls.forEach(sh => {
      console.log(`  - ${sh.stallholder_name} (${sh.business_name}) -> NO STALL`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
  }
}

checkStallholderStalls();