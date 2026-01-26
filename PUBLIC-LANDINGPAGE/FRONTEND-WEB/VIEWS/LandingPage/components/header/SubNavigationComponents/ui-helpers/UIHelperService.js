/**
 * UIHelperService - Handles UI-related functionality for the SubNavigation component
 * Contains methods for overflow detection, area handling, and UI state management
 */

class UIHelperService {
  /**
   * Check if content overflows and adjust layout accordingly
   * @param {HTMLElement} scrollableContainer - The container element to check for overflow
   * @returns {boolean} True if content overflows the container
   */
  checkOverflow(scrollableContainer) {
    if (!scrollableContainer) {
      return false;
    }

    const hasOverflow =
      scrollableContainer.scrollWidth > scrollableContainer.clientWidth;
    console.log(
      `Overflow check: ${hasOverflow ? "Content overflows" : "Content fits"}`
    );
    return hasOverflow;
  }

  /**
   * Handle area selection logic
   * @param {string} selectedArea - Currently selected area
   * @param {string} clickedArea - The area that was clicked
   * @param {boolean} showStallsContainer - Current state of stalls container visibility
   * @returns {Object} New state for area selection
   */
  handleAreaSelection(selectedArea, clickedArea, showStallsContainer) {
    if (selectedArea === clickedArea && showStallsContainer) {
      console.log(`Closing stalls container for area: ${clickedArea}`);
      return {
        selectedArea: null,
        showStallsContainer: false,
        shouldReset: true,
      };
    } else {
      console.log(`Opening stalls container for area: ${clickedArea}`);
      return {
        selectedArea: clickedArea,
        showStallsContainer: true,
        shouldReset: true,
      };
    }
  }

  /**
   * Handle branch selection logic
   * @param {string} selectedBranch - Currently selected branch
   * @param {string} clickedBranch - The branch that was clicked
   * @param {boolean} showStallsContainer - Current state of stalls container visibility
   * @returns {Object} New state for branch selection
   */
  handleBranchSelection(selectedBranch, clickedBranch, showStallsContainer) {
    if (selectedBranch === clickedBranch && showStallsContainer) {
      console.log(`Closing stalls container for branch: ${clickedBranch}`);
      return {
        selectedBranch: null,
        showStallsContainer: false,
        shouldReset: true,
      };
    } else {
      console.log(`Opening stalls container for branch: ${clickedBranch}`);
      return {
        selectedBranch: clickedBranch,
        showStallsContainer: true,
        shouldReset: true,
      };
    }
  }

  /**
   * Setup resize listener for overflow detection
   * @param {Function} checkOverflowCallback - Callback function to call on resize
   * @returns {Function} Cleanup function to remove the resize listener
   */
  setupResizeListener(checkOverflowCallback) {
    console.log("Setting up resize listener for overflow detection");

    const handleResize = () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        checkOverflowCallback();
      }, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      console.log("Cleaning up resize listener");
      clearTimeout(this.resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }

  /**
   * Get CSS classes for scrollable container
   * @param {boolean} hasOverflow - Whether the container has overflow
   * @returns {Object} CSS class object for Vue.js
   */
  getScrollableContainerClasses(hasOverflow) {
    return {
      "overflow-scrolling": hasOverflow,
    };
  }

  /**
   * Get CSS classes for sub navigation items
   * @param {string} selectedArea - Currently selected area
   * @param {string} itemArea - Area of the current item
   * @returns {Object} CSS class object for Vue.js
   */
  getSubNavItemClasses(selectedArea, itemArea) {
    return {
      active: selectedArea === itemArea,
    };
  }

  /**
   * Scroll to element if it's not visible
   * @param {HTMLElement} element - Element to scroll to
   * @param {HTMLElement} container - Container element
   */
  scrollToElement(element, container) {
    if (!element || !container) {
      return;
    }

    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const isVisible =
      elementRect.left >= containerRect.left &&
      elementRect.right <= containerRect.right;

    if (!isVisible) {
      const scrollLeft =
        element.offsetLeft -
        container.clientWidth / 2 +
        element.clientWidth / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });

      console.log(`Scrolled to element at position: ${scrollLeft}`);
    }
  }

  /**
   * Get transition configuration for stalls container
   * @returns {Object} Transition configuration
   */
  getTransitionConfig() {
    return {
      name: "fade",
      mode: "out-in",
    };
  }

  /**
   * Generate a unique key for forcing component re-renders
   * @param {number} currentKey - Current key value
   * @returns {number} New key value
   */
  generateNewKey(currentKey = 0) {
    return currentKey + 1;
  }
}

export default new UIHelperService();
