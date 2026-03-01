import { StyleSheet, Dimensions, Platform } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const styles = StyleSheet.create({
  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },

  // Modal Container
  modalContainer: {
    width: screenWidth,
    height: screenHeight * 0.92,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },

  // Modal Header with Gradient
  modalHeader: {
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  modalSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },

  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  // Records List
  recordsList: {
    flex: 1,
  },

  recordsListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Record Card - Enhanced
  recordCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#6366F1",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },

  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 14,
  },

  recordIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  recordMainInfo: {
    flex: 1,
  },

  recordDescription: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
    letterSpacing: 0.2,
  },

  recordDate: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: '400',
  },

  recordAmountContainer: {
    alignItems: 'flex-end',
  },

  recordAmountLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.5,
  },

  recordAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.3,
  },

  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: '#FAFBFC',
  },

  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  referenceText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: '500',
    marginLeft: 6,
    letterSpacing: 0.3,
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
    gap: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: 'capitalize',
  },

  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },

  methodText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: 'capitalize',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Modal Footer
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: '#FFFFFF',
  },

  closeFooterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  closeFooterButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
