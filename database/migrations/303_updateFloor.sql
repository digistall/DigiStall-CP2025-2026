-- Update Floor stored procedure
DELIMITER $$

DROP PROCEDURE IF EXISTS `updateFloor`$$

CREATE PROCEDURE `updateFloor`(
    IN p_floor_id INT,
    IN p_floor_name VARCHAR(50),
    IN p_floor_number INT,
    IN p_status ENUM('Active','Inactive','Under Construction','Maintenance')
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 as success, 'Failed to update floor' as message;
    END;
    
    START TRANSACTION;
    
    -- Check if floor exists
    IF NOT EXISTS (SELECT 1 FROM floor WHERE floor_id = p_floor_id) THEN
        SELECT 0 as success, 'Floor not found' as message;
        ROLLBACK;
    ELSE
        -- Update floor
        UPDATE floor 
        SET 
            floor_name = COALESCE(p_floor_name, floor_name),
            floor_number = COALESCE(p_floor_number, floor_number),
            status = COALESCE(p_status, status),
            updated_at = NOW()
        WHERE floor_id = p_floor_id;
        
        COMMIT;
        SELECT 1 as success, 'Floor updated successfully' as message;
    END IF;
END$$

DELIMITER ;
