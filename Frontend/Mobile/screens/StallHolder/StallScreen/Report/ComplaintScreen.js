import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from "../Settings/components/ThemeComponents/ThemeContext";
import ApiService from "../../../../services/ApiService";
import UserStorageService from "../../../../services/UserStorageService";

const { width, height } = Dimensions.get("window");
const MAX_PHOTOS = 1; // Only 1 photo since stored as blob

// Complaint types
const COMPLAINT_TYPES = [
  {
    id: 1,
    type: "Faulty Equipment",
    description: "Issues with stall equipment, fixtures, or utilities",
    icon: "construct-outline",
  },
  {
    id: 2,
    type: "Sanitary Issue",
    description: "Cleanliness and sanitation concerns in the market area",
    icon: "water-outline",
  },
  {
    id: 3,
    type: "Security Concern",
    description: "Safety and security issues that need attention",
    icon: "shield-outline",
  },
  {
    id: 4,
    type: "Neighbor Dispute",
    description: "Issues with neighboring stalls or stallholders",
    icon: "people-outline",
  },
  {
    id: 5,
    type: "Infrastructure Problem",
    description: "Structural issues, leaks, or facility damage",
    icon: "home-outline",
  },
  {
    id: 6,
    type: "Other",
    description: "Other concerns not listed above",
    icon: "ellipsis-horizontal-outline",
  },
];

