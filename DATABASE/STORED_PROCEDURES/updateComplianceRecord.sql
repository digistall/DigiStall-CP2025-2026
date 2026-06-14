DROP PROCEDURE IF EXISTS updateComplianceRecord;

CREATE DEFINER="doadmin"@"%" PROCEDURE updateComplianceRecord(
    IN p_report_id INT,
    IN p_status VARCHAR(50),
    IN p_remarks TEXT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_db_status VARCHAR(50);
    
    IF p_status = 'complete' THEN
        SET v_db_status = 'Resolved';
    ELSE
        SET v_db_status = 'Open';
    END IF;

    UPDATE violation_report
    SET 
        status = v_db_status,
        remarks = COALESCE(p_remarks, remarks)
    WHERE report_id = p_report_id;
    
    -- Update overall compliance status of the stallholder
    UPDATE stallholder sh
    SET sh.compliance_status = CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM violation_report vr 
            WHERE vr.stallholder_id = sh.stallholder_id 
              AND vr.status = 'Open'
        ) THEN 'Non-Compliant'
        ELSE 'Compliant'
    END
    WHERE sh.stallholder_id = (SELECT stallholder_id FROM violation_report WHERE report_id = p_report_id);
END;
