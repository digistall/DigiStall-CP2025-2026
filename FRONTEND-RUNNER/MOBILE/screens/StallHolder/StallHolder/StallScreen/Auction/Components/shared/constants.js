// Common constants used across the auction module
export const AuctionColors = {
  // Primary colors
  PRIMARY_GREEN: "#1E9C00",
  PRIMARY_BLUE: "#305CDE",

  // Status colors
  SUCCESS_GREEN: "#10B981",
  WARNING_YELLOW: "#F59E0B",
  ERROR_RED: "#EF4444",

  // Background colors
  SUCCESS_BG: "#E8F5E8",
  SUCCESS_BG_LIGHT: "#D1FAE5",
  WARNING_BG: "#FEF3C7",
  INFO_BG: "#F0F9FF",
  SURFACE_BG: "#F9FAFB",
  CARD_BG: "#FFFFFF",

  // Text colors
  TEXT_PRIMARY: "#1F2937",
  TEXT_SECONDARY: "#6B7280",
  TEXT_TERTIARY: "#9CA3AF",
  TEXT_WHITE: "#FFFFFF",

  // Overlay
  OVERLAY: "rgba(0, 0, 0, 0.5)",

  // Border colors
  BORDER_LIGHT: "#E5E7EB",
  BORDER_GRAY: "#D1D5DB",
};

export const AuctionDimensions = {
  // Common spacing
  PADDING_SM: 8,
  PADDING_MD: 12,
  PADDING_LG: 16,
  PADDING_XL: 20,
  PADDING_XXL: 24,

  // Border radius
  RADIUS_SM: 8,
  RADIUS_MD: 12,
  RADIUS_LG: 16,
  RADIUS_XL: 20,

  // Icon sizes
  ICON_SM: 16,
  ICON_MD: 24,
  ICON_LG: 32,
  ICON_XL: 48,

  // Modal dimensions
  MODAL_CHECKMARK_SIZE: 80,
};

export const AuctionFontSizes = {
  // Font sizes
  XS: 12,
  SM: 13,
  MD: 14,
  LG: 16,
  XL: 18,
  XXL: 20,
  XXXL: 24,
  HUGE: 32,
  MASSIVE: 50,
};

export const AuctionTimings = {
  // Auto-refresh intervals
  AUTO_REFRESH_INTERVAL: 5000, // 5 seconds
  COUNTDOWN_UPDATE_INTERVAL: 30000, // 30 seconds
  SUCCESS_MODAL_TIMEOUT: 2000, // 2 seconds

  // Countdown thresholds
  URGENT_THRESHOLD: 300, // 5 minutes
  WARNING_THRESHOLD: 600, // 10 minutes
};
