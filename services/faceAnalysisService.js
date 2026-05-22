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
    
    // AI Sunglasses & Eye Occlusion Scanner Heuristic
    try {
      const landmarks = face.landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      
      // Create canvas for the final (possibly rotated) image to compute eye region stats
      const finalCanvas = new Canvas(finalImg.width, finalImg.height);
      const finalCtx = finalCanvas.getContext('2d');
      finalCtx.drawImage(finalImg, 0, 0);
      
      // Function to calculate average brightness and standard deviation of a region
      function getRegionStats(points, expandRatio = 0.2, isCheek = false) {
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const w = maxX - minX;
        const h = maxY - minY;
        
        let sampleMinX, sampleMaxX, sampleMinY, sampleMaxY;
        
        if (isCheek) {
          // Cheek region is located directly below the eye
          sampleMinX = Math.max(0, Math.floor(minX));
          sampleMaxX = Math.min(finalImg.width - 1, Math.ceil(maxX));
          sampleMinY = Math.max(0, Math.floor(maxY + h * 0.5));
          sampleMaxY = Math.min(finalImg.height - 1, Math.ceil(maxY + h * 1.8));
        } else {
          // Eye region expanded slightly to catch sunglasses frames/lenses
          sampleMinX = Math.max(0, Math.floor(minX - w * expandRatio));
          sampleMaxX = Math.min(finalImg.width - 1, Math.ceil(maxX + w * expandRatio));
          sampleMinY = Math.max(0, Math.floor(minY - h * expandRatio));
          sampleMaxY = Math.min(finalImg.height - 1, Math.ceil(maxY + h * expandRatio));
        }
        
        const width = sampleMaxX - sampleMinX;
        const height = sampleMaxY - sampleMinY;
        
        if (width <= 0 || height <= 0) return { mean: 0, stdDev: 0 };
        
        const imgData = finalCtx.getImageData(sampleMinX, sampleMinY, width, height);
        const data = imgData.data;
        
        let sum = 0;
        let sumSq = 0;
        const count = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          const v = (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
          sum += v;
          sumSq += v * v;
        }
        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);
        const stdDev = Math.sqrt(Math.max(0, variance));
        
        return { mean, stdDev };
      }
      
      const bbox = face.detection.box;
      const faceImgData = finalCtx.getImageData(
        Math.max(0, Math.floor(bbox.x)),
        Math.max(0, Math.floor(bbox.y)),
        Math.min(finalImg.width - Math.max(0, Math.floor(bbox.x)), Math.ceil(bbox.width)),
        Math.min(finalImg.height - Math.max(0, Math.floor(bbox.y)), Math.ceil(bbox.height))
      );
      const faceData = faceImgData.data;
      let faceBrightnessSum = 0;
      for (let i = 0; i < faceData.length; i += 4) {
        faceBrightnessSum += (0.299 * faceData[i] + 0.587 * faceData[i+1] + 0.114 * faceData[i+2]);
      }
      const faceBright = faceData.length > 0 ? (faceBrightnessSum / (faceData.length / 4)) : avgBrightness;

      const leftEyeStats = getRegionStats(leftEye, 0.2, false);
      const leftCheekStats = getRegionStats(leftEye, 0.2, true);
      
      const rightEyeStats = getRegionStats(rightEye, 0.2, false);
      const rightCheekStats = getRegionStats(rightEye, 0.2, true);
      
      const leftRatio = leftCheekStats.mean > 0 ? (leftEyeStats.mean / leftCheekStats.mean) : 1.0;
      const rightRatio = rightCheekStats.mean > 0 ? (rightEyeStats.mean / rightCheekStats.mean) : 1.0;

      const leftEyeFaceRatio = faceBright > 0 ? (leftEyeStats.mean / faceBright) : 1.0;
      const rightEyeFaceRatio = faceBright > 0 ? (rightEyeStats.mean / faceBright) : 1.0;
      
      console.log(`👁️ Eye analysis stats:
        Face Brightness: ${faceBright.toFixed(2)}
        Left Eye: mean=${leftEyeStats.mean.toFixed(2)}, stdDev=${leftEyeStats.stdDev.toFixed(2)}, cheek=${leftCheekStats.mean.toFixed(2)}, cheek_ratio=${leftRatio.toFixed(3)}, face_ratio=${leftEyeFaceRatio.toFixed(3)}
        Right Eye: mean=${rightEyeStats.mean.toFixed(2)}, stdDev=${rightEyeStats.stdDev.toFixed(2)}, cheek=${rightCheekStats.mean.toFixed(2)}, cheek_ratio=${rightRatio.toFixed(3)}, face_ratio=${rightEyeFaceRatio.toFixed(3)}
      `);
      
      // Heuristics checks (OR logic: if either eye is occluded, dark, or uniform, reject)
      const darkEyesRatio = leftRatio < 0.40 || rightRatio < 0.40;
      const darkEyesFaceRatio = leftEyeFaceRatio < 0.40 || rightEyeFaceRatio < 0.40;
      const absoluteDarkEyes = leftEyeStats.mean < 25.0 || rightEyeStats.mean < 25.0;
      const uniformStdDev = (leftEyeStats.stdDev < 5.0 && leftEyeStats.mean < 40.0) || (rightEyeStats.stdDev < 5.0 && rightEyeStats.mean < 40.0);
      
      if (darkEyesRatio || darkEyesFaceRatio || absoluteDarkEyes || uniformStdDev) {
        console.log(`❌ Face rejected due to eye occlusion: darkEyesRatio=${darkEyesRatio}, darkEyesFaceRatio=${darkEyesFaceRatio}, absoluteDarkEyes=${absoluteDarkEyes}, uniformStdDev=${uniformStdDev}`);
        return {
          isValid: false,
          message: 'Eyes are not clearly visible. Please remove sunglasses/glasses or ensure eyes are not in deep shadow.'
        };
      }
    } catch (eyeErr) {
      console.error('Error during eye/sunglasses validation heuristic:', eyeErr);
      // Bypassed if calculation fails, so we do not block legitimate users
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
