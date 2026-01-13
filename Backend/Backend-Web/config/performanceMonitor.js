// Database Performance Monitor
// Tracks connection pool status and query performance

let queryCount = 0;
let slowQueries = [];
const SLOW_QUERY_THRESHOLD = 5000; // 5 seconds

export function trackQuery(queryName, startTime) {
  const duration = Date.now() - startTime;
  queryCount++;

  if (duration > SLOW_QUERY_THRESHOLD) {
    slowQueries.push({
      name: queryName,
      duration,
      timestamp: new Date().toISOString()
    });

    // Keep only last 50 slow queries
    if (slowQueries.length > 50) {
      slowQueries.shift();
    }

    console.warn(`⚠️ Slow query detected: ${queryName} took ${duration}ms`);
  }

  return duration;
}

export function getPerformanceStats() {
  return {
    totalQueries: queryCount,
    slowQueries: slowQueries.length,
    recentSlowQueries: slowQueries.slice(-10)
  };
}

export function resetStats() {
  queryCount = 0;
  slowQueries = [];
}
