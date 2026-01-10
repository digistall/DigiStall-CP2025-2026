-- Migration: Make application_id nullable in raffle_participants table
-- Purpose: Allow pre-registration for raffles without creating a full application
-- The application will be created when the winner is selected by the branch manager

-- Step 1: Drop the existing foreign key constraint for application_id
ALTER TABLE `raffle_participants` 
DROP FOREIGN KEY `fk_raffle_participants_application`;

-- Step 2: Modify the column to allow NULL values
ALTER TABLE `raffle_participants` 
MODIFY COLUMN `application_id` INT NULL DEFAULT NULL;

-- Step 3: Add the foreign key back with ON DELETE SET NULL (allows NULL values)
ALTER TABLE `raffle_participants`
ADD CONSTRAINT `fk_raffle_participants_application` 
FOREIGN KEY (`application_id`) REFERENCES `application`(`application_id`)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Verification: Run this to check the column allows NULL
-- DESCRIBE raffle_participants;
-- SHOW CREATE TABLE raffle_participants;
