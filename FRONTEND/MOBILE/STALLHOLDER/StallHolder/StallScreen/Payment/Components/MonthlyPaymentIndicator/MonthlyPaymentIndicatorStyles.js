import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },

  gradientContainer: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    // Shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  monthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  detailsContainer: {
    flex: 1,
  },

  statusMessage: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  amountLabel: {
    fontSize: 13,
    fontWeight: '500',
  },

  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    flexWrap: 'wrap',
  },

  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },

  footerDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    marginHorizontal: 10,
  },

  // View All Months Button
  viewAllMonthsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    gap: 8,
  },

  viewAllMonthsText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },

  refreshButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading state
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Error state
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
    flexWrap: 'wrap',
  },

  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#305CDE',
    borderRadius: 16,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
