-- ===================================================================
-- Sample Compliance Data for Testing
-- Description: Adds realistic compliance/violation records for testing
-- ===================================================================

-- First, let's make sure we have the migration applied
-- (This will fail gracefully if already exists)

-- Insert additional sample compliance records with various statuses and severities
INSERT INTO `violation_report` 
  (inspector_id, stallholder_id, violation_id, stall_id, branch_id, 
   compliance_type, severity, evidence, date_reported, remarks, 
   status, offense_no, penalty_id, resolved_date, resolved_by)
VALUES
  -- Completed compliance checks
  (2, 12, 2, 54, 1, 
   'Waste Segregation / Anti-Littering', 'minor', NULL, 
   '2025-11-01 09:00:00', 
   'Improper waste segregation. Resolved after warning.',
   'complete', 1, 5, '2025-11-05 14:30:00', 1),
   
  (2, 14, 1, 57, 1,
   'Illegal Vending', 'moderate', NULL,
   '2025-11-03 10:30:00',
   'Merchandise displayed outside designated stall area. Corrected immediately.',
   'complete', 1, 1, '2025-11-03 15:00:00', 1),
   
  -- Pending compliance issues
  (2, 15, 3, 58, 1,
   'Anti-Smoking', 'major', NULL,
   '2025-11-10 14:00:00',
   'Customer caught smoking inside stall area. First offense warning issued.',
   'pending', 1, 8, NULL, NULL),
   
  (2, 16, 2, 55, 1,
   'Waste Segregation / Anti-Littering', 'moderate', NULL,
   '2025-11-12 11:00:00',
   'Multiple violations of waste disposal rules. Awaiting correction.',
   'pending', 2, 6, NULL, NULL),
   
  -- In-progress compliance items
  (2, 17, 1, 91, 3,
   'Illegal Vending', 'moderate', NULL,
   '2025-11-08 08:30:00',
   'Extended stall area into walkway. Correction in progress.',
   'in-progress', 1, 1, NULL, NULL),
   
  (2, 18, 2, 93, 3,
   'Waste Segregation / Anti-Littering', 'major', NULL,
   '2025-11-09 13:00:00',
   'Repeated waste violations. Stallholder installing proper bins.',
   'in-progress', 2, 6, NULL, NULL),
   
  -- Incomplete/recurring issues
  (2, 19, 3, NULL, 3,
   'Anti-Smoking', 'critical', NULL,
   '2025-11-11 16:00:00',
   'Third offense smoking violation. No adequate correction measures taken.',
   'incomplete', 3, 10, NULL, NULL),
   
  -- Various severity levels for testing
  (2, 1, 1, 50, 1,
   'Illegal Vending', 'minor', NULL,
   '2025-11-13 09:00:00',
   'Minor obstruction outside stall. Verbal warning given.',
   'complete', 1, 1, '2025-11-13 10:00:00', 1),
   
  (2, 2, 2, NULL, NULL,
   'Sanitary Issue', 'critical', NULL,
   '2025-11-14 10:00:00',
   'Critical sanitary violation in food preparation area. Immediate action required.',
   'in-progress', 1, NULL, NULL, NULL),
   
  (2, 13, 1, 54, 1,
   'Fire Safety', 'major', NULL,
   '2025-11-15 11:30:00',
   'Fire extinguisher expired. Replacement ordered.',
   'in-progress', 1, NULL, NULL, NULL);

-- Update stallholder compliance status based on violations
UPDATE `stallholder` 
SET compliance_status = 'Non-Compliant'
WHERE stallholder_id IN (
  SELECT DISTINCT stallholder_id 
  FROM violation_report 
  WHERE status IN ('pending', 'in-progress', 'incomplete')
);

-- ===================================================================
-- Verify sample data
-- ===================================================================

-- Count compliance records by status
SELECT 
  status,
  COUNT(*) AS count,
  GROUP_CONCAT(report_id) AS report_ids
FROM violation_report
GROUP BY status
ORDER BY 
  FIELD(status, 'pending', 'in-progress', 'incomplete', 'complete');

