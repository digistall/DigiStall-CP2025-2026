-- Migration: 079_getBusinessOwnerManagers.sql
-- Description: getBusinessOwnerManagers stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getBusinessOwnerManagers`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessOwnerManagers` (IN `p_business_owner_id` INT)   BEGIN
    SELECT 
        bom.relationship_id,
        bom.business_owner_id,
        bom.business_manager_id,
        bom.is_primary,
        bom.access_level,
        bom.assigned_date,
        bom.status,
        bm.manager_username,
        CONCAT(bm.first_name, ' ', bm.last_name) as manager_name,
        bm.email as manager_email,
        bm.contact_number as manager_contact,
        b.branch_id,
        b.branch_name,
        b.area,
        CONCAT(sa.first_name, ' ', sa.last_name) as assigned_by_name
    FROM business_owner_managers bom
    INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
    LEFT JOIN branch b ON bm.branch_id = b.branch_id
    LEFT JOIN system_administrator sa ON bom.assigned_by_system_admin = sa.system_admin_id
    WHERE bom.business_owner_id = p_business_owner_id
      AND bom.status = 'Active'
    ORDER BY bom.is_primary DESC, bom.assigned_date ASC;
END$$

DELIMITER ;
