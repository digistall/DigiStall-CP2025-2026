DROP PROCEDURE IF EXISTS checkComplianceRecordExists;

CREATE DEFINER="doadmin"@"%" PROCEDURE checkComplianceRecordExists(IN p_report_id INT)
BEGIN
    SELECT COUNT(*) as record_exists FROM violation_report WHERE report_id = p_report_id;
END;
