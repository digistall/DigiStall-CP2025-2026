/**
 * FilterService - Handles filter management for the SubNavigation component
 * Contains methods for managing filters, search functionality, and filter resets
 */

class FilterService {
  /**
   * Get initial filter state
   * @returns {Object} Initial filter configuration
   */
  getInitialFilters() {
    return {
      location: "",
      section: "",
      minPrice: "",
      maxPrice: "",
      search: "",
    };
  }

  /**
   * Handle filter changes from StallFilter component
   * @param {Object} currentFilters - Current filter state
   * @param {Object} newFilters - New filters to apply
   * @returns {Object} Updated filter state
   */
  handleFilterChanged(currentFilters, newFilters) {
    const updatedFilters = { ...currentFilters, ...newFilters };
    console.log("Filter changed:", updatedFilters);
    return updatedFilters;
  }

  /**
   * Handle search changes
   * @param {Object} currentFilters - Current filter state
   * @param {string} searchTerm - New search term
   * @returns {Object} Updated filter state with search term
   */
  handleSearchChanged(currentFilters, searchTerm) {
    const updatedFilters = { ...currentFilters, search: searchTerm };
    console.log("Search changed:", searchTerm);
    return updatedFilters;
  }

  /**
   * Reset all filters to initial state
   * @returns {Object} Reset filter configuration
   */
  resetFilters() {
    console.log("Resetting all filters");
    return this.getInitialFilters();
  }

  /**
   * Validate filter values
   * @param {Object} filters - Filters to validate
   * @returns {Object} Validated and cleaned filter object
   */
  validateFilters(filters) {
    const validatedFilters = {};

    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value && value.toString().trim() !== "") {
        validatedFilters[key] = value.toString().trim();
      }
    });

    return validatedFilters;
  }

  /**
   * Check if any filters are active
   * @param {Object} filters - Current filter state
   * @returns {boolean} True if any filters are applied
   */
  hasActiveFilters(filters) {
    return Object.values(filters).some(value => 
      value && value.toString().trim() !== ""
    );
  }

  /**
   * Get filter summary for logging/debugging
   * @param {Object} filters - Current filter state
   * @returns {string} Human-readable filter summary
   */
  getFilterSummary(filters) {
    const activeFilters = this.validateFilters(filters);
    const filterCount = Object.keys(activeFilters).length;
    
    if (filterCount === 0) {
      return "No filters applied";
    }

    const filterStrings = Object.entries(activeFilters).map(([key, value]) => 
      `${key}: ${value}`
    );

    return `Active filters (${filterCount}): ${filterStrings.join(", ")}`;
  }

  /**
   * Create URL search parameters from filters
   * @param {string} selectedArea - Currently selected area
   * @param {Object} filters - Current filter state
   * @returns {URLSearchParams} URL search parameters object
   */
  createSearchParams(selectedArea, filters) {
    const params = new URLSearchParams();
    
    if (selectedArea) {
      params.append("area", selectedArea);
    }

    const validatedFilters = this.validateFilters(filters);
    Object.entries(validatedFilters).forEach(([key, value]) => {
      params.append(key, value);
    });

    return params;
  }
}

export default new FilterService();