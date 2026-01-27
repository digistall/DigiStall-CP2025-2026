import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@shared-mobile/COMPONENTS/ThemeComponents/ThemeContext";
import { AboutStyles } from "../AboutComponents/AboutStyles";

const { width, height } = Dimensions.get("window");

const AboutApp = ({ onGoBack }) => {
  const { theme } = useTheme();

  const handleContactPress = (type, contact) => {
    switch (type) {
      case "email":
        Linking.openURL(`mailto:${contact}`);
        break;
      case "phone":
        Linking.openURL(`tel:${contact}`);
        break;
      case "website":
        Linking.openURL(contact);
        break;
      default:
        break;
    }
  };

  // external styled function
  const themedStyles = AboutStyles(theme);

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
      <View style={themedStyles.container}>
        <ScrollView style={themedStyles.content} showsVerticalScrollIndicator={false}>
          {/* Header with Gradient */}
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={themedStyles.headerGradient}
          >
            {/* Back Button */}
            <TouchableOpacity
              onPress={onGoBack}
              style={themedStyles.backButton}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
              <Text style={themedStyles.backButtonText}>Back</Text>
            </TouchableOpacity>

            {/* App Icon and Title */}
            <View style={themedStyles.headerContent}>
              <View style={themedStyles.appIconWrapper}>
                <View style={themedStyles.appIconContainer}>
                  <MaterialCommunityIcons name="store" size={60} color="#1a237e" />
                </View>
              </View>
              <Text style={themedStyles.appName}>DigiStall</Text>
              <Text style={themedStyles.appSubtitle}>Naga Stall Management System</Text>
              <View style={themedStyles.versionBadge}>
                <Text style={themedStyles.versionText}>v1.1.0</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Content Area */}
          <View style={themedStyles.contentArea}>
            {/* Description Card */}
            <View style={themedStyles.descriptionCard}>
              <Text style={themedStyles.descriptionText}>
              A comprehensive solution for managing market stall rentals and operations, 
              designed to enhance the experience for both stallholders and market administrators.
              </Text>
            </View>

          {/* Features Section */}
          <View style={themedStyles.section}>
            <View style={themedStyles.sectionHeader}>
              <MaterialCommunityIcons name="star-circle-outline" size={22} color={theme.colors.primary} />
              <Text style={themedStyles.sectionTitle}>Key Features</Text>
            </View>
            <View style={themedStyles.sectionContent}>
              <View style={themedStyles.featuresList}>
                <View style={themedStyles.featureItem}>
                  <View style={themedStyles.featureIconContainer}>
                    <Ionicons name="checkmark-circle" size={22} color="#4caf50" />
                  </View>
                  <Text style={themedStyles.featureText}>
                    Easy stall management and rental process
                  </Text>
                </View>
                <View style={themedStyles.featureItem}>
                  <View style={themedStyles.featureIconContainer}>
                    <Ionicons name="checkmark-circle" size={22} color="#4caf50" />
                  </View>
                  <Text style={themedStyles.featureText}>
                    Partake for stall rentals for both NCPM and Satellite Markets
                  </Text>
                </View>
                <View style={themedStyles.featureItem}>
                  <View style={themedStyles.featureIconContainer}>
                    <Ionicons name="checkmark-circle" size={22} color="#4caf50" />
                  </View>
                  <Text style={themedStyles.featureText}>
                    Payment history tracking
                  </Text>
                </View>
                <View style={themedStyles.featureItem}>
                  <View style={themedStyles.featureIconContainer}>
                    <Ionicons name="checkmark-circle" size={22} color="#4caf50" />
                  </View>
                  <Text style={themedStyles.featureText}>
                    Profile and preferences management
                  </Text>
                </View>
                <View style={themedStyles.featureItem}>
                  <View style={themedStyles.featureIconContainer}>
                    <Ionicons name="checkmark-circle" size={22} color="#4caf50" />
                  </View>
                  <Text style={themedStyles.featureText}>
                    Dark theme and light theme support
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Contact Section */}
          <View style={themedStyles.section}>
            <View style={themedStyles.sectionHeader}>
              <Ionicons name="mail-outline" size={22} color={theme.colors.primary} />
              <Text style={themedStyles.sectionTitle}>Contact & Support</Text>
            </View>
            <View style={themedStyles.sectionContent}>
              <TouchableOpacity
                style={themedStyles.contactItem}
                onPress={() =>
                  handleContactPress("email", "digistall@unc.edu.ph")
                }
              >
                <View style={themedStyles.contactIconContainer}>
                  <Ionicons name="mail" size={20} color="#fff" />
                </View>
                <View style={themedStyles.contactTextContainer}>
                  <Text style={themedStyles.contactLabel}>Email Support</Text>
                  <Text style={themedStyles.contactValue}>
                    digistall@unc.edu.ph
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={themedStyles.contactItem}
                onPress={() => handleContactPress("phone", "+63-911-1233-787")}
              >
                <View style={themedStyles.contactIconContainer}>
                  <Ionicons name="call" size={20} color="#fff" />
                </View>
                <View style={themedStyles.contactTextContainer}>
                  <Text style={themedStyles.contactLabel}>Phone Support</Text>
                  <Text style={themedStyles.contactValue}>+63-911-1233-787</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[themedStyles.contactItem, themedStyles.lastContactItem]}
                onPress={() =>
                  handleContactPress(
                    "website",
                    "https://www.DigiStallNagaCity.com"
                  )
                }
              >
                <View style={themedStyles.contactIconContainer}>
                  <Ionicons name="globe" size={20} color="#fff" />
                </View>
                <View style={themedStyles.contactTextContainer}>
                  <Text style={themedStyles.contactLabel}>Website</Text>
                  <Text style={themedStyles.contactValue}>
                    www.DigiStallNagaCity.com
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Developer Info */}
          <View style={themedStyles.section}>
            <View style={themedStyles.sectionHeader}>
              <MaterialCommunityIcons name="account-group-outline" size={22} color={theme.colors.primary} />
              <Text style={themedStyles.sectionTitle}>Development Team</Text>
            </View>
            <View style={themedStyles.sectionContent}>
              <View style={themedStyles.developerCard}>
                <MaterialCommunityIcons name="school-outline" size={40} color={theme.colors.primary} />
                <Text style={themedStyles.developerText}>
                  Developed by the proponents of the{"\n"}University of Nueva Caceres
                </Text>
                <View style={themedStyles.locationBadge}>
                  <Ionicons name="location" size={16} color={theme.colors.primary} />
                  <Text style={themedStyles.locationText}>
                    Naga, Bicol Region, Philippines
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Legal Section */}
          <View style={themedStyles.section}>
            <View style={themedStyles.sectionHeader}>
              <Ionicons name="document-text-outline" size={22} color={theme.colors.primary} />
              <Text style={themedStyles.sectionTitle}>Legal</Text>
            </View>
            <View style={themedStyles.sectionContent}>
              <TouchableOpacity style={themedStyles.legalItem}>
                <Text style={themedStyles.legalText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity style={themedStyles.legalItem}>
                <Text style={themedStyles.legalText}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity style={[themedStyles.legalItem, themedStyles.lastLegalItem]}>
                <Text style={themedStyles.legalText}>Open Source Licenses</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Copyright */}
          <View style={themedStyles.copyrightSection}>
            <Text style={themedStyles.copyrightText}>
              © 2025 DigiStall - Naga Stall Management System
            </Text>
            <Text style={themedStyles.copyrightSubtext}>
              All rights reserved.
            </Text>
          </View>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </>
  );
};

export default AboutApp;