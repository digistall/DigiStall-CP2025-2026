import { StyleSheet } from "react-native";

export const CountdownTimerStyles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  statusText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginRight: 8,
  },

  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  alertBadgeText: {
    fontSize: 12,
  },

  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  timeUnit: {
    alignItems: "center",
    minWidth: 50,
  },

  timeNumber: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 36,
    fontFamily: "monospace",
  },

  timeLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },

  separator: {
    fontSize: 28,
    fontWeight: "800",
    marginHorizontal: 8,
    lineHeight: 36,
    fontFamily: "monospace",
  },

  endTimeText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    fontStyle: "italic",
  },
});
