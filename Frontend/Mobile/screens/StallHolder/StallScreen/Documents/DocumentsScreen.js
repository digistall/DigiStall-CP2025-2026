import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get("window");

const API_URL = 'http://192.168.1.6:3000/api'; // Replace with your backend URL

const DocumentsScreen = () => {
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stallholderId, setStallholderId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (stallholderId && token) {
      loadRequiredDocuments();
    }
  }, [stallholderId, token]);

  const loadUserData = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (userToken && userData) {
        setToken(userToken);
        const user = JSON.parse(userData);
        setStallholderId(user.stallholder_id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadRequiredDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/stallholder/documents/required/${stallholderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setRequiredDocuments(result.data);
      } else {
        Alert.alert('Error', result.message || 'Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequiredDocuments();
  };

  const getUploadedCount = () => {
    return requiredDocuments.filter(doc => doc.status !== 'not_uploaded').length;
  };

  const getRequiredCount = () => {
    return requiredDocuments.filter(doc => doc.is_required).length;
  };

  const handleUpload = (documentTypeId, documentName) => {
    Alert.alert(
      'Upload Document',
      `Select upload method for ${documentName}`,
      [
        {
          text: 'Take Photo',
          onPress: () => uploadFromCamera(documentTypeId),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => uploadFromGallery(documentTypeId),
        },
        {
          text: 'Choose Document/PDF',
          onPress: () => uploadDocument(documentTypeId),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const uploadFromCamera = async (documentTypeId) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await performUpload(result.assets[0], documentTypeId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
      console.error('Camera error:', error);
    }
  };

  const uploadFromGallery = async (documentTypeId) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await performUpload(result.assets[0], documentTypeId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
      console.error('Gallery error:', error);
    }
  };

  const uploadDocument = async (documentTypeId) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        await performUpload(result, documentTypeId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select document');
      console.error('Document picker error:', error);
    }
  };

  const performUpload = async (file, documentTypeId) => {
    try {
      setUploading(true);

      const fileUri = file.uri;
      const fileType = file.type || file.mimeType || 'image/jpeg';
      const fileName = file.name || file.fileName || `document_${Date.now()}.jpg`;

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: fileType,
        name: fileName,
      });
      formData.append('stallholder_id', stallholderId.toString());
      formData.append('document_type_id', documentTypeId.toString());

      const response = await fetch(`${API_URL}/stallholder/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert(
          'Success',
          'Document uploaded successfully and is pending verification'
        );
        await loadRequiredDocuments();
      } else {
        Alert.alert('Upload Failed', result.message || 'Failed to upload');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      case 'expired': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return '✓';
      case 'pending': return '⏱';
      case 'rejected': return '✗';
      case 'expired': return '⚠';
      default: return '○';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#305CDE" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.subtitle}>
          Upload the required documents for your stall. Documents are customized
          based on your business owner's requirements.
        </Text>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Document Status</Text>
          <Text style={styles.progressText}>
            {getUploadedCount()} of {getRequiredCount()} required documents uploaded
          </Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                { width: `${(getUploadedCount() / Math.max(getRequiredCount(), 1)) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Document List */}
        <View style={styles.documentsContainer}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          
          {requiredDocuments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No document requirements set</Text>
            </View>
          ) : (
            requiredDocuments.map((doc, index) => (
              <View key={doc.document_type_id} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentTitleRow}>
                    <Text style={styles.documentIcon}>
                      {getStatusIcon(doc.status)}
                    </Text>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>
                        {index + 1}. {doc.document_name}
                        {doc.is_required && <Text style={styles.required}> *</Text>}
                      </Text>
                      {doc.description && (
                        <Text style={styles.documentDescription}>
                          {doc.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  {doc.status !== 'not_uploaded' && (
                    <View 
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(doc.status) }
                      ]}
                    >
                      <Text style={styles.statusText}>{doc.status}</Text>
                    </View>
                  )}
                </View>

                {doc.instructions && (
                  <Text style={styles.instructions}>{doc.instructions}</Text>
                )}

                {doc.status !== 'not_uploaded' && (
                  <View style={styles.documentDetails}>
                    <Text style={styles.detailText}>
                      Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
                    </Text>
                    {doc.expiry_date && (
                      <Text 
                        style={[
                          styles.detailText,
                          doc.days_until_expiry < 0 && styles.expiredText,
                          doc.days_until_expiry <= 30 && doc.days_until_expiry >= 0 && styles.expiringText
                        ]}
                      >
                        {doc.days_until_expiry < 0 
                          ? `Expired ${Math.abs(doc.days_until_expiry)} days ago`
                          : `Expires in ${doc.days_until_expiry} days`
                        }
                      </Text>
                    )}
                    {doc.rejection_reason && (
                      <Text style={styles.rejectionText}>
                        Reason: {doc.rejection_reason}
                      </Text>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    doc.status === 'not_uploaded' 
                      ? styles.uploadButtonPrimary 
                      : styles.uploadButtonSecondary
                  ]}
                  onPress={() => handleUpload(doc.document_type_id, doc.document_name)}
                  disabled={uploading}
                >
                  <Text style={styles.uploadButtonText}>
                    {doc.status === 'not_uploaded' ? '📤 Upload' : '🔄 Replace'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.03,
  },
  subtitle: {
    fontSize: width * 0.04,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: height * 0.02,
    lineHeight: width * 0.058,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: width * 0.05,
    marginBottom: height * 0.02,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  progressTitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  progressText: {
    fontSize: width * 0.038,
    color: "#6b7280",
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#305CDE',
  },
  documentsContainer: {
    marginBottom: height * 0.02,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  documentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: width * 0.04,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentHeader: {
    marginBottom: 12,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  documentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#1f2937',
  },
  required: {
    color: '#ef4444',
  },
  documentDescription: {
    fontSize: width * 0.035,
    color: '#6b7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  instructions: {
    fontSize: width * 0.035,
    color: '#4b5563',
    fontStyle: 'italic',
    marginBottom: 12,
    paddingLeft: 36,
  },
  documentDetails: {
    paddingLeft: 36,
    marginBottom: 12,
  },
  detailText: {
    fontSize: width * 0.035,
    color: '#6b7280',
    marginBottom: 4,
  },
  expiredText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  expiringText: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  rejectionText: {
    fontSize: width * 0.035,
    color: '#ef4444',
    marginTop: 4,
  },
  uploadButton: {
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    alignItems: "center",
  },
  uploadButtonPrimary: {
    backgroundColor: "#305CDE",
  },
  uploadButtonSecondary: {
    backgroundColor: "#f59e0b",
  },
  uploadButtonText: {
    fontSize: width * 0.04,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default DocumentsScreen;
