-- Delete Section stored procedure
DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteSection`$$

CREATE PROCEDURE `deleteSection`(
    IN p_section_id INT
)
BEGIN
    DECLARE v_stall_count INT;
    DECLARE v_section_exists INT DEFAULT 0;
    
    -- Check if section exists
    SELECT COUNT(*) INTO v_section_exists
    FROM section
    WHERE section_id = p_section_id;
    
    IF v_section_exists = 0 THEN
        SELECT 0 as success, 'Section not found' as message;
    ELSE
        -- Check if section has stalls
        SELECT COUNT(*) INTO v_stall_count
        FROM stall
        WHERE section_id = p_section_id;
        
        IF v_stall_count > 0 THEN
            SELECT 0 as success, 
                   CONCAT('Cannot delete section. It has ', v_stall_count, ' stall(s). Please reassign or delete stalls first.') as message;
        ELSE
            -- Delete section (trigger will handle auto increment reset)
            DELETE FROM section WHERE section_id = p_section_id;
            
            IF ROW_COUNT() > 0 THEN
                SELECT 1 as success, 'Section deleted successfully' as message;
            ELSE
                SELECT 0 as success, 'Failed to delete section' as message;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;
