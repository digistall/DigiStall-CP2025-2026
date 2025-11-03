import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../ThemeComponents/ThemeContext";
import { AboutStyles } from "../AboutComponents/AboutStyles";

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

  return (
    <>
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.colors.surface}
      />
      <View style={themedStyles.container}>
        {/* Floating Back Button */}
        <TouchableOpacity
          onPress={onGoBack}
          style={themedStyles.floatingBackButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={themedStyles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <ScrollView style={themedStyles.content}>
          {/* App Info Section */}
          <View style={themedStyles.section}>
            <View style={themedStyles.appIconContainer}>
              <MaterialIcons
                name="store"
                size={80}
                color={theme.colors.primary}
              />
            </View>
            <Text style={themedStyles.appName}>
              Market Stall Management System
            </Text>
            <Text style={themedStyles.appVersion}>Version 1.2.0</Text>
            <Text style={themedStyles.appDescription}>
              A comprehensive solution for managing market stall rentals and
              operations. Designed to enhance the process for both stallholders
              and market administrators.
            </Text>
          </View>

          {/* Features Section */}
          <View style={themedStyles.section}>
            <Text style={themedStyles.sectionTitle}>Key Features</Text>
            <View style={themedStyles.featuresList}>
              <View style={themedStyles.featureItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={themedStyles.featureText}>
                  Easy stall management and rental process
                </Text>
              </View>
              <View style={themedStyles.featureItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={themedStyles.featureText}>
                  Partake for stall rentals for both NCPM and Satellite Markets
                </Text>
              </View>
              <View style={themedStyles.featureItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={themedStyles.featureText}>
                  Payment history tracking
                </Text>
              </View>
              <View style={themedStyles.featureItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={themedStyles.featureText}>
                  Profile and preferences management
                </Text>
              </View>
              <View style={themedStyles.featureItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={themedStyles.featureText}>
                  Dark theme and light theme support
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Section */}
          <View style={themedStyles.section}>
            <Text style={themedStyles.sectionTitle}>Contact & Support</Text>

            <TouchableOpacity
              style={themedStyles.contactItem}
              onPress={() =>
                handleContactPress("email", "DigiStallNagaCity@gmail.com")
              }
            >
              <Ionicons
                name="mail-outline"
                size={24}
                color={theme.colors.primary}
              />
              <View style={themedStyles.contactTextContainer}>
                <Text style={themedStyles.contactLabel}>Email Support</Text>
                <Text style={themedStyles.contactValue}>
                  DigiStallNagaCity@gmail.com
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={themedStyles.contactItem}
              onPress={() => handleContactPress("phone", "+63-911-1233-787")}
            >
              <Ionicons
                name="call-outline"
                size={24}
                color={theme.colors.primary}
              />
              <View style={themedStyles.contactTextContainer}>
                <Text style={themedStyles.contactLabel}>Phone Support</Text>
                <Text style={themedStyles.contactValue}>+63-911-1233-787</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={themedStyles.contactItem}
              onPress={() =>
                handleContactPress(
                  "website",
                  "https://www.DigiStallNagaCity.com"
                )
              }
            >
              <Ionicons
                name="globe-outline"
                size={24}
                color={theme.colors.primary}
              />
              <View style={themedStyles.contactTextContainer}>
                <Text style={themedStyles.contactLabel}>Website</Text>
                <Text style={themedStyles.contactValue}>
                  www.DigiStallNagaCity.com
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Developer Info */}
          <View style={themedStyles.section}>
            <Text style={themedStyles.sectionTitle}>Development Team</Text>
            <Text style={themedStyles.developerText}>
              Developed with ❤️ by the Students of the University of Nueva
              Caceres
            </Text>
            <Text style={themedStyles.locationText}>
              Naga, Bicol Region, Philippines
            </Text>
          </View>

          {/* Legal Section */}
          <View style={themedStyles.section}>
            <Text style={themedStyles.sectionTitle}>Legal</Text>
            <TouchableOpacity style={themedStyles.legalItem}>
              <Text style={themedStyles.legalText}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={themedStyles.legalItem}>
              <Text style={themedStyles.legalText}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={themedStyles.legalItem}>
              <Text style={themedStyles.legalText}>Open Source Licenses</Text>
            </TouchableOpacity>
          </View>

          {/* Copyright */}
          <View style={themedStyles.copyrightSection}>
            <Text style={themedStyles.copyrightText}>
              © 2025 Market Stall Management System (DigiStall). All rights
              reserved.
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

export default AboutApp;