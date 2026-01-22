// Transfer application data to auction table
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function transferData() {
  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  };
  
  const connection = await mysql.createConnection(config);
  console.log('✅ Connected to database');
  
  try {
    // Get stall and branch info
    const [stallInfo] = await connection.execute(
      `SELECT s.stall_id, s.stall_number, s.rental_price, f.branch_id
       FROM stall s
       JOIN section sec ON s.section_id = sec.section_id
       JOIN floor f ON sec.floor_id = f.floor_id
       WHERE s.stall_id = 11`
    );
    console.log('📊 Stall info:', stallInfo[0]);
    
    const branchId = stallInfo[0].branch_id;
    const rentalPrice = stallInfo[0].rental_price || 1000;
    
    // Get business manager for the branch
    const [managerRows] = await connection.execute(
      `SELECT business_manager_id FROM business_manager 
       WHERE branch_id = ? AND status = 'Active' 
       ORDER BY business_manager_id LIMIT 1`,
      [branchId]
    );
    const managerId = managerRows.length > 0 ? managerRows[0].business_manager_id : 1;
    console.log('👤 Manager ID:', managerId);
    
    // Create auction for stall 11
    console.log('\n🔧 Creating auction for stall 11...');
    const [auctionResult] = await connection.execute(
      `INSERT INTO auction (stall_id, branch_id, auction_name, starting_bid, minimum_increment, start_date, end_date, status, created_by, created_at)
       VALUES (11, ?, 'Auction for Stall B3-S3', ?, 100.00, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'Open', ?, NOW())`,
      [branchId, rentalPrice, managerId]
    );
    const auctionId = auctionResult.insertId;
    console.log('✅ Created auction with ID:', auctionId);
    
    // Check if applicant 5 is a stallholder
    const [shRows] = await connection.execute(
      `SELECT stallholder_id FROM stallholder WHERE (mobile_user_id = 5 OR applicant_id = 5) AND status = 'Active'`
    );
    const stallholderId = shRows.length > 0 ? shRows[0].stallholder_id : null;
    console.log('👤 Stallholder ID:', stallholderId);
    
    // Insert into auction_participants
    console.log('\n🔧 Adding participant to auction_participants...');
    const [participantResult] = await connection.execute(
      `INSERT INTO auction_participants (auction_id, applicant_id, stallholder_id, registration_date, status)
       VALUES (?, 5, ?, '2026-01-18', 'Registered')`,
      [auctionId, stallholderId]
    );
    console.log('✅ Added participant with ID:', participantResult.insertId);
    
    // Delete from application table
    console.log('\n🔧 Deleting from application table...');
    await connection.execute('DELETE FROM application WHERE application_id = 4');
    console.log('✅ Deleted application_id 4');
    
    // Verify
    console.log('\n📋 Verification:');
    const [verifyAuction] = await connection.execute('SELECT * FROM auction WHERE stall_id = 11');
    console.log('Auction record:', verifyAuction[0]);
    
    const [verifyParticipant] = await connection.execute('SELECT * FROM auction_participants WHERE auction_id = ?', [auctionId]);
    console.log('Participant record:', verifyParticipant[0]);
    
    const [verifyApp] = await connection.execute('SELECT * FROM application WHERE application_id = 4');
    console.log('Application record (should be empty):', verifyApp.length === 0 ? '[] - DELETED' : verifyApp);
    
    console.log('\n🎉 Transfer completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

transferData().catch(console.error);
