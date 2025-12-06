-- ============================================
-- AUTO RESET AUTO_INCREMENT AFTER DELETE
-- ============================================
-- This migration creates triggers that automatically reset
-- AUTO_INCREMENT to continue from the last existing ID
-- after any row is deleted.
-- 
-- Example: If you have IDs 1,2,3,4,5 and delete ID 5,
-- the next insert will be ID 5 (not 6)
-- ============================================

DELIMITER //

-- ============================================
-- HELPER PROCEDURE: Reset auto_increment for any table
-- ============================================
DROP PROCEDURE IF EXISTS ResetAutoIncrement//

CREATE PROCEDURE ResetAutoIncrement(IN tbl_name VARCHAR(100), IN pk_column VARCHAR(100))
BEGIN
    SET @max_id = 0;
    SET @sql = CONCAT('SELECT COALESCE(MAX(', pk_column, '), 0) INTO @max_id FROM ', tbl_name);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    SET @new_auto = @max_id + 1;
    SET @alter_sql = CONCAT('ALTER TABLE ', tbl_name, ' AUTO_INCREMENT = ', @new_auto);
    PREPARE alter_stmt FROM @alter_sql;
    EXECUTE alter_stmt;
    DEALLOCATE PREPARE alter_stmt;
END//

-- ============================================
-- TRIGGERS FOR EACH TABLE
-- ============================================

-- APPLICANT
DROP TRIGGER IF EXISTS trg_applicant_reset_auto//
CREATE TRIGGER trg_applicant_reset_auto
AFTER DELETE ON applicant
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('applicant', 'applicant_id');
END//

-- APPLICANT_DOCUMENTS
DROP TRIGGER IF EXISTS trg_applicant_documents_reset_auto//
CREATE TRIGGER trg_applicant_documents_reset_auto
AFTER DELETE ON applicant_documents
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('applicant_documents', 'document_id');
END//

-- AUCTION
DROP TRIGGER IF EXISTS trg_auction_reset_auto//
CREATE TRIGGER trg_auction_reset_auto
AFTER DELETE ON auction
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('auction', 'auction_id');
END//

-- AUCTION_BIDS
DROP TRIGGER IF EXISTS trg_auction_bids_reset_auto//
CREATE TRIGGER trg_auction_bids_reset_auto
AFTER DELETE ON auction_bids
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('auction_bids', 'bid_id');
END//

-- AUCTION_RESULT
DROP TRIGGER IF EXISTS trg_auction_result_reset_auto//
CREATE TRIGGER trg_auction_result_reset_auto
AFTER DELETE ON auction_result
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('auction_result', 'result_id');
END//

-- BRANCH
DROP TRIGGER IF EXISTS trg_branch_reset_auto//
CREATE TRIGGER trg_branch_reset_auto
AFTER DELETE ON branch
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('branch', 'branch_id');
END//

-- BRANCH_DOCUMENT_REQUIREMENTS
DROP TRIGGER IF EXISTS trg_branch_document_requirements_reset_auto//
CREATE TRIGGER trg_branch_document_requirements_reset_auto
AFTER DELETE ON branch_document_requirements
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('branch_document_requirements', 'requirement_id');
END//

-- BUSINESS_EMPLOYEE
DROP TRIGGER IF EXISTS trg_business_employee_reset_auto//
CREATE TRIGGER trg_business_employee_reset_auto
AFTER DELETE ON business_employee
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('business_employee', 'business_employee_id');
END//

-- BUSINESS_INFORMATION
DROP TRIGGER IF EXISTS trg_business_information_reset_auto//
CREATE TRIGGER trg_business_information_reset_auto
AFTER DELETE ON business_information
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('business_information', 'business_id');
END//

-- BUSINESS_MANAGER
DROP TRIGGER IF EXISTS trg_business_manager_reset_auto//
CREATE TRIGGER trg_business_manager_reset_auto
AFTER DELETE ON business_manager
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('business_manager', 'business_manager_id');
END//

-- BUSINESS_OWNER_MANAGERS
DROP TRIGGER IF EXISTS trg_business_owner_managers_reset_auto//
CREATE TRIGGER trg_business_owner_managers_reset_auto
AFTER DELETE ON business_owner_managers
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('business_owner_managers', 'relationship_id');
END//

-- BUSINESS_OWNER_SUBSCRIPTIONS
DROP TRIGGER IF EXISTS trg_business_owner_subscriptions_reset_auto//
CREATE TRIGGER trg_business_owner_subscriptions_reset_auto
AFTER DELETE ON business_owner_subscriptions
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('business_owner_subscriptions', 'subscription_id');
END//

-- COMPLAINT
DROP TRIGGER IF EXISTS trg_complaint_reset_auto//
CREATE TRIGGER trg_complaint_reset_auto
AFTER DELETE ON complaint
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('complaint', 'complaint_id');
END//

