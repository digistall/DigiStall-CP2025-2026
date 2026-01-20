const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });

  console.log('=== Fixing Stored Procedures ===\n');

  // 1. Fix sp_getLandingPageStallsList - replace stall_no with stall_number
  console.log('1. Dropping and recreating sp_getLandingPageStallsList...');
  try {
    await conn.query('DROP PROCEDURE IF EXISTS sp_getLandingPageStallsList');
    
    await conn.query(`
      CREATE PROCEDURE sp_getLandingPageStallsList(
        IN p_search VARCHAR(255),
        IN p_branch_id INT,
        IN p_status VARCHAR(50),
        IN p_price_type VARCHAR(50),
        IN p_limit INT,
        IN p_offset INT
      )
      BEGIN
        DECLARE search_pattern VARCHAR(260);
        SET search_pattern = IF(p_search IS NOT NULL AND p_search != '', CONCAT('%', p_search, '%'), NULL);
        
        SELECT
          s.stall_id,
          s.stall_number,
          s.stall_location,
          s.size,
          s.rental_price,
          s.price_type,
          s.status,
          s.is_available,
          s.description,
          si.image_url as stall_image,
          sec.section_name,
          f.floor_name,
          b.branch_name,
          b.branch_id,
          CASE WHEN sh.stallholder_id IS NOT NULL THEN 'Occupied' ELSE 'Available' END as occupancy_status
        FROM stall s
        LEFT JOIN section sec ON s.section_id = sec.section_id
        LEFT JOIN floor f ON s.floor_id = f.floor_id
        LEFT JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE 1=1
          AND (search_pattern IS NULL OR (
            s.stall_number COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
            s.stall_location COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
            sec.section_name COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
            f.floor_name COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
            b.branch_name COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci
          ))
          AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
          AND (p_status IS NULL OR p_status = '' OR
               (p_status = 'Occupied' AND sh.stallholder_id IS NOT NULL) OR
               (p_status = 'Available' AND sh.stallholder_id IS NULL) OR
               (p_status NOT IN ('Occupied', 'Available') AND s.status COLLATE utf8mb4_unicode_ci = p_status COLLATE utf8mb4_unicode_ci))
          AND (p_price_type IS NULL OR p_price_type = '' OR s.price_type COLLATE utf8mb4_unicode_ci = p_price_type COLLATE utf8mb4_unicode_ci)
        ORDER BY b.branch_name, f.floor_name, s.stall_number ASC
        LIMIT p_limit OFFSET p_offset;
      END
    `);
    console.log('   ✅ sp_getLandingPageStallsList fixed\n');
  } catch (e) {
    console.error('   ❌ Error:', e.message);
  }

  // 2. Fix sp_getLandingPageFilterOptions - remove business_type reference
  console.log('2. Dropping and recreating sp_getLandingPageFilterOptions...');
  try {
    await conn.query('DROP PROCEDURE IF EXISTS sp_getLandingPageFilterOptions');
    
    await conn.query(`
      CREATE PROCEDURE sp_getLandingPageFilterOptions()
      BEGIN
        -- Get all branches
        SELECT branch_id, branch_name FROM branch WHERE status = 'Active' ORDER BY branch_name;
        
        -- Get all status options
        SELECT 'Available' as status UNION SELECT 'Occupied' UNION SELECT 'Reserved' UNION SELECT 'Maintenance';
        
        -- Get all price types
        SELECT 'Fixed Price' as price_type UNION SELECT 'Auction' UNION SELECT 'Raffle';
      END
    `);
    console.log('   ✅ sp_getLandingPageFilterOptions fixed\n');
  } catch (e) {
    console.error('   ❌ Error:', e.message);
  }

  // Test the fixed procedures
  console.log('=== Testing Fixed Procedures ===\n');

  console.log('3. Testing sp_getLandingPageStallsList...');
  try {
    const [rows] = await conn.execute('CALL sp_getLandingPageStallsList(?, ?, ?, ?, ?, ?)', [null, null, null, null, 20, 0]);
    console.log(`   ✅ Success! Found ${rows[0].length} stalls\n`);
  } catch (e) {
    console.error('   ❌ Error:', e.message);
  }

  console.log('4. Testing sp_getLandingPageFilterOptions...');
  try {
    const [rows] = await conn.execute('CALL sp_getLandingPageFilterOptions()');
    console.log(`   ✅ Success! Got ${rows.length} result sets\n`);
    console.log('   Branches:', rows[0].length);
    console.log('   Statuses:', rows[1].length);
    console.log('   Price Types:', rows[2].length);
  } catch (e) {
    console.error('   ❌ Error:', e.message);
  }

  await conn.end();
  console.log('\n✅ All fixes applied successfully!');
})();
