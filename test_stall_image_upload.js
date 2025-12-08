// =============================================
// STALL IMAGE UPLOAD - TEST SCRIPT
// =============================================
// Purpose: Test the stall image upload functionality
// Usage: node test_stall_image_upload.js
// =============================================

import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

// Configuration
const BASE_URL = 'http://localhost:5000'
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE' // Replace with actual token

// Test data
const TEST_STALL = {
  stall_id: 1,
  branch_id: 1,
  stall_number: 25
}

// =============================================
// TEST 1: Upload Images
// =============================================
async function testUploadImages() {
  console.log('\n=== TEST 1: Upload Images ===')
  
  try {
    const formData = new FormData()
    
    // Note: Replace with actual image file paths
    // formData.append('images', fs.createReadStream('path/to/image1.jpg'))
    // formData.append('images', fs.createReadStream('path/to/image2.jpg'))
    
    formData.append('stall_id', TEST_STALL.stall_id)
    formData.append('branch_id', TEST_STALL.branch_id)
    formData.append('stall_number', TEST_STALL.stall_number)
    formData.append('is_primary', 'true')
    
    const response = await axios.post(
      `${BASE_URL}/api/stalls/${TEST_STALL.stall_id}/images/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      }
    )
    
    console.log('✅ Upload Success:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Upload Failed:', error.response?.data || error.message)
    throw error
  }
}

// =============================================
// TEST 2: Get All Images
// =============================================
async function testGetImages() {
  console.log('\n=== TEST 2: Get All Images ===')
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/stalls/${TEST_STALL.stall_id}/images`,
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      }
    )
    
    console.log('✅ Get Images Success:')
    console.log(`   Total Images: ${response.data.data.total}`)
    response.data.data.images.forEach((img, index) => {
      console.log(`   ${index + 1}. ID: ${img.id}, Primary: ${img.is_primary ? 'Yes' : 'No'}`)
      console.log(`      URL: ${img.image_url}`)
    })
    
    return response.data
  } catch (error) {
    console.error('❌ Get Images Failed:', error.response?.data || error.message)
    throw error
  }
}

// =============================================
// TEST 3: Get Image Count
// =============================================
async function testGetImageCount() {
  console.log('\n=== TEST 3: Get Image Count ===')
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/stalls/${TEST_STALL.stall_id}/images/count`,
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      }
    )
    
    console.log('✅ Get Count Success:')
    console.log(`   Current: ${response.data.data.current}`)
    console.log(`   Remaining: ${response.data.data.remaining}`)
    console.log(`   Max: ${response.data.data.max}`)
    
    return response.data
  } catch (error) {
    console.error('❌ Get Count Failed:', error.response?.data || error.message)
    throw error
  }
}

// =============================================
// TEST 4: Set Primary Image
// =============================================
async function testSetPrimaryImage(imageId) {
  console.log('\n=== TEST 4: Set Primary Image ===')
  
  try {
    const response = await axios.put(
      `${BASE_URL}/api/stalls/images/${imageId}/set-primary`,
      {},
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      }
    )
    
    console.log('✅ Set Primary Success:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Set Primary Failed:', error.response?.data || error.message)
    throw error
  }
}

// =============================================
// TEST 5: Delete Image
// =============================================
async function testDeleteImage(imageId) {
  console.log('\n=== TEST 5: Delete Image ===')
  
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/stalls/images/${imageId}`,
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`
        }
      }
    )
    
    console.log('✅ Delete Success:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Delete Failed:', error.response?.data || error.message)
    throw error
  }
}

// =============================================
// RUN ALL TESTS
// =============================================
async function runAllTests() {
  console.log('🚀 Starting Stall Image Upload Tests...')
  console.log('==========================================')
  
  try {
    // Test 1: Upload images (commented out - add real files)
    // await testUploadImages()
    console.log('\n⚠️  Test 1 (Upload) skipped - add real image files to test')
    
    // Test 2: Get all images
    const imagesResult = await testGetImages()
    
    // Test 3: Get image count
    await testGetImageCount()
    
    // Test 4: Set primary (use first image if available)
    if (imagesResult.data.images.length > 1) {
      await testSetPrimaryImage(imagesResult.data.images[1].id)
    }
    
    // Test 5: Delete (use last image if available)
    // Uncomment to test deletion
    // if (imagesResult.data.images.length > 0) {
    //   await testDeleteImage(imagesResult.data.images[imagesResult.data.images.length - 1].id)
    // }
    
    console.log('\n==========================================')
    console.log('✅ All tests completed successfully!')
    
  } catch (error) {
    console.log('\n==========================================')
    console.log('❌ Tests failed with errors')
    console.error(error)
  }
}

// =============================================
// MAIN
// =============================================
console.log('📝 Configuration:')
console.log(`   Base URL: ${BASE_URL}`)
console.log(`   Stall ID: ${TEST_STALL.stall_id}`)
console.log(`   Branch ID: ${TEST_STALL.branch_id}`)
console.log(`   Stall Number: ${TEST_STALL.stall_number}`)
console.log(`   Token: ${AUTH_TOKEN === 'YOUR_JWT_TOKEN_HERE' ? '⚠️  NOT SET' : '✅ Set'}`)

if (AUTH_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
  console.log('\n⚠️  Please set AUTH_TOKEN before running tests')
  console.log('   1. Login to get JWT token')
  console.log('   2. Replace AUTH_TOKEN in this file')
  process.exit(1)
}

// Run tests
runAllTests()
