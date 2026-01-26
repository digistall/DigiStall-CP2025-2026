import { StyleSheet } from "react-native";

export const LiveUpdatesStyles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 8,
  },

  liveText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  stallNumber: {
    fontSize: 12,
    fontWeight: "600",
  },

  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  leftControls: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  autoRefreshToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 12,
  },

  autoRefreshText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  countdownContainer: {
    flex: 1,
  },

  countdownText: {
    fontSize: 11,
    fontWeight: "500",
  },

  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  refreshIcon: {
    fontSize: 14,
    marginRight: 6,
  },

  refreshText: {
    fontSize: 12,
    fontWeight: "600",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  lastUpdatedText: {
    fontSize: 11,
    fontWeight: "500",
  },

  historyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  historyText: {
    fontSize: 11,
    fontWeight: "600",
  },

  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  connectionText: {
    fontSize: 10,
    fontWeight: "500",
  },
});
