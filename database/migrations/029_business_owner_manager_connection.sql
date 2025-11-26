-- Migration: 029_business_owner_manager_connection
-- Description: Business Owner can own multiple stall businesses and assign multiple Business Managers
-- Author: System
-- Date: 2025-11-26

-- Add columns to track manager connections for Business Owners (if not exists)
-- Note: Business Owners can manage multiple businesses and assign multiple managers
SET @dbname = DATABASE();
SET @tablename = 'stall_business_owner';
SET @columnname = 'primary_manager_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` INT NULL COMMENT ''Primary Business Manager handling this owner'' AFTER `created_by_system_admin`, ADD INDEX `idx_primary_manager` (`', @columnname, '`);')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign key constraint if not exists
SET @constraintname = 'fk_owner_primary_manager';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = @constraintname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD CONSTRAINT `', @constraintname, '` FOREIGN KEY (`primary_manager_id`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Create table to track Business Owner - Manager relationships (many-to-many)
-- Business Owners can own multiple stall businesses and assign multiple managers per business
CREATE TABLE IF NOT EXISTS `business_owner_managers` (
  `relationship_id` INT NOT NULL AUTO_INCREMENT,
  `business_owner_id` INT NOT NULL,
  `business_manager_id` INT NOT NULL,
  `is_primary` TINYINT(1) DEFAULT 0 COMMENT 'Primary manager for this owner',
  `access_level` ENUM('Full', 'ViewOnly', 'Limited') DEFAULT 'Full',
  `assigned_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by_system_admin` INT NULL,
  `notes` TEXT NULL,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`relationship_id`),
  UNIQUE KEY `unique_owner_manager` (`business_owner_id`, `business_manager_id`),
  INDEX `idx_owner` (`business_owner_id`),
  INDEX `idx_manager` (`business_manager_id`),
  INDEX `idx_primary` (`is_primary`),
  CONSTRAINT `fk_owner_manager_owner` FOREIGN KEY (`business_owner_id`) REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_owner_manager_manager` FOREIGN KEY (`business_manager_id`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_owner_manager_admin` FOREIGN KEY (`assigned_by_system_admin`) REFERENCES `system_administrator` (`system_admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
COMMENT='Many-to-many: Business Owners can manage multiple businesses with multiple managers';

DELIMITER $$

-- Drop existing procedure if exists
DROP PROCEDURE IF EXISTS `createBusinessOwnerWithManagerConnection`$$

-- Procedure to create Business Owner with Manager connections and Subscription
CREATE PROCEDURE `createBusinessOwnerWithManagerConnection`(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_contact_number VARCHAR(20),
    IN p_plan_id INT,
    IN p_primary_manager_id INT,
    IN p_additional_manager_ids JSON,
    IN p_created_by_system_admin INT
)
BEGIN
    DECLARE v_business_owner_id INT;
    DECLARE v_subscription_id INT;
    DECLARE v_start_date DATE;
    DECLARE v_end_date DATE;
    DECLARE v_manager_id INT;
    DECLARE v_manager_count INT DEFAULT 0;
    DECLARE v_idx INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error creating business owner with manager connections';
    END;
    
    START TRANSACTION;
    
    -- 1. Create business owner account
    INSERT INTO stall_business_owner (
        owner_username,
        owner_password_hash,
        first_name,
        last_name,
        email,
        contact_number,
        status,
        subscription_status,
        primary_manager_id,
        created_by_system_admin
    ) VALUES (
        p_username,
        p_password_hash,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_number,
        'Active',
        'Pending',
        p_primary_manager_id,
        p_created_by_system_admin
    );
    
    SET v_business_owner_id = LAST_INSERT_ID();
    
    -- 2. Create subscription
    SET v_start_date = CURDATE();
    SET v_end_date = DATE_ADD(v_start_date, INTERVAL 1 MONTH);
    
    INSERT INTO business_owner_subscriptions (
        business_owner_id,
        plan_id,
        subscription_status,
        start_date,
        end_date,
        created_by_system_admin
    ) VALUES (
        v_business_owner_id,
        p_plan_id,
        'Pending',
        v_start_date,
        v_end_date,
        p_created_by_system_admin
    );
    
    SET v_subscription_id = LAST_INSERT_ID();
    
    -- 3. Create primary manager relationship
    IF p_primary_manager_id IS NOT NULL THEN
        INSERT INTO business_owner_managers (
            business_owner_id,
            business_manager_id,
            is_primary,
            access_level,
            assigned_by_system_admin,
            notes
        ) VALUES (
            v_business_owner_id,
            p_primary_manager_id,
            1,
            'Full',
            p_created_by_system_admin,
            'Primary manager assigned during account creation'
        );
    END IF;
    
    -- 4. Create additional manager relationships (if provided)
    IF p_additional_manager_ids IS NOT NULL AND JSON_LENGTH(p_additional_manager_ids) > 0 THEN
        SET v_manager_count = JSON_LENGTH(p_additional_manager_ids);
        SET v_idx = 0;
        
        WHILE v_idx < v_manager_count DO
            SET v_manager_id = JSON_EXTRACT(p_additional_manager_ids, CONCAT('$[', v_idx, ']'));
            
            -- Only add if different from primary manager
            IF v_manager_id != p_primary_manager_id THEN
                INSERT INTO business_owner_managers (
                    business_owner_id,
                    business_manager_id,
                    is_primary,
                    access_level,
                    assigned_by_system_admin,
                    notes
                ) VALUES (
                    v_business_owner_id,
                    v_manager_id,
                    0,
                    'Full',
                    p_created_by_system_admin,
                    'Additional manager assigned during account creation'
                );
            END IF;
            
            SET v_idx = v_idx + 1;
        END WHILE;
    END IF;
    
    COMMIT;
    
    -- Return created records with manager information
    SELECT 
        v_business_owner_id as business_owner_id,
        v_subscription_id as subscription_id,
        p_primary_manager_id as primary_manager_id,
        v_start_date as start_date,
        v_end_date as end_date,
        'Business Owner created successfully with manager connections' as message;
END$$

-- Procedure to get Business Owner's managers
DROP PROCEDURE IF EXISTS `getBusinessOwnerManagers`$$

CREATE PROCEDURE `getBusinessOwnerManagers`(
    IN p_business_owner_id INT
)
BEGIN
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

-- Procedure to get Manager's Business Owners
DROP PROCEDURE IF EXISTS `getManagerBusinessOwners`$$

CREATE PROCEDURE `getManagerBusinessOwners`(
    IN p_business_manager_id INT
)
BEGIN
    SELECT 
        bom.relationship_id,
        bom.business_owner_id,
        bom.is_primary,
        bom.access_level,
        bom.assigned_date,
        sbo.owner_username,
        CONCAT(sbo.first_name, ' ', sbo.last_name) as owner_name,
        sbo.email as owner_email,
        sbo.contact_number as owner_contact,
        sbo.status as owner_status,
        sbo.subscription_status,
        sbo.subscription_expiry_date,
        DATEDIFF(sbo.subscription_expiry_date, CURDATE()) as days_until_expiry,
        s.subscription_id,
        sp.plan_name,
        sp.monthly_fee
    FROM business_owner_managers bom
    INNER JOIN stall_business_owner sbo ON bom.business_owner_id = sbo.business_owner_id
    LEFT JOIN business_owner_subscriptions s ON sbo.business_owner_id = s.business_owner_id
    LEFT JOIN subscription_plans sp ON s.plan_id = sp.plan_id
    WHERE bom.business_manager_id = p_business_manager_id
      AND bom.status = 'Active'
    ORDER BY bom.is_primary DESC, sbo.created_at DESC;
END$$

-- Procedure to assign additional manager to Business Owner
DROP PROCEDURE IF EXISTS `assignManagerToBusinessOwner`$$

CREATE PROCEDURE `assignManagerToBusinessOwner`(
    IN p_business_owner_id INT,
    IN p_business_manager_id INT,
    IN p_access_level VARCHAR(20),
    IN p_assigned_by_system_admin INT,
    IN p_notes TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error assigning manager to business owner';
    END;
    
    START TRANSACTION;
    
    INSERT INTO business_owner_managers (
        business_owner_id,
        business_manager_id,
        is_primary,
        access_level,
        assigned_by_system_admin,
        notes
    ) VALUES (
        p_business_owner_id,
        p_business_manager_id,
        0, -- Not primary
        COALESCE(p_access_level, 'Full'),
        p_assigned_by_system_admin,
        p_notes
    );
    
    COMMIT;
    
    SELECT 
        LAST_INSERT_ID() as relationship_id,
        'Manager assigned successfully' as message;
END$$

-- Procedure to remove manager from Business Owner
DROP PROCEDURE IF EXISTS `removeManagerFromBusinessOwner`$$

CREATE PROCEDURE `removeManagerFromBusinessOwner`(
    IN p_relationship_id INT
)
BEGIN
    DECLARE v_is_primary TINYINT(1);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error removing manager from business owner';
    END;
    
    START TRANSACTION;
    
    -- Check if this is a primary manager
    SELECT is_primary INTO v_is_primary
    FROM business_owner_managers
    WHERE relationship_id = p_relationship_id;
    
    -- Don't allow removing primary manager
    IF v_is_primary = 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot remove primary manager. Assign a new primary manager first.';
    END IF;
    
    -- Soft delete by setting status to Inactive
    UPDATE business_owner_managers
    SET status = 'Inactive',
        updated_at = NOW()
    WHERE relationship_id = p_relationship_id;
    
    COMMIT;
    
    SELECT 
        ROW_COUNT() as affected_rows,
        'Manager removed successfully' as message;
END$$

DELIMITER ;

-- Insert migration record
INSERT INTO migrations (migration_name, version, executed_at)
VALUES ('029_business_owner_manager_connection', '1.0.0', NOW())
ON DUPLICATE KEY UPDATE executed_at = NOW();
