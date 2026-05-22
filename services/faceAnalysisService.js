import * as faceapi from '@vladmandic/face-api/dist/face-api.node-wasm.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patch nodejs environment
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  const modelsPath = path.join(__dirname, '../models');
  try {
    // Ensure TensorFlow WASM backend is ready before loading models
    await faceapi.tf.ready();
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    modelsLoaded = true;
    console.log('✅ Face API models loaded successfully');
  } catch (error) {
    console.error('❌ Error loading Face API models:', error);
  }
}

/**
 * Validates a face image for quality and visibility
 * @param {Buffer} imageBuffer - The image buffer to analyze
 * @returns {Promise<{isValid: boolean, message: string}>}
 */
export async function validateFaceImage(imageBuffer) {
  try {
    await loadModels();
    
    // 1. Temporarily resize the buffer for face-api detection (reduces memory & increases accuracy)
    const resizedBuffer = await sharp(imageBuffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    
    // Convert resized buffer to canvas image
    const img = await loadImage(resizedBuffer);
    
    // Simple lighting check: Check average brightness of the image
    const canvas = new Canvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let brightnessSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Perceived brightness formula: 0.299*R + 0.587*G + 0.114*B
      brightnessSum += (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
    }
    const avgBrightness = brightnessSum / (data.length / 4);
    
    if (avgBrightness < 40) {
      return { isValid: false, message: 'Image is too dark. Please ensure good lighting.' };
    }
    if (avgBrightness > 240) {
      return { isValid: false, message: 'Image is too bright. Please avoid strong backlighting.' };
    }
    
    console.log(`📷 Analyzing face image (resized for detection): size=${img.width}x${img.height}, brightness=${avgBrightness.toFixed(2)}`);

    // SsdMobilenetv1Options: lower minConfidence to 0.3 to be robust with mobile captures
    const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 });

    // Detect faces with landmarks
    let detections = await faceapi.detectAllFaces(img, detectionOptions).withFaceLandmarks();
    let rotatedBuffer = null;
    let finalImg = img;
    
    if (detections.length === 0) {
      console.log('🔍 No faces detected in original orientation, trying rotations...');
      // Sequentially rotate the image by 90°, 270°, and 180° and run the detector on each
      const rotations = [90, 270, 180];
      for (const degrees of rotations) {
        try {
          // Rotate the resized buffer for quick face detection
          const tempRotatedBuffer = await sharp(resizedBuffer).rotate(degrees).toBuffer();
          const tempImg = await loadImage(tempRotatedBuffer);
          const tempDetections = await faceapi.detectAllFaces(tempImg, detectionOptions).withFaceLandmarks();
          
          if (tempDetections.length > 0) {
            console.log(`✅ Face detected successfully after rotating ${degrees}° (confidence score: ${tempDetections[0].detection.score.toFixed(2)})`);
            detections = tempDetections;
            finalImg = tempImg;
            
            // Apply the rotation to the ORIGINAL high-resolution buffer to save to the DB
            rotatedBuffer = await sharp(imageBuffer).rotate(degrees).toBuffer();
            break;
          }
        } catch (rotError) {
          console.error(`Error trying rotation ${degrees}°:`, rotError);
        }
      }
    } else {
      console.log(`✅ Face detected in original orientation (confidence score: ${detections[0].detection.score.toFixed(2)})`);
    }
    
    if (detections.length === 0) {
      console.log('❌ No face detected in the image after checking all orientations.');
      return { isValid: false, message: 'No face detected in the image.' };
    }
    
    if (detections.length > 1) {
      console.log(`⚠️ Multiple faces detected: ${detections.length}`);
      return { isValid: false, message: 'Multiple faces detected. Please ensure only your face is visible.' };
    }
    
    const face = detections[0];
    
    // Heuristic: Check if face occupies a reasonable portion of the image
    const faceArea = face.detection.box.width * face.detection.box.height;
    const imgArea = finalImg.width * finalImg.height;
    const faceRatio = faceArea / imgArea;
    
    if (faceRatio < 0.05) {
      return { isValid: false, message: 'Face is too far away. Please move closer to the camera.' };
    }
    
    // Return success along with the rotated buffer (if any correction was applied)
    return { 
      isValid: true, 
      message: 'Face validation successful.',
      rotatedBuffer: rotatedBuffer
    };
    
  } catch (error) {
    console.error('Error during face validation:', error);
    // If validation fails due to library errors, we still allow it so we don't block users due to server issues,
    // but log the error.
    return { isValid: true, message: 'Face validation bypassed due to technical error.' };
  }
}

export default {
  validateFaceImage
};
