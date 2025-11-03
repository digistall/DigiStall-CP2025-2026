import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  tableTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },

  viewAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  viewAllText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  recordsList: {
    flex: 1,
    paddingBottom: 8,
  },

  recordCard: {
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FAFBFC",
    marginHorizontal: 2,
    marginVertical: 1,
  },

  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },

  recordDescription: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },

  recordAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#059669",
  },

  recordDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  recordDate: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "400",
  },

  recordMeta: {
    flexDirection: "row",
    gap: 6,
  },

  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 50,
    alignItems: "center",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },

  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 60,
    alignItems: "center",
  },

  methodText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },

  recordFooter: {
    marginTop: 2,
  },

  referenceText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});
