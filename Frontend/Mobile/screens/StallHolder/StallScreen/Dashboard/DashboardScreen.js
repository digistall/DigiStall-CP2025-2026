import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from "react-native";

import PaymentRecord from "./Components/PaymentRecord";
import StallInfo from "./Components/StallInfo";
import ReportStatus from "./Components/ReportStatus";
import NextPayment from "./Components/NextPayment";
import DocumentStatus from "./Components/DocumentStatus";

const { width, height } = Dimensions.get("window");

const DashboardScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, John Doe</Text>
        </View>

        {/* Dashboard Content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Quick Overview Cards */}
          <View style={styles.overviewContainer}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>A-45</Text>
              <Text style={styles.overviewLabel}>Stall Number</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>NCPM</Text>
              <Text style={styles.overviewLabel}>Stall Type</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>₱2,500</Text>
              <Text style={styles.overviewLabel}>Monthly Rent</Text>
            </View>
          </View>

          {/* Main Components */}
          <NextPayment />
          <DocumentStatus />
          <PaymentRecord />
          <ReportStatus />
          <StallInfo />

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: width * 0.06,
    paddingTop: width * 0.08,
    paddingBottom: width * 0.05,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: width * 0.04,
    color: "#666666",
    marginTop: width * 0.01,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  scrollContent: {
    paddingHorizontal: width * 0.06,
    paddingVertical: width * 0.06,
  },
  overviewContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: width * 0.06,
    gap: width * 0.02,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: width * 0.03,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    minHeight: width * 0.18,
  },
  overviewValue: {
    fontSize: width * 0.045,
    fontWeight: "700",
    color: "#000000",
    marginBottom: width * 0.008,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  overviewLabel: {
    fontSize: width * 0.028,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: width * 0.035,
  },
  bottomSpacing: {
    height: width * 0.08,
  },
});

export default DashboardScreen;