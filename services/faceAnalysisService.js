import * as faceapi from '@vladmandic/face-api/dist/face-api.node-wasm.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patch nodejs environment
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  const modelsPath = path.join(__dirname, '../models');
  try {
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
    
    // Convert buffer to canvas image
    const img = await loadImage(imageBuffer);
    
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
    
    // Detect faces with landmarks
    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks();
    
    if (detections.length === 0) {
      return { isValid: false, message: 'No face detected in the image.' };
    }
    
    if (detections.length > 1) {
      return { isValid: false, message: 'Multiple faces detected. Please ensure only your face is visible.' };
    }
    
    const face = detections[0];
    const landmarks = face.landmarks;
    
    // Heuristic: Check if face occupies a reasonable portion of the image
    const faceArea = face.detection.box.width * face.detection.box.height;
    const imgArea = img.width * img.height;
    const faceRatio = faceArea / imgArea;
    
    if (faceRatio < 0.05) {
      return { isValid: false, message: 'Face is too far away. Please move closer to the camera.' };
    }
    
    // Return success
    return { isValid: true, message: 'Face validation successful.' };
    
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
