class FetchService {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    // Ensure the API base URL includes /api
    if (!this.apiBaseUrl.endsWith('/api')) {
      this.apiBaseUrl += '/api';
    }
  }

  /**
   * Fetch available branches from backend
   * @returns {Promise<Array>} Array of available branches
   */
  async fetchBranches() {
    try {
      console.log(
        "Fetching branches from:",
        `${this.apiBaseUrl}/stalls/branches`
      );

      const response = await fetch(`${this.apiBaseUrl}/stalls/branches`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Branches API Response:", result);

      if (result.success) {
        console.log(`Successfully loaded ${result.data.length} branches`);
        return result.data;
      } else {
        throw new Error(result.message || "Failed to fetch branches");
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      throw error;
    }
  }

  /**
   * Fetch locations within a branch
   * @param {string} branch - The branch to fetch locations for
   * @returns {Promise<Array>} Array of locations in the branch
   */
  async fetchLocationsByBranch(branch) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/stalls/locations?branch=${encodeURIComponent(
          branch
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log(`Loaded ${result.data.length} locations for ${branch}`);
        return result.data;
      } else {
        throw new Error(result.message || "Failed to fetch locations");
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      throw error;
    }
  }

  /**
   * Fetch stalls by branch (initial load)
   * @param {string} branch - The branch to fetch stalls for
   * @returns {Promise<Array>} Array of stalls in the branch
   */
  async fetchStallsByBranch(branch) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/stalls/by-branch?branch=${encodeURIComponent(
          branch
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log(`Loaded ${result.data.length} stalls for ${branch}`);
        return result.data;
      } else {
        throw new Error(result.message || "Failed to fetch stalls");
      }
    } catch (error) {
      console.error("Error fetching stalls:", error);
      throw error;
    }
  }

  /**
   * Apply filters to fetch filtered stalls
   * @param {string} selectedBranch - The currently selected branch
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} Array of filtered stalls
   */
  async fetchFilteredStalls(selectedBranch, filters) {
    try {
      const params = new URLSearchParams();

      params.append("branch", selectedBranch);

      Object.keys(filters).forEach((key) => {
        const value = filters[key];
        if (value && value.toString().trim() !== "") {
          params.append(key, value);
        }
      });

      console.log("Applying filters:", params.toString());

      const response = await fetch(
        `${this.apiBaseUrl}/stalls/filter?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log(`Filtered results: ${result.data.length} stalls`);
        return result.data;
      } else {
        throw new Error(result.message || "Failed to filter stalls");
      }
    } catch (error) {
      console.error("Error applying filters:", error);
      throw error;
    }
  }
}

export default new FetchService();
