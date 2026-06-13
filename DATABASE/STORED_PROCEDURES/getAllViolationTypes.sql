DROP PROCEDURE IF EXISTS getAllViolationTypes;

CREATE DEFINER="doadmin"@"%" PROCEDURE getAllViolationTypes()
BEGIN
    SELECT 
        violation_id,
        violation_type,
        description as details
    FROM violation
    WHERE status = 'Active';
END;
