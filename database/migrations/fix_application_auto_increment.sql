-- Fix application table AUTO_INCREMENT
-- Run this on your DigitalOcean database

-- First, check what's the max application_id
SELECT MAX(application_id) FROM application;

-- Set the application_id column to AUTO_INCREMENT
ALTER TABLE `application` 
  MODIFY `application_id` int(11) NOT NULL AUTO_INCREMENT;

-- If needed, set the AUTO_INCREMENT starting value based on existing data
-- ALTER TABLE `application` AUTO_INCREMENT = 2;
