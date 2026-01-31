import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@digistall_favorites';

/**
 * FavoritesService - Manages user's favorite stalls using AsyncStorage
 * Favorites are stored locally on the device and persist across sessions
 */
class FavoritesService {
  /**
   * Get all favorite stall IDs for a user
   * @param {number|string} userId - The user/applicant ID
   * @returns {Promise<number[]>} Array of favorite stall IDs
   */
  static async getFavorites(userId) {
    try {
      const key = `${FAVORITES_KEY}_${userId}`;
      const favorites = await AsyncStorage.getItem(key);
      
      if (favorites) {
        const parsed = JSON.parse(favorites);
        console.log(`❤️ Loaded ${parsed.length} favorites for user ${userId}`);
        return parsed;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error getting favorites:', error);
      return [];
    }
  }

  /**
   * Check if a stall is in favorites
   * @param {number|string} userId - The user/applicant ID
   * @param {number|string} stallId - The stall ID to check
   * @returns {Promise<boolean>} True if stall is a favorite
   */
  static async isFavorite(userId, stallId) {
    try {
      const favorites = await this.getFavorites(userId);
      return favorites.includes(Number(stallId));
    } catch (error) {
      console.error('❌ Error checking favorite:', error);
      return false;
    }
  }

  /**
   * Add a stall to favorites
   * @param {number|string} userId - The user/applicant ID
   * @param {number|string} stallId - The stall ID to add
   * @returns {Promise<boolean>} True if successfully added
   */
  static async addFavorite(userId, stallId) {
    try {
      const key = `${FAVORITES_KEY}_${userId}`;
      const favorites = await this.getFavorites(userId);
      const stallIdNum = Number(stallId);
      
      // Don't add if already exists
      if (favorites.includes(stallIdNum)) {
        console.log(`⚠️ Stall ${stallId} is already a favorite`);
        return true;
      }
      
      // Add to beginning (most recent favorites first)
      const updatedFavorites = [stallIdNum, ...favorites];
      await AsyncStorage.setItem(key, JSON.stringify(updatedFavorites));
      
      console.log(`❤️ Added stall ${stallId} to favorites`);
      return true;
    } catch (error) {
      console.error('❌ Error adding favorite:', error);
      return false;
    }
  }

  /**
   * Remove a stall from favorites
   * @param {number|string} userId - The user/applicant ID
   * @param {number|string} stallId - The stall ID to remove
   * @returns {Promise<boolean>} True if successfully removed
   */
  static async removeFavorite(userId, stallId) {
    try {
      const key = `${FAVORITES_KEY}_${userId}`;
      const favorites = await this.getFavorites(userId);
      const stallIdNum = Number(stallId);
      
      const updatedFavorites = favorites.filter(id => id !== stallIdNum);
      await AsyncStorage.setItem(key, JSON.stringify(updatedFavorites));
      
      console.log(`💔 Removed stall ${stallId} from favorites`);
      return true;
    } catch (error) {
      console.error('❌ Error removing favorite:', error);
      return false;
    }
  }

  /**
   * Toggle favorite status of a stall
   * @param {number|string} userId - The user/applicant ID
   * @param {number|string} stallId - The stall ID to toggle
   * @returns {Promise<boolean>} New favorite status (true = is now favorite)
   */
  static async toggleFavorite(userId, stallId) {
    try {
      const isFav = await this.isFavorite(userId, stallId);
      
      if (isFav) {
        await this.removeFavorite(userId, stallId);
        return false;
      } else {
        await this.addFavorite(userId, stallId);
        return true;
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      return false;
    }
  }

  /**
   * Clear all favorites for a user
   * @param {number|string} userId - The user/applicant ID
   * @returns {Promise<boolean>} True if successfully cleared
   */
  static async clearFavorites(userId) {
    try {
      const key = `${FAVORITES_KEY}_${userId}`;
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Cleared all favorites for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error clearing favorites:', error);
      return false;
    }
  }

  /**
   * Sort stalls array with favorites first
   * @param {Array} stalls - Array of stall objects
   * @param {number[]} favoriteIds - Array of favorite stall IDs
   * @returns {Array} Sorted stalls array with favorites first
   */
  static sortWithFavoritesFirst(stalls, favoriteIds) {
    if (!favoriteIds || favoriteIds.length === 0) {
      return stalls;
    }
    
    return [...stalls].sort((a, b) => {
      const aIsFav = favoriteIds.includes(Number(a.id));
      const bIsFav = favoriteIds.includes(Number(b.id));
      
      if (aIsFav && !bIsFav) return -1;
      if (!aIsFav && bIsFav) return 1;
      return 0;
    });
  }
}

export default FavoritesService;
