-- Migration: 202_sp_getLandingPageStats.sql
-- Description: sp_getLandingPageStats stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getLandingPageStats`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLandingPageStats` ()   BEGIN
    DECLARE v_total_stallholders INT DEFAULT 0;
    DECLARE v_total_stalls INT DEFAULT 0;
    
    -- Count active stallholders (with active contracts)
    SELECT COUNT(*) INTO v_total_stallholders
    FROM stallholder
    WHERE contract_status = 'Active';
    
    -- Count all stalls (regardless of status)
    SELECT COUNT(*) INTO v_total_stalls
    FROM stall;
    
    -- Return the statistics
    SELECT 
        v_total_stallholders AS total_stallholders,
        v_total_stalls AS total_stalls;
END$$

DELIMITER ;
