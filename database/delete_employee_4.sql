-- Delete specific business_employee record with ID 4
-- Need to drop trigger first due to dynamic SQL restriction

-- Drop the trigger temporarily
DROP TRIGGER IF EXISTS `trg_business_employee_reset_auto`;

-- Delete the employee
DELETE FROM business_employee WHERE business_employee_id = 4;

-- Recreate the trigger
DELIMITER $$
CREATE TRIGGER `trg_business_employee_reset_auto` AFTER DELETE ON `business_employee` FOR EACH ROW 
BEGIN
    CALL ResetAutoIncrement('business_employee', 'business_employee_id');
END$$
DELIMITER ;

SELECT 'Employee ID 4 deleted successfully' as status;
