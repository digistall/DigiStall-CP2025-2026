import { createConnection } from './config/database.js';

async function test() {
  let connection;
  try {
    connection = await createConnection();
    
    console.log('Fixing stallholder payment statuses...');
    
    // Get all stallholders
    const [stallholders] = await connection.execute(`
      SELECT sh.stallholder_id, sh.move_in_date, sh.payment_status, COALESCE(s.rental_price, s.monthly_rent, 0) as monthly_rent
      FROM stallholder sh
      LEFT JOIN stall s ON sh.stall_id = s.stall_id
    `);
    
    const today = new Date();
    const endD = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let fixedCount = 0;
    
    for (const sh of stallholders) {
      if (!sh.move_in_date) continue;
      
      const startDate = new Date(sh.move_in_date);
      let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      
      // Get all payments for this stallholder
      const [allPayments] = await connection.execute(
        `SELECT payment_for_month, SUM(amount) as total 
          FROM payments 
         WHERE stallholder_id = ? AND payment_type IN ('rental', 'partial_payment') AND payment_status IN ('completed', 'paid', 'partial')
         GROUP BY payment_for_month`,
        [sh.stallholder_id]
      );
      
      const paidMap = {};
      for (const p of allPayments) {
        if (p.payment_for_month) {
          paidMap[p.payment_for_month] = parseFloat(p.total);
        }
      }
      
      let hasOverdue = false;
      let hasPartial = false;
      let monthlyRent = parseFloat(sh.monthly_rent || 0);
      
      while (d <= endD) {
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const totalForMonth = paidMap[monthStr] || 0;
        if (totalForMonth < monthlyRent * 0.99) {
          hasOverdue = true;
          if (totalForMonth > 0) hasPartial = true;
          break;
        }
        d.setMonth(d.getMonth() + 1);
      }
      
      const expectedStatus = hasOverdue ? (hasPartial ? 'partial' : 'overdue') : 'paid';
      
      // Only update if it's currently marked as paid but they have overdue, 
      // or marked as something else but they are fully paid
      if (sh.payment_status !== expectedStatus) {
        console.log(`Stallholder ${sh.stallholder_id} status mismatch. Fixing from ${sh.payment_status} to ${expectedStatus}...`);
        await connection.execute("UPDATE stallholder SET payment_status = ? WHERE stallholder_id = ?", [expectedStatus, sh.stallholder_id]);
        fixedCount++;
      }
    }
    
    console.log(`Finished fixing statuses. Fixed ${fixedCount} stallholders.`);
  } catch (err) {
    console.error('Failed to fix statuses:', err);
  } finally {
    if (connection) await connection.end();
  }
}

test();
