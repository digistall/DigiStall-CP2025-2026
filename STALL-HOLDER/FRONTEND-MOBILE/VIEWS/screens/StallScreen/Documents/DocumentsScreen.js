import React, { useState, useEffect, useCallback } from "react";
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
  Image,
} from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import API Service
import ApiService from '@stall-holder-mobile/SERVICES/ApiService';
import UserStorageService from '@stall-holder-mobile/SERVICES/UserStorageService';
import DocumentUploadHelper from '@stall-holder-mobile/SERVICES/DocumentUploadHelper';
import { useTheme } from "@shared-mobile/COMPONENTS/ThemeComponents/ThemeContext";
import DocumentPreviewModal from './DocumentPreviewModal';
import AuthenticatedImage from './AuthenticatedImage';

const { width, height } = Dimensions.get("window");

const DocumentsScreen = () => {
  const { theme, isDark } = useTheme();
  
  // State for tabs and data
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [branchTabs, setBranchTabs] = useState([]);
  const [groupedByBranch, setGroupedByBranch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);
  
  // Document preview modal state
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [documentBlobData, setDocumentBlobData] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const applicantId = userData?.user?.applicant_id || userData?.user?.id;
    console.log('📋 Documents useEffect triggered - applicantId:', applicantId);
    if (applicantId) {
      console.log('📋 Calling loadStallholderDocuments for applicantId:', applicantId);
      loadStallholderDocuments();
    } else {
      console.log('📋 No applicantId found, skipping loadStallholderDocuments');
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      // Get token from UserStorageService using correct key 'auth_token'
      const userToken = await UserStorageService.getAuthToken();
      const storedUserData = await UserStorageService.getUserData();
      
      console.log('📱 Documents - Loaded user data:', JSON.stringify(storedUserData, null, 2));
      console.log('📱 Documents - Token available:', !!userToken);
      console.log('📱 Documents - Is Stallholder:', storedUserData?.isStallholder);
      console.log('📱 Documents - Applicant ID:', storedUserData?.user?.applicant_id || storedUserData?.user?.id);
      
      if (storedUserData) {
        setToken(userToken);
        setUserData(storedUserData);
      } else {
        // No user data found, stop loading
        console.log('❌ No user data found in storage');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const loadStallholderDocuments = async () => {
    try {
      setLoading(true);
      
      const applicantId = userData?.user?.applicant_id || userData?.user?.id;
      if (!applicantId) {
        console.log('❌ No applicant ID found in userData:', userData);
        setLoading(false);
        return;
      }

      console.log('📄 Loading stallholder documents for applicant:', applicantId);
      
      const response = await ApiService.getStallholderStallsWithDocuments(applicantId);
      
      console.log('📄 API Response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        const { grouped_by_branch } = response.data;
        
        if (grouped_by_branch && grouped_by_branch.length > 0) {
          // Create tabs from branch data
          const tabs = grouped_by_branch.map((branch, index) => ({
            id: branch.branch_id,
            label: branch.branch_name,
            ownerName: branch.business_owner_name,
            stallCount: branch.stalls.length,
          }));
          
          setBranchTabs(tabs);
          setGroupedByBranch(grouped_by_branch);
          
          console.log(`✅ Loaded ${grouped_by_branch.length} branches with documents`);
        } else {
          setBranchTabs([]);
          setGroupedByBranch([]);
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading stallholder documents:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStallholderDocuments();
  }, [userData]);

  const handleTabPress = (index) => {
    setActiveTabIndex(index);
  };

  // Get current branch data based on active tab
  const getCurrentBranchData = () => {
    if (groupedByBranch.length === 0 || activeTabIndex >= groupedByBranch.length) {
      return null;
    }
    return groupedByBranch[activeTabIndex];
  };

  const getUploadedCount = (documents) => {
    if (!documents) return 0;
    return documents.filter(doc => doc.status !== 'not_uploaded').length;
  };

  const getRequiredCount = (documents) => {
    if (!documents) return 0;
    return documents.filter(doc => doc.is_required).length;
  };

  const handleUpload = (documentTypeId, documentName, stallholderId) => {
    Alert.alert(
      'Upload Document',
      `Select upload method for ${documentName}`,
      [
        {
          text: 'Take Photo',
          onPress: () => uploadFromCamera(documentTypeId, stallholderId),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => uploadFromGallery(documentTypeId, stallholderId),
        },
        {
          text: 'Choose Document/PDF',
          onPress: () => uploadDocument(documentTypeId, stallholderId),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const uploadFromCamera = async (documentTypeId, stallholderId) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],  // Updated from deprecated MediaTypeOptions
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await performUpload(result.assets[0], documentTypeId, stallholderId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
      console.error('Camera error:', error);
    }
  };

  const uploadFromGallery = async (documentTypeId, stallholderId) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],  // Updated from deprecated MediaTypeOptions
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await performUpload(result.assets[0], documentTypeId, stallholderId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
      console.error('Gallery error:', error);
    }
  };

  const uploadDocument = async (documentTypeId, stallholderId) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      console.log('📄 Document picker result:', JSON.stringify(result, null, 2));

      // Updated for expo-document-picker v13+ API
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        console.log('📄 Selected file:', selectedFile);
        await performUpload(selectedFile, documentTypeId, stallholderId);
      } else {
        console.log('📄 Document selection cancelled');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select document');
      console.error('Document picker error:', error);
    }
  };

  const performUpload = async (file, documentTypeId, stallholderId) => {
    try {
      setUploading(true);

      // Note: Token is optional for document uploads (backend endpoint is public)
      // We'll still try to get the token for future-proofing when auth is added
      let currentToken = token;
      if (!currentToken) {
        currentToken = await UserStorageService.getAuthToken();
        console.log('📌 Token retrieved from storage:', !!currentToken);
      }

      // Continue without token - backend upload endpoint is currently public
      if (!currentToken) {
        console.log('⚠️ No token available, proceeding with upload anyway (endpoint is public)');
      }

      // Use BLOB upload helper
      const uploadPayload = await DocumentUploadHelper.prepareDocumentForUpload(
        file,
        stallholderId,
        documentTypeId
      );

      console.log('📤 Upload payload prepared, stallholder_id:', stallholderId, 'document_type_id:', documentTypeId);

      // Upload to backend BLOB (token is optional for this endpoint)
      const response = await ApiService.uploadStallholderDocumentBlob(uploadPayload, currentToken);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Document uploaded successfully and is pending verification'
        );
        await loadStallholderDocuments();
      } else {
        Alert.alert('Upload Failed', response.message || 'Failed to upload');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to upload document');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'verified':
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      case 'expired': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'verified':
      case 'approved': return '✓';
      case 'pending': return '⏱';
      case 'rejected': return '✗';
      case 'expired': return '⚠';
      default: return '○';
    }
  };

  // Helper function to check if document is approved/verified
  const isDocumentApproved = (status) => {
    const normalizedStatus = status?.toLowerCase();
    return normalizedStatus === 'verified' || normalizedStatus === 'approved';
  };

  // Document preview modal handlers
  const openDocumentPreview = async (document, documentTypeId) => {
    try {
      console.log('📄 Opening document preview:', JSON.stringify(document, null, 2));
      
      setSelectedDocument(document);
      setSelectedDocumentId(documentTypeId);
      setPreviewModalVisible(true);
      setPreviewLoading(true);

      // Set initial document data from the list (includes metadata)
      // Map 'status' to 'verification_status' for the modal
      setDocumentBlobData({
        ...document,
        verification_status: document.status || document.verification_status || 'pending',
        file_name: document.file_name || document.original_filename || document.document_name || 'Document',
        mime_type: document.mime_type || 'image/jpeg',
      });

      // Fetch document BLOB data if document_id exists
      const docId = document.document_id || document.id;
      if (docId) {
        console.log('📥 Fetching document BLOB:', docId);
        const response = await ApiService.getStallholderDocumentBlobById(docId);
        
        if (response.success) {
          setDocumentBlobData({
            ...document,
            verification_status: document.status || document.verification_status || 'pending',
            document_data: response.data, // Contains data:image/...;base64,...
            mime_type: response.mimeType || document.mime_type || 'image/jpeg',
            file_name: document.file_name || document.original_filename || document.document_name || 'Document',
          });
          console.log('✅ Document BLOB loaded successfully');
        } else {
          console.log('⚠️ BLOB fetch returned:', response.message);
        }
      } else {
        console.log('⚠️ No document_id found in document object');
      }
    } catch (error) {
      console.error('❌ Error loading document preview:', error);
      Alert.alert('Error', 'Failed to load document');
    } finally {
      setPreviewLoading(false);
    }
  };

  const closeDocumentPreview = () => {
    setPreviewModalVisible(false);
    setSelectedDocument(null);
    setSelectedDocumentId(null);
    setDocumentBlobData({});
  };

  const deleteDocument = async () => {
    try {
      if (!selectedDocument?.document_id) {
        Alert.alert('Error', 'Document ID not found');
        return;
      }

      const response = await ApiService.deleteStallholderDocument(
        selectedDocument.document_id
      );

      if (response.success) {
        Alert.alert('Success', 'Document deleted successfully');
        closeDocumentPreview();
        await loadStallholderDocuments();
      } else {
        Alert.alert('Error', response.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      Alert.alert('Error', 'Failed to delete document');
    }
  };

  const replaceDocument = () => {
    if (selectedDocumentId) {
      closeDocumentPreview();
      handleUpload(selectedDocumentId, selectedDocument?.document_name || 'Document', 
                   selectedDocument?.stallholder_id || userData?.user?.id);
    }
  };

  // Render empty state when no stalls owned
  const renderEmptyState = () => {
    const isUserStallholder = userData?.isStallholder || userData?.stallholder != null;
    
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
        <Image 
          source={require('@shared-assets/Home-Image/DocumentIcon.png')} 
          style={styles.emptyIcon}
          resizeMode="contain"
        />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          {isUserStallholder ? 'No Document Requirements' : 'No Active Stalls'}
        </Text>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {isUserStallholder 
            ? 'The business owner has not set up document requirements for your stall yet. Please check back later or contact your branch administrator.'
            : 'You don\'t have any active stalls yet. Once your application is approved and your contract is active, you\'ll see the required documents for your stalls here.'
          }
        </Text>
        {!isUserStallholder && userData?.applicationStatus && (
          <View style={[styles.statusBadgeContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statusLabel, { color: theme.colors.textSecondary }]}>Application Status: </Text>
            <Text style={[
              styles.statusValue,
              { color: userData.applicationStatus === 'Approved' ? '#10b981' : '#f59e0b' }
            ]}>
              {userData.applicationStatus}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render document card with image preview
  const renderDocumentCard = (doc, index, stallholderId) => (
    <View key={doc.document_type_id} style={[styles.documentCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.documentHeader}>
        <View style={styles.documentTitleRow}>
          <Text style={styles.documentIcon}>
            {getStatusIcon(doc.status)}
          </Text>
          <View style={styles.documentInfo}>
            <Text style={[styles.documentName, { color: theme.colors.text }]}>
              {index + 1}. {doc.document_name}
              {doc.is_required && <Text style={styles.required}> *</Text>}
            </Text>
            {doc.description && (
              <Text style={[styles.documentDescription, { color: theme.colors.textSecondary }]}>
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
        <Text style={[styles.instructions, { color: theme.colors.textSecondary }]}>{doc.instructions}</Text>
      )}

      {/* Image Preview */}
      {doc.status !== 'not_uploaded' && doc.document_id && (
        <TouchableOpacity
          style={[styles.imagePreviewContainer, { backgroundColor: isDark ? theme.colors.surface : '#f1f5f9' }]}
          onPress={() => openDocumentPreview(doc, doc.document_type_id)}
        >
          <AuthenticatedImage
            documentId={doc.document_id}
            style={styles.imagePreview}
            resizeMode="cover"
            placeholderColor={isDark ? theme.colors.surface : '#f1f5f9'}
            onError={(error) => {
              console.log('⚠️ Image preview load failed for document:', doc.document_id);
            }}
          />
          <View style={styles.previewOverlay}>
            <Text style={styles.previewText}>View</Text>
          </View>
        </TouchableOpacity>
      )}

      {doc.status !== 'not_uploaded' && (
        <View style={styles.documentDetails}>
          <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
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

      {/* Show Upload/Replace button only if not verified/approved */}
      {!isDocumentApproved(doc.status) && (
        <TouchableOpacity
          style={[
            styles.uploadButton,
            doc.status === 'not_uploaded' 
              ? styles.uploadButtonPrimary 
              : styles.uploadButtonSecondary
          ]}
          onPress={() => handleUpload(doc.document_type_id, doc.document_name, stallholderId)}
          disabled={uploading}
        >
          <Text style={styles.uploadButtonText}>
            {doc.status === 'not_uploaded' ? 'Upload' : 'Replace'}
          </Text>
        </TouchableOpacity>
      )}

      {doc.status !== 'not_uploaded' && (
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => openDocumentPreview(doc, doc.document_type_id)}
        >
          <Text style={[styles.viewDetailsText, { color: theme.colors.primary }]}>
            View Details
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render content for the active tab
  const renderTabContent = () => {
    const branchData = getCurrentBranchData();
    
    if (!branchData) {
      return renderEmptyState();
    }

    const { stalls, document_requirements, business_owner_name, branch_name } = branchData;
    const stallholderId = stalls[0]?.stallholder_id;

    return (
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {/* Branch Info Header */}
        <View style={[styles.branchInfoCard, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.branchName}>{branch_name}</Text>
          <Text style={styles.ownerName}>Business Owner: {business_owner_name || 'Not assigned'}</Text>
          <View style={styles.stallsInfo}>
            <Text style={styles.stallsLabel}>Your Stalls:</Text>
            {stalls.map((stall, index) => (
              <Text key={stall.stall_id} style={styles.stallItem}>
                • {stall.stall_name || `Stall #${stall.stall_number}`} ({stall.business_name})
              </Text>
            ))}
          </View>
        </View>

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Upload the required documents for this branch. Documents are customized
          based on the business owner's requirements.
        </Text>

        {/* Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.progressTitle, { color: theme.colors.text }]}>Document Status</Text>
          <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
            {getUploadedCount(document_requirements)} of {getRequiredCount(document_requirements)} required documents uploaded
          </Text>
          <View style={[styles.progressBarContainer, { backgroundColor: isDark ? theme.colors.border : '#e2e8f0' }]}>
            <View 
              style={[
                styles.progressBar,
                { 
                  width: `${(getUploadedCount(document_requirements) / Math.max(getRequiredCount(document_requirements), 1)) * 100}%`,
                  backgroundColor: theme.colors.primary
                }
              ]} 
            />
          </View>
        </View>

        {/* Document List */}
        <View style={styles.documentsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Required Documents</Text>
          
          {!document_requirements || document_requirements.length === 0 ? (
            <View style={[styles.emptyDocState, { backgroundColor: isDark ? theme.colors.surface : '#f8fafc', borderColor: theme.colors.border }]}>
              <Text style={[styles.emptyDocText, { color: theme.colors.textSecondary }]}>
                No document requirements set by the business owner for this branch yet.
              </Text>
            </View>
          ) : (
            document_requirements.map((doc, index) => 
              renderDocumentCard(doc, index, stallholderId)
            )
          )}
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        visible={previewModalVisible}
        onClose={closeDocumentPreview}
        document={documentBlobData}
        onDelete={deleteDocument}
        onReplace={replaceDocument}
        isLoading={previewLoading}
      />

      {branchTabs.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Tab Navigation - Similar to TabbedStallScreen */}
          <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScrollContent}
            >
              {branchTabs.map((tab, index) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    { backgroundColor: isDark ? theme.colors.card : '#f1f5f9' },
                    activeTabIndex === index && [styles.activeTab, { backgroundColor: theme.colors.primary }]
                  ]}
                  onPress={() => handleTabPress(index)}
                >
                  <Text style={[
                    styles.tabText,
                    { color: theme.colors.textSecondary },
                    activeTabIndex === index && styles.activeTabText
                  ]}>
                    {tab.label}
                  </Text>
                  <Text style={[
                    styles.tabSubtext,
                    { color: theme.colors.textTertiary },
                    activeTabIndex === index && styles.activeTabSubtext
                  ]}>
                    {tab.stallCount} stall{tab.stallCount !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tab Content */}
          {renderTabContent()}
        </>
      )}
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
  // Tab Styles
  tabContainer: {
    backgroundColor: '#ffffff',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabScrollContent: {
    paddingHorizontal: 12,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    minWidth: 100,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#305CDE',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  activeTabSubtext: {
    color: '#e0e7ff',
  },
  // Content Styles
  scrollContent: {
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    paddingBottom: 100,
  },
  branchInfoCard: {
    backgroundColor: '#305CDE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  branchName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: '#e0e7ff',
    marginBottom: 12,
  },
  stallsInfo: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 10,
  },
  stallsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  stallItem: {
    fontSize: 13,
    color: '#e0e7ff',
    marginLeft: 8,
    marginTop: 2,
  },
  subtitle: {
    fontSize: width * 0.038,
    color: "#64748b",
    textAlign: "center",
    marginBottom: height * 0.02,
    lineHeight: width * 0.055,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
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
    borderRadius: 12,
    padding: width * 0.045,
    marginBottom: height * 0.02,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: width * 0.042,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  progressText: {
    fontSize: width * 0.035,
    color: "#64748b",
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#305CDE',
    borderRadius: 4,
  },
  documentsContainer: {
    marginBottom: height * 0.02,
  },
  sectionTitle: {
    fontSize: width * 0.042,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  // Empty states
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
    tintColor: '#94a3b8',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyDocState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyDocText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  // Document card styles
  documentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
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
    fontSize: 22,
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: width * 0.038,
    fontWeight: '600',
    color: '#1e293b',
  },
  required: {
    color: '#ef4444',
  },
  documentDescription: {
    fontSize: width * 0.033,
    color: '#64748b',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
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
    fontSize: width * 0.033,
    color: '#475569',
    fontStyle: 'italic',
    marginBottom: 12,
    paddingLeft: 34,
    lineHeight: 18,
  },
  documentDetails: {
    paddingLeft: 34,
    marginBottom: 12,
  },
  detailText: {
    fontSize: width * 0.033,
    color: '#64748b',
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
    fontSize: width * 0.033,
    color: '#ef4444',
    marginTop: 4,
  },
  uploadButton: {
    borderRadius: 8,
    paddingVertical: height * 0.014,
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
    fontSize: width * 0.038,
    fontWeight: "600",
    color: "#ffffff",
  },
  imagePreviewContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  viewDetailsButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#305CDE',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DocumentsScreen;
