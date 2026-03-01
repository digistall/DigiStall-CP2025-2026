export const NOTIFICATION_TYPES = {
  AUCTION: "auction",
  RAFFLE: "raffle",
  PAYMENT: "payment",
  SYSTEM: "system",
  ANNOUNCEMENT: "announcement",
};

export const PRIORITY_LEVELS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const ACTION_TYPES = {
  BID_REQUIRED: "bid_required",
  UPCOMING_AUCTION: "upcoming_auction",
  AUCTION_WON: "auction_won",
  ENTRY_CONFIRMED: "entry_confirmed",
  RAFFLE_RESULT: "raffle_result",
  LIMITED_RAFFLE: "limited_raffle",
  PAYMENT_DUE: "payment_due",
  PAYMENT_CONFIRMED: "payment_confirmed",
  NEW_AUCTION: "new_auction",
  MAINTENANCE_NOTICE: "maintenance_notice",
};

// Generate sample notifications based on auction and raffle data

export const generateSampleNotifications = () => {
  return [
    {
      id: "1",
      type: NOTIFICATION_TYPES.AUCTION,
      title: "Outbid Alert - Stall #50",
      message:
        "You've been outbid on Stall #50 (Satellite Market). Current highest bid: ₱2,350. Auction ends in 2 hours.",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      isRead: false,
      priority: PRIORITY_LEVELS.HIGH,
      actionType: ACTION_TYPES.BID_REQUIRED,
      stallId: "50",
    },
    {
      id: "2",
      type: NOTIFICATION_TYPES.AUCTION,
      title: "Auction Reminder - Stall #32",
      message:
        "Stall #32 auction starts in 30 minutes. Starting bid: ₱2,500. Don't miss out!",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isRead: false,
      priority: PRIORITY_LEVELS.MEDIUM,
      actionType: ACTION_TYPES.UPCOMING_AUCTION,
      stallId: "32",
    },
    {
      id: "3",
      type: NOTIFICATION_TYPES.RAFFLE,
      title: "Raffle Entry Confirmed - Stall #30",
      message:
        "Your entry for Stall #30 raffle has been confirmed. Draw date: September 20, 2025. Good luck!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false,
      priority: PRIORITY_LEVELS.LOW,
      actionType: ACTION_TYPES.ENTRY_CONFIRMED,
      stallId: "30",
    },
    {
      id: "4",
      type: NOTIFICATION_TYPES.PAYMENT,
      title: "Payment Due Reminder",
      message:
        "Your monthly stall rental payment of ₱3,500 is due in 3 days (September 20, 2025).",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      isRead: false,
      priority: PRIORITY_LEVELS.HIGH,
      actionType: ACTION_TYPES.PAYMENT_DUE,
      amount: "3,500",
      dueDate: "2025-09-20",
    },
    {
      id: "5",
      type: NOTIFICATION_TYPES.AUCTION,
      title: "Winning Bid Confirmed - Stall #15",
      message:
        "Congratulations! You won the auction for Stall #15 with a bid of ₱3,200. Payment instructions will be sent shortly.",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isRead: true,
      priority: PRIORITY_LEVELS.HIGH,
      actionType: ACTION_TYPES.AUCTION_WON,
      stallId: "15",
      winningBid: "3,200",
    },
    {
      id: "6",
      type: NOTIFICATION_TYPES.RAFFLE,
      title: "Raffle Results - Stall #25",
      message:
        "Unfortunately, you didn't win the raffle for Stall #25. But don't worry, more opportunities are coming!",
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      isRead: true,
      priority: PRIORITY_LEVELS.LOW,
      actionType: ACTION_TYPES.RAFFLE_RESULT,
      stallId: "25",
      result: "lost",
    },
    {
      id: "7",
      type: NOTIFICATION_TYPES.PAYMENT,
      title: "Payment Confirmed",
      message:
        "Your payment of ₱3,500 for Stall #12 rental has been successfully processed via GCash.",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      isRead: true,
      priority: PRIORITY_LEVELS.MEDIUM,
      actionType: ACTION_TYPES.PAYMENT_CONFIRMED,
      amount: "3,500",
      method: "GCash",
      stallId: "12",
    },
    {
      id: "8",
      type: NOTIFICATION_TYPES.SYSTEM,
      title: "New Auction Available",
      message:
        "3 new stalls are now available for auction in the Satellite Market. Check them out now!",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isRead: false,
      priority: PRIORITY_LEVELS.MEDIUM,
      actionType: ACTION_TYPES.NEW_AUCTION,
      stallCount: 3,
    },
    {
      id: "9",
      type: NOTIFICATION_TYPES.ANNOUNCEMENT,
      title: "Market Maintenance Schedule",
      message:
        "The Satellite Market will undergo maintenance on September 25, 2025. All stall operations will be suspended for the day.",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isRead: true,
      priority: PRIORITY_LEVELS.HIGH,
      actionType: ACTION_TYPES.MAINTENANCE_NOTICE,
      maintenanceDate: "2025-09-25",
    },
    {
      id: "10",
      type: NOTIFICATION_TYPES.RAFFLE,
      title: "Limited Time Raffle",
      message:
        "Special raffle for premium stalls opens tomorrow! Only 24 hours to enter. Entry fee: ₱500.",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isRead: false,
      priority: PRIORITY_LEVELS.MEDIUM,
      actionType: ACTION_TYPES.LIMITED_RAFFLE,
      entryFee: "500",
      duration: "24 hours",
    },
  ];
};

/**
 * Create a new notification
 */
export const createNotification = (type, title, message, options = {}) => {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    type,
    title,
    message,
    timestamp: new Date(),
    isRead: false,
    priority: PRIORITY_LEVELS.MEDIUM,
    ...options,
  };
};

/**
 * Format time for notification display
 */
export const formatNotificationTime = (timestamp) => {
  const now = new Date();
  const notifTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now - notifTime) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

/**
 * Get notification statistics
 */
export const getNotificationStats = (notifications) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const highPriorityCount = notifications.filter(
    (n) => n.priority === PRIORITY_LEVELS.HIGH && !n.isRead
  ).length;

  const typeBreakdown = notifications.reduce((acc, notification) => {
    acc[notification.type] = (acc[notification.type] || 0) + 1;
    return acc;
  }, {});

  return {
    total: notifications.length,
    unread: unreadCount,
    highPriority: highPriorityCount,
    typeBreakdown,
  };
};
