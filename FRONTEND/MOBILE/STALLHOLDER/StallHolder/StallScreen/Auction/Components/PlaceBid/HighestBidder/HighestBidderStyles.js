import { StyleSheet } from "react-native";

export const HighestBidderStyles = StyleSheet.create({
  currentBidCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Header Section
  currentBidHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    width: "100%",
  },

  currentBidLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },

  liveBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  liveBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Bid Amount
  currentBidAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#F59E0B",
    marginBottom: 12,
  },

  // Bidder Information Section
  bidderInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
    width: "100%",
  },

  bidderAvatar: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  bidderAvatarText: {
    fontSize: 18,
  },

  bidderDetails: {
    flex: 1,
  },

  bidderNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  bidderName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },

  bidderLocation: {
    fontSize: 12,
    color: "#6B7280",
  },

  bidderMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bidderTime: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
  },

  bidderStats: {
    fontSize: 12,
    color: "#6B7280",
  },

  // Bottom Note
  currentBidNote: {
    fontSize: 12,
    color: "#92400E",
    textAlign: "center",
    lineHeight: 16,
  },

  // Variant Styles
  compactCard: {
    padding: 16,
    marginBottom: 16,
  },

  largeCard: {
    padding: 24,
    marginBottom: 24,
  },

  // Alternative Color Schemes
  greenTheme: {
    backgroundColor: "#ECFDF5",
    borderLeftColor: "#10B981",
  },

  greenThemeLabel: {
    color: "#065F46",
  },

  greenThemeAmount: {
    color: "#10B981",
  },

  greenThemeNote: {
    color: "#065F46",
  },

  blueTheme: {
    backgroundColor: "#EFF6FF",
    borderLeftColor: "#3B82F6",
  },

  blueThemeLabel: {
    color: "#1E3A8A",
  },

  blueThemeAmount: {
    color: "#3B82F6",
  },

  blueThemeNote: {
    color: "#1E3A8A",
  },
});
