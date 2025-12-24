-- Delete Floor stored procedure
DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteFloor`$$

CREATE PROCEDURE `deleteFloor`(
    IN p_floor_id INT
)
BEGIN
    DECLARE v_section_count INT;
    DECLARE v_stall_count INT;
    DECLARE v_floor_exists INT DEFAULT 0;
    
    -- Check if floor exists
    SELECT COUNT(*) INTO v_floor_exists
    FROM floor
    WHERE floor_id = p_floor_id;
    
    IF v_floor_exists = 0 THEN
        SELECT 0 as success, 'Floor not found' as message;
    ELSE
        -- Check if floor has sections
        SELECT COUNT(*) INTO v_section_count
        FROM section
        WHERE floor_id = p_floor_id;
        
        IF v_section_count > 0 THEN
            SELECT 0 as success, 
                   CONCAT('Cannot delete floor. It has ', v_section_count, ' section(s). Please delete sections first.') as message;
        ELSE
            -- Check if floor has stalls directly (shouldn't happen but just in case)
            SELECT COUNT(*) INTO v_stall_count
            FROM stall
            WHERE floor_id = p_floor_id;
            
            IF v_stall_count > 0 THEN
                SELECT 0 as success, 
                       CONCAT('Cannot delete floor. It has ', v_stall_count, ' stall(s). Please delete stalls first.') as message;
            ELSE
                -- Delete floor (trigger will handle auto increment reset)
                DELETE FROM floor WHERE floor_id = p_floor_id;
                
                IF ROW_COUNT() > 0 THEN
                    SELECT 1 as success, 'Floor deleted successfully' as message;
                ELSE
                    SELECT 0 as success, 'Failed to delete floor' as message;
                END IF;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;
