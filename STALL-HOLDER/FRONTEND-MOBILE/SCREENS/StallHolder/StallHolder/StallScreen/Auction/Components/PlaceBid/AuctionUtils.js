// Helper function to convert month name to number
export const getMonthNumber = (monthName) => {
  const months = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };
  return months[monthName] || 0;
};

// Helper function to parse time string
export const parseTime = (timeString) => {
  if (!timeString) return { hour: 0, minute: 0 };

  const [time, period] = timeString.split(" ");
  const [hours, minutes] = time.split(":");
  let hour24 = parseInt(hours);

  if (period === "PM" && hour24 !== 12) {
    hour24 += 12;
  } else if (period === "AM" && hour24 === 12) {
    hour24 = 0;
  }

  return { hour: hour24, minute: parseInt(minutes) || 0 };
};

// Centralized function to parse auction date and time
export const parseAuctionDateTime = (auctionDate, startTime) => {
  if (!auctionDate) return null;

  let auctionDateTime;

  try {
    // Try standard date parsing first
    auctionDateTime = new Date(auctionDate);

    // If parsing fails, try manual parsing for "Month Day, Year" format
    if (isNaN(auctionDateTime.getTime())) {
      const dateParts = auctionDate.trim().split(" ");
      if (dateParts.length === 3) {
        const month = dateParts[0];
        const day = parseInt(dateParts[1].replace(",", ""));
        const year = parseInt(dateParts[2]);

        if (!isNaN(day) && !isNaN(year)) {
          auctionDateTime = new Date(year, getMonthNumber(month), day);
        }
      }
    }

    // If still invalid, return null
    if (isNaN(auctionDateTime.getTime())) {
      return null;
    }

    // Parse and set the start time
    if (startTime) {
      const { hour, minute } = parseTime(startTime);
      auctionDateTime.setHours(hour, minute, 0, 0);
    } else {
      // Default to start of day if no time specified
      auctionDateTime.setHours(0, 0, 0, 0);
    }

    return auctionDateTime;
  } catch (error) {
    console.error("Date parsing error:", error);
    return null;
  }
};

// Check if auction is currently active
export const isAuctionActive = (auctionDate, startTime = null) => {
  const auctionDateTime = parseAuctionDateTime(auctionDate, startTime);
  if (!auctionDateTime) return false;

  const now = new Date();
  return now >= auctionDateTime;
};

// Check if auction has started, current time is after start time
export const hasAuctionStarted = (auctionDate, startTime) => {
  if (!startTime) return false;
  return isAuctionActive(auctionDate, startTime);
};

// Calculate time until auction starts (in seconds)
export const getTimeUntilAuctionStart = (auctionDate, startTime) => {
  const auctionDateTime = parseAuctionDateTime(auctionDate, startTime);
  if (!auctionDateTime) return 0;

  const now = new Date();
  const timeDiff = Math.max(0, Math.ceil((auctionDateTime - now) / 1000));
  return timeDiff;
};

// Calculate minimum bid amount
export const getMinimumBid = (currentBid, startingPrice, minimumIncrement) => {
  return currentBid ? currentBid + minimumIncrement : startingPrice;
};

// Validate bid amount
export const validateBid = (
  amount,
  currentBid,
  startingPrice,
  minimumIncrement
) => {
  const numAmount = parseFloat(amount);
  const minBid = getMinimumBid(currentBid, startingPrice, minimumIncrement);

  // Check if amount is provided and is a valid number
  if (!amount || amount.trim() === "") {
    return "Please enter a bid amount";
  }

  if (isNaN(numAmount) || numAmount <= 0) {
    return "Please enter a valid positive number";
  }

  // Check decimal places (max 2)
  if (amount.includes(".") && amount.split(".")[1].length > 2) {
    return "Bid amount can have maximum 2 decimal places";
  }

  // Check minimum bid requirement
  if (numAmount < minBid) {
    return `Bid must be at least ₱${minBid.toLocaleString()}`;
  }

  // Check if bid is too high (reasonable maximum)
  const maxBid = startingPrice * 10; // 10x starting price as max
  if (numAmount > maxBid) {
    return `Bid cannot exceed ₱${maxBid.toLocaleString()}`;
  }

  // Check if increment is too small (must be at least minimum increment)
  if (currentBid && numAmount - currentBid < minimumIncrement) {
    return `Bid increment must be at least ₱${minimumIncrement.toLocaleString()}`;
  }

  return "";
};

// Calculate countdown to auction start
export const calculateAuctionCountdown = (auctionDate, startTime) => {
  const auctionDateTime = parseAuctionDateTime(auctionDate, startTime);
  if (!auctionDateTime) return "";

  const now = new Date();

  // If auction has started, return empty string
  if (now >= auctionDateTime) {
    return "";
  }

  const diff = auctionDateTime.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return "Starting soon...";
  }
};
