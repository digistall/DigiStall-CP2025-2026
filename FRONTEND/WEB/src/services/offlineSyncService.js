/**
 * Offline Sync Service
 * Manages queue of write requests (POST, PUT, DELETE) when offline
 */

import { eventBus, EVENTS } from '@/eventBus';

const QUEUE_KEY = 'offline_mutation_queue';

class OfflineSyncService {
  constructor() {
    this.isSyncing = false;
  }

  /**
   * Add a failed request to the offline queue
   */
  addRequestToQueue(config) {
    const queue = this.getQueue();
    
    // We only care about data we need to send
    const requestItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      url: config.url,
      method: config.method,
      data: config.data,
      timestamp: Date.now()
    };
    
    queue.push(requestItem);
    this.saveQueue(queue);
    console.log(`📡 Saved offline mutation to queue: ${config.method.toUpperCase()} ${config.url}`);
    
    // Emit notification
    eventBus.emit(EVENTS.NOTIFICATION, {
      message: 'You are offline. Changes saved locally and will sync when connection is restored.',
      type: 'warning'
    });
    
    return requestItem;
  }

  /**
   * Retrieve the current queue
   */
  getQueue() {
    try {
      const queueJSON = localStorage.getItem(QUEUE_KEY);
      return queueJSON ? JSON.parse(queueJSON) : [];
    } catch (e) {
      console.error('Error parsing offline queue:', e);
      return [];
    }
  }

  /**
   * Save queue back to localStorage
   */
  saveQueue(queue) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Clear the entire queue
   */
  clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
  }

  /**
   * Remove a specific item from the queue
   */
  removeFromQueue(id) {
    const queue = this.getQueue();
    const updatedQueue = queue.filter(item => item.id !== id);
    this.saveQueue(updatedQueue);
  }

  /**
   * Check if there are any pending requests locally
   */
  hasPendingRequests() {
    return this.getQueue().length > 0;
  }

  /**
   * Process all items in the queue when online
   * Requires apiClient to actually send the requests, we pass it dynamically to avoid circular dependencies
   */
  async processQueue(apiClient) {
    if (this.isSyncing) return;
    
    const queue = this.getQueue();
    if (queue.length === 0) return;
    
    this.isSyncing = true;
    console.log(`🔄 Starting background sync of ${queue.length} pending items...`);
    
    eventBus.emit(EVENTS.NOTIFICATION, {
      message: `Syncing ${queue.length} offline changes...`,
      type: 'info'
    });

    let successCount = 0;
    let failCount = 0;
    
    // Process sequentially to maintain order and data integrity
    for (const item of queue) {
      try {
        console.log(`🔄 Syncing request: ${item.method.toUpperCase()} ${item.url}`);
        
        let axiosConfig = {
          url: item.url,
          method: item.method,
          // If data was a string, parse it. Axios interceptors usually give stringified JSON for data.
          data: typeof item.data === 'string' ? JSON.parse(item.data) : item.data,
          _isOfflineRetry: true // Flag to prevent infinite loops if we go offline during sync
        };
        
        await apiClient(axiosConfig);
        
        // Remove on success
        this.removeFromQueue(item.id);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to sync item ${item.id}:`, error);
        
        // If error is 401 or 403, it's auth related, keep in queue or handle auth.
        // If it's 400 or 500, it's a server/client error, perhaps remove from queue to unblock? 
        // For now we'll keep it in the queue for safety, or you could implement a retry counter.
        failCount++;
      }
    }
    
    this.isSyncing = false;
    
    const remaining = this.getQueue().length;
    
    if (successCount > 0) {
      eventBus.emit(EVENTS.NOTIFICATION, {
        message: `Successfully synced ${successCount} changes.`,
        type: 'success'
      });
      // Important: refresh data to ensure UI matches server state
      eventBus.emit(EVENTS.DATA_REFRESH);
    }
    
    if (failCount > 0) {
      eventBus.emit(EVENTS.NOTIFICATION, {
        message: `Failed to sync ${failCount} changes. Will try again later.`,
        type: 'error'
      });
    }
    
    console.log(`🔄 Sync complete. ${successCount} successful, ${failCount} failed. ${remaining} items remaining in queue.`);
  }
}

const offlineSyncService = new OfflineSyncService();

if (typeof window !== 'undefined') {
  window.offlineSyncService = offlineSyncService;
}

export default offlineSyncService;
