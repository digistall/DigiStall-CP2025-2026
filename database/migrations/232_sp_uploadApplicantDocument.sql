-- Migration: 232_sp_uploadApplicantDocument.sql
-- Description: sp_uploadApplicantDocument stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_uploadApplicantDocument`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_uploadApplicantDocument` (IN `p_applicant_id` INT, IN `p_document_type` VARCHAR(50), IN `p_file_path` VARCHAR(500), IN `p_original_filename` VARCHAR(255), IN `p_file_size` BIGINT, IN `p_mime_type` VARCHAR(100))   BEGIN
    DECLARE v_other_info_id INT DEFAULT NULL;
    
    SELECT other_info_id INTO v_other_info_id
    FROM other_information
    WHERE applicant_id = p_applicant_id
    LIMIT 1;
    
    IF v_other_info_id IS NULL THEN
        INSERT INTO other_information (applicant_id, email_address)
        VALUES (p_applicant_id, '');
        SET v_other_info_id = LAST_INSERT_ID();
    END IF;
    
    IF p_document_type = 'signature' THEN
        UPDATE other_information 
        SET signature_of_applicant = p_file_path
        WHERE other_info_id = v_other_info_id;
    ELSEIF p_document_type = 'location' THEN
        UPDATE other_information 
        SET house_sketch_location = p_file_path
        WHERE other_info_id = v_other_info_id;
    ELSEIF p_document_type = 'valid_id' THEN
        UPDATE other_information 
        SET valid_id = p_file_path
        WHERE other_info_id = v_other_info_id;
    END IF;
    
    SELECT 1 as success, 
           'Document uploaded successfully' as message,
           v_other_info_id as other_info_id,
           p_document_type as document_type,
           p_file_path as file_path;
END$$

DELIMITER ;