-- CREDENTIAL
DROP TRIGGER IF EXISTS trg_credential_reset_auto//
CREATE TRIGGER trg_credential_reset_auto
AFTER DELETE ON credential
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('credential', 'registrationid');
END//

-- DOCUMENT_TYPES
DROP TRIGGER IF EXISTS trg_document_types_reset_auto//
CREATE TRIGGER trg_document_types_reset_auto
AFTER DELETE ON document_types
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('document_types', 'document_type_id');
END//

-- EMPLOYEE_ACTIVITY_LOG
DROP TRIGGER IF EXISTS trg_employee_activity_log_reset_auto//
CREATE TRIGGER trg_employee_activity_log_reset_auto
AFTER DELETE ON employee_activity_log
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('employee_activity_log', 'log_id');
END//

-- EMPLOYEE_CREDENTIAL_LOG
DROP TRIGGER IF EXISTS trg_employee_credential_log_reset_auto//
CREATE TRIGGER trg_employee_credential_log_reset_auto
AFTER DELETE ON employee_credential_log
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('employee_credential_log', 'log_id');
END//

-- EMPLOYEE_EMAIL_TEMPLATE
DROP TRIGGER IF EXISTS trg_employee_email_template_reset_auto//
CREATE TRIGGER trg_employee_email_template_reset_auto
AFTER DELETE ON employee_email_template
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('employee_email_template', 'template_id');
END//

-- EMPLOYEE_PASSWORD_RESET
DROP TRIGGER IF EXISTS trg_employee_password_reset_reset_auto//
CREATE TRIGGER trg_employee_password_reset_reset_auto
AFTER DELETE ON employee_password_reset
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('employee_password_reset', 'reset_id');
END//

-- EMPLOYEE_SESSION
DROP TRIGGER IF EXISTS trg_employee_session_reset_auto//
CREATE TRIGGER trg_employee_session_reset_auto
AFTER DELETE ON employee_session
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('employee_session', 'session_id');
END//

-- FLOOR
DROP TRIGGER IF EXISTS trg_floor_reset_auto//
CREATE TRIGGER trg_floor_reset_auto
AFTER DELETE ON floor
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('floor', 'floor_id');
END//

-- INSPECTOR
DROP TRIGGER IF EXISTS trg_inspector_reset_auto//
CREATE TRIGGER trg_inspector_reset_auto
AFTER DELETE ON inspector
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('inspector', 'inspector_id');
END//

-- INSPECTOR_ACTION_LOG
DROP TRIGGER IF EXISTS trg_inspector_action_log_reset_auto//
CREATE TRIGGER trg_inspector_action_log_reset_auto
AFTER DELETE ON inspector_action_log
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('inspector_action_log', 'action_id');
END//

-- INSPECTOR_ASSIGNMENT
DROP TRIGGER IF EXISTS trg_inspector_assignment_reset_auto//
CREATE TRIGGER trg_inspector_assignment_reset_auto
AFTER DELETE ON inspector_assignment
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('inspector_assignment', 'assignment_id');
END//

-- OTHER_INFORMATION
DROP TRIGGER IF EXISTS trg_other_information_reset_auto//
CREATE TRIGGER trg_other_information_reset_auto
AFTER DELETE ON other_information
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('other_information', 'other_info_id');
END//

-- PAYMENT_STATUS_LOG
DROP TRIGGER IF EXISTS trg_payment_status_log_reset_auto//
CREATE TRIGGER trg_payment_status_log_reset_auto
AFTER DELETE ON payment_status_log
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('payment_status_log', 'log_id');
END//

-- PAYMENTS
DROP TRIGGER IF EXISTS trg_payments_reset_auto//
CREATE TRIGGER trg_payments_reset_auto
AFTER DELETE ON payments
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('payments', 'payment_id');
END//

-- RAFFLE
DROP TRIGGER IF EXISTS trg_raffle_reset_auto//
CREATE TRIGGER trg_raffle_reset_auto
AFTER DELETE ON raffle
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('raffle', 'raffle_id');
END//

-- RAFFLE_AUCTION_LOG
DROP TRIGGER IF EXISTS trg_raffle_auction_log_reset_auto//
CREATE TRIGGER trg_raffle_auction_log_reset_auto
AFTER DELETE ON raffle_auction_log
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('raffle_auction_log', 'log_id');
END//

-- RAFFLE_PARTICIPANTS
DROP TRIGGER IF EXISTS trg_raffle_participants_reset_auto//
CREATE TRIGGER trg_raffle_participants_reset_auto
AFTER DELETE ON raffle_participants
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('raffle_participants', 'participant_id');
END//

-- RAFFLE_RESULT
DROP TRIGGER IF EXISTS trg_raffle_result_reset_auto//
CREATE TRIGGER trg_raffle_result_reset_auto
AFTER DELETE ON raffle_result
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('raffle_result', 'result_id');
END//

