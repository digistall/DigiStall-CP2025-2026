-- =====================================================
-- Stored Procedure: sp_GetVendorByIdentifier
-- Description: Looks up a vendor by their unique vendor_identifier
--              Used by QR code scanning in collector mobile app
-- Author: QR Collection System
-- Date: 2026-06-15
-- Updated: Fixed result set structure for Node.js mysql2 driver
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_GetVendorByIdentifier //

CREATE PROCEDURE sp_GetVendorByIdentifier(
    IN p_vendor_identifier VARCHAR(45)
)
proc_main: BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_vendor_id INT DEFAULT NULL;

    -- Validate input
    IF p_vendor_identifier IS NULL OR TRIM(p_vendor_identifier) = '' THEN
        SELECT 0 AS success, 'Vendor identifier is required' AS message,
               NULL AS vendor_id, NULL AS vendor_identifier, NULL AS first_name,
               NULL AS last_name, NULL AS middle_name, NULL AS contact_number,
               NULL AS email, NULL AS status, NULL AS assigned_location_id,
               NULL AS location_name, NULL AS location_address;
        LEAVE proc_main;
    END IF;

    -- Check if vendor exists (case-insensitive)
    SELECT COUNT(*), MAX(vendor_id) INTO v_count, v_vendor_id
    FROM vendor
    WHERE LOWER(vendor_identifier) = LOWER(p_vendor_identifier);

    IF v_count = 0 THEN
        SELECT 0 AS success, 'Vendor not found' AS message,
               NULL AS vendor_id, NULL AS vendor_identifier, NULL AS first_name,
               NULL AS last_name, NULL AS middle_name, NULL AS contact_number,
               NULL AS email, NULL AS status, NULL AS assigned_location_id,
               NULL AS location_name, NULL AS location_address;
        LEAVE proc_main;
    END IF;

    -- Return vendor details
    SELECT
        1 AS success,
        'Vendor found' AS message,
        v.vendor_id,
        v.vendor_identifier,
        v.first_name,
        v.last_name,
        v.middle_name,
        v.contact_number,
        v.email,
        v.status,
        v.assigned_location_id,
        al.location_name,
        NULL AS location_address
    FROM vendor v
    LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
    WHERE v.vendor_id = v_vendor_id
    LIMIT 1;

END //

DELIMITER ;

-- Usage:
-- CALL sp_GetVendorByIdentifier('VEN001');
