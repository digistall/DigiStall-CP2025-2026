import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import ApiService from '../../../../services/ApiService';
import styles from './FaceScannerStyles';

const FaceScannerScreen = ({ isVisible, stallholderId, onComplete }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [step, setStep] = useState(1); // 1 = Zoom In, 2 = Zoom Out
  const [capturedImage, setCapturedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false, // Don't need base64 here since we'll upload via form data
        });
        
        if (step === 1) {
          // Move to step 2 automatically
          setStep(2);
        } else if (step === 2) {
          setCapturedImage(photo.uri);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    }
  };

  const uploadPhoto = async () => {
    if (!capturedImage || !stallholderId) return;

    setIsUploading(true);
    try {
      const response = await ApiService.uploadFaceVerification(stallholderId, capturedImage);
      
      if (response.success) {
        Alert.alert('Success', 'Face verification completed successfully.', [
          { text: 'OK', onPress: () => onComplete() }
        ]);
      } else {
        Alert.alert('Verification Failed', response.message || 'Please ensure your face is visible, no shades, and good lighting.', [
          { text: 'Retake', onPress: retakePhoto }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred while uploading.');
    } finally {
      setIsUploading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setStep(1);
  };

  if (hasPermission === null || !isVisible) {
    return null;
  }

  if (hasPermission === false) {
    return (
      <Modal visible={isVisible} transparent={false} animationType="slide">
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'white' }}>No access to camera</Text>
          <Text style={{ color: 'gray', marginTop: 10 }}>Please enable camera permissions in your settings.</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} transparent={false} animationType="slide">
      {capturedImage ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <View style={styles.previewOverlay}>
            <TouchableOpacity style={[styles.button, styles.retakeButton]} onPress={retakePhoto} disabled={isUploading}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={uploadPhoto} disabled={isUploading}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
          
          {isUploading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Analyzing face...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.container}>
          <Camera style={styles.camera} type={CameraType.front} ref={cameraRef}>
            <View style={styles.overlay}>
              <Text style={styles.headerText}>
                {step === 1 ? 'Step 1: Face Capture' : 'Step 2: Zoom Out'}
              </Text>
              
              <Text style={styles.subHeaderText}>
                {step === 1 
                  ? 'Move closer. Position your face inside the circle.' 
                  : 'Move back. Show your head and shoulders.'}
              </Text>

              <View style={step === 1 ? styles.guideCircle : styles.guideCircleZoomOut} />

              <View style={styles.captureContainer}>
                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                  <View style={styles.captureInner} />
                </TouchableOpacity>
                <Text style={styles.captureText}>Tap to Capture</Text>
              </View>
            </View>
          </Camera>
        </View>
      )}
    </Modal>
  );
};

export default FaceScannerScreen;
