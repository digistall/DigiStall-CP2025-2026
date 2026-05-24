import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import ApiService from '../../../../services/ApiService';
import UserStorageService from '../../../../services/UserStorageService';
import PickerActiveFlag from '../../../../services/PickerActiveFlag';
import styles from './IdScannerStyles';

const IdScannerScreen = ({ route, navigation }) => {
  const stallholderId = route?.params?.stallholderId;
  const applicantId = route?.params?.applicantId;
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission ? permission.granted : null;
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, type: 'success', title: '', message: '' });
  const [shutterFlash, setShutterFlash] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Align the FRONT of your Valid ID inside the box');

  const cameraRef = useRef(null);

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      try {
        setIsProcessing(true);
        setStatusMessage('Capturing ID...');

        // Trigger visual shutter flash effect
        setShutterFlash(true);
        setTimeout(() => setShutterFlash(false), 150);

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          base64: false,
        });
        
        setCapturedImage(photo.uri);
        setStatusMessage('Valid ID captured successfully!');
        setIsProcessing(false);
      } catch (err) {
        setIsProcessing(false);
        setAlertConfig({
          visible: true,
          type: 'error',
          title: 'Capture Failed',
          message: 'Could not capture ID photo. Please try again.',
          onConfirm: () => setAlertConfig(prev => ({ ...prev, visible: false }))
        });
      }
    }
  };

  const autoUploadPhoto = async (uri) => {
    if (!uri || !stallholderId) return;

    setIsProcessing(true);
    setStatusMessage('Uploading Valid ID to server...');
    try {
      // Prepare payload for dynamic document upload
      const uploadPayload = {
        stallholder_id: stallholderId,
        document_type_id: 3, // Valid ID
        uri: uri,
        mime_type: 'image/jpeg',
        file_name: `valid_id_${stallholderId}_${Date.now()}.jpg`,
      };

      const response = await ApiService.uploadStallholderDocumentBlob(uploadPayload);
      
      if (response.success) {
        // Force-update the local userData other_info so frontend scans succeed instantly
        try {
          const storedUserData = await UserStorageService.getUserData();
          if (storedUserData) {
            if (!storedUserData.other_info) storedUserData.other_info = {};
            storedUserData.other_info.valid_id = `/api/applicants/documents/blob/id/${response.data?.document_id || 'profile_id'}`;
            await UserStorageService.saveUserData(storedUserData);
            console.log('💾 Successfully updated local valid_id state inside UserStorageService');
          }
        } catch (storageErr) {
          console.error('Error updating user storage:', storageErr);
        }

        setAlertConfig({
          visible: true,
          type: 'success',
          title: 'ID Uploaded!',
          message: 'Your Valid ID has been uploaded successfully and is pending verification. You can now access your stalls.',
          onConfirm: () => {
            navigation.replace('StallHome', { 
              screen: 'stall', 
              forceValidIdUpload: false, 
              promptUploadId: false 
            });
          }
        });
      } else {
        setAlertConfig({
          visible: true,
          type: 'error',
          title: 'Upload Failed',
          message: response.message || 'Could not upload Valid ID. Please try again.',
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
    setStatusMessage('Align the FRONT of your Valid ID inside the box');
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
          DigiStall needs camera access to take your Valid ID photo. Please grant permissions in system settings.
        </Text>
        <TouchableOpacity style={[styles.button, styles.confirmButton, { marginTop: 24, backgroundColor: '#2ECC71' }]} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Shutter Flash Effect */}
      {shutterFlash && (
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#FFF', zIndex: 999 }} pointerEvents="none" />
      )}

      {capturedImage ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          {/* Overlay the same rectangular cutout guide frame on the preview! */}
          <View style={styles.maskContainer} pointerEvents="none">
            <View style={styles.maskTop} />
            <View style={styles.maskMiddleRow}>
              <View style={styles.maskLeft} />
              <View style={styles.cutoutWindow}>
                {/* Green corner brackets */}
                <View style={[styles.bracket, styles.bracketTopLeft]} />
                <View style={[styles.bracket, styles.bracketTopRight]} />
                <View style={[styles.bracket, styles.bracketBottomLeft]} />
                <View style={[styles.bracket, styles.bracketBottomRight]} />
              </View>
              <View style={styles.maskRight} />
            </View>
            <View style={styles.maskBottom} />
          </View>

          {/* UI Overlay on top of preview */}
          <View style={[StyleSheet.absoluteFillObject, styles.overlay]} pointerEvents="box-none">
            {/* Header */}
            <Text style={styles.headerText}>Review ID Photo</Text>
            <Text style={styles.subHeaderText}>
              Ensure all text is clearly readable and the ID fits within the frame
            </Text>

            {/* Status message */}
            <View style={styles.statusContainer} pointerEvents="none">
              <View style={styles.statusPill}>
                <Ionicons name="eye" size={18} color="#2ECC71" style={{ marginRight: 8 }} />
                <Text style={styles.statusText}>Verify ID photo is clear and readable</Text>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.previewOverlay}>
              <TouchableOpacity 
                style={[styles.button, styles.retakeButton]} 
                onPress={retakePhoto} 
                disabled={isProcessing}
              >
                <Text style={styles.buttonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton]} 
                onPress={() => autoUploadPhoto(capturedImage)} 
                disabled={isProcessing}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isProcessing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2ECC71" />
              <Text style={styles.loadingText}>Uploading Valid ID...</Text>
            </View>
          )}
        </View>
      ) : (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          ref={cameraRef}
          facing="back"
        >
          {/* Dynamic ID Cutout Mask Overlay */}
          <View style={styles.maskContainer} pointerEvents="none">
            <View style={styles.maskTop} />
            <View style={styles.maskMiddleRow}>
              <View style={styles.maskLeft} />
              {/* The Transparent cutout window */}
              <View style={styles.cutoutWindow}>
                {/* Corner brackets */}
                <View style={[styles.bracket, styles.bracketTopLeft]} />
                <View style={[styles.bracket, styles.bracketTopRight]} />
                <View style={[styles.bracket, styles.bracketBottomLeft]} />
                <View style={[styles.bracket, styles.bracketBottomRight]} />
                
                <View style={styles.idCardGhost}>
                  <Ionicons name="card-outline" size={80} color="rgba(255, 255, 255, 0.25)" />
                </View>
              </View>
              <View style={styles.maskRight} />
            </View>
            <View style={styles.maskBottom} />
          </View>

          {/* UI Overlay */}
          <View style={[StyleSheet.absoluteFillObject, styles.overlay]} pointerEvents="box-none">
            {/* Header */}
            <Text style={styles.headerText}>ID Card Scanner</Text>
            <Text style={styles.subHeaderText}>
              Place the front of your government-issued ID card within the frame
            </Text>

            {/* Status message */}
            <View style={styles.statusContainer} pointerEvents="none">
              <View style={styles.statusPill}>
                <Ionicons name="camera" size={18} color="#2ECC71" style={{ marginRight: 8 }} />
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            </View>

            {/* Capture Controls */}
            <View style={styles.btnContainer}>
              {isProcessing ? (
                <ActivityIndicator size="large" color="#2ECC71" />
              ) : (
                <TouchableOpacity style={styles.startScanButton} onPress={takePicture}>
                  <Ionicons name="camera" size={26} color="#FFF" />
                  <Text style={styles.startScanButtonText}>Capture ID</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </CameraView>
      )}

      <CustomAlert />
    </View>
  );
};

export default IdScannerScreen;
