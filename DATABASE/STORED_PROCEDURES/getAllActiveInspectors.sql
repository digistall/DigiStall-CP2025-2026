DROP PROCEDURE IF EXISTS getAllActiveInspectors;

CREATE DEFINER="doadmin"@"%" PROCEDURE getAllActiveInspectors()
BEGIN
    SELECT 
        inspector_id,
        CONCAT(first_name, ' ', last_name) as inspector_name,
        first_name,
        last_name,
        email,
        contact_number as contact_no,
        status,
        date_hired
    FROM inspector
    WHERE status = 'Active';
END;
