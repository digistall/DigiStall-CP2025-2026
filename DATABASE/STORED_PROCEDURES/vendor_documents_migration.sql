-- =============================================
-- VENDOR DOCUMENTS MIGRATION
-- =============================================
-- Step 1: Add vendor_id column to vendor_documents table
-- Step 2: Insert vendor-specific document types
-- =============================================

-- Step 1: Add vendor_id column (skip if already exists)
ALTER TABLE vendor_documents
  ADD COLUMN vendor_id INT DEFAULT NULL AFTER vendor_document_id;

ALTER TABLE vendor_documents
  ADD INDEX idx_vendor_documents_vendor_id (vendor_id);

-- Step 2: Insert the 6 vendor-required document types
-- These use category = 'vendor' so the app can query them

INSERT INTO document_types (type_name, description, category, is_system_default, display_order, status)
VALUES
  ('Business Clearance', 'Business clearance document from the local government', 'vendor', 1, 1, 'Active'),
  ('Cedula', 'Community Tax Certificate (Cedula)', 'vendor', 1, 2, 'Active'),
  ('Association Clearance', 'Clearance from the vendor association', 'vendor', 1, 3, 'Active'),
  ('Voter''s ID / Voter''s Registration', 'Voter''s ID or Voter''s Registration certificate', 'vendor', 1, 4, 'Active'),
  ('2x2 Picture (White Background)', '2x2 ID photo with white background', 'vendor', 1, 5, 'Active'),
  ('Health Card / Yellow Card', 'Health card or yellow card from the health office', 'vendor', 1, 6, 'Active');

-- Verify
SELECT document_type_id, type_name, category, display_order
FROM document_types
WHERE category = 'vendor'
ORDER BY display_order;
