import { StyleSheet, Dimensions } from "react-native";
import {
  AuctionColors,
  AuctionDimensions,
  AuctionFontSizes,
} from "./constants";

const { width } = Dimensions.get("window");

// Shared modal styles to reduce duplication
export const SharedModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: AuctionColors.OVERLAY,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: AuctionColors.CARD_BG,
    borderRadius: AuctionDimensions.RADIUS_XL,
    padding: AuctionDimensions.PADDING_XXL + 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: AuctionDimensions.PADDING_XL,
  },
  checkmark: {
    fontSize: AuctionFontSizes.MASSIVE,
    width: AuctionDimensions.MODAL_CHECKMARK_SIZE,
    height: AuctionDimensions.MODAL_CHECKMARK_SIZE,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: AuctionDimensions.MODAL_CHECKMARK_SIZE / 2,
    overflow: "hidden",
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: AuctionFontSizes.XXL,
    fontWeight: "bold",
    color: AuctionColors.TEXT_PRIMARY,
    textAlign: "center",
    marginBottom: AuctionDimensions.PADDING_MD,
  },
  successMessage: {
    fontSize: AuctionFontSizes.LG,
    color: AuctionColors.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 24,
  },
});

// Success modal specific styles
export const SuccessModalStyles = StyleSheet.create({
  ...SharedModalStyles,
  modalContainer: {
    ...SharedModalStyles.modalContainer,
    width: width * 0.8,
    maxWidth: 300,
    alignItems: "center",
  },
  checkmark: {
    ...SharedModalStyles.checkmark,
    color: AuctionColors.SUCCESS_GREEN,
    backgroundColor: AuctionColors.SUCCESS_BG_LIGHT,
  },
});

// PreRegister modal specific styles
export const PreRegisterModalStyles = StyleSheet.create({
  ...SharedModalStyles,
  modalContainer: {
    ...SharedModalStyles.modalContainer,
    width: width * 0.9,
    maxWidth: 400,
  },
  checkmark: {
    ...SharedModalStyles.checkmark,
    color: AuctionColors.PRIMARY_GREEN,
    backgroundColor: AuctionColors.SUCCESS_BG,
  },
  detailsContainer: {
    backgroundColor: AuctionColors.SURFACE_BG,
    borderRadius: AuctionDimensions.RADIUS_MD,
    padding: AuctionDimensions.PADDING_LG - 1,
    marginVertical: AuctionDimensions.PADDING_LG - 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: AuctionDimensions.PADDING_SM,
  },
  detailLabel: {
    fontSize: AuctionFontSizes.MD,
    color: AuctionColors.TEXT_SECONDARY,
    flex: 1,
  },
  detailValue: {
    fontSize: AuctionFontSizes.MD,
    color: AuctionColors.TEXT_PRIMARY,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  infoSection: {
    backgroundColor: AuctionColors.INFO_BG,
    borderRadius: AuctionDimensions.RADIUS_MD,
    padding: AuctionDimensions.PADDING_LG - 1,
    marginBottom: AuctionDimensions.PADDING_XL,
  },
  infoTitle: {
    fontSize: AuctionFontSizes.LG,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: AuctionDimensions.PADDING_SM,
  },
  infoText: {
    fontSize: AuctionFontSizes.SM,
    color: "#374151",
    lineHeight: 18,
  },
  closeButton: {
    backgroundColor: AuctionColors.PRIMARY_GREEN,
    borderRadius: AuctionDimensions.RADIUS_MD,
    paddingVertical: AuctionDimensions.PADDING_MD,
    paddingHorizontal: 30,
    alignItems: "center",
  },
  closeButtonText: {
    color: AuctionColors.TEXT_WHITE,
    fontSize: AuctionFontSizes.LG,
    fontWeight: "600",
  },
});
