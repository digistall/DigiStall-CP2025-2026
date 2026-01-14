-- Migration: 523_sp_getRaffleParticipantsByStall.sql
-- Description: Stored procedure to get raffle participants by stall ID
-- Date: 2026-01-11
-- Author: DigiStall System

DELIMITER //

-- SP: sp_getRaffleParticipantsByStall
-- Gets all participants who joined a raffle for a specific stall
-- This is used by the "Manage Raffle" feature in the admin web app
DROP PROCEDURE IF EXISTS sp_getRaffleParticipantsByStall//
CREATE PROCEDURE sp_getRaffleParticipantsByStall(
    IN p_stall_id INT
)
BEGIN
    DECLARE v_raffle_id INT DEFAULT NULL;
    
    -- Get the latest raffle for this stall
    SELECT raffle_id INTO v_raffle_id
    FROM raffle 
    WHERE stall_id = p_stall_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Return stall info
    SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        s.price_type,
        s.raffle_auction_status,
        s.raffle_auction_start_time,
        s.raffle_auction_end_time,
        b.branch_name,
        f.floor_name,
        sec.section_name
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE s.stall_id = p_stall_id;
    
    -- Return raffle info (if exists)
    SELECT 
        r.raffle_id,
        r.raffle_status,
        r.total_participants,
        r.start_time,
        r.end_time,
        r.winner_applicant_id,
        r.created_at
    FROM raffle r
    WHERE r.raffle_id = v_raffle_id;
    
    -- Return participants (if raffle exists)
    IF v_raffle_id IS NOT NULL THEN
        SELECT 
            rp.participant_id,
            rp.applicant_id,
            rp.application_id,
            rp.participation_time,
            rp.is_winner,
            rp.created_at as joined_at,
            a.applicant_full_name,
            a.applicant_contact_number,
            a.applicant_address,
            a.applicant_email,
            app.application_date,
            app.business_name,
            app.business_type,
            app.application_status
        FROM raffle_participants rp
        INNER JOIN applicant a ON rp.applicant_id = a.applicant_id
        LEFT JOIN stall_application app ON rp.application_id = app.application_id
        WHERE rp.raffle_id = v_raffle_id
        ORDER BY rp.participation_time ASC;
    END IF;
END//

DELIMITER ;

-- To run this migration on DigitalOcean:
-- 1. Connect to your MySQL database
-- 2. Run this SQL file
-- Or use: mysql -h <host> -u <user> -p <database> < 523_sp_getRaffleParticipantsByStall.sql
