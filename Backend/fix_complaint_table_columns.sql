-- Fix complaint table columns to handle encrypted data
-- The contact numbers are encrypted and are 66+ characters, but the table has VARCHAR(50)

ALTER TABLE complaint 
  MODIFY COLUMN sender_name VARCHAR(500),
  MODIFY COLUMN sender_contact VARCHAR(500),
  MODIFY COLUMN sender_email VARCHAR(500);

SELECT 'Complaint table columns updated successfully' as status;
