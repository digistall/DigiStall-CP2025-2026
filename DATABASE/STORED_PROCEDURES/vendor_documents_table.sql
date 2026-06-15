-- =============================================
-- VENDOR DOCUMENTS TABLE
-- =============================================
-- Purpose: Store vendor-submitted documents as BLOB
-- Documents: Valid ID, Business Permit, Barangay Clearance, etc.
-- Vendors upload via mobile app; managers verify via web admin.
-- =============================================

CREATE TABLE IF NOT EXISTS vendor_documents (
    vendor_document_id INT NOT NULL AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    document_type_id INT NOT NULL,
    document_data LONGBLOB DEFAULT NULL,
    document_mime_type VARCHAR(100) DEFAULT 'image/jpeg',
    document_name VARCHAR(255) DEFAULT NULL,
    file_path VARCHAR(500) DEFAULT NULL,
    file_size INT DEFAULT NULL,
    verification_status ENUM('pending', 'verified', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    remarks TEXT DEFAULT NULL,
    verified_by INT DEFAULT NULL,
    verified_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (vendor_document_id),
    KEY idx_vendor_documents_vendor_id (vendor_id),
    KEY idx_vendor_documents_type (document_type_id),
    KEY idx_vendor_documents_status (verification_status),
    CONSTRAINT fk_vendor_documents_vendor
      FOREIGN KEY (vendor_id) REFERENCES vendor(vendor_id)
      ON DELETE CASCADE,
    CONSTRAINT fk_vendor_documents_type
      FOREIGN KEY (document_type_id) REFERENCES document_types(document_type_id)
      ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
