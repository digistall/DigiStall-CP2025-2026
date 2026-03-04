// =============================================
// IMAGE COMPRESSION UTILITY
// =============================================
// Purpose: Compress uploaded images using sharp
// - Accepts high-res uploads (up to 10MB)
// - Compresses on save to reduce storage & bandwidth
// - Serves compressed version (still looks high quality)
// - Supports JPEG, PNG, WebP output
// =============================================

import sharp from "sharp";
import fs from "fs";
import path from "path";

// Compression settings - balanced quality vs size
const COMPRESSION_CONFIG = {
  // Max dimensions (maintains aspect ratio)
  maxWidth: 1920,
  maxHeight: 1920,

  jpeg: {
    quality: 80,
    mozjpeg: true, // Use mozjpeg for better compression
    chromaSubsampling: "4:2:0",
  },

  png: {
    quality: 80,
    compressionLevel: 8, // 0-9, higher = more compression
    palette: true, // Use palette-based compression when possible
  },

  webp: {
    quality: 80,
    effort: 4, // 0-6, higher = slower but better
  },

  // For document images (signatures, IDs) - keep higher quality
  document: {
    maxWidth: 2048,
    maxHeight: 2048,
    jpeg: { quality: 85, mozjpeg: true },
    png: { quality: 85, compressionLevel: 7 },
  },

  // For thumbnails / stall card previews
  thumbnail: {
    maxWidth: 800,
    maxHeight: 800,
    jpeg: { quality: 75, mozjpeg: true },
    png: { quality: 75, compressionLevel: 9 },
  },
};

/**
 * Compress a single image file in-place
 * @param {string} filePath - Full path to the image file
 * @param {Object} options - Compression options
 * @param {string} options.type - 'default' | 'document' | 'thumbnail'
 * @param {boolean} options.keepFormat - Keep original format (default: true)
 * @returns {Object} { originalSize, compressedSize, savings, path }
 */
export async function compressImage(filePath, options = {}) {
  const { type = "default", keepFormat = true } = options;

  try {
    // Read original file
    const originalBuffer = fs.readFileSync(filePath);
    const originalSize = originalBuffer.length;

    // Skip if file is already small (under 50KB)
    if (originalSize < 50 * 1024) {
      return {
        originalSize,
        compressedSize: originalSize,
        savings: "0%",
        path: filePath,
        skipped: true,
      };
    }

    const ext = path.extname(filePath).toLowerCase();
    const config =
      type === "document"
        ? COMPRESSION_CONFIG.document
        : type === "thumbnail"
          ? COMPRESSION_CONFIG.thumbnail
          : COMPRESSION_CONFIG;

    const maxWidth = config.maxWidth || COMPRESSION_CONFIG.maxWidth;
    const maxHeight = config.maxHeight || COMPRESSION_CONFIG.maxHeight;

    // Build sharp pipeline
    let pipeline = sharp(originalBuffer)
      .rotate() // Auto-rotate based on EXIF
      .resize(maxWidth, maxHeight, {
        fit: "inside", // Maintain aspect ratio
        withoutEnlargement: true, // Don't upscale small images
      });

    // Apply format-specific compression
    if (ext === ".jpg" || ext === ".jpeg") {
      const jpegConfig = config.jpeg || COMPRESSION_CONFIG.jpeg;
      pipeline = pipeline.jpeg(jpegConfig);
    } else if (ext === ".png") {
      const pngConfig = config.png || COMPRESSION_CONFIG.png;
      pipeline = pipeline.png(pngConfig);
    } else if (ext === ".webp") {
      const webpConfig = config.webp || COMPRESSION_CONFIG.webp;
      pipeline = pipeline.webp(webpConfig);
    } else {
      // Unknown format, try JPEG compression
      pipeline = pipeline.jpeg(COMPRESSION_CONFIG.jpeg);
    }

    // Compress
    const compressedBuffer = await pipeline.toBuffer();
    const compressedSize = compressedBuffer.length;

    // Only write if compression actually reduced size
    if (compressedSize < originalSize) {
      fs.writeFileSync(filePath, compressedBuffer);
      const savingsPercent = (
        (1 - compressedSize / originalSize) *
        100
      ).toFixed(1);

      console.log(
        `🗜️  Compressed: ${path.basename(filePath)} | ${formatSize(originalSize)} → ${formatSize(compressedSize)} (${savingsPercent}% saved)`,
      );

      return {
        originalSize,
        compressedSize,
        savings: `${savingsPercent}%`,
        path: filePath,
        skipped: false,
      };
    } else {
      // Compressed version is larger (rare), keep original
      return {
        originalSize,
        compressedSize: originalSize,
        savings: "0%",
        path: filePath,
        skipped: true,
      };
    }
  } catch (error) {
    console.error(`❌ Compression failed for ${filePath}:`, error.message);
    // Don't throw - return original file unchanged
    return {
      originalSize: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
      compressedSize: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
      savings: "0%",
      path: filePath,
      skipped: true,
      error: error.message,
    };
  }
}

/**
 * Compress a buffer (for BLOB storage)
 * @param {Buffer} inputBuffer - Original image buffer
 * @param {string} mimeType - e.g. 'image/jpeg', 'image/png'
 * @param {Object} options - Compression options
 * @returns {Object} { buffer, originalSize, compressedSize, savings }
 */