const ComplaintScreen = () => {
  const { theme, isDark } = useTheme();
  
  // User data and token
  const [userData, setUserData] = useState(null);
  const [fullUserData, setFullUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Form state
  const [selectedComplaintType, setSelectedComplaintType] = useState(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Photo evidence state
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  
  // Load user data on mount
  useEffect(() => {
    loadUserData();
    requestPermissions();
  }, []);

  const loadUserData = async () => {
    try {
      setLoadingUser(true);
      const data = await UserStorageService.getUserData();
      if (data) {
        setFullUserData(data); // Store full data including token
        // User data can be in different places depending on login type
        const user = data.user || data.stallholder || data;
        setUserData(user);
        console.log('📱 User data loaded:', user.stallholder_name || user.full_name || user.username);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  // Request camera and media library permissions
  const requestPermissions = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraPermission.status !== 'granted' || mediaPermission.status !== 'granted') {
        console.log('Camera or media library permission not granted');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    if (evidencePhoto) {
      Alert.alert('Photo Already Added', 'Please remove the current photo first.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhoto = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `complaint_${Date.now()}.jpg`,
        };
        setEvidencePhoto(newPhoto);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Pick photo from gallery
  const pickFromGallery = async () => {
    if (evidencePhoto) {
      Alert.alert('Photo Already Added', 'Please remove the current photo first.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhoto = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `complaint_${Date.now()}.jpg`,
        };
        setEvidencePhoto(newPhoto);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo. Please try again.');
    }
  };

  // Remove photo
  const removePhoto = () => {
    setEvidencePhoto(null);
  };

  // Show photo picker options
  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo Evidence',
      'Choose how to add a photo',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validation
    if (!selectedComplaintType) {
      Alert.alert("Error", "Please select a complaint type");
      return;
    }
    if (!subject.trim()) {
      Alert.alert("Error", "Please enter a subject for your complaint");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please describe your complaint in detail");
      return;
    }
    if (description.trim().length < 20) {
      Alert.alert("Error", "Please provide more details in your description (at least 20 characters)");
      return;
    }

    // Build confirmation message
    const photoInfo = evidencePhoto ? '\nPhoto Attached: Yes' : '';

    // Show confirmation
    Alert.alert(
      "Submit Complaint",
      `Are you sure you want to submit this complaint?\n\nType: ${selectedComplaintType.type}\nSubject: ${subject}${photoInfo}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: submitComplaint },
      ]
    );
  };

  const submitComplaint = async () => {
    setIsSubmitting(true);
    
    try {
      // Get stallholder data from fullUserData
      const stallholderData = fullUserData?.stallholder || fullUserData?.user || userData;
      
      const complaintData = {
        complaint_type: selectedComplaintType.type,
        sender_name: stallholderData?.stallholder_name || stallholderData?.full_name || userData?.full_name || 'Unknown',
        sender_contact: stallholderData?.phone || stallholderData?.contact_number || null,
        sender_email: stallholderData?.email || null,
        stallholder_id: stallholderData?.stallholder_id || fullUserData?.user?.applicant_id || null,
        stall_id: stallholderData?.stall_id || null,
        branch_id: stallholderData?.branch_id || null,
        subject: subject.trim(),
        description: description.trim(),
        evidence: evidencePhoto ? 'Photo attached' : null,
        priority: 'medium', // Default priority
      };

      console.log('📤 Submitting complaint:', complaintData);
      
      const response = await ApiService.submitComplaint(complaintData, evidencePhoto);
      
      setIsSubmitting(false);
      
      if (response.success) {
        Alert.alert(
          "Complaint Submitted",
          "Your complaint has been successfully submitted. The management team will review it and get back to you soon.",
          [
            {
              text: "OK",
              onPress: () => {
                // Reset form
                setSelectedComplaintType(null);
                setSubject("");
                setDescription("");
                setEvidencePhoto(null);
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Failed to submit complaint. Please try again.");
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error('Submit error:', error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  if (loadingUser) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Card */}
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.headerContent}>
            <Ionicons name="chatbubble-ellipses" size={32} color="#ffffff" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Send a Complaint</Text>
              <Text style={styles.headerSubtitle}>
                Report issues or concerns to the management
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Sender Info Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="person" size={18} color="#3b82f6" /> Your Information
          </Text>
          
          <View style={[styles.infoCard, { backgroundColor: theme.colors.background }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Name:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {userData?.stallholder_name || userData?.full_name || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Stall:</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {userData?.stall_number || userData?.stall_no || 'N/A'}
              </Text>
            </View>
            {userData?.email && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Email:</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {userData.email}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Complaint Type Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="list" size={18} color="#3b82f6" /> Complaint Type *
          </Text>
          
          {COMPLAINT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                { 
                  backgroundColor: theme.colors.background,
                  borderColor: selectedComplaintType?.id === type.id 
                    ? '#3b82f6' 
                    : theme.colors.border 
                },
                selectedComplaintType?.id === type.id && styles.selectedCard
              ]}
              onPress={() => setSelectedComplaintType(type)}
            >
              <View style={styles.typeHeader}>
                <View style={[
                  styles.radioCircle,
                  selectedComplaintType?.id === type.id && styles.radioCircleSelected
                ]}>
                  {selectedComplaintType?.id === type.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={[styles.typeIconContainer, { backgroundColor: '#3b82f620' }]}>
                  <Ionicons name={type.icon} size={20} color="#3b82f6" />
                </View>
                <View style={styles.typeInfo}>
                  <Text style={[styles.typeName, { color: theme.colors.text }]}>
                    {type.type}
                  </Text>
                  <Text style={[styles.typeDescription, { color: theme.colors.textSecondary }]}>
                    {type.description}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subject Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="text" size={18} color="#3b82f6" /> Subject *
          </Text>
          
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.colors.background, 
              color: theme.colors.text,
              borderColor: theme.colors.border 
            }]}
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief summary of your complaint"
            placeholderTextColor={theme.colors.textSecondary}
            maxLength={100}
          />
          <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
            {subject.length}/100
          </Text>
        </View>

        {/* Description Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="document-text" size={18} color="#3b82f6" /> Description *
          </Text>
          
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: theme.colors.background, 
              color: theme.colors.text,
              borderColor: theme.colors.border 
            }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Please describe your complaint in detail. Include relevant information such as when the issue occurred, who is involved, and any other important details."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
            {description.length}/1000
          </Text>
        </View>

        {/* Photo Evidence Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="camera" size={18} color="#3b82f6" /> Photo Evidence (Optional)
          </Text>
          
          <Text style={[styles.photoHint, { color: theme.colors.textSecondary }]}>
            Add a photo to support your complaint
          </Text>
          
          {/* Photo Display */}
          {evidencePhoto && (
            <View style={styles.photoGrid}>
              <View style={styles.photoContainer}>
                <Image source={{ uri: evidencePhoto.uri }} style={styles.photoThumbnail} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={removePhoto}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Add Photo Button */}
          {!evidencePhoto && (
            <TouchableOpacity 
              style={[styles.uploadButton, { borderColor: '#3b82f6' }]}
              onPress={showPhotoOptions}
            >
              <Ionicons name="camera" size={24} color="#3b82f6" />
              <Text style={[styles.uploadText, { color: '#3b82f6' }]}>
                Add Photo Evidence
              </Text>
            </TouchableOpacity>
          )}
          
          {evidencePhoto && (
            <View style={[styles.maxPhotosReached, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={[styles.maxPhotosText, { color: theme.colors.textSecondary }]}>
                Photo added
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={isSubmitting ? ['#9ca3af', '#6b7280'] : ['#3b82f6', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Submit Complaint</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={[styles.infoNote, { backgroundColor: '#3b82f610' }]}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={[styles.infoNoteText, { color: theme.colors.textSecondary }]}>
            Your complaint will be reviewed by the management team. You will be notified once action has been taken.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: width * 0.04,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  headerCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoCard: {
    borderRadius: 10,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  selectedCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#3b82f6',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  typeDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  photoHint: {
    fontSize: 13,
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  photoContainer: {
    position: 'relative',
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    zIndex: 10,
  },
  photoNumber: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 20,
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
  },
  maxPhotosReached: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  maxPhotosText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    gap: 10,
  },
  infoNoteText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});

export default ComplaintScreen;
