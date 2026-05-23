import dataCacheService from '@/services/dataCacheService';
import { eventBus, EVENTS } from '@/eventBus';
import offlineSyncService from '@/services/offlineSyncService';

// Save original fetch
const originalFetch = window.fetch;

// Override global fetch to transparently handle offline caching and server down states
window.fetch = async function(...args) {
  const [resource, config] = args;
  
  const urlString = typeof resource === 'string' ? resource : resource?.url;
  
  // Only intercept API calls
  if (!urlString || (!urlString.includes('/api/') && !urlString.includes('/api?'))) {
    return originalFetch.apply(this, args);
  }

  const method = (config?.method || (typeof resource === 'object' ? resource.method : 'get') || 'get').toLowerCase();
  
  try {
    const response = await originalFetch.apply(this, args);
    
    // Server down/error detection (500+)
    if (response.status >= 500) {
      console.error('🔥 Server Error detected via fetch:', response.status);
      eventBus.emit(EVENTS.NOTIFICATION, {
        message: 'Server is down or under maintenance. Please wait until maintenance is finished and the system is ready to use again.',
        type: 'error'
      });
    }
    
    // Cache successful GET responses
    if (method === 'get' && response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // Clone response to read json without consuming the original
        const clone = response.clone();
        clone.json().then(data => {
          if (data && data.success !== false) {
            const cacheKey = dataCacheService.generateKey(urlString, config?.params || {});
            dataCacheService.set(cacheKey, data);
          }
        }).catch(e => console.warn('Could not cache fetch response:', e));
      }
    }
    
    return response;
    
  } catch (error) {
    // Determine if it's a network error (Fetch throws TypeError on network failure)
    const isNetworkError = error.name === 'TypeError' && 
      (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('fetch'));
    
    if (isNetworkError) {
      if (!navigator.onLine) {
        // We are offline 
        if (method === 'get') {
          const cacheKey = dataCacheService.generateKey(urlString, config?.params || {});
          
          let cachedData = null;
          // Access cache directly to bypass expiration when offline
          if (dataCacheService.cache.has(cacheKey)) {
             cachedData = dataCacheService.cache.get(cacheKey).data;
          }

          if (cachedData) {
            console.log(`📡 [OFFLINE] Serving cached data globally via fetch for: ${urlString}`);
            
            return new Response(JSON.stringify(cachedData), {
              status: 200,
              statusText: 'OK (Cached)',
              headers: new Headers({ 'Content-Type': 'application/json' })
            });
          }
        } else if (['post', 'put', 'patch', 'delete'].includes(method)) {
          // Mutational payload - queue for background sync
          let requestData = null;
          if (config?.body) {
            try {
              requestData = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
            } catch(e) {
              requestData = config.body;
            }
          }
          
          offlineSyncService.addRequestToQueue({
            url: urlString,
            method,
            data: requestData
          });
          
          // Return simulated success
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Saved offline. Will sync automatically when connection is restored.' 
          }), {
            status: 200,
            statusText: 'OK',
            headers: new Headers({ 'Content-Type': 'application/json' })
          });
        }
        
        // If we reach here, we are offline but method is GET and We DON'T have a cache
        console.warn(`🔥 Offline but no cache found for: ${urlString}. Returning 503.`);
        eventBus.emit(EVENTS.NOTIFICATION, {
          message: 'You are offline and no saved data is available for this feature.',
          type: 'warning'
        });
        
        return new Response(JSON.stringify({ success: false, message: 'Offline without cache data' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'application/json' })
        });
      } else {
        // navigator.onLine is TRUE, but "Failed to fetch" -> Server is COMPLETELY DOWN
        console.error('🔥 Server Down detected via fetch:', error.message);
        eventBus.emit(EVENTS.NOTIFICATION, {
          message: 'Server is down or under maintenance. Please wait until maintenance is finished and the system is ready to use again.',
          type: 'error'
        });
        
        // Return a gracefully mocked 503 response to avoid breaking caller promise chains immediately
        return new Response(JSON.stringify({ success: false, message: 'Server is down or under maintenance' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'application/json' })
        });
      }
    }
    
    // Determine if it's an explicit 5xx level server code error thrown conventionally
    if (error.status >= 500) {
      console.error('🔥 Server Error detected via fetch catch:', error.status);
      eventBus.emit(EVENTS.NOTIFICATION, {
        message: 'Server is down or under maintenance. Please wait until maintenance is finished and the system is ready to use again.',
        type: 'error'
      });
      return new Response(JSON.stringify({ success: false, message: 'Server is down or under maintenance' }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'application/json' })
      });
    }
    
    // Re-throw if not explicitly handled
    throw error;
  }
};
