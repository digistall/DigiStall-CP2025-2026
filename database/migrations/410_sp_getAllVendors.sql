-- Migration: 410_sp_getAllVendors.sql
-- Description: Get all vendors for dropdown selection
-- Date: 2026-01-10

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllVendors`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllVendors`()
BEGIN
    SELECT 
        v.*,
        'Unassigned' AS collector_name
    FROM vendor v
    ORDER BY v.created_at DESC;
END$$

DELIMITER ;
