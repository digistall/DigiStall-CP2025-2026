-- Migration: 042_getAllActiveInspectors.sql
-- Description: getAllActiveInspectors stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllActiveInspectors`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllActiveInspectors` ()   BEGIN
  SELECT 
    inspector_id,
    CONCAT(first_name, ' ', last_name) AS inspector_name,
    first_name,
    last_name,
    email,
    contact_no,
    status,
    date_hired
  FROM inspector
  WHERE status = 'active'
  ORDER BY first_name, last_name;
END$$

DELIMITER ;
