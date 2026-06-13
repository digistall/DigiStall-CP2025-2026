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
 * Passive anti-spoofing check using pixel-level heuristics.
 * Detects presentation attacks: photos shown on screens or printed photos
 * held up to the camera.
 *
 * Uses three independent signals and requires at least 2 to fire before
 * rejecting, keeping the false-positive rate low for real users.
 *
 * @param {CanvasRenderingContext2D} ctx  - Canvas context of the (possibly rotated) face image
 * @param {Object} bbox                  - Face bounding box { x, y, width, height }
 * @param {{ width: number, height: number }} img - Image dimensions
 * @returns {{ isLive: boolean, reason: string, scores: Object }}
 */
function checkPresentationAttack(ctx, bbox, img) {
  // Work on the inner 76% of the face box to avoid boundary noise
  const margin = 0.12;
  const x  = Math.max(0, Math.floor(bbox.x + bbox.width  * margin));
  const y  = Math.max(0, Math.floor(bbox.y + bbox.height * margin));
  const w  = Math.min(img.width  - x, Math.ceil(bbox.width  * (1 - 2 * margin)));
  const h  = Math.min(img.height - y, Math.ceil(bbox.height * (1 - 2 * margin)));

  if (w < 20 || h < 20) {
    // Face region too small to perform analysis — skip without blocking
    return { isLive: true, reason: 'face_too_small_for_liveness', scores: {} };
  }

  const imgData = ctx.getImageData(x, y, w, h);
  const data    = imgData.data;
  const n       = w * h;

  // ── Grayscale array ─────────────────────────────────────────────────────────
  const gray = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  // ── Signal 1: Laplacian Energy (micro-texture measure) ───────────────────────
  // Real skin captured by a camera has natural micro-texture (pores, fine hairs,
  // camera sensor noise). A photo displayed on a screen or printed on paper has
  // much lower micro-texture because the screen/print averaging smooths it out.
  // The 8-neighbour Laplacian kernel measures the second spatial derivative;
  // its mean absolute value (energy) reflects texture richness.
  let lapSum = 0;
  let lapCount = 0;
  for (let row = 1; row < h - 1; row++) {
    for (let col = 1; col < w - 1; col++) {
      const idx = row * w + col;
      const lap = Math.abs(
        - gray[idx - w - 1] - gray[idx - w] - gray[idx - w + 1]
        - gray[idx - 1]     + 8 * gray[idx] - gray[idx + 1]
        - gray[idx + w - 1] - gray[idx + w] - gray[idx + w + 1]
      );
      lapSum += lap;
      lapCount++;
    }
  }
  const laplacianEnergy = lapCount > 0 ? lapSum / lapCount : 0;

  // ── Signal 2: Local Block Variance (uniform-patch detector) ──────────────────
  // Divide the face crop into 6×6 pixel blocks and compute per-block brightness
  // variance. A flat/printed image tends to have very small within-block variance
  // because all pixels in a small patch are nearly the same value.
  const BLOCK = 6;
  let blockVarSum = 0;
  let blockCount  = 0;
  for (let by = 0; by + BLOCK <= h; by += BLOCK) {
    for (let bx = 0; bx + BLOCK <= w; bx += BLOCK) {
      let s = 0, sq = 0;
      for (let r = by; r < by + BLOCK; r++) {
        for (let c = bx; c < bx + BLOCK; c++) {
          const v = gray[r * w + c];
          s  += v;
          sq += v * v;
        }
      }
      const cnt  = BLOCK * BLOCK;
      const mean = s / cnt;
      blockVarSum += (sq / cnt) - (mean * mean);
      blockCount++;
    }
  }
  const meanBlockVar = blockCount > 0 ? blockVarSum / blockCount : 0;

  // ── Signal 3: Color Channel Analysis ────────────────────────────────────────
  // LCD/OLED screens emit strong blue light, making photos-of-screens noticeably
  // bluer than a real face under normal room lighting (where R > G > B for most
  // skin tones). Additionally, screen rendering uses the sRGB colour space with
  // precise per-channel values, causing an unusual variance imbalance across
  // channels compared with natural skin.
  let rSum = 0, gSum = 0, bSum = 0;
  let rSq  = 0, gSq  = 0, bSq  = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    rSum += r;  gSum += g;  bSum += b;
    rSq  += r * r;  gSq += g * g;  bSq += b * b;
  }
  const rMean = rSum / n;
  const gMean = gSum / n;
  const bMean = bSum / n;
  const rVar  = (rSq / n) - (rMean * rMean);
  const gVar  = (gSq / n) - (gMean * gMean);
  const bVar  = (bSq / n) - (bMean * bMean);

  // How "blue" is the face region relative to red?
  const blueToRedRatio = rMean > 5 ? bMean / rMean : 1.0;
  // How unequal are the channel variances? (extreme imbalance = screen sRGB)
  const maxVar          = Math.max(rVar, gVar, bVar);
  const minVar          = Math.min(rVar, gVar, bVar);
  const channelVarRatio = minVar > 0 ? maxVar / minVar : 10;

  const scores = {
    laplacianEnergy:  +laplacianEnergy.toFixed(3),
    meanBlockVar:     +meanBlockVar.toFixed(3),
    blueToRedRatio:   +blueToRedRatio.toFixed(3),
    channelVarRatio:  +channelVarRatio.toFixed(3),
  };

  console.log(`🔍 Anti-spoofing scores: ${JSON.stringify(scores)}`);

  // ── Decision ─────────────────────────────────────────────────────────────────
  // Each threshold was chosen to sit well inside the "obvious spoof" zone and
  // well away from real-user values, so borderline cases are not punished.
  // We require at least 2 of 4 signals to fire before rejecting, reducing the
  // chance of wrongly blocking a legitimate user with unusual lighting or skin tone.
  const lowTexture      = laplacianEnergy  < 2.5;   // Very flat micro-texture → screen/print
  const lowVariance     = meanBlockVar     < 12.0;   // Highly uniform patches → flat image
  const highBlue        = blueToRedRatio   > 0.88;   // Screen blue-light elevation
  const unevenChannels  = channelVarRatio  > 10.0;   // sRGB channel imbalance → rendered image

  const flagCount = [lowTexture, lowVariance, highBlue, unevenChannels].filter(Boolean).length;

  if (flagCount >= 2) {
    const reasons = [];
    if (lowTexture)     reasons.push(`low_texture(lap=${laplacianEnergy.toFixed(2)})`);
    if (lowVariance)    reasons.push(`low_variance(bv=${meanBlockVar.toFixed(2)})`);
    if (highBlue)       reasons.push(`screen_blue(b/r=${blueToRedRatio.toFixed(2)})`);
    if (unevenChannels) reasons.push(`channel_imbalance(ratio=${channelVarRatio.toFixed(1)})`);
    return { isLive: false, reason: reasons.join(', '), scores };
  }

  return { isLive: true, reason: 'passed', scores };
}

