const mysql = require('mysql2/promise');
const fs = require('fs');

async function runProcedures() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Read separate statements and execute them one at a time
    // to avoid DELIMITER issues
    
    // Drop first procedure
    await conn.query('DROP PROCEDURE IF EXISTS `sp_getStallsByTypeForApplicant`');
    console.log('Dropped sp_getStallsByTypeForApplicant');
    
    // Create first procedure
    const proc1 = `
CREATE PROCEDURE sp_getStallsByTypeForApplicant(
    IN p_price_type VARCHAR(50),
    IN p_applicant_id INT,
    IN p_branch_id INT
)
BEGIN
    SELECT
        s.stall_id,
        s.stall_number,
        s.stall_name,
        s.stall_location,
        s.stall_size,
        s.size,
        s.area_sqm,
        s.monthly_rent,
        s.rental_price,
        s.status AS stall_status,
        s.is_available,
        s.price_type,
        s.description,
        s.floor_level,
        s.section,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        s.branch_id,
        b.branch_name,
        b.location as area,
        b.status AS branch_status,
        f.floor_name,
        f.floor_number,
        sec.section_name,
        (SELECT image_id FROM stall_images WHERE stall_id = s.stall_id AND is_primary = 1 LIMIT 1) as primary_image_id,
        (SELECT COUNT(*) FROM stall_images WHERE stall_id = s.stall_id) as image_count,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM application a
                WHERE a.stall_id = s.stall_id
                AND a.applicant_id = p_applicant_id
            ) THEN 'applied'
            WHEN EXISTS (
                SELECT 1 FROM raffle_participants rp
                JOIN raffle r ON rp.raffle_id = r.raffle_id
                WHERE r.stall_id = s.stall_id
                AND rp.applicant_id = p_applicant_id
            ) THEN 'joined_raffle'
            WHEN EXISTS (
                SELECT 1 FROM auction_participants ap
                JOIN auction a ON ap.auction_id = a.auction_id
                WHERE a.stall_id = s.stall_id
                AND ap.applicant_id = p_applicant_id
            ) THEN 'joined_auction'
            ELSE 'available'
        END AS application_status
    FROM stall s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    WHERE s.price_type = p_price_type
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
    AND b.status = 'Active'
    ORDER BY s.stall_number;
END`;
    await conn.query(proc1);
    console.log('Created sp_getStallsByTypeForApplicant');
    
    // Drop second procedure
    await conn.query('DROP PROCEDURE IF EXISTS `sp_getAvailableStallsForApplicant`');
    console.log('Dropped sp_getAvailableStallsForApplicant');
    
    // Create second procedure
    const proc2 = `
CREATE PROCEDURE sp_getAvailableStallsForApplicant(
    IN p_applicant_id INT,
    IN p_area_list TEXT
)
BEGIN
    SELECT
        s.stall_id,
        s.stall_number,
        s.stall_name,
        s.stall_location,
        s.stall_size,
        s.size,
        s.area_sqm,
        s.monthly_rent,
        s.rental_price,
        s.status AS stall_status,
        s.is_available,
        s.price_type,
        s.description,
        s.floor_level,
        s.section,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        s.branch_id,
        b.branch_name,
        b.location as area,
        b.location as location,
        f.floor_name,
        f.floor_number,
        sec.section_name,
        (SELECT image_id FROM stall_images WHERE stall_id = s.stall_id AND is_primary = 1 LIMIT 1) as primary_image_id,
        CASE
            WHEN EXISTS (
                SELECT 1 FROM application a
                WHERE a.stall_id = s.stall_id
                AND a.applicant_id = p_applicant_id
            ) THEN 'applied'
            WHEN EXISTS (
                SELECT 1 FROM raffle_participants rp
                JOIN raffle r ON rp.raffle_id = r.raffle_id
                WHERE r.stall_id = s.stall_id
                AND rp.applicant_id = p_applicant_id
            ) THEN 'joined_raffle'
            WHEN EXISTS (
                SELECT 1 FROM auction_participants ap
                JOIN auction a ON ap.auction_id = a.auction_id
                WHERE a.stall_id = s.stall_id
                AND ap.applicant_id = p_applicant_id
            ) THEN 'joined_auction'
            ELSE 'available'
        END AS application_status
    FROM stall s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    WHERE s.is_available = 1
    AND b.status = 'Active'
    ORDER BY s.stall_number;
END`;
    await conn.query(proc2);
    console.log('Created sp_getAvailableStallsForApplicant');
    
    console.log('✅ All stored procedures updated successfully!');
  } catch (err) {
    console.error('Error executing SQL:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

runProcedures();
