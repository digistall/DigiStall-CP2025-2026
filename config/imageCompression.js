// ===== IMAGE COMPRESSION UTILITY =====
// Compresses uploaded images to reduce storage and bandwidth
// Uses sharp for high-quality compression with minimal quality loss

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Compression settings
const COMPRESSION_CONFIG = {
  jpeg: { quality: 80, mozjpeg: true },
  png: { quality: 80, compressionLevel: 8 },
  webp: { quality: 80 },
  maxWidth: 1920,
  maxHeight: 1920,
  // Skip compression for files smaller than this (already small enough)
  minSizeBytes: 50 * 1024, // 50KB
};

// Image extensions that can be compressed
const COMPRESSIBLE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp'];

/**
 * Compress a single image file in-place
 * @param {string} filePath - Absolute path to the image file
 * @param {object} options - Override compression settings
 * @returns {object} { compressed, originalSize, newSize, savings }
 */
export async function compressImage(filePath, options = {}) {
  try {
    const ext = path.extname(filePath).toLowerCase();

    // Skip non-image files
    if (!COMPRESSIBLE_EXTENSIONS.includes(ext)) {
      return { compressed: false, reason: 'not-image' };
    }

    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size < COMPRESSION_CONFIG.minSizeBytes) {
      return { compressed: false, reason: 'too-small', originalSize: stats.size };
    }

    const originalSize = stats.size;

    // Read and compress
    let pipeline = sharp(filePath)
      .rotate() // Auto-rotate based on EXIF
      .resize(
        options.maxWidth || COMPRESSION_CONFIG.maxWidth,
        options.maxHeight || COMPRESSION_CONFIG.maxHeight,
        { fit: 'inside', withoutEnlargement: true }
      );

    // Apply format-specific compression
    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg(options.jpeg || COMPRESSION_CONFIG.jpeg);
    } else if (ext === '.png') {
      pipeline = pipeline.png(options.png || COMPRESSION_CONFIG.png);
    } else if (ext === '.webp') {
      pipeline = pipeline.webp(options.webp || COMPRESSION_CONFIG.webp);
    } else {
      // Convert other formats to JPEG
      pipeline = pipeline.jpeg(options.jpeg || COMPRESSION_CONFIG.jpeg);
    }

    const compressedBuffer = await pipeline.toBuffer();

    // Only save if actually smaller
    if (compressedBuffer.length < originalSize) {
      fs.writeFileSync(filePath, compressedBuffer);
      const savings = ((originalSize - compressedBuffer.length) / originalSize * 100).toFixed(1);
      console.log(`📦 Compressed: ${path.basename(filePath)} ${(originalSize / 1024).toFixed(0)}KB → ${(compressedBuffer.length / 1024).toFixed(0)}KB (${savings}% saved)`);
      return {
        compressed: true,
        originalSize,
        newSize: compressedBuffer.length,
        savings: `${savings}%`
      };
    }

    return { compressed: false, reason: 'already-optimal', originalSize };
  } catch (error) {
    console.error(`⚠️ Compression failed for ${filePath}:`, error.message);
    return { compressed: false, reason: 'error', error: error.message };
  }
}

/**
 * Compress an image buffer (for BLOB storage)
 * @param {Buffer} buffer - Image buffer
 * @param {string} mimeType - MIME type (e.g., 'image/jpeg')
 * @param {object} options - Override compression settings
 * @returns {Buffer} Compressed buffer
 */
export async function compressBuffer(buffer, mimeType = 'image/jpeg', options = {}) {
  try {
    if (!buffer || buffer.length < COMPRESSION_CONFIG.minSizeBytes) {
      return buffer; // Too small to bother
    }

    const isImage = mimeType && mimeType.startsWith('image/');
    if (!isImage) return buffer;

    let pipeline = sharp(buffer)
      .rotate()
      .resize(
        options.maxWidth || COMPRESSION_CONFIG.maxWidth,
        options.maxHeight || COMPRESSION_CONFIG.maxHeight,
        { fit: 'inside', withoutEnlargement: true }
      );

    if (mimeType.includes('png')) {
      pipeline = pipeline.png(options.png || COMPRESSION_CONFIG.png);
    } else if (mimeType.includes('webp')) {
      pipeline = pipeline.webp(options.webp || COMPRESSION_CONFIG.webp);
    } else {
      // Default to JPEG for most images
      pipeline = pipeline.jpeg(options.jpeg || COMPRESSION_CONFIG.jpeg);
    }

    const compressed = await pipeline.toBuffer();

    // Only return compressed if actually smaller
    if (compressed.length < buffer.length) {
      const savings = ((buffer.length - compressed.length) / buffer.length * 100).toFixed(1);
      console.log(`📦 Buffer compressed: ${(buffer.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB (${savings}% saved)`);
      return compressed;
    }

    return buffer;
  } catch (error) {
    console.error('⚠️ Buffer compression failed:', error.message);
    return buffer; // Return original on error
  }
}

/**
 * Express middleware to compress uploaded files (multer)
 * Use after multer middleware in route chain
 * @param {object} options - { type: 'image'|'document', ...compressionOptions }
 */
export function compressUploads(options = {}) {
  return async (req, res, next) => {
    try {
      const files = [];

      // Collect files from multer
      if (req.file) files.push(req.file);
      if (req.files) {
        if (Array.isArray(req.files)) {
          files.push(...req.files);
        } else {
          // req.files is an object (multer fields)
          Object.values(req.files).forEach(fieldFiles => {
            if (Array.isArray(fieldFiles)) files.push(...fieldFiles);
          });
        }
      }

      if (files.length === 0) return next();

      // Compress each uploaded file
      for (const file of files) {
        if (file.path) {
          // File stored on disk
          await compressImage(file.path, options);
          // Update file size in multer metadata
          try {
            const stats = fs.statSync(file.path);
            file.size = stats.size;
          } catch (e) {
            // ignore
          }
        } else if (file.buffer) {
          // File stored in memory
          file.buffer = await compressBuffer(file.buffer, file.mimetype, options);
          file.size = file.buffer.length;
        }
      }

      next();
    } catch (error) {
      console.error('⚠️ Upload compression middleware error:', error.message);
      next(); // Continue even if compression fails
    }
  };
}

/**
 * Compress a base64-encoded image string
 * @param {string} base64String - Base64 image data (with or without data URI prefix)
 * @param {object} options - Compression options
 * @returns {string} Compressed base64 string
 */
export async function compressBase64Image(base64String, options = {}) {
  try {
    if (!base64String) return base64String;

    // Extract base64 data and mime type
    let mimeType = 'image/jpeg';
    let base64Data = base64String;

    if (base64String.includes(',')) {
      const parts = base64String.split(',');
      const mimeMatch = parts[0].match(/data:([^;]+)/);
      if (mimeMatch) mimeType = mimeMatch[1];
      base64Data = parts[1];
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const compressed = await compressBuffer(buffer, mimeType, options);
    const compressedBase64 = compressed.toString('base64');

    // Reconstruct with data URI if original had one
    if (base64String.includes(',')) {
      return `data:${mimeType};base64,${compressedBase64}`;
    }

    return compressedBase64;
  } catch (error) {
    console.error('⚠️ Base64 compression failed:', error.message);
    return base64String;
  }
}

export default {
  compressImage,
  compressBuffer,
  compressUploads,
  compressBase64Image,
  COMPRESSION_CONFIG
};
