-- Migration: 212_sp_getStallholderByApplicantId.sql
-- Description: sp_getStallholderByApplicantId stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getStallholderByApplicantId`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getStallholderByApplicantId` (IN `p_applicant_id` INT)   BEGIN
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.business_name,
        sh.business_type,
        sh.branch_id,
        sh.stall_id,
        sh.contract_start_date,
        sh.contract_end_date,
        sh.contract_status,
        sh.lease_amount,
        sh.monthly_rent,
        sh.payment_status,
        sh.compliance_status,
        s.stall_no,
        s.stall_location,
        s.size,
        b.branch_name
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.applicant_id = p_applicant_id;
END$$

DELIMITER ;
