-- Migration: 120_ResetAllAutoIncrements.sql
-- Description: ResetAllAutoIncrements stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `ResetAllAutoIncrements`$$

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
    
    SELECT 'âœ… All auto_increments have been reset!' AS result;
END$$

DELIMITER ;
