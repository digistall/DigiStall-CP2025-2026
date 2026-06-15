DROP PROCEDURE IF EXISTS getViolationPenaltiesByViolationId;

CREATE DEFINER="doadmin"@"%" PROCEDURE getViolationPenaltiesByViolationId(IN p_violation_id INT)
BEGIN
    SELECT 
        penalty_id,
        violation_id,
        offense_level,
        penalty_amount,
        description
    FROM violation_penalty
    WHERE violation_id = p_violation_id;
END;
