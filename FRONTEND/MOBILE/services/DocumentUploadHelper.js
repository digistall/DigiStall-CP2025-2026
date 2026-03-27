// =============================================
// DOCUMENT UPLOAD HELPER
// =============================================
// Purpose: Convert images to base64 and handle BLOB uploads
// Supports: Camera, Gallery, and Document uploads
// Storage: BLOB in database (no local file storage)

import * as FileSystem from "expo-file-system";

class DocumentUploadHelper {
  /**
   * Convert file URI to base64 string
   * @param {string} uri - File URI from ImagePicker or DocumentPicker
   * @returns {Promise<string>} - Base64 encoded string
   */
  static async convertToBase64(uri) {
    try {
      console.log("📝 Converting file to base64:", uri);
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log("✅ File converted to base64");
      return base64;
    } catch (error) {
      console.error("❌ Error converting file to base64:", error);
      throw new Error("Failed to process file");
    }
  }

  /**
   * Get MIME type from file extension
   * @param {string} fileName - Original file name
   * @returns {string} - MIME type
   */
  static getMimeType(fileName) {
    const extension = fileName?.split(".")?.pop()?.toLowerCase();
    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      pdf: "application/pdf",
      bmp: "image/bmp",
      webp: "image/webp",
    };
    return mimeTypes[extension] || "image/jpeg";
  }

  /**
   * Validate file size (max 5MB for documents)
   * @param {number} fileSizeInBytes - File size in bytes
   * @returns {boolean} - True if valid
   */
  static validateFileSize(fileSizeInBytes) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return fileSizeInBytes <= maxSize;
  }

  /**
   * Get file size from URI
   * @param {string} uri - File URI
   * @returns {Promise<number>} - File size in bytes
   */
  static async getFileSize(uri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.size || 0;
    } catch (error) {
      console.error("❌ Error getting file size:", error);
      return 0;
    }
  }

  /**
   * Prepare document for upload (URI-based, no base64 — uses FormData multipart upload)
   * @param {object} file - File object from ImagePicker or DocumentPicker
   * @param {number} stallholderId - Stallholder ID
   * @param {number} documentTypeId - Document type ID
   * @returns {Promise<object>} - Upload payload with file URI (no base64)
   */
  static async prepareDocumentForUpload(file, stallholderId, documentTypeId) {
    try {
      const uri = file.uri || file.path;
      const fileName =
        file.name || file.fileName || `document_${Date.now()}.jpg`;
      
      // Get MIME type - expo-document-picker v13+ uses 'mimeType', ImagePicker uses 'type'
      let mimeType = file.mimeType || file.type;
      
      console.log('📄 Processing file:', {
        uri,
        fileName,
        rawMimeType: mimeType,
        fileObject: JSON.stringify(file, null, 2)
      });
      
      // Fix incomplete MIME types from ImagePicker
      if (!mimeType || mimeType === 'image' || !mimeType.includes('/')) {
        mimeType = this.getMimeType(fileName);
        console.log(`📋 Fixed MIME type from filename: ${mimeType}`);
      }
      
      // Validate MIME type is complete
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf'];
      if (!validMimeTypes.includes(mimeType)) {
        const derivedMimeType = this.getMimeType(fileName);
        if (validMimeTypes.includes(derivedMimeType)) {
          mimeType = derivedMimeType;
          console.log(`📋 Using derived MIME type from filename: ${mimeType}`);
        } else {
          mimeType = 'image/jpeg';
          console.log(`📋 Defaulting to MIME type: ${mimeType}`);
        }
      }

      // Get file size for validation
      const fileSize = file.fileSize || file.size || await this.getFileSize(uri);
      console.log(`📁 File size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`📋 Final MIME type: ${mimeType}`);
      console.log(`📋 File name: ${fileName}`);

      // Validate size (5MB limit)
      if (!this.validateFileSize(fileSize)) {
        throw new Error(`File size exceeds 5 MB limit (${(fileSize / 1024 / 1024).toFixed(1)} MB). Please choose a smaller file.`);
      }

      // Return URI-based payload — no base64 conversion.
      // ApiService will attach the URI directly to FormData for multipart upload.
      return {
        stallholder_id: stallholderId,
        document_type_id: documentTypeId,
        uri,
        mime_type: mimeType,
        file_name: fileName,
        file_size: fileSize,
      };
    } catch (error) {
      console.error("❌ Error preparing document for upload:", error);
      throw error;
    }
  }

  /**
   * Prepare document submission for upload
   * @param {object} file - File object
   * @param {number} stallholderId - Stallholder ID
   * @param {number} ownerId - Owner ID
   * @param {number} requirementId - Requirement ID
   * @param {number} applicationId - Application ID (optional)
   * @returns {Promise<object>} - Upload payload
   */
  static async prepareDocumentSubmissionForUpload(
    file,
    stallholderId,
    ownerId,
    requirementId,
    applicationId = null
  ) {
    try {
      const uri = file.uri || file.path;
      const fileName =
        file.name || file.fileName || `submission_${Date.now()}.jpg`;
      const mimeType = file.type || file.mimeType || this.getMimeType(fileName);

      // Get file size
      const fileSize = await this.getFileSize(uri);

      // Validate size
      if (!this.validateFileSize(fileSize)) {
        throw new Error(`File size exceeds 5 MB limit (${(fileSize / 1024 / 1024).toFixed(1)} MB). Please choose a smaller file.`);
      }

      // Convert to base64
      const base64Data = await this.convertToBase64(uri);

      return {
        stallholder_id: stallholderId,
        owner_id: ownerId,
        requirement_id: requirementId,
        application_id: applicationId,
        document_data: `data:${mimeType};base64,${base64Data}`,
        mime_type: mimeType,
        file_name: fileName,
      };
    } catch (error) {
      console.error(
        "❌ Error preparing document submission for upload:",
        error
      );
      throw error;
    }
  }

  /**
   * Check if file is an image
   * @param {string} mimeType - MIME type
   * @returns {boolean}
   */
  static isImage(mimeType) {
    return mimeType?.startsWith("image/");
  }

  /**
   * Check if file is a PDF
   * @param {string} mimeType - MIME type
   * @returns {boolean}
   */
  static isPDF(mimeType) {
    return mimeType === "application/pdf";
  }

  /**
   * Get file type label
   * @param {string} mimeType - MIME type
   * @returns {string}
   */
  static getFileTypeLabel(mimeType) {
    if (this.isImage(mimeType)) {
      return "Image";
    } else if (this.isPDF(mimeType)) {
      return "PDF Document";
    }
    return "Document";
  }
}

export default DocumentUploadHelper;
