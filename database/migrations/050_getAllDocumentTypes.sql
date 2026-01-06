-- Migration: 050_getAllDocumentTypes.sql
-- Description: getAllDocumentTypes stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllDocumentTypes`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllDocumentTypes` ()   BEGIN
    SELECT 
        document_type_id,
        document_name,
        description,
        is_system_default,
        created_at
    FROM document_types
    ORDER BY document_name;
END$$

DELIMITER ;
