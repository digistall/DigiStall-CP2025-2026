-- Migration: 022_createFloor.sql
-- Description: createFloor stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `createFloor`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createFloor` (IN `p_branch_id` INT, IN `p_floor_name` VARCHAR(50), IN `p_floor_number` INT, IN `p_branch_id_duplicate` INT)   BEGIN
    INSERT INTO floor (branch_id, floor_name, floor_number)
    VALUES (p_branch_id, p_floor_name, p_floor_number);
    
    SELECT LAST_INSERT_ID() as floor_id;
END$$

DELIMITER ;
