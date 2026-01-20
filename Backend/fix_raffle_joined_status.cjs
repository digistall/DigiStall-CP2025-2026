/**
 * Fix for Raffle Joined Status Display Issue
 * 
 * Problem: The "JOIN RAFFLE" button is shown even after user has already joined the raffle.
 * 
 * Solution: Update sp_getStallsByTypeForApplicant to check raffle_participants table
 * and return 'joined_raffle' status when user has already joined.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixRaffleJoinedStatus() {
  console.log('🔧 Fixing Raffle Joined Status Issue...\n');
  
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'naga_stall'
  });

  try {
    // Update sp_getStallsByTypeForApplicant to check raffle_participants
    console.log('1️⃣ Updating sp_getStallsByTypeForApplicant...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getStallsByTypeForApplicant');
    await conn.query(`
      CREATE PROCEDURE sp_getStallsByTypeForApplicant(
        IN p_price_type VARCHAR(50),
        IN p_applicant_id INT,
        IN p_area_list TEXT
      )
      BEGIN
        SELECT 
          st.stall_id,
          st.stall_number,
          st.stall_name,
          st.stall_type,
          st.stall_size,
          st.monthly_rent,
          st.rental_price,
          st.status,
          st.description,
          st.amenities,
          st.stall_location,
          st.size,
          st.area_sqm,
          st.base_rate,
          st.rate_per_sqm,
          st.price_type,
          st.is_available,
          st.raffle_auction_deadline,
          st.deadline_active,
          st.raffle_auction_status,
          b.branch_id,
          b.branch_name,
          b.area,
          f.floor_id,
          f.floor_name,
          sec.section_id,
          sec.section_name,
          CASE 
            -- Check if user has joined the raffle for this stall
            WHEN EXISTS (
              SELECT 1 FROM raffle_participants rp
              INNER JOIN raffle r ON rp.raffle_id = r.raffle_id
              WHERE r.stall_id = st.stall_id 
              AND rp.applicant_id = p_applicant_id
            ) THEN 'joined_raffle'
            -- Check if user has joined the auction for this stall
            WHEN EXISTS (
              SELECT 1 FROM auction_participants ap
              INNER JOIN auction a ON ap.auction_id = a.auction_id
              WHERE a.stall_id = st.stall_id 
              AND ap.applicant_id = p_applicant_id
            ) THEN 'joined_auction'
            -- Check if user has an active application for this stall
            WHEN EXISTS (
              SELECT 1 FROM application app 
              WHERE app.stall_id = st.stall_id 
              AND app.applicant_id = p_applicant_id 
              AND app.application_status IN ('Pending', 'Under Review', 'Approved')
            ) THEN 'applied'
            -- Stall is available
            WHEN st.is_available = 1 AND st.status = 'Active' THEN 'available'
            ELSE 'unavailable'
          END as application_status,
          app.application_id as user_application_id
        FROM stall st
        INNER JOIN section sec ON st.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN application app ON st.stall_id = app.stall_id AND app.applicant_id = p_applicant_id
        WHERE st.price_type = p_price_type
          AND b.status = 'Active'
        ORDER BY b.branch_name, f.floor_name, sec.section_name, st.stall_number;
      END
    `);
    console.log('✅ sp_getStallsByTypeForApplicant updated\n');

    // Verify the procedure was created
    console.log('2️⃣ Verifying procedure...');
    const [result] = await conn.query("SHOW CREATE PROCEDURE sp_getStallsByTypeForApplicant");
    if (result.length > 0) {
      console.log('✅ Procedure created successfully\n');
    }

    console.log('🎉 Raffle Joined Status fix completed!\n');
    console.log('📋 Summary:');
    console.log('   - sp_getStallsByTypeForApplicant now checks raffle_participants table');
    console.log('   - Returns "joined_raffle" status when user has already joined');
    console.log('   - Returns "joined_auction" status for auction participation');
    console.log('');
    console.log('⚠️  Note: Make sure to also update the frontend to handle hasJoinedRaffle status');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

fixRaffleJoinedStatus().catch(console.error);
