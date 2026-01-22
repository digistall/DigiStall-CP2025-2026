// Check current database schema for participant tables
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function checkSchema() {
  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  };
  
  console.log('🔌 Connecting to:', config.host);
  const connection = await mysql.createConnection(config);
  console.log('✅ Connected to database');
  
  try {
    // Check raffle_participants columns
    console.log('\n🔍 Checking raffle_participants columns...');
    const [raffleCols] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'raffle_participants'`,
      [config.database]
    );
    console.log('Columns:', raffleCols.map(c => c.COLUMN_NAME).join(', '));
    
    // Check auction_participants columns
    console.log('\n🔍 Checking auction_participants columns...');
    const [auctionCols] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'auction_participants'`,
      [config.database]
    );
    console.log('Columns:', auctionCols.map(c => c.COLUMN_NAME).join(', '));
    
    // Check if stallholder_id needs to be added
    const raffleHasStallholderId = raffleCols.some(c => c.COLUMN_NAME === 'stallholder_id');
    const auctionHasStallholderId = auctionCols.some(c => c.COLUMN_NAME === 'stallholder_id');
    
    console.log('\n📊 Migration Status:');
    console.log(`  - raffle_participants.stallholder_id: ${raffleHasStallholderId ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  - auction_participants.stallholder_id: ${auctionHasStallholderId ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!raffleHasStallholderId) {
      console.log('\n🔧 Adding stallholder_id to raffle_participants...');
      await connection.execute(
        `ALTER TABLE raffle_participants ADD COLUMN stallholder_id INT NULL AFTER applicant_id`
      );
      console.log('✅ Added stallholder_id to raffle_participants');
    }
    
    if (!auctionHasStallholderId) {
      console.log('\n🔧 Adding stallholder_id to auction_participants...');
      await connection.execute(
        `ALTER TABLE auction_participants ADD COLUMN stallholder_id INT NULL AFTER applicant_id`
      );
      console.log('✅ Added stallholder_id to auction_participants');
    }
    
    // Update stallholder.mobile_user_id where it's null but applicant_id exists
    console.log('\n🔧 Updating stallholder.mobile_user_id...');
    const [updateResult] = await connection.execute(
      `UPDATE stallholder 
       SET mobile_user_id = applicant_id
       WHERE applicant_id IS NOT NULL AND mobile_user_id IS NULL`
    );
    console.log(`✅ Updated ${updateResult.affectedRows} stallholder records`);
    
    // Verify final state
    console.log('\n🔍 Final column check:');
    const [finalRaffle] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'raffle_participants'`,
      [config.database]
    );
    console.log('raffle_participants:', finalRaffle.map(c => c.COLUMN_NAME).join(', '));
    
    const [finalAuction] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'auction_participants'`,
      [config.database]
    );
    console.log('auction_participants:', finalAuction.map(c => c.COLUMN_NAME).join(', '));
    
    console.log('\n🎉 Schema migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkSchema().catch(console.error);
