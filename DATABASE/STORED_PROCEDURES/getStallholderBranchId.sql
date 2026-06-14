DROP PROCEDURE IF EXISTS getStallholderBranchId;

CREATE DEFINER="doadmin"@"%" PROCEDURE getStallholderBranchId(IN p_stallholder_id INT)
BEGIN
    SELECT branch_id FROM stallholder WHERE stallholder_id = p_stallholder_id;
END;
