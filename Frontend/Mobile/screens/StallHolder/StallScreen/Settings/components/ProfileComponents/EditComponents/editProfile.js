import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
//LALAGYAN DIN DARK MODE SUPPORT SOON.

// SectionHeader, outside component
const SectionHeader = React.memo(function SectionHeader({ title, styles }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
});

// InputField, outside component
const InputField = React.memo(function InputField({
  label,
  value,
  error,
  placeholder,
  keyboardType = "default",
  multiline = false,
  editable = true,
  onChangeText,
  styles,
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
          !editable && styles.disabledInput,
        ]}
        value={value || ""} // Ensure value is never undefined
        onChangeText={editable ? onChangeText : undefined}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        editable={editable}
        selectTextOnFocus={editable}
        autoCorrect={false}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        blurOnSubmit={false}
        onSubmitEditing={() => {}}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

// Main Modal Component
const EditProfileModal = ({ visible, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    birthDate: user?.birthDate || "",
    civilStatus: user?.civilStatus || "",
    education: user?.education || "",
    contactNumber: user?.contactNumber || "",
    mailingAddress: user?.mailingAddress || "",
    emailAddress: user?.emailAddress || "",
    spouseName: user?.spouseName || "",
    spouseBirthDate: user?.spouseBirthDate || "",
    spouseEducation: user?.spouseEducation || "",
    occupation: user?.occupation || "",
    spouseContact: user?.spouseContact || "",
    businessCapitalization: user?.businessCapitalization?.toString() || "",
    sourceOfCapital: user?.sourceOfCapital || "",
    previousBusiness: user?.previousBusiness || "",
    applicantRelative: user?.applicantRelative || "",
  });

  const [errors, setErrors] = useState({});
  const scrollViewRef = useRef(null);

  // Reinitialize formData when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        birthDate: user.birthDate || "",
        civilStatus: user.civilStatus || "",
        education: user.education || "",
        contactNumber: user.contactNumber || "",
        mailingAddress: user.mailingAddress || "",
        emailAddress: user.emailAddress || "",
        spouseName: user.spouseName || "",
        spouseBirthDate: user.spouseBirthDate || "",
        spouseEducation: user.spouseEducation || "",
        occupation: user.occupation || "",
        spouseContact: user.spouseContact || "",
        businessCapitalization: user.businessCapitalization?.toString() || "",
        sourceOfCapital: user.sourceOfCapital || "",
        previousBusiness: user.previousBusiness || "",
        applicantRelative: user.applicantRelative || "",
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    // Safe trim function that handles undefined/null values
    const safeTrim = (value) => (value || "").trim();

    if (!safeTrim(formData.emailAddress)) {
      newErrors.emailAddress = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.emailAddress)) {
      newErrors.emailAddress = "Please enter a valid email address";
    }

    if (!safeTrim(formData.mailingAddress)) {
      newErrors.mailingAddress = "Mailing address is required";
    }

    if (formData.civilStatus !== "Single") {
      if (!safeTrim(formData.spouseName))
        newErrors.spouseName = "Spouse name is required";
      if (!safeTrim(formData.spouseBirthDate)) {
        newErrors.spouseBirthDate = "Spouse birth date is required";
      }
      if (!safeTrim(formData.spouseEducation))
        newErrors.spouseEducation = "Spouse education is required";
      if (!safeTrim(formData.occupation))
        newErrors.occupation = "Spouse occupation is required";
      if (!safeTrim(formData.spouseContact))
        newErrors.spouseContact = "Spouse contact is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = useCallback(() => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors before saving.");
      return;
    }
    const updatedData = {
      ...formData,
      businessCapitalization: formData.businessCapitalization
        ? parseFloat(formData.businessCapitalization)
        : null,
    };
    onSave(updatedData);
    Alert.alert("Success", "Profile updated successfully!");
  }, [formData, onSave]);

  const handleInputChange = useCallback(
    (field, value) => {
      // Ensure value is always a string
      const safeValue = value || "";
      setFormData((prev) => ({ ...prev, [field]: safeValue }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }));
      }
    },
    [errors]
  );

  const bind = (field) => ({
    value: formData[field],
    error: errors[field],
    onChangeText: (v) => handleInputChange(field, v),
  });

  useEffect(() => {
    if (visible && user) {
      setFormData({
        fullName: user?.fullName || "",
        birthDate: user?.birthDate || "",
        civilStatus: user?.civilStatus || "",
        education: user?.education || "",
        contactNumber: user?.contactNumber || "",
        mailingAddress: user?.mailingAddress || "",
        emailAddress: user?.emailAddress || "",
        spouseName: user?.spouseName || "",
        spouseBirthDate: user?.spouseBirthDate || "",
        spouseEducation: user?.spouseEducation || "",
        occupation: user?.occupation || "",
        spouseContact: user?.spouseContact || "",
        businessCapitalization: user?.businessCapitalization?.toString() || "",
        sourceOfCapital: user?.sourceOfCapital || "",
        previousBusiness: user?.previousBusiness || "",
        applicantRelative: user?.applicantRelative || "",
      });
      setErrors({});
    }
  }, [visible, user]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      supportedOrientations={["portrait"]}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
          >
            {/* Personal Information */}
            <SectionHeader title="Personal Information" styles={styles} />
            <View style={styles.section}>
              <InputField
                label="Full Name"
                {...bind("fullName")}
                placeholder="Enter your full name"
                editable={false}
                styles={styles}
              />
              <InputField
                label="Birth Date"
                {...bind("birthDate")}
                placeholder="YYYY-MM-DD"
                keyboardType="default"
                editable={false}
                styles={styles}
              />
              <InputField
                label="Civil Status"
                {...bind("civilStatus")}
                placeholder="Single, Married, Widowed, etc."
                editable={false}
                styles={styles}
              />
              <InputField
                label="Education"
                {...bind("education")}
                placeholder="Highest educational attainment"
                editable={false}
                styles={styles}
              />
              <InputField
                label="Contact Number"
                {...bind("contactNumber")}
                placeholder="Enter your contact number"
                keyboardType="phone-pad"
                editable={false}
                styles={styles}
              />
              <InputField
                label="Email Address *"
                {...bind("emailAddress")}
                placeholder="Enter your email address"
                keyboardType="email-address"
                editable={true}
                styles={styles}
              />
              <InputField
                label="Mailing Address *"
                {...bind("mailingAddress")}
                placeholder="Enter your complete mailing address"
                multiline={true}
                editable={true}
                styles={styles}
              />
            </View>

            {/* Spouse Information */}
            {formData.civilStatus !== "Single" && (
              <>
                <SectionHeader title="Spouse Information" styles={styles} />
                <View style={styles.section}>
                  <InputField
                    label="Spouse Name *"
                    {...bind("spouseName")}
                    placeholder="Enter spouse's full name"
                    editable={true}
                    styles={styles}
                  />
                  <InputField
                    label="Spouse Birth Date *"
                    {...bind("spouseBirthDate")}
                    placeholder="YYYY-MM-DD"
                    keyboardType="default"
                    editable={true}
                    styles={styles}
                  />
                  <InputField
                    label="Spouse Education *"
                    {...bind("spouseEducation")}
                    placeholder="Spouse's educational attainment"
                    editable={true}
                    styles={styles}
                  />
                  <InputField
                    label="Occupation *"
                    {...bind("occupation")}
                    placeholder="Spouse's occupation"
                    editable={true}
                    styles={styles}
                  />
                  <InputField
                    label="Spouse Contact *"
                    {...bind("spouseContact")}
                    placeholder="Spouse's contact number"
                    keyboardType="phone-pad"
                    editable={true}
                    styles={styles}
                  />
                </View>
              </>
            )}

            {/* Business Information */}
            <SectionHeader title="Business Information" styles={styles} />
            <View style={styles.section}>
              <InputField
                label="Business Capitalization"
                {...bind("businessCapitalization")}
                placeholder="Enter amount in Philippine Peso"
                keyboardType="numeric"
                editable={true}
                styles={styles}
              />
              <InputField
                label="Source of Capital"
                {...bind("sourceOfCapital")}
                placeholder="Where did the capital come from?"
                editable={true}
                styles={styles}
              />
              <InputField
                label="Previous Business"
                {...bind("previousBusiness")}
                placeholder="Any previous business experience"
                multiline={true}
                editable={true}
                styles={styles}
              />
              <InputField
                label="Relative at NCPM"
                {...bind("applicantRelative")}
                placeholder="Do you have relatives working at NCPM?"
                editable={true}
                styles={styles}
              />
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

import { editStyles as styles } from "./editStyles";

export default EditProfileModal;
