import { StyleSheet } from "react-native";

export const AuctionCardStyles = StyleSheet.create({
  auctionCard: {
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  cardHeader: {
    position: "relative",
  },
  stallImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#F3F4F6",
  },
  heartIcon: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "#FFFFFF",
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  heartText: {
    fontSize: 16,
    color: "#EF4444",
  },
  auctionBadge: {
    position: "absolute",
    top: 15,
    left: 15,
    backgroundColor: "#1E9C00",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  auctionBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cardContent: {
    padding: 20,
  },
  stallInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  stallNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stallLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  stallNumber: {
    fontSize: 14,
    fontWeight: "bold",
  },
  locationContainer: {
    backgroundColor: "#002181",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "600",
  },
  startingPriceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12, // Consistent spacing
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  startingPriceLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  startingPriceText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  detailsContainer: {
    marginBottom: 15,
  },
  floorText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  sizeText: {
    fontSize: 14,
  },
  stallDescriptionContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  stallDescriptionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  auctionDateContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  auctionDateLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  auctionDateText: {
    fontSize: 13,
    fontWeight: "bold",
    lineHeight: 18,
    flexWrap: "wrap",
  },
  statusButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  preRegisterButton: {
    marginBottom: 10,
  },
  preRegisterButtonText: {},
  placeBidButton: {
    marginTop: 5,
    marginBottom: 5,
  },
  placeBidButtonDisabled: {
    opacity: 0.6,
  },
  placeBidButtonText: {
    textAlign: "center",
  },
  placeBidButtonTextDisabled: {
    fontWeight: "500",
  },
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 20,
    paddingVertical: 2,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
    fontStyle: "italic",
  },
  countdownTextDisabled: {
    opacity: 0.7,
  },
  disabledButton: {
    opacity: 0.7,
  },
});
