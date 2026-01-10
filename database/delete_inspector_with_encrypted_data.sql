-- Delete specific inspector record with ID 4
-- Need to drop trigger first due to dynamic SQL restriction

-- Drop the trigger temporarily
DROP TRIGGER IF EXISTS `trg_inspector_reset_auto`;

-- Delete the inspector (change ID number as needed)
DELETE FROM inspector WHERE inspector_id = 4;

-- Recreate the trigger
DELIMITER $$
CREATE TRIGGER `trg_inspector_reset_auto` AFTER DELETE ON `inspector` FOR EACH ROW 
BEGIN
    CALL ResetAutoIncrement('inspector', 'inspector_id');
END$$
DELIMITER ;

SELECT 'Inspector ID 4 deleted successfully' as status;
