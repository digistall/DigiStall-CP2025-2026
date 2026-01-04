-- =============================================
-- MIGRATION: Add BLOB columns to document tables
-- =============================================
-- Purpose: Support storing documents as BLOB in cloud database
-- instead of using local file storage (htdocs)
-- Tables affected: applicant_documents, stallholder_documents, stallholder_document_submissions
-- =============================================

-- 1. Add BLOB columns to applicant_documents
ALTER TABLE `applicant_documents`
ADD COLUMN IF NOT EXISTS `document_data` LONGBLOB NULL COMMENT 'Document file data stored as BLOB (up to 4GB)' AFTER `mime_type`,
ADD COLUMN IF NOT EXISTS `document_mime_type` VARCHAR(100) NULL COMMENT 'MIME type for BLOB storage' AFTER `document_data`,
ADD COLUMN IF NOT EXISTS `storage_type` ENUM('file', 'blob') DEFAULT 'file' COMMENT 'Storage type - file for local, blob for database' AFTER `document_mime_type`;

-- 2. Add BLOB columns to stallholder_documents  
ALTER TABLE `stallholder_documents`
ADD COLUMN IF NOT EXISTS `document_data` LONGBLOB NULL COMMENT 'Document file data stored as BLOB (up to 4GB)' AFTER `original_filename`,
ADD COLUMN IF NOT EXISTS `document_mime_type` VARCHAR(100) NULL COMMENT 'MIME type for BLOB storage' AFTER `document_data`,
ADD COLUMN IF NOT EXISTS `storage_type` ENUM('file', 'blob') DEFAULT 'file' COMMENT 'Storage type - file for local, blob for database' AFTER `document_mime_type`;

-- 3. Add BLOB columns to stallholder_document_submissions
ALTER TABLE `stallholder_document_submissions`
ADD COLUMN IF NOT EXISTS `document_data` LONGBLOB NULL COMMENT 'Document file data stored as BLOB (up to 4GB)' AFTER `file_type`,
ADD COLUMN IF NOT EXISTS `storage_type` ENUM('file', 'blob') DEFAULT 'file' COMMENT 'Storage type - file for local, blob for database' AFTER `document_data`;

-- =============================================
-- COMMENTS:
-- - document_data: Stores the actual file binary data
-- - document_mime_type: Stores the MIME type for serving the file correctly
-- - storage_type: Allows backward compatibility with existing file-based uploads
-- - LONGBLOB supports files up to 4GB (more than enough for documents)
-- =============================================
