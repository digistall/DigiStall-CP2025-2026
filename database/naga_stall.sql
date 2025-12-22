-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 17, 2025 at 04:02 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `naga_stall`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `addInspector` (IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(255), IN `p_contact_no` VARCHAR(20), IN `p_password_plain` VARCHAR(255), IN `p_branch_id` INT, IN `p_date_hired` DATE, IN `p_branch_manager_id` INT)   BEGIN
    DECLARE new_inspector_id INT;

    INSERT INTO inspector (first_name, last_name, email, contact_no, password, date_hired, status)
    VALUES (p_first_name, p_last_name, p_email, p_contact_no, SHA2(p_password_plain, 256), IFNULL(p_date_hired, CURRENT_DATE), 'active');

    SET new_inspector_id = LAST_INSERT_ID();

    INSERT INTO inspector_assignment (inspector_id, branch_id, start_date, status, remarks)
    VALUES (new_inspector_id, p_branch_id, CURRENT_DATE, 'Active', 'Newly hired inspector');

    INSERT INTO inspector_action_log (inspector_id, branch_id, branch_manager_id, action_type, action_date, remarks)
    VALUES (new_inspector_id, p_branch_id, p_branch_manager_id, 'New Hire', NOW(),
            CONCAT('Inspector ', p_first_name, ' ', p_last_name, ' was hired and assigned to branch ID ', p_branch_id));

    SELECT CONCAT('âœ… Inspector ', p_first_name, ' ', p_last_name, ' successfully added and logged as New Hire under branch ID ', p_branch_id) AS message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `addOnsitePayment` (IN `p_stallholder_id` INT, IN `p_amount` DECIMAL(10,2), IN `p_payment_date` DATE, IN `p_payment_time` TIME, IN `p_payment_for_month` VARCHAR(7), IN `p_payment_type` VARCHAR(50), IN `p_reference_number` VARCHAR(100), IN `p_collected_by` VARCHAR(100), IN `p_notes` TEXT, IN `p_branch_id` INT, IN `p_created_by` INT)   BEGIN
                DECLARE payment_id INT;
                DECLARE v_days_overdue INT DEFAULT 0;
                DECLARE v_late_fee DECIMAL(10,2) DEFAULT 0.00;
                DECLARE v_last_payment_date DATE;
                DECLARE v_monthly_rent DECIMAL(10,2);
                DECLARE v_total_amount DECIMAL(10,2);
                DECLARE v_notes TEXT;
                
                DECLARE EXIT HANDLER FOR SQLEXCEPTION
                BEGIN
                    ROLLBACK;
                    SELECT 0 as success, 'Payment processing failed' as message;
                END;
                
                START TRANSACTION;
                
                SELECT last_payment_date, monthly_rent
                INTO v_last_payment_date, v_monthly_rent
                FROM stallholder
                WHERE stallholder_id = p_stallholder_id;
                
                IF v_last_payment_date IS NOT NULL THEN
                    SET v_days_overdue = DATEDIFF(p_payment_date, v_last_payment_date) - 30;
                    IF v_days_overdue < 0 THEN
                        SET v_days_overdue = 0;
                    END IF;
                END IF;
                
                IF v_days_overdue > 0 THEN
                    SET v_late_fee = CEILING(v_days_overdue / 30) * 100.00;
                END IF;
                
                SET v_total_amount = p_amount + v_late_fee;
                
                SET v_notes = p_notes;
                IF v_late_fee > 0 THEN
                    SET v_notes = CONCAT(
                        COALESCE(p_notes, ''),
                        IF(p_notes IS NOT NULL AND p_notes != '', ' | ', ''),
                        'Late Fee: â‚±', FORMAT(v_late_fee, 2),
                        ' (', v_days_overdue, ' days overdue)'
                    );
                END IF;
                
                INSERT INTO payments (
                    stallholder_id, amount, payment_date, payment_time, payment_for_month,
                    payment_type, payment_method, reference_number, collected_by, notes,
                    payment_status, branch_id, created_by, created_at, updated_at
                ) VALUES (
                    p_stallholder_id, v_total_amount, p_payment_date, p_payment_time, p_payment_for_month,
                    p_payment_type, 'onsite', p_reference_number, p_collected_by, v_notes,
                    'completed', p_branch_id, p_created_by, NOW(), NOW()
                );
                
                SET payment_id = LAST_INSERT_ID();
                
                UPDATE stallholder
                SET last_payment_date = p_payment_date,
                    payment_status = 'paid',
                    updated_at = NOW()
                WHERE stallholder_id = p_stallholder_id;
                
                COMMIT;
                
                SELECT 
                    1 as success,
                    payment_id,
                    v_total_amount as amount_paid,
                    v_late_fee as late_fee,
                    v_days_overdue as days_overdue,
                    'Payment recorded successfully. Stallholder status updated to PAID.' as message;
            END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `assignManagerToBusinessOwner` (IN `p_business_owner_id` INT, IN `p_business_manager_id` INT, IN `p_access_level` VARCHAR(20), IN `p_assigned_by_system_admin` INT, IN `p_notes` TEXT)   BEGIN
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
        0, 
        COALESCE(p_access_level, 'Full'),
        p_assigned_by_system_admin,
        p_notes
    );
    
    COMMIT;
    
    SELECT 
        LAST_INSERT_ID() as relationship_id,
        'Manager assigned successfully' as message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CanCustomizeDocuments` (IN `p_owner_id` INT, OUT `can_customize` BOOLEAN)   BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM stall_business_owner 
        WHERE business_owner_id = p_owner_id 
          AND status = 'active'
    ) INTO can_customize;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkComplianceRecordExists` (IN `p_report_id` INT)   BEGIN
  SELECT COUNT(*) AS record_exists
  FROM violation_report
  WHERE report_id = p_report_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkExistingApplication` (IN `p_applicant_id` INT, IN `p_stall_id` INT)   BEGIN
    SELECT application_id 
    FROM application 
    WHERE applicant_id = p_applicant_id AND stall_id = p_stall_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkExistingApplicationByStall` (IN `p_applicant_id` INT, IN `p_stall_id` INT)   BEGIN
    SELECT application_id 
    FROM applications 
    WHERE applicant_id = p_applicant_id AND stall_id = p_stall_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkExistingMobileUser` (IN `p_username` VARCHAR(100), IN `p_email` VARCHAR(255))   BEGIN
    SELECT * FROM applicant 
    WHERE applicant_username = p_username OR applicant_email = p_email;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CheckExistingOwnerStalls` (IN `p_stallholder_id` INT)   BEGIN
    SELECT 
        s.business_owner_id as owner_id,
        sbo.owner_full_name as owner_name,
        sbo.owner_email as owner_email,
        COUNT(DISTINCT s.stall_id) as stall_count,
        GROUP_CONCAT(DISTINCT b.branch_name SEPARATOR ', ') as branches
    FROM stall s
    INNER JOIN stall_business_owner sbo ON s.business_owner_id = sbo.business_owner_id
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    WHERE s.stallholder_id = p_stallholder_id
    GROUP BY s.business_owner_id, sbo.owner_full_name, sbo.owner_email;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkPendingApplication` (IN `p_application_id` INT, IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM applications 
    WHERE application_id = p_application_id 
      AND applicant_id = p_applicant_id 
      AND status = 'pending';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkStallAvailability` (IN `p_stall_id` INT)   BEGIN
    SELECT stall_id, stall_name, area, branch_id, is_available 
    FROM stalls 
    WHERE stall_id = p_stall_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `countApplicationsByBranch` (IN `p_applicant_id` INT, IN `p_branch_id` INT)   BEGIN
    SELECT COUNT(*) as count 
    FROM application app
    JOIN stall st ON app.stall_id = st.stall_id
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id AND b.branch_id = p_branch_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `countBranchApplications` (IN `p_applicant_id` INT, IN `p_branch_id` INT)   BEGIN
    SELECT COUNT(*) as count 
    FROM applications a 
    JOIN stalls s ON a.stall_id = s.stall_id 
    WHERE a.applicant_id = p_applicant_id 
      AND s.branch_id = p_branch_id 
      AND a.status != 'rejected';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createApplicant` (IN `p_full_name` VARCHAR(255), IN `p_contact_number` VARCHAR(20), IN `p_address` TEXT, IN `p_birthdate` DATE, IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'), IN `p_educational_attainment` VARCHAR(100))   BEGIN
    INSERT INTO applicant (applicant_full_name, applicant_contact_number, applicant_address, applicant_birthdate, applicant_civil_status, applicant_educational_attainment)
    VALUES (p_full_name, p_contact_number, p_address, p_birthdate, p_civil_status, p_educational_attainment);
    
    SELECT LAST_INSERT_ID() as applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createApplicantComplete` (IN `p_full_name` VARCHAR(255), IN `p_contact_number` VARCHAR(20), IN `p_address` TEXT, IN `p_birthdate` DATE, IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'), IN `p_educational_attainment` VARCHAR(100), IN `p_nature_of_business` VARCHAR(255), IN `p_capitalization` DECIMAL(15,2), IN `p_source_of_capital` VARCHAR(255), IN `p_previous_business_experience` TEXT, IN `p_relative_stall_owner` ENUM('Yes','No'), IN `p_spouse_full_name` VARCHAR(255), IN `p_spouse_birthdate` DATE, IN `p_spouse_educational_attainment` VARCHAR(100), IN `p_spouse_contact_number` VARCHAR(20), IN `p_spouse_occupation` VARCHAR(100), IN `p_signature_of_applicant` VARCHAR(500), IN `p_house_sketch_location` VARCHAR(500), IN `p_valid_id` VARCHAR(500), IN `p_email_address` VARCHAR(255))   BEGIN
    DECLARE new_applicant_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback the transaction on error
        ROLLBACK;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Error creating applicant record';
    END;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Insert applicant (main table)
    INSERT INTO applicant (
        applicant_full_name, 
        applicant_contact_number, 
        applicant_address,
        applicant_birthdate, 
        applicant_civil_status, 
        applicant_educational_attainment
    ) VALUES (
        p_full_name, 
        p_contact_number, 
        NULLIF(p_address, ''),
        p_birthdate, 
        COALESCE(p_civil_status, 'Single'), 
        NULLIF(p_educational_attainment, '')
    );
    
    SET new_applicant_id = LAST_INSERT_ID();
    
    -- Insert business information (always insert, allow NULLs)
    INSERT INTO business_information (
        applicant_id, 
        nature_of_business, 
        capitalization,
        source_of_capital, 
        previous_business_experience, 
        relative_stall_owner
    ) VALUES (
        new_applicant_id, 
        NULLIF(p_nature_of_business, ''), 
        p_capitalization,
        NULLIF(p_source_of_capital, ''), 
        NULLIF(p_previous_business_experience, ''), 
        COALESCE(p_relative_stall_owner, 'No')
    );
    
    -- Insert other information (always insert, allow NULLs)
    INSERT INTO other_information (
        applicant_id, 
        signature_of_applicant, 
        house_sketch_location, 
        valid_id, 
        email_address
    ) VALUES (
        new_applicant_id, 
        NULLIF(p_signature_of_applicant, ''), 
        NULLIF(p_house_sketch_location, ''),
        NULLIF(p_valid_id, ''), 
        p_email_address
    );
    
    -- Insert spouse information only if spouse name is provided
    IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
        INSERT INTO spouse (
            applicant_id, 
            spouse_full_name, 
            spouse_birthdate,
            spouse_educational_attainment, 
            spouse_contact_number, 
            spouse_occupation
        ) VALUES (
            new_applicant_id, 
            p_spouse_full_name, 
            p_spouse_birthdate,
            NULLIF(p_spouse_educational_attainment, ''), 
            NULLIF(p_spouse_contact_number, ''), 
            NULLIF(p_spouse_occupation, '')
        );
    END IF;
    
    -- Commit transaction
    COMMIT;
    
    -- Return the new applicant ID
    SELECT new_applicant_id as new_applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createApplication` (IN `p_stall_id` INT, IN `p_applicant_id` INT, IN `p_application_date` DATE, IN `p_application_status` ENUM('Pending','Under Review','Approved','Rejected','Cancelled'))   BEGIN
    INSERT INTO application (stall_id, applicant_id, application_date, application_status)
    VALUES (p_stall_id, p_applicant_id, p_application_date, p_application_status);
    
    SELECT LAST_INSERT_ID() as application_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createBranch` (IN `p_business_owner_id` INT, IN `p_branch_name` VARCHAR(100), IN `p_area` VARCHAR(100), IN `p_location` VARCHAR(255), IN `p_address` TEXT, IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(100), IN `p_status` ENUM('Active','Inactive','Under Construction','Maintenance'))   BEGIN
    INSERT INTO `branch` (
        `business_owner_id`, 
        `branch_name`, 
        `area`, 
        `location`, 
        `address`, 
        `contact_number`, 
        `email`, 
        `status`
    )
    VALUES (
        p_business_owner_id, 
        p_branch_name, 
        p_area, 
        p_location, 
        p_address, 
        p_contact_number, 
        p_email, 
        COALESCE(p_status, 'Active')
    );
    
    SELECT LAST_INSERT_ID() as branch_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createBusinessEmployee` (IN `p_username` VARCHAR(20), IN `p_password_hash` VARCHAR(255), IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(255), IN `p_phone_number` VARCHAR(20), IN `p_branch_id` INT, IN `p_created_by_manager` INT, IN `p_permissions` JSON)   BEGIN
    INSERT INTO `business_employee` (
        `employee_username`, `employee_password_hash`, `first_name`, `last_name`, `email`, 
        `phone_number`, `branch_id`, `created_by_manager`, `permissions`, `status`, `password_reset_required`
    )
    VALUES (
        p_username, p_password_hash, p_first_name, p_last_name, p_email, 
        p_phone_number, p_branch_id, p_created_by_manager, p_permissions, 'Active', true
    );
    
    SELECT LAST_INSERT_ID() as business_employee_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createBusinessOwnerWithManagerConnection` (IN `p_username` VARCHAR(50), IN `p_password_hash` VARCHAR(255), IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_email` VARCHAR(100), IN `p_contact_number` VARCHAR(20), IN `p_plan_id` INT, IN `p_primary_manager_id` INT, IN `p_additional_manager_ids` JSON, IN `p_created_by_system_admin` INT)   BEGIN
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
    
    
    IF p_additional_manager_ids IS NOT NULL AND JSON_LENGTH(p_additional_manager_ids) > 0 THEN
        SET v_manager_count = JSON_LENGTH(p_additional_manager_ids);
        SET v_idx = 0;
        
        WHILE v_idx < v_manager_count DO
            SET v_manager_id = JSON_EXTRACT(p_additional_manager_ids, CONCAT('$[', v_idx, ']'));
            
            
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
    
    
    SELECT 
        v_business_owner_id as business_owner_id,
        v_subscription_id as subscription_id,
        p_primary_manager_id as primary_manager_id,
        v_start_date as start_date,
        v_end_date as end_date,
        'Business Owner created successfully with manager connections' as message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createCollector` (IN `p_username` VARCHAR(50), IN `p_password_hash` VARCHAR(255), IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(255), IN `p_contact_no` VARCHAR(20), IN `p_branch_id` INT, IN `p_date_hired` DATE, IN `p_branch_manager_id` INT)   BEGIN
    DECLARE new_collector_id INT;
    DECLARE exit_handler BOOLEAN DEFAULT FALSE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET exit_handler = TRUE;
    
    -- Insert collector
    INSERT INTO collector (
        username,
        password_hash,
        first_name,
        last_name,
        email,
        contact_no,
        date_hired,
        status
    ) VALUES (
        p_username,
        p_password_hash,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_no,
        IFNULL(p_date_hired, CURDATE()),
        'active'
    );
    
    IF exit_handler THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Failed to create collector';
    END IF;
    
    SET new_collector_id = LAST_INSERT_ID();
    
    -- Create branch assignment
    INSERT INTO collector_assignment (
        collector_id,
        branch_id,
        start_date,
        status,
        remarks
    ) VALUES (
        new_collector_id,
        p_branch_id,
        CURDATE(),
        'Active',
        'Newly hired collector'
    );
    
    -- Log the action
    INSERT INTO collector_action_log (
        collector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    ) VALUES (
        new_collector_id,
        p_branch_id,
        p_branch_manager_id,
        'New Hire',
        NOW(),
        CONCAT('Collector ', p_first_name, ' ', p_last_name, ' was hired and assigned to branch ID ', p_branch_id)
    );
    
    -- Return the new collector
    SELECT 
        new_collector_id as collector_id,
        p_username as username,
        p_first_name as first_name,
        p_last_name as last_name,
        p_email as email,
        'Collector created successfully' as message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createComplaint` (IN `p_complaint_type` VARCHAR(100), IN `p_sender_name` VARCHAR(255), IN `p_sender_contact` VARCHAR(50), IN `p_sender_email` VARCHAR(255), IN `p_stallholder_id` INT, IN `p_stall_id` INT, IN `p_branch_id` INT, IN `p_subject` VARCHAR(255), IN `p_description` TEXT, IN `p_evidence` TEXT, IN `p_priority` VARCHAR(20))   BEGIN
  INSERT INTO complaint (
    complaint_type,
    sender_name,
    sender_contact,
    sender_email,
    stallholder_id,
    stall_id,
    branch_id,
    subject,
    description,
    evidence,
    priority,
    status
  ) VALUES (
    p_complaint_type,
    p_sender_name,
    p_sender_contact,
    p_sender_email,
    p_stallholder_id,
    p_stall_id,
    p_branch_id,
    p_subject,
    p_description,
    p_evidence,
    COALESCE(p_priority, 'medium'),
    'pending'
  );
  
  SELECT LAST_INSERT_ID() AS complaint_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createComplianceRecord` (IN `p_inspector_id` INT, IN `p_stallholder_id` INT, IN `p_violation_id` INT, IN `p_stall_id` INT, IN `p_branch_id` INT, IN `p_compliance_type` VARCHAR(100), IN `p_severity` VARCHAR(20), IN `p_remarks` TEXT, IN `p_offense_no` INT, IN `p_penalty_id` INT)   BEGIN
  INSERT INTO `violation_report` (
    inspector_id, stallholder_id, violation_id, stall_id, branch_id,
    compliance_type, severity, remarks, offense_no, penalty_id, 
    date_reported, status
  ) VALUES (
    p_inspector_id, p_stallholder_id, p_violation_id, p_stall_id, p_branch_id,
    p_compliance_type, p_severity, p_remarks, p_offense_no, p_penalty_id,
    NOW(), 'pending'
  );
  
  -- Update stallholder compliance status if violation
  IF p_violation_id IS NOT NULL THEN
    UPDATE `stallholder` 
    SET 
      compliance_status = 'Non-Compliant',
      last_violation_date = NOW()
    WHERE stallholder_id = p_stallholder_id;
  END IF;
  
  SELECT LAST_INSERT_ID() AS report_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createFloor` (IN `p_branch_id` INT, IN `p_floor_name` VARCHAR(50), IN `p_floor_number` INT, IN `p_branch_id_duplicate` INT)   BEGIN
    INSERT INTO floor (branch_id, floor_name, floor_number)
    VALUES (p_branch_id, p_floor_name, p_floor_number);
    
    SELECT LAST_INSERT_ID() as floor_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createInspectorWithCredentials` (IN `p_username` VARCHAR(50), IN `p_password_hash` VARCHAR(255), IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(255), IN `p_contact_no` VARCHAR(20), IN `p_branch_id` INT, IN `p_date_hired` DATE, IN `p_branch_manager_id` INT)   BEGIN
    DECLARE new_inspector_id INT;
    DECLARE exit_handler BOOLEAN DEFAULT FALSE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET exit_handler = TRUE;
    
    -- Insert inspector with username and hashed password
    INSERT INTO inspector (
        username,
        first_name,
        last_name,
        middle_name,
        email,
        password,
        password_hash,
        contact_no,
        date_hired,
        status
    ) VALUES (
        p_username,
        p_first_name,
        p_last_name,
        '',
        p_email,
        '',
        p_password_hash,
        p_contact_no,
        IFNULL(p_date_hired, CURDATE()),
        'active'
    );
    
    IF exit_handler THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Failed to create inspector';
    END IF;
    
    SET new_inspector_id = LAST_INSERT_ID();
    
    -- Create branch assignment
    INSERT INTO inspector_assignment (
        inspector_id,
        branch_id,
        start_date,
        status,
        remarks
    ) VALUES (
        new_inspector_id,
        p_branch_id,
        CURDATE(),
        'Active',
        'Newly hired inspector'
    );
    
    -- Log the action
    INSERT INTO inspector_action_log (
        inspector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    ) VALUES (
        new_inspector_id,
        p_branch_id,
        p_branch_manager_id,
        'New Hire',
        NOW(),
        CONCAT('Inspector ', p_first_name, ' ', p_last_name, ' was hired and assigned to branch ID ', p_branch_id)
    );
    
    -- Return the new inspector
    SELECT 
        new_inspector_id as inspector_id,
        p_username as username,
        p_first_name as first_name,
        p_last_name as last_name,
        p_email as email,
        'Inspector created successfully' as message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createMobileApplication` (IN `p_applicant_id` INT, IN `p_stall_id` INT, IN `p_business_name` VARCHAR(255), IN `p_business_type` VARCHAR(100), IN `p_preferred_area` VARCHAR(255), IN `p_document_urls` TEXT)   BEGIN
    INSERT INTO applications 
    (applicant_id, stall_id, business_name, business_type, preferred_area, 
     document_urls, status, created_at) 
    VALUES (p_applicant_id, p_stall_id, p_business_name, p_business_type, 
            p_preferred_area, p_document_urls, 'pending', NOW());
    
    SELECT LAST_INSERT_ID() as application_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CreateOwnerWithThreeManagers` ()   BEGIN
    DECLARE v_business_owner_id INT;
    DECLARE v_subscription_id INT;
    DECLARE v_manager1_id INT DEFAULT 1;   
    DECLARE v_manager2_id INT DEFAULT 3;   
    DECLARE v_manager3_id INT DEFAULT 16;  
    
    
    CALL createBusinessOwnerWithManagerConnection(
        'multimanager_owner',                
        '$2b$10$khUzmmbIEaa/gUdYMQTSiugujaK3D.3rGcdxtqR91loKMpejjVq4a',  
        'Multi',                             
        'Manager Owner',                     
        'multiowner@nagastall.com',          
        '+639173333333',                     
        2,                                   
        1,                                   
        '[3, 16]',                           
        1                                    
    );
    
    
    SELECT business_owner_id INTO v_business_owner_id 
    FROM stall_business_owner 
    WHERE owner_username = 'multimanager_owner';
    
    
    SELECT 
        v_business_owner_id as 'Business Owner ID Created',
        'multimanager_owner' as 'Username',
        'owner123' as 'Password',
        'Connected to 3 Managers' as 'Status';
    
    
    SELECT 
        bom.relationship_id,
        bom.business_owner_id,
        bom.business_manager_id,
        CONCAT(bm.first_name, ' ', bm.last_name) as manager_name,
        bm.manager_username,
        bom.is_primary,
        bom.access_level,
        bom.status
    FROM business_owner_managers bom
    INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
    WHERE bom.business_owner_id = v_business_owner_id
    ORDER BY bom.is_primary DESC, bom.business_manager_id;
    
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createSection` (IN `p_floor_id` INT, IN `p_section_name` VARCHAR(100), IN `p_branch_id` INT)   BEGIN
    INSERT INTO section (floor_id, section_name)
    VALUES (p_floor_id, p_section_name);
    
    SELECT LAST_INSERT_ID() as section_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createStallApplicationComplete` (IN `p_full_name` VARCHAR(255), IN `p_contact_number` VARCHAR(20), IN `p_address` TEXT, IN `p_birthdate` DATE, IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'), IN `p_educational_attainment` VARCHAR(100), IN `p_nature_of_business` VARCHAR(255), IN `p_capitalization` DECIMAL(15,2), IN `p_source_of_capital` VARCHAR(255), IN `p_previous_business_experience` TEXT, IN `p_relative_stall_owner` ENUM('Yes','No'), IN `p_spouse_full_name` VARCHAR(255), IN `p_spouse_birthdate` DATE, IN `p_spouse_educational_attainment` VARCHAR(100), IN `p_spouse_contact_number` VARCHAR(20), IN `p_spouse_occupation` VARCHAR(100), IN `p_signature_of_applicant` VARCHAR(500), IN `p_house_sketch_location` VARCHAR(500), IN `p_valid_id` VARCHAR(500), IN `p_email_address` VARCHAR(255), IN `p_stall_id` INT)   BEGIN
    DECLARE new_applicant_id INT;
    DECLARE new_application_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    
    INSERT INTO applicant (
        applicant_full_name, applicant_contact_number, applicant_address,
        applicant_birthdate, applicant_civil_status, applicant_educational_attainment
    ) VALUES (
        p_full_name, p_contact_number, p_address,
        p_birthdate, p_civil_status, p_educational_attainment
    );
    
    SET new_applicant_id = LAST_INSERT_ID();
    
    
    INSERT INTO business_information (
        applicant_id, nature_of_business, capitalization,
        source_of_capital, previous_business_experience, relative_stall_owner
    ) VALUES (
        new_applicant_id, p_nature_of_business, p_capitalization,
        p_source_of_capital, p_previous_business_experience, COALESCE(p_relative_stall_owner, 'No')
    );
    
    
    INSERT INTO other_information (
        applicant_id, signature_of_applicant, house_sketch_location, 
        valid_id, email_address
    ) VALUES (
        new_applicant_id, p_signature_of_applicant, p_house_sketch_location,
        p_valid_id, p_email_address
    );
    
    
    IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
        INSERT INTO spouse (
            applicant_id, spouse_full_name, spouse_birthdate,
            spouse_educational_attainment, spouse_contact_number, spouse_occupation
        ) VALUES (
            new_applicant_id, p_spouse_full_name, p_spouse_birthdate,
            p_spouse_educational_attainment, p_spouse_contact_number, p_spouse_occupation
        );
    END IF;
    
    
    INSERT INTO application (
        stall_id, applicant_id, application_date, application_status
    ) VALUES (
        p_stall_id, new_applicant_id, CURDATE(), 'Pending'
    );
    
    SET new_application_id = LAST_INSERT_ID();
    
    
    INSERT INTO raffle_participants (raffle_id, applicant_id, application_id, participation_time)
    SELECT r.raffle_id, new_applicant_id, new_application_id, NOW()
    FROM raffle r 
    JOIN stall s ON r.stall_id = s.stall_id 
    WHERE s.stall_id = p_stall_id AND s.price_type = 'Raffle';
    
    
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `createStallBusinessOwner` (IN `p_username` VARCHAR(50), IN `p_password_hash` VARCHAR(255), IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(100), IN `p_created_by_system_admin` INT)   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    INSERT INTO `stall_business_owner` (
        `owner_username`, `owner_password_hash`, `first_name`, `last_name`,
        `contact_number`, `email`, `status`, `created_by_system_admin`
    ) VALUES (
        p_username, p_password_hash, p_first_name, p_last_name,
        p_contact_number, p_email, 'Active', p_created_by_system_admin
    );
    
    COMMIT;
    
    SELECT 1 as success, 
           'Business Owner created successfully' AS message,
           LAST_INSERT_ID() as business_owner_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createStallholder` (IN `p_applicant_id` INT, IN `p_stallholder_name` VARCHAR(150), IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(255), IN `p_address` TEXT, IN `p_business_name` VARCHAR(255), IN `p_business_type` VARCHAR(100), IN `p_branch_id` INT, IN `p_stall_id` INT, IN `p_contract_start_date` DATE, IN `p_contract_end_date` DATE, IN `p_lease_amount` DECIMAL(10,2), IN `p_monthly_rent` DECIMAL(10,2), IN `p_notes` TEXT, IN `p_created_by_business_manager` INT)   BEGIN
    DECLARE new_stallholder_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    INSERT INTO `stallholder` (
        `applicant_id`, `stallholder_name`, `contact_number`, `email`, `address`,
        `business_name`, `business_type`, `branch_id`, `stall_id`,
        `contract_start_date`, `contract_end_date`, `contract_status`,
        `lease_amount`, `monthly_rent`, `payment_status`,
        `notes`, `created_by_business_manager`
    ) VALUES (
        p_applicant_id, p_stallholder_name, p_contact_number, p_email, p_address,
        p_business_name, p_business_type, p_branch_id, p_stall_id,
        p_contract_start_date, p_contract_end_date, 'Active',
        p_lease_amount, p_monthly_rent, 'current',
        p_notes, p_created_by_business_manager
    );
    
    SET new_stallholder_id = LAST_INSERT_ID();
    
    IF p_stall_id IS NOT NULL THEN
        UPDATE `stall` 
        SET `status` = 'Occupied', `is_available` = 0 
        WHERE `stall_id` = p_stall_id;
    END IF;
    
    COMMIT;
    
    SELECT 1 as success, 'Stallholder created successfully' AS message, new_stallholder_id as stallholder_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createSystemAdministrator` (IN `p_username` VARCHAR(50), IN `p_password_hash` VARCHAR(255), IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(100))   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    INSERT INTO `system_administrator` (
        `username`, `password_hash`, `first_name`, `last_name`, 
        `contact_number`, `email`, `status`
    ) VALUES (
        p_username, p_password_hash, p_first_name, p_last_name,
        p_contact_number, p_email, 'Active'
    );
    
    COMMIT;
    
    SELECT 1 as success, 
           'System Administrator created successfully' AS message,
           LAST_INSERT_ID() as system_admin_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteApplicant` (IN `p_applicant_id` INT)   BEGIN
    -- Archive or mark as deleted
    UPDATE applicant SET updated_at = NOW() WHERE applicant_id = p_applicant_id;
    DELETE FROM applicant WHERE applicant_id = p_applicant_id;
    SELECT ROW_COUNT() as affected_rows;
END$$

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

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteApplication` (IN `p_application_id` INT)   BEGIN
    DELETE FROM application WHERE application_id = p_application_id;
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteBranch` (IN `p_branch_id` INT)   BEGIN
    DECLARE branch_exists INT DEFAULT 0;
    DECLARE rows_deleted INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as affected_rows, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    
    SELECT COUNT(*) INTO branch_exists FROM branch WHERE branch_id = p_branch_id;
    
    IF branch_exists = 0 THEN
        SELECT 0 as affected_rows, 'Branch not found' as message;
        ROLLBACK;
    ELSE
        
        
        
        DELETE FROM stall 
        WHERE section_id IN (
            SELECT section_id FROM section 
            WHERE floor_id IN (
                SELECT floor_id FROM floor WHERE branch_id = p_branch_id
            )
        );
        
        
        DELETE FROM section 
        WHERE floor_id IN (
            SELECT floor_id FROM floor WHERE branch_id = p_branch_id
        );
        
        
        DELETE FROM floor WHERE branch_id = p_branch_id;
        
        
        DELETE FROM branch_manager WHERE branch_id = p_branch_id;
        
        
        DELETE FROM stallholder WHERE branch_id = p_branch_id;
        
        
        DELETE FROM branch WHERE branch_id = p_branch_id;
        SET rows_deleted = ROW_COUNT();
        
        COMMIT;
        
        SELECT rows_deleted as affected_rows, 'Branch deleted successfully' as message;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteBusinessEmployee` (IN `p_employee_id` INT)   BEGIN
    UPDATE `business_employee` 
    SET `status` = 'Inactive', `updated_at` = NOW()
    WHERE `business_employee_id` = p_employee_id;
    
    -- Terminate all active sessions
    UPDATE `employee_session` 
    SET `is_active` = false, `logout_time` = NOW()
    WHERE `business_employee_id` = p_employee_id AND `is_active` = true;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteComplaint` (IN `p_complaint_id` INT)   BEGIN
  DELETE FROM complaint WHERE complaint_id = p_complaint_id;
  SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteComplianceRecord` (IN `p_report_id` INT)   BEGIN
  DELETE FROM `violation_report` WHERE report_id = p_report_id;
  SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteStall` (IN `p_stall_id` INT)   BEGIN
    UPDATE stall SET status = 'Inactive', updated_at = NOW()
    WHERE stall_id = p_stall_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteStallBusinessOwner` (IN `p_business_owner_id` INT)   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Soft delete by setting status to Inactive
    UPDATE `stall_business_owner`
    SET `status` = 'Inactive', `updated_at` = NOW()
    WHERE `business_owner_id` = p_business_owner_id;
    
    COMMIT;
    
    SELECT 1 as success, 
           'Business Owner deactivated successfully' AS message,
           ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteStallholder` (IN `p_stallholder_id` INT)   BEGIN
    DECLARE stall_to_free INT DEFAULT NULL;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    
    SELECT stall_id INTO stall_to_free FROM stallholder WHERE stallholder_id = p_stallholder_id;
    
    
    UPDATE stallholder 
    SET contract_status = 'Terminated', updated_at = CURRENT_TIMESTAMP
    WHERE stallholder_id = p_stallholder_id;
    
    
    IF stall_to_free IS NOT NULL THEN
        UPDATE stall 
        SET status = 'Active', is_available = 1 
        WHERE stall_id = stall_to_free;
    END IF;
    
    COMMIT;
    
    SELECT 1 as success, 'Stallholder contract terminated successfully' AS message, ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteSystemAdministrator` (IN `p_system_admin_id` INT)   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Soft delete by setting status to Inactive
    UPDATE `system_administrator`
    SET `status` = 'Inactive', `updated_at` = NOW()
    WHERE `system_admin_id` = p_system_admin_id;
    
    COMMIT;
    
    SELECT 1 as success, 
           'System Administrator deactivated successfully' AS message,
           ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllActiveBranches` ()   BEGIN
    SELECT 
        branch_id,
        branch_name,
        area,
        status
    FROM branch
    WHERE status = 'Active'
    ORDER BY area, branch_name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllActiveInspectors` ()   BEGIN
  SELECT 
    inspector_id,
    CONCAT(first_name, ' ', last_name) AS inspector_name,
    first_name,
    last_name,
    email,
    contact_no,
    status,
    date_hired
  FROM inspector
  WHERE status = 'active'
  ORDER BY first_name, last_name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllApplicants` ()   BEGIN
    SELECT * FROM applicant ORDER BY created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllApplications` ()   BEGIN
    SELECT 
        a.*,
        ap.applicant_full_name,
        ap.applicant_contact_number,
        s.stall_no,
        s.stall_location,
        b.branch_name
    FROM application a
    LEFT JOIN applicant ap ON a.applicant_id = ap.applicant_id
    LEFT JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    ORDER BY a.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllBranchesDetailed` ()   BEGIN
    SELECT 
        b.`branch_id`,
        b.`business_owner_id`,
        b.`branch_name`,
        b.`area`,
        b.`location`,
        b.`address`,
        b.`contact_number`,
        b.`email`,
        b.`status`,
        b.`created_at`,
        b.`updated_at`,
        bm.`business_manager_id` as manager_id,
        bm.`manager_username`,
        CONCAT(bm.`first_name`, ' ', bm.`last_name`) as manager_name,
        CASE 
            WHEN bm.`business_manager_id` IS NOT NULL THEN TRUE 
            ELSE FALSE 
        END as manager_assigned,
        bm.`email` as manager_email,
        bm.`contact_number` as manager_contact,
        bm.`status` as manager_status
    FROM `branch` b
    LEFT JOIN `business_manager` bm ON b.`branch_id` = bm.`branch_id` AND bm.`status` = 'Active'
    ORDER BY b.`branch_name`;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllBusinessEmployees` (IN `p_status` VARCHAR(20), IN `p_branch_id` INT, IN `p_limit` INT, IN `p_offset` INT)   BEGIN
    SET @sql = 'SELECT 
        e.business_employee_id,
        e.employee_username,
        e.first_name,
        e.last_name,
        e.email,
        e.phone_number,
        e.branch_id,
        e.permissions,
        e.status,
        e.last_login,
        e.created_at,
        b.branch_name
    FROM business_employee e
    LEFT JOIN branch b ON e.branch_id = b.branch_id';
    
    SET @where_conditions = '';
    
    IF p_status IS NOT NULL THEN
        SET @where_conditions = CONCAT(@where_conditions, ' AND e.status = "', p_status, '"');
    END IF;
    
    IF p_branch_id IS NOT NULL THEN
        SET @where_conditions = CONCAT(@where_conditions, ' AND e.branch_id = ', p_branch_id);
    END IF;
    
    IF LENGTH(@where_conditions) > 0 THEN
        SET @sql = CONCAT(@sql, ' WHERE ', SUBSTRING(@where_conditions, 6));
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY e.created_at DESC');
    
    IF p_limit IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' LIMIT ', p_limit);
        IF p_offset IS NOT NULL THEN
            SET @sql = CONCAT(@sql, ' OFFSET ', p_offset);
        END IF;
    END IF;
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllBusinessOwnersWithSubscription` ()   BEGIN
    SELECT 
        bo.business_owner_id,
        bo.owner_username,
        CONCAT(bo.first_name, ' ', bo.last_name) as full_name,
        bo.first_name,
        bo.last_name,
        bo.email,
        bo.contact_number,
        bo.status,
        bo.subscription_status,
        bo.subscription_expiry_date,
        bo.last_payment_date,
        DATEDIFF(bo.subscription_expiry_date, CURDATE()) as days_until_expiry,
        s.subscription_id,
        p.plan_name,
        p.monthly_fee,
        CASE 
            WHEN bo.subscription_expiry_date < CURDATE() THEN 'Expired'
            WHEN DATEDIFF(bo.subscription_expiry_date, CURDATE()) <= 7 THEN 'Expiring Soon'
            ELSE 'Active'
        END as payment_status
    FROM stall_business_owner bo
    LEFT JOIN business_owner_subscriptions s ON bo.business_owner_id = s.business_owner_id
    LEFT JOIN subscription_plans p ON s.plan_id = p.plan_id
    ORDER BY bo.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllComplaints` (IN `p_branch_id` INT, IN `p_status` VARCHAR(20), IN `p_search` VARCHAR(255))   BEGIN
  SELECT 
    c.complaint_id,
    c.complaint_type,
    c.sender_id,
    c.sender_name,
    c.sender_contact,
    c.sender_email,
    c.stallholder_id,
    sh.stallholder_name,
    c.stall_id,
    s.stall_no,
    c.branch_id,
    b.branch_name,
    c.subject,
    c.description,
    c.evidence,
    c.status,
    c.priority,
    c.resolution_notes,
    c.date_submitted,
    c.date_resolved,
    c.created_at,
    c.updated_at
  FROM complaint c
  LEFT JOIN stallholder sh ON c.stallholder_id = sh.stallholder_id
  LEFT JOIN stall s ON c.stall_id = s.stall_id
  LEFT JOIN branch b ON c.branch_id = b.branch_id
  WHERE 
    (p_branch_id IS NULL OR c.branch_id = p_branch_id)
    AND (p_status IS NULL OR p_status = 'all' OR c.status = p_status)
    AND (
      p_search IS NULL OR p_search = '' OR
      c.complaint_id LIKE CONCAT('%', p_search, '%') OR
      c.complaint_type LIKE CONCAT('%', p_search, '%') OR
      c.sender_name LIKE CONCAT('%', p_search, '%') OR
      sh.stallholder_name LIKE CONCAT('%', p_search, '%') OR
      c.subject LIKE CONCAT('%', p_search, '%')
    )
  ORDER BY c.date_submitted DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllComplianceRecords` (IN `p_branch_id` INT, IN `p_status` VARCHAR(20), IN `p_search` VARCHAR(255))   BEGIN
  SELECT * FROM `view_compliance_records`
  WHERE 
    (p_branch_id IS NULL OR branch_id = p_branch_id)
    AND (p_status IS NULL OR p_status = 'all' OR status = p_status)
    AND (
      p_search IS NULL OR p_search = '' OR
      compliance_id LIKE CONCAT('%', p_search, '%') OR
      type LIKE CONCAT('%', p_search, '%') OR
      inspector LIKE CONCAT('%', p_search, '%') OR
      stallholder LIKE CONCAT('%', p_search, '%')
    )
  ORDER BY date DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllDocumentTypes` ()   BEGIN
    SELECT 
        document_type_id,
        document_name,
        description,
        is_system_default,
        created_at
    FROM document_types
    ORDER BY document_name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllPayments` (IN `p_branch_id` INT, IN `p_start_date` DATE, IN `p_end_date` DATE, IN `p_payment_method` VARCHAR(50), IN `p_status` VARCHAR(50), IN `p_limit` INT, IN `p_offset` INT)   BEGIN
        SELECT 
            p.payment_id,
            p.stallholder_id,
            sh.stallholder_name,
            sh.contact_number,
            sh.business_name,
            p.amount,
            p.payment_method,
            p.payment_status,
            p.payment_date,
            p.reference_number,
            p.branch_id,
            p.created_at
        FROM payments p
        LEFT JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        WHERE 1=1
        AND (p_branch_id IS NULL OR p.branch_id = p_branch_id OR sh.branch_id = p_branch_id)
        AND (p_start_date IS NULL OR DATE(p.payment_date) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(p.payment_date) <= p_end_date)
        AND (p_payment_method IS NULL OR p.payment_method = p_payment_method)
        AND (p_status IS NULL OR p.payment_status = p_status)
        ORDER BY p.payment_date DESC
        LIMIT p_limit OFFSET p_offset;
    END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllStallBusinessOwners` ()   BEGIN
    SELECT 
        sbo.`business_owner_id`,
        sbo.`owner_username`,
        sbo.`first_name`,
        sbo.`last_name`,
        sbo.`contact_number`,
        sbo.`email`,
        sbo.`status`,
        sbo.`created_at`,
        sbo.`updated_at`,
        CONCAT(sa.`first_name`, ' ', sa.`last_name`) as created_by_name
    FROM `stall_business_owner` sbo
    LEFT JOIN `system_administrator` sa ON sbo.`created_by_system_admin` = sa.`system_admin_id`
    ORDER BY sbo.`created_at` DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllStallholdersDetailed` (IN `p_branch_id` INT)   BEGIN
    IF p_branch_id IS NULL THEN
        SELECT
            sh.`stallholder_id`,
            sh.`applicant_id`,
            sh.`stallholder_name`,
            sh.`contact_number`,
            sh.`email`,
            sh.`address`,
            sh.`business_name`,
            sh.`business_type`,
            sh.`branch_id`,
            b.`branch_name`,
            sh.`stall_id`,
            s.`stall_no`,
            s.`stall_location`,
            sh.`contract_start_date`,
            sh.`contract_end_date`,
            sh.`contract_status`,
            sh.`lease_amount`,
            sh.`monthly_rent`,
            sh.`payment_status`,
            sh.`last_payment_date`,
            sh.`compliance_status`,
            sh.`last_violation_date`,
            sh.`notes`,
            sh.`date_created`,
            sh.`updated_at`,
            CONCAT(bm.`first_name`, ' ', bm.`last_name`) as created_by_name
        FROM `stallholder` sh
        INNER JOIN `branch` b ON sh.`branch_id` = b.`branch_id`
        INNER JOIN `stall` s ON sh.`stall_id` = s.`stall_id`
        LEFT JOIN `business_manager` bm ON sh.`created_by_business_manager` = bm.`business_manager_id`
        WHERE sh.`stall_id` IS NOT NULL
        ORDER BY sh.`date_created` DESC;
    ELSE
        SELECT
            sh.`stallholder_id`,
            sh.`applicant_id`,
            sh.`stallholder_name`,
            sh.`contact_number`,
            sh.`email`,
            sh.`address`,
            sh.`business_name`,
            sh.`business_type`,
            sh.`branch_id`,
            b.`branch_name`,
            sh.`stall_id`,
            s.`stall_no`,
            s.`stall_location`,
            sh.`contract_start_date`,
            sh.`contract_end_date`,
            sh.`contract_status`,
            sh.`lease_amount`,
            sh.`monthly_rent`,
            sh.`payment_status`,
            sh.`last_payment_date`,
            sh.`compliance_status`,
            sh.`last_violation_date`,
            sh.`notes`,
            sh.`date_created`,
            sh.`updated_at`,
            CONCAT(bm.`first_name`, ' ', bm.`last_name`) as created_by_name
        FROM `stallholder` sh
        INNER JOIN `branch` b ON sh.`branch_id` = b.`branch_id`
        INNER JOIN `stall` s ON sh.`stall_id` = s.`stall_id`
        LEFT JOIN `business_manager` bm ON sh.`created_by_business_manager` = bm.`business_manager_id`
        WHERE sh.`branch_id` = p_branch_id AND sh.`stall_id` IS NOT NULL
        ORDER BY sh.`date_created` DESC;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllStallsDetailed` ()   BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.area
    FROM stall s
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON s.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    ORDER BY b.branch_name, f.floor_name, sec.section_name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllSubscriptionPlans` ()   BEGIN
    SELECT 
        plan_id,
        plan_name,
        plan_description,
        monthly_fee,
        max_branches,
        max_employees,
        features,
        status,
        created_at
    FROM subscription_plans
    WHERE status = 'Active'
    ORDER BY monthly_fee ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllSystemAdministrators` ()   BEGIN
    SELECT 
        `system_admin_id`,
        `username`,
        `first_name`,
        `last_name`,
        `contact_number`,
        `email`,
        `status`,
        `created_at`,
        `updated_at`
    FROM `system_administrator`
    ORDER BY `created_at` DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllViolationTypes` ()   BEGIN
  SELECT 
    violation_id,
    ordinance_no,
    violation_type,
    details
  FROM violation
  ORDER BY violation_type;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantAdditionalInfo` (IN `p_applicant_id` INT)   BEGIN
    SELECT 
        
        oi.email_address,
        oi.signature_of_applicant,
        oi.house_sketch_location,
        oi.valid_id,
        
        bi.nature_of_business,
        bi.capitalization,
        bi.source_of_capital,
        bi.previous_business_experience,
        bi.relative_stall_owner,
        
        sp.spouse_full_name,
        sp.spouse_birthdate,
        sp.spouse_educational_attainment,
        sp.spouse_contact_number,
        sp.spouse_occupation
    FROM applicant a
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
    LEFT JOIN spouse sp ON a.applicant_id = sp.applicant_id
    WHERE a.applicant_id = p_applicant_id
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantApplicationsDetailed` (IN `p_applicant_id` INT)   BEGIN
    SELECT 
        app.application_id,
        app.applicant_id,
        app.stall_id,
        app.application_status,
        app.application_date,
        app.updated_at,
        s.stall_no as stall_number,
        s.size as stall_size,
        s.rental_price as monthly_rent,
        s.status as stall_status,
        b.branch_id,
        b.branch_name,
        b.area,
        b.status as branch_status
    FROM application app
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id
    ORDER BY app.application_date DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantBusinessOwners` (IN `p_applicant_id` INT)   BEGIN
    SELECT DISTINCT
        b.business_owner_id,
        CONCAT(bo.first_name, ' ', bo.last_name) as business_owner_name,
        bo.owner_username,
        bo.email,
        bo.contact_number,
        COUNT(DISTINCT app.application_id) as total_applications,
        COUNT(DISTINCT b.branch_id) as total_branches,
        GROUP_CONCAT(DISTINCT b.branch_name ORDER BY b.branch_name SEPARATOR ', ') as branch_names,
        -- Document statistics
        (SELECT COUNT(*) 
         FROM branch_document_requirements bdr 
         WHERE bdr.branch_id IN (
             SELECT DISTINCT br.branch_id 
             FROM application a
             INNER JOIN stall st ON a.stall_id = st.stall_id
             INNER JOIN section sc ON st.section_id = sc.section_id
             INNER JOIN floor fl ON sc.floor_id = fl.floor_id
             INNER JOIN branch br ON fl.branch_id = br.branch_id
             WHERE a.applicant_id = p_applicant_id 
             AND br.business_owner_id = b.business_owner_id
         )
         AND bdr.is_required = 1
        ) as required_documents_count,
        (SELECT COUNT(*) 
         FROM applicant_documents ad 
         WHERE ad.applicant_id = p_applicant_id 
         AND ad.business_owner_id = b.business_owner_id
         AND ad.verification_status = 'verified'
        ) as uploaded_documents_count
    FROM application app
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    INNER JOIN stall_business_owner bo ON b.business_owner_id = bo.business_owner_id
    WHERE app.applicant_id = p_applicant_id
    GROUP BY b.business_owner_id, bo.first_name, bo.last_name, bo.owner_username, bo.email, bo.contact_number
    ORDER BY business_owner_name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantByEmail` (IN `p_email` VARCHAR(100))   BEGIN
    SELECT * FROM applicant WHERE applicant_email = p_email;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantById` (IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM applicant WHERE applicant_id = p_applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantByUsername` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT * FROM applicant WHERE applicant_username = p_username;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantComplete` (IN `p_applicant_id` INT)   BEGIN
    IF p_applicant_id IS NULL THEN
        SELECT 
            a.*,
            bi.nature_of_business, bi.capitalization, bi.source_of_capital,
            bi.previous_business_experience, bi.relative_stall_owner,
            oi.email_address, oi.signature_of_applicant, oi.house_sketch_location, oi.valid_id,
            s.spouse_full_name, s.spouse_birthdate, s.spouse_educational_attainment,
            s.spouse_contact_number, s.spouse_occupation
        FROM applicant a
        LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
        LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
        LEFT JOIN spouse s ON a.applicant_id = s.applicant_id
        ORDER BY a.created_at DESC;
    ELSE
        SELECT 
            a.*,
            bi.nature_of_business, bi.capitalization, bi.source_of_capital,
            bi.previous_business_experience, bi.relative_stall_owner,
            oi.email_address, oi.signature_of_applicant, oi.house_sketch_location, oi.valid_id,
            s.spouse_full_name, s.spouse_birthdate, s.spouse_educational_attainment,
            s.spouse_contact_number, s.spouse_occupation
        FROM applicant a
        LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
        LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
        LEFT JOIN spouse s ON a.applicant_id = s.applicant_id
        WHERE a.applicant_id = p_applicant_id;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantDocumentStatus` (IN `p_applicant_id` INT, IN `p_business_owner_id` INT)   BEGIN
    SELECT 
        COUNT(DISTINCT bdr.document_type_id) as total_required_documents,
        COUNT(DISTINCT CASE 
            WHEN ad.verification_status = 'verified' 
            THEN ad.document_type_id 
        END) as verified_documents,
        COUNT(DISTINCT CASE 
            WHEN ad.document_id IS NOT NULL 
            THEN ad.document_type_id 
        END) as uploaded_documents,
        COUNT(DISTINCT CASE 
            WHEN ad.verification_status = 'pending' 
            THEN ad.document_type_id 
        END) as pending_documents,
        COUNT(DISTINCT CASE 
            WHEN ad.verification_status = 'rejected' 
            THEN ad.document_type_id 
        END) as rejected_documents,
        COUNT(DISTINCT CASE 
            WHEN ad.expiry_date IS NOT NULL AND ad.expiry_date < CURDATE() 
            THEN ad.document_type_id 
        END) as expired_documents,
        ROUND(
            (COUNT(DISTINCT CASE WHEN ad.verification_status = 'verified' THEN ad.document_type_id END) * 100.0) / 
            NULLIF(COUNT(DISTINCT bdr.document_type_id), 0), 
            2
        ) as completion_percentage
    FROM application app
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    INNER JOIN branch_document_requirements bdr ON b.branch_id = bdr.branch_id
    LEFT JOIN applicant_documents ad ON p_applicant_id = ad.applicant_id 
        AND p_business_owner_id = ad.business_owner_id 
        AND bdr.document_type_id = ad.document_type_id
    WHERE app.applicant_id = p_applicant_id
        AND b.business_owner_id = p_business_owner_id
        AND bdr.is_required = 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantLoginCredentials` (IN `p_username` VARCHAR(255))   BEGIN
    SELECT 
        c.registrationid,
        c.applicant_id,
        c.user_name,
        c.password_hash,
        c.created_date,
        c.last_login,
        c.is_active,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        oi.email_address as applicant_email
    FROM credential c
    INNER JOIN applicant a ON c.applicant_id = a.applicant_id
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    WHERE c.user_name = p_username 
      AND c.is_active = 1
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantRequiredDocuments` (IN `p_applicant_id` INT, IN `p_business_owner_id` INT)   BEGIN
    SELECT DISTINCT
        dt.document_type_id,
        dt.document_name,
        dt.description,
        MAX(bdr.is_required) as is_required,
        MAX(bdr.instructions) as instructions,
        ad.document_id,
        ad.file_path,
        ad.original_filename,
        ad.file_size,
        ad.upload_date,
        ad.verification_status,
        ad.verified_at,
        ad.expiry_date,
        ad.rejection_reason,
        ad.notes,
        CASE 
            WHEN ad.document_id IS NULL THEN 'not_uploaded'
            WHEN ad.expiry_date IS NOT NULL AND ad.expiry_date < CURDATE() THEN 'expired'
            WHEN ad.verification_status = 'verified' THEN 'verified'
            WHEN ad.verification_status = 'rejected' THEN 'rejected'
            ELSE 'pending'
        END as status,
        GROUP_CONCAT(DISTINCT b.branch_name ORDER BY b.branch_name SEPARATOR ', ') as applicable_branches
    FROM application app
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    INNER JOIN branch_document_requirements bdr ON b.branch_id = bdr.branch_id
    INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
    LEFT JOIN applicant_documents ad ON p_applicant_id = ad.applicant_id 
        AND p_business_owner_id = ad.business_owner_id 
        AND dt.document_type_id = ad.document_type_id
    WHERE app.applicant_id = p_applicant_id
        AND b.business_owner_id = p_business_owner_id
    GROUP BY dt.document_type_id, dt.document_name, dt.description, 
             ad.document_id, ad.file_path, ad.original_filename, ad.file_size,
             ad.upload_date, ad.verification_status, ad.verified_at, ad.expiry_date,
             ad.rejection_reason, ad.notes
    ORDER BY MAX(bdr.is_required) DESC, dt.document_name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicationById` (IN `p_application_id` INT)   BEGIN
    SELECT 
        a.*,
        ap.applicant_full_name,
        ap.applicant_contact_number,
        ap.applicant_email,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        b.branch_name
    FROM application a
    LEFT JOIN applicant ap ON a.applicant_id = ap.applicant_id
    LEFT JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE a.application_id = p_application_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicationsByApplicant` (IN `p_applicant_id` INT)   BEGIN
    SELECT 
        a.*,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        b.branch_name
    FROM application a
    LEFT JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE a.applicant_id = p_applicant_id
    ORDER BY a.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAppliedAreasByApplicant` (IN `p_applicant_id` INT)   BEGIN
    SELECT DISTINCT 
        b.area,
        b.branch_id,
        b.branch_name
    FROM application app
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id
      AND app.application_status IN ('Pending', 'Approved');
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAvailableStalls` ()   BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.area
    FROM stall s
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON s.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE s.is_available = 1 AND s.status = 'Active'
    ORDER BY b.branch_name, f.floor_name, sec.section_name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAvailableStallsByApplicant` (IN `p_applicant_id` INT)   BEGIN
    SELECT 
        s.stall_id,
        s.stall_no as stall_number,
        s.size as stall_size,
        s.rental_price as monthly_rent,
        s.status,
        s.is_available,
        b.branch_id,
        b.branch_name,
        b.area,
        b.status as branch_status,
        CASE 
            WHEN app.application_id IS NOT NULL THEN 'applied'
            WHEN s.is_available = 1 AND s.status = 'Active' THEN 'available'
            ELSE 'unavailable'
        END as application_status
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN application app ON s.stall_id = app.stall_id AND app.applicant_id = p_applicant_id
    WHERE s.status = 'Active' 
      AND b.status = 'Active'
    ORDER BY b.area, b.branch_name, s.stall_no;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBranchById` (IN `p_branch_id` INT)   BEGIN
    SELECT * FROM branch WHERE branch_id = p_branch_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBranchDocumentRequirements` (IN `p_branch_id` INT)   BEGIN
    SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        dt.document_type_id,
        dt.document_name,
        dt.description,
        bdr.is_required,
        bdr.instructions,
        bdr.created_at,
        bdr.created_by_business_manager,
        COALESCE(
            CONCAT(bm.first_name, ' ', bm.last_name),
            CONCAT(sbo.first_name, ' ', sbo.last_name),
            'System'
        ) as created_by_name
    FROM branch_document_requirements bdr
    INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
    LEFT JOIN business_manager bm ON bdr.created_by_business_manager = bm.business_manager_id
    LEFT JOIN stall_business_owner sbo ON bdr.created_by_business_manager = sbo.business_owner_id
    WHERE bdr.branch_id = p_branch_id
    ORDER BY dt.document_name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessEmployeeById` (IN `p_employee_id` INT)   BEGIN
    SELECT 
        e.*,
        b.`branch_name`,
        bm.`first_name` as created_by_first_name,
        bm.`last_name` as created_by_last_name
    FROM `business_employee` e
    LEFT JOIN `branch` b ON e.`branch_id` = b.`branch_id`
    LEFT JOIN `business_manager` bm ON e.`created_by_manager` = bm.`business_manager_id`
    WHERE e.`business_employee_id` = p_employee_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessEmployeeByUsername` (IN `p_username` VARCHAR(20))   BEGIN
    SELECT 
        e.*,
        b.`branch_name`
    FROM `business_employee` e
    LEFT JOIN `branch` b ON e.`branch_id` = b.`branch_id`
    WHERE e.`employee_username` = p_username;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessEmployeesByBranch` (IN `p_branch_id` INT, IN `p_status` VARCHAR(20))   BEGIN
    IF p_status IS NOT NULL THEN
        SELECT 
            e.`business_employee_id`,
            e.`employee_username`,
            e.`first_name`,
            e.`last_name`,
            e.`email`,
            e.`permissions`,
            e.`status`,
            e.`last_login`,
            e.`created_at`
        FROM `business_employee` e
        WHERE e.`branch_id` = p_branch_id AND e.`status` = p_status
        ORDER BY e.`first_name`, e.`last_name`;
    ELSE
        SELECT 
            e.`business_employee_id`,
            e.`employee_username`,
            e.`first_name`,
            e.`last_name`,
            e.`email`,
            e.`permissions`,
            e.`status`,
            e.`last_login`,
            e.`created_at`
        FROM `business_employee` e
        WHERE e.`branch_id` = p_branch_id
        ORDER BY e.`first_name`, e.`last_name`;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessManagerByUsername` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT 
        bm.*,
        b.`branch_name`,
        b.`area`,
        b.`location`
    FROM `business_manager` bm
    LEFT JOIN `branch` b ON bm.`branch_id` = b.`branch_id`
    WHERE bm.`manager_username` = p_username AND bm.`status` = 'Active';
END$$

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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessOwnerPaymentHistory` (IN `p_business_owner_id` INT)   BEGIN
    SELECT 
        p.payment_id,
        p.amount,
        p.payment_date,
        p.payment_method,
        p.payment_status,
        p.reference_number,
        p.receipt_number,
        p.payment_period_start,
        p.payment_period_end,
        p.notes,
        sa.username as processed_by,
        CONCAT(sa.first_name, ' ', sa.last_name) as processed_by_name
    FROM subscription_payments p
    LEFT JOIN system_administrator sa ON p.processed_by_system_admin = sa.system_admin_id
    WHERE p.business_owner_id = p_business_owner_id
    ORDER BY p.payment_date DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessOwnerSubscription` (IN `p_business_owner_id` INT)   BEGIN
    SELECT 
        s.subscription_id,
        s.subscription_status,
        s.start_date,
        s.end_date,
        s.auto_renew,
        p.plan_name,
        p.plan_description,
        p.monthly_fee,
        p.max_branches,
        p.max_employees,
        p.features,
        DATEDIFF(s.end_date, CURDATE()) as days_remaining,
        bo.subscription_expiry_date,
        bo.last_payment_date
    FROM business_owner_subscriptions s
    JOIN subscription_plans p ON s.plan_id = p.plan_id
    JOIN stall_business_owner bo ON s.business_owner_id = bo.business_owner_id
    WHERE s.business_owner_id = p_business_owner_id
    ORDER BY s.created_at DESC
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCollectorByUsername` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.password_hash,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_created,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.username = p_username AND c.status = 'active'
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCollectorsByBranch` (IN `p_branch_id` INT)   BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_created,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE ca.branch_id = p_branch_id
    ORDER BY c.date_created DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getComplaintById` (IN `p_complaint_id` INT)   BEGIN
  SELECT 
    c.complaint_id,
    c.complaint_type,
    c.sender_id,
    c.sender_name,
    c.sender_contact,
    c.sender_email,
    c.stallholder_id,
    sh.stallholder_name,
    sh.contact_number AS stallholder_contact,
    c.stall_id,
    s.stall_no,
    c.branch_id,
    b.branch_name,
    c.subject,
    c.description,
    c.evidence,
    c.status,
    c.priority,
    c.resolution_notes,
    c.date_submitted,
    c.date_resolved,
    c.created_at,
    c.updated_at
  FROM complaint c
  LEFT JOIN stallholder sh ON c.stallholder_id = sh.stallholder_id
  LEFT JOIN stall s ON c.stall_id = s.stall_id
  LEFT JOIN branch b ON c.branch_id = b.branch_id
  WHERE c.complaint_id = p_complaint_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getComplianceRecordById` (IN `p_report_id` INT)   BEGIN
  SELECT * FROM `view_compliance_records`
  WHERE compliance_id = p_report_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getComplianceStatistics` (IN `p_branch_id` INT)   BEGIN
  SELECT 
    COUNT(*) AS total_records,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) AS in_progress_count,
    SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS complete_count,
    SUM(CASE WHEN status = 'incomplete' THEN 1 ELSE 0 END) AS incomplete_count,
    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical_count,
    SUM(CASE WHEN severity = 'major' THEN 1 ELSE 0 END) AS major_count
  FROM `violation_report`
  WHERE p_branch_id IS NULL OR branch_id = p_branch_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCredentialByApplicantId` (IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM credential WHERE applicant_id = p_applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getEmailTemplate` (IN `p_template_name` VARCHAR(100))   BEGIN
    SELECT * FROM employee_email_template 
    WHERE template_name = p_template_name AND is_active = 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getFloorsByBranch` (IN `p_branch_id` INT)   BEGIN
    SELECT * FROM floor WHERE branch_id = p_branch_id ORDER BY floor_number;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getInspectorByUsername` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT 
        i.inspector_id,
        i.username,
        i.password_hash,
        i.first_name,
        i.last_name,
        i.middle_name,
        i.email,
        i.contact_no,
        i.date_created,
        i.date_hired,
        i.status,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.username = p_username AND i.status = 'active'
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getInspectorsByBranch` (IN `p_branch_id` INT)   BEGIN
    SELECT 
        i.inspector_id,
        i.username,
        i.first_name,
        i.last_name,
        i.middle_name,
        i.email,
        i.contact_no,
        i.date_created,
        i.date_hired,
        i.status,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE ia.branch_id = p_branch_id
    ORDER BY i.date_created DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getManagerBusinessOwners` (IN `p_business_manager_id` INT)   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `getMobileApplicationStatus` (IN `p_application_id` INT, IN `p_user_id` INT)   BEGIN
    SELECT a.*, s.stall_name, s.area, s.location 
    FROM applications a 
    LEFT JOIN stalls s ON a.stall_id = s.stall_id 
    WHERE a.application_id = p_application_id AND a.applicant_id = p_user_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getMobileUserApplications` (IN `p_user_id` INT)   BEGIN
    SELECT a.*, s.stall_name, s.area, s.location 
    FROM applications a 
    LEFT JOIN stalls s ON a.stall_id = s.stall_id 
    WHERE a.applicant_id = p_user_id 
    ORDER BY a.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getMobileUserByUsername` (IN `p_username` VARCHAR(100))   BEGIN
    SELECT 
        c.registrationid,
        c.applicant_id, 
        c.user_name, 
        c.password_hash,
        c.is_active,
        a.applicant_full_name,
        COALESCE(a.applicant_email, oi.email_address) as applicant_email,
        a.applicant_contact_number
    FROM credential c
    LEFT JOIN applicant a ON c.applicant_id = a.applicant_id
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    WHERE c.user_name = p_username AND c.is_active = 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getOnsitePayments` (IN `p_branch_id` INT, IN `p_start_date` DATE, IN `p_end_date` DATE, IN `p_limit` INT, IN `p_offset` INT)   BEGIN
        SELECT 
            p.payment_id,
            p.amount,
            p.payment_date,
            p.payment_time,
            p.payment_method,
            p.payment_status,
            p.payment_type,
            p.payment_for_month,
            p.reference_number,
            p.collected_by,
            p.notes,
            p.created_at,
            sh.stallholder_id,
            sh.stallholder_name,
            sh.contact_number,
            sh.business_name,
            COALESCE(st.stall_no, 'N/A') as stall_no,
            COALESCE(st.stall_location, 'N/A') as stall_location,
            COALESCE(b.branch_name, 'Unknown') as branch_name
        FROM payments p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE p.payment_method = 'onsite'
        AND (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
        AND (p_start_date IS NULL OR DATE(p.payment_date) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(p.payment_date) <= p_end_date)
        ORDER BY p.payment_date DESC, p.created_at DESC
        LIMIT p_limit OFFSET p_offset;
    END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetOwnerDocumentRequirements` (IN `p_owner_id` INT)   BEGIN
    SELECT 
        requirement_id,
        owner_id,
        document_type,
        document_name,
        description,
        is_required,
        file_size_limit,
        allowed_file_types,
        display_order,
        is_active
    FROM owner_document_requirements
    WHERE owner_id = p_owner_id
      AND is_active = TRUE
    ORDER BY display_order ASC, document_name ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getPaymentStats` (IN `p_branch_id` INT, IN `p_month` VARCHAR(7))   BEGIN
        SELECT 
            p.payment_method,
            COUNT(p.payment_id) as total_payments,
            SUM(p.amount) as total_amount,
            p.payment_status
        FROM payments p
        LEFT JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        WHERE 1=1
        AND (p_branch_id IS NULL OR p.branch_id = p_branch_id OR sh.branch_id = p_branch_id)
        AND (p_month IS NULL OR DATE_FORMAT(p.payment_date, '%Y-%m') = p_month)
        GROUP BY p.payment_method, p.payment_status
        ORDER BY p.payment_method, p.payment_status;
    END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSectionsByFloor` (IN `p_floor_id` INT)   BEGIN
    SELECT * FROM section WHERE floor_id = p_floor_id ORDER BY section_name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallBusinessOwnerById` (IN `p_business_owner_id` INT)   BEGIN
    SELECT * FROM `stall_business_owner` 
    WHERE `business_owner_id` = p_business_owner_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallBusinessOwnerByUsername` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT * FROM `stall_business_owner` 
    WHERE `owner_username` = p_username;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallBusinessOwnerByUsernameLogin` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT 
        `business_owner_id`,
        `owner_username`,
        `owner_password_hash`,
        `first_name`,
        `last_name`,
        `contact_number`,
        `email`,
        `status`,
        'stall_business_owner' as role
    FROM `stall_business_owner` 
    WHERE `owner_username` = p_username 
    AND `status` = 'Active';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallById` (IN `p_stall_id` INT)   BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.area,
        bm.first_name as manager_first_name,
        bm.last_name as manager_last_name
    FROM stall s
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON s.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN branch_manager bm ON s.created_by_manager = bm.branch_manager_id
    WHERE s.stall_id = p_stall_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallholderBranchId` (IN `p_stallholder_id` INT)   BEGIN
  SELECT branch_id
  FROM stallholder
  WHERE stallholder_id = p_stallholder_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallholderById` (IN `p_stallholder_id` INT)   BEGIN
    SELECT 
        sh.`stallholder_id`,
        sh.`applicant_id`,
        sh.`stallholder_name`,
        sh.`contact_number`,
        sh.`email`,
        sh.`address`,
        sh.`business_name`,
        sh.`business_type`,
        sh.`branch_id`,
        b.`branch_name`,
        sh.`stall_id`,
        s.`stall_no`,
        s.`stall_location`,
        sh.`contract_start_date`,
        sh.`contract_end_date`,
        sh.`contract_status`,
        sh.`lease_amount`,
        sh.`monthly_rent`,
        sh.`payment_status`,
        sh.`last_payment_date`,
        sh.`compliance_status`,
        sh.`last_violation_date`,
        sh.`notes`,
        sh.`date_created`,
        sh.`updated_at`,
        CONCAT(bm.`first_name`, ' ', bm.`last_name`) as created_by_name,
        a.`applicant_full_name`,
        a.`applicant_contact_number`,
        a.`applicant_address`,
        a.`applicant_birthdate`,
        a.`applicant_civil_status`,
        a.`applicant_educational_attainment`
    FROM `stallholder` sh
    LEFT JOIN `branch` b ON sh.`branch_id` = b.`branch_id`
    LEFT JOIN `stall` s ON sh.`stall_id` = s.`stall_id`
    LEFT JOIN `business_manager` bm ON sh.`created_by_business_manager` = bm.`business_manager_id`
    LEFT JOIN `applicant` a ON sh.`applicant_id` = a.`applicant_id`
    WHERE sh.`stallholder_id` = p_stallholder_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetStallholderDocuments` (IN `p_stallholder_id` INT, IN `p_owner_id` INT)   BEGIN
    SELECT 
        sds.submission_id,
        sds.requirement_id,
        odr.document_type,
        odr.document_name,
        odr.is_required,
        sds.file_url,
        sds.file_name,
        sds.file_type,
        sds.file_size,
        sds.status,
        sds.rejection_reason,
        sds.uploaded_at,
        sds.reviewed_at,
        sbo.owner_full_name as reviewed_by_name
    FROM stallholder_document_submissions sds
    INNER JOIN owner_document_requirements odr ON sds.requirement_id = odr.requirement_id
    LEFT JOIN stall_business_owner sbo ON sds.reviewed_by = sbo.business_owner_id
    WHERE sds.stallholder_id = p_stallholder_id
      AND sds.owner_id = p_owner_id
    ORDER BY odr.display_order ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallholdersByBranch` (IN `p_branch_id` INT)   BEGIN
        IF p_branch_id IS NULL THEN
            SELECT 
                s.stallholder_id,
                s.stallholder_name,
                s.contact_number,
                s.business_name,
                s.business_type,
                s.contract_status,
                s.branch_id,
                st.stall_no,
                st.stall_location,
                b.branch_name
            FROM stallholder s
            LEFT JOIN stall st ON s.stall_id = st.stall_id
            LEFT JOIN branch b ON s.branch_id = b.branch_id
            WHERE s.contract_status = 'Active'
            ORDER BY s.stallholder_name ASC;
        ELSE
            SELECT 
                s.stallholder_id,
                s.stallholder_name,
                s.contact_number,
                s.business_name,
                s.business_type,
                s.contract_status,
                s.branch_id,
                st.stall_no,
                st.stall_location,
                b.branch_name
            FROM stallholder s
            LEFT JOIN stall st ON s.stall_id = st.stall_id
            LEFT JOIN branch b ON s.branch_id = b.branch_id
            WHERE s.contract_status = 'Active' AND s.branch_id = p_branch_id
            ORDER BY s.stallholder_name ASC;
        END IF;
    END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallsFiltered` (IN `p_stall_id` INT, IN `p_branch_id` INT, IN `p_price_type` VARCHAR(50), IN `p_status` VARCHAR(50), IN `p_is_available` TINYINT)   BEGIN
    SET @sql = 'SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.area,
        b.location
    FROM stall s
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON s.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE 1=1';
    
    IF p_stall_id IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.stall_id = ', p_stall_id);
    END IF;
    
    IF p_branch_id IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND b.branch_id = ', p_branch_id);
    END IF;
    
    IF p_price_type IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.price_type = "', p_price_type, '"');
    END IF;
    
    IF p_status IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.status = "', p_status, '"');
    END IF;
    
    IF p_is_available IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.is_available = ', p_is_available);
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY b.branch_name, f.floor_name, sec.section_name, s.stall_no');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallWithBranchInfo` (IN `p_stall_id` INT)   BEGIN
    SELECT st.stall_id, st.is_available, st.status, b.branch_id, b.branch_name
    FROM stall st
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE st.stall_id = p_stall_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSystemAdminDashboardStats` ()   BEGIN
    -- Total business owners
    SELECT COUNT(*) as total_business_owners FROM stall_business_owner;
    
    -- Active subscriptions
    SELECT COUNT(*) as active_subscriptions 
    FROM stall_business_owner 
    WHERE subscription_status = 'Active';
    
    -- Expiring soon (within 7 days)
    SELECT COUNT(*) as expiring_soon 
    FROM stall_business_owner 
    WHERE subscription_status = 'Active' 
    AND DATEDIFF(subscription_expiry_date, CURDATE()) <= 7
    AND subscription_expiry_date >= CURDATE();
    
    -- Expired subscriptions
    SELECT COUNT(*) as expired_subscriptions 
    FROM stall_business_owner 
    WHERE subscription_expiry_date < CURDATE();
    
    -- Total revenue this month
    SELECT COALESCE(SUM(amount), 0) as revenue_this_month
    FROM subscription_payments
    WHERE payment_status = 'Completed'
    AND MONTH(payment_date) = MONTH(CURDATE())
    AND YEAR(payment_date) = YEAR(CURDATE());
    
    -- Total revenue all time
    SELECT COALESCE(SUM(amount), 0) as total_revenue
    FROM subscription_payments
    WHERE payment_status = 'Completed';
    
    -- Pending payments
    SELECT COUNT(*) as pending_payments
    FROM stall_business_owner
    WHERE subscription_status = 'Pending';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSystemAdministratorById` (IN `p_system_admin_id` INT)   BEGIN
    SELECT * FROM `system_administrator` 
    WHERE `system_admin_id` = p_system_admin_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSystemAdministratorByUsername` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT * FROM `system_administrator` 
    WHERE `username` = p_username 
    AND `status` = 'Active';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getViolationPenaltiesByViolationId` (IN `p_violation_id` INT)   BEGIN
  SELECT 
    penalty_id,
    violation_id,
    offense_no,
    penalty_amount,
    remarks
  FROM violation_penalty
  WHERE violation_id = p_violation_id
  ORDER BY offense_no;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `loginBusinessEmployee` (IN `p_username` VARCHAR(20), IN `p_session_token` VARCHAR(255), IN `p_ip_address` VARCHAR(45), IN `p_user_agent` TEXT)   BEGIN
    DECLARE v_employee_id INT DEFAULT NULL;
    
    -- Get employee ID
    SELECT `business_employee_id` INTO v_employee_id 
    FROM `business_employee` 
    WHERE `employee_username` = p_username AND `status` = 'Active';
    
    IF v_employee_id IS NOT NULL THEN
        -- Create session
        INSERT INTO `employee_session` (`business_employee_id`, `session_token`, `ip_address`, `user_agent`, `is_active`)
        VALUES (v_employee_id, p_session_token, p_ip_address, p_user_agent, true);
        
        -- Update last login
        UPDATE `business_employee` SET `last_login` = NOW() WHERE `business_employee_id` = v_employee_id;
        
        SELECT v_employee_id as business_employee_id, 'success' as status;
    ELSE
        SELECT NULL as business_employee_id, 'failed' as status;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `loginCollector` (IN `p_username` VARCHAR(50), IN `p_update_login` BOOLEAN)   BEGIN
    -- Get collector details
    SELECT 
        c.collector_id,
        c.username,
        c.password_hash,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.status,
        ca.branch_id,
        b.branch_name,
        'collector' as role_type
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE (c.username = p_username OR c.email = p_username)
      AND c.status = 'active'
    LIMIT 1;
    
    -- Update last login if requested
    IF p_update_login THEN
        UPDATE collector 
        SET last_login = NOW() 
        WHERE username = p_username OR email = p_username;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `loginInspector` (IN `p_username` VARCHAR(50), IN `p_update_login` BOOLEAN)   BEGIN
    -- Get inspector details
    SELECT 
        i.inspector_id,
        i.username,
        i.password_hash,
        COALESCE(i.password_hash, i.password) as password_check,
        i.first_name,
        i.last_name,
        i.middle_name,
        i.email,
        i.contact_no,
        i.status,
        ia.branch_id,
        b.branch_name,
        'inspector' as role_type
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE (i.username = p_username OR i.email = p_username)
      AND i.status = 'active'
    LIMIT 1;
    
    -- Update last login if requested
    IF p_update_login THEN
        UPDATE inspector 
        SET date_created = NOW() 
        WHERE username = p_username OR email = p_username;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `loginMobileStaff` (IN `p_username` VARCHAR(50))   BEGIN
    DECLARE v_found INT DEFAULT 0;
    
    -- First try inspector
    SELECT COUNT(*) INTO v_found
    FROM inspector 
    WHERE (username = p_username OR email = p_username) AND status = 'active';
    
    IF v_found > 0 THEN
        -- Return inspector data
        SELECT 
            i.inspector_id as staff_id,
            i.username,
            COALESCE(i.password_hash, i.password) as password_hash,
            i.first_name,
            i.last_name,
            i.email,
            i.contact_no,
            i.status,
            ia.branch_id,
            b.branch_name,
            'inspector' as staff_type
        FROM inspector i
        LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
        LEFT JOIN branch b ON ia.branch_id = b.branch_id
        WHERE (i.username = p_username OR i.email = p_username)
          AND i.status = 'active'
        LIMIT 1;
    ELSE
        -- Try collector
        SELECT 
            c.collector_id as staff_id,
            c.username,
            c.password_hash,
            c.first_name,
            c.last_name,
            c.email,
            c.contact_no,
            c.status,
            ca.branch_id,
            b.branch_name,
            'collector' as staff_type
        FROM collector c
        LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
        LEFT JOIN branch b ON ca.branch_id = b.branch_id
        WHERE (c.username = p_username OR c.email = p_username)
          AND c.status = 'active'
        LIMIT 1;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `loginSystemAdministrator` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT 
        `system_admin_id`,
        `username`,
        `password_hash`,
        `first_name`,
        `last_name`,
        `contact_number`,
        `email`,
        `status`,
        'system_administrator' as role
    FROM `system_administrator`
    WHERE `username` = p_username 
    AND `status` = 'Active'
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `logoutBusinessEmployee` (IN `p_session_token` VARCHAR(255))   BEGIN
    UPDATE `employee_session` 
    SET `is_active` = false, `logout_time` = NOW()
    WHERE `session_token` = p_session_token AND `is_active` = true;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `manual_reset_payment_status` ()   BEGIN
                DECLARE reset_count INT DEFAULT 0;
                
                SELECT COUNT(*) INTO reset_count
                FROM stallholder
                WHERE payment_status = 'paid'
                  AND contract_status = 'Active';
                
                UPDATE stallholder
                SET payment_status = 'pending',
                    updated_at = NOW()
                WHERE payment_status = 'paid'
                  AND contract_status = 'Active';
                
                INSERT INTO payment_status_log (
                    reset_date,
                    stallholders_reset_count,
                    reset_type,
                    notes
                ) VALUES (
                    CURDATE(),
                    reset_count,
                    'manual',
                    CONCAT('Manual reset by admin on ', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
                );
                
                SELECT 
                    reset_count as stallholders_reset,
                    'Payment statuses reset from paid to pending' as message;
            END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `recordSubscriptionPayment` (IN `p_subscription_id` INT, IN `p_business_owner_id` INT, IN `p_amount` DECIMAL(10,2), IN `p_payment_date` DATE, IN `p_payment_method` VARCHAR(50), IN `p_reference_number` VARCHAR(100), IN `p_payment_period_start` DATE, IN `p_payment_period_end` DATE, IN `p_notes` TEXT, IN `p_processed_by_system_admin` INT)   BEGIN
    DECLARE v_payment_id INT;
    DECLARE v_receipt_number VARCHAR(100);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error recording subscription payment';
    END;
    
    START TRANSACTION;
    
    -- Generate receipt number
    SET v_receipt_number = CONCAT('RCPT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 9999), 4, '0'));
    
    -- Insert payment record
    INSERT INTO subscription_payments (
        subscription_id,
        business_owner_id,
        amount,
        payment_date,
        payment_method,
        payment_status,
        reference_number,
        receipt_number,
        payment_period_start,
        payment_period_end,
        notes,
        processed_by_system_admin
    ) VALUES (
        p_subscription_id,
        p_business_owner_id,
        p_amount,
        p_payment_date,
        p_payment_method,
        'Completed',
        p_reference_number,
        v_receipt_number,
        p_payment_period_start,
        p_payment_period_end,
        p_notes,
        p_processed_by_system_admin
    );
    
    SET v_payment_id = LAST_INSERT_ID();
    
    -- Update subscription status to Active
    UPDATE business_owner_subscriptions
    SET subscription_status = 'Active',
        end_date = p_payment_period_end
    WHERE subscription_id = p_subscription_id;
    
    -- Update business owner subscription info
    UPDATE stall_business_owner
    SET subscription_status = 'Active',
        subscription_expiry_date = p_payment_period_end,
        last_payment_date = p_payment_date
    WHERE business_owner_id = p_business_owner_id;
    
    COMMIT;
    
    -- Return payment details
    SELECT 
        v_payment_id as payment_id,
        v_receipt_number as receipt_number,
        'Payment recorded successfully' as message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `registerMobileUser` (IN `p_full_name` VARCHAR(255), IN `p_contact_number` VARCHAR(20), IN `p_address` TEXT, IN `p_username` VARCHAR(100), IN `p_email` VARCHAR(255), IN `p_password_hash` VARCHAR(255))   BEGIN
    INSERT INTO applicant (
        applicant_full_name, 
        applicant_contact_number, 
        applicant_address,
        applicant_username, 
        applicant_email, 
        applicant_password_hash,
        email_verified,
        created_at
    ) VALUES (
        p_full_name, 
        p_contact_number, 
        p_address, 
        p_username, 
        p_email, 
        p_password_hash,
        FALSE, 
        NOW()
    );
    
    SELECT LAST_INSERT_ID() as applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `removeBranchDocumentRequirement` (IN `p_branch_id` INT, IN `p_document_type_id` INT)   BEGIN
    DECLARE v_affected_rows INT DEFAULT 0;
    
    DELETE FROM branch_document_requirements
    WHERE branch_id = p_branch_id AND document_type_id = p_document_type_id;
    
    SET v_affected_rows = ROW_COUNT();
    
    SELECT 
        v_affected_rows as affected_rows,
        'deleted' as operation,
        CASE 
            WHEN v_affected_rows > 0 THEN 'Document requirement deleted successfully'
            ELSE 'No document requirement found to delete'
        END as message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `removeBranchDocumentRequirementById` (IN `p_requirement_id` INT)   BEGIN
    DECLARE v_affected_rows INT DEFAULT 0;
    
    DELETE FROM branch_document_requirements
    WHERE requirement_id = p_requirement_id;
    
    SET v_affected_rows = ROW_COUNT();
    
    SELECT 
        v_affected_rows as affected_rows,
        'deleted' as operation,
        CASE 
            WHEN v_affected_rows > 0 THEN 'Document requirement deleted successfully'
            ELSE 'No document requirement found to delete'
        END as message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `removeManagerFromBusinessOwner` (IN `p_relationship_id` INT)   BEGIN
    DECLARE v_is_primary TINYINT(1);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error removing manager from business owner';
    END;
    
    START TRANSACTION;
    
    
    SELECT is_primary INTO v_is_primary
    FROM business_owner_managers
    WHERE relationship_id = p_relationship_id;
    
    
    IF v_is_primary = 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot remove primary manager. Assign a new primary manager first.';
    END IF;
    
    
    UPDATE business_owner_managers
    SET status = 'Inactive',
        updated_at = NOW()
    WHERE relationship_id = p_relationship_id;
    
    COMMIT;
    
    SELECT 
        ROW_COUNT() as affected_rows,
        'Manager removed successfully' as message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `reportStallholder` (IN `p_inspector_id` INT, IN `p_stallholder_id` INT, IN `p_violation_id` INT, IN `p_branch_id` INT, IN `p_stall_id` INT, IN `p_evidence` TEXT, IN `p_remarks` TEXT)   BEGIN
    DECLARE v_offense_no INT;
    DECLARE v_penalty_amount DECIMAL(10,2);
    DECLARE v_penalty_remarks VARCHAR(255);
    DECLARE v_penalty_id INT DEFAULT NULL;

    IF NOT EXISTS (SELECT 1 FROM violation WHERE violation_id = p_violation_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Invalid violation_id provided';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM stallholder WHERE stallholder_id = p_stallholder_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Invalid stallholder_id provided';
    END IF;

    SELECT COUNT(*) + 1 INTO v_offense_no FROM violation_report
    WHERE stallholder_id = p_stallholder_id AND violation_id = p_violation_id;

    SELECT vp.penalty_id, vp.penalty_amount, vp.remarks INTO v_penalty_id, v_penalty_amount, v_penalty_remarks
    FROM violation_penalty vp
    WHERE vp.violation_id = p_violation_id
      AND vp.offense_no = (SELECT MAX(offense_no) FROM violation_penalty
                           WHERE violation_id = p_violation_id AND offense_no <= v_offense_no);

    IF v_penalty_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: No penalty defined for this violation type';
    END IF;

    INSERT INTO violation_report (inspector_id, stallholder_id, violator_name, violation_id, branch_id, stall_id, 
                                  evidence, date_reported, offense_no, penalty_id, remarks)
    VALUES (p_inspector_id, p_stallholder_id, NULL, p_violation_id, p_branch_id, p_stall_id, p_evidence, NOW(),
            v_offense_no, v_penalty_id,
            CONCAT_WS(' | ', p_remarks, CONCAT('Offense #', v_offense_no), 
                      CONCAT('Fine: â‚±', IFNULL(v_penalty_amount, '0.00')), IFNULL(v_penalty_remarks, '')));

    UPDATE stallholder SET compliance_status = 'Non-Compliant', last_violation_date = NOW()
    WHERE stallholder_id = p_stallholder_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ResetAllAutoIncrements` ()   BEGIN
    -- Core tables
    CALL ResetAutoIncrement('applicant', 'applicant_id');
    CALL ResetAutoIncrement('applicant_documents', 'document_id');
    CALL ResetAutoIncrement('credential', 'registrationid');
    CALL ResetAutoIncrement('stallholder', 'stallholder_id');
    
    -- Location tables
    CALL ResetAutoIncrement('branch', 'branch_id');
    CALL ResetAutoIncrement('floor', 'floor_id');
    CALL ResetAutoIncrement('section', 'section_id');
    CALL ResetAutoIncrement('stall', 'stall_id');
    
    -- User tables
    CALL ResetAutoIncrement('business_employee', 'business_employee_id');
    CALL ResetAutoIncrement('business_manager', 'business_manager_id');
    CALL ResetAutoIncrement('stall_business_owner', 'business_owner_id');
    CALL ResetAutoIncrement('system_administrator', 'system_admin_id');
    CALL ResetAutoIncrement('inspector', 'inspector_id');
    
    -- Application related
    CALL ResetAutoIncrement('spouse', 'spouse_id');
    CALL ResetAutoIncrement('business_information', 'business_id');
    CALL ResetAutoIncrement('other_information', 'other_info_id');
    CALL ResetAutoIncrement('stall_applications', 'application_id');
    
    -- Raffle/Auction
    CALL ResetAutoIncrement('raffle', 'raffle_id');
    CALL ResetAutoIncrement('auction', 'auction_id');
    CALL ResetAutoIncrement('auction_bids', 'bid_id');
    CALL ResetAutoIncrement('auction_result', 'result_id');
    CALL ResetAutoIncrement('raffle_participants', 'participant_id');
    CALL ResetAutoIncrement('raffle_result', 'result_id');
    
    -- Others
    CALL ResetAutoIncrement('complaint', 'complaint_id');
    CALL ResetAutoIncrement('payments', 'payment_id');
    CALL ResetAutoIncrement('violation', 'violation_id');
    CALL ResetAutoIncrement('violation_penalty', 'penalty_id');
    CALL ResetAutoIncrement('violation_report', 'report_id');
    
    -- Documents
    CALL ResetAutoIncrement('document_types', 'document_type_id');
    CALL ResetAutoIncrement('branch_document_requirements', 'requirement_id');
    CALL ResetAutoIncrement('stallholder_documents', 'document_id');
    CALL ResetAutoIncrement('stallholder_document_submissions', 'submission_id');
    
    -- Subscriptions
    CALL ResetAutoIncrement('subscription_plans', 'plan_id');
    CALL ResetAutoIncrement('subscription_payments', 'payment_id');
    CALL ResetAutoIncrement('business_owner_subscriptions', 'subscription_id');
    CALL ResetAutoIncrement('business_owner_managers', 'relationship_id');
    
    -- Employee logs
    CALL ResetAutoIncrement('employee_activity_log', 'log_id');
    CALL ResetAutoIncrement('employee_credential_log', 'log_id');
    CALL ResetAutoIncrement('employee_email_template', 'template_id');
    CALL ResetAutoIncrement('employee_password_reset', 'reset_id');
    CALL ResetAutoIncrement('employee_session', 'session_id');
    
    -- Inspector
    CALL ResetAutoIncrement('inspector_action_log', 'action_id');
    CALL ResetAutoIncrement('inspector_assignment', 'assignment_id');
    
    -- Other logs
    CALL ResetAutoIncrement('payment_status_log', 'log_id');
    CALL ResetAutoIncrement('raffle_auction_log', 'log_id');
    
    SELECT '✅ All auto_increments have been reset!' AS result;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `resetBusinessEmployeePassword` (IN `p_employee_id` INT, IN `p_new_password_hash` VARCHAR(255), IN `p_reset_by` INT)   BEGIN
    UPDATE `business_employee` 
    SET 
        `employee_password_hash` = p_new_password_hash,
        `password_reset_required` = true,
        `updated_at` = NOW()
    WHERE `business_employee_id` = p_employee_id;
    
    -- Terminate all active sessions
    UPDATE `employee_session` 
    SET `is_active` = false, `logout_time` = NOW()
    WHERE `business_employee_id` = p_employee_id AND `is_active` = true;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `resetStallBusinessOwnerPassword` (IN `p_business_owner_id` INT, IN `p_new_password_hash` VARCHAR(255))   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    UPDATE `stall_business_owner`
    SET 
        `owner_password_hash` = p_new_password_hash,
        `updated_at` = NOW()
    WHERE `business_owner_id` = p_business_owner_id;
    
    COMMIT;
    
    SELECT 1 as success, 
           'Password reset successfully' AS message,
           ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `resetSystemAdministratorPassword` (IN `p_system_admin_id` INT, IN `p_new_password_hash` VARCHAR(255))   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    UPDATE `system_administrator`
    SET 
        `password_hash` = p_new_password_hash,
        `updated_at` = NOW()
    WHERE `system_admin_id` = p_system_admin_id;
    
    COMMIT;
    
    SELECT 1 as success, 
           'Password reset successfully' AS message,
           ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ResetTableAutoIncrement` (IN `tableName` VARCHAR(255))   BEGIN
    DECLARE maxId INT DEFAULT 0;
    DECLARE newAutoInc INT DEFAULT 1;
    
    SET @sql = CONCAT('SELECT COALESCE(MAX(', 
        (SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = tableName 
         AND COLUMN_KEY = 'PRI' 
         AND EXTRA LIKE '%auto_increment%'
         LIMIT 1), 
        '), 0) INTO @maxId FROM ', tableName);
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    SET newAutoInc = @maxId + 1;
    
    SET @alterSql = CONCAT('ALTER TABLE ', tableName, ' AUTO_INCREMENT = ', newAutoInc);
    PREPARE alterStmt FROM @alterSql;
    EXECUTE alterStmt;
    DEALLOCATE PREPARE alterStmt;
    
    SELECT CONCAT('✅ Reset ', tableName, ' AUTO_INCREMENT to ', newAutoInc) AS result;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `resolveComplaint` (IN `p_complaint_id` INT, IN `p_resolution_notes` TEXT, IN `p_status` VARCHAR(20))   BEGIN
  UPDATE complaint
  SET
    status = COALESCE(p_status, 'resolved'),
    resolution_notes = p_resolution_notes,
    date_resolved = NOW()
  WHERE complaint_id = p_complaint_id;
  
  SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `revokeAllUserTokens` (IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_reason` VARCHAR(255))   BEGIN
    
    
    SELECT p_user_id as user_id, p_user_type as user_type, 'tokens_revoked' as status;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `setBranchDocumentRequirement` (IN `p_branch_id` INT, IN `p_document_type_id` INT, IN `p_is_required` TINYINT, IN `p_instructions` TEXT, IN `p_created_by_manager` INT)   BEGIN
    DECLARE v_requirement_id INT DEFAULT 0;
    DECLARE v_affected_rows INT DEFAULT 0;
    
    SELECT requirement_id INTO v_requirement_id
    FROM branch_document_requirements
    WHERE branch_id = p_branch_id AND document_type_id = p_document_type_id
    LIMIT 1;
    
    IF v_requirement_id > 0 THEN
        UPDATE branch_document_requirements
        SET 
            is_required = p_is_required,
            instructions = p_instructions,
            created_by_business_manager = p_created_by_manager,
            created_at = CURRENT_TIMESTAMP
        WHERE requirement_id = v_requirement_id;
        
        SET v_affected_rows = ROW_COUNT();
        
        SELECT 
            v_requirement_id as requirement_id,
            'updated' as operation,
            v_affected_rows as affected_rows,
            'Document requirement updated successfully' as message;
    ELSE
        INSERT INTO branch_document_requirements (
            branch_id,
            document_type_id,
            is_required,
            instructions,
            created_by_business_manager,
            created_at
        ) VALUES (
            p_branch_id,
            p_document_type_id,
            p_is_required,
            p_instructions,
            p_created_by_manager,
            CURRENT_TIMESTAMP
        );
        
        SET v_requirement_id = LAST_INSERT_ID();
        SET v_affected_rows = ROW_COUNT();
        
        SELECT 
            v_requirement_id as requirement_id,
            'created' as operation,
            v_affected_rows as affected_rows,
            'Document requirement created successfully' as message;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_addBranchDocumentRequirement` (IN `p_branch_id` INT, IN `p_document_type_id` INT, IN `p_is_required` TINYINT)   BEGIN
  INSERT INTO branch_document_requirements (branch_id, document_type_id, is_required)
  VALUES (p_branch_id, p_document_type_id, p_is_required);
  
  SELECT LAST_INSERT_ID() as requirement_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_addRaffleParticipant` (IN `p_raffle_id` INT, IN `p_applicant_id` INT, IN `p_application_id` INT)   BEGIN
  INSERT INTO raffle_participants (raffle_id, applicant_id, application_id) 
  VALUES (p_raffle_id, p_applicant_id, p_application_id);
  
  UPDATE raffle SET total_participants = total_participants + 1 WHERE raffle_id = p_raffle_id;
  
  SELECT LAST_INSERT_ID() as participant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_addStall` (IN `p_stall_no` VARCHAR(50), IN `p_rental_price` DECIMAL(10,2), IN `p_size` VARCHAR(50), IN `p_stall_location` VARCHAR(200), IN `p_stall_type` VARCHAR(100), IN `p_section_id` INT, IN `p_stall_image` VARCHAR(500), IN `p_stall_description` TEXT, IN `p_raffle_auction_status` VARCHAR(50), IN `p_auction_type` VARCHAR(50), IN `p_status` VARCHAR(50), IN `p_is_available` TINYINT)   BEGIN
  INSERT INTO stall (
    stall_no, rental_price, size, stall_location, stall_type, section_id,
    stall_image, stall_description, raffle_auction_status, auction_type,
    status, is_available, created_at, updated_at
  ) VALUES (
    p_stall_no, p_rental_price, p_size, p_stall_location, p_stall_type, p_section_id,
    p_stall_image, p_stall_description, p_raffle_auction_status, p_auction_type,
    p_status, p_is_available, NOW(), NOW()
  );
  
  SELECT LAST_INSERT_ID() as stall_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_addStallComplete` (IN `p_stall_no` VARCHAR(50), IN `p_stall_location` VARCHAR(200), IN `p_size` VARCHAR(50), IN `p_floor_id` INT, IN `p_section_id` INT, IN `p_rental_price` DECIMAL(10,2), IN `p_price_type` VARCHAR(50), IN `p_status` VARCHAR(50), IN `p_stamp` VARCHAR(50), IN `p_description` TEXT, IN `p_stall_image` VARCHAR(500), IN `p_is_available` TINYINT, IN `p_raffle_auction_deadline` DATETIME, IN `p_deadline_active` TINYINT, IN `p_raffle_auction_status` VARCHAR(50), IN `p_created_by_manager` INT)   BEGIN
  INSERT INTO stall (
    stall_no, stall_location, size, floor_id, section_id, rental_price, 
    price_type, status, stamp, description, stall_image, is_available, 
    raffle_auction_deadline, deadline_active, raffle_auction_status, created_by_manager, created_at
  ) VALUES (
    p_stall_no, p_stall_location, p_size, p_floor_id, p_section_id, p_rental_price, 
    p_price_type, p_status, p_stamp, p_description, p_stall_image, p_is_available, 
    p_raffle_auction_deadline, p_deadline_active, p_raffle_auction_status, p_created_by_manager, NOW()
  );
  
  SELECT LAST_INSERT_ID() as stall_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_addStallImage` (IN `p_stall_id` INT, IN `p_image_url` VARCHAR(500), IN `p_is_primary` TINYINT)   BEGIN
    DECLARE image_count INT DEFAULT 0;
    DECLARE new_display_order INT DEFAULT 1;
    DECLARE should_be_primary TINYINT DEFAULT 0;
    
    
    SELECT COUNT(*) INTO image_count
    FROM stall_images
    WHERE stall_id = p_stall_id;
    
    
    IF image_count >= 10 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot add more than 10 images per stall';
    END IF;
    
    
    SET new_display_order = image_count + 1;
    
    
    
    IF p_is_primary = 1 OR image_count = 0 THEN
        SET should_be_primary = 1;
        
        
        IF should_be_primary = 1 AND image_count > 0 THEN
            UPDATE stall_images 
            SET is_primary = 0 
            WHERE stall_id = p_stall_id;
        END IF;
    ELSE
        SET should_be_primary = 0;
    END IF;
    
    
    INSERT INTO stall_images (stall_id, image_url, is_primary, display_order, created_at)
    VALUES (p_stall_id, p_image_url, should_be_primary, new_display_order, NOW());
    
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_addStall_complete` (IN `p_stall_no` VARCHAR(20), IN `p_stall_location` VARCHAR(100), IN `p_size` VARCHAR(50), IN `p_floor_id` INT, IN `p_section_id` INT, IN `p_rental_price` DECIMAL(10,2), IN `p_price_type` ENUM('Fixed Price','Auction','Raffle'), IN `p_status` ENUM('Active','Inactive','Maintenance','Occupied'), IN `p_stamp` VARCHAR(100), IN `p_description` TEXT, IN `p_stall_image` VARCHAR(500), IN `p_is_available` TINYINT(1), IN `p_raffle_auction_deadline` DATETIME, IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_branch_id` INT, OUT `p_stall_id` INT, OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(500))   proc_label: BEGIN
    DECLARE v_existing_stall INT DEFAULT 0;
    DECLARE v_floor_section_valid INT DEFAULT 0;
    DECLARE v_branch_valid INT DEFAULT 0;
    DECLARE v_business_manager_id INT DEFAULT NULL;
    DECLARE v_floor_name VARCHAR(100);
    DECLARE v_section_name VARCHAR(100);
    DECLARE v_branch_name VARCHAR(100);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error occurred while adding stall';
        SET p_stall_id = NULL;
    END;

    START TRANSACTION;

    
    IF p_user_type = 'business_manager' THEN
        SET v_business_manager_id = p_user_id;
        
        
        SELECT COUNT(*) INTO v_branch_valid
        FROM business_manager
        WHERE business_manager_id = p_user_id AND branch_id = p_branch_id;
        
        IF v_branch_valid = 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Manager does not belong to this branch';
            SET p_stall_id = NULL;
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
    ELSEIF p_user_type = 'business_employee' THEN
        
        SELECT bm.business_manager_id INTO v_business_manager_id
        FROM branch b
        LEFT JOIN business_manager bm ON b.branch_id = bm.branch_id
        WHERE b.branch_id = p_branch_id
        LIMIT 1;
        
        IF v_business_manager_id IS NULL THEN
            SET p_success = FALSE;
            SET p_message = 'Branch does not have an assigned manager';
            SET p_stall_id = NULL;
            ROLLBACK;
            LEAVE proc_label;
        END IF;
    ELSE
        SET p_success = FALSE;
        SET p_message = CONCAT('Access denied. User type ', p_user_type, ' cannot create stalls');
        SET p_stall_id = NULL;
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    
    SELECT COUNT(*), MAX(f.floor_name), MAX(sec.section_name), MAX(b.branch_name)
    INTO v_floor_section_valid, v_floor_name, v_section_name, v_branch_name
    FROM section sec
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE sec.section_id = p_section_id 
      AND f.floor_id = p_floor_id 
      AND b.branch_id = p_branch_id;

    IF v_floor_section_valid = 0 THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Invalid floor (', p_floor_id, ') or section (', p_section_id, ') for your branch');
        SET p_stall_id = NULL;
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    
    SELECT COUNT(*) INTO v_existing_stall
    FROM stall
    WHERE stall_no = p_stall_no AND section_id = p_section_id;

    IF v_existing_stall > 0 THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Stall number ', p_stall_no, ' already exists in ', v_section_name, ' section on ', v_floor_name);
        SET p_stall_id = NULL;
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    
    INSERT INTO stall (
        stall_no, 
        stall_location, 
        size, 
        floor_id, 
        section_id, 
        rental_price,
        price_type, 
        status, 
        stamp, 
        description, 
        is_available,
        raffle_auction_deadline,
        deadline_active,
        raffle_auction_status,
        created_by_business_manager,
        created_at
    ) VALUES (
        p_stall_no,
        p_stall_location,
        p_size,
        p_floor_id,
        p_section_id,
        p_rental_price,
        p_price_type,
        p_status,
        p_stamp,
        p_description,
        p_is_available,
        p_raffle_auction_deadline,
        0, 
        CASE 
            WHEN p_price_type IN ('Raffle', 'Auction') THEN 'Not Started'
            ELSE NULL
        END,
        v_business_manager_id,
        NOW()
    );

    
    SET p_stall_id = LAST_INSERT_ID();
    
    
    SET p_success = TRUE;
    SET p_message = CONCAT('Stall ', p_stall_no, ' created successfully in ', v_section_name, ' section on ', v_floor_name);

    COMMIT;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_add_payment` (IN `p_stallholder_id` INT, IN `p_amount` DECIMAL(10,2), IN `p_payment_date` DATE, IN `p_payment_time` TIME, IN `p_payment_for_month` VARCHAR(7), IN `p_payment_type` ENUM('rental','utilities','maintenance','penalty','other'), IN `p_payment_method` ENUM('cash','gcash','maya','paymaya','bank_transfer','check'), IN `p_reference_number` VARCHAR(100), IN `p_collected_by_user_id` INT, IN `p_notes` TEXT)   BEGIN
    DECLARE payment_id INT;
    DECLARE collected_by_name VARCHAR(200);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            @error_code = MYSQL_ERRNO,
            @error_message = MESSAGE_TEXT;
        SELECT CONCAT('Error: ', @error_code, ' - ', @error_message) as error_message;
    END;
    
    START TRANSACTION;
    
    -- Get collected by user name
    SELECT CONCAT(first_name, ' ', last_name) 
    INTO collected_by_name
    FROM user 
    WHERE user_id = p_collected_by_user_id;
    
    IF collected_by_name IS NULL THEN
        SET collected_by_name = 'System User';
    END IF;
    
    -- Insert the payment record
    INSERT INTO payment (
        stallholder_id,
        amount,
        payment_date,
        payment_time,
        payment_for_month,
        payment_type,
        payment_method,
        reference_number,
        collected_by,
        collected_by_user_id,
        notes,
        payment_status,
        created_at,
        updated_at
    ) VALUES (
        p_stallholder_id,
        p_amount,
        p_payment_date,
        p_payment_time,
        p_payment_for_month,
        p_payment_type,
        p_payment_method,
        p_reference_number,
        collected_by_name,
        p_collected_by_user_id,
        p_notes,
        'completed',
        NOW(),
        NOW()
    );
    
    SET payment_id = LAST_INSERT_ID();
    
    -- Update stallholder payment status if needed
    UPDATE stallholder 
    SET payment_status = 'paid',
        updated_at = NOW()
    WHERE stallholder_id = p_stallholder_id;
    
    COMMIT;
    
    -- Return the payment ID and success message
    SELECT 
      payment_id as paymentId,
      'Payment added successfully' as message,
      p_reference_number as referenceNumber,
      collected_by_name as collectedBy;
  END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_approvePayment` (IN `p_payment_id` INT, IN `p_approved_by` INT)   BEGIN
  UPDATE payment 
  SET payment_status = 'Approved', approved_by = p_approved_by, approved_at = NOW() 
  WHERE payment_id = p_payment_id;
  
  SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_cancelAuction` (IN `p_auction_id` INT)   BEGIN
  UPDATE auction SET auction_status = 'Cancelled', updated_at = NOW() WHERE auction_id = p_auction_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_cancelRaffle` (IN `p_raffle_id` INT)   BEGIN
  UPDATE raffle SET raffle_status = 'Cancelled', updated_at = NOW() WHERE raffle_id = p_raffle_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkBranchExists` (IN `p_branch_name` VARCHAR(100), IN `p_area` VARCHAR(100), IN `p_location` VARCHAR(100))   BEGIN
  SELECT branch_id FROM branch 
  WHERE branch_name = p_branch_name 
    OR (area = p_area AND location = p_location);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkExistingAuction` (IN `p_stall_id` INT)   BEGIN
  SELECT auction_id FROM auction WHERE stall_id = p_stall_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkExistingRaffle` (IN `p_stall_id` INT)   BEGIN
  SELECT raffle_id FROM raffle WHERE stall_id = p_stall_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkManagerExistsForBranch` (IN `p_branch_id` INT)   BEGIN
  SELECT branch_manager_id FROM branch_manager WHERE branch_id = p_branch_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkManagerExistsForDifferentBranch` (IN `p_username` VARCHAR(100), IN `p_branch_id` INT)   BEGIN
  SELECT branch_manager_id, branch_id 
  FROM branch_manager 
  WHERE manager_username = p_username AND branch_id != p_branch_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkManagerUsernameExists` (IN `p_username` VARCHAR(100), IN `p_exclude_manager_id` INT)   BEGIN
  SELECT branch_manager_id 
  FROM branch_manager 
  WHERE manager_username = p_username 
    AND branch_manager_id != p_exclude_manager_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkManagerUsernameGlobal` (IN `p_username` VARCHAR(100))   BEGIN
  SELECT branch_manager_id FROM branch_manager WHERE manager_username = p_username;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkRaffleParticipant` (IN `p_raffle_id` INT, IN `p_applicant_id` INT)   BEGIN
  SELECT participant_id FROM raffle_participants 
  WHERE raffle_id = p_raffle_id AND applicant_id = p_applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkStallAvailability` (IN `p_stall_id` INT)   BEGIN
    SELECT stall_id, is_available, status FROM stall WHERE stall_id = p_stall_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_countAuctionBids` (IN `p_auction_id` INT)   BEGIN
  SELECT COUNT(*) as count FROM auction_bids WHERE auction_id = p_auction_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_countDistinctBidders` (IN `p_auction_id` INT)   BEGIN
  SELECT COUNT(DISTINCT applicant_id) as bidders FROM auction_bids WHERE auction_id = p_auction_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_countManagersForBranch` (IN `p_branch_id` INT)   BEGIN
  SELECT COUNT(*) as count FROM branch_manager WHERE branch_id = p_branch_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_countRaffleParticipants` (IN `p_raffle_id` INT)   BEGIN
  SELECT COUNT(*) as count FROM raffle_participants WHERE raffle_id = p_raffle_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createApplication` (IN `p_stall_id` INT, IN `p_applicant_id` INT)   BEGIN
    INSERT INTO application (stall_id, applicant_id, application_date, application_status)
    VALUES (p_stall_id, p_applicant_id, CURDATE(), 'Pending');
    
    SELECT LAST_INSERT_ID() as application_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createAuctionForStall` (IN `p_stall_id` INT, IN `p_starting_bid` DECIMAL(10,2), IN `p_bid_increment` DECIMAL(10,2), IN `p_start_date` DATETIME, IN `p_end_date` DATETIME)   BEGIN
  INSERT INTO auction (
    stall_id, starting_bid, bid_increment, start_date, end_date, auction_status, created_at
  ) VALUES (
    p_stall_id, p_starting_bid, p_bid_increment, p_start_date, p_end_date, 'Ongoing', NOW()
  );
  
  SELECT LAST_INSERT_ID() as auction_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createAuctionResult` (IN `p_auction_id` INT, IN `p_winner_applicant_id` INT, IN `p_winner_application_id` INT, IN `p_winning_bid` DECIMAL(10,2), IN `p_total_bidders` INT)   BEGIN
  INSERT INTO auction_result (
    auction_id, winner_applicant_id, winner_application_id, winning_bid, total_bidders, result_date
  ) VALUES (
    p_auction_id, p_winner_applicant_id, p_winner_application_id, p_winning_bid, p_total_bidders, NOW()
  );
  
  SELECT LAST_INSERT_ID() as result_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createAuctionWaiting` (IN `p_stall_id` INT, IN `p_starting_price` DECIMAL(10,2), IN `p_created_by_manager` INT)   BEGIN
  INSERT INTO auction (
    stall_id, starting_price, auction_status, created_by_manager, created_at
  ) VALUES (
    p_stall_id, p_starting_price, 'Waiting for Bidders', p_created_by_manager, NOW()
  );
  
  SELECT LAST_INSERT_ID() as auction_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createBranchManager` (IN `p_branch_id` INT, IN `p_manager_username` VARCHAR(100), IN `p_password_hash` VARCHAR(255), IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(150), IN `p_contact_number` VARCHAR(20))   BEGIN
  INSERT INTO branch_manager (
    branch_id, manager_username, password, first_name, last_name, email, contact_number, status, created_at
  ) VALUES (
    p_branch_id, p_manager_username, p_password_hash, p_first_name, p_last_name, p_email, p_contact_number, 'Active', NOW()
  );
  
  SELECT LAST_INSERT_ID() as branch_manager_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createRaffleForStall` (IN `p_stall_id` INT, IN `p_start_date` DATETIME, IN `p_end_date` DATETIME, IN `p_min_participants` INT)   BEGIN
  INSERT INTO raffle (
    stall_id, start_date, end_date, min_participants, raffle_status, created_at
  ) VALUES (
    p_stall_id, p_start_date, p_end_date, p_min_participants, 'Ongoing', NOW()
  );
  
  SELECT LAST_INSERT_ID() as raffle_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createRaffleResult` (IN `p_raffle_id` INT, IN `p_winner_applicant_id` INT, IN `p_winner_application_id` INT, IN `p_total_participants` INT)   BEGIN
  INSERT INTO raffle_result (
    raffle_id, winner_applicant_id, winner_application_id, total_participants, result_date
  ) VALUES (
    p_raffle_id, p_winner_applicant_id, p_winner_application_id, p_total_participants, NOW()
  );
  
  SELECT LAST_INSERT_ID() as result_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createRaffleWaiting` (IN `p_stall_id` INT, IN `p_created_by_manager` INT)   BEGIN
  INSERT INTO raffle (
    stall_id, raffle_status, created_by_manager, created_at
  ) VALUES (
    p_stall_id, 'Waiting for Participants', p_created_by_manager, NOW()
  );
  
  SELECT LAST_INSERT_ID() as raffle_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_declinePayment` (IN `p_payment_id` INT, IN `p_declined_by` INT, IN `p_decline_reason` TEXT)   BEGIN
  UPDATE payment 
  SET payment_status = 'Declined', declined_by = p_declined_by, declined_at = NOW(), decline_reason = p_decline_reason 
  WHERE payment_id = p_payment_id;
  
  SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteApplicantCascade` (IN `p_applicant_id` INT)   BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
  
  START TRANSACTION;
  
  -- Delete from application table first
  DELETE FROM application WHERE applicant_id = p_applicant_id;
  
  -- Delete from other_information
  DELETE FROM other_information WHERE applicant_id = p_applicant_id;
  
  -- Delete from business_information
  DELETE FROM business_information WHERE applicant_id = p_applicant_id;
  
  -- Delete from spouse
  DELETE FROM spouse WHERE applicant_id = p_applicant_id;
  
  -- Delete from credential
  DELETE FROM credential WHERE applicant_id = p_applicant_id;
  
  -- Delete from applicant_documents
  DELETE FROM applicant_documents WHERE applicant_id = p_applicant_id;
  
  -- Finally delete from applicant table
  DELETE FROM applicant WHERE applicant_id = p_applicant_id;
  
  COMMIT;
  
  SELECT p_applicant_id as deleted_applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteBranch` (IN `p_branch_id` INT)   BEGIN
  DELETE FROM branch WHERE branch_id = p_branch_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteBranchDocumentRequirements` (IN `p_branch_id` INT)   BEGIN
  DELETE FROM branch_document_requirements WHERE branch_id = p_branch_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteBranchManager` (IN `p_manager_id` INT)   BEGIN
  DELETE FROM branch_manager WHERE branch_manager_id = p_manager_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteStall` (IN `p_stall_id` INT, IN `p_deleted_by_business_manager` INT, OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(500))   BEGIN
    DECLARE v_stall_exists INT DEFAULT 0;
    DECLARE v_has_active_applications INT DEFAULT 0;
    DECLARE v_has_stallholder INT DEFAULT 0;
    DECLARE v_stall_no VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error occurred while deleting stall';
    END;

    START TRANSACTION;

    -- Check if stall exists and get stall number
    SELECT COUNT(*), stall_no INTO v_stall_exists, v_stall_no
    FROM stall
    WHERE stall_id = p_stall_id;

    IF v_stall_exists = 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Stall not found';
        ROLLBACK;
    ELSE
        -- Check for active applications
        SELECT COUNT(*) INTO v_has_active_applications
        FROM application
        WHERE stall_id = p_stall_id 
        AND application_status IN ('Pending', 'Under Review', 'Approved');

        IF v_has_active_applications > 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Cannot delete stall with active applications';
            ROLLBACK;
        ELSE
            -- Check for active stallholders
            SELECT COUNT(*) INTO v_has_stallholder
            FROM stallholder
            WHERE stall_id = p_stall_id 
            AND contract_status = 'Active';

            IF v_has_stallholder > 0 THEN
                SET p_success = FALSE;
                SET p_message = 'Cannot delete stall with active stallholder';
                ROLLBACK;
            ELSE
                -- Delete related raffle records
                DELETE FROM raffle WHERE stall_id = p_stall_id;
                
                -- Delete related auction records
                DELETE FROM auction WHERE stall_id = p_stall_id;
                
                -- Delete the stall
                DELETE FROM stall WHERE stall_id = p_stall_id;
                
                SET p_success = TRUE;
                SET p_message = CONCAT('Stall ', v_stall_no, ' deleted successfully');
                COMMIT;
            END IF;
        END IF;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteStallImage` (IN `p_image_id` INT)   BEGIN
  DECLARE v_stall_id INT;
  DECLARE v_image_url VARCHAR(255);
  
  
  SELECT stall_id, image_url INTO v_stall_id, v_image_url
  FROM stall_images
  WHERE id = p_image_id;
  
  IF v_stall_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Image not found';
  END IF;
  
  
  DELETE FROM stall_images WHERE id = p_image_id;
  
  
  SELECT v_stall_id AS stall_id, v_image_url AS image_url, p_image_id AS id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteStall_complete` (IN `p_stall_id` INT, IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_branch_id` INT, OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(500))   proc_label: BEGIN
    DECLARE v_existing_branch_id INT DEFAULT NULL;
    DECLARE v_has_active_subscription INT DEFAULT 0;
    DECLARE v_has_applications INT DEFAULT 0;
    DECLARE v_stall_no VARCHAR(20) DEFAULT NULL;
    DECLARE v_floor_id INT DEFAULT NULL;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = CONCAT('Database error: ', @text);
    END;

    START TRANSACTION;

    -- Check if stall exists first
    SELECT s.stall_no, s.section_id INTO v_stall_no, v_floor_id
    FROM stall s
    WHERE s.stall_id = p_stall_id;

    IF v_stall_no IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Stall not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Get branch_id from section and floor
    SELECT f.branch_id INTO v_existing_branch_id
    FROM section sec
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    WHERE sec.section_id = v_floor_id;

    IF v_existing_branch_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Stall not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Verify user has permission to delete this stall
    IF p_user_type = 'business_manager' THEN
        -- Verify manager owns this branch
        IF NOT EXISTS (
            SELECT 1 FROM business_manager 
            WHERE business_manager_id = p_user_id AND branch_id = v_existing_branch_id
        ) THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
    ELSEIF p_user_type = 'business_employee' THEN
        -- Verify employee's branch matches stall's branch
        IF p_branch_id != v_existing_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
    ELSE
        SET p_success = FALSE;
        SET p_message = CONCAT('Access denied. User type ', p_user_type, ' cannot delete stalls');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Check for any applications (not just pending)
    SELECT COUNT(*) INTO v_has_applications
    FROM application
    WHERE stall_id = p_stall_id;

    IF v_has_applications > 0 THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot delete stall ', v_stall_no, '. Application records exist. Archive stall instead of deleting');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Check for stallholders
    IF EXISTS (SELECT 1 FROM stallholder WHERE stall_id = p_stall_id) THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot delete stall ', v_stall_no, '. Stallholder records exist. Archive stall instead of deleting');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Check for auction records
    IF EXISTS (SELECT 1 FROM auction WHERE stall_id = p_stall_id) THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot delete stall ', v_stall_no, '. Auction records exist. Archive stall instead of deleting');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Check for raffle records
    IF EXISTS (SELECT 1 FROM raffle WHERE stall_id = p_stall_id) THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot delete stall ', v_stall_no, '. Raffle records exist. Archive stall instead of deleting');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Check for violation reports
    IF EXISTS (SELECT 1 FROM violation_report WHERE stall_id = p_stall_id) THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot delete stall ', v_stall_no, '. Violation reports exist. Archive stall instead of deleting');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- If no related records exist, safe to delete
    DELETE FROM stall WHERE stall_id = p_stall_id;

    SET p_success = TRUE;
    SET p_message = CONCAT('Stall ', v_stall_no, ' deleted successfully');

    COMMIT;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_endAuction` (IN `p_auction_id` INT)   BEGIN
  UPDATE auction SET auction_status = 'Ended' WHERE auction_id = p_auction_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_endRaffle` (IN `p_raffle_id` INT)   BEGIN
  UPDATE raffle SET raffle_status = 'Ended' WHERE raffle_id = p_raffle_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_generate_receipt_number` ()   BEGIN
    DECLARE current_date_str VARCHAR(8);
    DECLARE last_reference VARCHAR(20);
    DECLARE sequence_number INT;
    DECLARE new_receipt_number VARCHAR(20);
    
    -- Get current date in YYYYMMDD format
    SET current_date_str = DATE_FORMAT(NOW(), '%Y%m%d');
    
    -- Get the last reference number for today from PAYMENTS table
    SELECT reference_number INTO last_reference
    FROM payments 
    WHERE reference_number LIKE CONCAT('RCP-', current_date_str, '%')
    ORDER BY reference_number DESC
    LIMIT 1;
    
    -- Extract sequence number and increment
    IF last_reference IS NOT NULL THEN
        SET sequence_number = CAST(SUBSTRING(last_reference, -3) AS UNSIGNED) + 1;
    ELSE
        SET sequence_number = 1;
    END IF;
    
    -- Ensure we don't exceed 999 payments per day
    IF sequence_number > 999 THEN
        SET sequence_number = 999;
    END IF;
    
    -- Generate new receipt number: RCP-YYYYMMDD-3-digit sequence
    SET new_receipt_number = CONCAT('RCP-', current_date_str, '-', LPAD(sequence_number, 3, '0'));
    
    SELECT new_receipt_number as receiptNumber, 'success' as status;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getActiveAdmin` ()   BEGIN
  SELECT admin_id FROM admin WHERE status = 'Active' LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAdminByEmail` (IN `p_email` VARCHAR(150))   BEGIN
  SELECT * FROM admin WHERE email = p_email AND status = 'Active';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAllActiveEmployees` (IN `p_status` VARCHAR(50))   BEGIN
  SELECT be.*, b.branch_name, 
         bm.first_name as manager_first_name, bm.last_name as manager_last_name 
  FROM business_employee be 
  LEFT JOIN branch b ON be.branch_id = b.branch_id 
  LEFT JOIN business_manager bm ON be.created_by_manager = bm.business_manager_id 
  WHERE be.status = p_status 
  ORDER BY be.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAllFloors` ()   BEGIN
  SELECT f.* FROM floor f;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAllSections` ()   BEGIN
  SELECT s.* FROM section s;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAllStallsByBranch` (IN `p_branch_id` INT)   BEGIN
    SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
        s.floor_id,
        f.floor_name,
        s.section_id,
        sec.section_name,
        s.rental_price,
        s.price_type,
        s.status,
        s.stamp,
        s.description,
        si.image_url as stall_image,
        s.is_available,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        s.created_by_business_manager,
        s.created_at,
        s.updated_at,
        b.branch_id,
        b.branch_name,
        CASE 
            WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
            WHEN s.is_available = 1 THEN 'Available'
            ELSE 'Unavailable'
        END as availability_status,
        sh.stallholder_id,
        sh.stallholder_name
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON s.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
    LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
    WHERE b.branch_id = p_branch_id
    ORDER BY s.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAllStallsByManager` (IN `p_business_manager_id` INT)   BEGIN
    SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
        s.floor_id,
        f.floor_name,
        s.section_id,
        sec.section_name,
        s.rental_price,
        s.price_type,
        s.status,
        s.stamp,
        s.description,
        si.image_url as stall_image,
        s.is_available,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        s.created_by_business_manager,
        s.created_at,
        s.updated_at,
        b.branch_id,
        b.branch_name,
        CASE 
            WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
            WHEN s.is_available = 1 THEN 'Available'
            ELSE 'Unavailable'
        END as availability_status,
        sh.stallholder_id,
        sh.stallholder_name
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON s.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    INNER JOIN business_manager bm ON b.branch_id = bm.branch_id
    LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
    LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
    WHERE bm.business_manager_id = p_business_manager_id
    ORDER BY s.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAllStalls_complete` (IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_branch_id` INT)   BEGIN
    IF p_user_type = 'stall_business_owner' THEN
        
        SELECT 
            s.stall_id,
            s.stall_no,
            s.stall_location,
            s.size,
            s.floor_id,
            f.floor_name,
            s.section_id,
            sec.section_name,
            s.rental_price,
            s.price_type,
            s.status,
            s.stamp,
            s.description,
            si.image_url as stall_image,
            s.is_available,
            s.raffle_auction_deadline,
            s.deadline_active,
            s.raffle_auction_status,
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
                WHEN s.is_available = 1 THEN 'Available'
                ELSE 'Unavailable'
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE b.branch_id IN (
            SELECT DISTINCT bm.branch_id
            FROM business_owner_managers bom
            INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
            WHERE bom.business_owner_id = p_user_id AND bom.status = 'Active'
        )
        ORDER BY b.branch_name, s.created_at DESC;

    ELSEIF p_user_type = 'system_administrator' THEN
        
        SELECT 
            s.stall_id,
            s.stall_no,
            s.stall_location,
            s.size,
            s.floor_id,
            f.floor_name,
            s.section_id,
            sec.section_name,
            s.rental_price,
            s.price_type,
            s.status,
            s.stamp,
            s.description,
            si.image_url as stall_image,
            s.is_available,
            s.raffle_auction_deadline,
            s.deadline_active,
            s.raffle_auction_status,
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
                WHEN s.is_available = 1 THEN 'Available'
                ELSE 'Unavailable'
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        ORDER BY b.branch_name, s.created_at DESC;

    ELSEIF p_user_type = 'business_manager' THEN
        
        SELECT 
            s.stall_id,
            s.stall_no,
            s.stall_location,
            s.size,
            s.floor_id,
            f.floor_name,
            s.section_id,
            sec.section_name,
            s.rental_price,
            s.price_type,
            s.status,
            s.stamp,
            s.description,
            si.image_url as stall_image,
            s.is_available,
            s.raffle_auction_deadline,
            s.deadline_active,
            s.raffle_auction_status,
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
                WHEN s.is_available = 1 THEN 'Available'
                ELSE 'Unavailable'
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        INNER JOIN business_manager bm ON b.branch_id = bm.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE bm.business_manager_id = p_user_id
        ORDER BY s.created_at DESC;
        
    ELSEIF p_user_type = 'business_employee' THEN
        
        SELECT 
            s.stall_id,
            s.stall_no,
            s.stall_location,
            s.size,
            s.floor_id,
            f.floor_name,
            s.section_id,
            sec.section_name,
            s.rental_price,
            s.price_type,
            s.status,
            s.stamp,
            s.description,
            si.image_url as stall_image,
            s.is_available,
            s.raffle_auction_deadline,
            s.deadline_active,
            s.raffle_auction_status,
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
                WHEN s.is_available = 1 THEN 'Available'
                ELSE 'Unavailable'
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE b.branch_id = p_branch_id
        ORDER BY s.created_at DESC;
        
    ELSE
        
        SELECT NULL LIMIT 0;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getApplicantById` (IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM applicant WHERE applicant_id = p_applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getApplicantName` (IN `p_applicant_id` INT)   BEGIN
  SELECT applicant_full_name FROM applicant WHERE applicant_id = p_applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getApplicationByApplicantId` (IN `p_applicant_id` INT)   BEGIN
    SELECT 
        app.application_id,
        app.stall_id,
        app.application_status,
        app.application_date,
        s.stall_no,
        s.rental_price,
        s.stall_location,
        s.size,
        sec.section_id,
        f.floor_id,
        b.branch_id,
        b.branch_name
    FROM application app
    LEFT JOIN stall s ON app.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id
    ORDER BY app.application_date DESC
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAvailableStallsByBranch` (IN `p_branch_id` INT)   BEGIN
    SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
        s.floor_id,
        f.floor_name,
        s.section_id,
        sec.section_name,
        s.rental_price,
        s.price_type,
        s.status,
        s.description,
        si.image_url as stall_image,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON s.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
    WHERE b.branch_id = p_branch_id
    AND s.is_available = 1
    AND s.status = 'Active'
    AND s.stall_id NOT IN (
        SELECT stall_id FROM stallholder WHERE contract_status = 'Active'
    )
    ORDER BY s.stall_no ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBranchById` (IN `p_branch_id` INT)   BEGIN
  SELECT branch_id, branch_name FROM branch WHERE branch_id = p_branch_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBranchIdFromBusinessManager` (IN `p_manager_id` INT)   BEGIN
  SELECT branch_id FROM business_manager WHERE business_manager_id = p_manager_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBranchManagerByEmail` (IN `p_email` VARCHAR(150))   BEGIN
  SELECT * FROM branch_manager WHERE email = p_email AND status = 'Active';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBranchManagerById` (IN `p_manager_id` INT)   BEGIN
  SELECT branch_manager_id, branch_id, manager_username 
  FROM branch_manager 
  WHERE branch_manager_id = p_manager_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBusinessEmployeeByEmail` (IN `p_email` VARCHAR(150))   BEGIN
  SELECT * FROM business_employee WHERE email = p_email AND status = 'Active';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBusinessInfoByApplicantId` (IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM business_information WHERE applicant_id = p_applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBusinessManagerByEmail` (IN `p_email` VARCHAR(150))   BEGIN
  SELECT * FROM business_manager WHERE email = p_email AND status = 'Active';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getDistinctAreas` ()   BEGIN
  SELECT DISTINCT area FROM branch WHERE status = 'Active' ORDER BY area ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getDistinctBranches` ()   BEGIN
  SELECT DISTINCT branch_name as branch FROM branch WHERE status = 'Active' ORDER BY branch_name;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getDocumentTypeByRequirementId` (IN `p_requirement_id` INT)   BEGIN
  SELECT document_type_id FROM branch_document_requirements WHERE requirement_id = p_requirement_id LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getEmployeesByBranchIds` (IN `p_status` VARCHAR(50), IN `p_branch_ids` VARCHAR(500))   BEGIN
  SET @sql = CONCAT(
    'SELECT be.*, b.branch_name, bm.first_name as manager_first_name, bm.last_name as manager_last_name ',
    'FROM business_employee be ',
    'LEFT JOIN branch b ON be.branch_id = b.branch_id ',
    'LEFT JOIN business_manager bm ON be.created_by_manager = bm.business_manager_id ',
    'WHERE be.status = ''', p_status, ''' AND be.branch_id IN (', p_branch_ids, ') ',
    'ORDER BY be.created_at DESC'
  );
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getExistingManagerForBranch` (IN `p_branch_id` INT)   BEGIN
  SELECT branch_manager_id, first_name, last_name 
  FROM branch_manager 
  WHERE branch_id = p_branch_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getFloorByBranchWithDetails` (IN `p_branch_id` INT)   BEGIN
  SELECT f.* FROM floor f
  JOIN branch b ON f.branch_id = b.branch_id
  WHERE f.branch_id = p_branch_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getFloorByManagerWithDetails` (IN `p_manager_id` INT)   BEGIN
  SELECT f.* FROM floor f
  JOIN branch b ON f.branch_id = b.branch_id
  JOIN business_manager bm ON b.branch_id = bm.branch_id
  WHERE bm.business_manager_id = p_manager_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getFloorCountByManager` (IN `p_manager_id` INT)   BEGIN
  SELECT COUNT(*) as floor_count FROM floor WHERE branch_manager_id = p_manager_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getFloorsByBranchId` (IN `p_branch_id` INT)   BEGIN
  SELECT f.* FROM floor f WHERE f.branch_id = p_branch_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getFloorsByBranchIds` (IN `p_branch_ids` VARCHAR(500))   BEGIN
  SET @sql = CONCAT('SELECT f.* FROM floor f WHERE f.branch_id IN (', p_branch_ids, ')');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLandingPageFilterOptions` ()   BEGIN
    -- Return branches
    SELECT branch_id, branch_name FROM branch ORDER BY branch_name;
    
    -- Return distinct business types
    SELECT DISTINCT business_type FROM stallholder WHERE business_type IS NOT NULL AND business_type != '' ORDER BY business_type;
    
    -- Return stall statuses (including occupancy options)
    SELECT 'Active' as status UNION SELECT 'Inactive' UNION SELECT 'Maintenance' UNION SELECT 'Occupied' UNION SELECT 'Available';
    
    -- Return price types
    SELECT 'Fixed Price' as price_type UNION SELECT 'Auction' UNION SELECT 'Raffle';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLandingPageStallholders` (IN `p_search` VARCHAR(255), IN `p_branch_filter` INT, IN `p_business_type_filter` VARCHAR(100), IN `p_page` INT, IN `p_limit` INT)   BEGIN
    DECLARE v_offset INT;
    SET v_offset = (p_page - 1) * p_limit;
    
    -- Return stallholders with their stall and branch info
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.business_name,
        sh.business_type,
        sh.contact_number,
        sh.email,
        s.stall_no,
        s.stall_location,
        b.branch_name,
        b.branch_id,
        sh.contract_status,
        sh.compliance_status
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.contract_status = 'Active'
    AND (p_search IS NULL OR p_search = '' OR 
         sh.stallholder_name LIKE CONCAT('%', p_search, '%') OR
         sh.business_name LIKE CONCAT('%', p_search, '%') OR
         sh.business_type LIKE CONCAT('%', p_search, '%') OR
         s.stall_no LIKE CONCAT('%', p_search, '%') OR
         b.branch_name LIKE CONCAT('%', p_search, '%'))
    AND (p_branch_filter IS NULL OR p_branch_filter = 0 OR sh.branch_id = p_branch_filter)
    AND (p_business_type_filter IS NULL OR p_business_type_filter = '' OR sh.business_type = p_business_type_filter)
    ORDER BY sh.stallholder_name ASC
    LIMIT p_limit OFFSET v_offset;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLandingPageStalls` (IN `p_search` VARCHAR(255), IN `p_branch_filter` INT, IN `p_status_filter` VARCHAR(50), IN `p_price_type_filter` VARCHAR(50), IN `p_page` INT, IN `p_limit` INT)   BEGIN
    DECLARE v_offset INT;
    SET v_offset = (p_page - 1) * p_limit;
    
    
    SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
        s.rental_price,
        s.price_type,
        s.status,
        s.is_available,
        s.description,
        si.image_url as stall_image,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.branch_id,
        CASE WHEN sh.stallholder_id IS NOT NULL THEN 'Occupied' ELSE 'Available' END as occupancy_status
    FROM stall s
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
    LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
    WHERE (p_search IS NULL OR p_search = '' OR 
           s.stall_no LIKE CONCAT('%', p_search, '%') OR
           s.stall_location LIKE CONCAT('%', p_search, '%') OR
           sec.section_name LIKE CONCAT('%', p_search, '%') OR
           f.floor_name LIKE CONCAT('%', p_search, '%') OR
           b.branch_name LIKE CONCAT('%', p_search, '%'))
    AND (p_branch_filter IS NULL OR p_branch_filter = 0 OR b.branch_id = p_branch_filter)
    AND (p_status_filter IS NULL OR p_status_filter = '' OR s.status = p_status_filter
         OR (p_status_filter = 'Occupied' AND sh.stallholder_id IS NOT NULL)
         OR (p_status_filter = 'Available' AND sh.stallholder_id IS NULL))
    AND (p_price_type_filter IS NULL OR p_price_type_filter = '' OR s.price_type = p_price_type_filter)
    ORDER BY b.branch_name, f.floor_name, s.stall_no ASC
    LIMIT p_limit OFFSET v_offset;
END$$

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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLocationsByArea` (IN `p_area` VARCHAR(100))   BEGIN
  SELECT DISTINCT location, branch_name as branch 
  FROM branch 
  WHERE area = p_area AND status = 'Active' 
  ORDER BY location;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLocationsByBranch` (IN `p_branch_name` VARCHAR(100))   BEGIN
  SELECT DISTINCT location, branch_name as branch 
  FROM branch 
  WHERE branch_name = p_branch_name AND status = 'Active' 
  ORDER BY location;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLocationsByCity` (IN `p_city` VARCHAR(100))   BEGIN
  SELECT DISTINCT location, branch_name as branch 
  FROM branch 
  WHERE city = p_city AND status = 'Active' 
  ORDER BY location;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getMobileUserByUsername` (IN `p_username` VARCHAR(100))   BEGIN
  SELECT 
    c.credential_id,
    c.applicant_id,
    c.username,
    c.password,
    c.status AS credential_status,
    a.applicant_id,
    a.applicant_full_name,
    a.applicant_gender,
    a.applicant_birthday,
    a.applicant_civil_status,
    a.applicant_nationality,
    a.applicant_religion,
    a.applicant_address,
    a.applicant_contact_number,
    a.applicant_email,
    a.applicant_status
  FROM credential c
  INNER JOIN applicant a ON c.applicant_id = a.applicant_id
  WHERE c.username = p_username AND c.status = 'Active';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getOtherInfoByApplicantId` (IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM other_information WHERE applicant_id = p_applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getSectionsByFloorId` (IN `p_floor_id` INT)   BEGIN
  SELECT s.* FROM section s
  JOIN floor f ON s.floor_id = f.floor_id
  WHERE s.floor_id = p_floor_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getSectionsByFloorIds` (IN `p_floor_ids` VARCHAR(500))   BEGIN
  SET @sql = CONCAT('SELECT s.* FROM section s
    JOIN floor f ON s.floor_id = f.floor_id
    WHERE s.floor_id IN (', p_floor_ids, ')');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getSpouseByApplicantId` (IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM spouse WHERE applicant_id = p_applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getStallById` (IN `p_stall_id` INT)   BEGIN
    SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
        s.floor_id,
        f.floor_name,
        s.section_id,
        sec.section_name,
        s.rental_price,
        s.price_type,
        s.status,
        s.stamp,
        s.description,
        si.image_url as stall_image,
        s.is_available,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        s.raffle_auction_start_time,
        s.raffle_auction_end_time,
        s.created_by_business_manager,
        s.created_at,
        s.updated_at,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location,
        bm.first_name as manager_first_name,
        bm.last_name as manager_last_name
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON s.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN business_manager bm ON s.created_by_business_manager = bm.business_manager_id
    LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
    WHERE s.stall_id = p_stall_id;
END$$

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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getStallImage` (IN `p_stall_id` INT)   BEGIN
    SELECT 
        s.stall_id,
        s.stall_no,
        si.image_url as stall_image,
        s.stall_location,
        s.size,
        s.rental_price,
        s.status,
        s.description,
        sec.section_name,
        f.floor_name,
        b.branch_name
    FROM stall s
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
    WHERE s.stall_id = p_stall_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getStallImages` (IN `p_stall_id` INT)   BEGIN
  SELECT 
    id,
    stall_id,
    image_url,
    display_order,
    is_primary,
    created_at,
    updated_at
  FROM stall_images
  WHERE stall_id = p_stall_id
  ORDER BY is_primary DESC, display_order ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_all_stallholders` (IN `p_branch_id` INT)   BEGIN
                SELECT 
                    sh.stallholder_id as id,
                    sh.stallholder_name as name,
                    sh.contact_number as contact,
                    sh.business_name as businessName,
                    COALESCE(st.stall_no, 'N/A') as stallNo,
                    COALESCE(st.stall_location, 'N/A') as stallLocation,
                    COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
                    COALESCE(b.branch_name, 'Unknown') as branchName,
                    sh.payment_status as paymentStatus
                FROM stallholder sh
                LEFT JOIN stall st ON sh.stall_id = st.stall_id
                LEFT JOIN branch b ON sh.branch_id = b.branch_id
                WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
                  AND sh.contract_status = 'Active'
                  AND sh.payment_status != 'paid'
                ORDER BY sh.stallholder_name ASC;
            END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_payments_for_manager` (IN `p_manager_id` INT, IN `p_limit` INT, IN `p_offset` INT, IN `p_search` VARCHAR(255))   BEGIN
            SELECT 
                p.payment_id as id,
                p.stallholder_id as stallholderId,
                COALESCE(sh.stallholder_name, 'Unknown') as stallholderName,
                COALESCE(st.stall_no, 'N/A') as stallNo,
                p.amount as amountPaid,
                p.payment_date as paymentDate,
                p.payment_time as paymentTime,
                p.payment_for_month as paymentForMonth,
                p.payment_type as paymentType,
                CASE 
                    WHEN p.payment_method = 'onsite' THEN 'Cash (Onsite)'
                    WHEN p.payment_method = 'online' THEN 'Online Payment'
                    WHEN p.payment_method = 'bank_transfer' THEN 'Bank Transfer'
                    WHEN p.payment_method = 'gcash' THEN 'GCash'
                    WHEN p.payment_method = 'maya' THEN 'Maya'
                    WHEN p.payment_method = 'paymaya' THEN 'PayMaya'
                    WHEN p.payment_method = 'check' THEN 'Check'
                    ELSE CONCAT(UPPER(SUBSTRING(p.payment_method, 1, 1)), LOWER(SUBSTRING(p.payment_method, 2)))
                END as paymentMethod,
                p.reference_number as referenceNo,
                p.collected_by as collectedBy,
                p.notes,
                p.payment_status as status,
                p.created_at as createdAt,
                COALESCE(b.branch_name, 'Unknown') as branchName
            FROM payments p
            LEFT JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
            LEFT JOIN stall st ON sh.stall_id = st.stall_id
            LEFT JOIN branch b ON sh.branch_id = b.branch_id
            ORDER BY p.created_at DESC
            LIMIT p_limit OFFSET p_offset;
        END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_stallholders_for_manager` (IN `p_manager_id` INT)   BEGIN
    DECLARE manager_branch_id INT DEFAULT NULL;
    
    -- Get the branch ID for the manager
    SELECT branch_id INTO manager_branch_id 
    FROM branch_manager 
    WHERE branch_manager_id = p_manager_id;
    
    IF manager_branch_id IS NULL THEN
        SELECT 'No stallholders found for this manager' as message;
    ELSE
        SELECT 
            sh.stallholder_id as stallholderId,
            sh.stallholder_name as stallholderName,
            COALESCE(st.stall_no, 'N/A') as stallNo,
            sh.contact_number as contactNumber,
            sh.contract_status as status,
            b.branch_name as branchName,
            sh.branch_id as branchId
        FROM stallholder sh
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.branch_id = manager_branch_id
        AND sh.contract_status = 'Active'
        ORDER BY sh.stallholder_name ASC;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_stallholder_details` (IN `p_stallholder_id` INT)   BEGIN
    SELECT
        sh.stallholder_id as id,
        sh.stallholder_name as name,
        sh.contact_number as contact,
        sh.business_name as businessName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        COALESCE(st.stall_location, 'N/A') as stallLocation,
        -- This one is already correct - it prioritizes sh.monthly_rent
        COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
        COALESCE(b.branch_name, 'Unknown') as branchName,
        sh.contract_status as contractStatus,
        sh.payment_status as paymentStatus,
        sh.last_payment_date as lastPaymentDate,
        'success' as status
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.stallholder_id = p_stallholder_id
      AND sh.contract_status = 'Active';
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_logRaffleAuctionActivity` (IN `p_stall_id` INT, IN `p_event_type` VARCHAR(100), IN `p_raffle_id` INT, IN `p_auction_id` INT, IN `p_applicant_id` INT, IN `p_application_id` INT, IN `p_bid_amount` DECIMAL(10,2), IN `p_notes` TEXT)   BEGIN
  INSERT INTO raffle_auction_log (
    stall_id, event_type, raffle_id, auction_id, applicant_id, application_id, bid_amount, notes, created_at
  ) VALUES (
    p_stall_id, p_event_type, p_raffle_id, p_auction_id, p_applicant_id, p_application_id, p_bid_amount, p_notes, NOW()
  );
  
  SELECT LAST_INSERT_ID() as log_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_logTokenActivity` (IN `p_token_id` VARCHAR(255), IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_activity_type` VARCHAR(50), IN `p_ip_address` VARCHAR(50), IN `p_user_agent` VARCHAR(255), IN `p_success` TINYINT)   BEGIN
  INSERT INTO token_activity_log (token_id, user_id, user_type, activity_type, ip_address, user_agent, success, created_at)
  VALUES (p_token_id, p_user_id, p_user_type, p_activity_type, p_ip_address, p_user_agent, p_success, NOW());
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_placeAuctionBid` (IN `p_auction_id` INT, IN `p_applicant_id` INT, IN `p_application_id` INT, IN `p_bid_amount` DECIMAL(10,2))   BEGIN
  -- Reset existing winning bids
  UPDATE auction_bids SET is_winning_bid = 0 WHERE auction_id = p_auction_id;
  
  -- Insert new bid as winning
  INSERT INTO auction_bids (
    auction_id, applicant_id, application_id, bid_amount, is_winning_bid, bid_time
  ) VALUES (
    p_auction_id, p_applicant_id, p_application_id, p_bid_amount, 1, NOW()
  );
  
  SELECT LAST_INSERT_ID() as bid_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_resetWinningBids` (IN `p_auction_id` INT)   BEGIN
  UPDATE auction_bids SET is_winning_bid = 0 WHERE auction_id = p_auction_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_setRaffleWinner` (IN `p_participant_id` INT)   BEGIN
  UPDATE raffle_participants SET is_winner = 1 WHERE participant_id = p_participant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_setStallPrimaryImage` (IN `p_image_id` INT)   BEGIN
    DECLARE v_stall_id INT;
    
    
    SELECT stall_id INTO v_stall_id 
    FROM stall_images 
    WHERE id = p_image_id;
    
    IF v_stall_id IS NOT NULL THEN
        
        UPDATE stall_images 
        SET is_primary = 0 
        WHERE stall_id = v_stall_id;
        
        
        UPDATE stall_images 
        SET is_primary = 1 
        WHERE id = p_image_id;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_storeRefreshToken` (IN `p_token_id` VARCHAR(255), IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_token_hash` VARCHAR(255), IN `p_device_info` VARCHAR(255), IN `p_ip_address` VARCHAR(50), IN `p_expires_at` DATETIME)   BEGIN
  INSERT INTO refresh_tokens (token_id, user_id, user_type, token_hash, device_info, ip_address, expires_at, created_at)
  VALUES (p_token_id, p_user_id, p_user_type, p_token_hash, p_device_info, p_ip_address, p_expires_at, NOW());
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateApplicationStatus` (IN `p_application_id` INT, IN `p_status` VARCHAR(50))   BEGIN
  UPDATE application SET application_status = p_status WHERE application_id = p_application_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateBranchManager` (IN `p_manager_id` INT, IN `p_branch_id` INT, IN `p_manager_username` VARCHAR(100), IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(150), IN `p_contact_number` VARCHAR(20), IN `p_password_hash` VARCHAR(255))   BEGIN
  UPDATE branch_manager 
  SET 
    branch_id = COALESCE(p_branch_id, branch_id),
    manager_username = COALESCE(p_manager_username, manager_username),
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    email = COALESCE(p_email, email),
    contact_number = COALESCE(p_contact_number, contact_number),
    password = CASE WHEN p_password_hash IS NOT NULL THEN p_password_hash ELSE password END,
    updated_at = NOW()
  WHERE branch_manager_id = p_manager_id;
  
  SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateLastLogin` (IN `p_table_name` VARCHAR(50), IN `p_user_id_field` VARCHAR(50), IN `p_user_id` INT)   BEGIN
  SET @sql = CONCAT('UPDATE ', p_table_name, ' SET last_login = NOW() WHERE ', p_user_id_field, ' = ', p_user_id);
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateStall` (IN `p_stall_id` INT, IN `p_stall_no` VARCHAR(20), IN `p_stall_location` VARCHAR(100), IN `p_size` VARCHAR(50), IN `p_floor_id` INT, IN `p_section_id` INT, IN `p_rental_price` DECIMAL(10,2), IN `p_price_type` ENUM('Fixed Price','Auction','Raffle'), IN `p_status` ENUM('Active','Inactive','Maintenance','Occupied'), IN `p_description` TEXT, IN `p_stall_image` VARCHAR(500), IN `p_is_available` TINYINT(1), IN `p_raffle_auction_deadline` DATETIME, IN `p_updated_by_business_manager` INT, OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(500))   BEGIN
    DECLARE v_stall_exists INT DEFAULT 0;
    DECLARE v_duplicate_stall INT DEFAULT 0;
    DECLARE v_floor_section_valid INT DEFAULT 0;
    DECLARE v_current_price_type VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error occurred while updating stall';
    END;

    START TRANSACTION;

    -- Check if stall exists
    SELECT COUNT(*), price_type INTO v_stall_exists, v_current_price_type
    FROM stall
    WHERE stall_id = p_stall_id;

    IF v_stall_exists = 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Stall not found';
        ROLLBACK;
    ELSE
        -- Validate floor and section relationship
        SELECT COUNT(*) INTO v_floor_section_valid
        FROM section s
        INNER JOIN floor f ON s.floor_id = f.floor_id
        WHERE s.section_id = p_section_id AND f.floor_id = p_floor_id;

        IF v_floor_section_valid = 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Invalid floor and section combination';
            ROLLBACK;
        ELSE
            -- Check for duplicate stall number (excluding current stall)
            SELECT COUNT(*) INTO v_duplicate_stall
            FROM stall
            WHERE stall_no = p_stall_no 
            AND section_id = p_section_id 
            AND stall_id != p_stall_id;

            IF v_duplicate_stall > 0 THEN
                SET p_success = FALSE;
                SET p_message = CONCAT('Stall number ', p_stall_no, ' already exists in this section');
                ROLLBACK;
            ELSE
                -- Update the stall
                UPDATE stall SET
                    stall_no = p_stall_no,
                    stall_location = p_stall_location,
                    size = p_size,
                    floor_id = p_floor_id,
                    section_id = p_section_id,
                    rental_price = p_rental_price,
                    price_type = p_price_type,
                    status = p_status,
                    description = p_description,
                    stall_image = p_stall_image,
                    is_available = p_is_available,
                    raffle_auction_deadline = p_raffle_auction_deadline,
                    updated_at = NOW()
                WHERE stall_id = p_stall_id;

                -- Handle price type changes
                IF v_current_price_type != p_price_type THEN
                    -- If changing to Raffle, ensure raffle record exists
                    IF p_price_type = 'Raffle' THEN
                        INSERT IGNORE INTO raffle (
                            stall_id, 
                            raffle_status, 
                            created_by_business_manager, 
                            created_at
                        ) VALUES (
                            p_stall_id, 
                            'Waiting for Participants', 
                            p_updated_by_business_manager, 
                            NOW()
                        );
                    END IF;

                    -- If changing to Auction, ensure auction record exists
                    IF p_price_type = 'Auction' THEN
                        INSERT IGNORE INTO auction (
                            stall_id, 
                            starting_price, 
                            current_highest_bid, 
                            auction_status,
                            created_by_business_manager, 
                            created_at
                        ) VALUES (
                            p_stall_id, 
                            p_rental_price, 
                            p_rental_price,
                            'Waiting for Bids',
                            p_updated_by_business_manager, 
                            NOW()
                        );
                    END IF;
                END IF;

                SET p_success = TRUE;
                SET p_message = CONCAT('Stall ', p_stall_no, ' updated successfully');
                COMMIT;
            END IF;
        END IF;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateStallRaffleAuctionStatus` (IN `p_stall_id` INT, IN `p_status` VARCHAR(50))   BEGIN
  UPDATE stall SET raffle_auction_status = p_status WHERE stall_id = p_stall_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateStall_complete` (IN `p_stall_id` INT, IN `p_stall_no` VARCHAR(20), IN `p_stall_location` VARCHAR(100), IN `p_size` VARCHAR(50), IN `p_floor_id` INT, IN `p_section_id` INT, IN `p_rental_price` DECIMAL(10,2), IN `p_price_type` ENUM('Fixed Price','Auction','Raffle'), IN `p_status` ENUM('Active','Inactive','Maintenance','Occupied'), IN `p_description` TEXT, IN `p_stall_image` VARCHAR(500), IN `p_is_available` TINYINT(1), IN `p_raffle_auction_deadline` DATETIME, IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_branch_id` INT, OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(500))   proc_label: BEGIN
    DECLARE v_existing_branch_id INT;
    DECLARE v_floor_section_valid INT DEFAULT 0;
    DECLARE v_duplicate_stall INT DEFAULT 0;
    DECLARE v_business_manager_id INT;
    DECLARE v_correct_floor_id INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error occurred while updating stall';
    END;

    START TRANSACTION;

    
    SELECT f.branch_id INTO v_existing_branch_id
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    WHERE s.stall_id = p_stall_id;

    IF v_existing_branch_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Stall not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    
    IF p_user_type = 'business_manager' THEN
        
        SELECT COUNT(*) INTO v_floor_section_valid
        FROM business_manager
        WHERE business_manager_id = p_user_id AND branch_id = p_branch_id;
        
        IF v_floor_section_valid = 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. You do not manage this branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        
        IF p_branch_id != v_existing_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        SET v_business_manager_id = p_user_id;
        
    ELSEIF p_user_type = 'business_employee' THEN
        
        IF p_branch_id != v_existing_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        
        SELECT business_manager_id INTO v_business_manager_id
        FROM business_manager
        WHERE branch_id = p_branch_id
        LIMIT 1;
        
    ELSE
        SET p_success = FALSE;
        SET p_message = CONCAT('Access denied. User type ', p_user_type, ' cannot update stalls');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    
    
    SELECT f.floor_id INTO v_correct_floor_id
    FROM section sec
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    WHERE sec.section_id = p_section_id 
      AND f.branch_id = p_branch_id;

    IF v_correct_floor_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Invalid section for this branch';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    
    SET p_floor_id = v_correct_floor_id;

    
    SELECT COUNT(*) INTO v_duplicate_stall
    FROM stall
    WHERE stall_no = p_stall_no 
      AND section_id = p_section_id 
      AND stall_id != p_stall_id;

    IF v_duplicate_stall > 0 THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Stall number ', p_stall_no, ' already exists in this section');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    
    UPDATE stall SET
        stall_no = p_stall_no,
        stall_location = p_stall_location,
        size = p_size,
        floor_id = p_floor_id,
        section_id = p_section_id,
        rental_price = p_rental_price,
        price_type = p_price_type,
        status = p_status,
        description = p_description,
        is_available = p_is_available,
        raffle_auction_deadline = p_raffle_auction_deadline,
        updated_at = NOW()
    WHERE stall_id = p_stall_id;

    SET p_success = TRUE;
    SET p_message = 'Stall updated successfully';

    COMMIT;
END$$

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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_uploadStallImage` (IN `p_stall_id` INT, IN `p_image_path` VARCHAR(500), IN `p_updated_by` INT)   BEGIN
    DECLARE v_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_exists FROM stall WHERE stall_id = p_stall_id;
    
    IF v_exists = 0 THEN
        SELECT 0 as success, 'Stall not found' as message;
    ELSE
        UPDATE stall 
        SET stall_image = p_image_path,
            updated_at = NOW()
        WHERE stall_id = p_stall_id;
        
        SELECT 1 as success, 
               'Stall image uploaded successfully' as message,
               p_stall_id as stall_id,
               p_image_path as image_path;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `terminateCollector` (IN `p_collector_id` INT, IN `p_reason` VARCHAR(255), IN `p_branch_manager_id` INT)   BEGIN
    DECLARE v_branch_id INT;
    DECLARE v_first_name VARCHAR(100);
    DECLARE v_last_name VARCHAR(100);
    
    -- Get current assignment info
    SELECT ca.branch_id, c.first_name, c.last_name 
    INTO v_branch_id, v_first_name, v_last_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    WHERE c.collector_id = p_collector_id
    LIMIT 1;
    
    -- Update collector status
    UPDATE collector 
    SET status = 'inactive',
        termination_date = CURDATE(),
        termination_reason = p_reason
    WHERE collector_id = p_collector_id;
    
    -- Update assignment status
    UPDATE collector_assignment 
    SET status = 'Inactive',
        end_date = CURDATE()
    WHERE collector_id = p_collector_id AND status = 'Active';
    
    -- Log the termination
    INSERT INTO collector_action_log (
        collector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    ) VALUES (
        p_collector_id,
        v_branch_id,
        p_branch_manager_id,
        'Termination',
        NOW(),
        CONCAT('Collector ', v_first_name, ' ', v_last_name, ' was terminated. Reason: ', p_reason)
    );
    
    SELECT 'Collector terminated successfully' as message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `terminateInspector` (IN `p_inspector_id` INT, IN `p_reason` VARCHAR(255), IN `p_branch_manager_id` INT)   BEGIN
    DECLARE v_branch_id INT DEFAULT NULL;

    SELECT branch_id INTO v_branch_id FROM inspector_assignment
    WHERE inspector_id = p_inspector_id AND status = 'Active' LIMIT 1;

    UPDATE inspector SET status = 'inactive', termination_date = CURRENT_DATE, termination_reason = p_reason
    WHERE inspector_id = p_inspector_id;

    UPDATE inspector_assignment SET status = 'Inactive', end_date = CURRENT_DATE, remarks = CONCAT('Terminated: ', p_reason)
    WHERE inspector_id = p_inspector_id AND status = 'Active';

    INSERT INTO inspector_action_log (inspector_id, branch_id, branch_manager_id, action_type, action_date, remarks)
    VALUES (p_inspector_id, v_branch_id, p_branch_manager_id, 'Termination', NOW(),
            CONCAT('Inspector ID ', p_inspector_id, ' terminated. Reason: ', p_reason));

    SELECT CONCAT('Inspector ID ', p_inspector_id, ' has been terminated for reason: ', p_reason) AS message;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateApplicant` (IN `p_applicant_id` INT, IN `p_full_name` VARCHAR(255), IN `p_contact_number` VARCHAR(20), IN `p_address` TEXT, IN `p_birthdate` DATE, IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'), IN `p_educational_attainment` VARCHAR(100))   BEGIN
    UPDATE applicant
    SET 
        applicant_full_name = COALESCE(p_full_name, applicant_full_name),
        applicant_contact_number = COALESCE(p_contact_number, applicant_contact_number),
        applicant_address = COALESCE(p_address, applicant_address),
        applicant_birthdate = COALESCE(p_birthdate, applicant_birthdate),
        applicant_civil_status = COALESCE(p_civil_status, applicant_civil_status),
        applicant_educational_attainment = COALESCE(p_educational_attainment, applicant_educational_attainment),
        updated_at = NOW()
    WHERE applicant_id = p_applicant_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateApplicantComplete` (IN `p_applicant_id` INT, IN `p_full_name` VARCHAR(255), IN `p_contact_number` VARCHAR(20), IN `p_address` TEXT, IN `p_birthdate` DATE, IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'), IN `p_educational_attainment` VARCHAR(100), IN `p_nature_of_business` VARCHAR(255), IN `p_capitalization` DECIMAL(15,2), IN `p_source_of_capital` VARCHAR(255), IN `p_previous_business_experience` TEXT, IN `p_email_address` VARCHAR(255), IN `p_spouse_full_name` VARCHAR(255), IN `p_spouse_birthdate` DATE, IN `p_spouse_educational_attainment` VARCHAR(100), IN `p_spouse_contact_number` VARCHAR(20), IN `p_spouse_occupation` VARCHAR(100))   BEGIN
    
    UPDATE applicant
    SET 
        applicant_full_name = COALESCE(p_full_name, applicant_full_name),
        applicant_contact_number = COALESCE(p_contact_number, applicant_contact_number),
        applicant_address = COALESCE(p_address, applicant_address),
        applicant_birthdate = COALESCE(p_birthdate, applicant_birthdate),
        applicant_civil_status = COALESCE(p_civil_status, applicant_civil_status),
        applicant_educational_attainment = COALESCE(p_educational_attainment, applicant_educational_attainment),
        updated_at = NOW()
    WHERE applicant_id = p_applicant_id;
    
    
    INSERT INTO business_information (
        applicant_id, nature_of_business, capitalization,
        source_of_capital, previous_business_experience
    ) VALUES (
        p_applicant_id, p_nature_of_business, p_capitalization,
        p_source_of_capital, p_previous_business_experience
    ) ON DUPLICATE KEY UPDATE
        nature_of_business = VALUES(nature_of_business),
        capitalization = VALUES(capitalization),
        source_of_capital = VALUES(source_of_capital),
        previous_business_experience = VALUES(previous_business_experience);
    
    
    INSERT INTO other_information (
        applicant_id, email_address
    ) VALUES (
        p_applicant_id, p_email_address
    ) ON DUPLICATE KEY UPDATE
        email_address = VALUES(email_address);

    
    
    IF p_spouse_full_name IS NOT NULL THEN
        INSERT INTO spouse (
            applicant_id, spouse_full_name, spouse_birthdate,
            spouse_educational_attainment, spouse_contact_number, spouse_occupation
        ) VALUES (
            p_applicant_id, p_spouse_full_name, p_spouse_birthdate,
            p_spouse_educational_attainment, p_spouse_contact_number, p_spouse_occupation
        ) ON DUPLICATE KEY UPDATE
            spouse_full_name = VALUES(spouse_full_name),
            spouse_birthdate = VALUES(spouse_birthdate),
            spouse_educational_attainment = VALUES(spouse_educational_attainment),
            spouse_contact_number = VALUES(spouse_contact_number),
            spouse_occupation = VALUES(spouse_occupation);
    END IF;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateApplicationStatus` (IN `p_application_id` INT, IN `p_status` ENUM('Pending','Under Review','Approved','Rejected','Cancelled'))   BEGIN
    UPDATE application
    SET application_status = p_status, updated_at = NOW()
    WHERE application_id = p_application_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateBranch` (IN `p_branch_id` INT, IN `p_branch_name` VARCHAR(100), IN `p_area` VARCHAR(100), IN `p_location` VARCHAR(255), IN `p_address` TEXT, IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(100), IN `p_status` ENUM('Active','Inactive','Under Construction','Maintenance'))   BEGIN
    UPDATE branch
    SET 
        branch_name = COALESCE(p_branch_name, branch_name),
        area = COALESCE(p_area, area),
        location = COALESCE(p_location, location),
        address = COALESCE(p_address, address),
        contact_number = COALESCE(p_contact_number, contact_number),
        email = COALESCE(p_email, email),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE branch_id = p_branch_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateBusinessEmployee` (IN `p_employee_id` INT, IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(255), IN `p_phone_number` VARCHAR(20), IN `p_permissions` JSON, IN `p_status` VARCHAR(20))   BEGIN
    UPDATE `business_employee` 
    SET 
        `first_name` = COALESCE(p_first_name, `first_name`),
        `last_name` = COALESCE(p_last_name, `last_name`),
        `email` = COALESCE(p_email, `email`),
        `phone_number` = COALESCE(p_phone_number, `phone_number`),
        `permissions` = COALESCE(p_permissions, `permissions`),
        `status` = COALESCE(p_status, `status`),
        `updated_at` = NOW()
    WHERE `business_employee_id` = p_employee_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateBusinessManager` (IN `p_manager_id` INT, IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_email` VARCHAR(100), IN `p_contact_number` VARCHAR(20), IN `p_status` ENUM('Active','Inactive'))   BEGIN
    UPDATE `business_manager`
    SET 
        `first_name` = COALESCE(p_first_name, `first_name`),
        `last_name` = COALESCE(p_last_name, `last_name`),
        `email` = COALESCE(p_email, `email`),
        `contact_number` = COALESCE(p_contact_number, `contact_number`),
        `status` = COALESCE(p_status, `status`),
        `updated_at` = NOW()
    WHERE `business_manager_id` = p_manager_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateCollectorLogin` (IN `p_collector_id` INT)   BEGIN
    UPDATE collector 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE collector_id = p_collector_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateComplaint` (IN `p_complaint_id` INT, IN `p_complaint_type` VARCHAR(100), IN `p_subject` VARCHAR(255), IN `p_description` TEXT, IN `p_priority` VARCHAR(20), IN `p_status` VARCHAR(20))   BEGIN
  UPDATE complaint
  SET
    complaint_type = COALESCE(p_complaint_type, complaint_type),
    subject = COALESCE(p_subject, subject),
    description = COALESCE(p_description, description),
    priority = COALESCE(p_priority, priority),
    status = COALESCE(p_status, status)
  WHERE complaint_id = p_complaint_id;
  
  SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateComplianceRecord` (IN `p_report_id` INT, IN `p_status` VARCHAR(20), IN `p_remarks` TEXT, IN `p_resolved_by` INT)   BEGIN
  DECLARE v_resolved_date DATETIME;
  
  -- If status is complete, set resolved date
  IF p_status = 'complete' THEN
    SET v_resolved_date = NOW();
  ELSE
    SET v_resolved_date = NULL;
  END IF;
  
  UPDATE `violation_report` 
  SET 
    status = p_status,
    remarks = COALESCE(p_remarks, remarks),
    resolved_date = v_resolved_date,
    resolved_by = p_resolved_by
  WHERE report_id = p_report_id;
  
  -- If resolved, check if stallholder should be marked compliant
  IF p_status = 'complete' THEN
    -- Get stallholder_id from the report
    SELECT stallholder_id INTO @sh_id FROM violation_report WHERE report_id = p_report_id;
    
    -- Check if stallholder has any pending violations
    IF NOT EXISTS (
      SELECT 1 FROM violation_report 
      WHERE stallholder_id = @sh_id 
      AND status IN ('pending', 'in-progress')
    ) THEN
      UPDATE `stallholder` 
      SET compliance_status = 'Compliant'
      WHERE stallholder_id = @sh_id;
    END IF;
  END IF;
  
  SELECT ROW_COUNT() AS affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateCredentialLastLogin` (IN `p_applicant_id` INT)   BEGIN
    UPDATE credential 
    SET last_login = NOW()
    WHERE applicant_id = p_applicant_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateMobileApplication` (IN `p_application_id` INT, IN `p_applicant_id` INT, IN `p_business_name` VARCHAR(255), IN `p_business_type` VARCHAR(100), IN `p_preferred_area` VARCHAR(255), IN `p_document_urls` TEXT)   BEGIN
    UPDATE applications 
    SET business_name = p_business_name, 
        business_type = p_business_type, 
        preferred_area = p_preferred_area, 
        document_urls = p_document_urls, 
        updated_at = NOW() 
    WHERE application_id = p_application_id 
      AND applicant_id = p_applicant_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateStall` (IN `p_stall_id` INT, IN `p_stall_no` VARCHAR(20), IN `p_stall_location` VARCHAR(100), IN `p_size` VARCHAR(50), IN `p_rental_price` DECIMAL(10,2), IN `p_status` ENUM('Active','Inactive','Maintenance','Occupied'), IN `p_description` TEXT)   BEGIN
    UPDATE stall
    SET 
        stall_no = COALESCE(p_stall_no, stall_no),
        stall_location = COALESCE(p_stall_location, stall_location),
        size = COALESCE(p_size, size),
        rental_price = COALESCE(p_rental_price, rental_price),
        status = COALESCE(p_status, status),
        description = COALESCE(p_description, description),
        updated_at = NOW()
    WHERE stall_id = p_stall_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateStallBusinessOwner` (IN `p_business_owner_id` INT, IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(100), IN `p_status` ENUM('Active','Inactive'))   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    UPDATE `stall_business_owner`
    SET 
        `first_name` = COALESCE(p_first_name, `first_name`),
        `last_name` = COALESCE(p_last_name, `last_name`),
        `contact_number` = COALESCE(p_contact_number, `contact_number`),
        `email` = COALESCE(p_email, `email`),
        `status` = COALESCE(p_status, `status`),
        `updated_at` = NOW()
    WHERE `business_owner_id` = p_business_owner_id;
    
    COMMIT;
    
    SELECT 1 as success, 
           'Business Owner updated successfully' AS message,
           ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateStallholder` (IN `p_stallholder_id` INT, IN `p_stallholder_name` VARCHAR(150), IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(255), IN `p_address` TEXT, IN `p_business_name` VARCHAR(255), IN `p_business_type` VARCHAR(100), IN `p_stall_id` INT, IN `p_contract_start_date` DATE, IN `p_contract_end_date` DATE, IN `p_contract_status` ENUM('Active','Expired','Terminated'), IN `p_lease_amount` DECIMAL(10,2), IN `p_monthly_rent` DECIMAL(10,2), IN `p_payment_status` ENUM('current','overdue','grace_period'), IN `p_notes` TEXT)   BEGIN
    DECLARE old_stall_id INT DEFAULT NULL;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    
    SELECT stall_id INTO old_stall_id FROM stallholder WHERE stallholder_id = p_stallholder_id;
    
    
    UPDATE stallholder SET
        stallholder_name = COALESCE(p_stallholder_name, stallholder_name),
        contact_number = COALESCE(p_contact_number, contact_number),
        email = COALESCE(p_email, email),
        address = COALESCE(p_address, address),
        business_name = COALESCE(p_business_name, business_name),
        business_type = COALESCE(p_business_type, business_type),
        stall_id = p_stall_id,
        contract_start_date = COALESCE(p_contract_start_date, contract_start_date),
        contract_end_date = COALESCE(p_contract_end_date, contract_end_date),
        contract_status = COALESCE(p_contract_status, contract_status),
        lease_amount = COALESCE(p_lease_amount, lease_amount),
        monthly_rent = COALESCE(p_monthly_rent, monthly_rent),
        payment_status = COALESCE(p_payment_status, payment_status),
        notes = COALESCE(p_notes, notes),
        updated_at = CURRENT_TIMESTAMP
    WHERE stallholder_id = p_stallholder_id;
    
    
    IF old_stall_id IS NOT NULL AND old_stall_id != p_stall_id THEN
        UPDATE stall 
        SET status = 'Active', is_available = 1 
        WHERE stall_id = old_stall_id;
    END IF;
    
    
    IF p_stall_id IS NOT NULL AND p_stall_id != old_stall_id THEN
        UPDATE stall 
        SET status = 'Occupied', is_available = 0 
        WHERE stall_id = p_stall_id;
    END IF;
    
    COMMIT;
    
    SELECT 1 as success, 'Stallholder updated successfully' AS message, ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateSystemAdministrator` (IN `p_system_admin_id` INT, IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(100), IN `p_status` ENUM('Active','Inactive'))   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    UPDATE `system_administrator`
    SET 
        `first_name` = COALESCE(p_first_name, `first_name`),
        `last_name` = COALESCE(p_last_name, `last_name`),
        `contact_number` = COALESCE(p_contact_number, `contact_number`),
        `email` = COALESCE(p_email, `email`),
        `status` = COALESCE(p_status, `status`),
        `updated_at` = NOW()
    WHERE `system_admin_id` = p_system_admin_id;
    
    COMMIT;
    
    SELECT 1 as success, 
           'System Administrator updated successfully' AS message,
           ROW_COUNT() as affected_rows;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `uploadApplicantDocument` (IN `p_applicant_id` INT, IN `p_business_owner_id` INT, IN `p_branch_id` INT, IN `p_document_type_id` INT, IN `p_file_path` VARCHAR(500), IN `p_original_filename` VARCHAR(255), IN `p_file_size` BIGINT, IN `p_mime_type` VARCHAR(100), IN `p_expiry_date` DATE, IN `p_notes` TEXT)   BEGIN
    DECLARE v_document_id INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 as success, 'Error uploading document' as message;
    END;
    
    START TRANSACTION;
    
    -- Check if document already exists
    SELECT document_id INTO v_document_id
    FROM applicant_documents
    WHERE applicant_id = p_applicant_id
        AND business_owner_id = p_business_owner_id
        AND document_type_id = p_document_type_id;
    
    IF v_document_id IS NOT NULL THEN
        -- Update existing document
        UPDATE applicant_documents
        SET file_path = p_file_path,
            original_filename = p_original_filename,
            file_size = p_file_size,
            mime_type = p_mime_type,
            upload_date = NOW(),
            verification_status = 'pending',
            verified_by = NULL,
            verified_at = NULL,
            rejection_reason = NULL,
            expiry_date = p_expiry_date,
            notes = p_notes,
            updated_at = NOW()
        WHERE document_id = v_document_id;
        
        SELECT 1 as success, 'Document updated successfully' as message, v_document_id as document_id;
    ELSE
        -- Insert new document
        INSERT INTO applicant_documents (
            applicant_id, business_owner_id, branch_id, document_type_id,
            file_path, original_filename, file_size, mime_type,
            expiry_date, notes, verification_status
        ) VALUES (
            p_applicant_id, p_business_owner_id, p_branch_id, p_document_type_id,
            p_file_path, p_original_filename, p_file_size, p_mime_type,
            p_expiry_date, p_notes, 'pending'
        );
        
        SET v_document_id = LAST_INSERT_ID();
        
        SELECT 1 as success, 'Document uploaded successfully' as message, v_document_id as document_id;
    END IF;
    
    COMMIT;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `active_auctions_view`
-- (See below for the actual view)
--
CREATE TABLE `active_auctions_view` (
`auction_id` int(11)
,`stall_id` int(11)
,`stall_no` varchar(20)
,`stall_location` varchar(100)
,`starting_price` decimal(10,2)
,`current_highest_bid` decimal(10,2)
,`total_bids` int(11)
,`branch_name` varchar(100)
,`floor_name` varchar(50)
,`section_name` varchar(100)
,`start_time` datetime
,`end_time` datetime
,`application_deadline` datetime
,`auction_status` enum('Waiting for Bidders','Active','Ended','Cancelled')
,`seconds_remaining` bigint(21)
,`time_remaining_formatted` varchar(70)
,`highest_bidder_name` varchar(255)
,`manager_first_name` varchar(50)
,`manager_last_name` varchar(50)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `active_raffles_view`
-- (See below for the actual view)
--
CREATE TABLE `active_raffles_view` (
`raffle_id` int(11)
,`stall_id` int(11)
,`stall_no` varchar(20)
,`stall_location` varchar(100)
,`rental_price` decimal(10,2)
,`branch_name` varchar(100)
,`floor_name` varchar(50)
,`section_name` varchar(100)
,`start_time` datetime
,`end_time` datetime
,`application_deadline` datetime
,`total_participants` int(11)
,`raffle_status` enum('Waiting for Participants','Active','Ended','Cancelled')
,`seconds_remaining` bigint(21)
,`time_remaining_formatted` varchar(70)
,`manager_first_name` varchar(50)
,`manager_last_name` varchar(50)
);

-- --------------------------------------------------------

--
-- Table structure for table `applicant`
--

CREATE TABLE `applicant` (
  `applicant_id` int(11) NOT NULL,
  `applicant_full_name` varchar(255) NOT NULL,
  `applicant_contact_number` varchar(20) DEFAULT NULL,
  `applicant_address` text DEFAULT NULL,
  `applicant_birthdate` date DEFAULT NULL,
  `applicant_civil_status` enum('Single','Married','Divorced','Widowed') DEFAULT NULL,
  `applicant_educational_attainment` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `applicant_username` varchar(50) DEFAULT NULL COMMENT 'Mobile login username',
  `applicant_email` varchar(100) DEFAULT NULL COMMENT 'Mobile login email',
  `applicant_password_hash` varchar(255) DEFAULT NULL COMMENT 'Hashed password for mobile login',
  `email_verified` tinyint(1) DEFAULT 0 COMMENT 'Email verification status',
  `last_login` timestamp NULL DEFAULT NULL COMMENT 'Last login timestamp',
  `login_attempts` int(11) DEFAULT 0 COMMENT 'Failed login attempts counter',
  `account_locked_until` timestamp NULL DEFAULT NULL COMMENT 'Account lock expiration time'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `applicant`
--

INSERT INTO `applicant` (`applicant_id`, `applicant_full_name`, `applicant_contact_number`, `applicant_address`, `applicant_birthdate`, `applicant_civil_status`, `applicant_educational_attainment`, `created_at`, `updated_at`, `applicant_username`, `applicant_email`, `applicant_password_hash`, `email_verified`, `last_login`, `login_attempts`, `account_locked_until`) VALUES
(1, 'Jeno Aldrei A. Laurente', '09473430196', 'Zone 5, House Number 141', '2005-01-24', 'Married', 'College Graduate', '2025-12-08 09:23:07', '2025-12-08 09:23:07', NULL, NULL, NULL, 0, NULL, 0, NULL);

--
-- Triggers `applicant`
--
DELIMITER $$
CREATE TRIGGER `trg_applicant_reset_auto` AFTER DELETE ON `applicant` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('applicant', 'applicant_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `applicant_documents`
--

CREATE TABLE `applicant_documents` (
  `document_id` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `business_owner_id` int(11) NOT NULL COMMENT 'Which business owner this document is for',
  `branch_id` int(11) DEFAULT NULL COMMENT 'Specific branch if applicable',
  `document_type_id` int(11) NOT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `upload_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `verification_status` enum('pending','verified','rejected','expired') DEFAULT 'pending',
  `verified_by` int(11) DEFAULT NULL COMMENT 'Manager or employee who verified',
  `verified_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `expiry_date` date DEFAULT NULL COMMENT 'For documents that expire',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Documents uploaded by applicants for different business owners';

--
-- Triggers `applicant_documents`
--
DELIMITER $$
CREATE TRIGGER `trg_applicant_documents_reset_auto` AFTER DELETE ON `applicant_documents` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('applicant_documents', 'document_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `application`
--

CREATE TABLE `application` (
  `application_id` int(11) NOT NULL,
  `stall_id` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `application_date` date NOT NULL,
  `application_status` enum('Pending','Under Review','Approved','Rejected','Cancelled') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `application`
--

INSERT INTO `application` (`application_id`, `stall_id`, `applicant_id`, `application_date`, `application_status`, `created_at`, `updated_at`) VALUES
(0, 13, 1, '2025-12-08', 'Approved', '2025-12-08 09:23:07', '2025-12-08 09:37:44');

--
-- Triggers `application`
--
DELIMITER $$
CREATE TRIGGER `trg_application_reset_auto` AFTER DELETE ON `application` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('application', 'application_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `auction`
--

CREATE TABLE `auction` (
  `auction_id` int(11) NOT NULL,
  `stall_id` int(11) NOT NULL,
  `starting_price` decimal(10,2) NOT NULL,
  `current_highest_bid` decimal(10,2) DEFAULT NULL,
  `highest_bidder_id` int(11) DEFAULT NULL,
  `application_deadline` datetime DEFAULT NULL,
  `first_bid_time` datetime DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `auction_status` enum('Waiting for Bidders','Active','Ended','Cancelled') DEFAULT 'Waiting for Bidders',
  `total_bids` int(11) DEFAULT 0,
  `winner_confirmed` tinyint(1) DEFAULT 0,
  `winner_applicant_id` int(11) DEFAULT NULL,
  `winning_bid_amount` decimal(10,2) DEFAULT NULL,
  `winner_selection_date` datetime DEFAULT NULL,
  `created_by_business_manager` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `auction`
--
DELIMITER $$
CREATE TRIGGER `trg_auction_reset_auto` AFTER DELETE ON `auction` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('auction', 'auction_id');
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_expired_auctions` AFTER UPDATE ON `auction` FOR EACH ROW BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.end_time <= NOW() AND NEW.auction_status = 'Active' THEN
        UPDATE auction SET auction_status = 'Ended' WHERE auction_id = NEW.auction_id;
        UPDATE stall SET raffle_auction_status = 'Ended' WHERE stall_id = NEW.stall_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `auction_bids`
--

CREATE TABLE `auction_bids` (
  `bid_id` int(11) NOT NULL,
  `auction_id` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `bid_amount` decimal(10,2) NOT NULL,
  `bid_time` datetime NOT NULL DEFAULT current_timestamp(),
  `is_winning_bid` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `auction_bids`
--
DELIMITER $$
CREATE TRIGGER `handle_auction_bid` AFTER INSERT ON `auction_bids` FOR EACH ROW BEGIN
    UPDATE auction_bids SET is_winning_bid = 0 WHERE auction_id = NEW.auction_id AND bid_id != NEW.bid_id;
    UPDATE auction_bids SET is_winning_bid = 1 WHERE bid_id = NEW.bid_id;
    UPDATE auction SET current_highest_bid = NEW.bid_amount, highest_bidder_id = NEW.applicant_id, total_bids = total_bids + 1
    WHERE auction_id = NEW.auction_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_auction_bids_reset_auto` AFTER DELETE ON `auction_bids` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('auction_bids', 'bid_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `auction_result`
--

CREATE TABLE `auction_result` (
  `result_id` int(11) NOT NULL,
  `auction_id` int(11) NOT NULL,
  `winner_applicant_id` int(11) NOT NULL,
  `winner_application_id` int(11) NOT NULL,
  `winning_bid_amount` decimal(10,2) NOT NULL,
  `result_date` datetime NOT NULL DEFAULT current_timestamp(),
  `total_bids` int(11) NOT NULL,
  `total_bidders` int(11) NOT NULL,
  `awarded_by_business_manager` int(11) NOT NULL,
  `result_status` enum('Pending','Confirmed','Cancelled') DEFAULT 'Pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `auction_result`
--
DELIMITER $$
CREATE TRIGGER `trg_auction_result_reset_auto` AFTER DELETE ON `auction_result` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('auction_result', 'result_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `branch`
--

CREATE TABLE `branch` (
  `branch_id` int(11) NOT NULL,
  `business_owner_id` int(11) NOT NULL,
  `branch_name` varchar(100) NOT NULL,
  `area` varchar(100) NOT NULL,
  `location` varchar(255) NOT NULL,
  `address` text DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive','Under Construction','Maintenance') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branch`
--

INSERT INTO `branch` (`branch_id`, `business_owner_id`, `branch_name`, `area`, `location`, `address`, `contact_number`, `email`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Naga City Peoples Mall', 'Naga City', 'Peoples Mall', 'Peoples Mall Complex, Naga City, Camarines Sur', '+63917123456', 'ncpm@nagastall.com', 'Active', '2025-09-15 08:00:00', '2025-11-26 16:38:54'),
(2, 1, 'Satellite Market 1 & 2', 'Naga City', 'Satellite Market', 'Satellite Market Complex, Naga City, Camarines Sur', '+63919345678', 'satellite@nagastall.com', 'Active', '2025-09-15 08:00:00', '2025-11-26 16:38:59'),
(3, 1, 'Test_branch', 'Test_area', 'Test_location', 'Test_address', '09876543212', 'Test@gmail.com', 'Active', '2025-11-05 15:50:12', '2025-11-26 16:39:02');

--
-- Triggers `branch`
--
DELIMITER $$
CREATE TRIGGER `trg_branch_reset_auto` AFTER DELETE ON `branch` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('branch', 'branch_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `branch_document_requirements`
--

CREATE TABLE `branch_document_requirements` (
  `requirement_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `document_type_id` int(11) NOT NULL,
  `is_required` tinyint(1) DEFAULT 1,
  `instructions` text DEFAULT NULL,
  `created_by_business_manager` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branch_document_requirements`
--

INSERT INTO `branch_document_requirements` (`requirement_id`, `branch_id`, `document_type_id`, `is_required`, `instructions`, `created_by_business_manager`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 'Valid business permit from Naga City LGU', 1, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(2, 1, 2, 1, 'Current sanitary permit from City Health Office', 1, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(3, 1, 3, 1, 'Fire safety inspection certificate', 1, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(4, 1, 5, 1, 'Community Tax Certificate (Cedula)', 1, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(5, 1, 6, 1, 'Valid government-issued ID (both sides)', 1, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(6, 1, 7, 1, 'Barangay clearance from place of residence', 1, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(7, 1, 11, 1, 'TIN ID or certificate', 1, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(8, 3, 1, 1, 'Business permit from Naga City', 3, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(9, 3, 2, 1, 'Sanitary permit', 3, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(10, 3, 3, 1, 'Fire safety certificate', 3, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(11, 3, 5, 1, 'Cedula', 3, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(12, 3, 6, 1, 'Valid ID', 3, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(13, 3, 7, 1, 'Barangay clearance', 3, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(14, 23, 1, 1, 'Business permit', 16, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(15, 23, 6, 1, 'Valid ID', 16, '2025-12-01 07:53:42', '2025-12-01 07:53:42'),
(16, 23, 5, 1, 'Cedula', 16, '2025-12-01 07:53:42', '2025-12-01 07:53:42');

--
-- Triggers `branch_document_requirements`
--
DELIMITER $$
CREATE TRIGGER `trg_branch_document_requirements_reset_auto` AFTER DELETE ON `branch_document_requirements` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('branch_document_requirements', 'requirement_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `branch_document_requirements_backup`
--

CREATE TABLE `branch_document_requirements_backup` (
  `requirement_id` int(11) NOT NULL DEFAULT 0,
  `branch_id` int(11) NOT NULL,
  `document_type_id` int(11) NOT NULL,
  `is_required` tinyint(1) DEFAULT 1,
  `instructions` text DEFAULT NULL,
  `created_by_business_manager` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `business_employee`
--

CREATE TABLE `business_employee` (
  `business_employee_id` int(11) NOT NULL,
  `employee_username` varchar(50) NOT NULL,
  `employee_password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `created_by_manager` int(11) DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Employee permissions object' CHECK (json_valid(`permissions`)),
  `status` enum('Active','Inactive','Suspended') DEFAULT 'Active',
  `last_login` timestamp NULL DEFAULT NULL,
  `password_reset_required` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `business_employee`
--

INSERT INTO `business_employee` (`business_employee_id`, `employee_username`, `employee_password_hash`, `first_name`, `last_name`, `email`, `phone_number`, `branch_id`, `created_by_manager`, `permissions`, `status`, `last_login`, `password_reset_required`, `created_at`, `updated_at`) VALUES
(1, 'EMP3672', '$2a$12$ys/pmarvhP5EFRctGdD4mOO3n.Kvmwqh1HYHaoBEl68EV092idhGq', 'Voun Irish', 'Dejumo', 'awfullumos@gmail.com', '09876543212', 3, 3, '[\"dashboard\",\"payments\",\"applicants\",\"stalls\"]', 'Active', NULL, 1, '2025-11-06 05:36:23', '2025-11-06 09:02:11'),
(2, 'EMP8043', '$2a$12$t42cPqUynSJcLxoiFO.5dO4IvS14FecCXT4wJTzo6rk8AdLGOZf92', 'Jeno Aldrei', 'Laurente', 'laurentejenoaldrei@gmail.com', '09876543212', 1, 1, '[\"dashboard\",\"payments\",\"applicants\"]', 'Active', NULL, 1, '2025-12-03 04:03:26', '2025-12-08 21:35:05');

--
-- Triggers `business_employee`
--
DELIMITER $$
CREATE TRIGGER `trg_business_employee_reset_auto` AFTER DELETE ON `business_employee` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('business_employee', 'business_employee_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `business_information`
--

CREATE TABLE `business_information` (
  `business_id` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `nature_of_business` varchar(255) DEFAULT NULL,
  `capitalization` decimal(15,2) DEFAULT NULL,
  `source_of_capital` varchar(255) DEFAULT NULL,
  `previous_business_experience` text DEFAULT NULL,
  `relative_stall_owner` enum('Yes','No') DEFAULT 'No',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `business_information`
--

INSERT INTO `business_information` (`business_id`, `applicant_id`, `nature_of_business`, `capitalization`, `source_of_capital`, `previous_business_experience`, `relative_stall_owner`, `created_at`, `updated_at`) VALUES
(1, 1, 'Flowers and Plants', 52000.00, 'Personal Savings', 'None', '', '2025-12-08 09:23:07', '2025-12-08 09:23:07');

--
-- Triggers `business_information`
--
DELIMITER $$
CREATE TRIGGER `trg_business_information_reset_auto` AFTER DELETE ON `business_information` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('business_information', 'business_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `business_manager`
--

CREATE TABLE `business_manager` (
  `business_manager_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `manager_username` varchar(50) NOT NULL,
  `manager_password_hash` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_by_owner` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `business_manager`
--

INSERT INTO `business_manager` (`business_manager_id`, `branch_id`, `manager_username`, `manager_password_hash`, `first_name`, `last_name`, `email`, `contact_number`, `status`, `created_by_owner`, `created_at`, `updated_at`) VALUES
(1, 1, 'NCPM_Manager', '$2b$12$EjLG6ZsjvQAvFikVgAYVoew3gIuR7f.23j2eu92/IN9pnjJ7iMbVG', 'Juan', 'Dela Cruz', 'NCPM@gmail.com', '+63917111111', 'Active', 1, '2025-09-06 13:00:00', '2025-11-07 08:08:28'),
(2, 2, 'Satellite_Manager', '$2b$12$BBqcS.8r8jLyEGBcXssooe7RkFayxY9N82MJQRgrFv2ATAAcTkwwG', 'Zed', 'Shadows', 'zed.shadows@example.com', '+63919333333', 'Active', 1, '2025-09-08 13:49:24', '2025-09-08 13:49:24'),
(3, 3, 'Test_Manager', '$2b$10$khUzmmbIEaa/gUdYMQTSiugujaK3D.3rGcdxtqR91loKMpejjVq4a', 'Jonas', 'Laurente', NULL, NULL, 'Active', 1, '2025-11-05 15:50:30', '2025-11-05 15:50:30');

--
-- Triggers `business_manager`
--
DELIMITER $$
CREATE TRIGGER `trg_business_manager_reset_auto` AFTER DELETE ON `business_manager` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('business_manager', 'business_manager_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `business_owner_managers`
--

CREATE TABLE `business_owner_managers` (
  `relationship_id` int(11) NOT NULL,
  `business_owner_id` int(11) NOT NULL,
  `business_manager_id` int(11) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0 COMMENT 'Primary manager for this owner',
  `access_level` enum('Full','ViewOnly','Limited') DEFAULT 'Full',
  `assigned_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `assigned_by_system_admin` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Many-to-many relationship between Business Owners and Managers';

--
-- Dumping data for table `business_owner_managers`
--

INSERT INTO `business_owner_managers` (`relationship_id`, `business_owner_id`, `business_manager_id`, `is_primary`, `access_level`, `assigned_date`, `assigned_by_system_admin`, `notes`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 'Full', '2025-12-06 12:21:35', 1, 'Primary manager', 'Active', '2025-12-06 12:21:35', '2025-12-06 12:21:35'),
(2, 1, 2, 0, 'Full', '2025-12-06 12:21:35', 1, 'Additional manager', 'Active', '2025-12-06 12:21:35', '2025-12-06 12:21:35'),
(3, 1, 3, 0, 'Full', '2025-12-06 12:21:35', 1, 'Additional manager', 'Active', '2025-12-06 12:21:35', '2025-12-06 12:21:35');

--
-- Triggers `business_owner_managers`
--
DELIMITER $$
CREATE TRIGGER `trg_business_owner_managers_reset_auto` AFTER DELETE ON `business_owner_managers` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('business_owner_managers', 'relationship_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `business_owner_subscriptions`
--

CREATE TABLE `business_owner_subscriptions` (
  `subscription_id` int(11) NOT NULL,
  `business_owner_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `subscription_status` enum('Active','Expired','Suspended','Pending') DEFAULT 'Pending',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `auto_renew` tinyint(1) DEFAULT 1,
  `created_by_system_admin` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `business_owner_subscriptions`
--

INSERT INTO `business_owner_subscriptions` (`subscription_id`, `business_owner_id`, `plan_id`, `subscription_status`, `start_date`, `end_date`, `auto_renew`, `created_by_system_admin`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 'Active', '2025-12-06', '2026-01-06', 1, 1, '2025-12-06 12:21:35', '2025-12-06 12:36:58');

--
-- Triggers `business_owner_subscriptions`
--
DELIMITER $$
CREATE TRIGGER `trg_business_owner_subscriptions_reset_auto` AFTER DELETE ON `business_owner_subscriptions` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('business_owner_subscriptions', 'subscription_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `collector`
--

CREATE TABLE `collector` (
  `collector_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `contact_no` varchar(20) DEFAULT NULL,
  `date_created` datetime DEFAULT current_timestamp(),
  `date_hired` date DEFAULT curdate(),
  `status` enum('active','inactive') DEFAULT 'active',
  `termination_date` date DEFAULT NULL,
  `termination_reason` varchar(255) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `collector`
--

INSERT INTO `collector` (`collector_id`, `username`, `password_hash`, `first_name`, `last_name`, `middle_name`, `email`, `contact_no`, `date_created`, `date_hired`, `status`, `termination_date`, `termination_reason`, `last_login`) VALUES
(1, 'COL6806', '$2a$12$daseDK99xoM1.O4XOVbMzeSXdYKYJ5JAQ9O0fR6TN852oUZooDOqS', 'Jeno Aldrei', 'Laurente', NULL, 'laurentejeno73@gmail.com', '09473430196', '2025-12-09 16:29:10', '2025-12-09', 'active', NULL, NULL, '2025-12-09 08:51:23');

-- --------------------------------------------------------

--
-- Table structure for table `collector_action_log`
--

CREATE TABLE `collector_action_log` (
  `action_id` int(11) NOT NULL,
  `collector_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `business_manager_id` int(11) DEFAULT NULL,
  `action_type` enum('New Hire','Termination','Rehire','Transfer') NOT NULL,
  `action_date` datetime DEFAULT current_timestamp(),
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `collector_action_log`
--

INSERT INTO `collector_action_log` (`action_id`, `collector_id`, `branch_id`, `business_manager_id`, `action_type`, `action_date`, `remarks`) VALUES
(1, 1, 1, 1, 'New Hire', '2025-12-09 16:29:10', 'Collector Jeno Aldrei Laurente was hired');

-- --------------------------------------------------------

--
-- Table structure for table `collector_assignment`
--

CREATE TABLE `collector_assignment` (
  `assignment_id` int(11) NOT NULL,
  `collector_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `start_date` date DEFAULT curdate(),
  `end_date` date DEFAULT NULL,
  `status` enum('Active','Inactive','Transferred') DEFAULT 'Active',
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `collector_assignment`
--

INSERT INTO `collector_assignment` (`assignment_id`, `collector_id`, `branch_id`, `start_date`, `end_date`, `status`, `remarks`) VALUES
(1, 1, 1, '2025-12-09', NULL, 'Active', 'Newly hired collector');

-- --------------------------------------------------------

--
-- Table structure for table `complaint`
--

CREATE TABLE `complaint` (
  `complaint_id` int(11) NOT NULL,
  `complaint_type` varchar(100) NOT NULL COMMENT 'Type of complaint: Sanitary Issue, Illegal Vending, Faulty Equipment, etc.',
  `sender_id` int(11) DEFAULT NULL COMMENT 'User who submitted the complaint (can be stallholder, inspector, or public)',
  `sender_name` varchar(255) NOT NULL COMMENT 'Name of the person submitting complaint',
  `sender_contact` varchar(50) DEFAULT NULL COMMENT 'Contact number of sender',
  `sender_email` varchar(255) DEFAULT NULL COMMENT 'Email of sender',
  `stallholder_id` int(11) DEFAULT NULL COMMENT 'Stallholder being complained about (if applicable)',
  `stall_id` int(11) DEFAULT NULL COMMENT 'Stall related to complaint (if applicable)',
  `branch_id` int(11) NOT NULL COMMENT 'Branch where complaint occurred',
  `subject` varchar(255) NOT NULL COMMENT 'Brief subject/title of complaint',
  `description` text NOT NULL COMMENT 'Detailed description of the complaint',
  `evidence` text DEFAULT NULL COMMENT 'Evidence/attachments (file paths or URLs)',
  `status` enum('pending','in-progress','resolved','rejected') DEFAULT 'pending' COMMENT 'Current status of complaint',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium' COMMENT 'Priority level',
  `resolution_notes` text DEFAULT NULL COMMENT 'Notes about resolution or action taken',
  `date_submitted` datetime DEFAULT current_timestamp() COMMENT 'When complaint was submitted',
  `date_resolved` datetime DEFAULT NULL COMMENT 'When complaint was resolved',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `complaint`
--

INSERT INTO `complaint` (`complaint_id`, `complaint_type`, `sender_id`, `sender_name`, `sender_contact`, `sender_email`, `stallholder_id`, `stall_id`, `branch_id`, `subject`, `description`, `evidence`, `status`, `priority`, `resolution_notes`, `date_submitted`, `date_resolved`, `created_at`, `updated_at`) VALUES
(1, 'Sanitary Issue', NULL, 'Jonathan Reyna', '09171234567', 'jonathan.reyna@email.com', 1, 13, 1, 'Unclean stall area', 'The stall has not been properly cleaned and there are food scraps on the floor.', NULL, 'pending', 'high', NULL, '2024-01-15 08:30:00', NULL, '2025-12-03 22:21:51', '2025-12-03 22:21:51');

--
-- Triggers `complaint`
--
DELIMITER $$
CREATE TRIGGER `trg_complaint_reset_auto` AFTER DELETE ON `complaint` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('complaint', 'complaint_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `credential`
--

CREATE TABLE `credential` (
  `registrationid` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `user_name` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credential`
--

INSERT INTO `credential` (`registrationid`, `applicant_id`, `user_name`, `password_hash`, `created_date`, `last_login`, `is_active`) VALUES
(1, 1, '25-40329', '$2b$10$VqHIVe66uWoX42twl9Faj.nq86nq3P8TXAGMYBWAs/TgFhBjQMm26', '2025-12-08 09:37:44', '2025-12-09 01:40:37', 1);

--
-- Triggers `credential`
--
DELIMITER $$
CREATE TRIGGER `trg_credential_reset_auto` AFTER DELETE ON `credential` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('credential', 'registrationid');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `document_types`
--

CREATE TABLE `document_types` (
  `document_type_id` int(11) NOT NULL,
  `document_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system_default` tinyint(1) DEFAULT 0 COMMENT 'System-wide document types that cannot be deleted',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_types`
--

INSERT INTO `document_types` (`document_type_id`, `document_name`, `description`, `is_system_default`, `created_at`, `updated_at`) VALUES
(1, 'Business Permit', 'Valid business permit from local government unit', 1, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(2, 'Sanitary Permit', 'Health department sanitary permit for food-related businesses', 1, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(3, 'Fire Safety Certificate', 'Fire department safety certificate', 1, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(4, 'Cedula', 'Community tax certificate (Cedula)', 1, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(5, 'Valid ID', 'Government-issued identification document', 1, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(6, 'Barangay Clearance', 'Certificate of good moral character from barangay', 1, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(7, 'Police Clearance', 'National police clearance certificate', 1, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(8, 'Tax Identification Number (TIN)', 'Bureau of Internal Revenue TIN certificate', 1, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(9, 'SSS/PhilHealth/Pag-IBIG', 'Social security and health insurance documents', 0, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(10, 'Health Certificate', 'Medical certificate from DOH-accredited physician', 0, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(11, 'Food Handler Certificate', 'Certificate for food handling (for food vendors)', 0, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(12, 'Contract/Lease Agreement', 'Signed lease or rental agreement', 0, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(13, 'Proof of Residence', 'Utility bill or other proof of current address', 0, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(14, 'Bank Certificate', 'Certificate of bank deposit or financial capacity', 0, '2025-11-12 03:16:19', '2025-11-12 03:16:19'),
(15, 'Product Registration', 'DTI or FDA registration for specific products', 0, '2025-11-12 03:16:19', '2025-11-12 03:16:19');

--
-- Triggers `document_types`
--
DELIMITER $$
CREATE TRIGGER `trg_document_types_reset_auto` AFTER DELETE ON `document_types` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('document_types', 'document_type_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `employee_activity_log`
--

CREATE TABLE `employee_activity_log` (
  `log_id` int(11) NOT NULL,
  `business_employee_id` int(11) DEFAULT NULL,
  `action_type` varchar(100) NOT NULL COMMENT 'login, logout, create, update, delete, etc.',
  `action_description` text DEFAULT NULL,
  `performed_by_manager` int(11) DEFAULT NULL,
  `target_resource` varchar(100) DEFAULT NULL COMMENT 'What was affected',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `employee_activity_log`
--
DELIMITER $$
CREATE TRIGGER `trg_employee_activity_log_reset_auto` AFTER DELETE ON `employee_activity_log` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('employee_activity_log', 'log_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `employee_credential_log`
--

CREATE TABLE `employee_credential_log` (
  `log_id` int(11) NOT NULL,
  `business_employee_id` int(11) NOT NULL,
  `action_type` enum('created','password_reset','username_changed') NOT NULL,
  `old_username` varchar(20) DEFAULT NULL,
  `new_username` varchar(20) DEFAULT NULL,
  `generated_by_manager` int(11) DEFAULT NULL,
  `email_sent` tinyint(1) DEFAULT 0,
  `email_sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `employee_credential_log`
--
DELIMITER $$
CREATE TRIGGER `trg_employee_credential_log_reset_auto` AFTER DELETE ON `employee_credential_log` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('employee_credential_log', 'log_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `employee_email_template`
--

CREATE TABLE `employee_email_template` (
  `template_id` int(11) NOT NULL,
  `template_name` varchar(100) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `html_content` text NOT NULL,
  `text_content` text NOT NULL,
  `variables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Available template variables' CHECK (json_valid(`variables`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_email_template`
--

INSERT INTO `employee_email_template` (`template_id`, `template_name`, `subject`, `html_content`, `text_content`, `variables`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'welcome_employee', 'Welcome to Naga Stall Management - Your Account Details', '<!DOCTYPE html>\n<html>\n<head>\n    <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }\n        .credentials { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }\n        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }\n        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <div class=\"header\">\n            <h1>Welcome to Naga Stall Management</h1>\n            <p>Your employee account has been created</p>\n        </div>\n        <div class=\"content\">\n            <p>Hello {{firstName}} {{lastName}},</p>\n            <p>Your employee account has been successfully created in the Naga Stall Management System. Below are your login credentials:</p>\n            \n            <div class=\"credentials\">\n                <h3>Your Login Credentials</h3>\n                <p><strong>Username:</strong> {{username}}</p>\n                <p><strong>Password:</strong> {{password}}</p>\n                <p><strong>Login URL:</strong> <a href=\"{{loginUrl}}\">{{loginUrl}}</a></p>\n            </div>\n            \n            <p><strong>Important Security Notes:</strong></p>\n            <ul>\n                <li>Please change your password after your first login</li>\n                <li>Keep your credentials secure and do not share them</li>\n                <li>Contact your manager if you have any login issues</li>\n            </ul>\n            \n            <a href=\"{{loginUrl}}\" class=\"button\">Login to Your Account</a>\n            \n            <p>If you have any questions, please contact your branch manager or the system administrator.</p>\n        </div>\n        <div class=\"footer\">\n            <p>This is an automated message from Naga Stall Management System</p>\n            <p>Branch: {{branchName}} | Created by: {{createdBy}}</p>\n        </div>\n    </div>\n</body>\n</html>', 'Welcome to Naga Stall Management System\n\nHello {{firstName}} {{lastName}},\n\nYour employee account has been successfully created. Here are your login credentials:\n\nUsername: {{username}}\nPassword: {{password}}\nLogin URL: {{loginUrl}}\n\nIMPORTANT SECURITY NOTES:\n- Please change your password after your first login\n- Keep your credentials secure and do not share them\n- Contact your manager if you have any login issues\n\nIf you have any questions, please contact your branch manager or system administrator.\n\nBranch: {{branchName}}\nCreated by: {{createdBy}}\n\nThis is an automated message from Naga Stall Management System.', '[\"firstName\", \"lastName\", \"username\", \"password\", \"loginUrl\", \"branchName\", \"createdBy\"]', 1, '2025-10-23 01:13:29', '2025-10-23 01:13:29'),
(2, 'password_reset', 'Password Reset - Naga Stall Management', '<!DOCTYPE html>\n<html>\n<head>\n    <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }\n        .credentials { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff6b6b; }\n        .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }\n        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }\n    </style>\n</head>\n<body>\n    <div class=\"container\">\n        <div class=\"header\">\n            <h1>Password Reset</h1>\n            <p>Your password has been reset</p>\n        </div>\n        <div class=\"content\">\n            <p>Hello {{firstName}} {{lastName}},</p>\n            <p>Your password has been reset by your manager. Below are your new login credentials:</p>\n            \n            <div class=\"credentials\">\n                <h3>Your New Login Credentials</h3>\n                <p><strong>Username:</strong> {{username}}</p>\n                <p><strong>New Password:</strong> {{password}}</p>\n                <p><strong>Login URL:</strong> <a href=\"{{loginUrl}}\">{{loginUrl}}</a></p>\n            </div>\n            \n            <p><strong>What to do next:</strong></p>\n            <ul>\n                <li>Login with your new password immediately</li>\n                <li>Change your password to something secure</li>\n                <li>Contact your manager if you did not request this reset</li>\n            </ul>\n            \n            <a href=\"{{loginUrl}}\" class=\"button\">Login with New Password</a>\n            \n            <p>Reset performed by: {{resetBy}} on {{resetDate}}</p>\n        </div>\n        <div class=\"footer\">\n            <p>This is an automated message from Naga Stall Management System</p>\n            <p>If you did not request this reset, please contact your manager immediately.</p>\n        </div>\n    </div>\n</body>\n</html>', 'Password Reset - Naga Stall Management System\n\nHello {{firstName}} {{lastName}},\n\nYour password has been reset by your manager. Here are your new login credentials:\n\nUsername: {{username}}\nNew Password: {{password}}\nLogin URL: {{loginUrl}}\n\nWHAT TO DO NEXT:\n- Login with your new password immediately\n- Change your password to something secure\n- Contact your manager if you did not request this reset\n\nReset performed by: {{resetBy}} on {{resetDate}}\n\nIf you did not request this reset, please contact your manager immediately.\n\nThis is an automated message from Naga Stall Management System.', '[\"firstName\", \"lastName\", \"username\", \"password\", \"loginUrl\", \"resetBy\", \"resetDate\"]', 1, '2025-10-23 01:13:29', '2025-10-23 01:13:29');

--
-- Triggers `employee_email_template`
--
DELIMITER $$
CREATE TRIGGER `trg_employee_email_template_reset_auto` AFTER DELETE ON `employee_email_template` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('employee_email_template', 'template_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `employee_password_reset`
--

CREATE TABLE `employee_password_reset` (
  `reset_id` int(11) NOT NULL,
  `business_employee_id` int(11) NOT NULL,
  `reset_token` varchar(255) NOT NULL,
  `requested_by_manager` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `is_used` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `employee_password_reset`
--
DELIMITER $$
CREATE TRIGGER `trg_employee_password_reset_reset_auto` AFTER DELETE ON `employee_password_reset` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('employee_password_reset', 'reset_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `employee_session`
--

CREATE TABLE `employee_session` (
  `session_id` int(11) NOT NULL,
  `business_employee_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `login_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `logout_time` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `employee_session`
--
DELIMITER $$
CREATE TRIGGER `trg_employee_session_reset_auto` AFTER DELETE ON `employee_session` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('employee_session', 'session_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `floor`
--

CREATE TABLE `floor` (
  `floor_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `floor_name` varchar(50) NOT NULL,
  `floor_number` int(11) NOT NULL,
  `status` enum('Active','Inactive','Under Construction','Maintenance') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `floor`
--

INSERT INTO `floor` (`floor_id`, `branch_id`, `floor_name`, `floor_number`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, '1', 0, 'Active', '2025-12-06 14:00:43', '2025-12-06 14:00:53'),
(4, 1, '2', 0, 'Active', '2025-12-07 07:09:30', '2025-12-07 07:09:30'),
(5, 1, '3', 0, 'Active', '2025-12-08 15:35:59', '2025-12-08 15:35:59');

--
-- Triggers `floor`
--
DELIMITER $$
CREATE TRIGGER `trg_floor_reset_auto` AFTER DELETE ON `floor` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('floor', 'floor_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `inspector`
--

CREATE TABLE `inspector` (
  `inspector_id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `middle_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `date_created` datetime DEFAULT current_timestamp(),
  `status` enum('active','inactive') DEFAULT 'active',
  `date_hired` date DEFAULT curdate(),
  `contact_no` varchar(20) DEFAULT NULL,
  `termination_date` date DEFAULT NULL,
  `termination_reason` varchar(255) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inspector`
--

INSERT INTO `inspector` (`inspector_id`, `username`, `first_name`, `last_name`, `middle_name`, `email`, `password`, `password_hash`, `date_created`, `status`, `date_hired`, `contact_no`, `termination_date`, `termination_reason`) VALUES
(4, 'INS9721', 'Voun Irish', 'Dejumo', '', 'josonglaurente@gmail.com', '', '$2a$12$YspzW.gMf6YZGEp8LXL1VeJyhbSD60UyM/Mm4f/3Dm1p7ta6nBjxe', '2025-12-17 10:46:51', 'active', '2025-12-09', '09473595468', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `inspector_action_log`
--

CREATE TABLE `inspector_action_log` (
  `action_id` int(11) NOT NULL,
  `inspector_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `business_manager_id` int(11) DEFAULT NULL,
  `action_type` enum('New Hire','Termination','Rehire','Transfer') NOT NULL,
  `action_date` datetime DEFAULT current_timestamp(),
  `remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inspector_action_log`
--

INSERT INTO `inspector_action_log` (`action_id`, `inspector_id`, `branch_id`, `business_manager_id`, `action_type`, `action_date`, `remarks`) VALUES
(1, 1, 1, 1, 'New Hire', '2025-10-08 00:45:24', 'Inspector Ye Zhu was hired and assigned to branch ID 1'),
(2, 2, 1, 1, 'New Hire', '2025-10-08 00:53:54', 'Inspector Rafael Domingo was hired and assigned to branch ID 1'),
(3, 2, 1, 1, 'Termination', '2025-10-08 01:29:12', 'Inspector ID 3 terminated. Reason: Negligence of duty'),
(4, 1, 1, 1, 'Termination', '2025-10-08 09:35:13', 'Inspector ID 2 terminated. Reason: Negligence of duty'),
(5, 4, 1, 1, 'New Hire', '2025-12-09 15:55:05', 'Inspector Voun Irish Dejumo was hired and assigned to branch ID 1');

-- --------------------------------------------------------

--
-- Table structure for table `inspector_assignment`
--

CREATE TABLE `inspector_assignment` (
  `assignment_id` int(11) NOT NULL,
  `inspector_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `remarks` varchar(255) DEFAULT NULL,
  `date_assigned` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inspector_assignment`
--

INSERT INTO `inspector_assignment` (`assignment_id`, `inspector_id`, `branch_id`, `start_date`, `end_date`, `status`, `remarks`, `date_assigned`) VALUES
(1, 1, 1, '2025-10-08', NULL, 'Active', NULL, '2025-10-07 08:45:24'),
(2, 2, 1, '2025-10-08', '2025-10-08', 'Inactive', 'Terminated: Negligence of duty', '2025-10-07 08:53:54'),
(3, 4, 1, '2025-12-09', NULL, 'Active', 'Newly hired inspector', '2025-12-09 07:55:05');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `migration_id` int(11) NOT NULL,
  `migration_name` varchar(255) NOT NULL,
  `version` varchar(50) NOT NULL,
  `executed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`migration_id`, `migration_name`, `version`, `executed_at`) VALUES
(1, '006_employee_management_system', '1.0.0', '2025-10-23 01:22:50'),
(2, '005_stored_procedures', '1.0.0', '2025-10-23 01:23:04'),
(3, '007_fix_employee_username_length', '1.0.0', '2025-10-24 05:26:31'),
(9, '010_missing_stored_procedures', '1.0.0', '2025-11-05 13:46:53'),
(10, '011_additional_missing_procedures', '1.0.0', '2025-11-05 14:34:08'),
(11, '012_fix_getAllBranchesDetailed', '1.0.0', '2025-11-05 14:43:09'),
(12, '013_fix_branch_procedures', '1.0.2', '2025-11-05 15:07:23'),
(13, '014_fix_createApplicantComplete_parameters', '1.0.0', '2025-11-05 16:00:23'),
(14, '018_complete_mobile_login_fix', '1.0.0', '2025-11-07 05:26:49'),
(15, '019_fix_mobile_stored_procedures', '1.0.0', '2025-11-07 06:57:37'),
(16, '022_compliance_system_enhancement', '1.0.0', '2025-11-17 03:52:29'),
(18, '023_compliance_helper_procedures', '1.0.0', '2025-11-26 03:44:56'),
(19, '024_role_system_restructure', '1.0.0', '2025-11-26 12:34:08'),
(20, '025_system_administrator_procedures', '1.0.0', '2025-11-26 12:34:42'),
(21, '026_stall_business_owner_procedures', '1.0.0', '2025-11-26 12:34:49'),
(22, '027_update_all_stored_procedures', '1.0.0', '2025-11-26 12:34:58'),
(23, '029_business_owner_manager_connection', '1.0.0', '2025-11-26 15:59:00'),
(27, '030_mobile_applicant_documents_enhancement', '1.0.0', '2025-12-01 02:03:36');

-- --------------------------------------------------------

--
-- Table structure for table `other_information`
--

CREATE TABLE `other_information` (
  `other_info_id` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `signature_of_applicant` varchar(500) DEFAULT NULL,
  `house_sketch_location` varchar(500) DEFAULT NULL,
  `valid_id` varchar(500) DEFAULT NULL,
  `email_address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `other_information`
--

INSERT INTO `other_information` (`other_info_id`, `applicant_id`, `signature_of_applicant`, `house_sketch_location`, `valid_id`, `email_address`, `created_at`, `updated_at`) VALUES
(1, 1, '7c0f1f2e1303456088b15eb4c90a45a5.webp', '10-Best-Fast-Food-Restaurants-in-Gujranwala-1024x683.jpg', '16.ehzc6wm.jpg', 'laurentejeno73@gmail.com', '2025-12-08 09:23:07', '2025-12-08 09:23:07');

--
-- Triggers `other_information`
--
DELIMITER $$
CREATE TRIGGER `trg_other_information_reset_auto` AFTER DELETE ON `other_information` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('other_information', 'other_info_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `stallholder_id` int(11) NOT NULL,
  `payment_method` enum('onsite','online','bank_transfer','check','gcash','maya','paymaya') NOT NULL DEFAULT 'onsite',
  `amount` decimal(10,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_time` time DEFAULT NULL,
  `payment_for_month` varchar(7) DEFAULT NULL COMMENT 'YYYY-MM format for which month the payment is for',
  `payment_type` enum('rental','penalty','deposit','maintenance','other') DEFAULT 'rental',
  `reference_number` varchar(100) DEFAULT NULL COMMENT 'Receipt number, transaction ID, check number, etc.',
  `collected_by` varchar(100) DEFAULT NULL COMMENT 'Who collected the payment (for onsite payments)',
  `payment_status` enum('pending','completed','failed','cancelled') DEFAULT 'completed',
  `notes` text DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL COMMENT 'Branch manager or employee who recorded the payment',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `stallholder_id`, `payment_method`, `amount`, `payment_date`, `payment_time`, `payment_for_month`, `payment_type`, `reference_number`, `collected_by`, `payment_status`, `notes`, `branch_id`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 'onsite', 3500.00, '2025-12-08', '20:25:00', '2025-12', 'rental', 'RCP-20251208-001', 'Juan Dela Cruz', 'completed', NULL, 1, 1, '2025-12-08 12:25:57', '2025-12-08 12:25:57');

--
-- Triggers `payments`
--
DELIMITER $$
CREATE TRIGGER `trg_payments_reset_auto` AFTER DELETE ON `payments` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('payments', 'payment_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `payment_status_log`
--

CREATE TABLE `payment_status_log` (
  `log_id` int(11) NOT NULL,
  `reset_date` date NOT NULL,
  `stallholders_reset_count` int(11) DEFAULT 0,
  `reset_type` enum('manual','automatic') DEFAULT 'automatic',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `payment_status_log`
--
DELIMITER $$
CREATE TRIGGER `trg_payment_status_log_reset_auto` AFTER DELETE ON `payment_status_log` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('payment_status_log', 'log_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `raffle`
--

CREATE TABLE `raffle` (
  `raffle_id` int(11) NOT NULL,
  `stall_id` int(11) NOT NULL,
  `application_deadline` datetime DEFAULT NULL,
  `first_application_time` datetime DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `raffle_status` enum('Waiting for Participants','Active','Ended','Cancelled') DEFAULT 'Waiting for Participants',
  `total_participants` int(11) DEFAULT 0,
  `winner_selected` tinyint(1) DEFAULT 0,
  `winner_applicant_id` int(11) DEFAULT NULL,
  `winner_selection_date` datetime DEFAULT NULL,
  `created_by_business_manager` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `raffle`
--
DELIMITER $$
CREATE TRIGGER `trg_raffle_reset_auto` AFTER DELETE ON `raffle` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('raffle', 'raffle_id');
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_expired_raffles` AFTER UPDATE ON `raffle` FOR EACH ROW BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.end_time <= NOW() AND NEW.raffle_status = 'Active' THEN
        UPDATE raffle SET raffle_status = 'Ended' WHERE raffle_id = NEW.raffle_id;
        UPDATE stall SET raffle_auction_status = 'Ended' WHERE stall_id = NEW.stall_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `raffle_auction_log`
--

CREATE TABLE `raffle_auction_log` (
  `log_id` int(11) NOT NULL,
  `stall_id` int(11) NOT NULL,
  `raffle_id` int(11) DEFAULT NULL,
  `auction_id` int(11) DEFAULT NULL,
  `action_type` enum('Created','Deadline Extended','Deadline Shortened','Status Changed','Cancelled','Winner Selected','Deadline Activated') NOT NULL,
  `old_deadline` datetime DEFAULT NULL,
  `new_deadline` datetime DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `performed_by_business_manager` int(11) NOT NULL,
  `action_timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `raffle_auction_log`
--
DELIMITER $$
CREATE TRIGGER `trg_raffle_auction_log_reset_auto` AFTER DELETE ON `raffle_auction_log` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('raffle_auction_log', 'log_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `raffle_participants`
--

CREATE TABLE `raffle_participants` (
  `participant_id` int(11) NOT NULL,
  `raffle_id` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `participation_time` datetime NOT NULL DEFAULT current_timestamp(),
  `is_winner` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `raffle_participants`
--
DELIMITER $$
CREATE TRIGGER `trg_raffle_participants_reset_auto` AFTER DELETE ON `raffle_participants` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('raffle_participants', 'participant_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `raffle_result`
--

CREATE TABLE `raffle_result` (
  `result_id` int(11) NOT NULL,
  `raffle_id` int(11) NOT NULL,
  `winner_applicant_id` int(11) NOT NULL,
  `winner_application_id` int(11) NOT NULL,
  `result_date` datetime NOT NULL DEFAULT current_timestamp(),
  `total_participants` int(11) NOT NULL,
  `selection_method` enum('Random','Manual') DEFAULT 'Random',
  `awarded_by_business_manager` int(11) NOT NULL,
  `result_status` enum('Pending','Confirmed','Cancelled') DEFAULT 'Pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `raffle_result`
--
DELIMITER $$
CREATE TRIGGER `trg_raffle_result_reset_auto` AFTER DELETE ON `raffle_result` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('raffle_result', 'result_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `section`
--

CREATE TABLE `section` (
  `section_id` int(11) NOT NULL,
  `floor_id` int(11) NOT NULL,
  `section_name` varchar(100) NOT NULL,
  `status` enum('Active','Inactive','Under Construction','Maintenance') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `section`
--

INSERT INTO `section` (`section_id`, `floor_id`, `section_name`, `status`, `created_at`, `updated_at`) VALUES
(3, 1, 'Flower Shop', 'Active', '2025-12-07 07:09:19', '2025-12-07 07:09:19'),
(4, 4, 'Meat Shop', 'Active', '2025-12-07 07:09:41', '2025-12-07 07:09:41'),
(5, 4, 'Candy', 'Active', '2025-12-08 15:35:11', '2025-12-08 15:35:11'),
(6, 5, 'Dry Fish', 'Active', '2025-12-08 16:55:19', '2025-12-08 16:55:19'),
(7, 5, 'Fruit', 'Active', '2025-12-08 17:02:00', '2025-12-08 17:02:00');

--
-- Triggers `section`
--
DELIMITER $$
CREATE TRIGGER `trg_section_reset_auto` AFTER DELETE ON `section` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('section', 'section_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `spouse`
--

CREATE TABLE `spouse` (
  `spouse_id` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `spouse_full_name` varchar(255) NOT NULL,
  `spouse_birthdate` date DEFAULT NULL,
  `spouse_educational_attainment` varchar(100) DEFAULT NULL,
  `spouse_contact_number` varchar(20) DEFAULT NULL,
  `spouse_occupation` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `spouse`
--

INSERT INTO `spouse` (`spouse_id`, `applicant_id`, `spouse_full_name`, `spouse_birthdate`, `spouse_educational_attainment`, `spouse_contact_number`, `spouse_occupation`, `created_at`, `updated_at`) VALUES
(1, 1, 'Elaine Zennia A. Laurente', '2005-06-03', 'College Graduate', '09126471858', 'Architecture', '2025-12-08 09:23:07', '2025-12-08 09:23:07');

--
-- Triggers `spouse`
--
DELIMITER $$
CREATE TRIGGER `trg_spouse_reset_auto` AFTER DELETE ON `spouse` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('spouse', 'spouse_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `stall`
--

CREATE TABLE `stall` (
  `stall_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `floor_id` int(11) NOT NULL,
  `stall_no` varchar(20) NOT NULL,
  `stall_location` varchar(100) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `rental_price` decimal(10,2) DEFAULT NULL,
  `price_type` enum('Fixed Price','Auction','Raffle') DEFAULT 'Fixed Price',
  `status` enum('Active','Inactive','Maintenance','Occupied') DEFAULT 'Active',
  `stamp` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `raffle_auction_deadline` datetime DEFAULT NULL,
  `deadline_active` tinyint(1) DEFAULT 0,
  `raffle_auction_status` enum('Not Started','Active','Ended','Cancelled') DEFAULT 'Not Started',
  `raffle_auction_start_time` datetime DEFAULT NULL,
  `raffle_auction_end_time` datetime DEFAULT NULL,
  `created_by_business_manager` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stall`
--

INSERT INTO `stall` (`stall_id`, `section_id`, `floor_id`, `stall_no`, `stall_location`, `size`, `rental_price`, `price_type`, `status`, `stamp`, `description`, `is_available`, `raffle_auction_deadline`, `deadline_active`, `raffle_auction_status`, `raffle_auction_start_time`, `raffle_auction_end_time`, `created_by_business_manager`, `created_at`, `updated_at`) VALUES
(12, 4, 4, 'NPM-001', 'Near MEPO Office', '3x4', 2510.00, 'Fixed Price', 'Active', 'APPROVED', 'Best area to sell meat', 1, NULL, 0, NULL, NULL, NULL, 1, '2025-12-08 05:28:29', '2025-12-08 08:32:45'),
(13, 3, 1, 'NPM-002', 'Back of the market', '4x5', 3500.00, 'Fixed Price', 'Occupied', 'APPROVED', 'Best area to sell flowers', 0, NULL, 0, NULL, NULL, NULL, 1, '2025-12-08 08:40:06', '2025-12-08 12:20:06'),
(14, 5, 4, 'NPM-003', 'Near MEPO Office center in the candy section', '3x5', 3500.00, 'Raffle', 'Active', 'APPROVED', 'Best area for delivery', 1, '2025-12-12 23:00:00', 0, 'Not Started', NULL, NULL, 1, '2025-12-08 17:07:27', '2025-12-08 17:07:27'),
(16, 6, 5, 'NPM-004', 'Near parking area', '3x4', 2820.00, 'Auction', 'Active', 'APPROVED', 'The customer can see your stall after parking', 1, '2025-12-12 23:00:00', 0, 'Not Started', NULL, NULL, 1, '2025-12-08 17:23:38', '2025-12-08 17:23:38');

-- --------------------------------------------------------

--
-- Table structure for table `stallholder`
--

CREATE TABLE `stallholder` (
  `stallholder_id` int(11) NOT NULL,
  `applicant_id` int(11) NOT NULL,
  `stallholder_name` varchar(150) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `business_name` varchar(255) DEFAULT NULL,
  `business_type` varchar(100) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `stall_id` int(11) DEFAULT NULL,
  `contract_start_date` date NOT NULL,
  `contract_end_date` date NOT NULL,
  `contract_status` enum('Active','Expired','Terminated') DEFAULT 'Active',
  `lease_amount` decimal(10,2) NOT NULL,
  `monthly_rent` decimal(10,2) DEFAULT NULL,
  `payment_status` enum('current','overdue','grace_period','paid','pending') DEFAULT 'pending',
  `last_payment_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by_business_manager` int(11) DEFAULT NULL,
  `compliance_status` enum('Compliant','Non-Compliant') DEFAULT 'Compliant',
  `date_created` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_violation_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stallholder`
--

INSERT INTO `stallholder` (`stallholder_id`, `applicant_id`, `stallholder_name`, `contact_number`, `email`, `address`, `business_name`, `business_type`, `branch_id`, `stall_id`, `contract_start_date`, `contract_end_date`, `contract_status`, `lease_amount`, `monthly_rent`, `payment_status`, `last_payment_date`, `notes`, `created_by_business_manager`, `compliance_status`, `date_created`, `updated_at`, `last_violation_date`) VALUES
(1, 1, 'Jeno Aldrei A. Laurente', '09473430196', 'laurentejeno73@gmail.com', 'Zone 5, House Number 141', 'Flowers and Plants', 'Flowers and Plants', 1, 13, '2025-12-08', '2026-12-08', 'Active', 3500.00, 3500.00, 'paid', '2025-12-08', NULL, NULL, 'Compliant', '2025-12-08 12:20:06', '2025-12-08 12:25:57', NULL);

--
-- Triggers `stallholder`
--
DELIMITER $$
CREATE TRIGGER `trg_stallholder_reset_auto` AFTER DELETE ON `stallholder` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('stallholder', 'stallholder_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `stallholder_documents`
--

CREATE TABLE `stallholder_documents` (
  `document_id` int(11) NOT NULL,
  `stallholder_id` int(11) NOT NULL,
  `document_type_id` int(11) NOT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `upload_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `verification_status` enum('pending','verified','rejected','expired') DEFAULT 'pending',
  `verified_by` int(11) DEFAULT NULL COMMENT 'Employee or manager who verified',
  `verified_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `expiry_date` date DEFAULT NULL COMMENT 'For documents that expire',
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `stallholder_documents`
--
DELIMITER $$
CREATE TRIGGER `trg_stallholder_documents_reset_auto` AFTER DELETE ON `stallholder_documents` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('stallholder_documents', 'document_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `stallholder_document_submissions`
--

CREATE TABLE `stallholder_document_submissions` (
  `submission_id` int(11) NOT NULL,
  `stallholder_id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `requirement_id` int(11) NOT NULL,
  `application_id` int(11) DEFAULT NULL,
  `file_url` text NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `stallholder_document_submissions`
--
DELIMITER $$
CREATE TRIGGER `trg_stallholder_document_submissions_reset_auto` AFTER DELETE ON `stallholder_document_submissions` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('stallholder_document_submissions', 'submission_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `stalls_with_raffle_auction_view`
-- (See below for the actual view)
--
CREATE TABLE `stalls_with_raffle_auction_view` (
`stall_id` int(11)
,`stall_no` varchar(20)
,`stall_location` varchar(100)
,`size` varchar(50)
,`rental_price` decimal(10,2)
,`price_type` enum('Fixed Price','Auction','Raffle')
,`status` enum('Active','Inactive','Maintenance','Occupied')
,`raffle_auction_status` enum('Not Started','Active','Ended','Cancelled')
,`raffle_auction_start_time` datetime
,`raffle_auction_end_time` datetime
,`raffle_auction_deadline` datetime
,`deadline_active` tinyint(1)
,`branch_name` varchar(100)
,`floor_name` varchar(50)
,`section_name` varchar(100)
,`manager_first_name` varchar(50)
,`manager_last_name` varchar(50)
,`raffle_id` int(11)
,`raffle_participants` int(11)
,`raffle_winner_id` int(11)
,`raffle_winner_name` varchar(255)
,`auction_id` int(11)
,`auction_starting_price` decimal(10,2)
,`current_highest_bid` decimal(10,2)
,`total_bids` int(11)
,`highest_bidder_id` int(11)
,`highest_bidder_name` varchar(255)
,`auction_winner_id` int(11)
,`auction_winner_name` varchar(255)
,`time_remaining_formatted` varchar(70)
,`seconds_remaining` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `stall_applications`
--

CREATE TABLE `stall_applications` (
  `application_id` int(11) NOT NULL,
  `stallholder_id` int(11) NOT NULL,
  `stall_id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `status` enum('draft','submitted','under_review','documents_pending','approved','rejected','withdrawn') DEFAULT 'draft',
  `application_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`application_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `stall_applications`
--
DELIMITER $$
CREATE TRIGGER `trg_stall_applications_reset_auto` AFTER DELETE ON `stall_applications` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('stall_applications', 'application_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `stall_business_owner`
--

CREATE TABLE `stall_business_owner` (
  `business_owner_id` int(11) NOT NULL,
  `owner_username` varchar(50) NOT NULL,
  `owner_password_hash` varchar(255) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `subscription_status` enum('Active','Expired','Suspended','Pending') DEFAULT 'Pending',
  `subscription_expiry_date` date DEFAULT NULL,
  `last_payment_date` date DEFAULT NULL,
  `created_by_system_admin` int(11) DEFAULT NULL,
  `primary_manager_id` int(11) DEFAULT NULL COMMENT 'Primary Business Manager handling this owner',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stall_business_owner`
--

INSERT INTO `stall_business_owner` (`business_owner_id`, `owner_username`, `owner_password_hash`, `first_name`, `last_name`, `contact_number`, `email`, `status`, `subscription_status`, `subscription_expiry_date`, `last_payment_date`, `created_by_system_admin`, `primary_manager_id`, `created_at`, `updated_at`) VALUES
(1, 'multimanager_owner', '$2b$10$OyB7NCCcmad/QQZnRo15GulfZ8C2g1LtghZe5r2MHAcsM7G2KKxkC', 'Multi', 'Manager Owner', '+639173333333', 'multiowner@nagastall.com', 'Active', 'Active', '2026-01-06', '2025-12-06', 1, 1, '2025-11-26 15:59:07', '2025-12-06 12:36:58');

--
-- Triggers `stall_business_owner`
--
DELIMITER $$
CREATE TRIGGER `trg_stall_business_owner_reset_auto` AFTER DELETE ON `stall_business_owner` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('stall_business_owner', 'business_owner_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `stall_images`
--

CREATE TABLE `stall_images` (
  `id` int(11) NOT NULL,
  `stall_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `display_order` tinyint(4) DEFAULT 1 COMMENT 'Order of image display (1-10)',
  `is_primary` tinyint(1) DEFAULT 0 COMMENT 'Primary/featured image flag',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores multiple images for each stall (max 10 per stall)';

--
-- Dumping data for table `stall_images`
--

INSERT INTO `stall_images` (`id`, `stall_id`, `image_url`, `display_order`, `is_primary`, `created_at`, `updated_at`) VALUES
(5, 12, '/digistall_uploads/stalls/1/NPM-001/1.png', 1, 1, '2025-12-08 05:28:29', '2025-12-08 05:28:29'),
(6, 12, '/digistall_uploads/stalls/1/NPM-001/2.png', 2, 0, '2025-12-08 05:28:29', '2025-12-08 05:28:29'),
(7, 12, '/digistall_uploads/stalls/1/NPM-001/3.png', 3, 0, '2025-12-08 05:28:29', '2025-12-08 05:28:29'),
(8, 12, '/digistall_uploads/stalls/1/NPM-001/4.png', 4, 0, '2025-12-08 05:28:29', '2025-12-08 05:28:29'),
(9, 13, '/digistall_uploads/stalls/1/NPM-002/1.png', 1, 1, '2025-12-08 08:40:06', '2025-12-08 08:40:06'),
(10, 13, '/digistall_uploads/stalls/1/NPM-002/2.png', 2, 0, '2025-12-08 08:40:06', '2025-12-08 08:40:06'),
(11, 13, '/digistall_uploads/stalls/1/NPM-002/3.png', 3, 0, '2025-12-08 08:40:06', '2025-12-08 08:40:06'),
(12, 14, '/digistall_uploads/stalls/1/NPM-003/1.png', 1, 1, '2025-12-08 17:07:27', '2025-12-08 17:07:27'),
(13, 14, '/digistall_uploads/stalls/1/NPM-003/2.png', 2, 0, '2025-12-08 17:07:27', '2025-12-08 17:07:27'),
(14, 14, '/digistall_uploads/stalls/1/NPM-003/3.png', 3, 0, '2025-12-08 17:07:27', '2025-12-08 17:07:27'),
(18, 16, '/digistall_uploads/stalls/1/NPM-004/1.png', 1, 1, '2025-12-08 17:23:38', '2025-12-08 17:23:38'),
(19, 16, '/digistall_uploads/stalls/1/NPM-004/2.png', 2, 0, '2025-12-08 17:23:38', '2025-12-08 17:23:38'),
(20, 16, '/digistall_uploads/stalls/1/NPM-004/3.png', 3, 0, '2025-12-08 17:23:38', '2025-12-08 17:23:38');

--
-- Triggers `stall_images`
--
DELIMITER $$
CREATE TRIGGER `before_stall_image_insert` BEFORE INSERT ON `stall_images` FOR EACH ROW BEGIN
  DECLARE image_count INT;
  
  
  SELECT COUNT(*) INTO image_count 
  FROM stall_images 
  WHERE stall_id = NEW.stall_id;
  
  
  IF image_count >= 10 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot add more than 10 images per stall';
  END IF;
  
  
  IF NEW.display_order IS NULL THEN
    SET NEW.display_order = image_count + 1;
  END IF;
  
  
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_payments`
--

CREATE TABLE `subscription_payments` (
  `payment_id` int(11) NOT NULL,
  `subscription_id` int(11) NOT NULL,
  `business_owner_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` enum('Cash','Bank Transfer','Credit Card','Debit Card','Online Payment','Check') NOT NULL,
  `payment_status` enum('Pending','Completed','Failed','Refunded') DEFAULT 'Pending',
  `reference_number` varchar(100) DEFAULT NULL,
  `receipt_number` varchar(100) DEFAULT NULL,
  `payment_period_start` date NOT NULL,
  `payment_period_end` date NOT NULL,
  `notes` text DEFAULT NULL,
  `processed_by_system_admin` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscription_payments`
--

INSERT INTO `subscription_payments` (`payment_id`, `subscription_id`, `business_owner_id`, `amount`, `payment_date`, `payment_method`, `payment_status`, `reference_number`, `receipt_number`, `payment_period_start`, `payment_period_end`, `notes`, `processed_by_system_admin`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 10000.00, '2025-12-06', 'Cash', 'Completed', 'K09jd8231ffvb234', 'RCPT-20251206-5587', '2025-12-06', '2026-01-06', NULL, 1, '2025-12-06 12:36:58', '2025-12-06 12:36:58');

--
-- Triggers `subscription_payments`
--
DELIMITER $$
CREATE TRIGGER `trg_subscription_payments_reset_auto` AFTER DELETE ON `subscription_payments` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('subscription_payments', 'payment_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `plan_id` int(11) NOT NULL,
  `plan_name` varchar(100) NOT NULL,
  `plan_description` text DEFAULT NULL,
  `monthly_fee` decimal(10,2) NOT NULL,
  `max_branches` int(11) DEFAULT 1,
  `max_employees` int(11) DEFAULT 10,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`plan_id`, `plan_name`, `plan_description`, `monthly_fee`, `max_branches`, `max_employees`, `features`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Basic Plan', 'Perfect for small business with 1-2 branches', 5000.00, 2, 5, '{\"branches\": 2, \"employees\": 10, \"stalls\": 50, \"reports\": true, \"support\": \"email\"}', 'Active', '2025-11-26 13:36:04', '2025-11-27 08:16:45'),
(2, 'Standard Plan', 'Ideal for growing businesses', 10000.00, 5, 25, '{\"branches\": 5, \"employees\": 25, \"stalls\": 150, \"reports\": true, \"advanced_reports\": true, \"support\": \"email_phone\"}', 'Active', '2025-11-26 13:36:04', '2025-11-26 13:36:04'),
(3, 'Premium Plan', 'Complete solution for large businesses', 20000.00, 10, 100, '{\"branches\": \"10\", \"employees\": \"100\", \"stalls\": \"unlimited\", \"reports\": true, \"advanced_reports\": true, \"custom_reports\": true, \"support\": \"24/7\", \"priority_support\": true}', 'Active', '2025-11-26 13:36:04', '2025-11-27 03:05:18');

--
-- Triggers `subscription_plans`
--
DELIMITER $$
CREATE TRIGGER `trg_subscription_plans_reset_auto` AFTER DELETE ON `subscription_plans` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('subscription_plans', 'plan_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `system_administrator`
--

CREATE TABLE `system_administrator` (
  `system_admin_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_administrator`
--

INSERT INTO `system_administrator` (`system_admin_id`, `username`, `password_hash`, `first_name`, `last_name`, `contact_number`, `email`, `status`, `created_at`, `updated_at`) VALUES
(1, 'sysadmin', '$2b$12$ZeU7W7K6xmviVoqgaHoK9uYL2lMuD98DLd3yffXi0WfM6l2vHSQWa', 'System', 'Administrator', '+63900000000', 'sysadmin@nagastall.com', 'Active', '2025-11-26 12:34:08', '2025-11-26 12:59:38');

--
-- Triggers `system_administrator`
--
DELIMITER $$
CREATE TRIGGER `trg_system_administrator_reset_auto` AFTER DELETE ON `system_administrator` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('system_administrator', 'system_admin_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_applicant_documents_by_owner`
-- (See below for the actual view)
--
CREATE TABLE `view_applicant_documents_by_owner` (
`document_id` int(11)
,`applicant_id` int(11)
,`applicant_full_name` varchar(255)
,`applicant_contact_number` varchar(20)
,`business_owner_id` int(11)
,`business_owner_name` varchar(101)
,`owner_username` varchar(50)
,`branch_id` int(11)
,`branch_name` varchar(100)
,`document_type_id` int(11)
,`document_name` varchar(100)
,`document_description` text
,`file_path` varchar(500)
,`original_filename` varchar(255)
,`file_size` bigint(20)
,`mime_type` varchar(100)
,`upload_date` timestamp
,`verification_status` enum('pending','verified','rejected','expired')
,`verified_at` timestamp
,`expiry_date` date
,`notes` text
,`document_status` varchar(8)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_applicant_required_documents`
-- (See below for the actual view)
--
CREATE TABLE `view_applicant_required_documents` (
`applicant_id` int(11)
,`application_id` int(11)
,`branch_id` int(11)
,`branch_name` varchar(100)
,`business_owner_id` int(11)
,`business_owner_name` varchar(101)
,`document_type_id` int(11)
,`document_name` varchar(100)
,`document_description` text
,`is_required` tinyint(1)
,`instructions` text
,`document_id` int(11)
,`verification_status` enum('pending','verified','rejected','expired')
,`upload_date` timestamp
,`expiry_date` date
,`status` varchar(12)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_compliance_records`
-- (See below for the actual view)
--
CREATE TABLE `view_compliance_records` (
`compliance_id` int(11)
,`date` datetime
,`type` varchar(255)
,`inspector` varchar(101)
,`stallholder` varchar(150)
,`status` enum('pending','in-progress','complete','incomplete')
,`severity` enum('minor','moderate','major','critical')
,`notes` text
,`resolved_date` datetime
,`branch_name` varchar(100)
,`branch_id` int(11)
,`stall_no` varchar(20)
,`offense_no` int(11)
,`penalty_amount` decimal(10,2)
,`stallholder_id` int(11)
,`stall_id` int(11)
,`inspector_id` int(11)
,`violation_id` int(11)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_compliant_stallholders`
-- (See below for the actual view)
--
CREATE TABLE `view_compliant_stallholders` (
`stallholder_id` int(11)
,`stallholder_name` varchar(150)
,`branch_id` int(11)
,`compliance_status` enum('Compliant','Non-Compliant')
,`date_created` timestamp
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_inspector_activity_log`
-- (See below for the actual view)
--
CREATE TABLE `view_inspector_activity_log` (
`action_id` int(11)
,`inspector_name` varchar(101)
,`branch_manager_name` varchar(101)
,`action_type` enum('New Hire','Termination','Rehire','Transfer')
,`action_date` datetime
,`remarks` text
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_violation_penalty`
-- (See below for the actual view)
--
CREATE TABLE `view_violation_penalty` (
`penalty_id` int(11)
,`violation_type` varchar(255)
,`offense_no` int(11)
,`penalty_amount` decimal(10,2)
,`remarks` varchar(255)
);

-- --------------------------------------------------------

--
-- Table structure for table `violation`
--

CREATE TABLE `violation` (
  `violation_id` int(11) NOT NULL,
  `ordinance_no` varchar(50) NOT NULL,
  `violation_type` varchar(255) NOT NULL,
  `details` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `violation`
--

INSERT INTO `violation` (`violation_id`, `ordinance_no`, `violation_type`, `details`) VALUES
(1, 'Ordinance No. 2001-055', 'Illegal Vending', 'Vending outside prescribed area (Obstruction)'),
(2, 'Ordinance No. 2001-056', 'Waste Segregation / Anti-Littering', 'Improper waste disposal or littering'),
(3, 'Ordinance No. 2017-066', 'Anti-Smoking', 'Smoking in prohibited public areas');

--
-- Triggers `violation`
--
DELIMITER $$
CREATE TRIGGER `trg_violation_reset_auto` AFTER DELETE ON `violation` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('violation', 'violation_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `violation_penalty`
--

CREATE TABLE `violation_penalty` (
  `penalty_id` int(11) NOT NULL,
  `violation_id` int(11) NOT NULL,
  `offense_no` int(11) NOT NULL,
  `penalty_amount` decimal(10,2) DEFAULT 0.00,
  `remarks` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `violation_penalty`
--

INSERT INTO `violation_penalty` (`penalty_id`, `violation_id`, `offense_no`, `penalty_amount`, `remarks`) VALUES
(1, 1, 1, 300.00, NULL),
(2, 1, 2, 500.00, NULL),
(3, 1, 3, 1000.00, NULL),
(4, 1, 4, 0.00, 'Cancellation of Permit'),
(5, 2, 1, 500.00, NULL),
(6, 2, 2, 1000.00, NULL),
(7, 2, 3, 1500.00, NULL),
(8, 3, 1, 1500.00, NULL),
(9, 3, 2, 2500.00, NULL),
(10, 3, 3, 3500.00, NULL),
(11, 3, 4, 5000.00, 'Imprisonment of not less than 6 months');

--
-- Triggers `violation_penalty`
--
DELIMITER $$
CREATE TRIGGER `trg_violation_penalty_reset_auto` AFTER DELETE ON `violation_penalty` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('violation_penalty', 'penalty_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `violation_report`
--

CREATE TABLE `violation_report` (
  `report_id` int(11) NOT NULL,
  `inspector_id` int(11) DEFAULT NULL,
  `stallholder_id` int(11) DEFAULT NULL,
  `violator_name` varchar(255) DEFAULT NULL,
  `violation_id` int(11) NOT NULL,
  `compliance_type` varchar(100) DEFAULT NULL,
  `severity` enum('minor','moderate','major','critical') DEFAULT 'moderate',
  `stall_id` int(11) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `evidence` blob DEFAULT NULL,
  `date_reported` datetime DEFAULT current_timestamp(),
  `remarks` text DEFAULT NULL,
  `status` enum('pending','in-progress','complete','incomplete') DEFAULT 'pending',
  `resolved_date` datetime DEFAULT NULL,
  `resolved_by` int(11) DEFAULT NULL,
  `offense_no` int(11) DEFAULT NULL,
  `penalty_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `violation_report`
--

INSERT INTO `violation_report` (`report_id`, `inspector_id`, `stallholder_id`, `violator_name`, `violation_id`, `compliance_type`, `severity`, `stall_id`, `branch_id`, `evidence`, `date_reported`, `remarks`, `status`, `resolved_date`, `resolved_by`, `offense_no`, `penalty_id`) VALUES
(1, 1, 1, NULL, 1, 'Illegal Vending', 'minor', 13, 1, 0x466f756e642076656e646f722073656c6c696e67206f7574736964652061737369676e6564206172656120617420383a313520414d2e, '2025-10-08 09:30:41', 'First warning issued. | Offense #1 | Fine: ₱300.00 | ', 'complete', '2025-10-15 09:30:41', NULL, 1, 1);

--
-- Triggers `violation_report`
--
DELIMITER $$
CREATE TRIGGER `trg_violation_report_reset_auto` AFTER DELETE ON `violation_report` FOR EACH ROW BEGIN
    CALL ResetAutoIncrement('violation_report', 'report_id');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure for view `active_auctions_view`
--
DROP TABLE IF EXISTS `active_auctions_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `active_auctions_view`  AS SELECT `a`.`auction_id` AS `auction_id`, `a`.`stall_id` AS `stall_id`, `s`.`stall_no` AS `stall_no`, `s`.`stall_location` AS `stall_location`, `a`.`starting_price` AS `starting_price`, `a`.`current_highest_bid` AS `current_highest_bid`, `a`.`total_bids` AS `total_bids`, `b`.`branch_name` AS `branch_name`, `f`.`floor_name` AS `floor_name`, `sec`.`section_name` AS `section_name`, `a`.`start_time` AS `start_time`, `a`.`end_time` AS `end_time`, `a`.`application_deadline` AS `application_deadline`, `a`.`auction_status` AS `auction_status`, CASE WHEN `a`.`end_time` is null THEN NULL ELSE timestampdiff(SECOND,current_timestamp(),`a`.`end_time`) END AS `seconds_remaining`, CASE WHEN `a`.`end_time` is null THEN 'Waiting for bidders' WHEN current_timestamp() >= `a`.`end_time` THEN 'Expired' ELSE concat(floor(timestampdiff(SECOND,current_timestamp(),`a`.`end_time`) / 3600),'h ',floor(timestampdiff(SECOND,current_timestamp(),`a`.`end_time`) MOD 3600 / 60),'m ',timestampdiff(SECOND,current_timestamp(),`a`.`end_time`) MOD 60,'s') END AS `time_remaining_formatted`, `hb`.`applicant_full_name` AS `highest_bidder_name`, `bm`.`first_name` AS `manager_first_name`, `bm`.`last_name` AS `manager_last_name` FROM ((((((`auction` `a` join `stall` `s` on(`a`.`stall_id` = `s`.`stall_id`)) join `section` `sec` on(`s`.`section_id` = `sec`.`section_id`)) join `floor` `f` on(`s`.`floor_id` = `f`.`floor_id`)) join `branch` `b` on(`f`.`branch_id` = `b`.`branch_id`)) join `business_manager` `bm` on(`a`.`created_by_business_manager` = `bm`.`business_manager_id`)) left join `applicant` `hb` on(`a`.`highest_bidder_id` = `hb`.`applicant_id`)) WHERE `a`.`auction_status` in ('Waiting for Bidders','Active') ;

-- --------------------------------------------------------

--
-- Structure for view `active_raffles_view`
--
DROP TABLE IF EXISTS `active_raffles_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `active_raffles_view`  AS SELECT `r`.`raffle_id` AS `raffle_id`, `r`.`stall_id` AS `stall_id`, `s`.`stall_no` AS `stall_no`, `s`.`stall_location` AS `stall_location`, `s`.`rental_price` AS `rental_price`, `b`.`branch_name` AS `branch_name`, `f`.`floor_name` AS `floor_name`, `sec`.`section_name` AS `section_name`, `r`.`start_time` AS `start_time`, `r`.`end_time` AS `end_time`, `r`.`application_deadline` AS `application_deadline`, `r`.`total_participants` AS `total_participants`, `r`.`raffle_status` AS `raffle_status`, CASE WHEN `r`.`end_time` is null THEN NULL ELSE timestampdiff(SECOND,current_timestamp(),`r`.`end_time`) END AS `seconds_remaining`, CASE WHEN `r`.`end_time` is null THEN 'Waiting for participants' WHEN current_timestamp() >= `r`.`end_time` THEN 'Expired' ELSE concat(floor(timestampdiff(SECOND,current_timestamp(),`r`.`end_time`) / 3600),'h ',floor(timestampdiff(SECOND,current_timestamp(),`r`.`end_time`) MOD 3600 / 60),'m ',timestampdiff(SECOND,current_timestamp(),`r`.`end_time`) MOD 60,'s') END AS `time_remaining_formatted`, `bm`.`first_name` AS `manager_first_name`, `bm`.`last_name` AS `manager_last_name` FROM (((((`raffle` `r` join `stall` `s` on(`r`.`stall_id` = `s`.`stall_id`)) join `section` `sec` on(`s`.`section_id` = `sec`.`section_id`)) join `floor` `f` on(`s`.`floor_id` = `f`.`floor_id`)) join `branch` `b` on(`f`.`branch_id` = `b`.`branch_id`)) join `business_manager` `bm` on(`r`.`created_by_business_manager` = `bm`.`business_manager_id`)) WHERE `r`.`raffle_status` in ('Waiting for Participants','Active') ;

-- --------------------------------------------------------

--
-- Structure for view `stalls_with_raffle_auction_view`
--
DROP TABLE IF EXISTS `stalls_with_raffle_auction_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `stalls_with_raffle_auction_view`  AS SELECT `s`.`stall_id` AS `stall_id`, `s`.`stall_no` AS `stall_no`, `s`.`stall_location` AS `stall_location`, `s`.`size` AS `size`, `s`.`rental_price` AS `rental_price`, `s`.`price_type` AS `price_type`, `s`.`status` AS `status`, `s`.`raffle_auction_status` AS `raffle_auction_status`, `s`.`raffle_auction_start_time` AS `raffle_auction_start_time`, `s`.`raffle_auction_end_time` AS `raffle_auction_end_time`, `s`.`raffle_auction_deadline` AS `raffle_auction_deadline`, `s`.`deadline_active` AS `deadline_active`, `b`.`branch_name` AS `branch_name`, `f`.`floor_name` AS `floor_name`, `sec`.`section_name` AS `section_name`, `bm`.`first_name` AS `manager_first_name`, `bm`.`last_name` AS `manager_last_name`, `r`.`raffle_id` AS `raffle_id`, `r`.`total_participants` AS `raffle_participants`, `r`.`winner_applicant_id` AS `raffle_winner_id`, `rw`.`applicant_full_name` AS `raffle_winner_name`, `au`.`auction_id` AS `auction_id`, `au`.`starting_price` AS `auction_starting_price`, `au`.`current_highest_bid` AS `current_highest_bid`, `au`.`total_bids` AS `total_bids`, `au`.`highest_bidder_id` AS `highest_bidder_id`, `ab`.`applicant_full_name` AS `highest_bidder_name`, `au`.`winner_applicant_id` AS `auction_winner_id`, `aw`.`applicant_full_name` AS `auction_winner_name`, CASE WHEN `s`.`raffle_auction_end_time` is null THEN 'Not Started' WHEN current_timestamp() >= `s`.`raffle_auction_end_time` THEN 'Expired' ELSE concat(floor(timestampdiff(SECOND,current_timestamp(),`s`.`raffle_auction_end_time`) / 3600),'h ',floor(timestampdiff(SECOND,current_timestamp(),`s`.`raffle_auction_end_time`) MOD 3600 / 60),'m ',timestampdiff(SECOND,current_timestamp(),`s`.`raffle_auction_end_time`) MOD 60,'s') END AS `time_remaining_formatted`, timestampdiff(SECOND,current_timestamp(),`s`.`raffle_auction_end_time`) AS `seconds_remaining` FROM (((((((((`stall` `s` join `section` `sec` on(`s`.`section_id` = `sec`.`section_id`)) join `floor` `f` on(`s`.`floor_id` = `f`.`floor_id`)) join `branch` `b` on(`f`.`branch_id` = `b`.`branch_id`)) left join `business_manager` `bm` on(`s`.`created_by_business_manager` = `bm`.`business_manager_id`)) left join `raffle` `r` on(`s`.`stall_id` = `r`.`stall_id`)) left join `applicant` `rw` on(`r`.`winner_applicant_id` = `rw`.`applicant_id`)) left join `auction` `au` on(`s`.`stall_id` = `au`.`stall_id`)) left join `applicant` `ab` on(`au`.`highest_bidder_id` = `ab`.`applicant_id`)) left join `applicant` `aw` on(`au`.`winner_applicant_id` = `aw`.`applicant_id`)) WHERE `s`.`price_type` in ('Raffle','Auction') ;

-- --------------------------------------------------------

--
-- Structure for view `view_applicant_documents_by_owner`
--
DROP TABLE IF EXISTS `view_applicant_documents_by_owner`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_applicant_documents_by_owner`  AS SELECT `ad`.`document_id` AS `document_id`, `ad`.`applicant_id` AS `applicant_id`, `a`.`applicant_full_name` AS `applicant_full_name`, `a`.`applicant_contact_number` AS `applicant_contact_number`, `ad`.`business_owner_id` AS `business_owner_id`, concat(`bo`.`first_name`,' ',`bo`.`last_name`) AS `business_owner_name`, `bo`.`owner_username` AS `owner_username`, `ad`.`branch_id` AS `branch_id`, `b`.`branch_name` AS `branch_name`, `ad`.`document_type_id` AS `document_type_id`, `dt`.`document_name` AS `document_name`, `dt`.`description` AS `document_description`, `ad`.`file_path` AS `file_path`, `ad`.`original_filename` AS `original_filename`, `ad`.`file_size` AS `file_size`, `ad`.`mime_type` AS `mime_type`, `ad`.`upload_date` AS `upload_date`, `ad`.`verification_status` AS `verification_status`, `ad`.`verified_at` AS `verified_at`, `ad`.`expiry_date` AS `expiry_date`, `ad`.`notes` AS `notes`, CASE WHEN `ad`.`expiry_date` is not null AND `ad`.`expiry_date` < curdate() THEN 'expired' WHEN `ad`.`verification_status` = 'verified' THEN 'valid' WHEN `ad`.`verification_status` = 'rejected' THEN 'rejected' ELSE 'pending' END AS `document_status` FROM ((((`applicant_documents` `ad` join `applicant` `a` on(`ad`.`applicant_id` = `a`.`applicant_id`)) join `stall_business_owner` `bo` on(`ad`.`business_owner_id` = `bo`.`business_owner_id`)) join `document_types` `dt` on(`ad`.`document_type_id` = `dt`.`document_type_id`)) left join `branch` `b` on(`ad`.`branch_id` = `b`.`branch_id`)) ORDER BY `ad`.`business_owner_id` ASC, `ad`.`upload_date` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `view_applicant_required_documents`
--
DROP TABLE IF EXISTS `view_applicant_required_documents`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_applicant_required_documents`  AS SELECT DISTINCT `a`.`applicant_id` AS `applicant_id`, `app`.`application_id` AS `application_id`, `b`.`branch_id` AS `branch_id`, `b`.`branch_name` AS `branch_name`, `b`.`business_owner_id` AS `business_owner_id`, concat(`bo`.`first_name`,' ',`bo`.`last_name`) AS `business_owner_name`, `dt`.`document_type_id` AS `document_type_id`, `dt`.`document_name` AS `document_name`, `dt`.`description` AS `document_description`, `bdr`.`is_required` AS `is_required`, `bdr`.`instructions` AS `instructions`, `ad`.`document_id` AS `document_id`, `ad`.`verification_status` AS `verification_status`, `ad`.`upload_date` AS `upload_date`, `ad`.`expiry_date` AS `expiry_date`, CASE WHEN `ad`.`document_id` is null THEN 'not_uploaded' WHEN `ad`.`expiry_date` is not null AND `ad`.`expiry_date` < curdate() THEN 'expired' WHEN `ad`.`verification_status` = 'verified' THEN 'verified' WHEN `ad`.`verification_status` = 'rejected' THEN 'rejected' ELSE 'pending' END AS `status` FROM (((((((((`application` `app` join `applicant` `a` on(`app`.`applicant_id` = `a`.`applicant_id`)) join `stall` `s` on(`app`.`stall_id` = `s`.`stall_id`)) join `section` `sec` on(`s`.`section_id` = `sec`.`section_id`)) join `floor` `f` on(`sec`.`floor_id` = `f`.`floor_id`)) join `branch` `b` on(`f`.`branch_id` = `b`.`branch_id`)) join `branch_document_requirements` `bdr` on(`b`.`branch_id` = `bdr`.`branch_id`)) join `document_types` `dt` on(`bdr`.`document_type_id` = `dt`.`document_type_id`)) join `stall_business_owner` `bo` on(`b`.`business_owner_id` = `bo`.`business_owner_id`)) left join `applicant_documents` `ad` on(`a`.`applicant_id` = `ad`.`applicant_id` and `b`.`business_owner_id` = `ad`.`business_owner_id` and `dt`.`document_type_id` = `ad`.`document_type_id`)) ORDER BY `a`.`applicant_id` ASC, `b`.`business_owner_id` ASC, `bdr`.`is_required` DESC, `dt`.`document_name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `view_compliance_records`
--
DROP TABLE IF EXISTS `view_compliance_records`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_compliance_records`  AS SELECT `vr`.`report_id` AS `compliance_id`, `vr`.`date_reported` AS `date`, coalesce(`vr`.`compliance_type`,`v`.`violation_type`) AS `type`, concat(`i`.`first_name`,' ',`i`.`last_name`) AS `inspector`, `sh`.`stallholder_name` AS `stallholder`, `vr`.`status` AS `status`, `vr`.`severity` AS `severity`, `vr`.`remarks` AS `notes`, `vr`.`resolved_date` AS `resolved_date`, `b`.`branch_name` AS `branch_name`, `b`.`branch_id` AS `branch_id`, `s`.`stall_no` AS `stall_no`, `vr`.`offense_no` AS `offense_no`, `vp`.`penalty_amount` AS `penalty_amount`, `vr`.`stallholder_id` AS `stallholder_id`, `vr`.`stall_id` AS `stall_id`, `vr`.`inspector_id` AS `inspector_id`, `vr`.`violation_id` AS `violation_id` FROM ((((((`violation_report` `vr` left join `inspector` `i` on(`vr`.`inspector_id` = `i`.`inspector_id`)) left join `stallholder` `sh` on(`vr`.`stallholder_id` = `sh`.`stallholder_id`)) left join `violation` `v` on(`vr`.`violation_id` = `v`.`violation_id`)) left join `branch` `b` on(`vr`.`branch_id` = `b`.`branch_id`)) left join `stall` `s` on(`vr`.`stall_id` = `s`.`stall_id`)) left join `violation_penalty` `vp` on(`vr`.`penalty_id` = `vp`.`penalty_id`)) ORDER BY `vr`.`date_reported` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `view_compliant_stallholders`
--
DROP TABLE IF EXISTS `view_compliant_stallholders`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_compliant_stallholders`  AS SELECT `stallholder`.`stallholder_id` AS `stallholder_id`, `stallholder`.`stallholder_name` AS `stallholder_name`, `stallholder`.`branch_id` AS `branch_id`, `stallholder`.`compliance_status` AS `compliance_status`, `stallholder`.`date_created` AS `date_created` FROM `stallholder` WHERE `stallholder`.`compliance_status` = 'Compliant' ;

-- --------------------------------------------------------

--
-- Structure for view `view_inspector_activity_log`
--
DROP TABLE IF EXISTS `view_inspector_activity_log`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_inspector_activity_log`  AS SELECT `ial`.`action_id` AS `action_id`, concat(`i`.`first_name`,' ',`i`.`last_name`) AS `inspector_name`, concat(`bm`.`first_name`,' ',`bm`.`last_name`) AS `branch_manager_name`, `ial`.`action_type` AS `action_type`, `ial`.`action_date` AS `action_date`, `ial`.`remarks` AS `remarks` FROM ((`inspector_action_log` `ial` left join `inspector` `i` on(`ial`.`inspector_id` = `i`.`inspector_id`)) left join `business_manager` `bm` on(`ial`.`business_manager_id` = `bm`.`business_manager_id`)) ORDER BY `ial`.`action_date` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `view_violation_penalty`
--
DROP TABLE IF EXISTS `view_violation_penalty`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `view_violation_penalty`  AS SELECT `vp`.`penalty_id` AS `penalty_id`, `v`.`violation_type` AS `violation_type`, `vp`.`offense_no` AS `offense_no`, `vp`.`penalty_amount` AS `penalty_amount`, `vp`.`remarks` AS `remarks` FROM (`violation_penalty` `vp` join `violation` `v` on(`vp`.`violation_id` = `v`.`violation_id`)) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `applicant`
--
ALTER TABLE `applicant`
  ADD PRIMARY KEY (`applicant_id`),
  ADD UNIQUE KEY `applicant_username` (`applicant_username`),
  ADD UNIQUE KEY `applicant_email` (`applicant_email`),
  ADD KEY `idx_applicant_username` (`applicant_username`),
  ADD KEY `idx_applicant_email` (`applicant_email`);

--
-- Indexes for table `applicant_documents`
--
ALTER TABLE `applicant_documents`
  ADD PRIMARY KEY (`document_id`),
  ADD UNIQUE KEY `unique_applicant_owner_document` (`applicant_id`,`business_owner_id`,`document_type_id`),
  ADD KEY `idx_applicant_docs` (`applicant_id`),
  ADD KEY `idx_business_owner_docs` (`business_owner_id`),
  ADD KEY `idx_branch_docs` (`branch_id`),
  ADD KEY `idx_document_type` (`document_type_id`),
  ADD KEY `idx_verification_status` (`verification_status`);

--
-- Indexes for table `application`
--
ALTER TABLE `application`
  ADD PRIMARY KEY (`application_id`),
  ADD KEY `stall_id` (`stall_id`),
  ADD KEY `applicant_id` (`applicant_id`);

--
-- Indexes for table `auction`
--
ALTER TABLE `auction`
  ADD PRIMARY KEY (`auction_id`),
  ADD UNIQUE KEY `unique_stall_auction` (`stall_id`),
  ADD KEY `idx_auction_status_end_time` (`auction_status`,`end_time`),
  ADD KEY `idx_auction_manager` (`created_by_business_manager`),
  ADD KEY `fk_auction_highest_bidder` (`highest_bidder_id`),
  ADD KEY `fk_auction_winner` (`winner_applicant_id`);

--
-- Indexes for table `auction_bids`
--
ALTER TABLE `auction_bids`
  ADD PRIMARY KEY (`bid_id`),
  ADD KEY `idx_auction_bids_auction` (`auction_id`),
  ADD KEY `idx_auction_bids_applicant` (`applicant_id`),
  ADD KEY `idx_auction_bids_amount` (`auction_id`,`bid_amount`),
  ADD KEY `idx_auction_bids_time` (`auction_id`,`bid_time`),
  ADD KEY `fk_auction_bids_application` (`application_id`);

--
-- Indexes for table `auction_result`
--
ALTER TABLE `auction_result`
  ADD PRIMARY KEY (`result_id`),
  ADD UNIQUE KEY `unique_auction_result` (`auction_id`),
  ADD KEY `fk_auction_result_winner` (`winner_applicant_id`),
  ADD KEY `fk_auction_result_application` (`winner_application_id`),
  ADD KEY `fk_auction_result_manager` (`awarded_by_business_manager`);

--
-- Indexes for table `branch`
--
ALTER TABLE `branch`
  ADD PRIMARY KEY (`branch_id`),
  ADD KEY `admin_id` (`business_owner_id`);

--
-- Indexes for table `branch_document_requirements`
--
ALTER TABLE `branch_document_requirements`
  ADD PRIMARY KEY (`requirement_id`),
  ADD KEY `idx_branch_requirements` (`branch_id`),
  ADD KEY `idx_document_type` (`document_type_id`);

--
-- Indexes for table `business_employee`
--
ALTER TABLE `business_employee`
  ADD PRIMARY KEY (`business_employee_id`),
  ADD UNIQUE KEY `employee_username` (`employee_username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `created_by_manager` (`created_by_manager`),
  ADD KEY `idx_employee_branch` (`branch_id`),
  ADD KEY `idx_employee_status` (`status`);

--
-- Indexes for table `business_information`
--
ALTER TABLE `business_information`
  ADD PRIMARY KEY (`business_id`),
  ADD KEY `applicant_id` (`applicant_id`);

--
-- Indexes for table `business_manager`
--
ALTER TABLE `business_manager`
  ADD PRIMARY KEY (`business_manager_id`),
  ADD UNIQUE KEY `manager_username` (`manager_username`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `fk_manager_created_by` (`created_by_owner`);

--
-- Indexes for table `business_owner_managers`
--
ALTER TABLE `business_owner_managers`
  ADD PRIMARY KEY (`relationship_id`),
  ADD UNIQUE KEY `unique_owner_manager` (`business_owner_id`,`business_manager_id`),
  ADD KEY `idx_owner` (`business_owner_id`),
  ADD KEY `idx_manager` (`business_manager_id`),
  ADD KEY `idx_primary` (`is_primary`),
  ADD KEY `fk_owner_manager_admin` (`assigned_by_system_admin`);

--
-- Indexes for table `business_owner_subscriptions`
--
ALTER TABLE `business_owner_subscriptions`
  ADD PRIMARY KEY (`subscription_id`),
  ADD KEY `plan_id` (`plan_id`),
  ADD KEY `created_by_system_admin` (`created_by_system_admin`),
  ADD KEY `idx_business_owner` (`business_owner_id`),
  ADD KEY `idx_status` (`subscription_status`),
  ADD KEY `idx_dates` (`start_date`,`end_date`);

--
-- Indexes for table `collector`
--
ALTER TABLE `collector`
  ADD PRIMARY KEY (`collector_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `collector_action_log`
--
ALTER TABLE `collector_action_log`
  ADD PRIMARY KEY (`action_id`),
  ADD KEY `fk_collector_action_log` (`collector_id`);

--
-- Indexes for table `collector_assignment`
--
ALTER TABLE `collector_assignment`
  ADD PRIMARY KEY (`assignment_id`),
  ADD KEY `fk_collector_assignment` (`collector_id`),
  ADD KEY `fk_collector_branch` (`branch_id`);

--
-- Indexes for table `complaint`
--
ALTER TABLE `complaint`
  ADD PRIMARY KEY (`complaint_id`),
  ADD KEY `idx_stallholder` (`stallholder_id`),
  ADD KEY `idx_stall` (`stall_id`),
  ADD KEY `idx_branch` (`branch_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_date_submitted` (`date_submitted`);

--
-- Indexes for table `credential`
--
ALTER TABLE `credential`
  ADD PRIMARY KEY (`registrationid`),
  ADD UNIQUE KEY `user_name` (`user_name`),
  ADD KEY `applicant_id` (`applicant_id`);

--
-- Indexes for table `document_types`
--
ALTER TABLE `document_types`
  ADD PRIMARY KEY (`document_type_id`),
  ADD UNIQUE KEY `unique_document_name` (`document_name`);

--
-- Indexes for table `employee_activity_log`
--
ALTER TABLE `employee_activity_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `performed_by` (`performed_by_manager`),
  ADD KEY `idx_activity_employee` (`business_employee_id`),
  ADD KEY `idx_activity_action` (`action_type`),
  ADD KEY `idx_activity_date` (`created_at`);

--
-- Indexes for table `employee_credential_log`
--
ALTER TABLE `employee_credential_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `generated_by` (`generated_by_manager`),
  ADD KEY `idx_credential_employee` (`business_employee_id`),
  ADD KEY `idx_credential_action` (`action_type`);

--
-- Indexes for table `employee_email_template`
--
ALTER TABLE `employee_email_template`
  ADD PRIMARY KEY (`template_id`),
  ADD UNIQUE KEY `template_name` (`template_name`),
  ADD KEY `idx_template_name` (`template_name`);

--
-- Indexes for table `employee_password_reset`
--
ALTER TABLE `employee_password_reset`
  ADD PRIMARY KEY (`reset_id`),
  ADD UNIQUE KEY `reset_token` (`reset_token`),
  ADD KEY `requested_by` (`requested_by_manager`),
  ADD KEY `idx_reset_employee` (`business_employee_id`),
  ADD KEY `idx_reset_token` (`reset_token`);

--
-- Indexes for table `employee_session`
--
ALTER TABLE `employee_session`
  ADD PRIMARY KEY (`session_id`),
  ADD UNIQUE KEY `session_token` (`session_token`),
  ADD KEY `idx_session_employee` (`business_employee_id`),
  ADD KEY `idx_session_token` (`session_token`),
  ADD KEY `idx_session_active` (`is_active`);

--
-- Indexes for table `floor`
--
ALTER TABLE `floor`
  ADD PRIMARY KEY (`floor_id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `inspector`
--
ALTER TABLE `inspector`
  ADD PRIMARY KEY (`inspector_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `inspector_action_log`
--
ALTER TABLE `inspector_action_log`
  ADD PRIMARY KEY (`action_id`),
  ADD KEY `inspector_id` (`inspector_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `branch_manager_id` (`business_manager_id`);

--
-- Indexes for table `inspector_assignment`
--
ALTER TABLE `inspector_assignment`
  ADD PRIMARY KEY (`assignment_id`),
  ADD KEY `inspector_id` (`inspector_id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`migration_id`),
  ADD UNIQUE KEY `migration_name` (`migration_name`),
  ADD KEY `idx_migration_name` (`migration_name`);

--
-- Indexes for table `other_information`
--
ALTER TABLE `other_information`
  ADD PRIMARY KEY (`other_info_id`),
  ADD KEY `applicant_id` (`applicant_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `idx_stallholder_payment` (`stallholder_id`,`payment_date`),
  ADD KEY `idx_payment_method` (`payment_method`),
  ADD KEY `idx_payment_date` (`payment_date`),
  ADD KEY `idx_payment_for_month` (`payment_for_month`),
  ADD KEY `idx_branch_payments` (`branch_id`,`payment_date`);

--
-- Indexes for table `payment_status_log`
--
ALTER TABLE `payment_status_log`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `raffle`
--
ALTER TABLE `raffle`
  ADD PRIMARY KEY (`raffle_id`),
  ADD UNIQUE KEY `unique_stall_raffle` (`stall_id`),
  ADD KEY `idx_raffle_status_end_time` (`raffle_status`,`end_time`),
  ADD KEY `idx_raffle_manager` (`created_by_business_manager`),
  ADD KEY `fk_raffle_winner` (`winner_applicant_id`);

--
-- Indexes for table `raffle_auction_log`
--
ALTER TABLE `raffle_auction_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_log_stall` (`stall_id`),
  ADD KEY `idx_log_raffle` (`raffle_id`),
  ADD KEY `idx_log_auction` (`auction_id`),
  ADD KEY `idx_log_manager` (`performed_by_business_manager`),
  ADD KEY `idx_log_timestamp` (`action_timestamp`);

--
-- Indexes for table `raffle_participants`
--
ALTER TABLE `raffle_participants`
  ADD PRIMARY KEY (`participant_id`),
  ADD UNIQUE KEY `unique_raffle_applicant` (`raffle_id`,`applicant_id`),
  ADD KEY `idx_raffle_participants_raffle` (`raffle_id`),
  ADD KEY `idx_raffle_participants_applicant` (`applicant_id`),
  ADD KEY `fk_raffle_participants_application` (`application_id`);

--
-- Indexes for table `raffle_result`
--
ALTER TABLE `raffle_result`
  ADD PRIMARY KEY (`result_id`),
  ADD UNIQUE KEY `unique_raffle_result` (`raffle_id`),
  ADD KEY `fk_raffle_result_winner` (`winner_applicant_id`),
  ADD KEY `fk_raffle_result_application` (`winner_application_id`),
  ADD KEY `fk_raffle_result_manager` (`awarded_by_business_manager`);

--
-- Indexes for table `section`
--
ALTER TABLE `section`
  ADD PRIMARY KEY (`section_id`),
  ADD KEY `floor_id` (`floor_id`);

--
-- Indexes for table `spouse`
--
ALTER TABLE `spouse`
  ADD PRIMARY KEY (`spouse_id`),
  ADD KEY `applicant_id` (`applicant_id`);

--
-- Indexes for table `stall`
--
ALTER TABLE `stall`
  ADD PRIMARY KEY (`stall_id`),
  ADD UNIQUE KEY `unique_stall_per_section` (`section_id`,`stall_no`),
  ADD KEY `section_id` (`section_id`),
  ADD KEY `floor_id` (`floor_id`),
  ADD KEY `idx_stall_availability` (`is_available`,`status`),
  ADD KEY `idx_raffle_auction_status` (`price_type`,`raffle_auction_status`,`raffle_auction_end_time`),
  ADD KEY `fk_stall_created_by_manager` (`created_by_business_manager`);

--
-- Indexes for table `stallholder`
--
ALTER TABLE `stallholder`
  ADD PRIMARY KEY (`stallholder_id`),
  ADD KEY `applicant_id` (`applicant_id`),
  ADD KEY `fk_stallholder_branch` (`branch_id`),
  ADD KEY `fk_stallholder_stall` (`stall_id`),
  ADD KEY `fk_stallholder_created_by` (`created_by_business_manager`);

--
-- Indexes for table `stallholder_documents`
--
ALTER TABLE `stallholder_documents`
  ADD PRIMARY KEY (`document_id`),
  ADD UNIQUE KEY `unique_stallholder_document` (`stallholder_id`,`document_type_id`),
  ADD KEY `idx_stallholder_docs` (`stallholder_id`),
  ADD KEY `idx_document_type` (`document_type_id`),
  ADD KEY `idx_verification_status` (`verification_status`),
  ADD KEY `idx_verified_by` (`verified_by`);

--
-- Indexes for table `stallholder_document_submissions`
--
ALTER TABLE `stallholder_document_submissions`
  ADD PRIMARY KEY (`submission_id`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `idx_stallholder_owner` (`stallholder_id`,`owner_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_requirement` (`requirement_id`);

--
-- Indexes for table `stall_applications`
--
ALTER TABLE `stall_applications`
  ADD PRIMARY KEY (`application_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `idx_stallholder_app` (`stallholder_id`),
  ADD KEY `idx_owner_status_app` (`owner_id`,`status`),
  ADD KEY `idx_stall_app` (`stall_id`),
  ADD KEY `idx_status_app` (`status`);

--
-- Indexes for table `stall_business_owner`
--
ALTER TABLE `stall_business_owner`
  ADD PRIMARY KEY (`business_owner_id`),
  ADD UNIQUE KEY `owner_username` (`owner_username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_owner_created_by` (`created_by_system_admin`),
  ADD KEY `idx_subscription_status` (`subscription_status`),
  ADD KEY `idx_primary_manager` (`primary_manager_id`);

--
-- Indexes for table `stall_images`
--
ALTER TABLE `stall_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_stall_id` (`stall_id`),
  ADD KEY `idx_display_order` (`display_order`);

--
-- Indexes for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `subscription_id` (`subscription_id`),
  ADD KEY `processed_by_system_admin` (`processed_by_system_admin`),
  ADD KEY `idx_business_owner` (`business_owner_id`),
  ADD KEY `idx_payment_date` (`payment_date`),
  ADD KEY `idx_status` (`payment_status`),
  ADD KEY `idx_period` (`payment_period_start`,`payment_period_end`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`plan_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `system_administrator`
--
ALTER TABLE `system_administrator`
  ADD PRIMARY KEY (`system_admin_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `violation`
--
ALTER TABLE `violation`
  ADD PRIMARY KEY (`violation_id`);

--
-- Indexes for table `violation_penalty`
--
ALTER TABLE `violation_penalty`
  ADD PRIMARY KEY (`penalty_id`),
  ADD KEY `violation_id` (`violation_id`);

--
-- Indexes for table `violation_report`
--
ALTER TABLE `violation_report`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `violation_id` (`violation_id`),
  ADD KEY `stallholder_id` (`stallholder_id`),
  ADD KEY `inspector_id` (`inspector_id`),
  ADD KEY `stall_id` (`stall_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `fk_report_penalty` (`penalty_id`),
  ADD KEY `idx_compliance_type` (`compliance_type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_date_reported` (`date_reported`),
  ADD KEY `idx_severity` (`severity`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `applicant`
--
ALTER TABLE `applicant`
  MODIFY `applicant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `applicant_documents`
--
ALTER TABLE `applicant_documents`
  MODIFY `document_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auction`
--
ALTER TABLE `auction`
  MODIFY `auction_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auction_bids`
--
ALTER TABLE `auction_bids`
  MODIFY `bid_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auction_result`
--
ALTER TABLE `auction_result`
  MODIFY `result_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `branch`
--
ALTER TABLE `branch`
  MODIFY `branch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `branch_document_requirements`
--
ALTER TABLE `branch_document_requirements`
  MODIFY `requirement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `business_employee`
--
ALTER TABLE `business_employee`
  MODIFY `business_employee_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `business_information`
--
ALTER TABLE `business_information`
  MODIFY `business_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `business_manager`
--
ALTER TABLE `business_manager`
  MODIFY `business_manager_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `business_owner_managers`
--
ALTER TABLE `business_owner_managers`
  MODIFY `relationship_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `business_owner_subscriptions`
--
ALTER TABLE `business_owner_subscriptions`
  MODIFY `subscription_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `collector`
--
ALTER TABLE `collector`
  MODIFY `collector_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `collector_action_log`
--
ALTER TABLE `collector_action_log`
  MODIFY `action_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `collector_assignment`
--
ALTER TABLE `collector_assignment`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `complaint`
--
ALTER TABLE `complaint`
  MODIFY `complaint_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `credential`
--
ALTER TABLE `credential`
  MODIFY `registrationid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `document_types`
--
ALTER TABLE `document_types`
  MODIFY `document_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `employee_activity_log`
--
ALTER TABLE `employee_activity_log`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_credential_log`
--
ALTER TABLE `employee_credential_log`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_email_template`
--
ALTER TABLE `employee_email_template`
  MODIFY `template_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `employee_password_reset`
--
ALTER TABLE `employee_password_reset`
  MODIFY `reset_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_session`
--
ALTER TABLE `employee_session`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `floor`
--
ALTER TABLE `floor`
  MODIFY `floor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `inspector`
--
ALTER TABLE `inspector`
  MODIFY `inspector_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `inspector_action_log`
--
ALTER TABLE `inspector_action_log`
  MODIFY `action_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `inspector_assignment`
--
ALTER TABLE `inspector_assignment`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `migration_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `other_information`
--
ALTER TABLE `other_information`
  MODIFY `other_info_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payment_status_log`
--
ALTER TABLE `payment_status_log`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `raffle`
--
ALTER TABLE `raffle`
  MODIFY `raffle_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `raffle_auction_log`
--
ALTER TABLE `raffle_auction_log`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `raffle_participants`
--
ALTER TABLE `raffle_participants`
  MODIFY `participant_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `raffle_result`
--
ALTER TABLE `raffle_result`
  MODIFY `result_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `section`
--
ALTER TABLE `section`
  MODIFY `section_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `spouse`
--
ALTER TABLE `spouse`
  MODIFY `spouse_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `stall`
--
ALTER TABLE `stall`
  MODIFY `stall_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `stallholder`
--
ALTER TABLE `stallholder`
  MODIFY `stallholder_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `stallholder_documents`
--
ALTER TABLE `stallholder_documents`
  MODIFY `document_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stallholder_document_submissions`
--
ALTER TABLE `stallholder_document_submissions`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stall_applications`
--
ALTER TABLE `stall_applications`
  MODIFY `application_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stall_business_owner`
--
ALTER TABLE `stall_business_owner`
  MODIFY `business_owner_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `stall_images`
--
ALTER TABLE `stall_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `plan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `system_administrator`
--
ALTER TABLE `system_administrator`
  MODIFY `system_admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `violation`
--
ALTER TABLE `violation`
  MODIFY `violation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `violation_penalty`
--
ALTER TABLE `violation_penalty`
  MODIFY `penalty_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `violation_report`
--
ALTER TABLE `violation_report`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `applicant_documents`
--
ALTER TABLE `applicant_documents`
  ADD CONSTRAINT `fk_applicant_doc_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_applicant_doc_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_applicant_doc_owner` FOREIGN KEY (`business_owner_id`) REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_applicant_doc_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`document_type_id`) ON DELETE CASCADE;

--
-- Constraints for table `application`
--
ALTER TABLE `application`
  ADD CONSTRAINT `application_ibfk_1` FOREIGN KEY (`stall_id`) REFERENCES `stall` (`stall_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `application_ibfk_2` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE;

--
-- Constraints for table `auction`
--
ALTER TABLE `auction`
  ADD CONSTRAINT `fk_auction_business_manager` FOREIGN KEY (`created_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_auction_highest_bidder` FOREIGN KEY (`highest_bidder_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_auction_stall` FOREIGN KEY (`stall_id`) REFERENCES `stall` (`stall_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_auction_winner` FOREIGN KEY (`winner_applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE SET NULL;

--
-- Constraints for table `auction_bids`
--
ALTER TABLE `auction_bids`
  ADD CONSTRAINT `fk_auction_bids_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_auction_bids_application` FOREIGN KEY (`application_id`) REFERENCES `application` (`application_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_auction_bids_auction` FOREIGN KEY (`auction_id`) REFERENCES `auction` (`auction_id`) ON DELETE CASCADE;

--
-- Constraints for table `auction_result`
--
ALTER TABLE `auction_result`
  ADD CONSTRAINT `fk_auction_result_application` FOREIGN KEY (`winner_application_id`) REFERENCES `application` (`application_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_auction_result_auction` FOREIGN KEY (`auction_id`) REFERENCES `auction` (`auction_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_auction_result_business_manager` FOREIGN KEY (`awarded_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_auction_result_winner` FOREIGN KEY (`winner_applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE;

--
-- Constraints for table `branch`
--
ALTER TABLE `branch`
  ADD CONSTRAINT `fk_branch_owner` FOREIGN KEY (`business_owner_id`) REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE CASCADE;

--
-- Constraints for table `branch_document_requirements`
--
ALTER TABLE `branch_document_requirements`
  ADD CONSTRAINT `fk_branch_doc_req_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_branch_doc_req_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`document_type_id`) ON DELETE CASCADE;

--
-- Constraints for table `business_employee`
--
ALTER TABLE `business_employee`
  ADD CONSTRAINT `fk_business_employee_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_business_employee_manager` FOREIGN KEY (`created_by_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL;

--
-- Constraints for table `business_information`
--
ALTER TABLE `business_information`
  ADD CONSTRAINT `business_information_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE;

--
-- Constraints for table `business_manager`
--
ALTER TABLE `business_manager`
  ADD CONSTRAINT `fk_business_manager_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_manager_created_by_owner` FOREIGN KEY (`created_by_owner`) REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE SET NULL;

--
-- Constraints for table `business_owner_managers`
--
ALTER TABLE `business_owner_managers`
  ADD CONSTRAINT `fk_owner_manager_admin` FOREIGN KEY (`assigned_by_system_admin`) REFERENCES `system_administrator` (`system_admin_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_owner_manager_manager` FOREIGN KEY (`business_manager_id`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_owner_manager_owner` FOREIGN KEY (`business_owner_id`) REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE CASCADE;

--
-- Constraints for table `business_owner_subscriptions`
--
ALTER TABLE `business_owner_subscriptions`
  ADD CONSTRAINT `business_owner_subscriptions_ibfk_1` FOREIGN KEY (`business_owner_id`) REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `business_owner_subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`plan_id`),
  ADD CONSTRAINT `business_owner_subscriptions_ibfk_3` FOREIGN KEY (`created_by_system_admin`) REFERENCES `system_administrator` (`system_admin_id`);

--
-- Constraints for table `collector_action_log`
--
ALTER TABLE `collector_action_log`
  ADD CONSTRAINT `fk_collector_action_log` FOREIGN KEY (`collector_id`) REFERENCES `collector` (`collector_id`) ON DELETE CASCADE;

--
-- Constraints for table `collector_assignment`
--
ALTER TABLE `collector_assignment`
  ADD CONSTRAINT `fk_collector_assignment` FOREIGN KEY (`collector_id`) REFERENCES `collector` (`collector_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_collector_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE CASCADE;

--
-- Constraints for table `credential`
--
ALTER TABLE `credential`
  ADD CONSTRAINT `credential_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE;

--
-- Constraints for table `employee_activity_log`
--
ALTER TABLE `employee_activity_log`
  ADD CONSTRAINT `fk_activity_log_employee` FOREIGN KEY (`business_employee_id`) REFERENCES `business_employee` (`business_employee_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_activity_log_manager` FOREIGN KEY (`performed_by_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL;

--
-- Constraints for table `employee_credential_log`
--
ALTER TABLE `employee_credential_log`
  ADD CONSTRAINT `fk_credential_log_employee` FOREIGN KEY (`business_employee_id`) REFERENCES `business_employee` (`business_employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_credential_log_manager` FOREIGN KEY (`generated_by_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL;

--
-- Constraints for table `employee_password_reset`
--
ALTER TABLE `employee_password_reset`
  ADD CONSTRAINT `fk_password_reset_employee` FOREIGN KEY (`business_employee_id`) REFERENCES `business_employee` (`business_employee_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_password_reset_manager` FOREIGN KEY (`requested_by_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL;

--
-- Constraints for table `employee_session`
--
ALTER TABLE `employee_session`
  ADD CONSTRAINT `fk_employee_session_employee` FOREIGN KEY (`business_employee_id`) REFERENCES `business_employee` (`business_employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `floor`
--
ALTER TABLE `floor`
  ADD CONSTRAINT `floor_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE CASCADE;

--
-- Constraints for table `inspector_action_log`
--
ALTER TABLE `inspector_action_log`
  ADD CONSTRAINT `fk_inspector_action_log_manager` FOREIGN KEY (`business_manager_id`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `inspector_action_log_ibfk_1` FOREIGN KEY (`inspector_id`) REFERENCES `inspector` (`inspector_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inspector_action_log_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `inspector_assignment`
--
ALTER TABLE `inspector_assignment`
  ADD CONSTRAINT `inspector_assignment_ibfk_1` FOREIGN KEY (`inspector_id`) REFERENCES `inspector` (`inspector_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inspector_assignment_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `other_information`
--
ALTER TABLE `other_information`
  ADD CONSTRAINT `other_information_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payment_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payment_stallholder` FOREIGN KEY (`stallholder_id`) REFERENCES `stallholder` (`stallholder_id`) ON DELETE CASCADE;

--
-- Constraints for table `raffle`
--
ALTER TABLE `raffle`
  ADD CONSTRAINT `fk_raffle_business_manager` FOREIGN KEY (`created_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_raffle_stall` FOREIGN KEY (`stall_id`) REFERENCES `stall` (`stall_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_raffle_winner` FOREIGN KEY (`winner_applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE SET NULL;

--
-- Constraints for table `raffle_auction_log`
--
ALTER TABLE `raffle_auction_log`
  ADD CONSTRAINT `fk_log_auction` FOREIGN KEY (`auction_id`) REFERENCES `auction` (`auction_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_log_business_manager` FOREIGN KEY (`performed_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_log_raffle` FOREIGN KEY (`raffle_id`) REFERENCES `raffle` (`raffle_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_log_stall` FOREIGN KEY (`stall_id`) REFERENCES `stall` (`stall_id`) ON DELETE CASCADE;

--
-- Constraints for table `raffle_participants`
--
ALTER TABLE `raffle_participants`
  ADD CONSTRAINT `fk_raffle_participants_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_raffle_participants_application` FOREIGN KEY (`application_id`) REFERENCES `application` (`application_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_raffle_participants_raffle` FOREIGN KEY (`raffle_id`) REFERENCES `raffle` (`raffle_id`) ON DELETE CASCADE;

--
-- Constraints for table `raffle_result`
--
ALTER TABLE `raffle_result`
  ADD CONSTRAINT `fk_raffle_result_application` FOREIGN KEY (`winner_application_id`) REFERENCES `application` (`application_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_raffle_result_business_manager` FOREIGN KEY (`awarded_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_raffle_result_raffle` FOREIGN KEY (`raffle_id`) REFERENCES `raffle` (`raffle_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_raffle_result_winner` FOREIGN KEY (`winner_applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE;

--
-- Constraints for table `section`
--
ALTER TABLE `section`
  ADD CONSTRAINT `section_ibfk_1` FOREIGN KEY (`floor_id`) REFERENCES `floor` (`floor_id`) ON DELETE CASCADE;

--
-- Constraints for table `spouse`
--
ALTER TABLE `spouse`
  ADD CONSTRAINT `spouse_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE;

--
-- Constraints for table `stall`
--
ALTER TABLE `stall`
  ADD CONSTRAINT `fk_stall_created_by_manager` FOREIGN KEY (`created_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `stall_floor_fk` FOREIGN KEY (`floor_id`) REFERENCES `floor` (`floor_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stall_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `section` (`section_id`) ON DELETE CASCADE;

--
-- Constraints for table `stallholder`
--
ALTER TABLE `stallholder`
  ADD CONSTRAINT `fk_stallholder_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_stallholder_created_by_manager` FOREIGN KEY (`created_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_stallholder_stall` FOREIGN KEY (`stall_id`) REFERENCES `stall` (`stall_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `stallholder_ibfk_1` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE;

--
-- Constraints for table `stallholder_documents`
--
ALTER TABLE `stallholder_documents`
  ADD CONSTRAINT `fk_document_stallholder` FOREIGN KEY (`stallholder_id`) REFERENCES `stallholder` (`stallholder_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_document_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`document_type_id`) ON DELETE CASCADE;

--
-- Constraints for table `stallholder_document_submissions`
--
ALTER TABLE `stallholder_document_submissions`
  ADD CONSTRAINT `stallholder_document_submissions_ibfk_1` FOREIGN KEY (`stallholder_id`) REFERENCES `stallholder` (`stallholder_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stallholder_document_submissions_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stallholder_document_submissions_ibfk_4` FOREIGN KEY (`reviewed_by`) REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE SET NULL;

--
-- Constraints for table `stall_applications`
--
ALTER TABLE `stall_applications`
  ADD CONSTRAINT `stall_applications_ibfk_1` FOREIGN KEY (`stallholder_id`) REFERENCES `stallholder` (`stallholder_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stall_applications_ibfk_2` FOREIGN KEY (`stall_id`) REFERENCES `stall` (`stall_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stall_applications_ibfk_3` FOREIGN KEY (`owner_id`) REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stall_applications_ibfk_4` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stall_applications_ibfk_5` FOREIGN KEY (`reviewed_by`) REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE SET NULL;

--
-- Constraints for table `stall_business_owner`
--
ALTER TABLE `stall_business_owner`
  ADD CONSTRAINT `fk_owner_created_by_sysadmin` FOREIGN KEY (`created_by_system_admin`) REFERENCES `system_administrator` (`system_admin_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_owner_primary_manager` FOREIGN KEY (`primary_manager_id`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL;

--
-- Constraints for table `stall_images`
--
ALTER TABLE `stall_images`
  ADD CONSTRAINT `stall_images_ibfk_1` FOREIGN KEY (`stall_id`) REFERENCES `stall` (`stall_id`) ON DELETE CASCADE;

--
-- Constraints for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  ADD CONSTRAINT `subscription_payments_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `business_owner_subscriptions` (`subscription_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscription_payments_ibfk_2` FOREIGN KEY (`business_owner_id`) REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscription_payments_ibfk_3` FOREIGN KEY (`processed_by_system_admin`) REFERENCES `system_administrator` (`system_admin_id`);

--
-- Constraints for table `violation_penalty`
--
ALTER TABLE `violation_penalty`
  ADD CONSTRAINT `violation_penalty_ibfk_1` FOREIGN KEY (`violation_id`) REFERENCES `violation` (`violation_id`) ON DELETE CASCADE;

--
-- Constraints for table `violation_report`
--
ALTER TABLE `violation_report`
  ADD CONSTRAINT `fk_penalty_id` FOREIGN KEY (`penalty_id`) REFERENCES `violation_penalty` (`penalty_id`),
  ADD CONSTRAINT `fk_report_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_inspector` FOREIGN KEY (`inspector_id`) REFERENCES `inspector` (`inspector_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_penalty` FOREIGN KEY (`penalty_id`) REFERENCES `violation_penalty` (`penalty_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_stall` FOREIGN KEY (`stall_id`) REFERENCES `stall` (`stall_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_stallholder` FOREIGN KEY (`stallholder_id`) REFERENCES `stallholder` (`stallholder_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_violation` FOREIGN KEY (`violation_id`) REFERENCES `violation` (`violation_id`) ON UPDATE CASCADE;

DELIMITER $$
--
-- Events
--
CREATE DEFINER=`root`@`localhost` EVENT `reset_monthly_payment_status` ON SCHEDULE EVERY 1 MONTH STARTS '2025-12-01 00:01:00' ON COMPLETION PRESERVE ENABLE COMMENT 'Resets stallholder payment status from paid to pending on the 1s' DO BEGIN
                DECLARE reset_count INT DEFAULT 0;
                
                SELECT COUNT(*) INTO reset_count
                FROM stallholder
                WHERE payment_status = 'paid'
                  AND contract_status = 'Active';
                
                UPDATE stallholder
                SET payment_status = 'pending',
                    updated_at = NOW()
                WHERE payment_status = 'paid'
                  AND contract_status = 'Active';
                
                INSERT INTO payment_status_log (
                    reset_date,
                    stallholders_reset_count,
                    reset_type,
                    notes
                ) VALUES (
                    CURDATE(),
                    reset_count,
                    'automatic',
                    CONCAT('Monthly automatic reset on ', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
                );
            END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
