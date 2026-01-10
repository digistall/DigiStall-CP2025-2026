-- Migration: Make application_id nullable in raffle_participants table
-- Purpose: Allow pre-registration for raffles without creating a full application
-- The application will be created when the winner is selected by the branch manager

-- First, drop the foreign key constraint if it exists
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'raffle_participants' 
    AND CONSTRAINT_NAME = 'raffle_participants_ibfk_3'
);

-- Drop foreign key if exists (may vary by constraint name)
-- You may need to check your actual constraint name
ALTER TABLE `raffle_participants` 
DROP FOREIGN KEY IF EXISTS `raffle_participants_ibfk_3`;

-- Modify the column to allow NULL values
ALTER TABLE `raffle_participants` 
MODIFY COLUMN `application_id` INT(11) NULL DEFAULT NULL;

-- Add the foreign key back with ON DELETE SET NULL
ALTER TABLE `raffle_participants`
ADD CONSTRAINT `fk_raffle_participants_application`
FOREIGN KEY (`application_id`) REFERENCES `application`(`application_id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Verification query (run this to check)
-- DESCRIBE raffle_participants;
