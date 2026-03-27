/**
 * Database retry utility with exponential backoff
 * Handles transient connection failures to cloud databases
 */

/**
 * Execute an async operation with retry logic
 * @param {Function} operation - Async function that performs the operation
 * @param {Object} options - Retry configuration options
 * @returns {Promise} - Result of the operation
 */
export async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,       // 1 second initial delay
    maxDelay = 10000,       // Max 10 seconds between retries
    retryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'PROTOCOL_CONNECTION_LOST',
      'ER_CON_COUNT_ERROR',
      'ENOTFOUND'
    ]
  } = options

  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Check if error is retryable
      const isRetryable = retryableErrors.some(code =>
        error.code === code ||
        error.message?.includes(code)
      )

      if (!isRetryable || attempt === maxRetries) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)

      console.log(`⚠️ DB operation failed (attempt ${attempt}/${maxRetries}): ${error.code || error.message}`)
      console.log(`⏳ Retrying in ${delay}ms...`)

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Execute a database query with automatic retry and connection management
 * @param {Pool} pool - MySQL connection pool
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @param {Object} options - Retry options
 * @returns {Promise} - Query results
 */
export async function executeWithRetry(pool, query, params = [], options = {}) {
  return withRetry(async () => {
    const connection = await pool.getConnection()
    try {
      const [results] = await connection.execute(query, params)
      return results
    } finally {
      connection.release()
    }
  }, options)
}

/**
 * Check if an error is a timeout error
 * @param {Error} error - The error to check
 * @returns {boolean} - True if it's a timeout error
 */
export function isTimeoutError(error) {
  return error.code === 'ETIMEDOUT' ||
         error.message?.includes('ETIMEDOUT') ||
         error.code === 'PROTOCOL_CONNECTION_LOST'
}

export default { withRetry, executeWithRetry, isTimeoutError }
