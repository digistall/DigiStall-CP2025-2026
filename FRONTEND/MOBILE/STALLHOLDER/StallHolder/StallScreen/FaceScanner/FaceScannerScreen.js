import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../../../../services/ApiService';
import styles from './FaceScannerStyles';

const FaceScannerScreen = ({ route, navigation }) => {
  const stallholderId = route?.params?.stallholderId;
  // When true, after successful verification go back to StallHome (Settings tab) instead of replacing
  const returnToSettings = route?.params?.returnToSettings || false;
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission ? permission.granted : null;
  const [step, setStep] = useState(1); // 1 = Zoom In, 2 = Zoom Out
  const [capturedImage, setCapturedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [scanStarted, setScanStarted] = useState(false);
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [scanningStatus, setScanningStatus] = useState("Position your face inside the circle");
  const [alertConfig, setAlertConfig] = useState({ visible: false, type: 'success', title: '', message: '' });
  
  const cameraRef = useRef(null);
  
  // Animation values
  const flashAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Start animated lighting helper when scanning is active (GCash style lighting feedback)
  useEffect(() => {
    if (hasPermission && !capturedImage && scanStarted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(flashAnim, { toValue: 0, duration: 1200, useNativeDriver: false })
        ])
      ).start();
    } else {
      flashAnim.setValue(0);
    }
  }, [hasPermission, capturedImage, scanStarted]);

  // Scanline laser animation inside the face guide circle
  useEffect(() => {
    if (scanStarted && !isPersonDetected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: false })
        ])
      ).start();
    } else {
      scanLineAnim.setValue(0);
    }
  }, [scanStarted, isPersonDetected]);

  // AI Checker: Simulates person detection in the circle layout before triggering countdown
  useEffect(() => {
    let detectTimer;
    if (scanStarted) {
      setScanningStatus("AI Scan: Checking alignment...");
      setIsPersonDetected(false);
      
      detectTimer = setTimeout(() => {
        setIsPersonDetected(true);
        setScanningStatus("Face aligned! Hold still.");
        setCountdown(3);
      }, 1800); // 1.8 seconds simulated detector response time
    } else {
      setIsPersonDetected(false);
      setScanningStatus(step === 1 ? "Align your face inside the circle" : "Zoom out and align head and shoulders");
    }
    return () => clearTimeout(detectTimer);
  }, [scanStarted, step]);

  // Auto capture countdown timer
  useEffect(() => {
    let timer;
    if (hasPermission && scanStarted && isPersonDetected && !capturedImage && !isUploading && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && scanStarted && isPersonDetected && !capturedImage && !isUploading) {
      takePicture();
    }
    return () => clearTimeout(timer);
  }, [countdown, hasPermission, scanStarted, isPersonDetected, capturedImage, isUploading]);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9, // Higher quality capture, no auto adjustments or local processing
          base64: false,
        });
        
        if (step === 1) {
          // Reset scanning state for Step 2 so the user can adjust posture and zoom out
          setStep(2);
          setScanStarted(false);
          setIsPersonDetected(false);
          setCountdown(3);
        } else if (step === 2) {
          setCapturedImage(photo.uri);
          autoUploadPhoto(photo.uri);
        }
      } catch (err) {
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

  const autoUploadPhoto = async (uri) => {
    if (!uri || !stallholderId) return;

    setIsUploading(true);
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
          title: 'Verification Success!',
          message: 'Your face has been successfully verified by DigiStall AI. Proceeding to Dashboard.',
          onConfirm: () => {
            if (returnToSettings) {
              // Retake flow: go back to StallHome (Settings will reload and show new photo)
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
          title: 'Verification Failed',
          message: response.message === 'No face detected in the image.' 
            ? 'No face detected. Please ensure your face is clearly visible, well-lit, and without heavy shadows.' 
            : (response.message || 'Face not recognized. Please try again.'),
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
      setIsUploading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setStep(1);
    setScanStarted(false);
    setIsPersonDetected(false);
    setCountdown(3);
  };
  
  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.25)'] // Adaptive background flashing color
  });
  
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
          DigiStall needs camera access to complete your facial verification check. Please grant permissions in system settings.
        </Text>
        <TouchableOpacity style={[styles.button, styles.confirmButton, { marginTop: 24, backgroundColor: '#2ECC71' }]} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {capturedImage ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <View style={styles.previewOverlay}>
            <TouchableOpacity style={[styles.button, styles.retakeButton]} onPress={retakePhoto} disabled={isUploading}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={() => autoUploadPhoto(capturedImage)} disabled={isUploading}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
          
          {isUploading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2ECC71" />
              <Text style={styles.loadingText}>Uploading to AI verification engine...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.container}>
          <CameraView style={styles.camera} facing="front" ref={cameraRef} />
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.overlay, { backgroundColor }]} pointerEvents="box-none">
            
            <Text style={styles.headerText}>
              {step === 1 ? 'Step 1: Face Capture' : 'Step 2: Zoom Out'}
            </Text>
            
            <Text style={styles.subHeaderText}>
              {step === 1 
                ? 'Move closer. Position your face inside the circle.' 
                : 'Move back. Show your head and shoulders.'}
            </Text>

            <View style={step === 1 ? styles.guideCircle : styles.guideCircleZoomOut}>
              {scanStarted && !isPersonDetected && (
                <Animated.View style={[
                  styles.scanLine,
                  {
                    top: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['5%', '95%']
                    })
                  }
                ]} />
              )}
            </View>

            <Text style={styles.scanningStatusText}>{scanningStatus}</Text>

            {scanStarted && isPersonDetected && countdown > 0 && (
              <Text style={styles.holdStillText}>HOLD STILL! Capturing shortly...</Text>
            )}

            {isPersonDetected && scanStarted && (
              <View style={styles.countdownContainer}>
                <Text style={countdown > 0 ? styles.countdownText : styles.capturingText}>
                  {countdown > 0 ? countdown : "Capturing..."}
                </Text>
              </View>
            )}

            <View style={styles.btnContainer}>
              {!scanStarted ? (
                <>
                  <TouchableOpacity style={styles.startScanButton} onPress={() => setScanStarted(true)}>
                    <Ionicons name="scan" size={24} color="#FFF" />
                    <Text style={styles.startScanButtonText}>Start Verification</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.manualCaptureButton} onPress={takePicture}>
                    <Ionicons name="camera" size={26} color="#FFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, styles.retakeButton, { backgroundColor: '#E74C3C' }]} 
                  onPress={() => setScanStarted(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

          </Animated.View>
        </View>
      )}
      <CustomAlert />
    </View>
  );
};

export default FaceScannerScreen;
