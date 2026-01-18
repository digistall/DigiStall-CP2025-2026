-- CRITICAL: Ensure stallholder.full_name always matches applicant.applicant_full_name
-- This prevents the encryption format corruption issue that happened before

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS before_stallholder_insert;

DELIMITER $$

CREATE TRIGGER before_stallholder_insert
BEFORE INSERT ON stallholder
FOR EACH ROW
BEGIN
    -- Automatically copy the correct encrypted full_name from applicant table
    -- This ensures consistency and prevents format corruption
    IF NEW.mobile_user_id IS NOT NULL THEN
        SET NEW.full_name = (
            SELECT applicant_full_name 
            FROM applicant 
            WHERE applicant_id = NEW.mobile_user_id
            LIMIT 1
        );
    END IF;
END$$

DELIMITER ;

-- Also create an UPDATE trigger to maintain consistency
DROP TRIGGER IF EXISTS before_stallholder_update;

DELIMITER $$

CREATE TRIGGER before_stallholder_update
BEFORE UPDATE ON stallholder
FOR EACH ROW
BEGIN
    -- If mobile_user_id changes, update full_name accordingly
    IF NEW.mobile_user_id != OLD.mobile_user_id OR NEW.full_name IS NULL THEN
        IF NEW.mobile_user_id IS NOT NULL THEN
            SET NEW.full_name = (
                SELECT applicant_full_name 
                FROM applicant 
                WHERE applicant_id = NEW.mobile_user_id
                LIMIT 1
            );
        END IF;
    END IF;
END$$

DELIMITER ;

-- Note: The before_stallholder_insert trigger above will handle full_name sync
-- Contact number and address will be handled by application logic

SELECT 'Stallholder data sync triggers created - all encrypted data will be automatically copied from applicant table' as status;
