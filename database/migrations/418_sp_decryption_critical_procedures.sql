-- =============================================
-- 418: Decryption for Critical Procedures
-- Creates decrypted versions of getAllApplicants and sp_getAllStalls_complete
-- =============================================

DELIMITER $$

-- =============================================
-- 1. GET ALL APPLICANTS - DECRYPTED
-- =============================================
DROP PROCEDURE IF EXISTS `getAllApplicantsDecrypted`$$

CREATE PROCEDURE `getAllApplicantsDecrypted`()
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        a.applicant_id,
        CASE WHEN a.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(a.encrypted_full_name, v_key) AS CHAR(255))
        ELSE a.applicant_full_name END as applicant_full_name,
        CASE WHEN a.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(a.encrypted_contact, v_key) AS CHAR(50))
        ELSE a.applicant_contact_number END as applicant_contact_number,
        CASE WHEN a.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(a.encrypted_address, v_key) AS CHAR(500))
        ELSE a.applicant_address END as applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        CASE WHEN a.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(a.encrypted_email, v_key) AS CHAR(255))
        ELSE a.applicant_email END as applicant_email,
        a.applicant_username,
        a.email_verified,
        a.last_login,
        a.login_attempts,
        a.account_locked_until,
        a.created_at,
        a.updated_at
    FROM applicant a
    ORDER BY FIELD(COALESCE((SELECT app.application_status FROM application app WHERE app.applicant_id = a.applicant_id ORDER BY app.application_date DESC LIMIT 1), 'pending'), 'pending', 'Pending', 'approved', 'Approved', 'rejected', 'Rejected'), a.created_at DESC;
END$$

-- =============================================
-- 2. HELPER FUNCTION: Decrypt stallholder name
-- =============================================
DROP FUNCTION IF EXISTS `fn_decrypt_stallholder_name`$$

CREATE FUNCTION `fn_decrypt_stallholder_name`(
    p_stallholder_id INT
) RETURNS VARCHAR(255)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_key VARCHAR(64);
    DECLARE v_name VARCHAR(255);
    DECLARE v_encrypted VARBINARY(512);
    DECLARE v_is_encrypted TINYINT;
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT stallholder_name, encrypted_name, COALESCE(is_encrypted, 0) 
    INTO v_name, v_encrypted, v_is_encrypted
    FROM stallholder WHERE stallholder_id = p_stallholder_id;
    
    IF v_is_encrypted = 1 AND v_key IS NOT NULL AND v_encrypted IS NOT NULL THEN
        RETURN CAST(AES_DECRYPT(v_encrypted, v_key) AS CHAR(255));
    END IF;
    
    RETURN v_name;
END$$

