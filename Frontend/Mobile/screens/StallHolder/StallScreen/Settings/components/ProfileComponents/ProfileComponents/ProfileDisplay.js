import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { mockUser } from "../mockUser";
import EditProfileModal from "../EditComponents/editProfile";
import UserStorageService from "../../../../../../../services/UserStorageService";
// import { useTheme } from "../ThemeContext"; babalikan kita soon, darkmode.

const ProfileDisplay = ({ user, onGoBack, onUpdateUser }) => {
  console.log("ProfileDisplay component rendered with user:", user);

  // state for controlling edit modal visibility
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [userData, setUserData] = useState(null);

  // Load user data from storage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await UserStorageService.getUserData();
        if (storedUserData) {
          setUserData(storedUserData);
          console.log("Loaded user data:", storedUserData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // log when component mounts
  React.useEffect(() => {
    console.log("ProfileDisplay component mounted successfully");
    console.log("Profile data loaded and ready to display");
  }, []);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  };

  // Map backend data to profile format
  const getProfileData = () => {
    if (userData && userData.user) {
      const user = userData.user;
      const profile = userData.profile || {};
      
      return {
        // Personal Information
        fullName: user.full_name || "Not specified",
        education: user.educational_attainment || "Not specified",
        birthDate: formatDate(user.birthdate),
        civilStatus: user.civil_status || "Not specified",
        contactNumber: user.contact_number || "Not specified",
        mailingAddress: user.address || "Not specified",

        // Spouse Information (if available)
        spouseName: profile.spouse_info?.full_name || "Not specified",
        spouseBirthDate: formatDate(profile.spouse_info?.birthdate),
        spouseEducation: profile.spouse_info?.educational_attainment || "Not specified",
        occupation: profile.spouse_info?.occupation || "Not specified",
        spouseContact: profile.spouse_info?.contact_number || "Not specified",

        // Business Information
        businessCapitalization: profile.business_info?.capitalization || "Not specified",
        sourceOfCapital: profile.business_info?.source_of_capital || "Not specified",
        previousBusiness: profile.business_info?.previous_experience || "Not specified",
        applicantRelative: profile.business_info?.relative_stall_owner || "None",

        // Other Information
        emailAddress: profile.other_info?.email_address || user.email || "Not specified",

        // Additional Info
        registrationId: user.registration_id || "Not specified",
        username: user.username || "Not specified",
        applicantId: user.applicant_id || "Not specified",
      };
    }

    // Fallback to mock user if no real data
    return {
      fullName: mockUser.fullName,
      education: mockUser.education,
      birthDate: mockUser.birthDate,
      civilStatus: mockUser.civilStatus,
      contactNumber: mockUser.contactNumber,
      mailingAddress: mockUser.mailingAddress,
      spouseName: mockUser.spouseName,
      spouseBirthDate: mockUser.spouseBirthDate,
      spouseEducation: mockUser.spouseEducation,
      occupation: mockUser.occupation,
      spouseContact: mockUser.spouseContact,
      businessCapitalization: mockUser.businessCapitalization,
      sourceOfCapital: mockUser.sourceOfCapital,
      previousBusiness: mockUser.previousBusiness,
      applicantRelative: mockUser.applicantRelative,
      emailAddress: mockUser.emailAddress,
      registrationId: "Loading...",
      username: "Loading...",
      applicantId: "Loading...",
    };
  };

  const profileData = getProfileData();

  // handle saving updated profile data
  const handleSaveProfile = (updatedData) => {
    setCurrentUser(updatedData);
    setIsEditModalVisible(false);

    // if the parent component provided an update handler, call it
    if (onUpdateUser) {
      onUpdateUser(updatedData);
    }
  };

  const InfoSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value || "Not provided"}</Text>
    </View>
  );

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditModalVisible(true)}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {profileData.fullName
                .split(" ")
                .map((name) => name[0])
                .join("")
                .substring(0, 2)}
            </Text>
          </View>
          <Text style={styles.profileName}>{profileData.fullName}</Text>
          <Text style={styles.profileEmail}>{profileData.emailAddress}</Text>
        </View>

        <InfoSection title="Account Information">
          <InfoRow label="Username" value={profileData.username} />
          <InfoRow label="Registration ID" value={profileData.registrationId} />
          <InfoRow label="Applicant ID" value={profileData.applicantId} />
        </InfoSection>

        <InfoSection title="Personal Information">
          <InfoRow label="Full Name" value={profileData.fullName} />
          <InfoRow label="Birth Date" value={profileData.birthDate} />
          <InfoRow label="Civil Status" value={profileData.civilStatus} />
          <InfoRow label="Education" value={profileData.education} />
          <InfoRow label="Contact Number" value={profileData.contactNumber} />
          <InfoRow label="Mailing Address" value={profileData.mailingAddress} />
        </InfoSection>

        {profileData.civilStatus !== "Single" && (
          <InfoSection title="Spouse Information">
            <InfoRow label="Spouse Name" value={profileData.spouseName} />
            <InfoRow
              label="Spouse Birth Date"
              value={profileData.spouseBirthDate}
            />
            <InfoRow
              label="Spouse Education"
              value={profileData.spouseEducation}
            />
            <InfoRow label="Occupation" value={profileData.occupation} />
            <InfoRow label="Spouse Contact" value={profileData.spouseContact} />
          </InfoSection>
        )}

        <InfoSection title="Business Information">
          <InfoRow
            label="Capitalization"
            value={`₱${profileData.businessCapitalization?.toLocaleString()}`}
          />
          <InfoRow
            label="Source of Capital"
            value={profileData.sourceOfCapital}
          />
          <InfoRow
            label="Previous Business"
            value={profileData.previousBusiness}
          />
          <InfoRow
            label="Relative at NCPM"
            value={profileData.applicantRelative}
          />
        </InfoSection>

        <InfoSection title="Other Information">
          <InfoRow label="Signature" value="✓ Uploaded" />
          <InfoRow label="House Sketch" value="✓ Uploaded" />
          <InfoRow label="Valid ID" value="✓ Uploaded" />
        </InfoSection>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Application Status: Pending Review
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        user={currentUser || mockUser}
        onSave={handleSaveProfile}
      />
    </>
  );
};

import { ProfileStyles as styles } from "./ProfileStyles";

export default ProfileDisplay;
