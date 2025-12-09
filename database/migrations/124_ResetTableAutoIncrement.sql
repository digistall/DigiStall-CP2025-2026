-- Migration: 124_ResetTableAutoIncrement.sql
-- Description: ResetTableAutoIncrement stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `ResetTableAutoIncrement`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ResetTableAutoIncrement` (IN `tableName` VARCHAR(255))   BEGIN
    DECLARE maxId INT DEFAULT 0;
    DECLARE newAutoInc INT DEFAULT 1;
    
    SET @sql = CONCAT('SELECT COALESCE(MAX(', 
        (SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = tableName 
         AND COLUMN_KEY = 'PRI' 
         AND EXTRA LIKE '%auto_increment%'
         LIMIT 1), 
        '), 0) INTO @maxId FROM ', tableName);
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    SET newAutoInc = @maxId + 1;
    
    SET @alterSql = CONCAT('ALTER TABLE ', tableName, ' AUTO_INCREMENT = ', newAutoInc);
    PREPARE alterStmt FROM @alterSql;
    EXECUTE alterStmt;
    DEALLOCATE PREPARE alterStmt;
    
    SELECT CONCAT('âœ… Reset ', tableName, ' AUTO_INCREMENT to ', newAutoInc) AS result;
END$$

DELIMITER ;
