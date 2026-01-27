import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, StatusBar } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { mockUser } from "../mockUser";
import EditProfileModal from "../EditComponents/editProfile";
import UserStorageService from "../../../../services/UserStorageService";
import { useTheme } from '../../../../../../../components/ThemeComponents/ThemeContext';
import { getSafeDisplayValue, getSafeUserName, getSafeContactInfo } from "../../../../services/DataDisplayUtils";

const { width, height } = Dimensions.get("window");

const ProfileDisplay = ({ user, onGoBack, onUpdateUser }) => {
  const { theme, isDark } = useTheme();
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
          console.log("ProfileDisplay - Loaded user data:", JSON.stringify(storedUserData, null, 2));
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

  // Map backend data to profile format - UPDATED for new backend structure
  const getProfileData = () => {
    if (userData && userData.user) {
      const user = userData.user;
      // Try direct objects first, fallback to profile structure for backward compatibility
      const spouse = userData.spouse || userData.profile?.spouse_info || null;
      const business = userData.business || userData.profile?.business_info || null;
      const otherInfo = userData.other_info || userData.profile?.other_info || null;
      const application = userData.application || {};
      const stallholder = userData.stallholder || {};
      
      console.log('📊 ProfileDisplay - Loaded data:', {
        hasSpouse: !!spouse,
        hasBusiness: !!business,
        hasOtherInfo: !!otherInfo,
        hasStallholder: !!userData.stallholder,
        spouseData: spouse,
        businessData: business,
        otherInfoData: otherInfo,
        stallholderData: stallholder
      });
      
      // Format payment status for display
      const formatPaymentStatus = (status) => {
        if (!status) return "N/A";
        const statusLower = status.toLowerCase();
        if (statusLower === 'paid' || statusLower === 'completed') return "Paid";
        if (statusLower === 'pending') return "Pending";
        if (statusLower === 'overdue') return "Overdue";
        return status.charAt(0).toUpperCase() + status.slice(1);
      };
      
      return {
        // Personal Information - using safe display utilities
        fullName: getSafeDisplayValue(user.full_name || user.fullName, "Not specified"),
        education: getSafeDisplayValue(user.educational_attainment, "Not specified"),
        birthDate: formatDate(user.birthdate),
        civilStatus: getSafeDisplayValue(user.civil_status, "Single"),
        contactNumber: getSafeDisplayValue(user.contact_number || user.contactNumber, "Not specified"),
        mailingAddress: getSafeDisplayValue(user.address, "Not specified"),

        // Spouse Information (from spouse table) - only if spouse exists
        hasSpouse: !!spouse,
        spouseName: getSafeDisplayValue(spouse?.full_name, "Not specified"),
        spouseBirthDate: formatDate(spouse?.birthdate),
        spouseEducation: getSafeDisplayValue(spouse?.educational_attainment, "Not specified"),
        occupation: getSafeDisplayValue(spouse?.occupation, "Not specified"),
        spouseContact: getSafeDisplayValue(spouse?.contact_number, "Not specified"),

        // Business Information (from business_information table)
        hasBusiness: !!business,
        businessNature: getSafeDisplayValue(business?.nature_of_business, "Not specified"),
        businessCapitalization: business?.capitalization ? Number(business.capitalization) : null,
        sourceOfCapital: getSafeDisplayValue(business?.source_of_capital, "Not specified"),
        previousBusiness: getSafeDisplayValue(business?.previous_business_experience || business?.previous_experience, "None"),
        applicantRelative: getSafeDisplayValue(business?.relative_stall_owner, "None"),

        // Other Information (from other_information table)
        hasOtherInfo: !!otherInfo,
        emailAddress: getSafeDisplayValue(otherInfo?.email_address || user.email, "Not specified"),
        signature: (otherInfo?.signature_of_applicant || otherInfo?.signature) ? "✓ Uploaded" : "Not uploaded",
        houseSketch: (otherInfo?.house_sketch_location || otherInfo?.house_sketch) ? "✓ Uploaded" : "Not uploaded",
        validId: otherInfo?.valid_id ? "✓ Uploaded" : "Not uploaded",

        // Account Info
        registrationId: user.registration_id || user.registrationId || "Not specified",
        username: user.username || "Not specified",
        applicantId: user.applicant_id || user.id || "Not specified",

        // Application Status
        applicationStatus: userData.applicationStatus || application.status || "No Application",
        
        // Stallholder Info - reading directly from stallholder object
        isStallholder: userData.isStallholder || !!stallholder.stallholder_id,
        stallNo: stallholder.stall_no || application.stall_no || "N/A",
        branchName: stallholder.branch_name || application.branch_name || "N/A",
        contractStatus: stallholder.contract_status || "N/A",
        paymentStatus: formatPaymentStatus(stallholder.payment_status),
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
      businessNature: "Not specified",
      businessCapitalization: mockUser.businessCapitalization,
      sourceOfCapital: mockUser.sourceOfCapital,
      previousBusiness: mockUser.previousBusiness,
      applicantRelative: mockUser.applicantRelative,
      emailAddress: mockUser.emailAddress,
      signature: "Not uploaded",
      houseSketch: "Not uploaded",
      validId: "Not uploaded",
      registrationId: "Loading...",
      username: "Loading...",
      applicantId: "Loading...",
      applicationStatus: "Loading...",
      isStallholder: false,
      stallNo: "N/A",
      branchName: "N/A",
      contractStatus: "N/A",
      paymentStatus: "N/A",
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

  // Create themed styles
  const styles = createThemedStyles(theme);

  // Get section icon
  const getSectionIcon = (title) => {
    switch (title) {
      case "Account Information":
        return <Ionicons name="person-circle-outline" size={22} color={theme.colors.primary} />;
      case "Personal Information":
        return <MaterialCommunityIcons name="card-account-details-outline" size={22} color={theme.colors.primary} />;
      case "Spouse Information":
        return <Ionicons name="heart-outline" size={22} color={theme.colors.primary} />;
      case "Business Information":
        return <Ionicons name="briefcase-outline" size={22} color={theme.colors.primary} />;
      case "Other Information":
        return <Ionicons name="document-text-outline" size={22} color={theme.colors.primary} />;
      case "Stallholder Information":
        return <MaterialCommunityIcons name="store-outline" size={22} color={theme.colors.primary} />;
      default:
        return <Ionicons name="information-circle-outline" size={22} color={theme.colors.primary} />;
    }
  };

  const InfoSection = ({ title, children }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {getSectionIcon(title)}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {React.Children.map(children, (child, index) => {
          const isLast = index === React.Children.count(children) - 1;
          return React.cloneElement(child, { isLast });
        })}
      </View>
    </View>
  );

  const InfoRow = ({ label, value, isLast }) => (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "Not provided"}</Text>
    </View>
  );

  // Get gradient colors based on theme
  const getGradientColors = () => {
    if (theme.isDark) {
      return ['#1a237e', '#0d47a1', '#1565c0'];
    }
    return ['#1a237e', '#283593', '#3949ab'];
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Navigation Buttons */}
          <View style={styles.navigationRow}>
            <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Settings</Text>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditModalVisible(true)}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Avatar & Info */}
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {profileData.fullName
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .substring(0, 2)}
                </Text>
              </View>
              <View style={styles.onlineIndicator} />
            </View>
            <Text style={styles.profileName}>{profileData.fullName}</Text>
            <Text style={styles.profileEmail}>{profileData.emailAddress}</Text>
          </View>
        </LinearGradient>

        {/* Content Area */}
        <View style={styles.contentArea}>
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

        {/* Show Spouse Information if married or spouse data exists */}
        {(profileData.hasSpouse || profileData.civilStatus === "Married") && (
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
            label="Nature of Business"
            value={profileData.businessNature}
          />
          <InfoRow
            label="Capitalization"
            value={profileData.businessCapitalization ? `₱${profileData.businessCapitalization.toLocaleString()}` : "Not specified"}
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
          <InfoRow label="Email Address" value={profileData.emailAddress} />
          <InfoRow label="Signature" value={profileData.signature} />
          <InfoRow label="House Sketch" value={profileData.houseSketch} />
          <InfoRow label="Valid ID" value={profileData.validId} />
        </InfoSection>

        {profileData.isStallholder && (
          <InfoSection title="Stallholder Information">
            <InfoRow label="Stall Number" value={profileData.stallNo} />
            <InfoRow label="Branch" value={profileData.branchName} />
            <InfoRow label="Contract Status" value={profileData.contractStatus} />
            <InfoRow label="Payment Status" value={profileData.paymentStatus} />
          </InfoSection>
        )}

          {/* Application Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusIconContainer}>
              <Ionicons 
                name={profileData.applicationStatus === 'Approved' ? 'checkmark-circle' : 
                      profileData.applicationStatus === 'Rejected' ? 'close-circle' : 'time'}
                size={28}
                color={profileData.applicationStatus === 'Approved' ? '#28a745' : 
                       profileData.applicationStatus === 'Rejected' ? '#dc3545' : '#f59e0b'}
              />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusLabel}>Application Status</Text>
              <Text style={[
                styles.statusValue, 
                { color: profileData.applicationStatus === 'Approved' ? '#28a745' : 
                         profileData.applicationStatus === 'Rejected' ? '#dc3545' : '#f59e0b' }
              ]}>
                {profileData.applicationStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 30 }} />
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

// Create themed styles function
const createThemedStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerGradient: {
    paddingTop: height * 0.02,
    paddingBottom: height * 0.04,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  navigationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.02,
  },
  headerTitle: {
    fontSize: width * 0.05,
    fontWeight: "600",
    color: "#fff",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: width * 0.038,
    marginLeft: 6,
    fontWeight: "500",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  editButtonText: {
    color: "#fff",
    fontSize: width * 0.038,
    marginLeft: 6,
    fontWeight: "500",
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: width * 0.06,
    paddingBottom: height * 0.01,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: height * 0.015,
  },
  avatarContainer: {
    width: width * 0.24,
    height: width * 0.24,
    borderRadius: width * 0.12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: width * 0.09,
    fontWeight: "bold",
    color: "#1a237e",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#4caf50",
    borderWidth: 3,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileEmail: {
    fontSize: width * 0.038,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
  },
  contentArea: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.025,
    paddingBottom: height * 0.01,
  },
  section: {
    backgroundColor: theme.colors.card,
    marginBottom: height * 0.018,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.045,
    paddingVertical: height * 0.018,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26, 35, 126, 0.08)',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26, 35, 126, 0.04)',
  },
  sectionTitle: {
    fontSize: width * 0.042,
    fontWeight: "700",
    color: theme.colors.text,
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  sectionContent: {
    paddingHorizontal: width * 0.045,
    paddingVertical: height * 0.012,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: height * 0.014,
    borderBottomWidth: 1,
    borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: width * 0.038,
    fontWeight: "500",
    color: theme.colors.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: width * 0.038,
    fontWeight: "600",
    color: theme.colors.text,
    flex: 1.2,
    textAlign: "right",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    marginBottom: height * 0.018,
    padding: width * 0.045,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
  },
  statusIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26, 35, 126, 0.06)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: width * 0.035,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: width * 0.045,
    fontWeight: "700",
  },
});

export default ProfileDisplay;
