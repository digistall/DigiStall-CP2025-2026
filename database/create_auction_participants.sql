-- Create auction_participants table for mobile auction joining
CREATE TABLE IF NOT EXISTS auction_participants (
  participant_id INT AUTO_INCREMENT PRIMARY KEY,
  auction_id INT NOT NULL,
  applicant_id INT NOT NULL,
  bid_amount DECIMAL(10,2) DEFAULT NULL,
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Registered','Winner','Not Selected') DEFAULT 'Registered',
  FOREIGN KEY (auction_id) REFERENCES auction(auction_id),
  FOREIGN KEY (applicant_id) REFERENCES applicant(applicant_id),
  UNIQUE KEY unique_participant (auction_id, applicant_id)
);

-- Verify table was created
DESCRIBE auction_participants;
