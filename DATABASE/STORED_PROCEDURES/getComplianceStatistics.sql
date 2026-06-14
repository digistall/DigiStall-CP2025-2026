DROP PROCEDURE IF EXISTS getComplianceStatistics;

CREATE DEFINER="doadmin"@"%" PROCEDURE getComplianceStatistics(IN p_branch_id INT)
BEGIN
    SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN vr.status = 'Open' THEN 1 ELSE 0 END) as pending_count,
        0 as in_progress_count,
        SUM(CASE WHEN vr.status = 'Resolved' THEN 1 ELSE 0 END) as complete_count,
        SUM(CASE WHEN vr.status = 'Appealed' THEN 1 ELSE 0 END) as incomplete_count,
        0 as critical_count,
        0 as major_count
    FROM violation_report vr
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    WHERE p_branch_id IS NULL OR sh.branch_id = p_branch_id;
END;
