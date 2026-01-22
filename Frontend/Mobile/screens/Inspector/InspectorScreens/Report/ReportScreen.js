import React, { useState, useCallback, useEffect } from "react";
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
import { useTheme } from "../../../StallHolder/StallScreen/Settings/components/ThemeComponents/ThemeContext";
import ApiService from "../../../../services/ApiService";

const { width, height } = Dimensions.get("window");
const MAX_PHOTOS = 5;

const ReportScreen = ({ preselectedStall, preselectedStallholder, onSubmitSuccess, onCancel }) => {
  const { theme, isDark } = useTheme();
  
  // Violation types from API
  const [violationTypes, setViolationTypes] = useState([]);
  const [loadingViolations, setLoadingViolations] = useState(true);
  
  // Form state
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [evidence, setEvidence] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  
  // Photo evidence state
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  
  // Selection state
  const [stallholderName, setStallholderName] = useState(
    preselectedStallholder?.full_name || preselectedStallholder?.stallholder_name || 
    preselectedStall?.full_name || preselectedStall?.stallholder_name || ""
  );
  const [stallholderId, setStallholderId] = useState(
    preselectedStallholder?.stallholder_id?.toString() || preselectedStall?.stallholder_id?.toString() || ""
  );
  const [branchId, setBranchId] = useState(
    preselectedStallholder?.branch_id?.toString() || preselectedStall?.branch_id?.toString() || ""
  );
  const [stallId, setStallId] = useState(
    preselectedStallholder?.stall_id?.toString() || preselectedStall?.stall_id?.toString() || ""
  );

  // Load violation types on mount
  useEffect(() => {
    loadViolationTypes();
    requestPermissions();
  }, []);

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

  // Pick photo from camera
  const takePhoto = async () => {
    if (evidencePhotos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `Maximum ${MAX_PHOTOS} photos allowed per report.`);
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
          name: `evidence_${Date.now()}.jpg`,
        };
        setEvidencePhotos(prev => [...prev, newPhoto]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Pick photo from gallery
  const pickFromGallery = async () => {
    if (evidencePhotos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `Maximum ${MAX_PHOTOS} photos allowed per report.`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - evidencePhotos.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotos = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `evidence_${Date.now()}_${index}.jpg`,
        }));
        setEvidencePhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
      }
    } catch (error) {
      console.error('Error picking photos:', error);
      Alert.alert('Error', 'Failed to pick photos. Please try again.');
    }
  };

  // Remove a photo
  const removePhoto = (index) => {
    setEvidencePhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Show photo picker options
  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo Evidence',
      'Choose how to add photos',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const loadViolationTypes = async () => {
    try {
      setLoadingViolations(true);
      const response = await ApiService.getViolationTypes();
      if (response.success) {
        setViolationTypes(response.data || []);
      } else {
        console.error('Failed to load violations:', response.message);
        // Use fallback mock data if API fails
        setViolationTypes([
          {
            violation_id: 1,
            ordinance_no: "Ordinance No. 2001-055",
            violation_type: "Illegal Vending",
            details: "Vending outside prescribed area (Obstruction)",
          },
          {
            violation_id: 2,
            ordinance_no: "Ordinance No. 2001-056",
            violation_type: "Waste Segregation / Anti-Littering",
            details: "Improper waste disposal or littering",
          },
          {
            violation_id: 3,
            ordinance_no: "Ordinance No. 2017-066",
            violation_type: "Anti-Smoking",
            details: "Smoking in prohibited public areas",
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading violations:', error);
    } finally {
      setLoadingViolations(false);
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!stallholderName.trim()) {
      Alert.alert("Error", "Please enter the stallholder name");
      return;
    }
    if (!stallholderId.trim()) {
      Alert.alert("Error", "Please enter the stallholder ID");
      return;
    }
    if (!branchId.trim()) {
      Alert.alert("Error", "Please enter the branch ID");
      return;
    }
    if (!receiptNumber.trim()) {
      Alert.alert("Error", "Please enter the receipt number");
      return;
    }
    if (receiptNumber.length !== 7 || !/^\d+$/.test(receiptNumber)) {
      Alert.alert("Error", "Receipt number must be exactly 7 digits");
      return;
    }
    if (!selectedViolation) {
      Alert.alert("Error", "Please select a violation type");
      return;
    }
    if (!evidence.trim()) {
      Alert.alert("Error", "Please provide evidence description");
      return;
    }

    // Build confirmation message
    const photoInfo = evidencePhotos.length > 0 
      ? `\nPhotos Attached: ${evidencePhotos.length}` 
      : '\nPhotos: None';

    // Show confirmation
    Alert.alert(
      "Confirm Report Submission",
      `Are you sure you want to submit this violation report?\n\nStallholder: ${stallholderName}\nStallholder ID: ${stallholderId}\nBranch ID: ${branchId}\nReceipt No: ${receiptNumber}\nViolation: ${selectedViolation.violation_type}${photoInfo}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Submit",
          onPress: async () => {
            setIsSubmitting(true);
            
            try {
              // Call the API
              const reportData = {
                stallholder_id: parseInt(stallholderId),
                violation_id: selectedViolation.violation_id,
                branch_id: parseInt(branchId),
                stall_id: stallId ? parseInt(stallId) : null,
                receipt_number: parseInt(receiptNumber),
                evidence: evidence.trim(),
                remarks: remarks.trim() || null
              };
              
              // Use photo upload API if photos are attached, otherwise use regular API
              let response;
              if (evidencePhotos.length > 0) {
                response = await ApiService.submitViolationReportWithPhotos(reportData, evidencePhotos);
              } else {
                response = await ApiService.submitViolationReport(reportData);
              }
              
              setIsSubmitting(false);
              
              if (response.success) {
                const successMessage = evidencePhotos.length > 0
                  ? `The violation report has been successfully submitted with ${evidencePhotos.length} photo(s).`
                  : "The violation report has been successfully submitted.";
                  
                Alert.alert(
                  "Report Submitted",
                  successMessage,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Reset form
                        setSelectedViolation(null);
                        setRemarks("");
                        setEvidence("");
                        setReceiptNumber("");
                        setEvidencePhotos([]);
                        if (!preselectedStall && !preselectedStallholder) {
                          setStallholderName("");
                          setStallholderId("");
                          setBranchId("");
                          setStallId("");
                        }
                        onSubmitSuccess && onSubmitSuccess();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert("Error", response.message || "Failed to submit report");
              }
            } catch (error) {
              setIsSubmitting(false);
              Alert.alert("Error", "An unexpected error occurred. Please try again.");
              console.error('Submit error:', error);
            }
          },
        },
      ]
    );
  };

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
          colors={['#f59e0b', '#d97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.headerContent}>
            <Ionicons name="document-text" size={32} color="#ffffff" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>File Violation Report</Text>
              <Text style={styles.headerSubtitle}>
                Report violations for inspection compliance
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stallholder Info Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="person" size={18} color="#f59e0b" /> Stallholder Information
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Stallholder Name *
            </Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={stallholderName}
              onChangeText={setStallholderName}
              placeholder="Enter stallholder name"
              placeholderTextColor={theme.colors.textSecondary}
              editable={!preselectedStall && !preselectedStallholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Stallholder ID *
            </Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={stallholderId}
              onChangeText={setStallholderId}
              placeholder="Enter stallholder ID"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              editable={!preselectedStall && !preselectedStallholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Branch ID *
            </Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={branchId}
              onChangeText={setBranchId}
              placeholder="Enter branch ID"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              editable={!preselectedStall && !preselectedStallholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Stall ID (Optional)
            </Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={stallId}
              onChangeText={setStallId}
              placeholder="Enter stall ID (if applicable)"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              editable={!preselectedStall && !preselectedStallholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Receipt Number * (7 digits)
            </Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={receiptNumber}
              onChangeText={(text) => {
                // Only allow digits and max 7 characters
                const filtered = text.replace(/[^0-9]/g, '').slice(0, 7);
                setReceiptNumber(filtered);
              }}
              placeholder="Enter 7-digit receipt number"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              maxLength={7}
            />
          </View>
        </View>

        {/* Violation Type Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="warning" size={18} color="#f59e0b" /> Violation Type *
          </Text>
          
          {loadingViolations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#f59e0b" />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading violation types...
              </Text>
            </View>
          ) : violationTypes.map((violation) => (
            <TouchableOpacity
              key={violation.violation_id}
              style={[
                styles.violationCard,
                { 
                  backgroundColor: theme.colors.background,
                  borderColor: selectedViolation?.violation_id === violation.violation_id 
                    ? '#f59e0b' 
                    : theme.colors.border 
                },
                selectedViolation?.violation_id === violation.violation_id && styles.selectedCard
              ]}
              onPress={() => setSelectedViolation(violation)}
            >
              <View style={styles.violationHeader}>
                <View style={[
                  styles.radioCircle,
                  selectedViolation?.violation_id === violation.violation_id && styles.radioCircleSelected
                ]}>
                  {selectedViolation?.violation_id === violation.violation_id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <View style={styles.violationInfo}>
                  <Text style={[styles.violationType, { color: theme.colors.text }]}>
                    {violation.violation_type}
                  </Text>
                  <Text style={[styles.ordinanceNo, { color: theme.colors.textSecondary }]}>
                    {violation.description}
                  </Text>
                  <Text style={[styles.penaltyAmount, { color: '#f59e0b' }]}>
                    Penalty: ₱{parseFloat(violation.default_penalty).toFixed(2)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.violationDetails, { color: theme.colors.textSecondary }]}>
                {violation.details}
              </Text>
            </TouchableOpacity>
          ))}
        </View>



        {/* Evidence Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="camera" size={18} color="#f59e0b" /> Evidence Description *
          </Text>
          
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: theme.colors.background, 
              color: theme.colors.text,
              borderColor: theme.colors.border 
            }]}
            value={evidence}
            onChangeText={setEvidence}
            placeholder="Describe what you observed (e.g., 'Found vendor selling outside assigned area at 8:15 AM')"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          {/* Photo Evidence Section */}
          <View style={styles.photoSection}>
            <Text style={[styles.photoSectionTitle, { color: theme.colors.text }]}>
              Photo Evidence (Optional - Max {MAX_PHOTOS})
            </Text>
            
            {/* Photo Grid */}
            {evidencePhotos.length > 0 && (
              <View style={styles.photoGrid}>
                {evidencePhotos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                    <Text style={[styles.photoNumber, { color: theme.colors.textSecondary }]}>
                      {index + 1}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Add Photo Button */}
            {evidencePhotos.length < MAX_PHOTOS && (
              <TouchableOpacity 
                style={[styles.uploadButton, { borderColor: '#f59e0b' }]}
                onPress={showPhotoOptions}
              >
                <Ionicons name="camera" size={24} color="#f59e0b" />
                <Text style={[styles.uploadText, { color: '#f59e0b' }]}>
                  {evidencePhotos.length === 0 
                    ? 'Add Photo Evidence' 
                    : `Add More Photos (${evidencePhotos.length}/${MAX_PHOTOS})`}
                </Text>
              </TouchableOpacity>
            )}
            
            {evidencePhotos.length >= MAX_PHOTOS && (
              <View style={[styles.maxPhotosReached, { backgroundColor: theme.colors.background }]}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={[styles.maxPhotosText, { color: theme.colors.textSecondary }]}>
                  Maximum photos reached ({MAX_PHOTOS}/{MAX_PHOTOS})
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Remarks Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="create" size={18} color="#f59e0b" /> Additional Remarks
          </Text>
          
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: theme.colors.background, 
              color: theme.colors.text,
              borderColor: theme.colors.border 
            }]}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Any additional notes or observations (optional)"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {onCancel && (
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={isSubmitting ? ['#9ca3af', '#6b7280'] : ['#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
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
    minHeight: 100,
  },
  violationCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  selectedCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  violationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    borderColor: '#f59e0b',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f59e0b',
  },
  violationInfo: {
    flex: 1,
  },
  violationType: {
    fontSize: 15,
    fontWeight: '600',
  },
  ordinanceNo: {
    fontSize: 12,
    marginTop: 2,
  },
  penaltyAmount: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  violationDetails: {
    fontSize: 13,
    marginLeft: 34,
    lineHeight: 18,
  },
  severityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  severityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  severityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  severityDescription: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  severityDescText: {
    fontSize: 13,
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 20,
    marginTop: 12,
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
  // Photo Evidence Styles
  photoSection: {
    marginTop: 16,
  },
  photoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
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
  maxPhotosReached: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  maxPhotosText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ReportScreen;
