/**
 * ErrorHandlingService - Handles error management for the SubNavigation component
 * Contains methods for handling network errors and providing user-friendly error messages
 */

class ErrorHandlingService {
  /**
   * Handle network errors and provide user-friendly messages
   * @param {Error} error - The error object to handle
   * @returns {string} User-friendly error message
   */
  handleNetworkError(error) {
    console.error("Handling network error:", error);

    if (this.isNetworkError(error)) {
      return "Network connection failed. Please check your internet connection.";
    }

    if (this.isServerError(error)) {
      return "Server error. Please try again later.";
    }

    if (this.isNotFoundError(error)) {
      return "API endpoint not found. Please check if the backend server is running.";
    }

    if (this.isTimeoutError(error)) {
      return "Request timed out. Please check your connection and try again.";
    }

    if (this.isAuthError(error)) {
      return "Authentication failed. Please check your credentials.";
    }

    return error.message || "An unexpected error occurred";
  }

  /**
   * Check if error is a network-related error
   * @param {Error} error - Error to check
   * @returns {boolean} True if it's a network error
   */
  isNetworkError(error) {
    return (
      error.message.includes("fetch") ||
      error.message.includes("Network") ||
      error.message.includes("network") ||
      error.name === "NetworkError" ||
      !navigator.onLine
    );
  }

  /**
   * Check if error is a server error (5xx)
   * @param {Error} error - Error to check
   * @returns {boolean} True if it's a server error
   */
  isServerError(error) {
    return (
      error.message.includes("500") ||
      error.message.includes("502") ||
      error.message.includes("503") ||
      error.message.includes("504") ||
      error.message.includes("Internal Server Error")
    );
  }

  /**
   * Check if error is a not found error (404)
   * @param {Error} error - Error to check
   * @returns {boolean} True if it's a not found error
   */
  isNotFoundError(error) {
    return (
      error.message.includes("404") ||
      error.message.includes("Not Found")
    );
  }

  /**
   * Check if error is a timeout error
   * @param {Error} error - Error to check
   * @returns {boolean} True if it's a timeout error
   */
  isTimeoutError(error) {
    return (
      error.message.includes("timeout") ||
      error.message.includes("Timeout") ||
      error.name === "TimeoutError"
    );
  }

  /**
   * Check if error is an authentication error (401, 403)
   * @param {Error} error - Error to check
   * @returns {boolean} True if it's an authentication error
   */
  isAuthError(error) {
    return (
      error.message.includes("401") ||
      error.message.includes("403") ||
      error.message.includes("Unauthorized") ||
      error.message.includes("Forbidden")
    );
  }

  /**
   * Create a detailed error object for logging
   * @param {Error} error - Original error
   * @param {string} context - Context where error occurred
   * @param {Object} additionalData - Additional data for debugging
   * @returns {Object} Detailed error object
   */
  createDetailedError(error, context, additionalData = {}) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      online: navigator.onLine,
      ...additionalData
    };
  }

  /**
   * Log error with context
   * @param {Error} error - Error to log
   * @param {string} context - Context where error occurred
   * @param {Object} additionalData - Additional data for debugging
   */
  logError(error, context, additionalData = {}) {
    const detailedError = this.createDetailedError(error, context, additionalData);
    console.error(`Error in ${context}:`, detailedError);

  }

  /**
   * Get retry suggestions based on error type
   * @param {Error} error - Error to analyze
   * @returns {Array<string>} Array of retry suggestions
   */
  getRetrySuggestions(error) {
    if (this.isNetworkError(error)) {
      return [
        "Check your internet connection",
        "Try refreshing the page",
        "Wait a moment and try again"
      ];
    }

    if (this.isServerError(error)) {
      return [
        "Wait a few minutes and try again",
        "Contact support if the problem persists",
        "Check the service status page"
      ];
    }

    if (this.isNotFoundError(error)) {
      return [
        "Check if the backend server is running",
        "Verify the API endpoint configuration",
        "Contact the development team"
      ];
    }

    return [
      "Try refreshing the page",
      "Wait a moment and try again",
      "Contact support if the problem continues"
    ];
  }

  /**
   * Determine if an error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} True if the error is retryable
   */
  isRetryableError(error) {
    return this.isNetworkError(error) || this.isServerError(error) || this.isTimeoutError(error);
  }
}

export default new ErrorHandlingService();