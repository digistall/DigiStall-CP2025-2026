-- Migration 321: Inspector Controller Stored Procedures
-- This creates stored procedures for inspector operations

DELIMITER //

-- =====================================================
-- SP: sp_getViolationTypes
-- Purpose: Get all violation types
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getViolationTypes//
CREATE PROCEDURE sp_getViolationTypes()
BEGIN
    SELECT 
        v.violation_id,
        v.ordinance_no,
        v.violation_type,
        v.details
    FROM violation v
    ORDER BY v.violation_type ASC;
END//

-- =====================================================
-- SP: sp_getStallholderDetailById
-- Purpose: Get stallholder details by ID with stall and branch info
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallholderDetailById//
CREATE PROCEDURE sp_getStallholderDetailById(
    IN p_stallholder_id INT
)
BEGIN
    SELECT 
        s.stallholder_id,
        s.stallholder_name,
        s.contact_number,
        s.business_name,
        s.business_type,
        s.contract_status,
        s.compliance_status,
        s.branch_id,
        s.stall_id,
        st.stall_no,
        st.stall_location,
        sec.section_name as section,
        f.floor_name as floor,
        b.branch_name,
        b.location as branch_location
    FROM stallholder s
    LEFT JOIN stall st ON s.stall_id = st.stall_id
    LEFT JOIN section sec ON st.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    WHERE s.stallholder_id = p_stallholder_id;
END//

-- =====================================================
-- SP: sp_getStallholderDetailByIdWithBranch
-- Purpose: Get stallholder details with branch verification
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallholderDetailByIdWithBranch//
CREATE PROCEDURE sp_getStallholderDetailByIdWithBranch(
    IN p_stallholder_id INT,
    IN p_branch_id INT
)
BEGIN
    SELECT 
        s.stallholder_id,
        s.stallholder_name,
        s.contact_number,
        s.business_name,
        s.business_type,
        s.contract_status,
        s.compliance_status,
        s.branch_id,
        s.stall_id,
        st.stall_no,
        st.stall_location,
        sec.section_name as section,
        f.floor_name as floor,
        b.branch_name,
        b.location as branch_location
    FROM stallholder s
    LEFT JOIN stall st ON s.stall_id = st.stall_id
    LEFT JOIN section sec ON st.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    WHERE s.stallholder_id = p_stallholder_id AND s.branch_id = p_branch_id;
END//

DELIMITER ;

-- Success message
SELECT 'Inspector Controller stored procedures created successfully' as status;
