import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../../../../services/ApiService';
import styles from './FaceScannerStyles';

// Color sequence for the natural lighting flash effect after countdown
const LIGHT_COLORS = [
  { color: '#FFFFFF', duration: 300 },  // White (baseline)
  { color: '#FFF9C4', duration: 350 },  // Warm yellow
  { color: '#FFFDE7', duration: 300 },  // Soft cream
  { color: '#C8E6C9', duration: 350 },  // Soft green
  { color: '#E1F5FE', duration: 300 },  // Soft blue
  { color: '#FFCDD2', duration: 350 },  // Soft red/pink
  { color: '#FFF8E1', duration: 300 },  // Warm amber
  { color: '#FFFFFF', duration: 400 },  // End on white (capture moment)
];

const FaceScannerScreen = ({ route, navigation }) => {
  const stallholderId = route?.params?.stallholderId;
  // When true, after successful verification go back to StallHome (Settings tab) instead of replacing
  const returnToSettings = route?.params?.returnToSettings || false;
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission ? permission.granted : null;
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, type: 'success', title: '', message: '' });
  const [shutterFlash, setShutterFlash] = useState(false);

  // Countdown & lighting states
  const [countdown, setCountdown] = useState(null); // null = idle, 3/2/1 = counting, 0 = color phase
  const [maskColor, setMaskColor] = useState('#FFFFFF');
  const [maskOpacity, setMaskOpacity] = useState(0.5); // Start at 50% opacity
  const [statusMessage, setStatusMessage] = useState('Tap the button below to take your photo');
  
  const cameraRef = useRef(null);
  const countdownActive = useRef(false);

  // Start the capture sequence: 3-second countdown → color cycling → capture
  const startCaptureSequence = useCallback(() => {
    if (countdownActive.current || isProcessing) return;
    countdownActive.current = true;

    // Phase 1: Go to 100% white opacity and start countdown
    setMaskOpacity(1.0);
    setMaskColor('#FFFFFF');
    setCountdown(3);
    setStatusMessage('Get ready! Hold still...');

    // Countdown: 3 → 2 → 1
    setTimeout(() => setCountdown(2), 1000);
    setTimeout(() => setCountdown(1), 2000);

    // Phase 2: After 3 seconds, run color cycling sequence
    setTimeout(() => {
      setCountdown(0);
      setStatusMessage('Optimizing lighting...');
      runColorSequence();
    }, 3000);
  }, [isProcessing]);

  const runColorSequence = () => {
    let delay = 0;
    LIGHT_COLORS.forEach((step, index) => {
      setTimeout(() => {
        setMaskColor(step.color);
      }, delay);
      delay += step.duration;
    });

    // After all colors have cycled, take the photo
    setTimeout(() => {
      setMaskColor('#FFFFFF');
      takePicture();
    }, delay);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsProcessing(true);
        setCountdown(null);
        setStatusMessage('Capturing...');

        // Trigger visual shutter flash effect
        setShutterFlash(true);
        setTimeout(() => setShutterFlash(false), 150);

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          base64: false,
        });
        
        setStatusMessage('AI checking photo quality...');
        
        // Validate the captured image via backend AI
        const validation = await ApiService.validateFaceImage(stallholderId, photo.uri);
        
        if (validation.success) {
          // Face passed all checks — show preview and auto-upload
          setCapturedImage(photo.uri);
          autoUploadPhoto(photo.uri);
        } else {
          // Face validation failed — show the specific error
          setIsProcessing(false);
          resetToIdle();
          setAlertConfig({
            visible: true,
            type: 'error',
            title: 'Photo Validation Failed',
            message: validation.message || 'Face is not clearly visible. Please ensure good lighting, remove sunglasses, and try again.',
            onConfirm: () => {
              setAlertConfig(prev => ({ ...prev, visible: false }));
            }
          });
        }
      } catch (err) {
        setIsProcessing(false);
        resetToIdle();
        setAlertConfig({
          visible: true,
          type: 'error',
          title: 'Capture Failed',
          message: 'Could not capture photo. Please try again.',
          onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
        });
      }
    }
  };

  // Reset mask to idle state (50% white)
  const resetToIdle = () => {
    setMaskOpacity(0.5);
    setMaskColor('#FFFFFF');
    setCountdown(null);
    setStatusMessage('Tap the button below to take your photo');
    countdownActive.current = false;
  };

  const autoUploadPhoto = async (uri) => {
    if (!uri || !stallholderId) return;

    setIsProcessing(true);
    try {
      const response = await ApiService.uploadFaceVerification(stallholderId, uri);
      
      if (response.success) {
        try {
          await AsyncStorage.setItem('face_image_last_update', Date.now().toString());
          console.log('📸 Saved face image update timestamp to AsyncStorage');
        } catch (storageErr) {
          console.error('Error saving face timestamp:', storageErr);
        }

        setAlertConfig({
          visible: true,
          type: 'success',
          title: 'Photo Saved!',
          message: 'Your profile photo has been saved successfully.',
          onConfirm: () => {
            if (returnToSettings) {
              navigation.navigate('StallHome');
            } else {
              navigation.replace('StallHome');
            }
          }
        });
      } else {
        setAlertConfig({
          visible: true,
          type: 'error',
          title: 'Upload Failed',
          message: response.message === 'No face detected in the image.' 
            ? 'No face detected. Please ensure your face is clearly visible and well-lit.' 
            : (response.message || 'Could not upload photo. Please try again.'),
          onConfirm: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            retakePhoto();
          }
        });
      }
    } catch (error) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Server Error',
        message: 'A network error occurred while uploading. Please check connection and try again.',
        onConfirm: () => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          retakePhoto();
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsProcessing(false);
    resetToIdle();
  };
  
  const CustomAlert = () => (
    <Modal visible={alertConfig.visible} transparent animationType="fade">
      <View style={styles.alertOverlay}>
        <View style={styles.alertBox}>
          <View style={[styles.alertIconContainer, { backgroundColor: alertConfig.type === 'success' ? '#2ECC71' : '#E74C3C' }]}>
            <Ionicons name={alertConfig.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={46} color="#FFF" />
          </View>
          <Text style={styles.alertTitle}>{alertConfig.title}</Text>
          <Text style={styles.alertMessage}>{alertConfig.message}</Text>
          <TouchableOpacity 
            style={[styles.alertButton, { backgroundColor: alertConfig.type === 'success' ? '#2ECC71' : '#E74C3C' }]} 
            onPress={() => {
              if (alertConfig.onConfirm) alertConfig.onConfirm();
              else setAlertConfig(prev => ({ ...prev, visible: false }));
            }}
          >
            <Text style={styles.alertButtonText}>{alertConfig.type === 'success' ? 'Continue' : 'Try Again'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0C' }]}>
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0C', padding: 24 }]}>
        <Ionicons name="camera-off" size={64} color="#E74C3C" />
        <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 16 }}>Camera Permission Denied</Text>
        <Text style={{ color: '#AAA', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
          DigiStall needs camera access to take your profile photo. Please grant permissions in system settings.
        </Text>
        <TouchableOpacity style={[styles.button, styles.confirmButton, { marginTop: 24, backgroundColor: '#2ECC71' }]} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCountingDown = countdown !== null && countdown > 0;
  const isColorPhase = countdown === 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {shutterFlash && (
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#FFF', zIndex: 999 }} pointerEvents="none" />
      )}
      {capturedImage ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <View style={styles.previewOverlay}>
            <TouchableOpacity style={[styles.button, styles.retakeButton]} onPress={retakePhoto} disabled={isProcessing}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={() => autoUploadPhoto(capturedImage)} disabled={isProcessing}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
          
          {isProcessing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2ECC71" />
              <Text style={styles.loadingText}>Uploading photo...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.container}>
          <CameraView style={styles.camera} facing="front" ref={cameraRef} />
          
          {/* LIGHTING MASK – 50% opacity at rest, 100% during countdown, color cycling for natural lighting */}
          <View style={styles.maskContainer} pointerEvents="none">
            <View style={[
              styles.maskCircle, 
              { 
                borderColor: maskColor,
                opacity: maskOpacity,
              }
            ]} />
          </View>

          {/* UI OVERLAY */}
          <View style={[StyleSheet.absoluteFillObject, styles.overlay]} pointerEvents="box-none">
            
            <Text style={styles.headerText}>Profile Photo</Text>
            
            <Text style={styles.subHeaderText}>
              Position your face inside the circle. Ensure good lighting.
            </Text>

            <View style={[
              styles.guideCircle,
              (isCountingDown || isColorPhase) && { borderColor: '#FFFFFF' }
            ]} />

            {/* Countdown number overlay */}
            {isCountingDown && (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}

            {/* Color cycling phase indicator */}
            {isColorPhase && (
              <View style={styles.countdownContainer}>
                <Ionicons name="sunny" size={48} color="#FFF" />
                <Text style={styles.colorPhaseText}>Optimizing light...</Text>
              </View>
            )}

            {/* Status tip */}
            <View style={styles.statusContainer} pointerEvents="none">
              <View style={[styles.statusPill, { borderColor: isCountingDown || isColorPhase ? '#FFA726' : '#2E7D32' }]}>
                {isCountingDown || isColorPhase ? (
                  <Ionicons name="flash" size={18} color="#FFA726" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="camera" size={18} color="#2ECC71" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            </View>

            {/* Take Photo Button – hidden during countdown/color phase */}
            <View style={styles.btnContainer}>
              {countdown === null && !isProcessing && (
                <TouchableOpacity 
                  style={styles.startScanButton} 
                  onPress={startCaptureSequence}
                >
                  <Ionicons name="camera" size={24} color="#FFF" />
                  <Text style={styles.startScanButtonText}>Take Photo</Text>
                </TouchableOpacity>
              )}
            </View>

          </View>

          {isProcessing && countdown === null && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2ECC71" />
              <Text style={styles.loadingText}>AI checking photo quality...</Text>
            </View>
          )}
        </View>
      )}
      <CustomAlert />
    </View>
  );
};

export default FaceScannerScreen;