-- Show compliance overview
SELECT 
  CONCAT('CMP-', LPAD(report_id, 4, '0')) AS compliance_id,
  DATE_FORMAT(date_reported, '%Y-%m-%d') AS date,
  compliance_type AS type,
  severity,
  status,
  CONCAT(i.first_name, ' ', i.last_name) AS inspector,
  sh.stallholder_name AS stallholder
FROM violation_report vr
LEFT JOIN inspector i ON vr.inspector_id = i.inspector_id
LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
ORDER BY date_reported DESC
LIMIT 10;

-- Show compliance statistics
SELECT 
  COUNT(*) AS total_records,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) AS in_progress,
  SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS complete,
  SUM(CASE WHEN status = 'incomplete' THEN 1 ELSE 0 END) AS incomplete,
  SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical_severity,
  SUM(CASE WHEN severity = 'major' THEN 1 ELSE 0 END) AS major_severity,
  SUM(CASE WHEN severity = 'moderate' THEN 1 ELSE 0 END) AS moderate_severity,
  SUM(CASE WHEN severity = 'minor' THEN 1 ELSE 0 END) AS minor_severity
FROM violation_report;

-- Show stallholder compliance status
SELECT 
  stallholder_id,
  stallholder_name,
  compliance_status,
  (SELECT COUNT(*) FROM violation_report 
   WHERE stallholder_id = sh.stallholder_id 
   AND status IN ('pending', 'in-progress')) AS pending_violations,
  last_violation_date
FROM stallholder sh
WHERE compliance_status = 'Non-Compliant'
ORDER BY last_violation_date DESC;

-- ===================================================================
-- Test stored procedures
-- ===================================================================

-- Get all compliance records
CALL getAllComplianceRecords(NULL, 'all', '');

-- Get pending compliance records only
CALL getAllComplianceRecords(NULL, 'pending', '');

-- Search for specific type
CALL getAllComplianceRecords(NULL, 'all', 'sanitary');

-- Get compliance statistics
CALL getComplianceStatistics(NULL);

-- Get compliance statistics for specific branch
CALL getComplianceStatistics(1);

-- ===================================================================
-- Sample queries for reports
-- ===================================================================

-- Compliance records by branch
SELECT 
  b.branch_name,
  COUNT(*) AS total_records,
  SUM(CASE WHEN vr.status = 'complete' THEN 1 ELSE 0 END) AS resolved,
  SUM(CASE WHEN vr.status IN ('pending', 'in-progress') THEN 1 ELSE 0 END) AS active,
  ROUND(SUM(CASE WHEN vr.status = 'complete' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS resolution_rate
FROM violation_report vr
LEFT JOIN branch b ON vr.branch_id = b.branch_id
GROUP BY b.branch_name
ORDER BY total_records DESC;

-- Most common violation types
SELECT 
  compliance_type,
  COUNT(*) AS occurrence_count,
  AVG(CASE 
    WHEN severity = 'minor' THEN 1
    WHEN severity = 'moderate' THEN 2
    WHEN severity = 'major' THEN 3
    WHEN severity = 'critical' THEN 4
  END) AS avg_severity
FROM violation_report
GROUP BY compliance_type
ORDER BY occurrence_count DESC;

-- Stallholders with most violations
SELECT 
  sh.stallholder_name,
  sh.branch_id,
  COUNT(*) AS total_violations,
  SUM(CASE WHEN vr.status IN ('pending', 'in-progress') THEN 1 ELSE 0 END) AS active_violations,
  sh.compliance_status
FROM violation_report vr
INNER JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
GROUP BY sh.stallholder_id
HAVING total_violations > 0
ORDER BY total_violations DESC, active_violations DESC;

-- Recent compliance activity (last 7 days)
SELECT 
  DATE(date_reported) AS report_date,
  COUNT(*) AS reports_filed,
  SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS resolved_same_day
FROM violation_report
WHERE date_reported >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(date_reported)
ORDER BY report_date DESC;

-- ===================================================================
-- End of sample data script
-- ===================================================================

SELECT '✅ Sample compliance data inserted successfully!' AS message;
SELECT CONCAT('Total compliance records: ', COUNT(*)) AS summary FROM violation_report;
