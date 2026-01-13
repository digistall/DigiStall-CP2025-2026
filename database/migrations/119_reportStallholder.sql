-- Migration: 119_reportStallholder.sql
-- Description: reportStallholder stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `reportStallholder`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `reportStallholder` (IN `p_inspector_id` INT, IN `p_stallholder_id` INT, IN `p_violation_id` INT, IN `p_branch_id` INT, IN `p_stall_id` INT, IN `p_evidence` TEXT, IN `p_remarks` TEXT)   BEGIN
    DECLARE v_offense_no INT;
    DECLARE v_penalty_amount DECIMAL(10,2);
    DECLARE v_penalty_remarks VARCHAR(255);
    DECLARE v_penalty_id INT DEFAULT NULL;

    IF NOT EXISTS (SELECT 1 FROM violation WHERE violation_id = p_violation_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Invalid violation_id provided';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM stallholder WHERE stallholder_id = p_stallholder_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Invalid stallholder_id provided';
    END IF;

    SELECT COUNT(*) + 1 INTO v_offense_no FROM violation_report
    WHERE stallholder_id = p_stallholder_id AND violation_id = p_violation_id;

    SELECT vp.penalty_id, vp.penalty_amount, vp.remarks INTO v_penalty_id, v_penalty_amount, v_penalty_remarks
    FROM violation_penalty vp
    WHERE vp.violation_id = p_violation_id
      AND vp.offense_no = (SELECT MAX(offense_no) FROM violation_penalty
                           WHERE violation_id = p_violation_id AND offense_no <= v_offense_no);

    IF v_penalty_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: No penalty defined for this violation type';
    END IF;

    INSERT INTO violation_report (inspector_id, stallholder_id, violator_name, violation_id, branch_id, stall_id, 
                                  evidence, date_reported, offense_no, penalty_id, remarks)
    VALUES (p_inspector_id, p_stallholder_id, NULL, p_violation_id, p_branch_id, p_stall_id, p_evidence, NOW(),
            v_offense_no, v_penalty_id,
            CONCAT_WS(' | ', p_remarks, CONCAT('Offense #', v_offense_no), 
                      CONCAT('Fine: Ã¢â€šÂ±', IFNULL(v_penalty_amount, '0.00')), IFNULL(v_penalty_remarks, '')));

    UPDATE stallholder SET compliance_status = 'Non-Compliant', last_violation_date = NOW()
    WHERE stallholder_id = p_stallholder_id;
END$$

DELIMITER ;
