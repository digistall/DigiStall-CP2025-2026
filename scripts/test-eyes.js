import { createConnection } from '../config/database.js';
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
  await faceapi.tf.ready();
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
  modelsLoaded = true;
  console.log('✅ Models loaded');
}

async function analyze() {
  let connection;
  try {
    await loadModels();
    
    connection = await createConnection();
    const encryptionKey = process.env.DATA_ENCRYPTION_KEY || 'DigiStall2025SecureKeyForEncryption123';
    
    console.log('Fetching face verification for stallholder 1...');
    const [rows] = await connection.execute(
      'CALL sp_getFaceVerification(?, ?)',
      [1, encryptionKey]
    );
    
    const records = rows[0];
    if (!records || records.length === 0 || !records[0].image_data) {
      console.log('No face image found in database for stallholder 1');
      return;
    }
    
    const buffer = records[0].image_data;
    console.log('Image retrieved, size:', buffer.length);
    
    const img = await loadImage(buffer);
    const canvas = new Canvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const detectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 });
    const detections = await faceapi.detectAllFaces(img, detectionOptions).withFaceLandmarks();
    
    if (detections.length === 0) {
      console.log('No face detected in the image');
      return;
    }
    
    console.log('Face detected!');
    const face = detections[0];
    const landmarks = face.landmarks;
    
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();
    const jaw = landmarks.getJawOutline();
    
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
        sampleMaxX = Math.min(img.width - 1, Math.ceil(maxX));
        sampleMinY = Math.max(0, Math.floor(maxY + h * 0.5));
        sampleMaxY = Math.min(img.height - 1, Math.ceil(maxY + h * 1.8));
      } else {
        // Eye region expanded slightly to catch sunglasses frames/lenses
        sampleMinX = Math.max(0, Math.floor(minX - w * expandRatio));
        sampleMaxX = Math.min(img.width - 1, Math.ceil(maxX + w * expandRatio));
        sampleMinY = Math.max(0, Math.floor(minY - h * expandRatio));
        sampleMaxY = Math.min(img.height - 1, Math.ceil(maxY + h * expandRatio));
      }
      
      const width = sampleMaxX - sampleMinX;
      const height = sampleMaxY - sampleMinY;
      
      if (width <= 0 || height <= 0) return { mean: 0, stdDev: 0 };
      
      const imgData = ctx.getImageData(sampleMinX, sampleMinY, width, height);
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
    
    // Average face brightness using the face bounding box
    const bbox = face.detection.box;
    const faceImgData = ctx.getImageData(Math.floor(bbox.x), Math.floor(bbox.y), Math.ceil(bbox.width), Math.ceil(bbox.height));
    const faceData = faceImgData.data;
    let faceBrightnessSum = 0;
    for (let i = 0; i < faceData.length; i += 4) {
      faceBrightnessSum += (0.299 * faceData[i] + 0.587 * faceData[i+1] + 0.114 * faceData[i+2]);
    }
    const faceBright = faceBrightnessSum / (faceData.length / 4);
    
    const leftEyeStats = getRegionStats(leftEye, 0.2, false);
    const leftCheekStats = getRegionStats(leftEye, 0.2, true);
    
    const rightEyeStats = getRegionStats(rightEye, 0.2, false);
    const rightCheekStats = getRegionStats(rightEye, 0.2, true);
    
    console.log('--- ANALYSIS RESULTS ---');
    console.log(`Whole Face Brightness: ${faceBright.toFixed(2)}`);
    console.log(`Left Eye Brightness (Mean): ${leftEyeStats.mean.toFixed(2)}, StdDev: ${leftEyeStats.stdDev.toFixed(2)}`);
    console.log(`Left Cheek Brightness (Mean): ${leftCheekStats.mean.toFixed(2)}, StdDev: ${leftCheekStats.stdDev.toFixed(2)}`);
    console.log(`Left Eye/Cheek Ratio: ${(leftEyeStats.mean / leftCheekStats.mean).toFixed(3)}`);
    
    console.log(`Right Eye Brightness (Mean): ${rightEyeStats.mean.toFixed(2)}, StdDev: ${rightEyeStats.stdDev.toFixed(2)}`);
    console.log(`Right Cheek Brightness (Mean): ${rightCheekStats.mean.toFixed(2)}, StdDev: ${rightCheekStats.stdDev.toFixed(2)}`);
    console.log(`Right Eye/Cheek Ratio: ${(rightEyeStats.mean / rightCheekStats.mean).toFixed(3)}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

analyze();
