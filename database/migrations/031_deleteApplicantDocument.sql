-- Migration: 031_deleteApplicantDocument.sql
-- Description: deleteApplicantDocument stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteApplicantDocument`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteApplicantDocument` (IN `p_document_id` INT, IN `p_applicant_id` INT)   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 as success, 'Error deleting document' as message;
    END;
    
    START TRANSACTION;
    
    DELETE FROM applicant_documents
    WHERE document_id = p_document_id
        AND applicant_id = p_applicant_id;
    
    IF ROW_COUNT() > 0 THEN
        COMMIT;
        SELECT 1 as success, 'Document deleted successfully' as message;
    ELSE
        ROLLBACK;
        SELECT 0 as success, 'Document not found' as message;
    END IF;
END$$

DELIMITER ;
