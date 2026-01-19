-- Fix getStallholderById stored procedure to include business information
-- Note: stallholder.mobile_user_id links to applicant.applicant_id which links to business_information

DROP PROCEDURE IF EXISTS getStallholderById;

DELIMITER $$

CREATE PROCEDURE getStallholderById(IN p_stallholder_id INT)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.mobile_user_id,
        sh.branch_id,
        b.branch_name,
        sh.full_name as stallholder_name,
        bi.nature_of_business,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.stall_id,
        st.stall_number,
        st.stall_name,
        st.stall_type,
        sh.move_in_date as contract_start_date,
        sh.payment_status,
        sh.status,
        sh.last_login,
        sh.created_at,
        sh.updated_at,
        -- Get rental info from stall table
        s.rental_price as monthly_rent
    FROM stallholder sh
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN business_information bi ON sh.mobile_user_id = bi.applicant_id
    WHERE sh.stallholder_id = p_stallholder_id;
END$$

DELIMITER ;
