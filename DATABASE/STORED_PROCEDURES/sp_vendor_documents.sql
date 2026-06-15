-- =============================================
-- VENDOR DOCUMENT STORED PROCEDURES
-- =============================================
-- All database logic for vendor document management
-- Used by: vendorDocumentBlobController.js
-- =============================================

-- 1. Check if vendor exists
DROP PROCEDURE IF EXISTS sp_checkVendorExists;
DELIMITER $$
CREATE PROCEDURE sp_checkVendorExists(IN p_vendor_id INT)
BEGIN
  SELECT vendor_id FROM vendor WHERE vendor_id = p_vendor_id;
END$$
DELIMITER ;

-- 2. Check if vendor document already exists for a given vendor + document type
DROP PROCEDURE IF EXISTS sp_checkExistingVendorDocument;
DELIMITER $$
CREATE PROCEDURE sp_checkExistingVendorDocument(
  IN p_vendor_id INT,
  IN p_document_type_id INT
)
BEGIN
  SELECT vendor_document_id
  FROM vendor_documents
  WHERE vendor_id = p_vendor_id AND document_type_id = p_document_type_id
  LIMIT 1;
END$$
DELIMITER ;

-- 3. Insert a new vendor document
DROP PROCEDURE IF EXISTS sp_insertVendorDocument;
DELIMITER $$
CREATE PROCEDURE sp_insertVendorDocument(
  IN p_vendor_id INT,
  IN p_document_type_id INT,
  IN p_document_name VARCHAR(45),
  IN p_document_data LONGBLOB,
  IN p_document_mime_type VARCHAR(100)
)
BEGIN
  INSERT INTO vendor_documents
    (vendor_id, document_type_id, document_name, document_data, document_mime_type,
     verification_status, submitted_at)
  VALUES
    (p_vendor_id, p_document_type_id, p_document_name, p_document_data, p_document_mime_type,
     'Pending', NOW());

  SELECT LAST_INSERT_ID() AS document_id;
END$$
DELIMITER ;

-- 4. Update an existing vendor document (re-upload)
DROP PROCEDURE IF EXISTS sp_updateVendorDocument;
DELIMITER $$
CREATE PROCEDURE sp_updateVendorDocument(
  IN p_vendor_document_id INT,
  IN p_document_name VARCHAR(45),
  IN p_document_data LONGBLOB,
  IN p_document_mime_type VARCHAR(100)
)
BEGIN
  UPDATE vendor_documents
  SET document_data = p_document_data,
      document_mime_type = p_document_mime_type,
      document_name = p_document_name,
      verification_status = 'Pending',
      submitted_at = NOW()
  WHERE vendor_document_id = p_vendor_document_id;
END$$
DELIMITER ;

-- 5. Get all vendor documents (metadata only, no blob data)
DROP PROCEDURE IF EXISTS sp_getVendorDocuments;
DELIMITER $$
CREATE PROCEDURE sp_getVendorDocuments(IN p_vendor_id INT)
BEGIN
  SELECT vd.vendor_document_id AS document_id, vd.vendor_id, vd.document_type_id,
         vd.document_name, vd.document_mime_type AS mime_type,
         vd.verification_status, vd.submitted_at,
         vd.remarks, vd.verified_by, vd.verified_at,
         dt.type_name AS document_type_name, dt.description AS document_type_description
  FROM vendor_documents vd
  LEFT JOIN document_types dt ON vd.document_type_id = dt.document_type_id
  WHERE vd.vendor_id = p_vendor_id
  ORDER BY vd.submitted_at DESC;
END$$
DELIMITER ;

-- 6. Get all vendor documents with base64 data included
DROP PROCEDURE IF EXISTS sp_getVendorDocumentsWithData;
DELIMITER $$
CREATE PROCEDURE sp_getVendorDocumentsWithData(IN p_vendor_id INT)
BEGIN
  SELECT vd.vendor_document_id AS document_id, vd.vendor_id, vd.document_type_id,
         vd.document_name, vd.document_mime_type AS mime_type,
         vd.verification_status, vd.submitted_at,
         vd.remarks, vd.verified_by, vd.verified_at,
         TO_BASE64(vd.document_data) AS document_data_base64,
         dt.type_name AS document_type_name, dt.description AS document_type_description
  FROM vendor_documents vd
  LEFT JOIN document_types dt ON vd.document_type_id = dt.document_type_id
  WHERE vd.vendor_id = p_vendor_id
  ORDER BY vd.submitted_at DESC;
END$$
DELIMITER ;

-- 7. Get vendor document blob by document ID (for binary download)
DROP PROCEDURE IF EXISTS sp_getVendorDocumentBlobById;
DELIMITER $$
CREATE PROCEDURE sp_getVendorDocumentBlobById(IN p_document_id INT)
BEGIN
  SELECT document_data, document_name, document_mime_type
  FROM vendor_documents
  WHERE vendor_document_id = p_document_id
    AND document_data IS NOT NULL;
END$$
DELIMITER ;

-- 8. Get vendor document requirements (all vendor-category types + upload status)
DROP PROCEDURE IF EXISTS sp_getVendorDocumentRequirements;
DELIMITER $$
CREATE PROCEDURE sp_getVendorDocumentRequirements(IN p_vendor_id INT)
BEGIN
  -- Result set 1: All vendor-category document types
  SELECT document_type_id, type_name AS document_name, description,
         display_order, is_system_default AS is_required
  FROM document_types
  WHERE category = 'vendor' AND status = 'Active'
  ORDER BY display_order ASC;

  -- Result set 2: Vendor's uploaded documents
  SELECT vendor_document_id AS document_id, document_type_id, verification_status,
         submitted_at, document_name AS file_name, remarks
  FROM vendor_documents
  WHERE vendor_id = p_vendor_id;
END$$
DELIMITER ;

-- 9. Delete a vendor document
DROP PROCEDURE IF EXISTS sp_deleteVendorDocument;
DELIMITER $$
CREATE PROCEDURE sp_deleteVendorDocument(IN p_document_id INT)
BEGIN
  DECLARE v_exists INT DEFAULT 0;

  SELECT COUNT(*) INTO v_exists
  FROM vendor_documents
  WHERE vendor_document_id = p_document_id;

  IF v_exists = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Document not found';
  END IF;

  DELETE FROM vendor_documents WHERE vendor_document_id = p_document_id;

  SELECT p_document_id AS deleted_document_id, 'success' AS status;
END$$
DELIMITER ;
