-- Fix online payment procedures to return raw encrypted data instead of MySQL decryption
DROP PROCEDURE IF EXISTS `sp_getOnlinePaymentsAllDecrypted`;

CREATE PROCEDURE `sp_getOnlinePaymentsAllDecrypted`(
    IN p_search VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        p.payment_id as id,
        p.stallholder_id as stallholderId,
        -- Return raw encrypted stallholder name (backend will decrypt with Node.js AES-256-GCM)
        sh.stallholder_name as stallholderName,
        sh.business_name as businessName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        p.amount as amountPaid,
        p.payment_date as paymentDate,
        p.payment_time as paymentTime,
        p.payment_for_month as paymentForMonth,
        p.payment_type as paymentType,
        p.payment_method as paymentMethod,
        p.reference_number as referenceNo,
        p.gcash_reference_number as gcashReferenceNo,
        p.gcash_screenshot as gcashScreenshot,
        p.notes,
        p.payment_status as status,
        p.created_at as createdAt,
        COALESCE(b.branch_name, 'Unknown') as branchName
    FROM payments p
    INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE p.payment_method != 'onsite'
    AND (
        p_search = '' OR p_search IS NULL OR
        p.reference_number LIKE CONCAT('%', p_search, '%') OR
        p.gcash_reference_number LIKE CONCAT('%', p_search, '%') OR
        sh.stallholder_name LIKE CONCAT('%', p_search, '%') OR
        st.stall_no LIKE CONCAT('%', p_search, '%')
    )
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;

DROP PROCEDURE IF EXISTS `sp_getOnlinePaymentsByBranchesDecrypted`;

CREATE PROCEDURE `sp_getOnlinePaymentsByBranchesDecrypted`(
    IN p_branch_ids VARCHAR(500),
    IN p_search VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SET @sql = CONCAT('
        SELECT 
            p.payment_id as id,
            p.stallholder_id as stallholderId,
            sh.stallholder_name as stallholderName,
            sh.business_name as businessName,
            COALESCE(st.stall_no, ''N/A'') as stallNo,
            p.amount as amountPaid,
            p.payment_date as paymentDate,
            p.payment_time as paymentTime,
            p.payment_for_month as paymentForMonth,
            p.payment_type as paymentType,
            p.payment_method as paymentMethod,
            p.reference_number as referenceNo,
            p.gcash_reference_number as gcashReferenceNo,
            p.gcash_screenshot as gcashScreenshot,
            p.notes,
            p.payment_status as status,
            p.created_at as createdAt,
            COALESCE(b.branch_name, ''Unknown'') as branchName
        FROM payments p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE p.payment_method != ''onsite''
        AND FIND_IN_SET(sh.branch_id, ''', p_branch_ids, ''')
        AND (
            ''', IFNULL(p_search, ''), ''' = '''' OR
            p.reference_number LIKE CONCAT(''%'', ''', IFNULL(p_search, ''), ''', ''%'') OR
            p.gcash_reference_number LIKE CONCAT(''%'', ''', IFNULL(p_search, ''), ''', ''%'') OR
            sh.stallholder_name LIKE CONCAT(''%'', ''', IFNULL(p_search, ''), ''', ''%'') OR
            st.stall_no LIKE CONCAT(''%'', ''', IFNULL(p_search, ''), ''', ''%'')
        )
        ORDER BY p.created_at DESC
        LIMIT ', p_limit, ' OFFSET ', p_offset
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;
