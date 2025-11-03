import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

// function that creates themed styles
export const AboutStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  floatingBackButton: {
    position: "absolute",
    top: width * 0.06,
    left: width * 0.08,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  backButtonText: {
    color: "#fff",
    fontSize: width * 0.04,
    marginLeft: 4,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  appVersion: {
    fontSize: width * 0.04,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  appDescription: {
    fontSize: width * 0.04,
    color: theme.colors.text,
    lineHeight: width * 0.06,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 12,
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: width * 0.04,
    color: theme.colors.text,
    marginLeft: 12,
    flex: 1,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  contactTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  contactLabel: {
    fontSize: width * 0.04,
    fontWeight: "500",
    color: theme.colors.text,
  },
  contactValue: {
    fontSize: width * 0.035,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  developerText: {
    fontSize: width * 0.04,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: width * 0.035,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  legalItem: {
    paddingVertical: 8,
  },
  legalText: {
    fontSize: width * 0.04,
    color: theme.colors.primary,
  },
  copyrightSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  copyrightText: {
    fontSize: width * 0.03,
    color: theme.colors.textTertiary,
    textAlign: "center",
  },
});