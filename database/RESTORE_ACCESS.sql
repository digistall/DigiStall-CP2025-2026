-- ========================================
-- RESTORE ACCESS - Create a new application to unlock areas
-- This creates a sample application so you can see stalls again
-- ========================================

USE `naga_stall`;

-- First, find an available stall in Naga City area
SELECT 
    s.stall_id,
    s.stall_no,
    s.price_type,
    s.rental_price,
    b.branch_name,
    b.area
FROM stall s
JOIN section sec ON s.section_id = sec.section_id
JOIN floor f ON sec.floor_id = f.floor_id
JOIN branch b ON f.branch_id = b.branch_id
WHERE s.is_available = 1 
  AND s.status = 'Active'
  AND b.area = 'Naga City'
  AND s.price_type = 'Fixed Price'
LIMIT 5;

-- After you see the available stalls above, choose one and uncomment below:
-- Replace [STALL_ID] with an actual stall_id from the results above

-- INSERT INTO application (applicant_id, stall_id, application_date, application_status)
-- VALUES (12, [STALL_ID], NOW(), 'Pending');

-- Example: If stall_id 50 is available, use:
-- INSERT INTO application (applicant_id, stall_id, application_date, application_status)
-- VALUES (12, 50, NOW(), 'Pending');

-- Verify the application was created
-- SELECT * FROM application WHERE applicant_id = 12;
