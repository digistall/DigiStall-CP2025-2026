DROP PROCEDURE IF EXISTS `sp_getAllStallholdersByBranchesDecrypted`;

CREATE PROCEDURE `sp_getAllStallholdersByBranchesDecrypted`(IN p_branch_ids VARCHAR(500))
BEGIN
  SET @sql = CONCAT('
    SELECT 
      s.stallholder_id,
      s.applicant_id,
      s.stallholder_name,
      s.contact_number,
      s.email,
      s.address,
      s.business_name,
      s.business_type,
      s.branch_id,
      s.stall_id,
      s.contract_start_date,
      s.contract_end_date,
      s.contract_status,
      s.lease_amount,
      s.monthly_rent,
      s.payment_status,
      s.is_encrypted,
      b.branch_name,
      st.stall_no
    FROM stallholder s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN stall st ON s.stall_id = st.stall_id
    WHERE FIND_IN_SET(s.branch_id, ''', p_branch_ids, ''')
  ');
  
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END;
