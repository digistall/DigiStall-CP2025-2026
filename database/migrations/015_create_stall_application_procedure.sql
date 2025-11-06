-- Migration: 015_create_stall_application_procedure
-- Description: Creates the missing stored procedure for stall application submission from landing page
-- Version: 1.0.0

-- Create stored procedure for complete stall application submission
DELIMITER $$

DROP PROCEDURE IF EXISTS `createStallApplicationComplete`$$

CREATE PROCEDURE `createStallApplicationComplete` (
    IN `p_full_name` VARCHAR(255),
    IN `p_contact_number` VARCHAR(20),
    IN `p_address` TEXT,
    IN `p_birthdate` DATE,
    IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'),
    IN `p_educational_attainment` VARCHAR(100),
    IN `p_nature_of_business` VARCHAR(255),
    IN `p_capitalization` DECIMAL(15,2),
    IN `p_source_of_capital` VARCHAR(255),
    IN `p_previous_business_experience` TEXT,
    IN `p_relative_stall_owner` ENUM('Yes','No'),
    IN `p_spouse_full_name` VARCHAR(255),
    IN `p_spouse_birthdate` DATE,
    IN `p_spouse_educational_attainment` VARCHAR(100),
    IN `p_spouse_contact_number` VARCHAR(20),
    IN `p_spouse_occupation` VARCHAR(100),
    IN `p_signature_of_applicant` VARCHAR(500),
    IN `p_house_sketch_location` VARCHAR(500),
    IN `p_valid_id` VARCHAR(500),
    IN `p_email_address` VARCHAR(255),
    IN `p_stall_id` INT
)
BEGIN
    DECLARE new_applicant_id INT;
    DECLARE new_application_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Step 1: Create the applicant record
    INSERT INTO applicant (
        applicant_full_name, applicant_contact_number, applicant_address,
        applicant_birthdate, applicant_civil_status, applicant_educational_attainment
    ) VALUES (
        p_full_name, p_contact_number, p_address,
        p_birthdate, p_civil_status, p_educational_attainment
    );
    
    SET new_applicant_id = LAST_INSERT_ID();
    
    -- Step 2: Create business information
    INSERT INTO business_information (
        applicant_id, nature_of_business, capitalization,
        source_of_capital, previous_business_experience, relative_stall_owner
    ) VALUES (
        new_applicant_id, p_nature_of_business, p_capitalization,
        p_source_of_capital, p_previous_business_experience, COALESCE(p_relative_stall_owner, 'No')
    );
    
    -- Step 3: Create other information
    INSERT INTO other_information (
        applicant_id, signature_of_applicant, house_sketch_location, 
        valid_id, email_address
    ) VALUES (
        new_applicant_id, p_signature_of_applicant, p_house_sketch_location,
        p_valid_id, p_email_address
    );
    
    -- Step 4: Create spouse information (if provided)
    IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
        INSERT INTO spouse (
            applicant_id, spouse_full_name, spouse_birthdate,
            spouse_educational_attainment, spouse_contact_number, spouse_occupation
        ) VALUES (
            new_applicant_id, p_spouse_full_name, p_spouse_birthdate,
            p_spouse_educational_attainment, p_spouse_contact_number, p_spouse_occupation
        );
    END IF;
    
    -- Step 5: Create the application record
    INSERT INTO application (
        stall_id, applicant_id, application_date, application_status
    ) VALUES (
        p_stall_id, new_applicant_id, CURDATE(), 'Pending'
    );
    
    SET new_application_id = LAST_INSERT_ID();
    
    -- Step 6: Handle raffle participation if stall is raffle type
    INSERT INTO raffle_participants (raffle_id, applicant_id, application_id, participation_time)
    SELECT r.raffle_id, new_applicant_id, new_application_id, NOW()
    FROM raffle r 
    JOIN stall s ON r.stall_id = s.stall_id 
    WHERE s.stall_id = p_stall_id AND s.price_type = 'Raffle';
    
    -- Step 7: Update raffle participant count and activate if first participant
    UPDATE raffle r
    JOIN stall s ON r.stall_id = s.stall_id
    SET r.total_participants = r.total_participants + 1,
        r.first_application_time = CASE 
            WHEN r.first_application_time IS NULL THEN NOW() 
            ELSE r.first_application_time 
        END,
        r.start_time = CASE 
            WHEN r.start_time IS NULL AND r.total_participants = 0 THEN NOW() 
            ELSE r.start_time 
        END,
        r.end_time = CASE 
            WHEN r.end_time IS NULL AND r.application_deadline IS NOT NULL THEN r.application_deadline 
            ELSE r.end_time 
        END,
        r.raffle_status = CASE 
            WHEN r.raffle_status = 'Waiting for Participants' AND r.total_participants = 0 THEN 'Active' 
            ELSE r.raffle_status 
        END
    WHERE s.stall_id = p_stall_id AND s.price_type = 'Raffle';
    
    -- Step 8: Update stall raffle/auction status
    UPDATE stall 
    SET raffle_auction_status = CASE 
        WHEN price_type = 'Raffle' AND raffle_auction_status = 'Not Started' THEN 'Active'
        ELSE raffle_auction_status 
    END,
    deadline_active = CASE 
        WHEN price_type = 'Raffle' AND deadline_active = 0 THEN 1
        ELSE deadline_active 
    END
    WHERE stall_id = p_stall_id AND price_type = 'Raffle';
    
    COMMIT;
    
    SELECT 1 as success, 
           'Application submitted successfully' AS message,
           new_applicant_id as applicant_id, 
           new_application_id as application_id;
END$$

DELIMITER ;

-- Insert migration record
INSERT INTO migrations (migration_name, version) 
VALUES ('015_create_stall_application_procedure', '1.0.0');