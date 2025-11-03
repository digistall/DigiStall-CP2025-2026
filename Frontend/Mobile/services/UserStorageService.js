import AsyncStorage from '@react-native-async-storage/async-storage';

class UserStorageService {
  // Storage keys
  static USER_DATA_KEY = 'user_data';
  static AUTH_TOKEN_KEY = 'auth_token';
  static USER_APPLICATIONS_KEY = 'user_applications';

  // Save user data after login (updated for new backend structure)
  static async saveUserData(userData) {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  }

  // Get stored user data
  static async getUserData() {
    try {
      const userData = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Update user applications (updated for new backend structure)
  static async updateUserApplications(applications) {
    try {
      await AsyncStorage.setItem(this.USER_APPLICATIONS_KEY, JSON.stringify(applications));
      return true;
    } catch (error) {
      console.error('Error updating user applications:', error);
      return false;
    }
  }

  // Get user applications
  static async getUserApplications() {
    try {
      const applications = await AsyncStorage.getItem(this.USER_APPLICATIONS_KEY);
      return applications ? JSON.parse(applications) : [];
    } catch (error) {
      console.error('Error getting user applications:', error);
      return [];
    }
  }

  // Check if user has applied to a specific stall (updated for new backend structure)
  static async hasAppliedToStall(stallId) {
    try {
      const applications = await this.getUserApplications();
      return applications.some(app => app.stall_id === stallId);
    } catch (error) {
      console.error('Error checking stall application:', error);
      return false;
    }
  }

  // Get application count for a specific branch (updated for new backend structure)
  static async getApplicationCountForBranch(branchId) {
    try {
      const userData = await this.getUserData();
      if (userData && userData.applications && userData.applications.applications_count_by_branch) {
        return userData.applications.applications_count_by_branch[branchId] || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting branch application count:', error);
      return 0;
    }
  }

  // Add new application (updated for new backend structure)
  static async addApplication(application) {
    try {
      const applications = await this.getUserApplications();
      applications.push(application);
      await this.updateUserApplications(applications);
      
      // Also update the userData structure
      const userData = await this.getUserData();
      if (userData && userData.applications) {
        userData.applications.my_applications = applications;
        userData.applications.total_applications = applications.length;
        
        // Update branch count
        const branchId = application.branch_id;
        if (!userData.applications.applications_count_by_branch) {
          userData.applications.applications_count_by_branch = {};
        }
        userData.applications.applications_count_by_branch[branchId] = 
          (userData.applications.applications_count_by_branch[branchId] || 0) + 1;
        
        await this.saveUserData(userData);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding application:', error);
      return false;
    }
  }

  // Clear all user data (logout)
  static async clearUserData() {
    try {
      await AsyncStorage.multiRemove([
        this.USER_DATA_KEY,
        this.AUTH_TOKEN_KEY,
        this.USER_APPLICATIONS_KEY
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  }

  // Check if user is logged in (updated for new backend structure)
  static async isLoggedIn() {
    try {
      const userData = await this.getUserData();
      return userData && userData.user && userData.user.applicant_id;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  // Get user's area/branch info (updated for new backend structure)
  static async getUserBranchInfo() {
    try {
      const userData = await this.getUserData();
      if (userData && userData.stalls && userData.stalls.areas_applied && userData.stalls.areas_applied.length > 0) {
        // Get the area from the first application area
        const firstArea = userData.stalls.areas_applied[0];
        return {
          area: firstArea.area,
          branch_id: firstArea.branch_id,
          branch_name: firstArea.branch_name,
          location: firstArea.location
        };
      } else if (userData && userData.user) {
        // Fallback: try to get area from user data if available
        return {
          area: userData.user.area || null,
          branch_id: null,
          branch_name: null,
          location: null
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user branch info:', error);
      return null;
    }
  }

  // Get current user info (updated for new backend structure)
  static async getCurrentUser() {
    try {
      const userData = await this.getUserData();
      return userData ? userData.user : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get available stalls (updated for new backend structure)
  static async getAvailableStalls() {
    try {
      const userData = await this.getUserData();
      return userData && userData.stalls ? userData.stalls.available_stalls : [];
    } catch (error) {
      console.error('Error getting available stalls:', error);
      return [];
    }
  }

  // Check if user can apply for more stalls (updated for new backend structure)
  static async canApplyMore() {
    try {
      const userData = await this.getUserData();
      return userData && userData.ui_state ? userData.ui_state.can_apply_more : false;
    } catch (error) {
      console.error('Error checking if can apply more:', error);
      return false;
    }
  }
}

export default UserStorageService;