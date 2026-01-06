-- Migration: 402_sp_getAllStalls_complete_with_payment_status.sql
-- Description: Updated sp_getAllStalls_complete to include payment status based on rental payments
-- Fix: Stall should show as 'Overdue' if stallholder hasn't paid monthly rental (not just any payment like penalties)
-- Fix: Added COLLATE clause to fix collation mismatch between utf8mb4_general_ci and utf8mb4_0900_ai_ci
-- Fix: Query the payments table directly for rental payments, don't rely on stallholder.last_payment_date
-- Fix: Include contract_start_date in result set for frontend fallback logic
-- Date: 2026-01-06

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getAllStalls_complete`$$

CREATE PROCEDURE `sp_getAllStalls_complete` (IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_branch_id` INT)
BEGIN
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
            -- Updated availability_status: Query payments table for actual rental payments
            CASE 
                WHEN sh.stall_id IS NULL THEN 
                    CASE 
                        WHEN s.is_available = 1 THEN 'Available'
                        ELSE 'Unavailable'
                    END
                WHEN sh.stall_id IS NOT NULL THEN
                    -- Check if stallholder has a rental payment where payment_date + 30 days >= today
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM payments p 
                            WHERE p.stallholder_id = sh.stallholder_id 
                            AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                            AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()
                        ) THEN 'Occupied'
                        -- If no rental payment but contract just started (within 30 days), still Occupied
                        WHEN sh.contract_start_date IS NOT NULL 
                            AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE()
                            AND NOT EXISTS (
                                SELECT 1 FROM payments p 
                                WHERE p.stallholder_id = sh.stallholder_id 
                                AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            ) THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name,
            sh.payment_status as stallholder_payment_status,
            sh.contract_start_date,
            -- Get the most recent rental payment date from payments table
            (SELECT MAX(p.payment_date) FROM payments p 
             WHERE p.stallholder_id = sh.stallholder_id 
             AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
             AND p.payment_status COLLATE utf8mb4_general_ci = 'completed') as last_payment_date,
            -- Add calculated next payment due date based on actual rental payments
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
            -- Add flag for whether rental payment is current (not overdue)
            CASE 
                WHEN sh.stallholder_id IS NULL THEN 0
                WHEN EXISTS (
                    SELECT 1 FROM payments p 
                    WHERE p.stallholder_id = sh.stallholder_id 
                    AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                    AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()
                ) THEN 1
                WHEN sh.contract_start_date IS NOT NULL 
                    AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE()
                    AND NOT EXISTS (
                        SELECT 1 FROM payments p 
                        WHERE p.stallholder_id = sh.stallholder_id 
                        AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    ) THEN 1
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
                    CASE 
                        WHEN s.is_available = 1 THEN 'Available'
                        ELSE 'Unavailable'
                    END
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
                            AND NOT EXISTS (
                                SELECT 1 FROM payments p 
                                WHERE p.stallholder_id = sh.stallholder_id 
                                AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            ) THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name,
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
                WHEN EXISTS (
                    SELECT 1 FROM payments p 
                    WHERE p.stallholder_id = sh.stallholder_id 
                    AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                    AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()
                ) THEN 1
                WHEN sh.contract_start_date IS NOT NULL 
                    AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE()
                    AND NOT EXISTS (
                        SELECT 1 FROM payments p 
                        WHERE p.stallholder_id = sh.stallholder_id 
                        AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    ) THEN 1
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
                    CASE 
                        WHEN s.is_available = 1 THEN 'Available'
                        ELSE 'Unavailable'
                    END
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
                            AND NOT EXISTS (
                                SELECT 1 FROM payments p 
                                WHERE p.stallholder_id = sh.stallholder_id 
                                AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            ) THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name,
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
                WHEN EXISTS (
                    SELECT 1 FROM payments p 
                    WHERE p.stallholder_id = sh.stallholder_id 
                    AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                    AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()
                ) THEN 1
                WHEN sh.contract_start_date IS NOT NULL 
                    AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE()
                    AND NOT EXISTS (
                        SELECT 1 FROM payments p 
                        WHERE p.stallholder_id = sh.stallholder_id 
                        AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    ) THEN 1
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
                    CASE 
                        WHEN s.is_available = 1 THEN 'Available'
                        ELSE 'Unavailable'
                    END
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
                            AND NOT EXISTS (
                                SELECT 1 FROM payments p 
                                WHERE p.stallholder_id = sh.stallholder_id 
                                AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            ) THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name,
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
                WHEN EXISTS (
                    SELECT 1 FROM payments p 
                    WHERE p.stallholder_id = sh.stallholder_id 
                    AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                    AND DATE_ADD(p.payment_date, INTERVAL 30 DAY) >= CURDATE()
                ) THEN 1
                WHEN sh.contract_start_date IS NOT NULL 
                    AND DATE_ADD(sh.contract_start_date, INTERVAL 30 DAY) >= CURDATE()
                    AND NOT EXISTS (
                        SELECT 1 FROM payments p 
                        WHERE p.stallholder_id = sh.stallholder_id 
                        AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    ) THEN 1
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
