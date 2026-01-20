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

  console.log('=== Fixing sp_getLandingPageStallsList with BLOB images ===\n');

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
          si.image_id as stall_image_id,
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
    console.log('✅ sp_getLandingPageStallsList fixed (using image_id instead of image_url)\n');
  } catch (e) {
    console.error('❌ Error:', e.message);
  }

  // Test
  console.log('Testing sp_getLandingPageStallsList...');
  try {
    const [rows] = await conn.execute('CALL sp_getLandingPageStallsList(?, ?, ?, ?, ?, ?)', [null, null, null, null, 20, 0]);
    console.log(`✅ Success! Found ${rows[0].length} stalls`);
    if (rows[0].length > 0) {
      console.log('Sample:', JSON.stringify(rows[0][0], null, 2));
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
  }

  await conn.end();
})();
