import React, { useState, useCallback } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from "../../../StallHolder/StallScreen/Settings/components/ThemeComponents/ThemeContext";

const { width, height } = Dimensions.get("window");

// Violation types based on database (frontend mock)
const violationTypes = [
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
];

const severityLevels = [
  { id: "minor", label: "Minor", color: "#10b981", description: "First-time offense, small impact" },
  { id: "moderate", label: "Moderate", color: "#f59e0b", description: "Repeated offense or medium impact" },
  { id: "major", label: "Major", color: "#ef4444", description: "Serious violation, significant impact" },
  { id: "critical", label: "Critical", color: "#7c2d12", description: "Severe violation, immediate action needed" },
];

const ReportScreen = ({ preselectedStall, preselectedStallholder, onSubmitSuccess, onCancel }) => {
  const { theme, isDark } = useTheme();
  
  // Form state
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [selectedSeverity, setSelectedSeverity] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [evidence, setEvidence] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection state
  const [stallholderName, setStallholderName] = useState(
    preselectedStallholder?.stallholder_name || preselectedStall?.stallholder_name || ""
  );
  const [stallNo, setStallNo] = useState(
    preselectedStall?.stall_no || preselectedStallholder?.stall_no || ""
  );

  const handleSubmit = () => {
    // Validation
    if (!stallholderName.trim()) {
      Alert.alert("Error", "Please enter the stallholder name");
      return;
    }
    if (!stallNo.trim()) {
      Alert.alert("Error", "Please enter the stall number");
      return;
    }
    if (!selectedViolation) {
      Alert.alert("Error", "Please select a violation type");
      return;
    }
    if (!selectedSeverity) {
      Alert.alert("Error", "Please select a severity level");
      return;
    }
    if (!evidence.trim()) {
      Alert.alert("Error", "Please provide evidence description");
      return;
    }

    // Show confirmation
    Alert.alert(
      "Confirm Report Submission",
      `Are you sure you want to submit this violation report?\n\nStallholder: ${stallholderName}\nStall: ${stallNo}\nViolation: ${selectedViolation.violation_type}\nSeverity: ${selectedSeverity.label}`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Submit",
          onPress: async () => {
            setIsSubmitting(true);
            
            // Simulate API call (frontend only)
            setTimeout(() => {
              setIsSubmitting(false);
              Alert.alert(
                "Report Submitted",
                "The violation report has been successfully submitted.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      // Reset form
                      setSelectedViolation(null);
                      setSelectedSeverity(null);
                      setRemarks("");
                      setEvidence("");
                      if (!preselectedStall && !preselectedStallholder) {
                        setStallholderName("");
                        setStallNo("");
                      }
                      onSubmitSuccess && onSubmitSuccess();
                    },
                  },
                ]
              );
            }, 1500);
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
              Stall Number *
            </Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: theme.colors.background, 
                color: theme.colors.text,
                borderColor: theme.colors.border 
              }]}
              value={stallNo}
              onChangeText={setStallNo}
              placeholder="Enter stall number (e.g., A-001)"
              placeholderTextColor={theme.colors.textSecondary}
              editable={!preselectedStall && !preselectedStallholder}
            />
          </View>
        </View>

        {/* Violation Type Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="warning" size={18} color="#f59e0b" /> Violation Type *
          </Text>
          
          {violationTypes.map((violation) => (
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
                    {violation.ordinance_no}
                  </Text>
                </View>
              </View>
              <Text style={[styles.violationDetails, { color: theme.colors.textSecondary }]}>
                {violation.details}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Severity Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            <Ionicons name="alert-circle" size={18} color="#f59e0b" /> Severity Level *
          </Text>
          
          <View style={styles.severityGrid}>
            {severityLevels.map((severity) => (
              <TouchableOpacity
                key={severity.id}
                style={[
                  styles.severityCard,
                  { 
                    backgroundColor: selectedSeverity?.id === severity.id 
                      ? severity.color + '20' 
                      : theme.colors.background,
                    borderColor: selectedSeverity?.id === severity.id 
                      ? severity.color 
                      : theme.colors.border 
                  }
                ]}
                onPress={() => setSelectedSeverity(severity)}
              >
                <View style={[styles.severityDot, { backgroundColor: severity.color }]} />
                <Text style={[
                  styles.severityLabel, 
                  { color: selectedSeverity?.id === severity.id ? severity.color : theme.colors.text }
                ]}>
                  {severity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {selectedSeverity && (
            <View style={[styles.severityDescription, { backgroundColor: selectedSeverity.color + '10' }]}>
              <Ionicons name="information-circle" size={16} color={selectedSeverity.color} />
              <Text style={[styles.severityDescText, { color: selectedSeverity.color }]}>
                {selectedSeverity.description}
              </Text>
            </View>
          )}
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
          
          {/* Photo upload placeholder */}
          <TouchableOpacity style={[styles.uploadButton, { borderColor: theme.colors.border }]}>
            <Ionicons name="camera-outline" size={24} color={theme.colors.textSecondary} />
            <Text style={[styles.uploadText, { color: theme.colors.textSecondary }]}>
              Add Photo Evidence (Coming Soon)
            </Text>
          </TouchableOpacity>
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
});

export default ReportScreen;
