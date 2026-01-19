-- ========================================
-- HOW TO ADD NEW DOCUMENT TYPES
-- ========================================
-- Use this template to add new document types to the system

-- Example: Adding a new document type
INSERT INTO document_types (
  type_name,
  description,
  category,
  is_system_default,
  display_order,
  status
) VALUES (
  'Food Handler Certificate',              -- The name shown in dropdowns
  'Certificate from food safety training',  -- Helper text/description
  'Health & Safety',                        -- Category: Legal, Business, Health & Safety, Financial, Identification, or General
  0,                                        -- 0 = can be deleted by admin, 1 = protected system default
  16,                                       -- Display order (higher = appears later in lists)
  'Active'                                  -- Active or Inactive
);

-- ========================================
-- Available Categories:
-- ========================================
-- - Legal
-- - Business
-- - Health & Safety
-- - Financial
-- - Identification
-- - General (default)

-- ========================================
-- Quick Add Examples:
-- ========================================

-- Add Insurance Certificate
INSERT INTO document_types (type_name, description, category, display_order) 
VALUES ('Insurance Certificate', 'Valid business insurance certificate', 'Business', 17);

-- Add Zoning Permit
INSERT INTO document_types (type_name, description, category, display_order) 
VALUES ('Zoning Permit', 'Zoning compliance certificate', 'Legal', 18);

-- Add Food Safety Certificate
INSERT INTO document_types (type_name, description, category, display_order) 
VALUES ('Food Safety Certificate', 'Certificate from food safety inspection', 'Health & Safety', 19);

-- ========================================
-- View All Document Types:
-- ========================================
SELECT 
  document_type_id,
  type_name,
  category,
  description,
  display_order,
  is_system_default,
  status
FROM document_types
ORDER BY display_order, type_name;

-- ========================================
-- Update a Document Type:
-- ========================================
UPDATE document_types
SET 
  description = 'Updated description',
  category = 'New Category',
  display_order = 20
WHERE document_type_id = 1;

-- ========================================
-- Deactivate (Don't Delete) a Document Type:
-- ========================================
UPDATE document_types
SET status = 'Inactive'
WHERE document_type_id = 1;

-- ========================================
-- Delete a Document Type (CAUTION):
-- ========================================
-- This will CASCADE delete all branch requirements using this type!
-- Only delete if is_system_default = 0
DELETE FROM document_types
WHERE document_type_id = 1 AND is_system_default = 0;

-- ========================================
-- See Which Branches Use a Document Type:
-- ========================================
SELECT 
  dt.type_name,
  COUNT(bdr.requirement_id) as used_in_branches,
  GROUP_CONCAT(DISTINCT b.branch_name) as branches
FROM document_types dt
LEFT JOIN branch_document_requirements bdr ON dt.document_type_id = bdr.document_type_id
LEFT JOIN branch b ON bdr.branch_id = b.branch_id
WHERE dt.document_type_id = 1
GROUP BY dt.document_type_id;