export async function compressBuffer(
  inputBuffer,
  mimeType = "image/jpeg",
  options = {},
) {
  const { type = "document" } = options;

  try {
    const originalSize = inputBuffer.length;

    // Skip if already small (under 50KB)
    if (originalSize < 50 * 1024) {
      return {
        buffer: inputBuffer,
        originalSize,
        compressedSize: originalSize,
        savings: "0%",
        skipped: true,
      };
    }

    const config =
      type === "document"
        ? COMPRESSION_CONFIG.document
        : type === "thumbnail"
          ? COMPRESSION_CONFIG.thumbnail
          : COMPRESSION_CONFIG;

    const maxWidth = config.maxWidth || COMPRESSION_CONFIG.maxWidth;
    const maxHeight = config.maxHeight || COMPRESSION_CONFIG.maxHeight;

    let pipeline = sharp(inputBuffer).rotate().resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });

    // Apply compression based on MIME type
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
      pipeline = pipeline.jpeg(config.jpeg || COMPRESSION_CONFIG.jpeg);
    } else if (mimeType.includes("png")) {
      pipeline = pipeline.png(config.png || COMPRESSION_CONFIG.png);
    } else if (mimeType.includes("webp")) {
      pipeline = pipeline.webp(config.webp || COMPRESSION_CONFIG.webp);
    } else {
      // Default to JPEG
      pipeline = pipeline.jpeg(COMPRESSION_CONFIG.jpeg);
    }

    const compressedBuffer = await pipeline.toBuffer();
    const compressedSize = compressedBuffer.length;

    if (compressedSize < originalSize) {
      const savingsPercent = (
        (1 - compressedSize / originalSize) *
        100
      ).toFixed(1);
      console.log(
        `🗜️  Buffer compressed: ${formatSize(originalSize)} → ${formatSize(compressedSize)} (${savingsPercent}% saved)`,
      );

      return {
        buffer: compressedBuffer,
        originalSize,
        compressedSize,
        savings: `${savingsPercent}%`,
        skipped: false,
      };
    } else {
      return {
        buffer: inputBuffer,
        originalSize,
        compressedSize: originalSize,
        savings: "0%",
        skipped: true,
      };
    }
  } catch (error) {
    console.error(`❌ Buffer compression failed:`, error.message);
    return {
      buffer: inputBuffer,
      originalSize: inputBuffer.length,
      compressedSize: inputBuffer.length,
      savings: "0%",
      skipped: true,
      error: error.message,
    };
  }
}

/**
 * Express middleware: compress uploaded files after multer saves them
 * Use AFTER multer middleware in the route chain
 * @param {Object} options - { type: 'default' | 'document' | 'thumbnail' }
 */
export function compressUploads(options = {}) {
  return async (req, res, next) => {
    try {
      const files = [];

      // Collect files from req.file (single) or req.files (array or fields)
      if (req.file) {
        files.push(req.file);
      }
      if (req.files) {
        if (Array.isArray(req.files)) {
          files.push(...req.files);
        } else {
          // Fields object: { fieldname: [files] }
          Object.values(req.files).forEach((fieldFiles) => {
            if (Array.isArray(fieldFiles)) {
              files.push(...fieldFiles);
            }
          });
        }
      }

      if (files.length === 0) {
        return next();
      }

      // Filter only image files (skip PDFs etc.)
      const imageFiles = files.filter((f) => {
        const ext = path
          .extname(f.originalname || f.filename || "")
          .toLowerCase();
        return (
          [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ||
          (f.mimetype && f.mimetype.startsWith("image/"))
        );
      });

      if (imageFiles.length === 0) {
        return next();
      }

      // Compress all image files in parallel
      const results = await Promise.all(
        imageFiles.map((file) => compressImage(file.path, options)),
      );

      // Update file sizes in req.files metadata
      results.forEach((result, index) => {
        if (!result.skipped && imageFiles[index]) {
          imageFiles[index].size = result.compressedSize;
          imageFiles[index].compressed = true;
          imageFiles[index].originalSize = result.originalSize;
          imageFiles[index].compressionSavings = result.savings;
        }
      });

      const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
      const totalCompressed = results.reduce(
        (sum, r) => sum + r.compressedSize,
        0,
      );
      const totalSaved = totalOriginal - totalCompressed;

      if (totalSaved > 0) {
        console.log(
          `🗜️  Upload compression: ${imageFiles.length} files | ${formatSize(totalOriginal)} → ${formatSize(totalCompressed)} (saved ${formatSize(totalSaved)})`,
        );
      }

      next();
    } catch (error) {
      console.error("❌ Upload compression middleware error:", error);
      // Don't block the upload if compression fails
      next();
    }
  };
}

/**
 * Compress base64 image data (used in applicant document BLOB flow)
 * @param {string} base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param {Object} options - { type: 'document' | 'default' }
 * @returns {string} Compressed base64 data (with prefix if original had one)
 */
export async function compressBase64Image(
  base64Data,
  options = { type: "document" },
) {
  try {
    // Extract prefix and raw data
    let prefix = "";
    let rawBase64 = base64Data;
    let mimeType = "image/jpeg";

    if (base64Data.includes(",")) {
      const parts = base64Data.split(",");
      prefix = parts[0] + ",";
      rawBase64 = parts[1];

      // Extract mime type from prefix
      const mimeMatch = parts[0].match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    // Skip non-image types (e.g., PDF)
    if (!mimeType.startsWith("image/")) {
      return base64Data;
    }

    // Convert to buffer
    const inputBuffer = Buffer.from(rawBase64, "base64");

    // Compress
    const result = await compressBuffer(inputBuffer, mimeType, options);

    if (result.skipped) {
      return base64Data;
    }

    // Convert back to base64
    const compressedBase64 = result.buffer.toString("base64");

    return prefix ? prefix + compressedBase64 : compressedBase64;
  } catch (error) {
    console.error("❌ Base64 compression failed:", error.message);
    return base64Data; // Return original on failure
  }
}

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

export default {
  compressImage,
  compressBuffer,
  compressUploads,
  compressBase64Image,
};
