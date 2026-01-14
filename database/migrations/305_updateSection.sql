-- Update Section stored procedure
DELIMITER $$

DROP PROCEDURE IF EXISTS `updateSection`$$

CREATE PROCEDURE `updateSection`(
    IN p_section_id INT,
    IN p_section_name VARCHAR(100),
    IN p_status ENUM('Active','Inactive','Under Construction','Maintenance')
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 as success, 'Failed to update section' as message;
    END;
    
    START TRANSACTION;
    
    -- Check if section exists
    IF NOT EXISTS (SELECT 1 FROM section WHERE section_id = p_section_id) THEN
        SELECT 0 as success, 'Section not found' as message;
        ROLLBACK;
    ELSE
        -- Update section
        UPDATE section 
        SET 
            section_name = COALESCE(p_section_name, section_name),
            status = COALESCE(p_status, status),
            updated_at = NOW()
        WHERE section_id = p_section_id;
        
        COMMIT;
        SELECT 1 as success, 'Section updated successfully' as message;
    END IF;
END$$

DELIMITER ;
