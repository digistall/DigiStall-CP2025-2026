-- Migration: 404_sp_updateCollector.sql
-- Description: Create stored procedure for updating collector information
-- Date: 2026-01-08
-- Author: System

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_updateCollector$$

CREATE PROCEDURE sp_updateCollector(
    IN p_collector_id INT,
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_phone_number VARCHAR(20)
)
BEGIN
    DECLARE v_affected_rows INT DEFAULT 0;
    
    -- Check if collector table exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'collector'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Collector table does not exist';
    END IF;
    
    -- Check if email already exists for a different collector
    IF EXISTS (
        SELECT 1 
        FROM collector 
        WHERE email = p_email 
        AND collector_id != p_collector_id
        AND status = 'active'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email already exists for another collector';
    END IF;
    
    -- Update collector information
    UPDATE collector
    SET 
        first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        contact_no = p_phone_number
    WHERE 
        collector_id = p_collector_id
        AND status = 'active';
    
    SET v_affected_rows = ROW_COUNT();
    
    -- Return result
    SELECT v_affected_rows AS affected_rows;
    
END$$

DELIMITER ;
