import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const PrivacyStyles = (theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.6)",
      padding: 20,
    },
    modalBox: {
      width: width * 0.92,
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      padding: 20,
      elevation: 8,
      maxHeight: "85%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.colors.text,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginTop: 14,
      marginBottom: 6,
      color: theme.colors.text,
    },
    text: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: 10,
    },
    closeButton: {
      marginTop: 16,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      borderRadius: 15,
      alignItems: "center",
    },
    closeButtonText: {
      color: theme.colors.surface,
      fontWeight: "600",
      fontSize: 15,
    },
  });
