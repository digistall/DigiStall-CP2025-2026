DROP PROCEDURE IF EXISTS deleteComplianceRecord;

CREATE DEFINER="doadmin"@"%" PROCEDURE deleteComplianceRecord(IN p_report_id INT)
BEGIN
    DECLARE v_stallholder_id INT;
    
    SELECT stallholder_id INTO v_stallholder_id 
    FROM violation_report 
    WHERE report_id = p_report_id;

    DELETE FROM violation_report WHERE report_id = p_report_id;

    -- Update overall compliance status of the stallholder
    IF v_stallholder_id IS NOT NULL THEN
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
        WHERE sh.stallholder_id = v_stallholder_id;
    END IF;
END;
