import { StyleSheet } from "react-native";

export const QuickBidStyles = StyleSheet.create({
  // Quick Bid Styles
  quickBidSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  quickBidTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  outbidButton: {
    backgroundColor: "#1E9C00",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outbidButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  outbidButtonSubtext: {
    fontSize: 14,
    color: "#D1FAE5",
  },
  quickIncrementContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  quickIncrementButton: {
    flex: 1,
    backgroundColor: "#305CDE",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickIncrementText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  setMinimumButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  setMinimumButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },

  // Disabled States
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
  disabledButtonSubtext: {
    opacity: 0.6,
  },
});