-- SECTION
DROP TRIGGER IF EXISTS trg_section_reset_auto//
CREATE TRIGGER trg_section_reset_auto
AFTER DELETE ON section
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('section', 'section_id');
END//

-- SPOUSE
DROP TRIGGER IF EXISTS trg_spouse_reset_auto//
CREATE TRIGGER trg_spouse_reset_auto
AFTER DELETE ON spouse
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('spouse', 'spouse_id');
END//

-- STALL
DROP TRIGGER IF EXISTS trg_stall_reset_auto//
CREATE TRIGGER trg_stall_reset_auto
AFTER DELETE ON stall
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('stall', 'stall_id');
END//

-- STALL_APPLICATIONS
DROP TRIGGER IF EXISTS trg_stall_applications_reset_auto//
CREATE TRIGGER trg_stall_applications_reset_auto
AFTER DELETE ON stall_applications
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('stall_applications', 'application_id');
END//

-- STALL_BUSINESS_OWNER
DROP TRIGGER IF EXISTS trg_stall_business_owner_reset_auto//
CREATE TRIGGER trg_stall_business_owner_reset_auto
AFTER DELETE ON stall_business_owner
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('stall_business_owner', 'business_owner_id');
END//

-- STALLHOLDER
DROP TRIGGER IF EXISTS trg_stallholder_reset_auto//
CREATE TRIGGER trg_stallholder_reset_auto
AFTER DELETE ON stallholder
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('stallholder', 'stallholder_id');
END//

-- STALLHOLDER_DOCUMENT_SUBMISSIONS
DROP TRIGGER IF EXISTS trg_stallholder_document_submissions_reset_auto//
CREATE TRIGGER trg_stallholder_document_submissions_reset_auto
AFTER DELETE ON stallholder_document_submissions
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('stallholder_document_submissions', 'submission_id');
END//

-- STALLHOLDER_DOCUMENTS
DROP TRIGGER IF EXISTS trg_stallholder_documents_reset_auto//
CREATE TRIGGER trg_stallholder_documents_reset_auto
AFTER DELETE ON stallholder_documents
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('stallholder_documents', 'document_id');
END//

-- SUBSCRIPTION_PAYMENTS
DROP TRIGGER IF EXISTS trg_subscription_payments_reset_auto//
CREATE TRIGGER trg_subscription_payments_reset_auto
AFTER DELETE ON subscription_payments
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('subscription_payments', 'payment_id');
END//

-- SUBSCRIPTION_PLANS
DROP TRIGGER IF EXISTS trg_subscription_plans_reset_auto//
CREATE TRIGGER trg_subscription_plans_reset_auto
AFTER DELETE ON subscription_plans
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('subscription_plans', 'plan_id');
END//

-- SYSTEM_ADMINISTRATOR
DROP TRIGGER IF EXISTS trg_system_administrator_reset_auto//
CREATE TRIGGER trg_system_administrator_reset_auto
AFTER DELETE ON system_administrator
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('system_administrator', 'system_admin_id');
END//

-- VIOLATION
DROP TRIGGER IF EXISTS trg_violation_reset_auto//
CREATE TRIGGER trg_violation_reset_auto
AFTER DELETE ON violation
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('violation', 'violation_id');
END//

-- VIOLATION_PENALTY
DROP TRIGGER IF EXISTS trg_violation_penalty_reset_auto//
CREATE TRIGGER trg_violation_penalty_reset_auto
AFTER DELETE ON violation_penalty
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('violation_penalty', 'penalty_id');
END//

-- VIOLATION_REPORT
DROP TRIGGER IF EXISTS trg_violation_report_reset_auto//
CREATE TRIGGER trg_violation_report_reset_auto
AFTER DELETE ON violation_report
FOR EACH ROW
BEGIN
    CALL ResetAutoIncrement('violation_report', 'report_id');
END//

DELIMITER ;

-- ============================================
-- MANUAL RESET PROCEDURE (Run once to fix existing gaps)
-- ============================================
-- Call this to reset all tables at once:
-- CALL ResetAllAutoIncrements();

DROP PROCEDURE IF EXISTS ResetAllAutoIncrements;

DELIMITER //

CREATE PROCEDURE ResetAllAutoIncrements()
BEGIN
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
END//

DELIMITER ;

-- ============================================
-- DONE! 
-- ============================================
-- Triggers are now active. After any DELETE, the auto_increment 
-- will automatically reset to continue from the last existing ID.
--
-- To manually reset all tables now, run:
-- CALL ResetAllAutoIncrements();
-- ============================================

SELECT '✅ Auto-increment reset triggers installed successfully!' AS status;
SELECT 'Run: CALL ResetAllAutoIncrements(); to reset all tables now' AS instruction;
