-- Fix for vendor stored procedure after adding vendor_spouse_id column
-- Run this to fix the 500 error when fetching vendors

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllVendors`$$

CREATE PROCEDURE `getAllVendors`()
BEGIN
    SELECT 
        v.*,
        'Unassigned' AS collector_name
    FROM vendor v
    ORDER BY v.created_at DESC;
END$$

DELIMITER ;

-- Test the procedure
CALL getAllVendors();
