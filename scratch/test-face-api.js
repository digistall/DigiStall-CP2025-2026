import { validateFaceImage } from '../services/faceAnalysisService.js';
import fs from 'fs';
import path from 'path';

async function test() {
  console.log('Testing face analysis service with real png image...');
  try {
    const imgPath = path.resolve('FRONTEND/MOBILE/assets/icon.png');
    console.log('Reading image:', imgPath);
    const buffer = fs.readFileSync(imgPath);
    
    console.log('Calling validateFaceImage...');
    const result = await validateFaceImage(buffer);
    console.log('Result:', result);
  } catch (error) {
    console.error('Test script caught error:', error);
  }
}

test();
