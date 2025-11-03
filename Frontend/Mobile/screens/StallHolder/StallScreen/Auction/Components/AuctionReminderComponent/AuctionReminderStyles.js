import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const AuctionReminderStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
  },
  modalBox: {
    width: width * 0.92,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 8,
    maxHeight: "85%",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#1F2937",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 14,
    color: "#4B5563",
    textAlign: "center",
    fontStyle: "italic",
  },
  reminderList: {
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    marginBottom: 10,
    color: "#374151",
    lineHeight: 22,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 7,
  },
  checkboxText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#93C5FD",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
