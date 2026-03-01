import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    elevation: 6,
    shadowColor: "#002181",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    overflow: 'hidden',
  },

  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: 'rgba(0, 33, 129, 0.03)',
  },

  tableTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tableTitleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8EEF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  tableTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: 0.3,
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  viewAllText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
    marginRight: 4,
  },

  recordsList: {
    flex: 1,
    paddingBottom: 8,
  },

  recordCard: {
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    backgroundColor: "#FAFBFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    // Card shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  recordIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  recordMainInfo: {
    flex: 1,
  },

  recordDescription: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
    letterSpacing: 0.2,
  },

  recordDateInline: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "400",
  },

  recordAmountContainer: {
    alignItems: 'flex-end',
  },

  recordAmountLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  recordAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.3,
  },

  recordDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  recordDate: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "400",
  },

  recordMeta: {
    flexDirection: "row",
    gap: 8,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    minWidth: 85,
    justifyContent: "center",
  },

  statusIcon: {
    marginRight: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },

  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    minWidth: 70,
    justifyContent: "center",
  },

  methodIcon: {
    marginRight: 4,
  },

  methodText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },

  recordFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  referenceIcon: {
    marginRight: 4,
  },

  referenceText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "normal",
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },

  loadingIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E8EEF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  loadingText: {
    marginTop: 8,
    fontSize: 15,
    color: "#6B7280",
    fontWeight: '500',
  },

  loadingSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: "#9CA3AF",
  },

  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 24,
  },

  errorIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  errorText: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },

  errorSubtext: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 16,
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: "#305CDE",
    borderRadius: 25,
    shadowColor: "#305CDE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 6,
  },

  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },

  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyText: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },

  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  // Records count indicator
  recordsCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  recordsCountText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
