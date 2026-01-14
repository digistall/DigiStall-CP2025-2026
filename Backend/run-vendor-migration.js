// Run Vendor System Migration
import mysql from "mysql2/promise";
import fs from "fs";

async function runMigration() {
  const conn = await mysql.createConnection({
    host: "dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com",
    port: 25060,
    user: "doadmin",
    password: "AVNS_hxkemfGwzsOdj4pbu35",
    database: "naga_stall",
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
  });

  try {
    console.log("🔧 Connected to database");

    // Step 1: Create tables
    console.log("📦 Creating tables...");
    const tablesSql = fs.readFileSync(
      "../database/migrations/403_vendor_system_complete_fixed.sql",
      "utf8"
    );
    await conn.query(tablesSql);
    console.log("✅ Tables created");

    // Step 2: Create stored procedures
    console.log("📝 Creating stored procedures...");

    const procedures = [
      {
        name: "createCollector",
        sql: `CREATE PROCEDURE createCollector (
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_contact_no VARCHAR(20),
    IN p_branch_id INT,
    IN p_date_hired DATE,
    IN p_branch_manager_id INT
)
BEGIN
    DECLARE new_collector_id INT;
    DECLARE exit_handler BOOLEAN DEFAULT FALSE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET exit_handler = TRUE;
    
    -- Insert collector
    INSERT INTO collector (
        username,
        password_hash,
        first_name,
        last_name,
        email,
        contact_no,
        date_hired,
        status
    ) VALUES (
        p_username,
        p_password_hash,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_no,
        IFNULL(p_date_hired, CURDATE()),
        'active'
    );
    
    IF exit_handler THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Failed to create collector';
    END IF;
    
    SET new_collector_id = LAST_INSERT_ID();
    
    -- Create branch assignment
    INSERT INTO collector_assignment (
        collector_id,
        branch_id,
        start_date,
        status,
        remarks
    ) VALUES (
        new_collector_id,
        p_branch_id,
        CURDATE(),
        'Active',
        'Newly hired collector'
    );
    
    -- Log the action
    INSERT INTO collector_action_log (
        collector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    ) VALUES (
        new_collector_id,
        p_branch_id,
        p_branch_manager_id,
        'New Hire',
        NOW(),
        CONCAT('Collector ', p_first_name, ' ', p_last_name, ' was hired and assigned to branch ID ', p_branch_id)
    );
    
    -- Return the new collector
    SELECT 
        new_collector_id as collector_id,
        p_username as username,
        p_first_name as first_name,
        p_last_name as last_name,
        p_email as email,
        'Collector created successfully' as message;
END`,
      },
      {
        name: "getCollectorById",
        sql: `CREATE PROCEDURE getCollectorById (
    IN p_collector_id INT
)
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.password_hash,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_created,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.collector_id = p_collector_id;
END`,
      },
      {
        name: "getCollectorByUsername",
        sql: `CREATE PROCEDURE getCollectorByUsername (
    IN p_username VARCHAR(50)
)
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.password_hash,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_created,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.username = p_username AND c.status = 'active'
    LIMIT 1;
END`,
      },
      {
        name: "getAllCollectors",
        sql: `CREATE PROCEDURE getAllCollectors ()
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_created,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    ORDER BY c.last_name, c.first_name;
END`,
      },
      {
        name: "getCollectorsByBranch",
        sql: `CREATE PROCEDURE getCollectorsByBranch (
    IN p_branch_id INT
)
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_created,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE ca.branch_id = p_branch_id
    ORDER BY c.date_created DESC;
END`,
      },
      {
        name: "updateCollector",
        sql: `CREATE PROCEDURE updateCollector (
    IN p_collector_id INT,
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_contact_no VARCHAR(20),
    IN p_branch_id INT,
    IN p_status VARCHAR(20)
)
BEGIN
    UPDATE collector SET
        first_name = IFNULL(p_first_name, first_name),
        last_name = IFNULL(p_last_name, last_name),
        email = IFNULL(p_email, email),
        contact_no = IFNULL(p_contact_no, contact_no),
        status = IFNULL(p_status, status)
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() AS affected_rows;
END`,
      },
      {
        name: "updateCollectorLogin",
        sql: `CREATE PROCEDURE updateCollectorLogin (
    IN p_collector_id INT
)
BEGIN
    UPDATE collector 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE collector_id = p_collector_id;
END`,
      },
      {
        name: "deleteCollector",
        sql: `CREATE PROCEDURE deleteCollector (
    IN p_collector_id INT
)
BEGIN
    UPDATE collector 
    SET status = 'inactive', 
        date_created = NOW() 
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() AS affected_rows;
END`,
      },
      {
        name: "terminateCollector",
        sql: `CREATE PROCEDURE terminateCollector (
    IN p_collector_id INT,
    IN p_reason VARCHAR(255),
    IN p_branch_manager_id INT
)
BEGIN
    DECLARE v_branch_id INT;
    DECLARE v_first_name VARCHAR(100);
    DECLARE v_last_name VARCHAR(100);
    
    -- Get current assignment info
    SELECT ca.branch_id, c.first_name, c.last_name 
    INTO v_branch_id, v_first_name, v_last_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    WHERE c.collector_id = p_collector_id
    LIMIT 1;
    
    -- Update collector status
    UPDATE collector 
    SET status = 'inactive',
        termination_date = CURDATE(),
        termination_reason = p_reason
    WHERE collector_id = p_collector_id;
    
    -- Update assignment status
    UPDATE collector_assignment 
    SET status = 'Inactive',
        end_date = CURDATE()
    WHERE collector_id = p_collector_id AND status = 'Active';
    
    -- Log the termination
    INSERT INTO collector_action_log (
        collector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    ) VALUES (
        p_collector_id,
        v_branch_id,
        p_branch_manager_id,
        'Termination',
        NOW(),
        CONCAT('Collector ', v_first_name, ' ', v_last_name, ' was terminated. Reason: ', p_reason)
    );
    
    SELECT 'Collector terminated successfully' as message;
END`,
      },
      {
        name: "createVendor",
        sql: `CREATE PROCEDURE createVendor (
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_phone VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_birthdate DATE,
    IN p_gender VARCHAR(20),
    IN p_address TEXT,
    IN p_business_name VARCHAR(255),
    IN p_business_type VARCHAR(100),
    IN p_business_description TEXT,
    IN p_vendor_identifier VARCHAR(100),
    IN p_collector_id INT
)
BEGIN
    INSERT INTO vendor (
        first_name,
        last_name,
        middle_name,
        phone,
        email,
        birthdate,
        gender,
        address,
        business_name,
        business_type,
        business_description,
        vendor_identifier,
        collector_id,
        status
    ) VALUES (
        p_first_name,
        p_last_name,
        p_middle_name,
        p_phone,
        p_email,
        p_birthdate,
        p_gender,
        p_address,
        p_business_name,
        p_business_type,
        p_business_description,
        p_vendor_identifier,
        p_collector_id,
        'Active'
    );
    
    SELECT 
        v.*, 
        c.first_name AS collector_first_name, 
        c.last_name AS collector_last_name
    FROM vendor v
    LEFT JOIN collector c ON v.collector_id = c.collector_id
    WHERE v.vendor_id = LAST_INSERT_ID();
END`,
      },
      {
        name: "getVendorById",
        sql: `CREATE PROCEDURE getVendorById (
    IN p_vendor_id INT
)
BEGIN
    SELECT 
        v.*, 
        c.first_name AS collector_first_name, 
        c.last_name AS collector_last_name
    FROM vendor v
    LEFT JOIN collector c ON v.collector_id = c.collector_id
    WHERE v.vendor_id = p_vendor_id;
END`,
      },
      {
        name: "getAllVendors",
        sql: `CREATE PROCEDURE getAllVendors ()
BEGIN
    SELECT 
        v.*, 
        c.first_name AS collector_first_name, 
        c.last_name AS collector_last_name
    FROM vendor v
    LEFT JOIN collector c ON v.collector_id = c.collector_id
    ORDER BY v.created_at DESC;
END`,
      },
      {
        name: "getVendorsByCollectorId",
        sql: `CREATE PROCEDURE getVendorsByCollectorId (
    IN p_collector_id INT
)
BEGIN
    SELECT v.* 
    FROM vendor v 
    WHERE v.collector_id = p_collector_id 
    ORDER BY v.last_name, v.first_name;
END`,
      },
      {
        name: "updateVendor",
        sql: `CREATE PROCEDURE updateVendor (
    IN p_vendor_id INT,
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_phone VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_birthdate DATE,
    IN p_gender VARCHAR(20),
    IN p_address TEXT,
    IN p_business_name VARCHAR(255),
    IN p_business_type VARCHAR(100),
    IN p_business_description TEXT,
    IN p_vendor_identifier VARCHAR(100),
    IN p_collector_id INT,
    IN p_status VARCHAR(20)
)
BEGIN
    UPDATE vendor SET
        first_name = IFNULL(p_first_name, first_name),
        last_name = IFNULL(p_last_name, last_name),
        middle_name = p_middle_name,
        phone = IFNULL(p_phone, phone),
        email = p_email,
        birthdate = p_birthdate,
        gender = p_gender,
        address = p_address,
        business_name = IFNULL(p_business_name, business_name),
        business_type = p_business_type,
        business_description = p_business_description,
        vendor_identifier = p_vendor_identifier,
        collector_id = p_collector_id,
        status = IFNULL(p_status, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE vendor_id = p_vendor_id;
    
    SELECT ROW_COUNT() AS affected_rows;
END`,
      },
      {
        name: "deleteVendor",
        sql: `CREATE PROCEDURE deleteVendor (
    IN p_vendor_id INT
)
BEGIN
    UPDATE vendor 
    SET status = 'Inactive', 
        updated_at = NOW() 
    WHERE vendor_id = p_vendor_id;
    
    SELECT ROW_COUNT() AS affected_rows;
END`,
      },
    ];

    for (const proc of procedures) {
      console.log(`  Creating ${proc.name}...`);
      await conn.query(proc.sql);
    }

    console.log("✅ All stored procedures created");
    console.log("");
    console.log("🎉 Migration completed successfully!");
    console.log("");
    console.log("Created tables:");
    console.log("  - collector");
    console.log("  - collector_assignment");
    console.log("  - collector_action_log");
    console.log("  - vendor");
    console.log("");
    console.log("Created procedures:", procedures.length);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    throw err;
  } finally {
    await conn.end();
  }
}

runMigration().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
