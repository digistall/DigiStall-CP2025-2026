-- Migration: 411_sp_getAllCollectors.sql
-- Description: Get all collectors for dropdown selection
-- Date: 2026-01-10

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllCollectors`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllCollectors`()
BEGIN
    SELECT 
        collector_id,
        CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) AS collector_name,
        email,
        contact_number,
        status
    FROM collector
    WHERE status = 'active'
    ORDER BY first_name, last_name;
END$$

DELIMITER ;
