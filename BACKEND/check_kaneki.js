import { createConnection } from '../config/database.js';
import { decryptData } from '../services/encryptionService.js';
import { calculateStallholderPaymentStatus } from './config/paymentStatusHelper.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connection = await createConnection();
  try {
    const [stallholders] = await connection.execute('SELECT stallholder_id, full_name, move_in_date, payment_status, stall_id FROM stallholder');
    
    console.log('Searching for Kaneki Ken:');
    for (const sh of stallholders) {
      const decName = decryptData(sh.full_name);
      if (decName && decName.toUpperCase().includes('KANEKI')) {
        let rental = 0;
        if (sh.stall_id) {
          const [stalls] = await connection.execute('SELECT rental_price FROM stall WHERE stall_id = ?', [sh.stall_id]);
          rental = parseFloat(stalls[0]?.rental_price || 0);
        }
        
        const computed = await calculateStallholderPaymentStatus(connection, sh.stallholder_id, sh.move_in_date, rental);
        
        console.log(`ID: ${sh.stallholder_id}, Name: ${decName}`);
        console.log(`  MoveIn: ${sh.move_in_date}`);
        console.log(`  Rental: ${rental}`);
        console.log(`  Current stored dbStatus: ${sh.payment_status}`);
        console.log(`  Computed status: ${computed}`);
        
        // Fetch all payments for this stallholder
        const [payments] = await connection.execute(
          'SELECT payment_id, amount, payment_date, payment_for_month, payment_type, payment_status, notes FROM payments WHERE stallholder_id = ?',
          [sh.stallholder_id]
        );
        console.log(`  Payments for ${decName}:`);
        console.log(payments);
      }
    }
  } finally {
    await connection.end();
  }
}
run().catch(console.error);
