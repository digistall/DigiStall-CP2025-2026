-- ========================================
-- DROP UNNECESSARY BIDDING COLUMNS FROM AUCTION TABLE
-- Simplifies auction table for pre-registration only
-- ========================================

USE `naga_stall`;

-- First, drop foreign key constraints that depend on columns we want to remove
ALTER TABLE `auction`
  DROP FOREIGN KEY IF EXISTS `fk_auction_highest_bidder`;

-- Now drop the bidding-related columns from auction table
ALTER TABLE `auction`
  DROP COLUMN IF EXISTS `current_highest_bid`,
  DROP COLUMN IF EXISTS `highest_bidder_id`,
  DROP COLUMN IF EXISTS `application_deadline`,
  DROP COLUMN IF EXISTS `first_bid_time`,
  DROP COLUMN IF EXISTS `start_time`,
  DROP COLUMN IF EXISTS `end_time`,
  DROP COLUMN IF EXISTS `total_bids`,
  DROP COLUMN IF EXISTS `winner_confirmed`,
  DROP COLUMN IF EXISTS `winning_bid_amount`,
  DROP COLUMN IF EXISTS `winner_selection_date`;

-- Show remaining columns
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'naga_stall'
AND TABLE_NAME = 'auction'
ORDER BY ORDINAL_POSITION;

SELECT '✅ Auction table simplified! Only pre-registration tracking columns remain.' as 'Status';
