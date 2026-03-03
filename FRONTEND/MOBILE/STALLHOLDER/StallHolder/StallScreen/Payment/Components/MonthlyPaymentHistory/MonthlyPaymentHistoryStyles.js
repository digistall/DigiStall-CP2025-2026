import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },

  closeButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },

  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },

  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 8,
  },

  // Month Card
  monthCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  monthTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  currentMonthBadge: {
    backgroundColor: '#305CDE',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },

  currentMonthBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  monthStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },

  monthStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Month Summary
  monthSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(48, 92, 222, 0.03)',
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  summaryDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 12,
  },

  // Payment Item
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderTopWidth: 1,
  },

  paymentInfo: {
    flex: 1,
    marginRight: 12,
  },

  paymentDescription: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  paymentDate: {
    fontSize: 12,
  },

  paymentAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
  },

  paymentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },

  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },

  errorText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },

  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#305CDE',
    borderRadius: 20,
    marginTop: 8,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },

  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 8,
  },

  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 40,
  },
});
