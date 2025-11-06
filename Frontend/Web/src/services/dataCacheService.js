/**
 * Data Caching Service
 * Provides caching mechanisms to avoid redundant API calls and improve performance
 */

class DataCacheService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes default
    this.cacheTimers = new Map();
  }

  /**
   * Generate cache key
   */
  generateKey(endpoint, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}${paramString ? '?' + paramString : ''}`;
  }

  /**
   * Set cache data with expiration
   */
  set(key, data, timeout = this.cacheTimeout) {
    // Clear existing timer if exists
    if (this.cacheTimers.has(key)) {
      clearTimeout(this.cacheTimers.get(key));
    }

    // Store data with timestamp
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      timeout
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, timeout);

    this.cacheTimers.set(key, timer);
    
    console.log(`📦 Cached data for: ${key} (expires in ${timeout/1000}s)`);
  }

  /**
   * Get cached data
   */
  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    const isValid = (Date.now() - cached.timestamp) < cached.timeout;
    
    if (!isValid) {
      this.delete(key);
      return null;
    }

    console.log(`📦 Cache hit for: ${key}`);
    return cached.data;
  }

  /**
   * Delete cached data
   */
  delete(key) {
    if (this.cacheTimers.has(key)) {
      clearTimeout(this.cacheTimers.get(key));
      this.cacheTimers.delete(key);
    }
    
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`📦 Cache cleared for: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear() {
    // Clear all timers
    for (const timer of this.cacheTimers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.cacheTimers.clear();
    console.log('📦 All cache cleared');
  }

  /**
   * Check if data is cached
   */
  has(key) {
    return this.cache.has(key) && this.get(key) !== null;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      totalItems: this.cache.size,
      items: Array.from(this.cache.keys()).map(key => {
        const cached = this.cache.get(key);
        return {
          key,
          age: Date.now() - cached.timestamp,
          remaining: cached.timeout - (Date.now() - cached.timestamp)
        };
      })
    };
  }

  /**
   * Cached fetch function
   */
  async cachedFetch(url, options = {}, cacheTimeout = this.cacheTimeout) {
    const cacheKey = this.generateKey(url, options.params || {});
    
    // Check cache first
    const cachedData = this.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch data if not cached
    console.log(`🌐 Fetching fresh data for: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`❌ Expected JSON but got: ${contentType}`, text.substring(0, 100));
        throw new Error(`Server returned ${contentType} instead of JSON. This usually indicates a routing or CORS issue.`);
      }

      const data = await response.json();
      
      // Cache successful responses only
      if (data.success !== false) {
        this.set(cacheKey, data, cacheTimeout);
      }
      
      return data;
    } catch (error) {
      console.error(`❌ Fetch error for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache for specific patterns
   */
  invalidatePattern(pattern) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    console.log(`📦 Invalidated ${keysToDelete.length} cache entries matching: ${pattern}`);
  }
}

// Create singleton instance
const dataCacheService = new DataCacheService();

// Export default instance and class
export { dataCacheService as default, DataCacheService };

// Global cache methods for convenience
export const {
  cachedFetch,
  invalidatePattern,
  clear: clearCache,
  getStats: getCacheStats
} = dataCacheService;