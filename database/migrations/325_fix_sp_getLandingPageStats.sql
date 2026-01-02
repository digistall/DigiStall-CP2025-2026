-- =====================================================
-- Migration 325: Fix sp_getLandingPageStats
-- Purpose: Fix 'Unknown column status' error - stallholder table uses contract_status not status
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_getLandingPageStats//
CREATE PROCEDURE sp_getLandingPageStats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM stallholder WHERE contract_status = 'Active') as total_stallholders,
        (SELECT COUNT(*) FROM stall) as total_stalls,
        (SELECT COUNT(*) FROM stall WHERE is_available = 1) as available_stalls,
        (SELECT COUNT(*) FROM stall WHERE is_available = 0) as occupied_stalls;
END//

DELIMITER ;