/**
 * Validates a face image for quality and visibility
 * @param {Buffer} imageBuffer - The image buffer to analyze
 * @param {boolean} isRealTime - Whether this is a real-time check loop (strict verification, no bypass on error)
 * @returns {Promise<{isValid: boolean, message: string}>}
 */
export async function validateFaceImage(imageBuffer, isRealTime = false) {
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

    // SsdMobilenetv1Options: minConfidence raised to 0.55 to prevent background false positives, especially in real-time loops
    const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.55 });

    // Detect faces with landmarks
    let detections = await faceapi.detectAllFaces(img, detectionOptions).withFaceLandmarks();
    let rotatedBuffer = null;
    let finalImg = img;
    let finalCtx = ctx;
    
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

            // Build a new canvas for the rotated image so anti-spoofing runs on correct pixels
            const rotCanvas = new Canvas(tempImg.width, tempImg.height);
            const rotCtx = rotCanvas.getContext('2d');
            rotCtx.drawImage(tempImg, 0, 0);
            finalCtx = rotCtx;
            
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
    
    if (faceRatio > 0.35) {
      return { isValid: false, message: 'Face is too close. Please move back to fit the circle.' };
    }

    // Heuristic: Check if face is centered in the frame
    const faceCenterX = face.detection.box.x + face.detection.box.width / 2;
    const faceCenterY = face.detection.box.y + face.detection.box.height / 2;
    const imgCenterX = finalImg.width / 2;
    const imgCenterY = finalImg.height / 2;
    const xOffset = Math.abs(faceCenterX - imgCenterX) / finalImg.width;
    const yOffset = Math.abs(faceCenterY - imgCenterY) / finalImg.height;

    if (xOffset > 0.15 || yOffset > 0.15) {
      return { isValid: false, message: 'Face is not centered. Please center your face inside the circle.' };
    }
    
    // AI Sunglasses & Eye Occlusion Scanner Heuristic
    try {
      const landmarks = face.landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      
      // Create canvas for the final (possibly rotated) image to compute eye region stats
      const finalCanvas = new Canvas(finalImg.width, finalImg.height);
      const finalCtxEye = finalCanvas.getContext('2d');
      finalCtxEye.drawImage(finalImg, 0, 0);
      
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
        
        const imgData = finalCtxEye.getImageData(sampleMinX, sampleMinY, width, height);
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
      const faceImgData = finalCtxEye.getImageData(
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

    // ── Anti-Spoofing / Liveness Check ──────────────────────────────────────────
    // Detects presentation attacks: a photo displayed on a screen or a printed photo.
    // This runs after all other checks pass to avoid redundant processing.
    try {
      const livenessResult = checkPresentationAttack(finalCtx, face.detection.box, finalImg);

      if (!livenessResult.isLive) {
        console.log(`❌ Anti-spoofing check failed — reason: ${livenessResult.reason}`);
        return {
          isValid: false,
          message: 'Live face required. Please take the photo directly with your front camera. Using a photo from a screen or printed image is not allowed.',
        };
      }

      console.log(`✅ Anti-spoofing check passed`);
    } catch (spoofErr) {
      // Do not block users if the liveness check itself errors (e.g. edge-case image geometry)
      console.error('Error during anti-spoofing check:', spoofErr);
    }
    
    // Return success along with the rotated buffer (if any correction was applied)
    return { 
      isValid: true, 
      message: 'Face validation successful.',
      rotatedBuffer: rotatedBuffer
    };
    
  } catch (error) {
    console.error('Error during face validation:', error);
    if (isRealTime) {
      // In real-time checking, do not bypass library errors to avoid false successes triggering auto-captures
      return { isValid: false, message: 'AI Scanner is initializing or busy. Please wait...', isError: true };
    }
    // If validation fails due to library errors during final verification upload, we still allow it so we don't block users due to server issues,
    // but log the error.
    return { isValid: true, message: 'Face validation bypassed due to technical error.' };
  }
}

export default {
  validateFaceImage
};