-- =============================================
-- 3. GET ALL STALLS COMPLETE - DECRYPTED VERSION
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getAllStalls_complete_decrypted`$$

CREATE PROCEDURE `sp_getAllStalls_complete_decrypted` (IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_branch_id` INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    IF p_user_type COLLATE utf8mb4_general_ci = 'stall_business_owner' THEN
        
        SELECT 
            s.stall_id,
            s.stall_no,
            s.stall_location,
            s.size,
            s.floor_id,
            f.floor_name,
            s.section_id,
            sec.section_name,
            s.rental_price,
            s.price_type,
            s.status,
            s.stamp,
            s.description,
            si.image_url as stall_image,
            s.is_available,
            s.raffle_auction_deadline,
            s.deadline_active,
            s.raffle_auction_status,
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NULL THEN 
                    CASE WHEN s.is_available = 1 THEN 'Available' ELSE 'Unavailable' END
                WHEN sh.stall_id IS NOT NULL THEN
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM payments p 
                            WHERE p.stallholder_id = sh.stallholder_id 
                            AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                            AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()
                        ) THEN 'Occupied'
                        WHEN sh.contract_start_date IS NOT NULL 
                            AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE()
                            AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental')
                        THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id,
            -- DECRYPTED stallholder_name
            CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
            ELSE sh.stallholder_name END as stallholder_name,
            sh.payment_status as stallholder_payment_status,
            sh.contract_start_date,
            (SELECT MAX(p.payment_date) FROM payments p 
             WHERE p.stallholder_id = sh.stallholder_id 
             AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
             AND p.payment_status COLLATE utf8mb4_general_ci = 'completed') as last_payment_date,
            CASE 
                WHEN (SELECT MAX(p.payment_date) FROM payments p 
                      WHERE p.stallholder_id = sh.stallholder_id 
                      AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                      AND p.payment_status COLLATE utf8mb4_general_ci = 'completed') IS NOT NULL 
                THEN DATE_ADD((SELECT MAX(p.payment_date) FROM payments p 
                               WHERE p.stallholder_id = sh.stallholder_id 
                               AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                               AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'), INTERVAL 30 DAY)
                WHEN sh.contract_start_date IS NOT NULL THEN DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY)
                ELSE NULL
            END as next_payment_due,
            CASE 
                WHEN sh.stallholder_id IS NULL THEN 0
                WHEN EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed' AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()) THEN 1
                WHEN sh.contract_start_date IS NOT NULL AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE() AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental') THEN 1
                ELSE 0
            END as rental_paid_current_month
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status COLLATE utf8mb4_general_ci = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE b.branch_id IN (
            SELECT DISTINCT bm.branch_id
            FROM business_owner_managers bom
            INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
            WHERE bom.business_owner_id = p_user_id AND bom.status COLLATE utf8mb4_general_ci = 'Active'
        )
        ORDER BY b.branch_name, s.created_at DESC;

    ELSEIF p_user_type COLLATE utf8mb4_general_ci = 'system_administrator' THEN
        
        SELECT 
            s.stall_id,
            s.stall_no,
            s.stall_location,
            s.size,
            s.floor_id,
            f.floor_name,
            s.section_id,
            sec.section_name,
            s.rental_price,
            s.price_type,
            s.status,
            s.stamp,
            s.description,
            si.image_url as stall_image,
            s.is_available,
            s.raffle_auction_deadline,
            s.deadline_active,
            s.raffle_auction_status,
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NULL THEN 
                    CASE WHEN s.is_available = 1 THEN 'Available' ELSE 'Unavailable' END
                WHEN sh.stall_id IS NOT NULL THEN
                    CASE 
                        WHEN EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed' AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()) THEN 'Occupied'
                        WHEN sh.contract_start_date IS NOT NULL AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE() AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental') THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id,
            CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
            ELSE sh.stallholder_name END as stallholder_name,
            sh.payment_status as stallholder_payment_status,
            sh.contract_start_date,
            (SELECT MAX(p.payment_date) FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed') as last_payment_date,
            CASE 
                WHEN (SELECT MAX(p.payment_date) FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed') IS NOT NULL 
                THEN DATE_ADD((SELECT MAX(p.payment_date) FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'), INTERVAL 30 DAY)
                WHEN sh.contract_start_date IS NOT NULL THEN DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY)
                ELSE NULL
            END as next_payment_due,
            CASE 
                WHEN sh.stallholder_id IS NULL THEN 0
                WHEN EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed' AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()) THEN 1
                WHEN sh.contract_start_date IS NOT NULL AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE() AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental') THEN 1
                ELSE 0
            END as rental_paid_current_month
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status COLLATE utf8mb4_general_ci = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        ORDER BY b.branch_name, s.created_at DESC;

    ELSEIF p_user_type COLLATE utf8mb4_general_ci = 'business_manager' THEN
        
        SELECT 
            s.stall_id,
            s.stall_no,
            s.stall_location,
            s.size,
            s.floor_id,
            f.floor_name,
            s.section_id,
            sec.section_name,
            s.rental_price,
            s.price_type,
            s.status,
            s.stamp,
            s.description,
            si.image_url as stall_image,
            s.is_available,
            s.raffle_auction_deadline,
            s.deadline_active,
            s.raffle_auction_status,
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NULL THEN 
                    CASE WHEN s.is_available = 1 THEN 'Available' ELSE 'Unavailable' END
                WHEN sh.stall_id IS NOT NULL THEN
                    CASE 
                        WHEN EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed' AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()) THEN 'Occupied'
                        WHEN sh.contract_start_date IS NOT NULL AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE() AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental') THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id,
            CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
            ELSE sh.stallholder_name END as stallholder_name,
            sh.payment_status as stallholder_payment_status,
            sh.contract_start_date,
            (SELECT MAX(p.payment_date) FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed') as last_payment_date,
            CASE 
                WHEN (SELECT MAX(p.payment_date) FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed') IS NOT NULL 
                THEN DATE_ADD((SELECT MAX(p.payment_date) FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'), INTERVAL 30 DAY)
                WHEN sh.contract_start_date IS NOT NULL THEN DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY)
                ELSE NULL
            END as next_payment_due,
            CASE 
                WHEN sh.stallholder_id IS NULL THEN 0
                WHEN EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed' AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()) THEN 1
                WHEN sh.contract_start_date IS NOT NULL AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE() AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental') THEN 1
                ELSE 0
            END as rental_paid_current_month
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        INNER JOIN business_manager bm ON b.branch_id = bm.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status COLLATE utf8mb4_general_ci = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE bm.business_manager_id = p_user_id
        ORDER BY s.created_at DESC;
        
    ELSEIF p_user_type COLLATE utf8mb4_general_ci = 'business_employee' THEN
        
        SELECT 
            s.stall_id,
            s.stall_no,
            s.stall_location,
            s.size,
            s.floor_id,
            f.floor_name,
            s.section_id,
            sec.section_name,
            s.rental_price,
            s.price_type,
            s.status,
            s.stamp,
            s.description,
            si.image_url as stall_image,
            s.is_available,
            s.raffle_auction_deadline,
            s.deadline_active,
            s.raffle_auction_status,
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NULL THEN 
                    CASE WHEN s.is_available = 1 THEN 'Available' ELSE 'Unavailable' END
                WHEN sh.stall_id IS NOT NULL THEN
                    CASE 
                        WHEN EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed' AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()) THEN 'Occupied'
                        WHEN sh.contract_start_date IS NOT NULL AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE() AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental') THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id,
            CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
            ELSE sh.stallholder_name END as stallholder_name,
            sh.payment_status as stallholder_payment_status,
            sh.contract_start_date,
            (SELECT MAX(p.payment_date) FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed') as last_payment_date,
            CASE 
                WHEN (SELECT MAX(p.payment_date) FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed') IS NOT NULL 
                THEN DATE_ADD((SELECT MAX(p.payment_date) FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'), INTERVAL 30 DAY)
                WHEN sh.contract_start_date IS NOT NULL THEN DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY)
                ELSE NULL
            END as next_payment_due,
            CASE 
                WHEN sh.stallholder_id IS NULL THEN 0
                WHEN EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental' AND p.payment_status COLLATE utf8mb4_general_ci = 'completed' AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()) THEN 1
                WHEN sh.contract_start_date IS NOT NULL AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE() AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.stallholder_id = sh.stallholder_id AND p.payment_type COLLATE utf8mb4_general_ci = 'rental') THEN 1
                ELSE 0
            END as rental_paid_current_month
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status COLLATE utf8mb4_general_ci = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE b.branch_id = p_branch_id
        ORDER BY s.created_at DESC;
        
    ELSE
        SELECT NULL LIMIT 0;
    END IF;
END$$

DELIMITER ;

SELECT '✅ Migration 418 complete - Critical decryption procedures ready!' as status;
